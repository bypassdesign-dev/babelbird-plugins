# WorkBuddy 巴别鸟连接器 0.3.0

使用 WorkBuddy 官方的 MCP + Skill 格式，最低版本 4.24.0。两项 Skill 与 Codex 共用同步行为，包含 Node.js 20+ 的增量规划和字节传输脚本。

## 当前使用方式

本包尚未上架 WorkBuddy 连接器市场。普通客户端可先分开安装：

1. 按 [官方教程](https://www.babel.cc/public/babelwiki/zh/mcp-integration.html) 获取个人 API Key。
2. 在 WorkBuddy 的“专家·技能·连接器 > 连接器 > 自定义连接器”新增远程 MCP：地址 `https://www.babel.cc/mcp`，传输类型 Streamable HTTP，Authorization 请求头使用 Bearer 加自己的 API Key。通过客户端私密配置入口填写，不把真实值写入此分发目录。
3. 将本包 skills 里的 `babelbird-project-cloud` 与 `babelbird-setup` 两个完整目录安装到当前工程的 `.codebuddy/skills/`，保留 references 和 scripts。不要覆盖同名的现有技能；已有安装按宿主的更新流程处理。确认可运行 Node.js 20+ 后重新打开项目会话。
4. 发送“使用巴别鸟首次设置技能配置连接，并为当前工程启用自动同步”。仅配置连接时可明确“只执行只读检查”。

本项目的 WorkBuddy 任务默认绑定 `个人文件/workbuddy/工程名/`。也可指定 `个人文件/codex/既有工程/` 继续使用同一个云端目录。目录和源码文件保留原结构，不压缩工程。

## 完整连接器包

connector-meta.json 声明 `auth_mode: token`，token-schema.json 提供必填密码表单及 API Key 教程链接，mcp.json 使用完全同名的 `${BABELBIRD_API_KEY}` 占位符。凭据由 WorkBuddy 保存到用户本机，包内只有引用。

依照 [WorkBuddy 连接器规范](https://open.workbuddy.cn/docs/connector) 将完整目录提交开放平台审核。审核上架后用户才能通过市场入口安装完整连接器并使用其内置表单；本次没有代用户提交审核，也没有验证客户端直接导入 ZIP。

[项目级 Skill 与规则规范](https://www.codebuddy.cn/docs/workbuddy/From-Beginner-to-Expert-Guide/Function-Description/Project) 支持 .codebuddy/skills 和 .codebuddy/rules。绑定脚本保留已有 AGENTS.md，并补充 WorkBuddy 的项目同步规则。任务期间执行同步，关闭应用后不在后台运行。
