# API Key 填写入口

## 默认：自动打开本机设置页

六个已适配宿主（`codex`、`workbuddy`、`codebuddy`、`claude`、`cursor`、`gemini`）均优先执行 `babelbird-setup`。智能体从 Skill 目录运行 `node scripts/setup-host.mjs --host <id> --start`，或使用安装器已返回的页面。需要 Node.js 20+ 和同机浏览器。

页面含中英文、一个密码框及获取 Key 入口。智能体自动打开页面，也给出返回的可点击 URL；用户粘贴 API Key 并点击“保存并连接 / Save and connect”。智能体用 `--host <id> --wait` 自动等待，每次最多 25 秒，直到成功、取消、过期或助手退出。无需回复“已填写”，不要把 Key 发到聊天。

Key 先通过个人文件读取和一页目录检查，再保存到用户私有配置；默认页面十分钟过期。已加载有效的 MCP 直接复用，不重复填写。页面保存成功不代表当前宿主已加载工具，未加载时重启／重新打开会话后复用凭据验证。WorkBuddy 的第三方 MCP 权限必须由用户在应用内批准，不能自动批准。

## 获取密钥

打开 [官方教程](https://www.babel.cc/public/babelwiki/zh/mcp-integration.html)，登录巴别鸟后进入“设置 > API秘钥”，创建或打开应用，复制详情里的 **APIKey**，不是 APP Key 或 APP Secret。权限说明见 [获取 API Key](api-key.md)。个人文件及目标工程必须在授权范围内。

## 仅在本地页不可用时：手工备用

远程执行、无同机浏览器或宿主限制导致无法运行本地页时，才使用以下方式。智能体先说明具体限制，再提供当前宿主实际存在的入口；不要让新用户在多种配置格式中自行选择。127.0.0.1 指向运行助手的电脑，不能把远程 URL 当成本机入口。

### Codex 客户端设置

在提供该入口的客户端打开“设置 / Settings > MCP 服务器 / MCP servers > 添加服务器 / Add server”。名称用 `babelBirdPersonal`（冲突时由智能体选择），类型 Streamable HTTP，URL 为 `https://www.babel.cc/mcp`，Headers 添加 `Authorization`，值为 `Bearer ` 加自己的 APIKey，注意空格。Bearer token env var 留空，它要求变量名而非 Key。保存后按提示重启并由智能体只读验证。不要修改只读插件分发配置或关闭其他账号连接。

### WorkBuddy 自定义 MCP

仅在本地页无法使用时，通过“专家·技能·连接器 > 连接器 > 自定义连接器”或当前版本对应入口添加远程 Streamable HTTP，地址 `https://www.babel.cc/mcp`，请求头 `Authorization` 为 `Bearer ` 加 APIKey。保存后重载，并在应用内批准第三方 MCP 权限。完整连接器的 Token 表单仅在该分发方式真实提供时可用，GitHub 用户不必寻找尚未上架的表单。

### 其他宿主与 CLI

智能体根据实际宿主配置能力准备用户私有入口。CodeBuddy CLI、Claude Code、Cursor 使用 URL 与 headers，Gemini CLI 使用 httpUrl 与 headers；不将纯 Key 放进聊天或公开命令。Claude 原生插件路线可使用其敏感 `api_key` 配置项，不能把原生表单当作 GitHub Skills 安装必然提供的入口。

Codex CLI 原生插件环境变量方式只在用户可交互终端中私密输入；密钥不出现在命令文字中：

```bash
read -r -s -p 'BabelBird API Key: ' BABELBIRD_API_KEY
export BABELBIRD_API_KEY
codex
```

该变量仅供此终端启动的进程使用，不会更新已运行的桌面客户端，也不是永久保存。需要持久配置时由智能体使用宿主用户私有配置，保留其他设置，不暗中写全局环境或共享启动脚本。

## 检查与恢复

分别报告配置保存、页面验证和当前宿主实际工具验证。目录读取超时不等于密钥失效，先排查加载与网络；不要反复索要 Key。手工备用完成后继续实际只读检查，不上传测试文件。仅出现配置文件或工具列表时不能宣布接入成功。
