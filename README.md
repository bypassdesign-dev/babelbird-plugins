# 巴别鸟工程云存储插件 0.2.1

测试版，包含工程存储 Skill、首次设置 Skill、巴别鸟远程 MCP 配置，以及 Codex / Claude Code 安装入口。用户需要自己的巴别鸟 API Key。安装包不包含任何真实密钥。

当前已验证插件结构、Codex 原生识别和云端目录读取。配额查询默认跳过，超时不会阻塞连接检查或已授权的存储流程；工程上传／恢复尚未完成端到端验证。请按测试版使用，具体限制见 [VALIDATION.md](VALIDATION.md)。

## 从 GitHub 安装

仓库：<https://github.com/bypassdesign-dev/babelbird-plugins>。发布包位于仓库的 Releases 页面。

Codex 用户在终端执行：

```bash
codex plugin marketplace add bypassdesign-dev/babelbird-plugins --ref v0.2.1
codex plugin add babelbird-cloud@babelbird-local
```

首次使用发送：

> 使用 $babelbird-cloud:babelbird-setup 配置我的巴别鸟连接并执行只读检查。

Claude Code 用户在客户端执行：

```text
/plugin marketplace add bypassdesign-dev/babelbird-plugins
/plugin install babelbird-cloud@babelbird-local
```

以下章节说明凭据配置，以及从 ZIP 解压目录安装的方法。市场名称 `babelbird-local` 是稳定标识，通过 GitHub 安装时也保持一致。

## Codex 安装

解压整个分发包，进入含本说明及 `.agents` 文件夹的 `babelbird-plugin` 目录。在终端执行：

```bash
codex plugin marketplace add .
codex plugin add babelbird-cloud@babelbird-local
```

保持解压目录存在，方便本地市场读取与后续升级。以上命令需要支持 `codex plugin` 的版本。安装后重新打开会话并发送：

> 使用 $babelbird-cloud:babelbird-setup 配置我的巴别鸟连接并执行只读检查。

清单同时声明了自动设置 Skill，但本次验证的 Codex 版本没有返回该入口；请使用上面的明确调用方式。

首次使用会要求填写个人 API Key。Codex 适配器通过环境变量 `BABELBIRD_API_KEY` 读取密钥，Skill 引导填写不等于桌面客户端自动拥有一个密码表单。可通过自己的凭据管理器注入启动环境，或使用下列临时会话方式验证。

macOS / Linux 的 Bash 终端，逐行执行，提示时输入密钥：

```bash
read -r -s -p '巴别鸟 API Key: ' BABELBIRD_API_KEY
export BABELBIRD_API_KEY
codex
```

Windows PowerShell：

```powershell
$babelSecret = Read-Host '巴别鸟 API Key' -AsSecureString
$env:BABELBIRD_API_KEY = [System.Net.NetworkCredential]::new('', $babelSecret).Password
Remove-Variable babelSecret
codex
```

这会给新启动的 Codex CLI 提供凭据，变量随终端会话结束而消失。要长期复用，请用个人凭据管理器及启动器注入同名变量；真实值不应写入工程、插件或共享脚本。已运行的 Codex 桌面应用不会继承之后设置的变量，应通过宿主支持的启动环境配置后重新启动，并用只读检查确认。现有独立 MCP 的凭据读取器不会自动绑定到本插件。

## Claude Code 安装

在同一个分发包根目录启动 Claude Code，执行：

```text
/plugin marketplace add .
/plugin install babelbird-cloud@babelbird-local
```

需要支持插件 `userConfig` 的 Claude Code 版本。启用时会要求填写“巴别鸟 API Key”；该项必填且为敏感字段，由宿主保存。随后发送：

> 使用 babelbird-cloud 插件的 babelbird-setup 检查连接，只执行只读测试。

Claude Code 的适配配置已提供，本次没有运行该客户端进行实机安装验证。

## 使用

连接验证通过后，可以提出：

- “把这个工程保存到巴别鸟的研发／演示项目目录，创建一个新快照。”
- “从巴别鸟恢复刚才的工程快照到一个新文件夹，并校验内容。”
- “只保存我指定的交付文件到巴别鸟。”

已有独立版 Skill 或 MCP 时，先检查重复项；安装插件不会自动迁移旧连接的密钥。插件连接验证成功后，再按用户要求迁移旧配置。

## 内容与边界

`plugins/babelbird-cloud` 是实际插件根目录，两个宿主共享 `skills`。Codex 与 Claude Code 的清单分别引用自身的 MCP 配置，因此不会互相读取不兼容的认证字段。其他宿主可复用 Skill 内容，但需要按其规范接入 MCP。

工程保存使用独立 ZIP 快照，包含 SHA-256 清单与恢复说明，默认排除密钥和缓存。插件不提供后台同步或云端运行环境。

2026-10-22 的服务测试确认 `listFolder` 返回有效业务成功结果；`getUsageAndQuota` 在约 30 秒后结束响应流而没有业务结果。Skill 默认使用目录读取验证连接，不再等待配额查询；用户明确查询空间而遇到上述故障时，仅记录“配额未知，已跳过查询”，继续已授权的流程。401/403、目录读取失败、明确空间不足以及实际上传／下载错误仍正常处理。

当前工具说明已明确 `fileHash` 使用文件 MD5；实际 HTTP 上传方法、字段和完成响应仍待确认。目录读取通过不代表工程保存／恢复已实测成功。

验证范围和结果见 [VALIDATION.md](VALIDATION.md)。本包尚未发布到公共插件市场。

## 升级和维护

修改 `plugins/babelbird-cloud` 内的源文件并更新两个插件清单及市场条目的版本号，再按宿主的市场更新流程升级。不要将用户凭据加入源包。分发时只包含正式文件，排除系统同步生成的 `.www.babel.cc` 标记、缓存和任何凭据文件。

格式依据：[Codex 插件规范](https://developers.openai.com/plugins/build/plugins)、[Claude Code 插件规范](https://code.claude.com/docs/en/plugins-reference)。
