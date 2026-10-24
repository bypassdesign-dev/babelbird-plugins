# 更新记录 / Changelog

## 0.4.1 — 2026-10-24（测试版 / prerelease）

- 名称统一为「项目云端同步巴别鸟插件」，英文为 BabelBird Project Cloud Sync；增加中英文市场文案、英文使用说明和 WorkBuddy 密钥表单翻译。
- 修复 Git 子目录绑定漏用父仓库忽略规则；用户项目配置继续按规则同步。
- macOS/Linux 下载更新保留已有文件的普通权限位，避免 755/700/600 被改为 644。新文件支持明确指定的八进制权限；未知权限仍使用本机默认值。
- 统一首次连接说明，新增账号时保留旧连接和启用状态。
- 补充图标、市场审核用例、演示脚本、数据处理说明和上线待办。

This prerelease updates product naming and bilingual listing materials, respects Git ignores for subprojects, preserves permissions when downloading updates, and keeps existing account connections intact. New files can restore an explicitly known mode. Marketplace approval, WorkBuddy app testing and automatic restoration of unknown remote file modes are not claimed.

Historical validation remains in [VALIDATION.md](VALIDATION.md).
