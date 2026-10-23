# WorkBuddy 巴别鸟连接器 0.3.1

使用 WorkBuddy 官方的 MCP + Skill 格式，最低版本 4.24.0。两项 Skill 与 Codex 共用同步行为，包含 Node.js 20+ 的增量规划和字节传输脚本。

## 当前使用方式

本包尚未上架 WorkBuddy 连接器市场。普通客户端可先分开安装：

可以直接对 WorkBuddy 说：“请安装 https://github.com/bypassdesign-dev/babelbird-plugins ，然后一步一步带我填写 API Key 并验证连接。”安装智能体应按仓库 INSTALL.md 执行，不能只下载文件后结束。

1. 按 [官方教程](https://www.babel.cc/public/babelwiki/zh/mcp-integration.html) 获取个人 API Key。
2. 在 WorkBuddy 的“专家·技能·连接器 > 连接器 > 自定义连接器”新增远程 MCP：地址填 `https://www.babel.cc/mcp`，传输类型选 Streamable HTTP，请求头名称填 `Authorization`，值先输入 `Bearer `（末尾一个空格）再粘贴自己的 APIKey。保存并启用连接。真实值只填入自己的客户端，不发送到聊天或写入分发目录。详细步骤见 [填写入口](skills/babelbird-project-cloud/references/credential-entry.md)。
3. 将本包 skills 里的 `babelbird-project-cloud` 与 `babelbird-setup` 两个完整目录安装到当前工程的 `.codebuddy/skills/`，保留 references 和 scripts。不要覆盖同名的现有技能；已有安装按宿主的更新流程处理。确认可运行 Node.js 20+ 后重新打开项目会话。
4. 发送“使用巴别鸟首次设置技能配置连接，并为当前工程启用自动同步”。仅配置连接时可明确“只执行只读检查”。

从 GitHub 安装时，智能体应主动完成上述引导；你可以在保存后只回复“已填写”，让它继续只读检查。未出现 Token 表单不影响使用，自定义连接器是当前的填写入口。

本项目的 WorkBuddy 任务默认绑定 `个人文件/workbuddy/工程名/`。也可指定 `个人文件/codex/既有工程/` 继续使用同一个云端目录。目录和源码文件保留原结构，不压缩工程。

## 完整连接器包

connector-meta.json 声明 `auth_mode: token`，token-schema.json 提供必填密码表单及 API Key 教程链接，mcp.json 使用完全同名的 `${BABELBIRD_API_KEY}` 占位符。凭据由 WorkBuddy 保存到用户本机，包内只有引用。

依照 [WorkBuddy 连接器规范](https://open.workbuddy.cn/docs/connector) 将完整目录提交开放平台审核。审核上架后用户才能通过市场入口安装完整连接器并使用其内置表单；本次没有代用户提交审核，也没有验证客户端直接导入 ZIP。

[项目级 Skill 与规则规范](https://www.codebuddy.cn/docs/workbuddy/From-Beginner-to-Expert-Guide/Function-Description/Project) 支持 .codebuddy/skills 和 .codebuddy/rules。绑定脚本保留已有 AGENTS.md，并补充 WorkBuddy 的项目同步规则。任务期间执行同步，关闭应用后不在后台运行。
