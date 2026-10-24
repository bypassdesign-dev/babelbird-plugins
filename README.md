# 项目云端同步巴别鸟插件 0.4.1

[English](README.en.md) · [上线材料](marketplace/README.md) · [更新记录](CHANGELOG.md)

配置插件后可以把codex/workbuddy的本地项目/工程文件自动同步到巴别鸟，切换设备或智能体产品后也能同步回来。

英文名称：**BabelBird Project Cloud Sync**。本版继续作为测试版发布，已验证范围与未完成项目见 [验证记录](VALIDATION.md)。

将工程按原文件和目录结构保存到巴别鸟，并在智能体任务开始前拉取更新、每批修改完成后自动上传。工程不打包成 ZIP。支持 Codex / Claude Code 插件适配及 WorkBuddy 专用连接器包；每位用户使用自己的 API Key，包内不含真实密钥。

## Codex：安装后只填一个 API Key

把这一句交给 Codex：

> 帮我安装 https://github.com/bypassdesign-dev/babelbird-plugins/tree/v0.4.1

智能体安装后会自动打开“连接巴别鸟”本地页面。**粘贴 API Key → 点击“保存并连接”**，即可自动检查连接和保存配置，不需要找 MCP 菜单或填写请求头。页面上也有“打开巴别鸟获取”按钮。

如果浏览器没有自动打开，点击智能体提供的“填写 API Key”链接。也可以说“打开巴别鸟密钥填写页面”。首次保存后，如果 Codex 尚未加载新连接，只需按提示重启一次；密钥不需要重复填写。

本地页需要 Node.js 20+、支持插件及配置 API 的 Codex 和同一台电脑上的浏览器。远程／无浏览器环境使用 [备用方法](plugins/babelbird-cloud/skills/babelbird-project-cloud/references/credential-entry.md)。本版页面自动配置仅适用于 Codex；WorkBuddy 保留自定义连接器方式。

**给安装智能体：**先读 [INSTALL.md](INSTALL.md)，安装后立即执行包内 `babelbird-setup` Skill 启动本地页面，等待其连接结果。不要只下载后结束，也不要把教程或手工 MCP 字段作为默认下一步。网页摘要可能滞后，核对实际仓库 ref 和安装版本；推荐上面的固定版本链接。

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

普通用户直接把上面的链接交给智能体。以下命令供安装智能体执行：

```bash
codex plugin marketplace add bypassdesign-dev/babelbird-plugins --ref v0.4.1
codex plugin add babelbird-cloud@babelbird-local
```

安装后在包内 `skills/babelbird-setup` 目录执行 `node scripts/setup-codex.mjs --start`，自动打开单项密钥页面。用 `--wait` 等待结果，或用 `--status` 查看状态。完整流程见 [首次设置 Skill](plugins/babelbird-cloud/skills/babelbird-setup/SKILL.md)。

页面只在本机临时运行，成功或超时后退出。通过个人文件读取检查后，助手调用 Codex 配置接口保存用户私有连接，保留其他设置和账号，不把密钥放进工程。已有有效连接直接复用。安装本身不上传工程。

插件声明 onboardingSkill，支持的客户端可提供首次设置入口；从 GitHub 链接安装时由安装智能体启动页面，不依赖安装界面自动执行钩子。不支持此流程的客户端不能声称安装已连接。

## WorkBuddy 安装与接入

WorkBuddy 官方支持 [MCP + Skill 连接器及 API Key 表单](https://open.workbuddy.cn/docs/connector)。专用源码在 [workbuddy/babelbird-cloud](workbuddy/babelbird-cloud/README.md)，包含 connector-meta.json、mcp.json、token-schema.json、图标和两项 Skill，最低客户端版本声明为 4.24.0。

连接器表单配置将 API Key 设为必填密码项，并提供官方获取教程链接。此包已提供，尚未提交 WorkBuddy 市场审核；GitHub 上的 Codex 安装命令不能直接用于 WorkBuddy。

**当前从 GitHub 安装请使用自定义连接器入口，不必寻找尚未上架的 Token 表单。**智能体应先帮你安装 Skill，再列出该入口的地址、类型和 Authorization 填写方法，等你保存后继续连接检查。

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

工程自身的配置文件（例如 .mcp.json）可以保存到你指定的云端工程，仍遵循 Git 忽略规则。插件登录密钥留在宿主私有配置中。Git 子目录绑定也会读取父仓库的忽略规则。

macOS/Linux 下载更新已有文件时保留原权限，脚本原来是 755 就仍是 755，私密配置原来是 600 就仍是 600。新设备首次下载时，没有权限记录的文件使用本机默认权限；已确认可执行的文件可单独恢复为 755，不对整个项目统一加执行权限。

中英文名称、简介、市场文案及 WorkBuddy 密钥表单已提供。Codex 本地密钥页当前为中文；可让智能体用自己的语言逐步引导。平台如何展示翻译取决于宿主，详见 [国际化说明](marketplace/listing.md)。

## 验证与限制

本版 31 项可执行测试通过，并完成真实公有云上传、下载 SHA-256 回读和 755/700/600/644 权限保留实测。此前已完成跨本地工程往返同步、冲突保留，以及 Codex 本地页真实密钥填写和重启后的 MCP 验证；具体版本与范围见 [VALIDATION.md](VALIDATION.md)。历史长批量直接 MCP 调用曾出现 403，原因未确定，本版以测试版发布，遇此错误保留进度并报告待同步项。

逐文件更新不是全工程原子提交；服务端尚未提供原子条件写入或跨设备锁，同一文件应在一端同步完成后再换端继续。自动触发由智能体和宿主项目规则执行；未加载规则、离线或未提供 Node.js 运行时时无法自动同步。WorkBuddy 的安装与表单未做 UI 实测。

## 维护与分发

仓库：[bypassdesign-dev/babelbird-plugins](https://github.com/bypassdesign-dev/babelbird-plugins)。Releases 提供版本记录和源码；Codex 通过上面的仓库链接安装，无需手动下载压缩包。WorkBuddy 专用连接器源码保留在 `workbuddy/`。工程内容以原文件存储。

修改共享工程同步 Skill 后同步 WorkBuddy 对应正文、引用文件和脚本；首次设置按宿主分别维护，Codex 本地页面不混入 WorkBuddy 包；WorkBuddy 的 frontmatter 包含其专用中英文描述等字段。分发仅纳入正式文件，排除 .www.babel.cc、缓存和凭据。

验证命令：`node --test tests/*.test.mjs`。格式依据：[Codex 插件](https://developers.openai.com/plugins/build/plugins)、[Claude Code 插件](https://code.claude.com/docs/en/plugins-reference)、[WorkBuddy 连接器](https://open.workbuddy.cn/docs/connector)。
