# 支持的智能体与验证边界（0.5.1）

GitHub 安装命令为 `node install/install.mjs --host <id>`，要求 Node.js 20+。以下六款桌面宿主安装到用户 Skills 目录的是 `babelbird-setup` 与 `babelbird-project-cloud` 两项自包含 Skill，MCP 在本地密钥页验证通过后写入用户私有配置。此方式不注册原生插件菜单；原生 Codex / Claude Code 包仍保留。

## 已实现安装适配

以下为默认用户路径。配置目录环境变量可能改变实际位置，安装智能体应以脚本解析结果为准。

| 宿主 ID | 用户 Skills | MCP 配置 | 写入格式 |
| --- | --- | --- | --- |
| `codex` | `~/.codex/skills` | `~/.codex/config.toml` | Codex 配置接口，HTTP URL 与私有请求头 |
| `workbuddy` | `~/.workbuddy/skills` | `~/.workbuddy/mcp.json` | `mcpServers`、`type: http`、`url`、`headers` |
| `codebuddy` | `~/.codebuddy/skills` | 依序选首个已存在的 `~/.codebuddy/.mcp.json`、`~/.codebuddy/mcp.json`、`~/.codebuddy.json`；全不存在时创建首项 | `mcpServers`、`type: http`、`url`、`headers` |
| `claude` | `~/.claude/skills` | `~/.claude.json` | `mcpServers`、`type: http`、`url`、`headers` |
| `cursor` | `~/.cursor/skills` | `~/.cursor/mcp.json` | `mcpServers`、`url`、`headers` |
| `gemini` | `~/.gemini/skills` | `~/.gemini/settings.json` | `mcpServers`、`httpUrl`、`headers` |

配置器保留其他设置及连接。WorkBuddy 桌面严格解析 JSON，因此拒绝注释和尾逗号；其他 JSONC 适配路径保留已有注释。已存在相同有效配置时复用，不覆盖另一个账号。WorkBuddy 使用用户配置 `mcp.json`，不能把 `~/.workbuddy/.mcp.json` 缓存当作持久配置。第三方 MCP 权限必须在 WorkBuddy 应用内由用户批准，新增配置需要重启／重新打开会话。其他宿主也需核实实际工具加载，不能以文件存在或页面成功代替。

启用工程同步后，各宿主的新工程默认分区为 `个人文件/<id>/工程名/`。既有绑定和明确指定的云端目录优先。绑定保留 AGENTS.md；WorkBuddy / CodeBuddy 添加 `.codebuddy/rules`，Claude 添加 CLAUDE.md，Gemini 添加 GEMINI.md，Cursor 添加 `.cursor/rules/babelbird-sync.mdc`。自动同步依赖宿主实际加载规则。

## 依据与测试层次

Claude 配置和用户 Skills 依据 [官方 MCP 文档](https://code.claude.com/docs/en/mcp) 与 [Skills 文档](https://code.claude.com/docs/en/skills)。Cursor 依据 [MCP 文档](https://prod.cursor.com/docs/mcp) 与 [Skills 文档](https://cursor.com/help/customization/skills)。Gemini CLI 依据 [MCP 文档](https://geminicli.com/docs/tools/mcp-server/) 与 [Skills 文档](https://geminicli.com/docs/cli/skills/)。WorkBuddy / CodeBuddy 路径还参考本机 WorkBuddy 5.2.5 加载器的检查；此检查不代替客户端端到端运行。

分开报告四类证据：仓库适配测试、本地页面检查、真实云端读写、宿主内工具加载和任务执行。具体已通过项见 [VALIDATION.md](../VALIDATION.md)。WorkBuddy 完整智能体流程曾因登录受阻；CodeBuddy CLI、Claude Code、Cursor、Gemini CLI 未完成本次客户端端到端验证。未安装的客户端不能以适配测试推定实机通过。

## 待适配路线

### 个人智能体实验适配

0.5.1 发布版包含实验宿主 `muse`（Meta Muse 个人智能体，不是 Muse Code）和 `today`。安装需平台提供的 Skills 导入工具，或先确认其 Skills 绝对目录后传入 `--skills-dir`。它们通过平台原生安全界面收集密钥，不能复用桌面 localhost 页面。新工程默认分区为 `个人文件/muse/工程名/` 和 `个人文件/today/工程名/`，已有目录优先。

**这两款仍为实验适配，未完成工程同步端到端验收。** Today 中国版网页账号已观察到两项技能安装、手动 Token 表单和“已连接”状态；安装后自动弹窗尚未实现，请使用 [Today 手动安装说明](../plugins/babelbird-cloud/skills/babelbird-setup/references/today-setup.md)。Today 内目录工具、上传下载和跨会话触发仍待验收。Muse 的凭据表单和自定义连接器桥接均待实测。详情及依据见 [个人智能体状态](PERSONAL_AGENTS.md)。

### 其他候选

以下产品尚没有安装器 host ID，不能把其他宿主配置硬套过去：

| 产品 | 尚未实现的原因与下一步 |
| --- | --- |
| VS Code / GitHub Copilot | 用户 profile、工作区和 CLI 配置位置不同；需分别确认路径、Skill 发现与凭据生命周期后实现适配。 |
| Cline CLI 与 IDE 扩展 | 两种运行形态的配置和加载行为需要分别核对，尚未实现并验证统一安装流程。 |
| Roo Code | 需验证扩展侧用户配置、Skills 加载和权限提示，尚无对应适配与实机验证。 |
| OpenCode | 配置格式与能力需按明确版本锁定并测试，尚未提供版本化适配。 |
| Windsurf / Devin | 产品命名与入口变化需要先确认实际产品、版本和配置合同，暂不声明兼容。 |

这些项目属于后续路线，不计入 0.5.1 的已支持安装列表。在这些产品中发起安装时，应说明具体缺失适配，不猜写配置，不默认退回手工字段教程并宣称安装完成。
