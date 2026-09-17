# WeekEasy

WeekEasy 是一个结合传统八字结构、Big Five 心理测评与真实反馈的自我理解工具。

## 本地开发

要求：Node.js 24 LTS、pnpm 11、Docker（使用本地基础设施时需要）。

复制环境变量示例并填写本地开发值；`.env` 包含密钥和数据库密码，不得提交：

```bash
Copy-Item .env.example .env
pnpm install
```

### 使用远端开发数据库和 Redis

在 `.env` 的 `DB_*` 和 `REDIS_*` 参数中分别填写远端地址、端口、账号与密码，然后直接启动：

```bash
pnpm dev
```

### 使用本地 Docker 基础设施

```bash
docker compose up -d
pnpm dev
```

- Web：http://localhost:3000
- API 存活检查：http://localhost:3001/api/v1/health
- API 就绪检查（真实检测 PostgreSQL 与 Redis）：http://localhost:3001/api/v1/health/ready
- Mailpit：http://localhost:8025

Mailpit 是仅用于本地开发的邮件接收箱。应用把验证码等测试邮件发给它，你可以在网页里查看，不会真的投递给外部邮箱；使用远端数据库和 Redis 时，Mailpit 仍可单独在本机通过 Docker 启动。

远端数据库端口应通过云安全组或服务器防火墙限制来源 IP，不要向整个互联网开放。

单独启动应用：

```bash
pnpm dev:web
pnpm dev:api
pnpm dev:worker
```

## 质量检查

```bash
pnpm check
```

架构与产品决策位于 [`docs`](./docs/README.md)。
