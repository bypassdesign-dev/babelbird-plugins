# 同步执行流程

## 执行方式

宿主需要 Node.js 20+。通过其现有运行时执行 `node scripts/project-sync.mjs`，JSON 请求从标准输入传入，标准输出返回 JSON。路径相对于本 Skill；不要把脚本复制到用户工程。

MCP 使用当前宿主已认证的工具。脚本不收集或读取 API Key，只处理本地文件及 MCP 返回的一次性传输凭据。含上传 ticket 或签名 URL 的输入不要写入项目、公共日志或聊天正文。协议和结果均已在公有云新增、更新和下载回读中验证。

## 1. 首次绑定

确认本地根目录和云端目标。新工程默认用实际宿主分区；用户指定已有目录或已经绑定时优先复用原目录。通过路径查询和分页列表验证目标，只有明确不存在时才逐级创建。

```json
{"action":"bind","root":"/absolute/local/project","host":"codex","cloud":{"endpoint":"https://www.babel.cc/mcp","folderId":"<服务端返回的工程目录ID>","path":"/个人文件/codex/工程名"}}
```

WorkBuddy 的 host 为 `workbuddy`。脚本创建本地 `.babelbird-sync.json` 并启用 `autoSync`，追加 AGENTS.md 同步规则；WorkBuddy 还创建专用 `.codebuddy/rules/babelbird-sync.md`，保留已有文件。更换设备时，指定同一个云端工程目录，在新本地目录执行绑定并拉取。默认分区仅用于新建工程，不用于跨平台迁移。

已有绑定指向不同目标时脚本拒绝重绑；先报告现有目标和未同步项，取得用户明确切换指示后再处理，不能自动清空状态。

## 2. 每次任务开始、修改后与结束前

1. 读取绑定，`autoSync: false` 时不自动传输。任务开始前做一次同步；每批文件修改完成后上传变更；任务结束前再次完整扫描，避免漏掉外部编辑器或生成工具的改动。
2. 从绑定的工程目录 ID 递归调用 `listFolder`，分页读至结束。当前公有云使用 `fileArr`，文件类型 `1`、目录类型 `2`；读取所有页并检测循环目录。目录读取失败时不得传 `remoteComplete: true`。
3. 将远端普通文件整理为 `path, fileId, version, mtime, size`；对应当前接口 `currentVersion, mtime, fileSize`。没有可靠版本字段时先取得内容 SHA-256，不把缺失版本当作未修改。跳过绑定和基线状态文件、凭据、缓存与链接，报告排除项。
4. 请求脚本生成计划：

```json
{"action":"plan","root":"/absolute/local/project","remoteComplete":true,"remoteFiles":[{"path":"src/app.js","fileId":"123","version":0,"mtime":1792723461,"size":3}]}
```

脚本自动扫描本地、排除凭据／缓存／链接，在 Git 工程根目录和工程子目录中均遵循 Git 的文件忽略结果。计划中的 `upload`、`download`、`inspect`、`record`、`skip`、`conflict` 分别按下节处理。排除项如包含用户明确要求的文件，先处理该差异，不能静默遗漏或擅自上传凭据。

不要并行同步同一个本地绑定。只有已验证完成的文件才能推进基线；失败和冲突保持旧基线，下次继续比较。无需重传未改动文件。

## 3. 执行增量

### upload

按相对路径解析或创建真实父目录。在更新前再次查询目标，确认 fileId、版本、修改时间和大小仍与计划一致；不同则重新生成计划，不覆盖。新建文件也先确认没有同名文件。

使用本地清单中的文件名、MD5、字节数和真实 folderId／fileId 调用 `getUploadUrl`。当前公有云返回 `url` 与 `upload_token`，再调用脚本：

```json
{"action":"upload","root":"/absolute/local/project","path":"src/app.js","expectedSha256":"<计划中的SHA-256>","folderId":"<真实父目录ID>","ticket":{"url":"<返回地址>","upload_token":"<一次性凭据>"}}
```

更新时传 `fileId`。脚本按已验证的 multipart POST 提交 file、upload_token、fileName、fileHash、folderId 或 fileId，不附加 MCP API Key。上传成功后仍须重新读取元数据，并用下载地址回读比较 SHA-256。超时先查询状态，不能盲目重复提交。

### download 与 inspect

调用 `getDownloadUrl`，使用原始文件字节，不使用 `getFileContent` 提取文本：

```json
{"action":"download","root":"/absolute/local/project","path":"src/app.js","url":"<返回地址>","expectedSize":3,"expectedLocalSha256":"<计划中的本地SHA-256>"}
```

本地不存在时不传 expectedLocalSha256；已有文件只有其内容仍与计划一致才替换。首次下载默认选择空本地目录。脚本拒绝越界路径、符号链接及未经计划的覆盖。

macOS/Linux 更新已有文件时保留本地普通权限位，例如 0755、0700、0600、0644；先在临时文件上设置权限，再替换目标。不要将整个项目递归改成 755。首次下载没有本地原权限时，可在用户明确指定或已有可信项目权限记录的情况下传 `"mode":"0755"`；普通新文件按本机 umask 创建。不得仅凭扩展名猜测权限。当前云端协议不保存 POSIX 权限，跨设备首次下载无法自动恢复未知的执行位；Windows 的 ACL 不在此接口中同步。

`inspect` 或上传后的回读验证使用同一 action，加 `inspectOnly: true`，只返回 SHA-256 和大小，不落盘。将得到的 SHA-256 放入对应 remoteFiles 条目的 sha256 后重新计划；相同内容可建立基线，不同内容保持冲突。上传回读时另传 expectedSha256，校验失败不会写基线。

### record、skip 与 conflict

下载后再次读取云端元数据，确认版本未在传输期间变化；上传回读也须核对版本。只有远端内容与本地内容已确认相同，才记录：

```json
{"action":"record","root":"/absolute/local/project","path":"src/app.js","sha256":"<已验证SHA-256>","remote":{"fileId":"123","version":0,"mtime":1792723461,"size":3}}
```

状态保存在本地 `.babelbird-sync-state.json`，绑定文件和状态文件均不上传。skip 不传输。conflict 保留双方并说明原因，由用户选择版本或合并后再同步。远端或本地单侧删除也视为需要决定的冲突；当前 MCP 无删除工具，本版不传播删除或自动完成重命名。

## 能力边界

公有云的部分上传地址使用 HTTP scheme；仅对已实测支持 TLS 的 `document.babel.cc` 上传入口 `/api/file/uploadFileCTPdf.do` 和 `/api/file/uploadFile.do` 改用同主机同路径 HTTPS，其他 HTTP 地址拒绝。脚本不自动跟随传输重定向，也不向存储域名传 MCP 密钥。

当前 MCP 没有原子条件写入或跨设备锁。本版在上传前复核版本并检测已观察到的双端修改，不能承诺多人同时写入时的事务隔离；同一文件应由一个设备完成同步后再在另一设备继续。

逐文件传输不是全工程原子提交。报告成功、待同步与冲突项，只有全部纳入文件均已完成才能报告工程同步成功。脚本每次按单个文件读入内存，大文件需要足够内存；没有运行时或客户端未加载规则时报告自动同步未启用，不能假称后台持续运行。
