# 验证记录

日期：2026-10-21。插件版本：0.2.0。测试环境：macOS 14.8.7，Codex 0.162.0-alpha.17.2。

## 已执行

- 使用本机 Codex app-server 的 `plugin/read`，直接读取分发包的 `.agents/plugins/marketplace.json`。返回可用插件 `babelbird-cloud@babelbird-local`，本地版本 `0.2.0`，认证策略 `ON_USE`。
- 原生读取结果识别了两个 Skill：`babelbird-cloud:babelbird-project-cloud` 和 `babelbird-cloud:babelbird-setup`；识别了 MCP 服务 `babelBird`。
- 两个 Skill 均通过 Codex skill-creator 的 `quick_validate.py` 格式校验；六个 JSON 文件通过 JSON 解析。
- 分发检查核对组件路径、相对文档链接、两个宿主的凭据引用、归档 CRC 和源文件字节一致性；扫描当前用户测试密钥是否出现在包内。
- 分发清单仅纳入正式文件，排除同步程序创建的 `.www.babel.cc` 标记和缓存。

原生读取没有安装插件或改动用户插件启用状态。自动设置字段按官方文档声明，但当前客户端返回 `onboardingSkill: null`，因此交付说明提供显式调用首次设置 Skill 的入口。

## 凭据流程检查

- 首次设置和工程存储 Skill 都要求未配置时先填写用户自己的 API Key。
- Codex 配置仅含 `bearer_token_env_var: BABELBIRD_API_KEY`，需要实际客户端进程读取该变量。终端临时输入不等于永久保存，也不会修改已运行桌面应用的环境。
- Claude Code 配置使用 `userConfig.api_key`，声明 `required: true` 和 `sensitive: true`；请求头只引用 `${user_config.api_key}`。
- 已有凭据直接复用；一般超时不触发反复索要密钥。没有收到业务结果时不声称连接通过。

## 未验证范围

- 未在本机安装并启用本插件，以避免与已有独立巴别鸟 MCP 连接重复；已验证的是原生插件发现和内容读取。安装后仍须执行首次设置。
- 本机未安装 Claude Code，未做该客户端的安装或凭据弹窗实测；其适配配置依据官方格式提供。未在 Windows / Linux 上实机运行。
- 此前真实服务测试完成 MCP 初始化和 8 个工具发现；只读 `getUsageAndQuota` 未返回有效业务结果，出现超时或流关闭。本次封装未重复调用云端业务，也未执行写入。
- 上传哈希算法、HTTP 方法、请求体和完成响应尚未确认，工程上传／恢复端到端验证未通过。这是现有服务验证的阻塞，不应被“插件可识别”替代。

## 重新验证

Codex 安装后调用 `babelbird-cloud:babelbird-setup`，填入个人凭据并完成只读检查。Claude Code 可先运行 `claude plugin validate ./plugins/babelbird-cloud` 再安装。取得上传协议并获用户的测试文件授权后，才能做上传、下载回读和 SHA-256 比对。
