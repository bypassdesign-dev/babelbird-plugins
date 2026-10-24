# 项目云端同步巴别鸟插件 · WorkBuddy 0.5.0

配置插件后可以把codex/workbuddy的本地项目/工程文件自动同步到巴别鸟，切换设备或智能体产品后也能同步回来。

英文名称：**BabelBird Project Cloud Sync**。本目录保留 WorkBuddy MCP + Skill 连接器源码；GitHub 默认使用仓库统一安装器，不依赖连接器市场上架。

## 一句话安装

对 WorkBuddy 说：

> 帮我安装 https://github.com/bypassdesign-dev/babelbird-plugins ，并连接我的巴别鸟账号。

智能体读取 [INSTALL.md](../../INSTALL.md)，获取 v0.5.0（用户明确指定其他 ref 时保留），运行 `node install/install.mjs --host workbuddy`。需要 Node.js 20+。两项完整 Skill 安装到 `~/.workbuddy/skills/`；验证 Key 后 MCP 保存到 `~/.workbuddy/mcp.json`，不写生成缓存 `~/.workbuddy/.mcp.json`。

安装器自动打开同机中英文单密码框页面，同时由智能体提供可点击链接。粘贴 API Key 并保存即可；智能体自动有界等待结果，无需回复“已填写”。已有有效 MCP 先验证复用，避免重复填写；无法运行本地页时才使用 [备用入口](skills/babelbird-project-cloud/references/credential-entry.md)。

这是用户级 Skills + MCP 组合，不会创建原生插件菜单条目。新配置需要 WorkBuddy 重新加载；第三方 MCP 权限必须由用户在应用内批准，智能体不能自动批准。页面检查通过和 WorkBuddy 当前会话实际加载工具是两个状态，分别报告。

## 使用与边界

对 WorkBuddy 说“为当前工程启用巴别鸟自动同步”。新工程默认使用 `个人文件/workbuddy/工程名/`；已有绑定或指定目录优先，例如继续使用 `个人文件/codex/既有工程/`。原文件与目录保持不变，不压缩为 ZIP。绑定保留 AGENTS.md，并添加 `.codebuddy/rules` 中的项目规则。宿主加载规则后在任务前、每批修改后和任务结束前同步，不在应用关闭后常驻运行。

WorkBuddy 5.2.5 的本地加载器路径已纳入适配依据；完整智能体使用流程曾因登录受阻，不能声称客户端端到端验证完成。仓库测试、页面验证和实机验证范围见 [VALIDATION.md](../../VALIDATION.md)。

## 原生连接器包

`connector-meta.json`、`mcp.json`、`token-schema.json`、图标和两项 Skill 保留用于 [WorkBuddy 开放平台连接器](https://open.workbuddy.cn/docs/connector) 分发。此包尚未提交市场审核。仅在实际安装完整连接器且宿主展示 Token 表单时使用其必填密码项；不要求 GitHub 安装用户寻找尚未上架的表单，也不声称客户端支持直接导入 ZIP。

安装器遇到未托管或本地修改的同名 Skill 会停止覆盖；智能体保留并处理，不丢弃用户修改。其他宿主路径及未来适配见 [支持的智能体](../../docs/SUPPORTED_AGENTS.md)。
