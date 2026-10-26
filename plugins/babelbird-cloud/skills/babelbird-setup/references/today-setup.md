# Today 安装与连接巴别鸟

[English instructions](#english)

**Today 当前需要手动完成一次账号连接，安装后不会自动弹出 API Key 页面。** 技能安装交给 Today；下面的配置可以整段复制，不需要理解代码。中国版与国际版的账号和入口分别核实，请沿用你正在使用的站点。

## 1. 让 Today 安装技能

在 Today 对话中发送：

> 帮我安装 https://github.com/bypassdesign-dev/babelbird-plugins/tree/v0.5.1 的巴别鸟插件。请按仓库中的 Today 安装说明操作，并引导我完成首次连接。

安装后，在“设置 → Skills（技能）→ 活跃技能”中应能看到 `babelbird-setup` 和 `babelbird-project-cloud`。如果没有，请让 Today 继续检查安装。**技能已安装不代表账号已连接。**

## 2. 复制配置，打开密钥输入框

打开 Today 的“设置 → 连接应用”，点击 **添加自定义 MCP → 粘贴代码添加**。中国版客户端里找不到入口时，可在浏览器打开 [Today 中国版连接应用](https://todayai.cn/connectors)，登录与客户端相同的账号。

将下面整段配置原样复制到输入框：

```json
{
  "mcpServers": {
    "BabelBird": {
      "url": "https://www.babel.cc/mcp",
      "headers": {
        "Authorization": "Bearer ${BABELBIRD_API_KEY}"
      }
    }
  }
}
```

阅读页面提示后，自行勾选“我已了解风险并选择继续”，点击 **下一步**。页面应显示名称 `BabelBird`、地址 `https://www.babel.cc/mcp`、认证方式 `Bearer token`，以及 **Token** 密码输入框。

`${BABELBIRD_API_KEY}` 是用于生成密码输入框的占位符。**此处不用替换成你的 Key，也不用设置环境变量。** 也可以从 [配置模板文件](today-mcp-template.json) 复制相同内容。

## 3. 只在 Token 密码框填写 Key

先清空 **Token** 框中已有的内容，再粘贴巴别鸟 **APIKey 原值**，不要在前面添加 `Bearer `，然后点击 **添加**。

还没有 API Key：打开 [巴别鸟官方获取说明](https://www.babel.cc/public/babelwiki/zh/mcp-integration.html)，在巴别鸟“设置 → API秘钥”中创建应用，复制应用详情里的 **APIKey**，不是 APP Key 或 APP Secret。为需要使用的“个人文件”目录授予所需权限。Key 只填在 Today 的密码框中，不发到聊天里。

返回连接应用列表后，检查是否出现 **BabelBird · 已连接**。若已经有可用的 BabelBird 连接，请直接复用，避免重复添加。

## 4. 请 Today 检查连接，再启用同步

回到 Today 对话中发送：

> 我已在连接应用中添加 BabelBird。请检查巴别鸟连接：读取“个人文件”并列出一页目录，暂时不要上传文件，也不要查询配额。

如果当前对话还看不到新工具，按 Today 提示刷新连接或新建对话，再发送这句话；不用重复填写 Key。**“已连接”只代表平台显示的连接状态，目录读取通过后才能确认这一步可用。**

检查通过后，需要同步工程时再说：

> 为当前工程启用巴别鸟同步。开始修改前拉取更新，修改完成后上传。

新工程默认保存到 `个人文件/today/工程名/`。继续其他设备或智能体的工程时，直接告诉 Today 已有云端目录，例如 `个人文件/codex/网站改版/`，继续使用同一目录。文件保留原名和文件夹结构，不打包 ZIP。

Today 只能同步它有权访问的文件。云端工作区不等于电脑本地工程；若需要操作电脑上的项目，先按 Today 自身的功能授权该目录。当前尚未完成 Today 工程上传、下载和跨会话自动同步的实测验收。

## 遇到问题

- **只填地址后提示 unavailable：**返回“添加自定义 MCP”，改用上面的“粘贴代码添加”步骤。这是本次账号中实际走通的填写入口。
- **提示凭据格式不正确：**确认配置中的占位符完整保留为 `${BABELBIRD_API_KEY}`，不要改成 `<API_KEY>`。真实 Key 在下一步的 Token 框填写。
- **来不及输入，窗口就关闭了：**先检查连接列表。如果没有已连接的 BabelBird，重新进入“添加自定义 MCP → 粘贴代码添加”，再打开 Token 框。本次没有确认窗口消失的原因，不能保证它不会重现。
- **已连接，但还不能同步：**先完成上面的目录读取检查，再确认 Today 能访问目标工程；不要把连接列表的状态当作工程同步成功。

## 已验证的范围

2026-10-26：在已登录的 Today 中国版网页账号中，观察到两项技能出现在活跃技能列表；按上述 JSON 流程打开 Token 密码框，用户填写后，连接列表显示 BabelBird“已连接”。自动弹出凭据页的目标未达成，因此本版提供这份手动说明。

本机已安装 Today 中国版 1.23.0，但上述界面测试使用网页入口，没有完成原生客户端窗口验收。Today 内实际目录工具调用、工程字节传输、跨会话规则触发及国际版流程尚未验收。请按步骤 4 检查当前账号，而不要把本记录理解为完整同步保证。

## English

Today currently requires a manual first-time connection; installing the skills does not automatically open the API Key form. Continue on your existing regional site. The China account was tested at [todayai.cn/connectors](https://todayai.cn/connectors); the international site has not been validated.

1. Ask Today: “Install the BabelBird plugin from https://github.com/bypassdesign-dev/babelbird-plugins/tree/v0.5.1 and guide me through its Today setup instructions.” Check **Settings → Skills → Active skills** for `babelbird-setup` and `babelbird-project-cloud`.
2. Open **Settings → Connected apps → Add custom MCP → Add by pasting code** (Chinese labels: 连接应用 → 添加自定义 MCP → 粘贴代码添加). Paste the JSON above unchanged, or copy the [template](today-mcp-template.json). Read and acknowledge the notice yourself, then select **Next**. Keep `${BABELBIRD_API_KEY}` literal; do not put your real key in the JSON or set an environment variable.
3. In the resulting **Token** password field, clear any existing content and paste the raw BabelBird API Key without `Bearer `. Select **Add** and look for **BabelBird · Connected**. Get a key from BabelBird **Settings → API keys → application details**, following the [official guide](https://www.babel.cc/public/babelwiki/zh/mcp-integration.html). Use APIKey, not APP Key or APP Secret; never send it in chat. Reuse an existing valid connection.
4. Ask Today: “Check my BabelBird connection by reading Personal Files and listing one page. Do not upload files or query quota.” Refresh the connection or start a new conversation if tools are not loaded. After a successful check, ask to enable project sync. New projects default to `个人文件/today/<project>/`; reuse an existing cloud folder when switching agents or devices. Files are transferred individually, without ZIP archives.

If URL-only setup reports unavailable, use the JSON import above. If credential format is rejected, keep the exact placeholder instead of `<API_KEY>`. If the form disappears, check for an existing connection before reopening it. Connected status alone does not verify project sync, and cloud workspace access does not grant access to local computer files.

Observed on 2026-10-26: both skills installed in a logged-in China web account; the Token form accepted user entry and the list showed Connected. Automatic form opening was not achieved. Native desktop UI, actual directory calls, project upload/download, cross-session sync and the international workflow remain unverified.
