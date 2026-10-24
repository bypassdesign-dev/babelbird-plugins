# BabelBird Project Cloud Sync 0.4.1

[简体中文](README.md) · [Marketplace preparation](marketplace/README.md) · [Release notes](CHANGELOG.md)

After setup, automatically sync local Codex/WorkBuddy project files to BabelBird and sync them back when you switch devices or AI agent platforms.

The Chinese product name is **项目云端同步巴别鸟插件**. This is a prerelease. Files retain their original names and folders; projects are not compressed into ZIP archives.

## Install in Codex

Send this to Codex:

> Install https://github.com/bypassdesign-dev/babelbird-plugins/tree/v0.4.1 and help me connect my BabelBird account.

The installing agent opens a temporary local API Key page. Paste your key into the password field and click **保存并连接 (Save and connect)**. The page checks access to Personal Files and saves a private Codex connection. If the browser does not open, use the link supplied by the agent. Restart Codex once if it has not loaded the new connection.

The current local page is in Chinese. Ask your agent to guide you in your preferred language. The plugin's listing copy and WorkBuddy credential schema include Chinese and English.

Get your own APIKey from **Settings > API keys** in BabelBird; copy the APIKey shown on the application details page, not APP Key or APP Secret. See the [official illustrated guide](https://www.babel.cc/public/babelwiki/zh/mcp-integration.html). Grant read/write access to the intended project folder. Do not post the key in chat or in GitHub issues.

For installing agents: read [INSTALL.md](INSTALL.md), install the package, launch the bundled setup helper and wait for its result. Downloading the repository alone does not complete setup. Node.js 20+, a compatible Codex configuration API and a browser on the same machine are required.

## Enable synchronization

Ask: “Enable BabelBird sync for this project.” Connecting the account alone does not bind or upload a project.

- New Codex projects use `/个人文件/codex/<project>/`.
- New WorkBuddy projects use `/个人文件/workbuddy/<project>/`.
- To continue on another device or agent, select the existing cloud folder and download into a new local folder. An existing binding takes precedence over the default host folder.
- Sync runs before agent edits, after completed batches and before the task finishes, when the host loads the project rules. It is not a background file watcher or a mounted cloud drive.

Local-only changes upload; remote-only changes download. Concurrent edits are preserved as conflicts. Deletions do not propagate automatically. Each transferred file is verified before its local baseline advances.

Project configuration files, including .mcp.json, may be stored in the user's selected cloud project. Git ignore rules apply even when the bound project is a repository subdirectory. Host-wide credentials and the plugin's API Key remain outside the project; the default sensitive-file and cache exclusions still apply.

On macOS/Linux, updates preserve an existing file's permission bits. For a newly downloaded file, the helper accepts a known permission such as `"mode":"0755"`; otherwise it uses the local default. The cloud protocol does not preserve POSIX modes, so unknown executable bits cannot be restored automatically on a new device. Windows ACLs are not synchronized.

## WorkBuddy and Claude Code

[WorkBuddy's connector package](workbuddy/babelbird-cloud/README.md) supplies Chinese/English metadata, a required password field and matching MCP token references. The connector has not been submitted to the WorkBuddy market. GitHub installations currently use a custom connector plus project skills; the Codex setup helper must not be used for WorkBuddy. WorkBuddy installation and its native credential form have not been validated in the app.

Claude Code uses the packaged sensitive `api_key` setting. Its installation is also not validated in the app.

## Status and support

Read [VALIDATION.md](VALIDATION.md) for actual checks and limitations. Large batches have historically encountered MCP 403 errors whose cause remains unresolved. Operations are per-file, without a cross-device lock or an atomic project commit.

[Report a problem](https://github.com/bypassdesign-dev/babelbird-plugins/issues) with the host/version, a redacted error and reproduction steps. Never include API keys, signed transfer URLs or private project files.

GitHub distribution and marketplace approval are separate. See the [submission checklist](marketplace/README.md) for remaining platform and publisher requirements.
