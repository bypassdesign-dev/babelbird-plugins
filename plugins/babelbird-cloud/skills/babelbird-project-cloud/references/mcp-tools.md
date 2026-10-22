# MCP 接口与上传条件

以下参数已与 2026-10-21 公有云新连接的 `tools/list` 返回核对，服务端标识为 `FileDataServer 4.0.3`，协商协议为 `2025-03-26`。它们用于理解接口，实际调用以当前连接的工具 schema 为准。宿主可能增加工具名称前缀。工具列举成功不代表业务调用已验证。

| 工具 | 已观察到的参数 |
| --- | --- |
| `getUsageAndQuota` | 无 |
| `getFileInfoByPath` | `namePath: string` |
| `listFolder` | `fileId: string, pageIndex: number, pageSize: number` |
| `searchFileNameByKey` | `keyword: string, pageIndex: number, pageSize: number` |
| `createFolder` | `folderId: string, name: string` |
| `getUploadUrl` | `fileName: string, fileHash: string, fileSize: number, folderId?: string, fileId?: string` |
| `getDownloadUrl` | `fileId: string` |
| `getFileContent` | `fileId: string` |

本次观察到的 `listFolder` 和搜索工具说明规定页号从 0 开始；其他部署仍以当前工具说明为准。读取分页返回的总量、下一页或结束标志；如果没有结束标志，持续分页至空页，检测重复页并在异常时报告未读全，不能把默认首页当作全部文件。

文档有时写作 `ListFolder`；本次工具面实际为 `listFolder`。不能按文档大小写推造工具名。

本次工具面未暴露 `babel_set_workspace`、`babel_get_workspace`、`babel_write_file` 等工具。它们可能出现在设计资料或其他部署，只有实际发现才能调用。没有工作目录工具时，客户端显式传入已核实的目录 ID，权限仍由服务端执行。

## 上传必须满足的条件

`getUploadUrl` 的既有说明要求：

- 新文件提供 `folderId`；`fileId` 缺省或 `"0"` 表示新文件。
- 更新文件提供已核实的 `fileId`。
- 实际上传时继续传递 `fileName`、`fileHash` 及对应的 `folderId` 或 `fileId`。
- `fileSize` 使用实际上传字节数，不是字符串字符数。

工具声明本身尚未明确以下协议细节：

1. `fileHash` 的算法、编码，以及是全文件还是分片／采样摘要。
2. 返回上传 URL 使用的 HTTP 方法与正文格式。
3. 文件字节的字段名，以及上述参数应放入查询、表单还是其他位置。
4. 上传响应的成功判定、文件 ID、秒传确认及是否还有提交步骤。

调用前从当前服务端说明或接口维护者取得这些约定。不能猜测 MD5、SHA-256、PUT、multipart POST，也不能把本地恢复清单使用的 SHA-256 自动填入 `fileHash`。若工具说明及返回信息不足以确定传输协议，应保留本地包并报告缺失项。

接口协议完整后，严格按返回的 URL、方法和字段发送文件。仅传本地路径字符串不等于上传文件字节；取得 URL 也不等于上传成功。

使用部署所允许的 HTTPS 传输地址，不记录完整临时 URL 和凭据。上传请求只携带协议要求的上传凭据，不向另一个存储域名自动转发 MCP API Key；跨域重定向也不能自动携带它。

服务端若返回秒传成功，仍需取得目标文件标识并核对目录、文件名与大小。发生超时、断连或其他不确定结果时，先查询目标文件，避免再次上传造成重复。

## 与传统 API 的区别

巴别鸟传统 `GET /api/file/preUploadFile.do` 文档描述了另一种流程：取得 `url` 和 `upload_token`，以 multipart POST 发送 `file` 与 `upload_token`。

该文档不能证明 MCP `getUploadUrl` 使用相同协议，也不能证明两者凭据互通。本 Skill 不自动切换到传统 API。只有当前 MCP 响应／官方说明明确建立对应关系，或用户明确选择并配置传统 API 集成后，才能使用该流程。

- [巴别鸟 MCP](https://www.babel.cc/public/babelwiki/zh/mcp-integration.html)
- [传统预上传接口](https://www.babel.cc/public/babelwiki/zh/api-get-api-file-preuploadfile-do.html)
