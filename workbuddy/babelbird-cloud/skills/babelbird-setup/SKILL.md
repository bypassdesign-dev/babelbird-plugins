---
name: babelbird-setup
description: Use when first configuring the BabelBird plugin, entering or changing its API Key, or checking its MCP connection, including 巴别鸟首次使用、填写密钥和连接检查.
display_name: "巴别鸟首次设置"
description_zh: "首次配置巴别鸟 API Key，验证连接并启用工程自动同步。"
description_en: "Configure a BabelBird API Key and enable project sync."
version: "0.3.0"
author: "bypassdesign-dev"
disable-model-invocation: true
---

# 巴别鸟首次设置

为当前用户建立巴别鸟连接。首次引导提供 [官方 API Key 教程](https://www.babel.cc/public/babelwiki/zh/mcp-integration.html)，获取步骤见 [API Key 说明](../babelbird-project-cloud/references/api-key.md)。读取 [首次配置流程](../babelbird-project-cloud/references/setup.md#首次配置流程)，按当前宿主配置凭据。

1. 检查是否已由当前用户填写密钥，或已登记可复用的凭据引用。未填写时，必须先要求用户填写自己的巴别鸟 API Key：
   > 请在巴别鸟“设置 > API秘钥”打开对应应用，复制“APIKey”，并在当前宿主的私密凭据入口填写。这里需要 APIKey，不是 APP Key 或 APP Secret。
2. Claude Code 使用插件的必填、敏感配置项 `api_key`；Codex 使用宿主进程可读取的 `BABELBIRD_API_KEY`；WorkBuddy 使用连接器 Token 表单中的必填密码字段 `BABELBIRD_API_KEY`，由宿主保存并代入请求头。没有可用凭据时等待填写，不尝试演示密钥，也不发送未认证的业务调用。插件内只保留引用，真实值不得写入插件或项目。
3. 当前用户已经主动提供、或已经保存的凭据直接复用。环境变量不可见时先解决客户端进程的加载问题，不因超时或重启要求重新申请 API Key。不能把终端子进程中的变量设置视为已更新运行中的桌面客户端。
4. 发现实际 MCP 工具，用 `getFileInfoByPath` 定位用户指定目录或默认 `/个人文件`，核对成功响应和目录类型，再用返回的真实目录 ID 调用 `listFolder`（页号 0、每页 1 条）。不要把协议根目录 `0` 当成个人文件。检查 MCP `isError` 及业务状态；有效成功响应（包括空目录）即可通过只读测试。目录读取超时或断连最多重试一次；仍失败才报告“凭据已配置，目录读取未验证”。默认跳过 `getUsageAndQuota`；如已有配额查询超时、`Transport closed` 或无业务结果的流结束，记录“配额未知，已跳过查询”，不重试、不阻塞设置，也不据此重新索要密钥。401/403、目录读取失败和明确空间不足仍须按实际响应处理。
5. 分别报告“凭据已填写”“客户端可读取”“只读测试通过”的实际状态，报告中不出现密钥或鉴权头。配置引用可保存在宿主用户私有配置区，不能保存到工程或插件中。
6. 只读检查到此完成；用户明确只要求连接测试时停止。用户启用工程自动同步时，当前工程明确则进入 `babelbird-project-cloud`，按实际宿主的默认目录或用户指定目录建立绑定并执行首次同步；没有明确工程时只补问工程位置。绑定后任务前拉取、每批修改后上传，任务结束前复查，跨平台继续复用同一目录。

插件已经包含 MCP 配置，不要再复制一个同名服务到工程配置中。宿主可能为插件工具添加名称前缀，使用实际发现的名称。已有独立连接时复用适合的连接，迁移完成并验证前不要自动删除旧配置。
