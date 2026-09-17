import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/client.js';

export type DatabaseClient = PrismaClient;

export function createDatabaseClient(connectionString: string): DatabaseClient {
  // Prisma 7 通过 PostgreSQL 驱动适配器建立连接池。
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

// 供基础设施层引用 Prisma 输入/输出类型（如 InputJsonValue）。
export { Prisma } from './generated/prisma/client.js';
export * from './generated/prisma/enums.js';
