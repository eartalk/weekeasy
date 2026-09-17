# WeekEasy

WeekEasy 是一个结合传统八字结构、Big Five 心理测评与真实反馈的自我理解工具。

## 本地开发

要求：Node.js 24 LTS、pnpm 11、Docker。

```bash
pnpm install
docker compose up -d
pnpm dev
```

- Web：http://localhost:3000
- API 健康检查：http://localhost:3001/api/v1/health
- Mailpit：http://localhost:8025

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
