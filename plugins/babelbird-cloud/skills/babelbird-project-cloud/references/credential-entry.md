# API Key 具体填在哪里

先判断实际宿主。以下是当前可用的填写方法；只有宿主确实提供凭据弹窗时才提示用户使用弹窗。用户已有有效连接时直接复用。

## 获取密钥

打开 [巴别鸟官方教程](https://www.babel.cc/public/babelwiki/zh/mcp-integration.html)，登录巴别鸟后进入“设置 > API秘钥”，创建或打开应用，复制应用详情里的 **APIKey**。不是 APP Key，也不是 APP Secret。需要详细权限说明时看 [获取 API Key](api-key.md)。

## Codex 默认：自动打开本地设置页

安装智能体在 `babelbird-setup` Skill 目录运行 `node scripts/setup-codex.mjs --start`，自动打开仅含 API Key 的本地页面，同时给用户返回的填写链接。用户粘贴密钥、点击“保存并连接”；助手自动读取个人文件并保存用户私有配置。使用 `--wait` 等待结果，不要求用户额外回复“已填写”。

需要 Node.js 20+ 和 Codex，可由安装智能体检查。页面在同一台电脑上运行，默认十分钟内有效；成功后退出。页面会保留其他账号及设置，不能将它用于企业私有化地址。宿主尚未加载新连接时只需重启 Codex 一次，之后复用密钥验证。

以下桌面和 CLI 方法仅用于不支持本地页面的环境排障，不作为小白默认步骤。

## Codex 备用：通过客户端设置填写

适用于提供 MCP servers 设置的 ChatGPT 桌面／Codex 客户端。菜单语言可能不同，英文名称一并列出。这个入口是客户端原有的连接表单，不是本插件自定义的安装密码框。

1. 打开 **设置（Settings）> MCP 服务器（MCP servers）> 添加服务器（Add server）**。如果已存在本人的巴别鸟连接，先使用其设置，不重复创建。
2. 新建时按下表填写。不要修改“来自插件（From plugins）”中的只读分发配置。

| 字段 | 填写内容 |
| --- | --- |
| 名称（Name） | `babelBirdPersonal`，已有同名但用途不同时由智能体选择不冲突的名称 |
| 类型（Type） | `Streamable HTTP` |
| URL | `https://www.babel.cc/mcp` |
| Bearer token env var | **留空**；此字段填写的是环境变量名称，不是 APIKey |
| Headers／请求头 | 点击 Add header，名称填 `Authorization` |
| 上述请求头的值 | 先输入 `Bearer `，注意末尾有一个空格，再粘贴自己的 APIKey |
| Headers from environment variables | 留空 |

3. 点击 **Save／保存**，按客户端提示选择 **Restart／重启**。重启后在原会话回复“已填写，请继续只读连接检查”。
4. 密钥保存在当前用户的本机 MCP 配置，不写进项目或插件包。表单字段不一定遮挡字符，填写时不要共享包含密钥的截图。

**由安装智能体完成：**验证新的个人连接后，保留 Skill 并关闭插件内尚未配置的重复 MCP 入口，避免环境变量缺失导致重复报错。仅在当前用户的 Codex 配置中调整对应插件的 MCP 开关，使用实际插件标识；本仓库默认例子如下，不能覆盖整个配置文件：

```toml
[plugins."babelbird-cloud@babelbird-local".mcp_servers.babelBird]
enabled = false
```

这是启用个人连接、复用同一套 Skill 的模式。不要关闭整个插件，不要删除旧连接，不要修改安装缓存，也不要把真实密钥写入分发的 mcp.codex.json。个人连接未验证通过时先保留原配置。Skill 使用实际发现的工具名，允许服务名为 babelBirdPersonal 或已有的巴别鸟连接名。

此方式使用 Codex 支持的用户级 `http_headers` 配置；如果使用远程主机，配置必须落在实际执行 MCP 的那个主机。菜单不存在时明确说明当前客户端差异，改用下面的 CLI 方法，不能声称桌面已经完成配置。

## Codex CLI：在终端私密输入

使用 CLI 的用户可以保留插件内置 MCP。在用户可交互的终端中执行，**真实密钥不要直接放进命令文字**。

macOS／Linux：先运行 `bash`，再逐行执行：

```bash
read -r -s -p '请粘贴巴别鸟 API Key，按回车确认（输入不会显示）: ' BABELBIRD_API_KEY
export BABELBIRD_API_KEY
codex
```

Windows PowerShell：

```powershell
$babelSecret = Read-Host '请粘贴巴别鸟 API Key，按回车确认' -AsSecureString
$env:BABELBIRD_API_KEY = [System.Net.NetworkCredential]::new('', $babelSecret).Password
Remove-Variable babelSecret
codex
```

输入不显示字符是正常行为。最后一行启动能读取密钥的 CLI；在新会话中说“继续巴别鸟只读连接检查”。这只作用于该终端启动的进程，不会给已经运行的桌面应用补上环境变量，也不是永久保存。希望长期复用且有桌面客户端时可用上面的设置表单；智能体不得把子进程里的变量视为当前宿主已经可读取。

## WorkBuddy：当前 GitHub 包的填写方法

1. 打开 **专家·技能·连接器 > 连接器 > 自定义连接器**，新增远程 MCP；若当前版本菜单名称有变化，寻找“连接器／自定义 MCP”，不要改用 Codex 的环境变量流程。
2. 地址填写 `https://www.babel.cc/mcp`，传输类型选择 `Streamable HTTP`。
3. 请求头名称填 `Authorization`，值填 `Bearer ` 加自己的 APIKey，Bearer 后有一个空格。保存并启用连接，按客户端提示重新打开项目会话。
4. 回复“已填写，请继续只读连接检查”。

GitHub 连接器包尚未上架 WorkBuddy 市场，所以当前不能要求用户去找其不存在的安装 Token 表单。只有通过支持完整连接器包的宿主／平台安装、并且实际出现表单时，才在 **巴别鸟 API Key** 密码项填写纯 APIKey（不加 Bearer）；该表单会自动组装请求头。

## 安装后没有打开页面

直接告诉智能体“打开巴别鸟密钥填写页面”。Codex 0.4.0 的安装智能体应运行助手并给出可点击入口；它是本机浏览器页面，不是原生安装密码框。只在实际无法运行页面时采用上述备用方法。

参考：[Codex MCP 配置](https://learn.chatgpt.com/docs/extend/mcp?surface=cli)、[Codex 插件安装引导](https://developers.openai.com/plugins/build/plugins)、[WorkBuddy 连接器](https://open.workbuddy.cn/docs/connector)。
