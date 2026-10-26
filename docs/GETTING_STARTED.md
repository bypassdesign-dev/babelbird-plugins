# 新手上手：把工程和文件记忆带到下一台设备

[English](#english) · [返回首页](../README.md) · [支持平台](SUPPORTED_AGENTS.md)

**项目云端同步巴别鸟插件，把智能体的本地项目／工程目录与一个巴别鸟云端目录绑定，在智能体工作期间拉取和保存文件。** 换电脑或换智能体时，继续使用同一个云端工程，恢复文件后接着工作。

## 它与 MCP 有什么不同

MCP 是智能体访问巴别鸟的工具接口，可以按要求查找、读取、上传或下载文件。只连接 MCP，不会自动知道哪个本地目录要保存，也不会自动执行工程同步。

本插件通过 MCP 传输文件，用配套 Skill 管理账号设置、工程绑定、拉取更新、上传修改和冲突处理。可以理解为：**MCP 提供文件工具，插件负责工程同步流程。** 它不会把云端挂载成磁盘，也不会在智能体关闭后继续监控文件。

## 第一次使用，只做三步

### 1. 让智能体安装

在 Codex、WorkBuddy 或其他已有安装适配的平台中发送：

```text
帮我安装 https://github.com/bypassdesign-dev/babelbird-plugins ，并连接我的巴别鸟账号。
```

智能体会处理安装位置和环境检查。默认安装包含 `babelbird-setup`（首次设置）和 `babelbird-project-cloud`（工程同步）两项完整 Skill，不用你手动寻找它们。

### 2. 在页面里填写 API Key

在自动打开的本地设置页填入巴别鸟 **APIKey**，点击“保存并连接”；没有打开时，点击智能体提供的填写链接。Key 只填在密码框，不发到聊天。已有有效连接会复用。

没有 Key 时，按 [巴别鸟官方图文说明](https://www.babel.cc/public/babelwiki/zh/mcp-integration.html) 在“设置 → API秘钥”创建应用，复制应用详情中的 APIKey，而不是 APP Key 或 APP Secret。默认流程需要能读取“个人文件”及访问目标目录的 Key；工程同步还需相应写入权限。

若提示重新打开会话，按提示操作以加载连接，不必再填写 Key。WorkBuddy 的第三方 MCP 权限需你在应用内批准。Today 的首次连接需按 [手动说明](../plugins/babelbird-cloud/skills/babelbird-setup/references/today-setup.md) 操作，不会自动弹出设置页。

### 3. 在要保存的工程中开启同步

```text
为当前工程启用巴别鸟自动同步。
开始修改前拉取更新，每批修改完成后上传，结束前检查同步结果。
```

仅安装或连接账号不会上传工程。启用后，Codex 新工程默认保存到 `个人文件/codex/工程名/`，WorkBuddy 为 `个人文件/workbuddy/工程名/`；其他平台使用对应平台分区。已有绑定或你指定的目录优先。

## 场景一：自动保存代码、文档和项目资料

在已启用同步的工程里正常让智能体工作即可。例如：

```text
修改这个项目的介绍文档，并按工程的巴别鸟同步规则保存。
完成后告诉我哪些文件已经同步，有没有失败或冲突。
```

宿主加载同步规则后，智能体在编辑前拉取、每批修改后上传、结束前复查。应用关闭时没有后台监控；外部程序改了文件但智能体尚未执行同步，也不能当作已经保存到云端。切换设备前，可以说：“检查当前工程的巴别鸟同步状态，完成尚未同步的文件。”

## 场景二：换电脑，下载原工程继续

先让原电脑完成同步。在新电脑安装并连接后，把下面的示例路径换成自己的云端工程：

```text
我要继续巴别鸟“个人文件/codex/网站改版”这个工程。
请恢复到一个新的本地目录，并继续绑定同一云端目录。
如遇已有本地文件或冲突，先报告，不要覆盖。
```

恢复后的文件保留原名和目录结构，不是 ZIP。需要当前端的实际文件读写和程序执行权限；不能把云端连接成功当作已经下载到电脑。

## 场景三：从 Codex 换到 WorkBuddy

在 WorkBuddy 安装并连接账号后，发送：

```text
继续使用巴别鸟“个人文件/codex/网站改版”这个工程。
不要在 workbuddy 目录新建副本；
请恢复文件并绑定原来的云端目录，开始修改前先检查云端更新。
```

“codex”只是首次建工程时的默认分区，不限制以后使用哪个智能体。换产品时保留原目录，才能继续同一份工程。

## 场景四：把 AI 的文件记忆一起保存

项目背景、约定、任务记录和记忆如果已经写入工程文件，且没有被同步规则排除，就可以随工程保存。你可以对原智能体说：

```text
请把本工程的重要背景、已确认约定和下一步任务整理到工程内的 PROJECT_MEMORY.md，并通过巴别鸟同步。
不要把 API Key 或账号凭据写进去。
```

恢复工程后，对新智能体说：

```text
先读取 PROJECT_MEMORY.md、README 和工程指令文件，了解已有约定，再继续工作。
如果有不适用于当前平台的指令，请指出。
```

这里的“AI 本地记忆保存”是**文件层面的保存与恢复**。聊天记录、模型临时上下文、应用私有数据库及工程目录之外的记忆不会自动迁移；新平台也未必会自动加载同名记忆文件，因此需要明确要求读取。不同平台的能力和指令格式仍可能不同。

## 支持范围与同步规则

| 平台 | 当前定位 |
| --- | --- |
| Codex | 已有安装适配；干净安装与重开会话后的实际 MCP 目录读取已验证 |
| WorkBuddy | 已有安装适配；本地填写页与云端目录检查通过，完整桌面智能体流程待验收 |
| CodeBuddy CLI、Claude Code、Cursor、Gemini CLI | 已有安装适配；客户端端到端验收未完成 |
| Today 中国版 | 实验适配；技能安装、手动填写和“已连接”已观察，完整工程同步待验收 |
| Today 国际版、Meta Muse 个人智能体 | 实验适配；登录后完整连接与工程同步未验收 |

完整平台与系统限制见 [支持清单](SUPPORTED_AGENTS.md) 和 [验证记录](../VALIDATION.md)。OpenClaw 等产品具备 MCP 能力，并不表示已有本插件安装适配。当前 GitHub 版为 0.5.1 测试版。

文件逐个同步，保留原目录结构；删除不自动传播，双方修改同一文件时保留冲突。Git 忽略和排除规则会影响哪些文件上传，工程配置仍按这些规则处理。插件密钥及宿主全局凭据不进入工程。同步发生在智能体任务期间，依赖宿主读取和遵循项目规则。

## 下载或单独安装 Skill

- [插件发布页](https://github.com/bypassdesign-dev/babelbird-plugins/releases/tag/v0.5.1)
- [下载 v0.5.1 源码 ZIP](https://github.com/bypassdesign-dev/babelbird-plugins/archive/refs/tags/v0.5.1.zip)
- [首次设置 Skill](../plugins/babelbird-cloud/skills/babelbird-setup)
- [工程同步 Skill](../plugins/babelbird-cloud/skills/babelbird-project-cloud)

下载 ZIP 是插件分发方式，不是工程同步方式。若手动安装 Skill，从 `plugins/babelbird-cloud/skills/` 导入两个完整文件夹，保留脚本、资源和引用文档，不要只复制 `SKILL.md`。由智能体确认宿主真正使用的 Skill 位置，并复用已有有效 MCP。一般用户使用上面的一句安装指令即可。

## English

**BabelBird Project Cloud Sync binds an agent's local project folder to one cloud folder so you can save work and continue on another device or agent.** MCP provides file-access tools; the plugin and Skills supply the sync workflow. Connecting MCP alone does not automatically sync a project.

### First use

1. Tell your agent: “Install https://github.com/bypassdesign-dev/babelbird-plugins and connect my BabelBird account.” It installs both setup and project-sync Skills.
2. Enter your raw BabelBird APIKey in the local setup page, then select **Save and connect**. Use the supplied link if it does not open. Get a key from the [official instructions](https://www.babel.cc/public/babelwiki/en/mcp-integration.html). Do not paste it in chat. The default flow requires Personal Files access and the intended project permissions. Follow any session-reload prompt; reuse saved credentials. WorkBuddy permissions require your approval. Today uses a [manual platform form](../plugins/babelbird-cloud/skills/babelbird-setup/references/today-setup.md#english).
3. In the intended project, ask: “Enable BabelBird sync for this project. Pull before editing, upload after completed batches, and check status before finishing.” Account setup alone does not upload files.

### Four useful scenarios

- **Save work:** ask the agent to edit project files and report the sync result. Once the host loads the project rules, sync runs around its work. Changes made while the agent is closed are not automatically watched.
- **Change computers:** finish syncing on the original computer. On the new computer, install and connect, then ask to restore the existing cloud project into a new local folder and retain the same binding. Report existing files or conflicts before overwriting.
- **Change agents:** a WorkBuddy session can continue `个人文件/codex/Website Redesign`. The `codex` folder is a default location, not a platform lock; do not create a second cloud copy for the same project.
- **Preserve file-based AI memory:** ask the first agent to save project background, decisions, and next steps into `PROJECT_MEMORY.md` without credentials, then sync it. After restoring, ask the new agent to read that file, README, and applicable project instructions before continuing.

File-based memory does not include chat history, transient model context, private application databases, or memory outside the project. Ignore rules still apply, and the new agent may need an explicit request to read the files. Files retain their names and structure without project ZIP archives. Concurrent edits remain conflicts; deletions do not propagate automatically.

Codex, WorkBuddy, CodeBuddy CLI, Claude Code, Cursor, and Gemini CLI have installation adapters with different validation levels. Today and Meta Muse remain experimental. See [supported platforms](SUPPORTED_AGENTS.md) and [actual validation](../VALIDATION.md). A host's MCP support is not by itself plugin compatibility. Local setup requires Node.js 20+ and a browser on the helper's machine; project sync needs workspace access and execution support.

The [v0.5.1 release](https://github.com/bypassdesign-dev/babelbird-plugins/releases/tag/v0.5.1) and [source ZIP](https://github.com/bypassdesign-dev/babelbird-plugins/archive/refs/tags/v0.5.1.zip) include both Skills. For manual installation, import the complete `babelbird-setup` and `babelbird-project-cloud` folders from `plugins/babelbird-cloud/skills/`, including scripts, assets, and references. Do not install only the SKILL.md files.
