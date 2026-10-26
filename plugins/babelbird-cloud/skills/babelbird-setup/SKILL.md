---
name: babelbird-setup
description: Use when installing BabelBird from GitHub, setting up its API Key, changing a connection, or checking MCP access, including 安装巴别鸟、填写APIKEY、首次连接、Muse 和 today.ai 个人智能体接入.
metadata:
  version: "0.5.0"
---

# 巴别鸟首次设置

用户通过 GitHub 链接要求安装时，文件安装后主动继续连接，不等待用户知道 Skill 名称。只下载、离线安装或稍后配置时尊重范围。GitHub 安装是用户级 Skills + MCP 组合，不注册原生插件菜单。

## 个人智能体分流

实际产品是 Meta Muse **个人智能体**或 today.ai 时，先读 [平台原生连接](references/personal-agents.md)，使用 `muse` / `today` 实验适配。由平台安全界面收集 API Key，不走下面的本地页面流程，不套用 Muse Code 配置。必须核实 Skills 发现、连接器能力与真实目录读取；当前尚未完成两款产品的登录后端到端验收。

## 自动打开一个密码框

1. 识别实际宿主 ID：`codex`、`workbuddy`、`codebuddy`、`claude`、`cursor` 或 `gemini`。检查当前已加载的巴别鸟 MCP，有效时直接复用并只读验证，不重复索要 Key。安装器写入的 `installed-host.json` 可供核对；不要按模型名猜宿主。需要 Node.js 20+，Codex 还需要可用的 Codex 可执行文件，由智能体定位。
2. GitHub 安装器已经返回 `url` 时直接使用，不再启动第二个页面。否则在本 SKILL.md 所在目录执行（将占位符替换为实际 ID）：

   ```text
   node scripts/setup-host.mjs --host <id> --start
   ```

   也可执行安装器返回的绝对 `setupScript`。脚本随 Skill 安装，不依赖临时克隆目录。助手自动打开默认浏览器，并返回本次临时 `url`；在对话中也给出 **[填写 API Key](返回的完整 URL)**。中英文页面只有一个密码框，用户粘贴 Key 并点击“保存并连接 / Save and connect”。获取密钥按钮指向官方入口。不要要求把密钥发到聊天，不用菜单、请求头或教程代替默认页面。
3. `browserLaunch: unavailable` 时，通过宿主浏览器工具打开同一个 URL 并保留可点击链接。页面与浏览器必须在同一台电脑；不能把远程主机的 127.0.0.1 当成本机。无法打开时准确说明，才转到 [备用填写方法](../babelbird-project-cloud/references/credential-entry.md)。Codex 可执行文件无法找到时，由智能体定位并传 `--codex-bin`，不把命令工作交给新用户。
4. 自动运行有界等待，每次最多 25 秒；waiting / receiving / checking / saving 时继续等待，直至 connected、助手退出、十分钟过期或用户取消。无需用户另发“已填写”，不反复催促或查询配额。

   ```text
   node scripts/setup-host.mjs --host <id> --wait
   ```

   `--status` 可立即查询。关闭标签页不等于停止助手；用户取消时停止等待，助手到期退出。过期后需要再次填写时重新 `--start`。`connected` 表示个人文件读取及一页列表成功后，私有配置已保存；页面错误可原地重试。
5. 助手将连接保存到实际宿主的用户私有配置，保留其他设置、账号、Skill 和启用状态。相同配置复用，不覆盖不同账号。不打印鉴权头，不把 Key 写入项目、安装包或命令历史，不修改生成缓存。WorkBuddy 默认写 `~/.workbuddy/mcp.json`，不是 `~/.workbuddy/.mcp.json`。
6. 使用返回的 `serverName` 检查当前宿主是否已加载。已加载就用实际 MCP 工具做下方只读验证；未加载则说明“已保存并通过页面检查，请重启当前宿主或重新打开会话以加载连接”。重启后复用凭据，不能重新要求填写。WorkBuddy 第三方 MCP 权限必须由用户在应用内批准，不修改设置来自动批准。页面成功与当前会话工具可用是两个状态，分别报告。

若返回 `saved_status_error` 或页面提示已保存但无法记录进度，先检查实际连接与宿主加载，不重新索要 Key。`idle` 本身不能证明成功或失败。助手只连接公有云 `https://www.babel.cc/mcp`，私有化部署必须使用管理员确认的独立地址，不把私有化密钥发到公有云。

## 只读验证与后续

使用实际工具 `getFileInfoByPath` 读取 `/个人文件`，确认业务成功与目录类型，再用真实 ID 调用 `listFolder`，`pageIndex: 0, pageSize: 1`。协议根目录 `0` 不代表个人文件。核对 MCP `isError` 和业务结果；空目录成功有效，HTTP 200 或工具列表不能替代验证。

默认跳过 `getUsageAndQuota`。目录读取超时最多重试一次，401/403、权限失败和真实传输失败如实报告；配额超时不证明密钥失效。

仅安装连接时不上传、扫描或绑定工程。用户启用同步后进入 `babelbird-project-cloud`：新工程默认 `个人文件/<host>/工程名/`，按实际宿主使用对应分区；既有绑定或用户指定目录优先，跨设备和跨智能体继续原目录。任务编辑前、每批修改后、结束前同步，不提供常驻后台服务。
