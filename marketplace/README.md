# 插件市场上线材料 / Marketplace submission kit

版本：0.5.0。核对日期：2026-10-24。发布主体账号：bypassdesign-dev。本轮优先交付 GitHub 安装版，支持范围见 [智能体清单](../docs/SUPPORTED_AGENTS.md)。

本目录是准备材料，**不是已上架或已具备全部提交条件的声明**。GitHub 测试版可以独立安装；正式市场审核还有下列外部条件。

## 可直接使用的材料

| 材料 | 文件 |
| --- | --- |
| 中英文名称、短简介、完整介绍、使用示例 | [listing.md](listing.md) |
| Codex 审核的 5 个正向、3 个负向用例 | [review-cases.json](review-cases.json) |
| 实测结果与限制 | [../VALIDATION.md](../VALIDATION.md) |
| 本版更新说明 | [../CHANGELOG.md](../CHANGELOG.md) |
| 演示录制脚本 | [demo-script.md](demo-script.md) |
| 数据流、保留与用户控制说明 | [data-handling.md](data-handling.md) |
| 隐私声明及条款编写底稿，待运营方确认 | [policy-draft.md](policy-draft.md) |
| Codex 图标与包 | [../plugins/babelbird-cloud/assets/icon.svg](../plugins/babelbird-cloud/assets/icon.svg)、[../plugins/babelbird-cloud](../plugins/babelbird-cloud) |
| WorkBuddy 图标、双语表单与包 | [../workbuddy/babelbird-cloud](../workbuddy/babelbird-cloud) |
| 审核用公开示例工程 | [fixtures/demo-project](fixtures/demo-project) |

已有图标是通用云端上传图形，不宣称为巴别鸟官方商标。真实账号、API Key、传输地址和私人项目不得放入材料或公开包。

## OpenAI / Codex 提交前必须完成

1. **确认 API Key 认证接入方式。** [官方提交指南](https://developers.openai.com/plugins/deploy/submission#authentication-limitations) 当前明确：提交入口没有 API Key / Bearer token 输入流程，公开提交拒绝非空 server headers。当前包供 GitHub 本地安装，不能原样视为可提交的公开 MCP 包；须与 OpenAI 确认支持路径，或由巴别鸟服务方提供符合要求的 OAuth 接入。不能把受保护服务伪装成无需认证，也不能在包内嵌入 Key。
2. 在提交账号完成开发者／企业身份验证，确认提交权限。此插件需要本地文件和程序执行，还需向平台确认相应分发入口；未验证网页端能运行。
3. 由 babel.cc 域名管理方完成平台提供的域名验证。此仓库本身不能证明域名所有权。
4. 运营方确定主体、隐私联系渠道、实际保留期限与条款，正式发布 HTTPS 隐私政策和使用条款。当前底稿不能代替正式政策；manifest 尚未填写这两个 URL，避免指向未生效文本。
5. 创建独立审核账号及最小范围示例目录，私下填入平台审核表单，不使用当前用户账号。用此账号实际执行 [8 个用例](review-cases.json)，记录日期、预期和实际结果。
6. 按 [演示脚本](demo-script.md) 录制真实流程，提供审核可访问的视频链接。脚本不是已录制的视频。
7. 上传英文市场字段，按平台支持的 translations 导入中文副标题／描述，检查 30 字符的名称与短简介上限。桌面 GitHub 包继续显示用户指定的中文名称。
8. 解决平台实际扫描的 MCP 工具标注、认证和其他错误，再提交审核。此仓库不能替远端 MCP 服务修改工具元信息。

公开 MCP 包需五个正向和三个负向用例、演示视频及审核访问资料；具体字段见 [提交指南](https://developers.openai.com/plugins/deploy/submission)。当前包不包含虚构 demo URL、审核凭据或未核实的认证声明。

## WorkBuddy 提交前必须完成

1. 登录开发者账号并完成主体与品牌材料。接入选择 MCP + Skill、自填 Token 模式；`BABELBIRD_API_KEY` 与请求头占位符已匹配。
2. 在已登录 WorkBuddy 4.24.0+ 中实际验证市场安装、Token 表单、重启恢复、工程同步和跨平台续接。此前完整智能体测试停在需要登录，因此不能标记通过；0.5.0 GitHub 安装改用本地中英文页面，独立验证范围见 VALIDATION。
3. 按相同示例工程验证新增、更新、下载、冲突和失败后的保留行为；填写真实结果。
4. 将 `workbuddy/babelbird-cloud` 目录按 [连接器规范](https://open.workbuddy.cn/docs/connector) 提交审核。该包包含共用的本地页面助手，但不能把 GitHub 安装检查等同于市场审核通过。

## 打包边界

用户工程始终逐文件存储，**不压缩为 ZIP**。市场若要求 ZIP，压缩的是插件分发文件：Codex 包以 `plugins/babelbird-cloud` 为根，WorkBuddy 包以 `workbuddy/babelbird-cloud` 为根，包含隐藏清单目录。不要打包整个仓库、用户工程、宿主配置或凭据。本轮交付源目录和材料；认证与政策未就绪时不制作“已可提交”的误导性成品包。

## English readiness note

GitHub prerelease distribution is separate from marketplace approval. The kit includes bilingual listing copy, icons, eight review scenarios, sample files, release notes, a recording script and policy drafting inputs. OpenAI's current portal does not support API-key connections; confirm a supported authentication route first. Publisher identity, domain verification, approved policy URLs, a dedicated review account and a real walkthrough recording remain required. WorkBuddy installation and credential entry must still be tested in a logged-in app. No marketplace submission has been made.
