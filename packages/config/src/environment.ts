import { z } from 'zod';

const portSchema = z.coerce.number().int().min(1).max(65_535);

function buildConnectionUrl(
  protocol: 'postgresql' | 'redis',
  host: string,
  port: number,
  username: string,
  password: string,
): URL {
  const url = new URL(`${protocol}://${host}`);
  url.port = String(port);
  url.username = username;
  url.password = password;
  return url;
}

// 服务端环境变量统一在进程启动时校验，避免缺少配置后带病运行。
export const serverEnvironmentSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    API_PORT: portSchema.default(3001),
    DB_HOST: z.string().min(1),
    DB_PORT: portSchema.default(5432),
    DB_NAME: z.string().min(1),
    DB_SCHEMA: z.string().min(1).default('public'),
    DB_USER: z.string().min(1),
    DB_PASSWORD: z.string().min(1),
    REDIS_HOST: z.string().min(1),
    REDIS_PORT: portSchema.default(6379),
    REDIS_USERNAME: z.string().min(1).default('default'),
    REDIS_PASSWORD: z.string().min(1),
    MAILPIT_SMTP_HOST: z.string().min(1).default('localhost'),
    MAILPIT_SMTP_PORT: portSchema.default(1025),
    MAIL_FROM: z.string().min(3),
    SESSION_SECRET: z.string().min(32),
    DATA_HASH_SECRET: z.string().min(32),
    OPENAI_API_KEY: z.string().optional().default(''),
    RESEND_API_KEY: z.string().optional().default(''),
  })
  .superRefine((environment, context) => {
    if (environment.SESSION_SECRET === environment.DATA_HASH_SECRET) {
      context.addIssue({
        code: 'custom',
        message: 'SESSION_SECRET 与 DATA_HASH_SECRET 必须使用不同密钥',
        path: ['DATA_HASH_SECRET'],
      });
    }

    if (
      environment.SESSION_SECRET.includes('replace-with') ||
      environment.DATA_HASH_SECRET.includes('replace-with')
    ) {
      context.addIssue({
        code: 'custom',
        message: '安全密钥不能使用示例占位值',
        path: ['SESSION_SECRET'],
      });
    }
  })
  .transform((environment) => {
    // 应用内部仍使用标准 URL，账号密码仅在配置层集中拼接和转义。
    const databaseUrl = buildConnectionUrl(
      'postgresql',
      environment.DB_HOST,
      environment.DB_PORT,
      environment.DB_USER,
      environment.DB_PASSWORD,
    );
    databaseUrl.pathname = `/${environment.DB_NAME}`;
    databaseUrl.searchParams.set('schema', environment.DB_SCHEMA);

    const redisUrl = buildConnectionUrl(
      'redis',
      environment.REDIS_HOST,
      environment.REDIS_PORT,
      environment.REDIS_USERNAME,
      environment.REDIS_PASSWORD,
    );

    return {
      ...environment,
      DATABASE_URL: databaseUrl.toString(),
      REDIS_URL: redisUrl.toString(),
    };
  });

export type ServerEnvironment = z.infer<typeof serverEnvironmentSchema>;

export function validateServerEnvironment(
  input: Record<string, unknown>,
): ServerEnvironment {
  const result = serverEnvironmentSchema.safeParse(input);

  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `${issue.path.join('.') || 'environment'}: ${issue.message}`)
      .join('; ');
    throw new Error(`环境变量校验失败：${details}`);
  }

  return result.data;
}
