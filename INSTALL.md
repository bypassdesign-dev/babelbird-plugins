# 安装巴别鸟并打开 API Key 页面

收到本仓库链接和“帮我安装”时执行。用户只询问信息、只下载或稍后配置时尊重其范围。

## 安装版本

先判断实际宿主。检查已有安装与有效连接，不重复索要已配置的密钥。网页摘要可能陈旧，核对真实仓库文件及 ref，不能把 0.3.x 当成当前版本。

Codex 支持 `codex plugin` 时执行：

```bash
codex plugin marketplace add bypassdesign-dev/babelbird-plugins --ref v0.4.1
codex plugin add babelbird-cloud@babelbird-local
```

用户给了明确的测试分支或其他 ref 时使用该 ref，不替换成尚未发布的 tag。已有市场按当前 CLI 的更新方式处理，并核对安装版本。远程添加失败可克隆相同 ref 并添加本地市场；没有插件命令时说明当前客户端不支持，不反复执行相同命令。

## Codex 安装后立即打开页面

读取安装包中的 [首次设置 Skill](plugins/babelbird-cloud/skills/babelbird-setup/SKILL.md)，在其目录执行：

```bash
node scripts/setup-codex.mjs --start
```

需要 Node.js 20+ 和可用的 Codex 可执行文件；由安装智能体检查与定位。助手自动打开默认浏览器并返回临时 `url`。在对话中也给出 **“填写 API Key”** 可点击链接，只让用户粘贴密钥、点击“保存并连接”。浏览器未自动启动时使用宿主浏览器工具打开返回的同一个 URL。

**默认流程不能交接为教程、MCP 菜单、请求头或环境变量配置步骤。**没有密钥时页面提供获取按钮。不要要求把密钥发到聊天，不读取或打印鉴权头。

启动后按 Skill 使用 `--wait` 自动等待页面结果，每次有界等待最多 25 秒。不要让用户额外发送“已填写”，也不要只发链接就宣称设置完成。成功、助手退出、十分钟过期或用户取消时结束等待；关闭标签页不会立即停止助手。远程／无本机浏览器的实际限制才使用 [备用填写方法](plugins/babelbird-cloud/skills/babelbird-project-cloud/references/credential-entry.md)。

## 完成条件

助手 `connected` 表示个人文件与一页目录读取成功，且用户私有 MCP 配置已保存。它保留其他连接与 Skill，不自动关闭已有插件的 MCP，因为它可能属于另一个账号。使用返回的 `serverName` 检查新连接；其他未配置入口的提示不能代替此连接的检查结果。

核对当前宿主是否加载新连接。已加载时调用实际 MCP 工具复查；未加载时说明“已保存并通过页面检查，请重启 Codex 一次”，重启后直接复用配置验证，不重新要求密钥。页面直连成功和当前会话工具加载是两个状态，分别如实报告。

默认跳过配额，不上传测试文件。用户仅安装时不绑定或扫描上传工程；用户同时要求同步时，连接通过后按原请求建立绑定。Codex 默认 `个人文件/codex/工程名/`，跨平台续接复用原目录。

## WorkBuddy 和 Claude Code

WorkBuddy 按 [专用说明](workbuddy/babelbird-cloud/README.md) 安装两项 Skill 到选定工程的 `.codebuddy/skills/` 并使用自定义连接器。当前版本未实现 WorkBuddy 本地页自动配置；不要运行 Codex 助手，不声称已上架 WorkBuddy 市场。Claude Code 使用插件敏感配置项 `api_key`。
