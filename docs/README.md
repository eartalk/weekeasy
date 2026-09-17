# WeekEasy 项目文档

本目录记录 AI 八字人格分析平台的产品与技术方案。文档按关注点拆分，具体实现应以已确认的决策和代码为准。

## 产品设计

1. [产品定位与原则](./product/产品定位与原则.md)
2. [功能地图与 MVP 范围](./product/功能地图与MVP范围.md)

## 技术架构

1. [技术选型](./architecture/技术选型.md)
2. [Monorepo 架构](./architecture/单仓库架构.md)
3. [系统模块](./architecture/系统模块设计.md)
4. [代码目录](./architecture/代码目录设计.md)
5. [邮箱验证码认证](./architecture/邮箱验证码认证方案.md)
6. [安全与隐私](./architecture/安全与隐私方案.md)
7. [数据库模型](./architecture/数据库模型设计.md)

## 当前已确认决策

- 使用 Monorepo 管理前端、API、Worker 和公共业务包。
- 前端采用 Next.js，后端采用 NestJS 模块化单体。
- 排盘计算、规则判断和 AI 表达严格分层。
- PostgreSQL 保存业务数据，Redis 支撑验证码、缓存和 BullMQ。
- 登录采用邮箱验证码；开发环境使用 Mailpit，线上 MVP 使用 Resend 免费版。
- 第一版只做响应式 Web，不做原生 App。
- 第一版核心报告由八字结构、Big Five 和交叉分析组成。
- 报告和计算结果使用版本化快照，不覆盖历史结果。

## 推荐阅读顺序

```text
产品定位
  → MVP 范围
  → 技术选型
  → Monorepo 架构
  → 系统模块
  → 代码目录
  → 认证与隐私
  → 数据库模型
```
