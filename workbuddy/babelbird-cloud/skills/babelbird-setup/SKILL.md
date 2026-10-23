---
name: babelbird-setup
description: Use when installing BabelBird from its GitHub link, continuing setup after installation, entering or changing its API Key, or checking its MCP connection, including 安装后找不到 APIKEY、巴别鸟首次使用和连接检查.
display_name: "巴别鸟首次设置"
description_zh: "首次配置巴别鸟 API Key，验证连接并启用工程自动同步。"
description_en: "Configure a BabelBird API Key and enable project sync."
version: "0.3.1"
author: "bypassdesign-dev"
disable-model-invocation: false
---

# 巴别鸟首次设置

为当前用户建立巴别鸟连接。用户通过仓库链接要求安装本插件时，文件安装后主动执行本流程，不等待用户知道 Skill 名称。只要求下载或离线安装时尊重该范围。读取 [首次配置流程](../babelbird-project-cloud/references/setup.md#首次配置流程) 与 [API Key 填写入口](../babelbird-project-cloud/references/credential-entry.md)，按实际宿主给出可执行步骤。

1. 检查当前用户已有的巴别鸟连接和凭据引用；有效时直接验证，不重新索要。缺少时主动说明“插件已安装，还差 API Key 配置”，提供 [官方获取教程](https://www.babel.cc/public/babelwiki/zh/mcp-integration.html) 和“设置 > API秘钥 > 应用详情 > APIKey”的获取路径，提醒不是 APP Key／APP Secret。
2. 给出当前宿主的具体填写步骤，不能只说“私密入口”或“设置环境变量”。Codex 桌面优先引导到“设置 > MCP 服务器 > 添加服务器”，按填写入口文档设置个人连接的 URL 和 Authorization 请求头，值为 Bearer 加空格再加 APIKey；Bearer token env var 字段留空。Codex CLI 使用文档中的终端隐藏输入方法。WorkBuddy 当前 GitHub 包使用“专家·技能·连接器 > 连接器 > 自定义连接器”的远程 MCP 请求头；只有实际出现完整连接器 Token 表单时才使用其 API Key 密码项。Claude Code 使用已有的敏感配置项 api_key。
   能使用宿主的凭据表单时直接提供入口，否则给出菜单、字段、填写内容、保存和重启步骤，等待用户回复“已填写”后继续。没有表单能力时不声称已弹窗。默认让用户在客户端填写，不要求把密钥发到聊天，不使用演示密钥或发送无认证业务调用。
3. 当前用户已经主动提供、或已经保存的凭据直接复用。环境变量不可见时先解决客户端进程的加载问题，不因超时或重启要求重新申请 API Key。不能把终端子进程中的变量设置视为已更新运行中的桌面客户端。
4. 发现实际 MCP 工具，用 `getFileInfoByPath` 定位用户指定目录或默认 `/个人文件`，核对成功响应和目录类型，再用返回的真实目录 ID 调用 `listFolder`（页号 0、每页 1 条）。不要把协议根目录 `0` 当成个人文件。检查 MCP `isError` 及业务状态；有效成功响应（包括空目录）即可通过只读测试。目录读取超时或断连最多重试一次；仍失败才报告“凭据已配置，目录读取未验证”。默认跳过 `getUsageAndQuota`；如已有配额查询超时、`Transport closed` 或无业务结果的流结束，记录“配额未知，已跳过查询”，不重试、不阻塞设置，也不据此重新索要密钥。401/403、目录读取失败和明确空间不足仍须按实际响应处理。
5. 分别报告“凭据已填写”“客户端可读取”“只读测试通过”的实际状态，报告中不出现密钥或鉴权头。配置引用可保存在宿主用户私有配置区，不能保存到工程或插件中。
6. 只读检查到此完成；用户明确只要求连接测试时停止。用户启用工程自动同步时，当前工程明确则进入 `babelbird-project-cloud`，按实际宿主的默认目录或用户指定目录建立绑定并执行首次同步；没有明确工程时只补问工程位置。绑定后任务前拉取、每批修改后上传，任务结束前复查，跨平台继续复用同一目录。

插件内置 MCP 可使用环境变量；桌面用户也可按填写入口文档选择用户级个人连接。个人连接验证通过后，仅关闭内置重复 MCP 入口并保留 Skill，不关闭整个插件、不写入项目配置、不删除旧连接。使用实际发现的工具名称，不要求服务必须叫 babelBird。

交接时分别说明插件安装、凭据配置、只读连接三项的真实状态。缺少填写或重启时给出唯一明确的下一步；不能以“插件已安装”代替“可开始同步”。
