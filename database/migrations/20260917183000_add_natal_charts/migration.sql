-- CreateEnum
CREATE TYPE "chart_status" AS ENUM ('CALCULATED', 'FAILED');

-- CreateTable
CREATE TABLE "natal_charts" (
    "id" UUID NOT NULL,
    "profile_id" UUID NOT NULL,
    "birth_record_id" UUID NOT NULL,
    "engine_version" TEXT NOT NULL,
    "calendar_adapter" TEXT NOT NULL,
    "calendar_adapter_version" TEXT NOT NULL,
    "calculation_policy_version" TEXT NOT NULL,
    "status" "chart_status" NOT NULL DEFAULT 'CALCULATED',
    "year_pillar" CHAR(2),
    "month_pillar" CHAR(2),
    "day_pillar" CHAR(2),
    "hour_pillar" CHAR(2),
    "chart_data" JSONB NOT NULL,
    "warnings" JSONB NOT NULL,
    "calculation_hash" TEXT NOT NULL,
    "calculated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "natal_charts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "natal_charts_calculation_hash_key" ON "natal_charts"("calculation_hash");

-- CreateIndex
CREATE INDEX "natal_charts_profile_id_calculated_at_idx" ON "natal_charts"("profile_id", "calculated_at" DESC);

-- CreateIndex
CREATE INDEX "natal_charts_birth_record_engine_idx" ON "natal_charts"("birth_record_id", "engine_version");

-- AddForeignKey
ALTER TABLE "natal_charts" ADD CONSTRAINT "natal_charts_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "natal_charts" ADD CONSTRAINT "natal_charts_birth_record_id_fkey" FOREIGN KEY ("birth_record_id") REFERENCES "birth_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 中文注释：表与字段说明同步到数据库。
COMMENT ON TYPE "chart_status" IS '命盘计算状态';
COMMENT ON TABLE "natal_charts" IS '确定性排盘快照，创建后不可修改';
COMMENT ON COLUMN "natal_charts"."id" IS '命盘快照唯一标识';
COMMENT ON COLUMN "natal_charts"."profile_id" IS '所属档案标识，用于按档案查询与权限校验';
COMMENT ON COLUMN "natal_charts"."birth_record_id" IS '生成该命盘的出生信息版本标识';
COMMENT ON COLUMN "natal_charts"."engine_version" IS '排盘引擎（bazi-core）版本';
COMMENT ON COLUMN "natal_charts"."calendar_adapter" IS '历法适配器名称';
COMMENT ON COLUMN "natal_charts"."calendar_adapter_version" IS '历法适配器库版本';
COMMENT ON COLUMN "natal_charts"."calculation_policy_version" IS '换日与真太阳时等策略版本';
COMMENT ON COLUMN "natal_charts"."status" IS '命盘计算状态';
COMMENT ON COLUMN "natal_charts"."year_pillar" IS '年柱干支快照，如「己卯」';
COMMENT ON COLUMN "natal_charts"."month_pillar" IS '月柱干支快照';
COMMENT ON COLUMN "natal_charts"."day_pillar" IS '日柱干支快照';
COMMENT ON COLUMN "natal_charts"."hour_pillar" IS '时柱干支快照，未知时辰时为空';
COMMENT ON COLUMN "natal_charts"."chart_data" IS '完整标准化命盘，含四柱、藏干、五行、十神与刑冲合害';
COMMENT ON COLUMN "natal_charts"."warnings" IS '边界、不确定性与校验警告';
COMMENT ON COLUMN "natal_charts"."calculation_hash" IS '输入与版本组合的带密钥 HMAC 指纹，用于去重';
COMMENT ON COLUMN "natal_charts"."calculated_at" IS '命盘计算时间';
