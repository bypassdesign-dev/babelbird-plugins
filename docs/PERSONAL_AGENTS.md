# 个人智能体适配状态 / Personal agent adapter status

核查日期：2026-10-26。版本：0.5.1 GitHub 测试版。产品为 Meta Muse 个人智能体与 Today（中国版 https://todayai.cn ，国际版 https://today.ai ）。Muse Code 是另一款产品；不得用它的配置证明 Muse 可用。

## 当前结论

Today 首次连接采用 [手动安装与填写 API Key 流程](../plugins/babelbird-cloud/skills/babelbird-setup/references/today-setup.md)。已观察到中国版账号的技能安装和“已连接”状态；自动弹出凭据页的目标未达成，真实工程同步仍待验收。Meta Muse 继续作为未验收的实验适配提供。

| 项目 | Meta Muse | Today |
| --- | --- | --- |
| 本版提供 | 已确认 Skills 目录的安装；原生凭据引导；`muse` 工程绑定 | 已确认 Skills 目录的安装；手动 MCP 配置模板与双语说明；`today` 工程绑定 |
| 新工程默认目录 | `/个人文件/muse/<工程名>/` | `/个人文件/today/<工程名>/` |
| 平台实际证据 | 尚无登录后的连接验收 | 中国版网页账号出现两项活跃技能；Token 表单可填写；用户提交后显示“已连接” |
| 尚待验证 | 凭据表单、连接器桥接、工具调用、传输、跨会话规则 | 实际目录工具调用、工程上传下载、跨会话规则、原生客户端窗口和国际版流程 |
| 发布定位 | 实验适配 | 实验适配，首次连接需要手动操作 |

安装器返回 `requires_platform_setup`，不会把复制文件当成已连接，也不会打开云端 VM 的 localhost 页面。共享同步核心保留既有云端目录。云端工作区与用户电脑的本地文件需要分别确认访问权限。

## Today 中国版实际操作记录

1. 在已登录的中国版账号中，仅发送候选 GitHub 分支链接和安装请求。Today 报告安装完成，并在“设置 → Skills → 活跃技能”中实际观察到 `babelbird-setup` 和 `babelbird-project-cloud`。
2. Today 对话未自动打开凭据表单，返回了手动 MCP 配置指引。这一步未达到自动弹窗目标，因此本版采用明确的手动说明。
3. 在 `https://todayai.cn/connectors` 选择“添加自定义 MCP → 粘贴代码添加”，粘贴包内 JSON 模板，保留字面值 `Bearer ${BABELBIRD_API_KEY}`。用户确认页面提示并点击“下一步”后，页面显示预填名称、URL、Bearer token 和 Token 密码输入框。
4. 用户自行填写并提交 Key 后，连接应用列表显示 BabelBird“已连接”。实际 Key 没有写入指南、模板或公开证据。
5. URL-only 路线曾返回 unavailable；`Bearer <API_KEY>` 曾被拒绝为凭据格式不正确。一次表单在用户填写前消失，重新打开相同 JSON 流程后用户完成填写；尚未确认消失原因。

本机 Today 中国版为 1.23.0（build 2000158，`ai.today.macos.app.cn`）。上述操作使用网页入口，没有原生客户端窗口控制证据。连接详情读取未能完成，未取得 Today 内目录工具的成功业务结果。**不将“已连接”解释为工程存储或自动同步已经验收通过。**

后续验收需由 Today 实际读取 `/个人文件` 并列出一页目录，再在用户指定测试工程验证上传、回读、跨平台恢复和任务前后同步。默认不查询配额，首次连接不上传工程。国际版及 Muse 尚未进行登录后的凭据保存测试。

## 依据

- [Meta 官方 Muse 安全架构](https://research.meta.ai/blog/security-and-safety-for-ai-agents-our-approach-with-muse)：描述独立云端 VM、定制连接器和平台管理的替代凭据。能否将本 MCP 封装为连接器是待实测的工程判断，不能从文档推定已成功。
- [Meta 官方 Home Link 页面](https://gadgets.muse.ai/home-link)：提供从 GitHub 安装社区 Skills 的路线，但这不证明巴别鸟已经接入。
- [Muse Connector Platform](https://platform.muse.ai/)：公共连接器需要提交审核和端到端测试；本次未提交公共目录。
- [today.ai 官网](https://today.ai/)：公布社区 Skills、云端文件和代码能力。2026-10-26 直接读取官方页面公开资源，还观察到自定义 MCP、Bearer 认证、Token 输入与凭据验证状态的界面定义；**静态资源不能证明当前账号功能开放，更不能替代实际保存连接测试**。
- [Muse Code 扩展文档](https://dev.meta.ai/docs/muse-code/extending)仅用于区分产品，未将其用户路径或 MCP 设置套用到 Muse 个人智能体。

## 仓库检查

安装与同步回归包含 60 项测试，其中 7 项覆盖个人智能体：完整 Skills 复制、重复安装及本地修改保护、显式 Skills 目录、原生设置分流，以及复用现有 Codex 云端工程。它们不代替平台端到端测试。发布检查结果见 [VALIDATION.md](../VALIDATION.md)。

安装智能体使用 [平台流程](../plugins/babelbird-cloud/skills/babelbird-setup/references/personal-agents.md)。Today 用户直接使用 [四步说明](../plugins/babelbird-cloud/skills/babelbird-setup/references/today-setup.md)，无需自己判断 MCP 配置字段。

## English

Version 0.5.1 publishes experimental personal-agent installation and binding support. Today uses a [manual first-time connection guide](../plugins/babelbird-cloud/skills/babelbird-setup/references/today-setup.md#english). A logged-in China web account showed both installed skills, the Token form and Connected status after the user entered a key. The install conversation did not open the form automatically. The local China client is 1.23.0, but the observed UI was its web account, not a native desktop test.

Actual directory calls, project transfers and cross-session rule loading remain unverified in Today; the international site has not passed onboarding acceptance. Muse still needs credential-form and connector-bridge testing. `requires_platform_setup` is not a successful connection. Reuse existing cloud bindings and confirm workspace access before syncing local or cloud files.
