# BabelBird Project Cloud Sync 0.5.1

[简体中文](README.md) · [Supported agents](docs/SUPPORTED_AGENTS.md) · [Release notes](CHANGELOG.md)

**Today users: follow the [Today setup guide](plugins/babelbird-cloud/skills/babelbird-setup/references/today-setup.md#english).** First-time connection requires manually pasting a ready-made configuration and entering your API Key. Automatic form opening was not achieved. Skills installation and Connected status were observed on a China web account; project sync remains unverified. Meta Muse remains experimental. See [status and evidence](docs/PERSONAL_AGENTS.md).

After setup, automatically sync local Codex/WorkBuddy project files to BabelBird and sync them back when you switch devices or AI agent platforms.

Chinese product name: **项目云端同步巴别鸟插件**. This is a GitHub prerelease. Installation adapters cover Codex, WorkBuddy, CodeBuddy CLI, Claude Code, Cursor and Gemini CLI; adapter support does not mean every client has passed end-to-end testing.

## What this plugin is for

**Sync an agent's local project folder to BabelBird and continue the same work on another device or agent.** Save code and documents, restore projects on a new computer, continue a Codex project in WorkBuddy, and preserve project knowledge or AI memory written into files.

MCP supplies cloud file-access tools. This plugin and its Skills manage project bindings, downloads, uploads, and conflicts. Connecting MCP alone does not enable automatic project sync.

File-based AI memory means eligible project notes, instructions, task records, and memory files. It does not automatically migrate chat history, transient model context, or private application databases. Ask the destination agent to read the restored files before continuing.

Start with **[the beginner guide and four use cases](docs/GETTING_STARTED.md#english)** for installation, API Key entry, enabling sync, and restoring an existing project.

## Install with one instruction

Tell your current agent:

> Install https://github.com/bypassdesign-dev/babelbird-plugins and connect my BabelBird account.

For Codex, WorkBuddy, CodeBuddy CLI, Claude Code, Cursor and Gemini CLI, the agent identifies its host, checks out v0.5.1, installs two complete skills and opens a local setup page with Chinese and English text. Paste your API Key into its single password field and click **Save and connect**. The page includes a link to get a key. Do not send your key in chat; you do not need to reply “done.”

If the browser does not open, use the link supplied by the agent. Node.js 20+ and a browser on the same machine as the helper are required. The helper verifies access before saving private user configuration. Restart the host or reopen its session if it has not loaded the new connection. WorkBuddy may require you to approve third-party MCP permissions in the app; the installer does not approve them for you.

For installing agents: follow [INSTALL.md](INSTALL.md) and route by host. Today uses the manual guide above; Meta Muse uses its experimental guide. For the six desktop hosts, run `node install/install.mjs --host <id>`, share the returned URL and poll the returned `setupScript` with `--host <id> --wait` until connected, cancelled, expired or closed. Each wait lasts at most 25 seconds. Honor an explicitly requested ref; otherwise pin v0.5.1. Before the release tag exists, validate against the current test ref.

The GitHub installer provides a **user-level Skills + MCP bundle**. It does not register a native plugin-menu entry. Native Codex / Claude Code packages and WorkBuddy connector sources remain available as separate distribution options.

## Enable project sync

Ask: “Enable BabelBird sync for this project.” Account setup alone does not bind or upload a project.

New projects use `个人文件/<host>/<project>/`, where host is `codex`, `workbuddy`, `codebuddy`, `claude`, `cursor` or `gemini`. An existing binding or explicitly selected cloud folder takes precedence. To continue across devices or agents, reuse that cloud folder and restore into a new local directory.

Files keep their original names and folder structure; no ZIP archive is created. Once project rules are loaded, sync runs before agent edits, after completed batches and before task completion. It is not a background daemon or a mounted drive. Local binding and baseline files do not contain credentials and are excluded from uploads.

Local-only changes upload; remote-only changes download. Concurrent changes are preserved as conflicts; deletions do not propagate automatically. Offline edits and baselines are retained. Partial failure is reported accurately. Git ignore and sensitive-file exclusions apply; host credentials and the plugin API Key stay outside the project.

## Credentials and support

Get your APIKey from **Settings > API keys > application details** in BabelBird, not APP Key or APP Secret. Grant access to the intended folder. See the [official guide](https://www.babel.cc/public/babelwiki/zh/mcp-integration.html).

Reuse an existing loaded, valid MCP connection. For the six desktop hosts, the local page reads Personal Files and lists one page before saving private configuration. Today saves credentials through its platform form and then needs a separate directory check in a Today conversation. A successful form does not prove the current host session has loaded MCP; the agent checks those states separately. Quota queries and test uploads are not part of default setup. [Manual entry](plugins/babelbird-cloud/skills/babelbird-project-cloud/references/credential-entry.md) is a fallback for environments unable to run the local page.

The installer refuses to overwrite unmanaged or locally modified same-name skills. The agent preserves and resolves these files without handing technical decisions to a novice user.

See [supported agents](docs/SUPPORTED_AGENTS.md) for paths and planned adapters, and [VALIDATION.md](VALIDATION.md) for actual checks. WorkBuddy's full agent flow was blocked by login; other newly supported hosts have not completed client end-to-end testing. Historical large MCP batches encountered unresolved 403 errors. Transfers are per-file, without an atomic project commit or cross-device lock.

Run `node --test tests/*.test.mjs` for repository checks. [Report an issue](https://github.com/bypassdesign-dev/babelbird-plugins/issues) with host version, redacted errors and reproduction steps; never include keys, signed transfer URLs or private project files.
