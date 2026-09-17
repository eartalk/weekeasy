# Database

本目录保存 Prisma Schema、迁移、数据库客户端与后续种子数据。

当前首个迁移包含身份与出生档案基础模型：用户、会话、游客会话、档案、出生记录和审计日志。正式结果仍遵循不可变快照与版本化原则；测评、命盘、分析和报告模型将在对应业务切片实现时新增迁移。

约定：

- `prisma/`：Prisma Schema；
- `migrations/`：已评审且只追加、不改写历史的迁移；
- `src/`：数据库客户端工厂和 Prisma 生成代码；
- `seeds/`：后续存放版本化问卷、规则元数据等幂等种子脚本。

常用命令：

```bash
pnpm db:generate
pnpm db:status
pnpm db:migrate:dev
pnpm db:migrate:deploy
```

连接远端开发数据库时，从根目录 `.env` 读取账号密码。迁移进入共享环境后不得修改旧迁移，应创建新的迁移修正。
