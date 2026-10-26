# 数据处理说明 / Data handling

适用代码：0.5.1。本文记录实现事实，供用户及运营方拟定正式政策；不替巴别鸟或智能体平台作数据保留承诺。

| 数据 | 用途与接收方 | 本地保留／控制 |
| --- | --- | --- |
| 用户 API Key | 本机页面校验后以认证头发送到 https://www.babel.cc/mcp；宿主用它访问账号授权范围 | 当前宿主私有用户配置；POSIX 权限 600，Windows 使用用户目录权限。不写入项目或发布包。可在宿主删除连接，并在巴别鸟撤销 Key |
| 工程路径、名称、大小、内容和校验值 | 本机扫描及同步规划；选定内容发送至巴别鸟 MCP 返回的 HTTPS 存储地址 | 原文件保留在本地；用户控制选定工程、云端目录及排除项 |
| 绑定与同步基线 | 判断增量与冲突 | .babelbird-sync.json / .babelbird-sync-state.json 仅在本地，不上传；autoSync=false 可暂停 |
| 首次设置状态 | 告知智能体是否连接完成 | 本机状态文件不含 Key；临时页面成功或约 10 分钟后停止服务 |
| 操作结果 | 智能体报告成功、冲突与待同步项 | 对话／日志的保留由所用宿主决定；报告不应包含 Key、完整签名 URL 或上传票据 |

包内没有独立的开发者遥测收集端点。BabelBird 的服务器、存储服务、备份和日志保留期限，以及宿主平台的处理规则，必须由各服务提供方确认，不能据本地代码推断。

工程配置文件可以在用户选定的云端工程中保存；这不改变本插件鉴权密钥应保存在宿主私有配置中的要求。默认排除文件和 Git 忽略规则仍有效。不要自动把全局账号凭据搬入项目。

关闭同步或卸载插件不会删除云端文件，也不会自动删除已保存的宿主连接。用户应分别管理云端工程、宿主连接和巴别鸟 Key；本版不自动传播文件删除。

## English

The plugin scans the selected local project, sends authorized project bytes to BabelBird storage, and maintains local binding/baseline files. The user's API Key is stored in the host's private configuration and sent to BabelBird for authentication, not placed in the project or distribution package. The local setup server is temporary. No separate developer telemetry endpoint is included.

Users can pause synchronization, remove the host connection and revoke their key in BabelBird. Uninstalling does not delete cloud files or revoke credentials automatically. BabelBird's server retention and the host's conversation/log retention must be confirmed with those providers.
