# 项目云端同步巴别鸟插件 0.5.0

[English](README.en.md) · [支持的智能体](docs/SUPPORTED_AGENTS.md) · [更新记录](CHANGELOG.md)

配置插件后可以把codex/workbuddy的本地项目/工程文件自动同步到巴别鸟网盘，切换设备或智能体产品后也能同步回来。

英文名称：**BabelBird Project Cloud Sync**。0.5.0 是 GitHub 测试版，安装适配支持 Codex、WorkBuddy、CodeBuddy CLI、Claude Code、Cursor 和 Gemini CLI；适配支持不等于每款客户端均已完成实机端到端验证，实际范围见 [验证记录](VALIDATION.md)。

## 只需一句安装指令

把这一句交给正在使用的智能体：

> 帮我安装 https://github.com/bypassdesign-dev/babelbird-plugins ，并连接我的巴别鸟账号。

智能体识别当前宿主、获取 v0.5.0，安装两项完整 Skill，并自动打开本机的中英文设置页。你只需在一个密码框中粘贴 API Key，点击“保存并连接 / Save and connect”。没有密钥时，点击页面上的获取入口。无需把密钥发到聊天，也无需回复“已填写”。

浏览器没有自动打开时，点击智能体提供的“填写 API Key”链接。页面和浏览器必须运行在同一台电脑；安装需要 Node.js 20+。智能体会检查连接并保存到用户私有配置。如果当前客户端尚未加载新配置，按提示重启或重新打开会话，已有密钥直接复用。WorkBuddy 的第三方 MCP 权限需要你在应用内批准；插件不会自动批准。

**给安装智能体：**先读 [INSTALL.md](INSTALL.md)。默认运行 `node install/install.mjs --host <id>`，分享返回的 URL，并通过返回的 `setupScript` 传入 `--host <id> --wait` 自动等待结果。不要只下载仓库就结束，不把手工 MCP 配置作为默认步骤。用户明确指定 ref 时保留该 ref；正式默认固定 v0.5.0，发布前验证使用当前测试 ref。

GitHub 安装器安装的是**用户级 Skills + MCP 组合**，不会在宿主原生插件菜单中注册插件。仓库仍保留 Codex / Claude Code 原生插件包和 WorkBuddy 连接器源码。原生市场审核与本次 GitHub 发布是独立流程。

## 连接之后启用工程同步

对智能体说：“为当前工程启用巴别鸟自动同步。”仅连接账号不会上传或绑定工程。

| 实际宿主 | 新工程默认目录 |
| --- | --- |
| Codex | `个人文件/codex/工程名/` |
| WorkBuddy | `个人文件/workbuddy/工程名/` |
| CodeBuddy CLI | `个人文件/codebuddy/工程名/` |
| Claude Code | `个人文件/claude/工程名/` |
| Cursor | `个人文件/cursor/工程名/` |
| Gemini CLI | `个人文件/gemini/工程名/` |

已经绑定或明确指定的云端目录始终优先。换设备或换智能体继续同一工程时复用原目录，例如 WorkBuddy 可以继续使用 `个人文件/codex/网站改版/`。文件保留原名和目录结构，不打包成 ZIP。

宿主加载项目规则后，智能体在任务编辑前拉取更新、每批修改完成后上传、结束前复查。这是任务期间的自动同步；应用关闭后不会常驻监控，也不会把云端目录挂载成本地磁盘。绑定保存在本地 `.babelbird-sync.json`，共同基线保存在 `.babelbird-sync-state.json`，都不含密钥且不上传。

本地单侧修改上传，云端单侧修改下载；双方不同的修改保留并报告冲突，删除不自动传播。断网保留本地改动和基线，恢复后重新比较；部分失败不会报告整体成功。工程自身的配置文件可保存在指定云端工程，仍遵循 Git 忽略及敏感文件排除规则。宿主全局凭据和本插件密钥不进入工程。

## API Key 与现有连接

参照 [巴别鸟官方教程](https://www.babel.cc/public/babelwiki/zh/mcp-integration.html)，在“设置 > API秘钥”创建应用，复制应用详情里的 **APIKey**，不是 APP Key 或 APP Secret。为目标工程目录配置所需读写权限；默认个人文件目录必须在授权范围内。

已加载的有效 MCP 连接先复用并只读验证，不重复打开密钥页。新输入的 Key 先通过个人文件读取与一页目录列表检查，再保存到用户私有配置。页面成功不表示当前会话已经加载 MCP；智能体分别报告。默认跳过配额查询，不上传测试文件。只有远程／无本机浏览器等限制才使用 [备用填写方法](plugins/babelbird-cloud/skills/babelbird-project-cloud/references/credential-entry.md)。

## 适配与验证边界

各宿主安装路径、配置格式、权限和待适配产品见 [支持的智能体](docs/SUPPORTED_AGENTS.md)。安装器保留已有设置，不覆盖没有安装回执或本地修改过的同名 Skill；遇到此情况由智能体保留、比较并处理，避免让新用户判断技术字段。

测试和真实云端验证范围以 [VALIDATION.md](VALIDATION.md) 为准。WorkBuddy 完整智能体流程曾受登录状态阻塞，其他新增宿主尚未完成客户端端到端测试。历史长批量 MCP 调用出现过原因未确定的 403；遇到失败保留进度并报告待同步项。逐文件更新不提供全工程原子提交或跨设备锁，切换设备前应完成当前端同步。

## 开发与分发

运行 `node --test tests/*.test.mjs` 检查仓库测试。同步核心和引用文档在两个分发包中保持一致；首次设置脚本随 Skill 自包含分发，不依赖临时克隆目录。原生包说明见 [WorkBuddy](workbuddy/babelbird-cloud/README.md) 和 [市场准备](marketplace/README.md)。

[报告问题](https://github.com/bypassdesign-dev/babelbird-plugins/issues)时附宿主版本、脱敏错误及复现步骤，不附 API Key、签名传输 URL 或私有文件。
