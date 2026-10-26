# 更新记录 / Changelog

## 0.5.1 — 2026-10-26（测试版 / prerelease）

- 发布 Today / Meta Muse 实验安装分流：使用平台确认的 Skills 目录或导入工具，凭据交由平台安全界面管理；不将云端 localhost 当作本机设置页。
- 新增 Today 中英文四步安装说明及可直接复制的 MCP 配置模板，明确“粘贴代码添加 → 下一步 → Token → 添加”的实际填写入口。
- Today 中国版网页账号已观察到两项技能安装和用户填 Key 后的“已连接”状态。自动弹窗目标未达成，首次连接采用手动步骤；目录工具、工程上传下载和跨会话自动同步仍待实测。
- Meta Muse 的原生凭据与连接器桥接仍未验收；两款个人智能体均保留实验标记。既有工程目录优先于新宿主默认目录。
- 保留六款桌面宿主的本地填写页流程，统一 GitHub 安装版本为 v0.5.1。详细证据见 [验证记录](VALIDATION.md)。

Today now has a bilingual manual setup guide and a ready-to-copy MCP template. China web-account testing observed both installed skills and Connected status after manual credential entry; automatic form opening, real project sync and cross-session triggers are not claimed. Today and Meta Muse remain experimental. Existing desktop setup flows and cloud project bindings are preserved.

## 0.5.0 — 2026-10-24（GitHub 测试版 / prerelease）

- 统一 GitHub 安装器支持 Codex、WorkBuddy、CodeBuddy CLI、Claude Code、Cursor、Gemini CLI，自动安装用户级 Skills 并打开本地 API Key 页面。
- 本地页支持中英文、错误后重试、当前宿主名称和成功后的下一步；用户只填写 Key，不必回聊天确认“已填写”。
- 新增私有配置适配，保留其他账号和设置；WorkBuddy 使用严格 JSON，不改写其生成的代理配置或权限审批状态。
- 为新增宿主补充项目规则和默认分区；跨产品续接继续复用已绑定的云端目录。
- 安装器保护已有自定义 Skill；修复 macOS 路径别名导致复制后的助手不启动。

The GitHub installer now supports six host adapters, installs user-level Skills, and opens a bilingual local API Key form. This distribution does not register a native plugin menu entry. See [the support matrix](docs/SUPPORTED_AGENTS.md) and [validation](VALIDATION.md) for exact test levels; WorkBuddy desktop approval and full agent testing remain distinct from the successful page connection check.

## 0.4.1 — 2026-10-24（测试版 / prerelease）

- 名称统一为「项目云端同步巴别鸟插件」，英文为 BabelBird Project Cloud Sync；增加中英文市场文案、英文使用说明和 WorkBuddy 密钥表单翻译。
- 修复 Git 子目录绑定漏用父仓库忽略规则；用户项目配置继续按规则同步。
- macOS/Linux 下载更新保留已有文件的普通权限位，避免 755/700/600 被改为 644。新文件支持明确指定的八进制权限；未知权限仍使用本机默认值。
- 统一首次连接说明，新增账号时保留旧连接和启用状态。
- 补充图标、市场审核用例、演示脚本、数据处理说明和上线待办。

This prerelease updates product naming and bilingual listing materials, respects Git ignores for subprojects, preserves permissions when downloading updates, and keeps existing account connections intact. New files can restore an explicitly known mode. Marketplace approval, WorkBuddy app testing and automatic restoration of unknown remote file modes are not claimed.

Historical validation remains in [VALIDATION.md](VALIDATION.md).
