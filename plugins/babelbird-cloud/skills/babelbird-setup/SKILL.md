---
name: babelbird-setup
description: Install or connect BabelBird, open its local API Key form, and verify the MCP connection. Use for GitHub plugin installation, first setup, missing API Key, or changing a connection, including 安装巴别鸟、填写APIKEY、打开密钥页面、首次连接.
metadata:
  version: "0.4.1"
---

# 巴别鸟首次设置

安装请求包含首次连接。用户只给 GitHub 链接并要求安装时，安装文件后主动继续本流程，不等待用户知道 Skill 名称。仅下载、离线安装或稍后配置时按原要求停止。

## Codex：自动打开一个输入框

1. 已有有效巴别鸟 MCP 连接时直接复用并做下方只读验证。没有密钥时运行随本 Skill 安装的助手。需要 Node.js 20+ 和可用的 `codex` 可执行文件；先核对版本与实际安装位置。不要读取或打印用户配置中的鉴权头。
2. 在本 `SKILL.md` 所在目录执行：

   ```bash
   node scripts/setup-codex.mjs --start
   ```

   使用绝对脚本路径也可以。助手自动打开默认浏览器并立即返回 JSON，其中 `url` 是本次临时填写入口。在回复中提供可点击的 **[填写 API Key](返回的完整 url)**，只说明“粘贴 API Key，点击保存并连接”。不要用教程、MCP 菜单、请求头或环境变量步骤代替此默认入口。没有密钥的用户可使用页面上的获取按钮。不要要求把密钥发到聊天。
3. `browserLaunch: unavailable` 时使用宿主的浏览器打开工具访问返回的同一 URL，仍保留可点击链接。无法打开时明确说明，不声称已弹窗。网页由本机临时服务提供，不能把远程主机的 127.0.0.1 链接当成本机入口；远程或无浏览器环境才转到 [备用填写方法](../babelbird-project-cloud/references/credential-entry.md)。如果找不到 `codex`，定位实际可执行文件后传 `--codex-bin`，不要让用户输入命令。
4. 页面等待填写时继续运行下面的有界等待，每次最多 25 秒；仍在 waiting/receiving/checking/saving 时继续等，直到成功、助手退出、十分钟过期或用户取消。关闭浏览器标签不会立即停止助手；用户明确取消时停止等待即可，助手到期退出。无需用户另发“已填写”。不要轮询配额或反复催促。

   ```bash
   node scripts/setup-codex.mjs --wait
   ```

   可用 `--status` 立即读取状态。`connected` 才表示助手已读取个人文件、列出一页并保存私有配置。错误显示在页面上，可原地重试；过期时重新 `--start` 获取新入口。
5. 助手在用户私有 Codex 配置中保存个人 MCP 连接，保留 Skill、其他连接及插件 MCP 开关。配置里同一密钥复用，不同账号不覆盖。不因助手环境中缺少变量就关闭旧连接；旧宿主可能持有另一个账号的凭据。使用返回的 `serverName` 验证新连接，不让其他未配置入口的警告混淆结果。不要修改插件缓存或把密钥写入工程。
6. 检查当前宿主是否已加载返回的 `serverName`。已加载就用实际 MCP 工具执行下方只读验证；尚未加载时准确说明“已保存并通过页面连接检查，请重启 Codex 一次以加载新连接”。不要把助手直连检查冒充当前会话工具已加载。重启后复用配置验证，不重新索要密钥。

页面若提示“密钥已保存，但无法记录安装进度”，或助手返回 `saved_status_error`，先检查实际连接配置并重启加载验证，不重新要求填写。状态查询为 `idle` 不能证明设置成功或失败；依据页面结果与实际 MCP 验证判断。

本助手只连接巴别鸟公有云，不接收自定义服务地址。私有化部署使用管理员确认的独立配置，不把其凭据送到公有云。

## 其他宿主

WorkBuddy 仍按 [填写入口](../babelbird-project-cloud/references/credential-entry.md) 使用自定义连接器；当前版本未实现 WorkBuddy 本地页面自动配置，不能运行 Codex 助手冒充适配。Claude Code 使用敏感配置项 `api_key`。

## 只读验证与后续

使用实际加载的工具 `getFileInfoByPath` 读取 `/个人文件`，确认业务成功、目录类型，再用返回的真实 ID 调用 `listFolder`，`pageIndex: 0, pageSize: 1`。协议根目录 `0` 不代表个人文件。必须核对 MCP `isError` 和业务结果，不能仅凭初始化或 HTTP 200 声称成功。

默认不调用 `getUsageAndQuota`。配额超时记录为未知并跳过；目录超时最多重试一次，401/403、目录权限失败和真实传输失败如实报告，不忽略。

只安装和连接时不上传工程。用户启用同步后进入 `babelbird-project-cloud`：Codex 默认 `/个人文件/codex/工程名/`，WorkBuddy 默认 `/个人文件/workbuddy/工程名/`，跨平台续接复用指定的原目录。
