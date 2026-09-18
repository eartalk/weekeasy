-- 出生输入日期需要同时表达公历与农历，农历二月三十不能使用 PostgreSQL date。
ALTER TABLE "birth_records"
  ALTER COLUMN "local_date" TYPE TEXT
  USING to_char("local_date", 'YYYY-MM-DD');

ALTER TABLE "birth_records"
  ADD COLUMN "is_leap_month" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "birth_records"
  ADD CONSTRAINT "birth_records_solar_not_leap_check"
  CHECK ("calendar_type" <> 'SOLAR' OR "is_leap_month" = false);

COMMENT ON COLUMN "birth_records"."local_date" IS '用户输入的当地日期文本（YYYY-MM-DD），按 calendar_type 解释为公历或农历';
COMMENT ON COLUMN "birth_records"."is_leap_month" IS '农历输入是否为闰月；公历固定为 false';
