# 中英文市场文案 / Listing copy

| 字段 | 简体中文 | English |
| --- | --- | --- |
| 名称 | 项目云端同步巴别鸟插件 | BabelBird Project Cloud Sync |
| 短简介 | 工程文件跨设备、跨智能体同步 | Sync projects across devices |
| 分类 | 生产力／开发工具，按平台可选项选择 | Productivity / Developer Tools |
| 发布者 | bypassdesign-dev，最终以验证主体为准 | bypassdesign-dev; use the verified publisher identity |

## 中文简介（用户指定原文）

配置插件后可以把codex/workbuddy的本地项目/工程文件自动同步到巴别鸟，切换设备或智能体产品后也能同步回来。

## English summary

After setup, automatically sync local Codex/WorkBuddy project files to BabelBird and sync them back when you switch devices or AI agent platforms.

## 中文完整介绍

连接自己的巴别鸟账号，将本地工程与云端目录绑定。智能体开始工作前拉取更新，完成一批修改后上传；切换设备或智能体平台时，选择同一个云端工程目录继续工作。

文件保持原有名字和目录结构，无需压缩工程。Codex 新工程默认保存到「个人文件/codex」，WorkBuddy 默认保存到「个人文件/workbuddy」；已有工程始终复用用户选择的目录。

GitHub 安装器为 Codex、WorkBuddy 等六个已适配产品打开本地中英文 API Key 页面，填写后自动检查个人文件访问并保存私有连接。WorkBuddy 仍需在应用内批准 MCP；独立市场包的安装尚待实机验证。

需要个人 API Key、目标目录读写权限、网络、Node.js 20+ 及支持本地工具的智能体。同步依赖任务期间加载项目规则，不是关闭智能体后仍运行的后台服务。双方同时修改会保留冲突，不自动传播删除；新设备首次下载的未知文件权限不会被猜测。

## English full description

Connect your own BabelBird account and bind a local project to a cloud folder. Pull updates before the agent starts editing and upload completed batches. Continue on another device or agent by selecting the same cloud project.

Files keep their names and folder structure without compressing the project. New Codex projects use Personal Files/codex; new WorkBuddy projects use Personal Files/workbuddy. Existing bindings always keep the selected cloud folder.

The GitHub installer opens a bilingual local API Key form for six implemented host adapters, checks Personal Files access and saves a private connection. WorkBuddy requires native MCP approval; its separate marketplace package still needs in-app validation.

A personal API Key, read/write access to the target folder, network access, Node.js 20+ and local agent tools are required. Synchronization runs during agent tasks when project rules are loaded, not as an always-on background service. Conflicts are preserved and deletions are not propagated. Unknown file permissions are not guessed on first download to a new device.

## 使用示例 / Starter prompts

- 为当前工程启用巴别鸟自动同步。 / Enable BabelBird sync for this project.
- 从个人文件/codex/示例工程下载到新的本地目录并继续同步。 / Restore my existing cloud project into a new local folder and keep it in sync.
- 检查待上传、待下载和冲突文件。 / Check pending uploads, downloads and conflicts.

## 国际化格式与限制

WorkBuddy 使用实际支持的 `name_zh/name_en`、`description_zh/description_en`，表单使用 `label_en` 等平行字段。原字符串字段保持兼容。

Codex 的 `displayName` 是一个字符串，GitHub 包显示指定的中文名称；英文名称在说明及本材料中提供。正式国际市场提交按官方指南使用英文基础字段，`extensions.com.openai.publication.translations` 提供中文副标题和描述，未发明 `displayName_en` 字段。当前官方文档说明：翻译可导入并保存在包中，但尚不改变目录页面/API 的显示，不承诺自动切换名称。

本版共用本地设置页支持中英文并按浏览器语言选择，也可手动切换；WorkBuddy 市场包提供中英文表单字段。实际市场翻译展示和安装体验以宿主测试为准。

来源：[OpenAI listing translations](https://developers.openai.com/plugins/deploy/submission#translate-listing-text)、[WorkBuddy 元信息与表单](https://open.workbuddy.cn/docs/connector)。
