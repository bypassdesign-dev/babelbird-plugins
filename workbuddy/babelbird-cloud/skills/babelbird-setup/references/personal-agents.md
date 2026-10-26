# Meta Muse 与 today.ai：平台原生连接（实验适配）

适用于 Meta **Muse 个人智能体**（不是 Muse Code）和 today.ai。当前分支只完成安装分流、同步核心和引导说明；两款产品的登录后凭据表单、工具加载及真实工程传输仍待验收。不得把“实验适配”报告成完整支持。

## 安装智能体负责的部分

1. 确认实际产品，以及任务文件位于用户电脑还是平台云端工作区。远程 VM 的 `127.0.0.1` 不能作为用户电脑上的填写入口。本流程使用平台安全凭据界面，不启动本地 `setup-host.mjs` 服务，不开放公网密钥页。
2. 查阅当前平台实际提供的 Skills 安装工具或运行时文档，确定可持久发现 Skills 的位置。使用平台安装工具导入本包的 `babelbird-setup` 与 `babelbird-project-cloud` 两个完整目录；或有 Node.js 20+ 且已确认目录时执行 `node install/install.mjs --host muse --skills-dir "<已确认的绝对技能目录>"`，today.ai 使用 `--host today`。路径由智能体发现，不能让用户选择技术路径，也不能猜写 `~/.muse`、`~/.today` 或借用 Muse Code 配置。
3. 安装器返回 `requires_platform_setup` 后立即继续下方平台流程。它只说明文件已就位，没有保存 Key、打开平台界面、注册连接器或验证连接。不要以此状态结束“帮我安装并连接”的请求。若平台目录未知，先使用平台自己的 Skills 导入入口；无法导入时报告具体缺项。
4. 先查现有有效巴别鸟连接，存在则复用并做只读检查；无需再次填写。全程使用用户当前语言。原生凭据工具不可用时，明确说明缺少什么能力，不要求将真实 Key 粘贴到聊天或命令中。

## today.ai

中国版入口为 https://todayai.cn ，国际版为 https://today.ai 。沿用用户当前或明确指定的站点；用户选择中国版时不要跳到国际版要求重新登录。两站登录状态及连接器开放情况分别核实，不假定共享账号或功能。中国版当前登录页使用中国大陆手机号，登录、验证码及服务协议由用户在原生页面完成；不向聊天索要这些信息。`today` 宿主 ID 和巴别鸟 MCP 地址不随站点改变。

优先使用实际可用的原生连接器工具创建或打开远程 MCP 连接。如果工具不可用但可操作平台 UI，打开当前版本的连接应用入口，选择添加自定义 MCP。官方网页资源中可见该表单，但必须核对当前账号实际界面，不能仅依据字符串认定该账号已开放功能。

由智能体准备非密钥字段：

- 名称：`BabelBird` / `巴别鸟`。
- MCP URL：`https://www.babel.cc/mcp`。
- 传输：远程 HTTP / Streamable HTTP（若界面要求选择）。
- 认证：Bearer token。用户只在平台的 Token 密码框里填写 **APIKey 原值**，不加 `Bearer `；平台生成 `Authorization: Bearer <APIKey>`。
- 获取密钥入口：https://www.babel.cc/public/babelwiki/zh/mcp-integration.html 。

把表单直接呈现给用户，提示“请在这里粘贴巴别鸟 API Key，然后保存并连接”。平台要求的连接授权由用户完成。利用平台状态或实际工具加载继续检查，不要求用户另外回复“已填写”。如果无权打开/预填表单，如实说明并只指向当前可见入口；不得宣称自动弹窗已经实现。

保存后确认该 MCP 实际提供 `getFileInfoByPath` 和 `listFolder`，按下方检查。平台管理凭据，不写本机 MCP JSON，不以为需要重启云端 VM。尚未刷新工具时使用平台提供的刷新连接/新会话流程，复用已保存凭据。

## Meta Muse 个人智能体

Muse 使用自身的安全凭据库和自定义连接器机制；不能将 Muse Code 的 `mcp_servers` 配置或目录套用于个人智能体。先读取当前 Muse 提供的连接器编写/安装说明，并检查实际工具 schema。

如果已提供自定义远程 MCP 导入与安全凭据表单，沿用上面的 URL 和 Bearer 认证完成。否则仅在平台确实提供自定义连接器编写及安全凭据能力时，按平台说明建立巴别鸟连接器：

- 用平台的安全凭据请求工具显示一个 API Key 字段。凭据由平台存入安全库；运行时代码只接收平台提供的替代凭据或请求代理。文档中的 `credentials.request_api_access`、surrogate helper 等名称只作为发现线索，实际调用必须以当前运行时文档和 schema 为准。
- 将密钥的使用限定到 `https://www.babel.cc/mcp` 的 `Authorization: Bearer` 请求头。不要把真实 Key 导出为环境文件、代码、项目文件或日志，也不要借用另一项服务的凭据。
- 自定义连接器需要实现 MCP HTTP 客户端会话：`initialize`、`notifications/initialized`、`tools/list`、`tools/call`；保留服务端会话标识与协商协议版本，处理 JSON 和 SSE。HTTP 200 或流结束不等于收到匹配请求 ID 的结果。
- 使用平台自带且实际存在的连接器/协议辅助能力实现上述调用；**本包尚未提供经过 Muse 实机验证的 HTTP 桥接客户端**。若运行时不能创建桥接或安全注入请求头，报告“Skills 已安装，Muse 连接器尚不可用”，保持未连接状态。不能因此打开普通网页索要明文 Key，也不能宣称已完成适配。
- 不提交公共连接器目录；公开上架是独立审核流程，不属于用户安装个人连接器。

## 实际连接检查

使用当前连接器真实暴露的工具或已验证的桥接调用，不编造宿主工具名。调用 `getFileInfoByPath`，参数 `namePath: "/个人文件"`，确认 MCP 非错误、业务 `success: true`、`code: 0`、目录类型为 2，取得非零真实 `fileId`。用该 ID 调用 `listFolder`，`pageIndex: 0, pageSize: 1`；空目录成功也有效。

默认跳过配额查询。目录超时最多重试一次，401/403、权限失败和流结束无业务结果都如实报告。仅安装连接不上传测试文件、不扫描工程。分别报告 Skills 被平台发现、平台凭据已保存、工具已加载、目录读取已通过；只完成前两项不能说“工程同步可用”。

## 工程同步与跨平台续接

用户要求保存或启用同步后，读取 `babelbird-project-cloud/SKILL.md` 和其 `references/sync.md`，使用相同的逐文件传输与冲突规则。新工程默认 `/个人文件/muse/<工程名>/` 或 `/个人文件/today/<工程名>/`；已有绑定和用户指定目录优先。换到 Codex/WorkBuddy 时复用同一云端工程，不再创建新副本。

必须确认平台能读写目标工作区、运行 Node.js 20+、传输原始字节，并能持久加载同步 Skill。项目脚本写入 `AGENTS.md`；Muse/today.ai 未确认自动读取此文件，需通过平台实际支持的项目指令或持久 Skill 规则引用绑定。无法确认任务前后会加载规则时，报告“当前任务可同步，跨会话自动触发未验证”。

云端工作区中的文件不等于用户电脑上的文件。没有本机文件连接器时，只同步平台已能访问的工作区；用户电脑尚未授权访问的项目不能被自动上传。恢复到新设备时由该设备智能体下载原始字节并核对内容，不声称已经写入当前不可访问的电脑。

## English handoff

Use the host's native credential form for these personal agents. The user enters only their API Key; the agent prepares the BabelBird endpoint and Bearer authentication. Discover the actual Skills location or use the platform import tool. Never give the user a cloud VM's localhost URL. A `requires_platform_setup` result means the files are installed and setup must continue; it is not a successful connection. Muse's custom connector bridge and both products' live credential flows remain unverified. Sync only files accessible to the active workspace, and reuse the selected cloud project across devices and hosts.
