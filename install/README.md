# 安装项目云端同步巴别鸟插件 0.5.0

对当前智能体说：

> 帮我安装 https://github.com/bypassdesign-dev/babelbird-plugins ，并连接我的巴别鸟账号。

安装智能体先读取 [INSTALL.md](../INSTALL.md)，识别宿主并运行 `node install/install.mjs --host <id>`。支持 `codex`、`workbuddy`、`codebuddy`、`claude`、`cursor`、`gemini`，需要 Node.js 20+。没有指定 ref 时固定 v0.5.0；明确指定的测试 ref 必须保留，发布前验证使用当前 ref。

安装器复制两项自包含 Skill 到用户 Skills 目录，随后自动打开同机中英文 API Key 页面。分享返回的 URL，并运行返回的 `setupScript`，传入 `--host <id> --wait`，每次最多等待 25 秒，直至连接成功、取消、过期或助手退出。用户只需填写一个密码框并保存，不必回复“已填写”。

已有有效的宿主连接先验证并复用，安装 Skills 可用 `--install-only` 避免重复提示。未托管或本地修改的同名 Skill 会被保护，由智能体保留并处理。GitHub 安装是用户级 Skills + MCP 组合，不注册原生插件菜单。

页面成功后另查宿主是否已加载 MCP；未加载时重启或重新打开会话，复用密钥。WorkBuddy 第三方 MCP 权限由用户在应用内批准。路径、配置格式与验证边界见 [支持的智能体](../docs/SUPPORTED_AGENTS.md)。
