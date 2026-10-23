# MCP 接口与上传条件

以下参数已与 2026-10-22 公有云新连接的 `tools/list` 返回核对，服务端标识为 `FileDataServer 4.0.3`，协商协议为 `2025-03-26`。它们用于理解接口，实际调用以当前连接的工具 schema 为准。宿主可能增加工具名称前缀。工具列举成功不代表业务调用已验证。

| 工具 | 已观察到的参数 |
| --- | --- |
| `getUsageAndQuota` | 无 |
| `getFileInfoByPath` | `namePath: string` |
| `listFolder` | `fileId: string, pageIndex: number, pageSize: number` |
| `searchFileNameByKey` | `keyword: string, pageIndex: number, pageSize: number` |
| `createFolder` | `folderId: string, name: string` |
| `getUploadUrl` | `fileName: string, fileHash: string, fileSize: number, folderId?: string, fileId?: string` |
| `getDownloadUrl` | `fileId: string` |
| `getFileContent` | `fileId: string` |

本次观察到的 `listFolder` 和搜索工具说明规定页号从 0 开始；其他部署仍以当前工具说明为准。读取分页返回的总量、下一页或结束标志；如果没有结束标志，持续分页至空页，检测重复页并在异常时报告未读全，不能把默认首页当作全部文件。

文档有时写作 `ListFolder`；本次工具面实际为 `listFolder`。不能按文档大小写推造工具名。

本次工具面未暴露 `babel_set_workspace`、`babel_get_workspace`、`babel_write_file` 等工具。它们可能出现在设计资料或其他部署，只有实际发现才能调用。没有工作目录工具时，客户端显式传入已核实的目录 ID，权限仍由服务端执行。

## 个人文件与目标目录

2026-10-23 的只读测试中，`getFileInfoByPath({namePath: "/个人文件"})` 返回成功，目录 `fileInfo.namePath` 为 `/个人文件`、`fileInfo.fileId` 为 `2`、`type` 为目录类型 `2`。此 ID 仅是本次返回，不作为跨账号默认值；实际调用应重新解析目录。协议根目录 `0` 与个人文件不是同一对象。

个人文件下的 `codex`、`workbuddy` 和工程子目录均通过路径查询或父目录列表核对。只有明确不存在且父目录已验证时才创建；权限或连接错误不能当成不存在。上传每个文件时传其真实父目录 ID，逐层保留相对结构。

## 上传必须满足的条件

`getUploadUrl` 的既有说明要求：

- 新文件提供 `folderId`；`fileId` 缺省或 `"0"` 表示新文件。
- 更新文件提供已核实的 `fileId`。
- 实际上传时继续传递 `fileName`、`fileHash` 及对应的 `folderId` 或 `fileId`。
- `fileSize` 使用实际上传字节数，不是字符串字符数。
- 当前工具说明明确 `fileHash` 为文件 MD5；它与恢复清单使用的 SHA-256 不同。

## 公有云已验证的实际传输

2026-10-23 的真实测试中，MCP 返回 `url`、`upload_token` 和字段提示，与官方预上传后的传输方式对应。使用 multipart/form-data POST，包含二进制 `file`、字符串 `upload_token`、`fileName`、文件 MD5 `fileHash`，以及新增的 `folderId` 或更新的 `fileId`。由 HTTP 客户端生成 boundary。

上传响应包含 `success: true, code: 0, fileId`；更新返回同一文件 ID，版本递增。新增和更新都已下载回读并比较 SHA-256。实际执行使用 [同步脚本](../scripts/project-sync.mjs)，参数说明见 [同步流程](sync.md)。

服务端返回的 `document.babel.cc` 的 `/api/file/uploadFileCTPdf.do` 与 `/api/file/uploadFile.do` 两种 HTTP 上传地址均已实测支持同主机同路径 HTTPS；脚本仅对此两个确切入口升级为 HTTPS，其他 HTTP 地址拒绝。传输请求不附加 MCP API Key，不自动跟随跨域重定向。不能将此公有云约定套用到响应不同的私有化部署。

仅传本地路径或取得 URL 不等于上传。检查 HTTP 与业务状态，核对目标目录、原文件名、大小和文件 ID；回读哈希一致才记录内容验证通过。超时或断连先查询目标状态，结果未知时不盲目重传。临时 URL 与上传凭据不得写入工程或公开日志。

## 与传统 API 的区别

巴别鸟传统 `GET /api/file/preUploadFile.do` 文档描述了另一种流程：取得 `url` 和 `upload_token`，以 multipart POST 发送 `file` 与 `upload_token`。

本次 MCP 的实际响应和上传回读测试确认了其公有云上传阶段的对应关系；这不代表 API Key 可直接替代传统 API 的 access_token。插件继续通过 MCP 获取上传凭据，不切换账号认证流程。

- [巴别鸟 MCP](https://www.babel.cc/public/babelwiki/zh/mcp-integration.html)
- [传统预上传接口](https://www.babel.cc/public/babelwiki/zh/api-get-api-file-preuploadfile-do.html)
