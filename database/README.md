# Database

本目录将保存 Prisma Schema、迁移与种子数据。

正式 Schema 暂不生成：`docs/architecture/data-model.md` 仍列有需要产品确认的档案归属、未知时辰处理、游客报告权限与生产字段加密策略。确认后再创建首个迁移，避免把未决策的数据模型固化进迁移历史。

约定：

- `prisma/`：Prisma Schema 与生成器配置；
- `migrations/`：只提交经过评审的迁移；
- `seeds/`：版本化问卷、规则元数据等幂等种子脚本。
