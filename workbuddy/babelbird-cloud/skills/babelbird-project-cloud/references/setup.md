# 连接与首次配置

GitHub 默认安装两项自包含的用户级 Skills 并配置 MCP，不注册原生插件菜单。支持 Codex、WorkBuddy、CodeBuddy CLI、Claude Code、Cursor、Gemini CLI。需要 Node.js 20+、本地文件读写和网络传输能力。公有云 MCP 地址固定为 `https://www.babel.cc/mcp`，实际连接名可能为 `babelBirdPersonal` 或宿主已有名称。

## 首次配置流程

1. 安装请求包含首次连接；只下载、离线或稍后配置除外。先检查当前加载的已有 MCP，验证有效后复用，不重复索要 Key。缺少凭据时执行相邻的 `babelbird-setup` Skill，运行 `node scripts/setup-host.mjs --host <id> --start`；GitHub 安装器已启动时使用返回的 URL，不重复启动。
2. 默认自动打开同机中英文单密码框页，同时在聊天中提供返回的完整可点击链接。用户只需粘贴 Key、保存；不要把 Key 发到聊天。智能体用同一脚本 `--host <id> --wait` 自动等待，每次最多 25 秒，直至成功、取消、过期或助手退出，无需额外回复“已填写”。手工配置只用于 [本地页不可用的备用情况](credential-entry.md)。
3. 页面先用 `getFileInfoByPath` 读取 `/个人文件`，再用真实目录 ID 调用 `listFolder`，`pageIndex: 0, pageSize: 1`。业务和 MCP 状态均成功才保存用户私有配置。不要用协议根目录 `0` 代替个人文件，也不以 HTTP 200 或工具列表代替成功检查。
4. 分别核对“页面已检查并保存”与“当前宿主已加载 MCP”。后者需要实际工具调用；新连接未加载时提示重启／重新打开会话，重启后直接复用凭据。WorkBuddy 第三方 MCP 权限由用户在应用内批准，不能自动批准。错误和未完成项如实报告。
5. 保留其他账号、连接、启用状态与设置。密钥仅存用户私有配置，不进入项目、分发包或公开日志；不打印鉴权头。相同配置复用，不因为环境变量在助手进程不可见就删除旧连接。
6. 默认跳过 `getUsageAndQuota`。目录读取超时最多重试一次，401/403、权限失败、明确空间不足和真实传输失败仍需处理。配额未知不阻塞已授权存储，也不表示 Key 无效。
7. 只连接时不创建云端目录或上传。用户要求同步且工程明确时进入项目同步流程，新工程默认 `个人文件/<host>/工程名/`，host 为 `codex`、`workbuddy`、`codebuddy`、`claude`、`cursor`、`gemini`；已绑定或指定的目录优先。任务前、每批修改后及结束前同步，跨设备继续同一目录。

## 宿主配置与其他分发方式

默认用户级配置：Codex `~/.codex/config.toml`；WorkBuddy `~/.workbuddy/mcp.json`；CodeBuddy CLI 按顺序选首个现存的 `~/.codebuddy/.mcp.json`、`~/.codebuddy/mcp.json`、`~/.codebuddy.json`，全不存在时创建首项；Claude Code `~/.claude.json`；Cursor `~/.cursor/mcp.json`；Gemini CLI `~/.gemini/settings.json`。用户 Skills 分别在对应 `~/.<host>/skills` 中。环境变量可覆盖部分路径，以助手解析结果为准。WorkBuddy 不写 `~/.workbuddy/.mcp.json`。

原生 Codex / Claude Code 插件及 WorkBuddy 连接器源码仍保留。只有用户选择该分发路线、且宿主实际提供相应凭据表单时才使用它；不要混淆用户级安装与原生插件菜单注册。

已有同名 Skill 无安装回执或存在本地修改时，安装器拒绝覆盖，由智能体保留并比较处理，不丢弃用户修改。私有化部署需要管理员提供并确认 MCP 地址，不能将其凭据送往公有云。

## 后续传输

读取 [MCP 接口](mcp-tools.md) 与 [同步执行](sync.md)。只有实际传输并回读校验才能声称内容已同步，配置成功不能替代上传完成。保持原文件与目录，不打包 ZIP。自动执行依赖宿主加载项目规则，不提供后台守护进程或挂载盘。
