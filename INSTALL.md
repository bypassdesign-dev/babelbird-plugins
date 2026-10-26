# GitHub 安装与首次连接（0.5.1）

收到本仓库链接和“帮我安装”时执行完整流程。用户只询问信息、只下载、离线安装或稍后配置时尊重其范围。

## Today / Meta Muse 实验适配

若当前产品是 Today 或 Meta Muse 个人智能体，先读 [平台原生安装引导](plugins/babelbird-cloud/skills/babelbird-setup/references/personal-agents.md)。本版包含 `muse` / `today` 的实验安装与工程绑定；**不等于完整同步验收通过**。Today 中国版网页账号已观察到技能安装、密钥表单及“已连接”状态；首次连接需要手动完成。给 Today 用户直接提供 [安装与填写 API Key 说明](plugins/babelbird-cloud/skills/babelbird-setup/references/today-setup.md)。不要执行下方六款桌面宿主的本地页面流程，也不要改用 Muse Code 配置。

由智能体查询平台 Skills 目录或使用原生导入工具。目录确认后可运行 `node install/install.mjs --host muse --skills-dir "<实际绝对目录>"`（Today 为 `--host today`）。安装器不猜目录、不写平台凭据文件。返回 `requires_platform_setup` 后继续连接：有实际可用的原生工具则打开平台表单；Today 无法自动打开时，直接展示上述说明中的连接应用入口和可复制 JSON，带用户完成“粘贴代码添加 → 下一步 → Token → 添加”，不要只让用户自行寻找设置或声称已经弹窗。用户保存后继续实际目录检查；平台能力不足则准确报告缺失项。用户明确指定的 ref 必须保留，否则固定 v0.5.1。

## 1. 识别宿主并获取版本

根据实际运行应用识别宿主，不按模型名猜测。支持 ID：`codex`、`workbuddy`、`codebuddy`、`claude`、`cursor`、`gemini`。路径与格式见 [支持的智能体](docs/SUPPORTED_AGENTS.md)。检查 Node.js 20+；Codex 还需可用的 Codex 可执行文件，由智能体定位。

用户明确指定分支、tag 或 commit 时保留其 ref。否则默认固定 v0.5.1，不跟随默认分支或陈旧网页摘要。正式发布前在当前测试 ref 验证，不调用尚不存在的 tag。以下是智能体执行的正式安装示例，克隆到用户可写且不与既有工程冲突的位置：

```bash
git clone --branch v0.5.1 --depth 1 https://github.com/bypassdesign-dev/babelbird-plugins.git babelbird-plugins-v0.5.1
cd babelbird-plugins-v0.5.1
node install/install.mjs --host codex
```

最后一行将 `codex` 替换为实际宿主 ID。安装器复制 `babelbird-setup` 和 `babelbird-project-cloud` 的完整目录、引用和脚本到用户 Skills 目录，然后启动本地设置页。安装后执行返回的绝对 `setupScript`，不依赖克隆目录。

默认 GitHub 路线是用户级 Skills + MCP 组合，不注册原生插件菜单。Codex / Claude Code 原生插件包仍保留；仅在用户选择原生路线时使用，不把原生安装命令混入默认流程。

## 2. 保留已有安装与连接

先检查当前已加载的巴别鸟 MCP。如果有效，做下方只读验证并复用；需要安装或更新 Skills 时使用 `node install/install.mjs --host <id> --install-only`，避免重复密钥提示。`installed_not_connected` 仅描述安装器没有启动连接流程，不否定已通过验证的现有连接。

安装器拒绝覆盖没有安装回执或本地修改过的同名 Skill。智能体应保留原文件、比较差异、检查是否已有适用安装，再在不丢失修改的前提下处理；不删除回执绕过保护，不直接覆盖，也不要求新用户判断技术字段。确实需要用户取舍时先准备具体差异和可恢复方案。

保留其他 MCP、账号、启用状态与设置，不因助手进程看不到环境变量而关闭旧连接。不要读取或打印鉴权头，不把密钥写进项目、安装包、日志或命令历史。

## 3. 自动打开单项密钥页并等待

默认安装命令返回 JSON，包含 `setupScript`、`url` 等字段。自动打开同机浏览器，在对话中也提供 **[填写 API Key](返回的完整 URL)**；只让用户粘贴 Key 并点击“保存并连接 / Save and connect”。中英文页面提供获取密钥入口。不能要求把密钥发到聊天，也不需要用户回复“已填写”。

浏览器启动失败时，通过宿主浏览器工具打开返回的同一个 URL，并如实报告。远端主机的 127.0.0.1 不是用户电脑；仅远程／无浏览器等真实限制才使用 [备用填写方法](plugins/babelbird-cloud/skills/babelbird-project-cloud/references/credential-entry.md)。

如果安装返回 `setup_failed`，Skills 可能已安装；检查原因后用返回的绝对脚本路径重新启动：

```text
node "<setupScript>" --host <id> --start
node "<setupScript>" --host <id> --wait
```

占位符由智能体替换，不原样交给用户。每次 `--wait` 最多 25 秒；在 waiting / receiving / checking / saving 时继续等待并保持简短进度沟通。直到 connected、用户取消、expired 或助手退出。关闭标签页不等于取消，临时助手默认十分钟过期；过期后需要新入口时重新启动。`--status` 可立即查询，不轮询配额，不要求用户额外确认已填写。

## 4. 核对页面与当前宿主的两个状态

`connected` 表示助手已读取个人文件、列出一页目录并保存用户私有 MCP 配置。使用返回的 `serverName`，检查当前宿主是否加载该连接。已加载时调用实际 MCP 工具复查；尚未加载时说明“配置已保存并通过页面检查，请重启当前宿主或重新打开会话以加载连接”。重启后复用凭据，不再索要 Key。

WorkBuddy 需要用户在应用内批准第三方 MCP 权限；不要修改权限设置以自动批准。新增配置后需要重新加载应用／会话；配置文件或页面成功不能替代宿主工具实测。

只读验证：`getFileInfoByPath` 定位 `/个人文件`，确认业务成功与目录类型，使用真实 ID 调用 `listFolder`，`pageIndex: 0, pageSize: 1`。同时检查 MCP `isError` 与业务结果，空目录成功也有效。HTTP 200、初始化成功或工具列表可见都不够。目录超时最多重试一次，鉴权失败如实处理。默认跳过配额，不上传测试文件。

如果返回 `saved_status_error` 或提示配置已保存但进度记录失败，先验证实际配置与宿主加载，不重新要求密钥。`idle` 不能证明成功或失败。

## 5. 继续原请求

用户仅安装时到连接检查为止，不扫描、绑定或上传工程。用户同时要求同步时，进入 `babelbird-project-cloud`，按实际宿主默认 `个人文件/<host>/工程名/` 建立绑定；已绑定或用户指定目录优先，跨设备和跨智能体复用原目录。

交接分别说明 Skills 安装、凭据保存、页面目录检查、宿主 MCP 加载和真实只读验证的状态。未实测不能报告客户端端到端成功。
