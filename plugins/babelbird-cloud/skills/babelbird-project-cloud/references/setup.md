# 插件连接与首次配置

## 使用条件

插件已经包含工程存储 Skill、首次设置 Skill 和巴别鸟 MCP 配置。宿主还需具备本地文件读写与文件网络传输能力。MCP 服务地址为 `https://www.babel.cc/mcp`，逻辑服务名为 `babelBird`；宿主可能添加插件前缀。

Codex 读取 `.codex-plugin/plugin.json` 和 `mcp.codex.json`；Claude Code 读取 `.claude-plugin/plugin.json` 和 `mcp.claude.json`。WorkBuddy 使用独立连接器包的 `connector-meta.json`、`mcp.json` 与 `token-schema.json`，不读取 Codex／Claude 的插件清单。插件版 Skill 不重复声明 MCP 依赖。

## 首次配置流程

1. 用户要求安装本插件时，在文件安装完成后主动继续首次设置。提供 [官方 API Key 教程](https://www.babel.cc/public/babelwiki/zh/mcp-integration.html) 和 [获取步骤](api-key.md)。检查当前用户已有连接与凭据引用，有效则复用。缺少时说明“还差 API Key 配置”，再按 [具体填写入口](credential-entry.md) 给出当前宿主的菜单、字段、填写值和保存后的下一步；不要只让用户寻找抽象的私密入口。
2. Codex 桌面可以在“设置 > MCP 服务器”建立用户级个人连接，通过 Headers 的 Authorization 填入 Bearer 加空格和自己的 APIKey；Bearer token env var 留空。保留插件 Skill，个人连接验证通过后仅关闭内置重复 MCP 入口。Codex CLI 可保留内置 MCP 的 BABELBIRD_API_KEY 环境变量，使用文档中的隐藏输入命令。WorkBuddy 当前 GitHub 安装使用自定义远程 MCP 的 Authorization 请求头；只有实际出现完整连接器的 Token 表单时，才在必填密码项 BABELBIRD_API_KEY 填纯 APIKey。Claude Code 使用插件敏感配置项 api_key。填写步骤见上面的具体入口文档，不需要用户掌握环境变量知识。
3. Codex 的环境变量必须存在于实际运行客户端的进程环境。已启动桌面应用不会自动取得子终端的新变量。终端会话变量并非永久保存；需要跨次启动复用时，将凭据保存到用户私有凭据管理器，并通过启动器注入。已登记的凭据不应反复索要；先解决加载问题。不要暗中改变系统全局环境或将明文写入共享启动脚本。
4. 默认引导用户在客户端填写，不要求发送密钥到聊天。用户已经主动提供 API Key 时，视为已填写，可在其授权的用户私有配置区完成接入，不回显、不写入项目、分发包、公开日志或命令历史。个人 MCP 配置包含凭据时限制为当前用户可读。不要把插件 MCP 的静态配置改成硬编码鉴权头，也不要覆盖整个用户配置。没有可用凭据时等待填写，不发送未认证业务调用。
5. 使用 `getFileInfoByPath` 定位用户指定目录或默认 `/个人文件`，确认业务成功与目录类型，再将真实目录 ID 传给 `listFolder`，使用 `pageIndex: 0, pageSize: 1`。不要将协议根目录 `0` 当作个人文件。核对 MCP `isError` 及业务状态，有效成功响应（包括空目录）才算只读连接验证通过。分别记录凭据已保存／可读取、目录读取已验证。目录读取超时或断连最多重试一次，仍失败则保留错误并报告“目录读取未验证”。401/403 按实际响应处理；不能据一般传输故障断定密钥无效。
6. 默认跳过 `getUsageAndQuota`。仅在用户明确要求查询空间时调用；配额查询超时、`Transport closed` 或 SSE 流结束但无对应业务结果时，记录“配额未知，已跳过查询”，不重试、不阻塞设置和已授权的存储流程。此例外不适用于鉴权失败、目录读取失败、明确空间不足或真实上传／下载错误。初始化成功、工具列表可见和 HTTP 200 都不能替代成功的目录读取。
7. 连接通过后按用户实际的保存／恢复请求执行。保存默认采用 Codex 的 `/个人文件/codex/<工程名>/` 或 WorkBuddy 的 `/个人文件/workbuddy/<工程名>/`，用户指定目录优先；当前工程和宿主已明确时不再追问目标。首次设置本身不授权上传、创建目录或覆盖文件。

## 已有连接与私有化部署

已有独立 Skill 或 MCP 连接时，避免重复安装同一 Skill 和重复连接。用户级个人 MCP 是桌面填写密钥的一种支持方式，验证后可在用户配置中关闭内置重复 MCP；保留 Skill、旧连接和其他配置。首次设置不能默认删除旧连接或把凭据放到项目中。

企业私有化部署需先取得管理员提供的 MCP 地址，再更新实际使用的宿主适配配置中的 URL。更新安装前的源包并重新安装，不直接修改插件缓存。仅向用户确认的服务地址发送凭据。

## 只读检查之后

工具参数和上传限制见 [MCP 接口](mcp-tools.md)。首次传输验证只使用用户明确授权的文件，完成上传、列表核对、下载回读和 SHA-256 比较。公有云实际上传协议已验证；其他部署按返回合同核对，不能猜测字段或把获取上传 URL 当成上传成功。启用工程自动同步后按 [同步执行](sync.md) 建立绑定和共同基线。

## 资料

- [巴别鸟 MCP 文档](https://www.babel.cc/public/babelwiki/zh/mcp-integration.html)
- [Codex 插件格式](https://developers.openai.com/plugins/build/plugins)
- [Claude Code 插件及敏感配置](https://code.claude.com/docs/en/plugins-reference)

- [WorkBuddy 连接器与 Token 表单](https://open.workbuddy.cn/docs/connector)
