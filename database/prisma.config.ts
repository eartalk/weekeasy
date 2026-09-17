import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnvironment } from 'dotenv';
import { defineConfig, env } from 'prisma/config';

const databaseDirectory = fileURLToPath(new URL('.', import.meta.url));
// 数据库命令从仓库根目录的 .env 读取本地连接信息。
loadEnvironment({ path: resolve(databaseDirectory, '../.env'), quiet: true });

// Prisma CLI 运行在应用之外，因此在这里按同一规则组装连接串。
const databaseUrl = new URL(`postgresql://${env('DB_HOST')}`);
databaseUrl.port = env('DB_PORT');
databaseUrl.username = env('DB_USER');
databaseUrl.password = env('DB_PASSWORD');
databaseUrl.pathname = `/${env('DB_NAME')}`;
databaseUrl.searchParams.set('schema', env('DB_SCHEMA'));

export default defineConfig({
  schema: resolve(databaseDirectory, 'prisma/schema.prisma'),
  migrations: {
    path: resolve(databaseDirectory, 'migrations'),
  },
  datasource: {
    url: databaseUrl.toString(),
  },
});
