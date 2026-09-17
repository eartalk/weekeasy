-- CreateEnum
CREATE TYPE "user_status" AS ENUM ('ACTIVE', 'SUSPENDED', 'PENDING_DELETION');

-- CreateEnum
CREATE TYPE "profile_relationship" AS ENUM ('SELF', 'PARTNER', 'FAMILY', 'FRIEND', 'OTHER');

-- CreateEnum
CREATE TYPE "profile_gender" AS ENUM ('MALE', 'FEMALE', 'UNSPECIFIED');

-- CreateEnum
CREATE TYPE "calendar_type" AS ENUM ('SOLAR', 'LUNAR');

-- CreateEnum
CREATE TYPE "birth_time_precision" AS ENUM ('MINUTE', 'HOUR', 'UNKNOWN_HOUR');

-- CreateEnum
CREATE TYPE "day_boundary_rule" AS ENUM ('MIDNIGHT', 'LATE_ZI_HOUR');

-- CreateEnum
CREATE TYPE "actor_type" AS ENUM ('USER', 'ADMIN', 'SYSTEM');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "email_verified_at" TIMESTAMPTZ(6),
    "status" "user_status" NOT NULL DEFAULT 'ACTIVE',
    "locale" TEXT NOT NULL DEFAULT 'zh-CN',
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Shanghai',
    "last_login_at" TIMESTAMPTZ(6),
    "deletion_requested_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "user_agent" TEXT,
    "ip_hash" TEXT,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "revoked_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guest_sessions" (
    "id" UUID NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "revoked_at" TIMESTAMPTZ(6),
    "last_seen_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "guest_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profiles" (
    "id" UUID NOT NULL,
    "owner_user_id" UUID,
    "anonymous_id" UUID,
    "display_name" TEXT NOT NULL,
    "relationship" "profile_relationship" NOT NULL DEFAULT 'SELF',
    "gender" "profile_gender" NOT NULL DEFAULT 'UNSPECIFIED',
    "concern_topics" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "consent_confirmed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "birth_records" (
    "id" UUID NOT NULL,
    "profile_id" UUID NOT NULL,
    "revision" INTEGER NOT NULL,
    "calendar_type" "calendar_type" NOT NULL,
    "precision" "birth_time_precision" NOT NULL,
    "local_date" DATE NOT NULL,
    "local_time" TIME(0),
    "timezone_id" TEXT NOT NULL,
    "utc_offset_minutes" SMALLINT NOT NULL,
    "country_code" CHAR(2),
    "region_name" TEXT,
    "city_name" TEXT,
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "use_true_solar_time" BOOLEAN NOT NULL DEFAULT false,
    "adjusted_local_datetime" TIMESTAMP(6),
    "day_boundary_rule" "day_boundary_rule" NOT NULL DEFAULT 'MIDNIGHT',
    "input_hash" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "superseded_at" TIMESTAMPTZ(6),

    CONSTRAINT "birth_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "actor_user_id" UUID,
    "actor_type" "actor_type" NOT NULL,
    "action" TEXT NOT NULL,
    "resource_type" TEXT NOT NULL,
    "resource_id" UUID,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "ip_hash" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_status_created_at_idx" ON "users"("status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_hash_key" ON "sessions"("token_hash");

-- CreateIndex
CREATE INDEX "sessions_user_id_expires_at_idx" ON "sessions"("user_id", "expires_at");

-- CreateIndex
CREATE INDEX "sessions_expires_at_idx" ON "sessions"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "guest_sessions_token_hash_key" ON "guest_sessions"("token_hash");

-- CreateIndex
CREATE INDEX "guest_sessions_expires_at_idx" ON "guest_sessions"("expires_at");

-- CreateIndex
CREATE INDEX "profiles_owner_user_id_deleted_at_idx" ON "profiles"("owner_user_id", "deleted_at");

-- CreateIndex
CREATE INDEX "profiles_anonymous_id_deleted_at_idx" ON "profiles"("anonymous_id", "deleted_at");

-- CreateIndex
CREATE INDEX "birth_records_profile_id_created_at_idx" ON "birth_records"("profile_id", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "birth_records_profile_id_revision_key" ON "birth_records"("profile_id", "revision");

-- CreateIndex
CREATE INDEX "audit_logs_actor_user_id_created_at_idx" ON "audit_logs"("actor_user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "audit_logs_resource_created_at_idx" ON "audit_logs"("resource_type", "resource_id", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_anonymous_id_fkey" FOREIGN KEY ("anonymous_id") REFERENCES "guest_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "birth_records" ADD CONSTRAINT "birth_records_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Domain invariants that Prisma Schema cannot express directly.
ALTER TABLE "users"
ADD CONSTRAINT "users_email_normalized_check"
CHECK (
    "email" = lower(btrim("email"))
    AND char_length("email") BETWEEN 3 AND 320
);

ALTER TABLE "profiles"
ADD CONSTRAINT "profiles_exactly_one_owner_check"
CHECK (("owner_user_id" IS NOT NULL) <> ("anonymous_id" IS NOT NULL));

ALTER TABLE "profiles"
ADD CONSTRAINT "profiles_display_name_check"
CHECK (
    "display_name" = btrim("display_name")
    AND char_length("display_name") BETWEEN 1 AND 80
);

ALTER TABLE "birth_records"
ADD CONSTRAINT "birth_records_revision_check"
CHECK ("revision" > 0);

ALTER TABLE "birth_records"
ADD CONSTRAINT "birth_records_time_precision_check"
CHECK (
    ("precision" = 'UNKNOWN_HOUR' AND "local_time" IS NULL)
    OR
    ("precision" <> 'UNKNOWN_HOUR' AND "local_time" IS NOT NULL)
);

ALTER TABLE "birth_records"
ADD CONSTRAINT "birth_records_utc_offset_check"
CHECK ("utc_offset_minutes" BETWEEN -840 AND 840);

ALTER TABLE "birth_records"
ADD CONSTRAINT "birth_records_coordinates_check"
CHECK (
    ("latitude" IS NULL AND "longitude" IS NULL)
    OR
    (
        "latitude" BETWEEN -90 AND 90
        AND "longitude" BETWEEN -180 AND 180
    )
);

-- AddChineseComments
COMMENT ON TYPE "user_status" IS '用户账号状态';
COMMENT ON TYPE "profile_relationship" IS '档案与当前用户的关系';
COMMENT ON TYPE "profile_gender" IS '档案性别';
COMMENT ON TYPE "calendar_type" IS '出生日期采用的历法类型';
COMMENT ON TYPE "birth_time_precision" IS '出生时间精度';
COMMENT ON TYPE "day_boundary_rule" IS '日期换日规则';
COMMENT ON TYPE "actor_type" IS '审计操作主体类型';

COMMENT ON TABLE "users" IS '用户账号表';
COMMENT ON COLUMN "users"."id" IS '用户唯一标识';
COMMENT ON COLUMN "users"."email" IS '标准化后的登录邮箱';
COMMENT ON COLUMN "users"."email_verified_at" IS '邮箱验证完成时间';
COMMENT ON COLUMN "users"."status" IS '用户账号状态';
COMMENT ON COLUMN "users"."locale" IS '用户界面语言与地区偏好';
COMMENT ON COLUMN "users"."timezone" IS '用户默认时区标识';
COMMENT ON COLUMN "users"."last_login_at" IS '最近一次登录时间';
COMMENT ON COLUMN "users"."deletion_requested_at" IS '账号删除申请时间';
COMMENT ON COLUMN "users"."created_at" IS '记录创建时间';
COMMENT ON COLUMN "users"."updated_at" IS '记录最后更新时间';

COMMENT ON TABLE "sessions" IS '用户登录会话表';
COMMENT ON COLUMN "sessions"."id" IS '会话唯一标识';
COMMENT ON COLUMN "sessions"."user_id" IS '所属用户标识';
COMMENT ON COLUMN "sessions"."token_hash" IS '会话令牌的安全哈希，不保存明文令牌';
COMMENT ON COLUMN "sessions"."user_agent" IS '登录客户端的用户代理摘要';
COMMENT ON COLUMN "sessions"."ip_hash" IS '登录 IP 的脱敏哈希';
COMMENT ON COLUMN "sessions"."expires_at" IS '会话过期时间';
COMMENT ON COLUMN "sessions"."revoked_at" IS '会话撤销时间';
COMMENT ON COLUMN "sessions"."created_at" IS '会话创建时间';

COMMENT ON TABLE "guest_sessions" IS '游客会话表';
COMMENT ON COLUMN "guest_sessions"."id" IS '游客会话唯一标识';
COMMENT ON COLUMN "guest_sessions"."token_hash" IS '游客令牌的安全哈希，不保存明文令牌';
COMMENT ON COLUMN "guest_sessions"."expires_at" IS '游客会话过期时间';
COMMENT ON COLUMN "guest_sessions"."revoked_at" IS '游客会话撤销时间';
COMMENT ON COLUMN "guest_sessions"."last_seen_at" IS '游客最近活跃时间';
COMMENT ON COLUMN "guest_sessions"."created_at" IS '游客会话创建时间';

COMMENT ON TABLE "profiles" IS '用户与游客的分析档案表';
COMMENT ON COLUMN "profiles"."id" IS '档案唯一标识';
COMMENT ON COLUMN "profiles"."owner_user_id" IS '档案所属登录用户标识';
COMMENT ON COLUMN "profiles"."anonymous_id" IS '档案所属游客会话标识';
COMMENT ON COLUMN "profiles"."display_name" IS '档案展示名称';
COMMENT ON COLUMN "profiles"."relationship" IS '档案对象与当前用户的关系';
COMMENT ON COLUMN "profiles"."gender" IS '档案对象性别';
COMMENT ON COLUMN "profiles"."concern_topics" IS '用户关注主题列表';
COMMENT ON COLUMN "profiles"."consent_confirmed_at" IS '关联人授权确认时间';
COMMENT ON COLUMN "profiles"."created_at" IS '档案创建时间';
COMMENT ON COLUMN "profiles"."updated_at" IS '档案最后更新时间';
COMMENT ON COLUMN "profiles"."deleted_at" IS '档案软删除时间';

COMMENT ON TABLE "birth_records" IS '出生信息不可变版本记录表';
COMMENT ON COLUMN "birth_records"."id" IS '出生记录唯一标识';
COMMENT ON COLUMN "birth_records"."profile_id" IS '所属档案标识';
COMMENT ON COLUMN "birth_records"."revision" IS '档案内递增的出生信息版本号';
COMMENT ON COLUMN "birth_records"."calendar_type" IS '输入日期采用的历法类型';
COMMENT ON COLUMN "birth_records"."precision" IS '出生时间精度';
COMMENT ON COLUMN "birth_records"."local_date" IS '出生地当地日期';
COMMENT ON COLUMN "birth_records"."local_time" IS '出生地当地时间，未知时辰时为空';
COMMENT ON COLUMN "birth_records"."timezone_id" IS '出生地 IANA 时区标识';
COMMENT ON COLUMN "birth_records"."utc_offset_minutes" IS '出生时刻相对 UTC 的偏移分钟数';
COMMENT ON COLUMN "birth_records"."country_code" IS '出生地 ISO 3166-1 两位国家代码';
COMMENT ON COLUMN "birth_records"."region_name" IS '出生地省、州或地区名称';
COMMENT ON COLUMN "birth_records"."city_name" IS '出生城市名称';
COMMENT ON COLUMN "birth_records"."latitude" IS '出生地纬度';
COMMENT ON COLUMN "birth_records"."longitude" IS '出生地经度';
COMMENT ON COLUMN "birth_records"."use_true_solar_time" IS '是否启用真太阳时校正';
COMMENT ON COLUMN "birth_records"."adjusted_local_datetime" IS '真太阳时校正后的当地日期时间';
COMMENT ON COLUMN "birth_records"."day_boundary_rule" IS '排盘使用的日期换日规则';
COMMENT ON COLUMN "birth_records"."input_hash" IS '出生输入的带密钥 HMAC 指纹';
COMMENT ON COLUMN "birth_records"."created_at" IS '该版本记录创建时间';
COMMENT ON COLUMN "birth_records"."superseded_at" IS '该版本被后续版本替代的时间';

COMMENT ON TABLE "audit_logs" IS '敏感业务操作审计日志表';
COMMENT ON COLUMN "audit_logs"."id" IS '审计日志唯一标识';
COMMENT ON COLUMN "audit_logs"."actor_user_id" IS '执行操作的用户或管理员标识';
COMMENT ON COLUMN "audit_logs"."actor_type" IS '操作主体类型';
COMMENT ON COLUMN "audit_logs"."action" IS '稳定的审计动作代码';
COMMENT ON COLUMN "audit_logs"."resource_type" IS '被操作资源类型';
COMMENT ON COLUMN "audit_logs"."resource_id" IS '被操作资源标识';
COMMENT ON COLUMN "audit_logs"."metadata" IS '经过脱敏的结构化审计附加信息';
COMMENT ON COLUMN "audit_logs"."ip_hash" IS '操作来源 IP 的脱敏哈希';
COMMENT ON COLUMN "audit_logs"."created_at" IS '审计日志创建时间';
