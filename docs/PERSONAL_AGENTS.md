# 个人智能体适配状态 / Personal agent adapter status

核查日期：2026-10-26。产品：Meta Muse 个人智能体与 Today（中国版 https://todayai.cn ，国际版 https://today.ai ）。用户本次选择中国版，后续实测以中国版为准。Muse Code 是另一个产品，本次不以其配置证明 Muse 可用。

## 当前结论

两款产品具备可探索的扩展入口；已完成实验安装分流和工程绑定，不等于已通过完整连接验收。

| 项目 | Meta Muse | today.ai |
| --- | --- | --- |
| 官方公布的能力 | 云端工作区、自定义连接器、安全凭据隔离、社区 Skills | 云端电脑、文件与代码、社区 Skills |
| 本分支完成 | 指定已确认 Skills 目录安装；原生凭据流程引导；`muse` 工程绑定 | 指定已确认 Skills 目录安装；原生 MCP 表单引导；`today` 工程绑定 |
| 新工程默认目录 | `/个人文件/muse/<工程名>/` | `/个人文件/today/<工程名>/` |
| 尚待验证 | 实际凭据表单、运行时连接器桥接、工具调用、原始字节传输、跨会话规则 | 实际账号 MCP 表单、工具加载、原始字节传输、跨会话规则 |
| 当前发布状态 | 实验开发分支，非正式支持 | 实验开发分支，非正式支持 |

本机未安装这两款客户端；不能用 Codex 的实际 MCP 连接测试代替它们的实机证据。安装器输出 `requires_platform_setup`，不会输出伪造的已连接状态或打开错误的 localhost 页面。共享同步核心保留既有云端目录；云端工作区和用户电脑文件需要分别确认访问权限。

## 依据

- [Meta 官方 Muse 安全架构](https://research.meta.ai/blog/security-and-safety-for-ai-agents-our-approach-with-muse)：描述独立云端 VM、定制连接器和平台管理的替代凭据。能否将本 MCP 封装为连接器是待实测的工程判断，不能从文档推定已成功。
- [Meta 官方 Home Link 页面](https://gadgets.muse.ai/home-link)：提供从 GitHub 安装社区 Skills 的路线，但这不证明巴别鸟已经接入。
- [Muse Connector Platform](https://platform.muse.ai/)：公共连接器需要提交审核和端到端测试；本次未提交公共目录。
- [today.ai 官网](https://today.ai/)：公布社区 Skills、云端文件和代码能力。2026-10-26 直接读取官方页面公开资源，还观察到自定义 MCP、Bearer 认证、Token 输入与凭据验证状态的界面定义；**静态资源不能证明当前账号功能开放，更不能替代实际保存连接测试**。
- [Muse Code 扩展文档](https://dev.meta.ai/docs/muse-code/extending)仅用于区分产品，未将其用户路径或 MCP 设置套用到 Muse 个人智能体。

## 验收入口

本次开发分支验证：`node --test tests/*.test.mjs` 共 **60 项通过、0 失败、0 跳过**，包含 7 项新增个人智能体安装和绑定测试。已分别执行 `muse` / `today` 的真实安装命令，确认 Skills 完整复制、安装回执生效、返回原生设置引导且未启动 localhost 服务；两项 Skill 格式检查通过。修改前后进行了独立的指令场景推演，覆盖两款宿主、能力缺失和复用 Codex 云端绑定；这是指令验证，不是平台端到端测试。

浏览器实际访问 `https://today.ai/login` 与 `https://muse.ai/`，两者均显示未登录页面。没有提交凭据，也没有创建平台连接器；平台表单、只读连接、上传恢复及跨会话触发仍未验收。正式发布的 v0.5.0 不变。

用户确认使用中国版后，已在真实浏览器打开 `https://todayai.cn/login`，观察到中国大陆手机号输入和服务协议确认；等待用户自行登录。此前国际版公开页面资源中的 MCP 表单定义不作为中国版账号的功能验收证据。安装引导现已明确保留用户选择的站点，不强制转到国际版。

在登录后的对应产品中，使用本开发分支链接和“帮我安装并连接巴别鸟”启动测试。由平台原生安全界面收集 Key，智能体准备其余字段。收到 Key 后，先读取个人文件与一页目录，再按用户指定的测试工程验证上传、回读、换平台恢复和任务前后同步。没有连接器/安全凭据工具时准确报告能力缺失，不让用户把 Key 放进聊天。

详细安装步骤由智能体读取 [专用引导](../plugins/babelbird-cloud/skills/babelbird-setup/references/personal-agents.md)，新用户无需阅读技术教程。

## English

These are experimental adapters, not verified native integrations. Installation uses a Skills directory discovered by the host or its native import tool. The host must present its own secure credential form and complete actual BabelBird directory calls. The installer never treats copied files as a successful connection. Muse still needs a verified custom connector bridge; today's public UI resources do not prove account-level availability. Local/cloud workspace access and cross-session rule loading must also be verified before claiming automatic sync support. Existing cloud project bindings take precedence over the new `muse` and `today` defaults.
