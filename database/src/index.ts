import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/client.js';

export type DatabaseClient = PrismaClient;

export function createDatabaseClient(connectionString: string): DatabaseClient {
  // Prisma 7 通过 PostgreSQL 驱动适配器建立连接池。
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

export * from './generated/prisma/enums.js';
