CREATE TYPE "definition_status" AS ENUM ('DRAFT', 'PUBLISHED', 'RETIRED');
CREATE TYPE "attempt_status" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'ABANDONED', 'INVALID');

CREATE TABLE "assessment_definitions" (
  "id" UUID NOT NULL,
  "code" TEXT NOT NULL,
  "version" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "status" "definition_status" NOT NULL DEFAULT 'DRAFT',
  "scoring_config" JSONB NOT NULL,
  "published_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "assessment_definitions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "assessment_questions" (
  "id" UUID NOT NULL,
  "definition_id" UUID NOT NULL,
  "code" TEXT NOT NULL,
  "position" INTEGER NOT NULL,
  "prompt" TEXT NOT NULL,
  "dimension" TEXT NOT NULL,
  "reverse_scored" BOOLEAN NOT NULL DEFAULT false,
  "weight" DECIMAL(6,3) NOT NULL DEFAULT 1,
  CONSTRAINT "assessment_questions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "assessment_questions_position_check" CHECK ("position" > 0),
  CONSTRAINT "assessment_questions_weight_check" CHECK ("weight" > 0)
);

CREATE TABLE "assessment_attempts" (
  "id" UUID NOT NULL,
  "profile_id" UUID NOT NULL,
  "definition_id" UUID NOT NULL,
  "status" "attempt_status" NOT NULL DEFAULT 'IN_PROGRESS',
  "result_data" JSONB,
  "validity_data" JSONB,
  "started_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completed_at" TIMESTAMPTZ(6),
  CONSTRAINT "assessment_attempts_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "assessment_attempts_completion_check" CHECK (
    ("status" = 'COMPLETED' AND "result_data" IS NOT NULL AND "validity_data" IS NOT NULL AND "completed_at" IS NOT NULL)
    OR "status" <> 'COMPLETED'
  )
);

CREATE TABLE "assessment_answers" (
  "id" UUID NOT NULL,
  "attempt_id" UUID NOT NULL,
  "question_id" UUID NOT NULL,
  "value" SMALLINT NOT NULL,
  "answered_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "assessment_answers_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "assessment_answers_value_check" CHECK ("value" BETWEEN 1 AND 5)
);

CREATE UNIQUE INDEX "assessment_definitions_code_version_key" ON "assessment_definitions"("code", "version");
CREATE INDEX "assessment_definitions_status_published_at_idx" ON "assessment_definitions"("status", "published_at" DESC);
CREATE UNIQUE INDEX "assessment_questions_definition_id_code_key" ON "assessment_questions"("definition_id", "code");
CREATE UNIQUE INDEX "assessment_questions_definition_id_position_key" ON "assessment_questions"("definition_id", "position");
CREATE INDEX "assessment_attempts_profile_id_completed_at_idx" ON "assessment_attempts"("profile_id", "completed_at" DESC);
CREATE INDEX "assessment_attempts_profile_status_updated_at_idx" ON "assessment_attempts"("profile_id", "status", "updated_at" DESC);
CREATE UNIQUE INDEX "assessment_answers_attempt_id_question_id_key" ON "assessment_answers"("attempt_id", "question_id");

ALTER TABLE "assessment_questions" ADD CONSTRAINT "assessment_questions_definition_id_fkey"
  FOREIGN KEY ("definition_id") REFERENCES "assessment_definitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "assessment_attempts" ADD CONSTRAINT "assessment_attempts_profile_id_fkey"
  FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "assessment_attempts" ADD CONSTRAINT "assessment_attempts_definition_id_fkey"
  FOREIGN KEY ("definition_id") REFERENCES "assessment_definitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "assessment_answers" ADD CONSTRAINT "assessment_answers_attempt_id_fkey"
  FOREIGN KEY ("attempt_id") REFERENCES "assessment_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "assessment_answers" ADD CONSTRAINT "assessment_answers_question_id_fkey"
  FOREIGN KEY ("question_id") REFERENCES "assessment_questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

COMMENT ON TABLE "assessment_definitions" IS '版本化心理测评定义，发布后保持不可变';
COMMENT ON COLUMN "assessment_definitions"."id" IS '测评定义唯一标识';
COMMENT ON COLUMN "assessment_definitions"."code" IS '稳定问卷代码';
COMMENT ON COLUMN "assessment_definitions"."version" IS '题库与计分规则版本';
COMMENT ON COLUMN "assessment_definitions"."title" IS '问卷展示名称';
COMMENT ON COLUMN "assessment_definitions"."status" IS '定义状态：草稿、已发布或已退役';
COMMENT ON COLUMN "assessment_definitions"."scoring_config" IS '量表范围、有效性规则、语言和来源快照';
COMMENT ON COLUMN "assessment_definitions"."published_at" IS '问卷定义发布时间';
COMMENT ON COLUMN "assessment_definitions"."created_at" IS '问卷定义创建时间';

COMMENT ON TABLE "assessment_questions" IS '版本化测评题目';
COMMENT ON COLUMN "assessment_questions"."id" IS '题目唯一标识';
COMMENT ON COLUMN "assessment_questions"."definition_id" IS '所属问卷定义标识';
COMMENT ON COLUMN "assessment_questions"."code" IS '版本内稳定题目代码';
COMMENT ON COLUMN "assessment_questions"."position" IS '题目展示顺序';
COMMENT ON COLUMN "assessment_questions"."prompt" IS '面向用户的题目正文';
COMMENT ON COLUMN "assessment_questions"."dimension" IS 'Big Five 维度代码';
COMMENT ON COLUMN "assessment_questions"."reverse_scored" IS '是否执行反向计分';
COMMENT ON COLUMN "assessment_questions"."weight" IS '题目计分权重';

COMMENT ON TABLE "assessment_attempts" IS '用户测评作答及不可变完成结果快照';
COMMENT ON COLUMN "assessment_attempts"."id" IS '测评作答唯一标识';
COMMENT ON COLUMN "assessment_attempts"."profile_id" IS '被测档案标识';
COMMENT ON COLUMN "assessment_attempts"."definition_id" IS '采用的问卷定义版本标识';
COMMENT ON COLUMN "assessment_attempts"."status" IS '作答状态';
COMMENT ON COLUMN "assessment_attempts"."result_data" IS '完成后的五维计分结果快照';
COMMENT ON COLUMN "assessment_attempts"."validity_data" IS '完整度、用时和同值作答等质量快照';
COMMENT ON COLUMN "assessment_attempts"."started_at" IS '开始作答时间';
COMMENT ON COLUMN "assessment_attempts"."updated_at" IS '最近保存进度时间';
COMMENT ON COLUMN "assessment_attempts"."completed_at" IS '完成计分时间';

COMMENT ON TABLE "assessment_answers" IS '测评逐题答案';
COMMENT ON COLUMN "assessment_answers"."id" IS '答案唯一标识';
COMMENT ON COLUMN "assessment_answers"."attempt_id" IS '所属测评作答标识';
COMMENT ON COLUMN "assessment_answers"."question_id" IS '对应题目标识';
COMMENT ON COLUMN "assessment_answers"."value" IS '五点 Likert 作答值，范围 1 到 5';
COMMENT ON COLUMN "assessment_answers"."answered_at" IS '答案最近保存时间';

-- Mini-IPIP 条目来自 IPIP 公有领域题库；中文文案作为本项目 1.0.0-zh-CN 版本快照。
INSERT INTO "assessment_definitions" (
  "id", "code", "version", "title", "status", "scoring_config", "published_at"
) VALUES (
  '01993f2e-8100-7000-8000-000000000200',
  'BIG_FIVE_MINI_IPIP',
  '1.0.0-zh-CN',
  'Mini-IPIP 简版大五人格测评',
  'PUBLISHED',
  '{"locale":"zh-CN","scale":{"minimum":1,"maximum":5},"validityRules":{"minimumCompletionRatio":1,"maximumSameAnswerRatio":0.8,"minimumDurationSeconds":45},"estimatedMinutes":4,"source":{"name":"Mini-IPIP","url":"https://ipip.ori.org/MiniIPIPKey.htm","license":"public-domain"}}'::jsonb,
  CURRENT_TIMESTAMP
);

INSERT INTO "assessment_questions" (
  "id", "definition_id", "code", "position", "prompt", "dimension", "reverse_scored", "weight"
) VALUES
  ('01993f2e-8100-7000-8100-000000000001', '01993f2e-8100-7000-8000-000000000200', 'MINI_IPIP_01', 1, '我是聚会中的活跃人物。', 'EXTRAVERSION', false, 1),
  ('01993f2e-8100-7000-8100-000000000002', '01993f2e-8100-7000-8000-000000000200', 'MINI_IPIP_02', 2, '我能体会他人的感受。', 'AGREEABLENESS', false, 1),
  ('01993f2e-8100-7000-8100-000000000003', '01993f2e-8100-7000-8000-000000000200', 'MINI_IPIP_03', 3, '我会立刻把该做的杂事完成。', 'CONSCIENTIOUSNESS', false, 1),
  ('01993f2e-8100-7000-8100-000000000004', '01993f2e-8100-7000-8000-000000000200', 'MINI_IPIP_04', 4, '我的情绪经常起伏。', 'NEUROTICISM', false, 1),
  ('01993f2e-8100-7000-8100-000000000005', '01993f2e-8100-7000-8000-000000000200', 'MINI_IPIP_05', 5, '我的想象力很丰富。', 'OPENNESS', false, 1),
  ('01993f2e-8100-7000-8100-000000000006', '01993f2e-8100-7000-8000-000000000200', 'MINI_IPIP_06', 6, '我话不多。', 'EXTRAVERSION', true, 1),
  ('01993f2e-8100-7000-8100-000000000007', '01993f2e-8100-7000-8000-000000000200', 'MINI_IPIP_07', 7, '我对别人的问题不感兴趣。', 'AGREEABLENESS', true, 1),
  ('01993f2e-8100-7000-8100-000000000008', '01993f2e-8100-7000-8000-000000000200', 'MINI_IPIP_08', 8, '我经常忘记把东西放回原处。', 'CONSCIENTIOUSNESS', true, 1),
  ('01993f2e-8100-7000-8100-000000000009', '01993f2e-8100-7000-8000-000000000200', 'MINI_IPIP_09', 9, '大多数时候我很放松。', 'NEUROTICISM', true, 1),
  ('01993f2e-8100-7000-8100-000000000010', '01993f2e-8100-7000-8000-000000000200', 'MINI_IPIP_10', 10, '我对抽象概念不感兴趣。', 'OPENNESS', true, 1),
  ('01993f2e-8100-7000-8100-000000000011', '01993f2e-8100-7000-8000-000000000200', 'MINI_IPIP_11', 11, '聚会时，我会和许多不同的人交谈。', 'EXTRAVERSION', false, 1),
  ('01993f2e-8100-7000-8100-000000000012', '01993f2e-8100-7000-8000-000000000200', 'MINI_IPIP_12', 12, '我能感受到他人的情绪。', 'AGREEABLENESS', false, 1),
  ('01993f2e-8100-7000-8100-000000000013', '01993f2e-8100-7000-8000-000000000200', 'MINI_IPIP_13', 13, '我喜欢井然有序。', 'CONSCIENTIOUSNESS', false, 1),
  ('01993f2e-8100-7000-8100-000000000014', '01993f2e-8100-7000-8000-000000000200', 'MINI_IPIP_14', 14, '我很容易心烦意乱。', 'NEUROTICISM', false, 1),
  ('01993f2e-8100-7000-8100-000000000015', '01993f2e-8100-7000-8000-000000000200', 'MINI_IPIP_15', 15, '我觉得理解抽象概念很困难。', 'OPENNESS', true, 1),
  ('01993f2e-8100-7000-8100-000000000016', '01993f2e-8100-7000-8000-000000000200', 'MINI_IPIP_16', 16, '我习惯待在不引人注意的位置。', 'EXTRAVERSION', true, 1),
  ('01993f2e-8100-7000-8100-000000000017', '01993f2e-8100-7000-8000-000000000200', 'MINI_IPIP_17', 17, '我其实对他人不太感兴趣。', 'AGREEABLENESS', true, 1),
  ('01993f2e-8100-7000-8100-000000000018', '01993f2e-8100-7000-8000-000000000200', 'MINI_IPIP_18', 18, '我常把事情弄得一团糟。', 'CONSCIENTIOUSNESS', true, 1),
  ('01993f2e-8100-7000-8100-000000000019', '01993f2e-8100-7000-8000-000000000200', 'MINI_IPIP_19', 19, '我很少感到低落。', 'NEUROTICISM', true, 1),
  ('01993f2e-8100-7000-8100-000000000020', '01993f2e-8100-7000-8000-000000000200', 'MINI_IPIP_20', 20, '我的想象力并不好。', 'OPENNESS', true, 1);
