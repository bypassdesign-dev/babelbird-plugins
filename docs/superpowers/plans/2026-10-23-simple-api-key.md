# Simple API Key Setup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Install the Codex plugin, open one local API Key form automatically, verify and save the connection, test it in a real browser and fresh Codex session, then publish v0.4.0.

**Architecture:** A dependency-free Node.js helper serves a temporary loopback form. It checks BabelBird via short MCP requests and saves the credential using Codex's structured configuration API, preserving unrelated settings. The onboarding Skill launches the helper and reads its non-secret completion status.

**Tech Stack:** Node.js 20+, native HTTP/fetch, HTML/CSS/JavaScript, Codex app-server, node:test.

**Spec:** ../specs/2026-10-23-simple-api-key-design.md

## Global Constraints

- One required password input, automatic browser opening and a clickable fallback link.
- Codex only for the new automatic form; preserve the existing WorkBuddy/Claude paths.
- No API Key in arguments, logs, project files, or public artifacts; fixed official HTTPS endpoint, no credential forwarding on redirects.
- Loopback binding, per-session token, exact Host/Origin checks, bounded body/time, ten-minute lifetime; no permanent daemon.
- Read-only directory verification, no quota query or cloud writes.
- Preserve existing connections; use version-checked native config writes and owner-only file permissions.

## Review Focus

1. A second account or existing same-name server must survive setup (Task 1 preservation tests).
2. A successful transport with failed business result must not appear connected (Task 1 protocol tests).
3. Other local web pages, wrong Host/Origin, or a replay after success must not save a key (Task 2 request tests).
4. Duplicate clicks, network failure and config-version races must leave an actionable retry state (Tasks 1–2).
5. Agent installation from a stale GitHub page must not be reported as current onboarding success (Task 3 fresh-link comparison).

### Task 1: Connection and private configuration

**Files:** create `plugins/babelbird-cloud/skills/babelbird-setup/scripts/mcp-check.mjs`, `codex-config.mjs`; test `tests/setup-core.test.mjs`.

**Interfaces:** `verifyConnection(apiKey, options?) -> {directoryRead:true,listRead:true}`; `saveCodexConnection(apiKey, options?) -> {serverName,reused}`. Injectable endpoint/fetch/RPC dependencies are for module tests only, never accepted from the page or CLI.

- [ ] Write failing tests for JSON/SSE MCP success, wrong business status, 401/403, timeout/closed stream, and no redirects.
- [ ] Implement bounded MCP initialize/initialized/tools-call reads against the official endpoint.
- [ ] Write and run failing native config integration tests with an isolated home and fake keys: preserve comments/unrelated settings, same-key reuse, different-account name collision, private mode.
- [ ] Implement configuration via app-server `config/read` and `config/batchWrite`, using expected user-layer version and only affected keys. Reject unsafe symlink files and expose sanitized failures.
- [ ] Run `node --test tests/setup-core.test.mjs`; expected all pass. Commit the core.

### Task 2: Local form, lifecycle and installation instructions

**Files:** create `scripts/setup-codex.mjs`, `scripts/setup-server.mjs`, `assets/setup.html`, `assets/setup.css`, `assets/setup.js` under the setup Skill; create `DESIGN.md`; test `tests/setup-page.test.mjs`. Update README, INSTALL, setup Skill/references, manifests and matching WorkBuddy reference copies.

**Interfaces:** `startSetup({checkConnection,saveConnection,onComplete,ttlMs}) -> {url,close}`. CLI `--start` returns immediately with `{status,url,expiresAt}` after a detached temporary helper is ready; `--status` returns only setup state. The agent displays the returned URL and waits for the user.

- [ ] Write failing HTTP tests for one required password input, inaccessible wrong token/origin/host, body limits, retry after failure, duplicate submissions, completion replay and expiry.
- [ ] Implement the form and server against DESIGN.md; local system fonts, no external assets or telemetry, accessible label/live status/keyboard focus and responsive light/dark styles.
- [ ] Implement default browser opening on macOS/Linux/Windows, automatic helper termination, private non-secret status and reuse of a live setup session; browser-opening failure still returns the clickable URL.
- [ ] Update Skill and INSTALL to invoke the helper automatically, never substitute a tutorial or manual MCP fields as the default; document reloading and verify actual host MCP after it loads.
- [ ] Run `node --test tests/*.test.mjs`; expected all pass. Commit the feature and v0.4.0 metadata.

### Task 3: Real acceptance, review and GitHub release

**Files:** update `VALIDATION.md`; produce local evidence and release notes without credentials.

- [ ] Use a real browser on the shipped page; submit empty and invalid input, then the previously authorized real key, confirm cloud reads and saved private config.
- [ ] Start a fresh Codex installation conversation with no Babel credential, confirm automatic form launch, complete it, reload and verify actual MCP tools. Compare original README URL separately from the new versioned entry.
- [ ] Run one fresh whole-branch reviewer on implementation, security, tests and observed UI evidence; fix material findings with regression tests.
- [ ] After local acceptance, push a candidate branch for GitHub-link verification; publish main/tag/release only after the candidate flow passes. Preserve actual limitations in validation and release notes.
- [ ] Remove copied test login credentials and test secrets, verify release content/version and link the GitHub release.
