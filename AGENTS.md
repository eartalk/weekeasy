# WeekEasy Agent 协作规范

本文件用于约束在 WeekEasy 仓库中工作的 AI Agent。开始修改代码前，必须先阅读本文件及任务涉及的 `docs/` 文档；文档与代码不一致时，以已经确认的产品决策和可运行代码为准，并补充或修正文档。

## 1. 项目定位

WeekEasy 是一个结合传统八字结构、Big Five 心理测评和用户真实反馈的自我理解工具。

产品不宣称预测必然命运，不提供医疗、心理诊断或投资结论。所有报告必须：

- 区分事实、规则推断和 AI 表达；
- 展示证据、数据完整度和置信度；
- 明确传统文化解释和非诊断声明；
- 允许用户通过现实问题验证或修正结论；
- 避免绝对化、恐吓性和宿命化措辞。

MVP 范围以 `docs/product/mvp-scope.md` 为准，不提前实现支付、会员、社区、每日运势、双人合盘、原生 App 或 AI 长对话等后续功能。

## 2. 技术栈

- Node.js 24 LTS；
- pnpm Workspace；
- Turborepo；
- Next.js + React + TypeScript；
- Tailwind CSS；
- NestJS 模块化单体；
- PostgreSQL + Prisma；
- Redis + BullMQ；
- Vitest、Supertest、Playwright；
- Docker Compose；
- 全仓库启用严格 TypeScript。

禁止擅自替换核心技术栈。引入新依赖前，应确认现有依赖或平台能力无法合理解决问题，并说明新依赖的用途和运行位置。

## 3. 仓库结构

```text
apps/
  web/                  Next.js 用户端与管理端
  api/                  NestJS REST API
  worker/               报告和通知等异步任务
packages/
  bazi-core/            无框架依赖的命盘领域模型
  bazi-calendar/        历法、时区和真太阳时适配
  rule-engine/          规则、权重和冲突处理
  assessment-core/      Big Five 计分
  analysis-core/        跨模型比较
  api-contracts/        API 请求响应契约
  report-contracts/     AI 报告结构契约
  ui/                   跨功能共享 UI
  observability/        日志、追踪与脱敏
  config/               共享工程配置
database/               Prisma、迁移和种子数据
tests/                  黄金用例、Fixtures 和 E2E
docs/                   产品与架构决策
```

不要在没有明确复用需求时创建公共抽象。功能内部代码优先留在对应 feature 或模块中，确认跨功能稳定复用后再上移。

## 4. 架构边界

依赖方向必须保持向内：

```text
Web → API Contracts / Report Contracts / UI
API → 领域核心包
Worker → Analysis Core / Report Contracts
Rule Engine → Bazi Core
```

必须遵循以下规则：

- `packages/*` 不得反向依赖 `apps/*`；
- 核心领域包不得依赖 NestJS、Next.js、Prisma、Redis、HTTP、OpenAI SDK 或环境变量；
- 前端不得导入 Prisma 类型、数据库实体或服务端密钥；
- API DTO 与领域实体分离，不直接把 ORM 对象作为响应返回；
- 复杂业务使用 Domain、Application、Infrastructure、Presentation 分层；
- 简单 CRUD 不强制制造空的 DDD 目录；
- 邮件、AI、地图、存储等外部能力通过 Port/Adapter 接入；
- Controller 只处理协议、校验和用例调用，不承载业务规则；
- Admin 必须通过应用服务操作业务，不直接修改数据库；
- Worker 不暴露公开业务 API。

## 5. 排盘、规则与 AI 的职责

职责边界不可混淆：

```text
代码：时间处理、历法计算、四柱排盘
规则：结构判断、维度评分、证据、冲突和置信度
AI：解释、组织、改写和行动建议
```

AI 不得：

- 自行计算或修改四柱、命盘和测评得分；
- 虚构不存在的规则证据；
- 绕过结构化输入直接读取整份用户资料；
- 直接访问数据库；
- 输出医学或心理诊断；
- 使用姓名、邮箱、账户 ID 等非必要身份信息。

AI 输出必须通过版本化 JSON Schema 校验。失败时不得污染确定性的命盘、测评和分析结果。

## 6. 数据与版本规则

- 命盘、已完成测评、分析结果和已完成报告使用不可变快照；
- 重新计算或重新生成时创建新版本，不覆盖历史正式结果；
- 保存引擎版本、规则版本、问卷版本、Prompt 版本和 Schema 版本；
- `input_hash` 等敏感输入指纹使用带密钥 HMAC，禁止使用可枚举的普通哈希；
- 外部邮件、AI 和队列调用不得放在长数据库事务内；
- 跨多个关键写操作时明确事务边界；
- 正式 Prisma Schema 和首个迁移必须在数据模型未决项确认后生成；
- 迁移文件一旦进入共享环境，不得通过修改旧迁移来伪造历史，应增加新迁移。

## 7. 安全与隐私红线

以下内容属于高敏感数据：出生日期和时间、地点和经纬度、邮箱、心理测评答案、自由文本反馈及报告正文。

必须做到：

- 日志、错误追踪和审计记录不得包含验证码、Token、密钥或完整敏感资料；
- 验证码、Session Token、Refresh Token 和分享令牌只保存哈希；
- 所有 Profile、命盘、测评、分析和报告访问都校验对象所有权；
- 分享页面默认隐藏出生日期、时间、地点、邮箱和内部规则代码；
- 管理员查看敏感信息必须产生审计记录；
- Worker 只读取任务所需的最小数据；
- 示例、测试和文档只能使用虚构或匿名化数据；
- 不提交 `.env`、API Key、数据库密码或任何真实用户数据；
- 新增日志字段前先判断是否可能泄漏身份、出生资料、答卷或报告内容。

## 8. 编码规范

- 文件名使用 kebab-case；
- TypeScript 类型、接口和类使用 PascalCase；
- API 字段使用 camelCase；
- 数据库表和列使用 snake_case；
- 稳定业务代码使用 UPPER_SNAKE_CASE；
- 优先使用明确类型，禁止无理由使用 `any`；
- 仅作为类型使用的符号通过 `import type` 导入；
- 对外导出的数据结构尽量使用只读属性；
- 业务错误应使用稳定错误码，不向客户端暴露内部异常详情；
- 注释解释原因、边界和不明显的业务规则，不重复代码表面含义；
- 不保留无用代码、注释掉的大段实现或没有负责人的 TODO；
- 不为了未来猜测进行过度抽象。
- 代码要加简单的中文注释

## 9. API 约定

- REST API 使用 `/api/v1` 前缀；
- 请求和响应契约放入 `@weekeasy/api-contracts`，并使用 Zod 校验；
- AI 报告契约放入 `@weekeasy/report-contracts`；
- 分页、错误响应、日期时间和状态码保持全局一致；
- 时间戳使用 ISO 8601，数据库使用 `timestamptz`；
- 对外错误不暴露邮箱是否注册、内部堆栈、规则实现或供应商密钥；
- 新增接口时至少覆盖成功、输入非法、未认证、无权限和资源不存在等情况。

## 10. Web 约定

- `app/` 负责路由、布局和页面级数据获取；
- `features/` 负责具体产品能力；
- 只有跨功能稳定复用的组件进入公共 `components/` 或 `packages/ui`；
- 默认使用服务端组件，仅在需要浏览器交互时添加客户端边界；
- 表单使用明确 Schema，服务端仍需重复校验；
- 页面必须支持键盘操作、可见焦点、语义化标签和合理对比度；
- 不在客户端暴露服务端环境变量或敏感计算过程；
- 报告页面应展示来源、证据、置信度和不确定性，而不是只展示结论。

## 11. 测试要求

修改代码时必须提供与风险相称的验证：

- 领域计算：单元测试；
- 节气边界、时区和真太阳时：黄金用例；
- API 契约和权限：集成测试；
- 关键用户流程：Playwright E2E；
- 修复缺陷：先复现或补充回归测试；
- 涉及快照或版本的代码：验证旧数据不会被覆盖；
- 涉及敏感数据的代码：验证日志和响应中没有泄漏。

提交结果前至少运行：

```bash
pnpm check
```

该命令包含 lint、类型检查、测试和生产构建。若因环境限制无法执行某项检查，必须明确说明未验证的内容和原因，不得声称全部通过。

## 12. 常用命令

```bash
pnpm install
docker compose up -d
pnpm dev
pnpm dev:web
pnpm dev:api
pnpm dev:worker
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm check
```

本地服务默认地址：

- Web：`http://localhost:3000`
- API：`http://localhost:3001/api/v1`
- API 健康检查：`http://localhost:3001/api/v1/health`
- Mailpit：`http://localhost:8025`

## 13. Agent 工作方式

执行任务时：

1. 先确认任务属于 MVP 范围，并阅读关联产品与架构文档；
2. 检查现有实现、工作区状态和相关测试，不覆盖用户已有修改；
3. 选择最小且完整的业务切片，保持模块和依赖边界；
4. 先处理确定性业务逻辑，再接入数据库、队列或外部供应商；
5. 对隐私、权限、版本、事务和失败重试进行显式设计；
6. 添加或更新测试；
7. 执行 `pnpm check`；
8. 最终说明完成内容、验证结果、未解决事项和下一步建议。

除非用户明确要求，否则不要：

- 扩大需求范围；
- 修改与当前任务无关的文件；
- 删除或重写现有用户改动；
- 创建微服务或引入 Kubernetes；
- 提前实现 MVP 之外的业务；
- 使用真实用户数据进行开发测试；
- 在产品决策尚未确认时固化不可逆的数据迁移。

## 14. 主要文档

开始相关工作前按需阅读：

- `docs/product/product-vision.md`
- `docs/product/mvp-scope.md`
- `docs/architecture/tech-stack.md`
- `docs/architecture/monorepo.md`
- `docs/architecture/system-modules.md`
- `docs/architecture/code-structure.md`
- `docs/architecture/data-model.md`
- `docs/architecture/authentication.md`
- `docs/architecture/security-and-privacy.md`

若新增重要且长期有效的架构决策，应同步更新对应文档，必要时增加 ADR，而不是只把决策留在代码或聊天记录中。
