# 巴别鸟工程云存储插件 0.3.0

将工程按原文件和目录结构保存到巴别鸟，并在智能体任务开始前拉取更新、每批修改完成后自动上传。工程不打包成 ZIP。支持 Codex / Claude Code 插件适配及 WorkBuddy 专用连接器包；每位用户使用自己的 API Key，包内不含真实密钥。

## 默认目录与跨设备继续

- Codex 新工程：`个人文件/codex/工程名/`。
- WorkBuddy 新工程：`个人文件/workbuddy/工程名/`。
- 文件保留原名及相对目录，不给源码文件加前缀。目录缺失时在首次保存中逐级创建。
- 已绑定或用户明确指定的云端工程目录优先。WorkBuddy 可以继续同步 Codex 创建的同一工程，不再复制到 workbuddy 分区。
- 换设备时可指定既有云端工程并下载到新本地目录，建立新的本地共同基线后继续同步。

这是任务期间的自动同步。绑定会写入本地目标引用、基线和项目规则；宿主加载规则后，在后续任务开始前、每批修改后和结束前调用 Skill。插件不会在智能体关闭后常驻监控，也不会把远端目录挂载为本地磁盘。第一次启用需要确定工程并建立绑定；仅填写 API Key 代表连接已配置。

## 获取 API Key

参照 [巴别鸟官方图文教程](https://www.babel.cc/public/babelwiki/zh/mcp-integration.html)；包内也有 [获取步骤](plugins/babelbird-cloud/skills/babelbird-project-cloud/references/api-key.md)。

在“设置 > API秘钥”创建应用，选择访问范围，复制 APP 详情上方的 APIKey，并按读写用途配置文件权限。APP Key / APP Secret 不能替代 APIKey。默认保存目录必须在授权范围内，应用程序文件夹权限不会自动覆盖整个个人文件。

首次使用要求填写个人 API Key；已有凭据复用。公有云 MCP 地址固定为 `https://www.babel.cc/mcp`。配额查询默认跳过，连接通过目录读取验证。

## Codex 安装

```bash
codex plugin marketplace add bypassdesign-dev/babelbird-plugins --ref v0.3.0
codex plugin add babelbird-cloud@babelbird-local
```

也可解压完整插件分发包，在包含本 README 和 .agents 的目录执行 `codex plugin marketplace add .`，再添加插件。保留本地市场目录。需要支持 `codex plugin` 的客户端。

Codex 使用 `BABELBIRD_API_KEY` 环境变量引用。macOS / Linux 的 Bash 中可私密输入并启动：

```bash
read -r -s -p '巴别鸟 API Key: ' BABELBIRD_API_KEY
export BABELBIRD_API_KEY
codex
```

Windows PowerShell：

```powershell
$babelSecret = Read-Host '巴别鸟 API Key' -AsSecureString
$env:BABELBIRD_API_KEY = [System.Net.NetworkCredential]::new('', $babelSecret).Password
Remove-Variable babelSecret
codex
```

临时变量不等于永久保存，已运行的桌面客户端不会继承后来设置的变量。长期使用请通过自己的凭据管理器向实际客户端启动环境注入；已有独立 MCP 凭据不会自动迁移到插件。清单声明了自动设置 Skill，但本次 Codex 返回 onboardingSkill 为 null，请显式发送：

> 使用 $babelbird-cloud:babelbird-setup 配置巴别鸟，并为当前工程启用任务开始前、每批修改后自动同步。

## WorkBuddy 安装与接入

WorkBuddy 官方支持 [MCP + Skill 连接器及 API Key 表单](https://open.workbuddy.cn/docs/connector)。专用源码在 [workbuddy/babelbird-cloud](workbuddy/babelbird-cloud/README.md)，包含 connector-meta.json、mcp.json、token-schema.json、图标和两项 Skill，最低客户端版本声明为 4.24.0。

连接器表单配置将 API Key 设为必填密码项，并提供官方获取教程链接。此包已提供，尚未提交 WorkBuddy 市场审核；GitHub 上的 Codex 安装命令不能直接用于 WorkBuddy。

当前可按 [WorkBuddy 接入说明](workbuddy/babelbird-cloud/README.md) 添加自定义 MCP，并将两项 Skill 安装到工程的 `.codebuddy/skills/`。完整连接器包用于 WorkBuddy 开放平台导入／审核，不声称普通客户端支持直接安装此 ZIP。WorkBuddy 同步脚本需要可用的 Node.js 20+，与 Codex 使用相同的任务同步逻辑。

## Claude Code 安装

```text
/plugin marketplace add bypassdesign-dev/babelbird-plugins
/plugin install babelbird-cloud@babelbird-local
```

需要支持插件 userConfig 的版本。通过必填敏感项 api_key 填写密钥。此宿主没有预设默认分区，首次绑定时提供云端工程目录；之后复用绑定。未在该客户端实机验证安装。

## 使用

- “为当前工程启用巴别鸟自动同步。”
- “将这个工程绑定到个人文件/codex/网站改版，先拉取更新，再继续修改。”
- “从个人文件/workbuddy/市场资料下载到新的本地目录，后续保持任务前后同步。”
- “检查工程同步状态，列出待上传、待下载和冲突文件。”

绑定使用本地 `.babelbird-sync.json`，状态使用 `.babelbird-sync-state.json`；两者不上传且不包含密钥。设 autoSync 为 false 可暂停自动传输。绑定会保留并追加 AGENTS.md，WorkBuddy 另有项目规则文件。Node.js 脚本通过标准输入接收一次性传输凭据，不接收 API Key。

本地单侧修改上传，云端单侧修改下载；同时修改或没有共同基线的不同内容会保留双方并报告冲突。删除不自动传播。断网保留本地修改，恢复后重新比较；部分失败不声称整体成功。默认排除密钥、缓存、依赖和符号链接。

## 验证与限制

公有云已完成新增、更新、下载 SHA-256 回读，以及两份本地工程之间的跨宿主往返同步和冲突保留。10 项可执行测试通过，具体记录见 [VALIDATION.md](VALIDATION.md)。长批量直接 MCP 调用仍观察到 403，原因未确定，本版以测试版发布，遇此错误保留进度并报告待同步项。

逐文件更新不是全工程原子提交；服务端尚未提供原子条件写入或跨设备锁，同一文件应在一端同步完成后再换端继续。自动触发由智能体和宿主项目规则执行；未加载规则、离线或未提供 Node.js 运行时时无法自动同步。WorkBuddy 的安装与表单未做 UI 实测。

## 维护与分发

仓库：[bypassdesign-dev/babelbird-plugins](https://github.com/bypassdesign-dev/babelbird-plugins)。Releases 同时提供 Codex / Claude 插件包和 WorkBuddy 连接器包；压缩包仅用于分发安装，工程内容以原文件存储。

修改共享 Skill 后同步 WorkBuddy 对应正文、引用文件和脚本；WorkBuddy 的 frontmatter 包含其专用中英文描述等字段。分发仅纳入正式文件，排除 .www.babel.cc、缓存和凭据。

验证命令：`node --test tests/project-sync.test.mjs`。格式依据：[Codex 插件](https://developers.openai.com/plugins/build/plugins)、[Claude Code 插件](https://code.claude.com/docs/en/plugins-reference)、[WorkBuddy 连接器](https://open.workbuddy.cn/docs/connector)。
