'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import type {
  BirthRecordResponse,
  CreateBirthRecordRequest,
  ProfileResponse,
} from '@weekeasy/api-contracts';
import { ApiRequestError, createBirthRecord, createGuestProfile } from '../api/onboarding-api';

const TOPICS = [
  ['CAREER', '事业与选择'],
  ['RELATIONSHIPS', '人际与关系'],
  ['EMOTIONS', '情绪与压力'],
  ['GROWTH', '优势与成长'],
] as const;

const LOCATION_PRESETS = {
  shanghai: {
    label: '上海',
    countryCode: 'CN',
    regionName: '上海市',
    cityName: '上海市',
    timezoneId: 'Asia/Shanghai',
    latitude: 31.2304,
    longitude: 121.4737,
  },
  beijing: {
    label: '北京',
    countryCode: 'CN',
    regionName: '北京市',
    cityName: '北京市',
    timezoneId: 'Asia/Shanghai',
    latitude: 39.9042,
    longitude: 116.4074,
  },
  guangzhou: {
    label: '广州',
    countryCode: 'CN',
    regionName: '广东省',
    cityName: '广州市',
    timezoneId: 'Asia/Shanghai',
    latitude: 23.1291,
    longitude: 113.2644,
  },
  chengdu: {
    label: '成都',
    countryCode: 'CN',
    regionName: '四川省',
    cityName: '成都市',
    timezoneId: 'Asia/Shanghai',
    latitude: 30.5728,
    longitude: 104.0668,
  },
} as const;

type LocationPresetKey = keyof typeof LOCATION_PRESETS | 'custom';
type Precision = CreateBirthRecordRequest['precision'];

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiRequestError) {
    return error.message;
  }
  if (error instanceof Error && error.name === 'ZodError') {
    return '服务返回的数据格式异常，请稍后重试。';
  }
  return '暂时无法连接服务，请检查网络后重试。';
}

function Progress({ step }: { readonly step: 1 | 2 | 3 }) {
  return (
    <div aria-label={`当前是第 ${Math.min(step, 2)} 步，共 2 步`} className="mb-10 flex items-center gap-3">
      {[1, 2].map((item) => (
        <div className="flex flex-1 items-center gap-3" key={item}>
          <span
            className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold ${
              item <= step ? 'bg-[var(--cinnabar)] text-white' : 'border border-[var(--line-strong)] text-[var(--ink-soft)]'
            }`}
          >
            {item < step ? '✓' : item}
          </span>
          <span className={`h-px flex-1 ${item <= step ? 'bg-[var(--cinnabar)]/55' : 'bg-[var(--line)]'}`} />
        </div>
      ))}
      <span className="text-xs tracking-[0.15em] text-[var(--ink-soft)]">{step === 1 ? '档案' : step === 2 ? '出生信息' : '已保存'}</span>
    </div>
  );
}

export function OnboardingFlow() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [birthRecord, setBirthRecord] = useState<BirthRecordResponse | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | 'UNSPECIFIED'>('UNSPECIFIED');
  const [topics, setTopics] = useState<string[]>([]);
  const [calendarType, setCalendarType] = useState<'SOLAR' | 'LUNAR'>('SOLAR');
  const [isLeapMonth, setIsLeapMonth] = useState(false);
  const [precision, setPrecision] = useState<Precision>('MINUTE');
  const [localDate, setLocalDate] = useState('');
  const [localTime, setLocalTime] = useState('08:00');
  const [locationKey, setLocationKey] = useState<LocationPresetKey>('shanghai');
  const [customLocation, setCustomLocation] = useState({
    countryCode: 'CN',
    regionName: '',
    cityName: '',
    timezoneId: 'Asia/Shanghai',
    latitude: '',
    longitude: '',
  });
  const [useTrueSolarTime, setUseTrueSolarTime] = useState(false);
  const [dayBoundaryRule, setDayBoundaryRule] = useState<'MIDNIGHT' | 'LATE_ZI_HOUR'>('MIDNIGHT');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  function toggleTopic(topic: string) {
    setTopics((current) =>
      current.includes(topic) ? current.filter((item) => item !== topic) : [...current, topic],
    );
  }

  async function submitProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const created = await createGuestProfile({
        displayName,
        relationship: 'SELF',
        gender,
        concernTopics: topics,
        consentConfirmed: false,
      });
      setProfile(created);
      setStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSubmitting(false);
    }
  }

  function buildBirthInput(): CreateBirthRecordRequest {
    const location =
      locationKey === 'custom'
        ? {
            countryCode: customLocation.countryCode.toUpperCase() || null,
            regionName: customLocation.regionName || null,
            cityName: customLocation.cityName || null,
            timezoneId: customLocation.timezoneId,
            latitude: customLocation.latitude === '' ? null : Number(customLocation.latitude),
            longitude: customLocation.longitude === '' ? null : Number(customLocation.longitude),
          }
        : LOCATION_PRESETS[locationKey];
    return {
      calendarType,
      isLeapMonth: calendarType === 'LUNAR' && isLeapMonth,
      precision,
      localDate,
      localTime: precision === 'UNKNOWN_HOUR' ? null : precision === 'HOUR' ? `${localTime.slice(0, 2)}:00` : localTime,
      timezoneId: location.timezoneId,
      countryCode: location.countryCode,
      regionName: location.regionName,
      cityName: location.cityName,
      latitude: location.latitude,
      longitude: location.longitude,
      useTrueSolarTime,
      dayBoundaryRule,
    };
  }

  async function submitBirthRecord(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profile) {
      setError('档案信息已失效，请重新开始。');
      setStep(1);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const created = await createBirthRecord(profile.id, buildBirthInput());
      setBirthRecord(created);
      setStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-3xl">
      <Progress step={step} />

      {step === 1 ? (
        <form className="reveal-up" onSubmit={submitProfile}>
          <p className="text-xs font-bold tracking-[0.2em] text-[var(--cinnabar)]">STEP 01 · PROFILE</p>
          <h1 className="display-title mt-4 text-4xl tracking-[-0.04em] sm:text-5xl">先留下一个称呼</h1>
          <p className="mt-4 max-w-xl leading-7 text-[var(--ink-muted)]">
            不需要真实姓名。这个称呼只用来区分你的分析档案，不会传给 AI。
          </p>

          <div className="mt-9">
            <label className="field-label" htmlFor="displayName">如何称呼你</label>
            <input
              autoComplete="nickname"
              autoFocus
              className="field-input"
              id="displayName"
              maxLength={50}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="例如：小易"
              required
              value={displayName}
            />
          </div>

          <fieldset className="mt-8">
            <legend className="field-label">排盘所需的性别选项 <span className="font-normal text-[var(--ink-soft)]">（可不填）</span></legend>
            <div className="grid grid-cols-3 gap-3">
              {([['UNSPECIFIED', '不填写'], ['FEMALE', '女'], ['MALE', '男']] as const).map(([value, label]) => (
                <label className="choice-card text-center text-sm" data-selected={gender === value} key={value}>
                  <input className="sr-only" checked={gender === value} name="gender" onChange={() => setGender(value)} type="radio" />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="mt-8">
            <legend className="field-label">你现在最想了解什么 <span className="font-normal text-[var(--ink-soft)]">（可多选）</span></legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {TOPICS.map(([value, label]) => (
                <label className="choice-card flex items-center gap-3 text-sm" data-selected={topics.includes(value)} key={value}>
                  <input checked={topics.includes(value)} onChange={() => toggleTopic(value)} type="checkbox" />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>

          <SubmitArea error={error} label="继续填写出生信息" submitting={submitting} />
        </form>
      ) : null}

      {step === 2 ? (
        <form className="reveal-up" onSubmit={submitBirthRecord}>
          <p className="text-xs font-bold tracking-[0.2em] text-[var(--cinnabar)]">STEP 02 · BIRTH INPUT</p>
          <h1 className="display-title mt-4 text-4xl tracking-[-0.04em] sm:text-5xl">标记你出生时的坐标</h1>
          <p className="mt-4 max-w-2xl leading-7 text-[var(--ink-muted)]">
            出生日期、时间和地点属于敏感信息。它们仅用于确定性排盘，不进入日志，也不会作为广告标签。
          </p>

          <div className="mt-9 grid gap-6 sm:grid-cols-2">
            <fieldset>
              <legend className="field-label">历法</legend>
              <div className="grid grid-cols-2 gap-3">
                {([['SOLAR', '公历'], ['LUNAR', '农历']] as const).map(([value, label]) => (
                  <label className="choice-card text-center text-sm" data-selected={calendarType === value} key={value}>
                    <input className="sr-only" checked={calendarType === value} name="calendarType" onChange={() => setCalendarType(value)} type="radio" />
                    {label}
                  </label>
                ))}
              </div>
              {calendarType === 'LUNAR' ? (
                <label className="mt-3 flex items-center gap-2 text-sm text-[var(--ink-muted)]">
                  <input checked={isLeapMonth} onChange={(event) => setIsLeapMonth(event.target.checked)} type="checkbox" />
                  这是闰月
                </label>
              ) : null}
            </fieldset>
            <div>
              <label className="field-label" htmlFor="localDate">出生日期</label>
              <input
                className="field-input"
                id="localDate"
                max={calendarType === 'SOLAR' ? today : undefined}
                onChange={(event) => setLocalDate(event.target.value)}
                pattern={calendarType === 'LUNAR' ? '\\d{4}-\\d{2}-\\d{2}' : undefined}
                placeholder={calendarType === 'LUNAR' ? '例如 2023-02-30' : undefined}
                required
                type={calendarType === 'SOLAR' ? 'date' : 'text'}
                value={localDate}
              />
              {calendarType === 'LUNAR' ? <p className="mt-2 text-xs text-[var(--ink-soft)]">请按农历年-月-日填写，例如二月三十写作 2023-02-30。</p> : null}
            </div>
          </div>

          <fieldset className="mt-7">
            <legend className="field-label">时间精度</legend>
            <div className="grid gap-3 sm:grid-cols-3">
              {([['MINUTE', '精确到分钟'], ['HOUR', '只记得小时'], ['UNKNOWN_HOUR', '不知道时辰']] as const).map(([value, label]) => (
                <label className="choice-card text-sm" data-selected={precision === value} key={value}>
                  <input className="sr-only" checked={precision === value} name="precision" onChange={() => setPrecision(value)} type="radio" />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>

          {precision !== 'UNKNOWN_HOUR' ? (
            <div className="mt-7 max-w-xs">
              <label className="field-label" htmlFor="localTime">出生时间</label>
              <input className="field-input" id="localTime" onChange={(event) => setLocalTime(event.target.value)} required step={precision === 'HOUR' ? 3600 : 60} type="time" value={precision === 'HOUR' ? `${localTime.slice(0, 2)}:00` : localTime} />
            </div>
          ) : (
            <p className="mt-6 border-l-2 border-[var(--cinnabar)] pl-4 text-sm leading-6 text-[var(--ink-muted)]">
              可以继续。后续将使用三柱结构，并明确降低结论置信度。
            </p>
          )}

          <div className="mt-8">
            <label className="field-label" htmlFor="location">出生地</label>
            <select className="field-input" id="location" onChange={(event) => setLocationKey(event.target.value as LocationPresetKey)} value={locationKey}>
              {Object.entries(LOCATION_PRESETS).map(([key, value]) => <option key={key} value={key}>{value.label}</option>)}
              <option value="custom">其他地点（手动填写）</option>
            </select>
          </div>

          {locationKey === 'custom' ? (
            <div className="mt-5 grid gap-5 rounded-2xl border border-[var(--line)] bg-white/25 p-5 sm:grid-cols-2">
              <TextField label="国家代码" maxLength={2} onChange={(value) => setCustomLocation({ ...customLocation, countryCode: value })} required value={customLocation.countryCode} />
              <TextField label="省／州" onChange={(value) => setCustomLocation({ ...customLocation, regionName: value })} value={customLocation.regionName} />
              <TextField label="城市" onChange={(value) => setCustomLocation({ ...customLocation, cityName: value })} required value={customLocation.cityName} />
              <TextField label="IANA 时区" onChange={(value) => setCustomLocation({ ...customLocation, timezoneId: value })} required value={customLocation.timezoneId} />
              <p className="self-end text-xs leading-5 text-[var(--ink-soft)] sm:col-span-2">历史 UTC 偏移将根据 IANA 时区和出生日期由服务端自动计算。</p>
              <NumberField label="纬度" max={90} min={-90} onChange={(value) => setCustomLocation({ ...customLocation, latitude: value })} required={useTrueSolarTime} step="0.000001" value={customLocation.latitude} />
              <NumberField label="经度" max={180} min={-180} onChange={(value) => setCustomLocation({ ...customLocation, longitude: value })} required={useTrueSolarTime} step="0.000001" value={customLocation.longitude} />
            </div>
          ) : null}

          <details className="mt-8 border-y border-[var(--line)] py-5">
            <summary className="cursor-pointer text-sm font-bold">高级排盘选项</summary>
            <div className="mt-5 space-y-5">
              <label className="flex items-start gap-3 text-sm leading-6">
                <input checked={useTrueSolarTime} className="mt-1" onChange={(event) => setUseTrueSolarTime(event.target.checked)} type="checkbox" />
                <span><strong>使用真太阳时</strong><br /><span className="text-[var(--ink-muted)]">后续排盘时会根据经度修正当地时间。</span></span>
              </label>
              <fieldset>
                <legend className="field-label">子时换日规则</legend>
                <div className="flex flex-wrap gap-5 text-sm">
                  <label className="flex items-center gap-2"><input checked={dayBoundaryRule === 'MIDNIGHT'} name="dayBoundary" onChange={() => setDayBoundaryRule('MIDNIGHT')} type="radio" />零点换日</label>
                  <label className="flex items-center gap-2"><input checked={dayBoundaryRule === 'LATE_ZI_HOUR'} name="dayBoundary" onChange={() => setDayBoundaryRule('LATE_ZI_HOUR')} type="radio" />晚子时换日</label>
                </div>
              </fieldset>
            </div>
          </details>

          <SubmitArea error={error} label="保存并准备排盘" submitting={submitting} />
        </form>
      ) : null}

      {step === 3 && profile && birthRecord ? (
        <section className="reveal-up py-8 text-center">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-full border border-[var(--jade)]/30 bg-[var(--jade)]/8 text-3xl text-[var(--jade)]">✓</div>
          <p className="mt-8 text-xs font-bold tracking-[0.2em] text-[var(--cinnabar)]">BIRTH INPUT SAVED</p>
          <h1 className="display-title mt-4 text-4xl sm:text-5xl">基础档案已就位</h1>
          <p className="mx-auto mt-5 max-w-xl leading-7 text-[var(--ink-muted)]">
            {profile.displayName}，你的第 {birthRecord.revision} 版出生信息已安全保存。下一步将由确定性代码生成基础命盘，不会让 AI 自行排盘。
          </p>
          <div className="mx-auto mt-9 max-w-lg border-y border-[var(--line)] py-5 text-left text-sm">
            <div className="flex justify-between gap-6 py-2"><span className="text-[var(--ink-soft)]">历法</span><strong>{birthRecord.calendarType === 'SOLAR' ? '公历' : `农历${birthRecord.isLeapMonth ? ' · 闰月' : ''}`}</strong></div>
            <div className="flex justify-between gap-6 py-2"><span className="text-[var(--ink-soft)]">时间精度</span><strong>{birthRecord.precision === 'UNKNOWN_HOUR' ? '未知时辰' : birthRecord.precision === 'HOUR' ? '精确到小时' : '精确到分钟'}</strong></div>
            <div className="flex justify-between gap-6 py-2"><span className="text-[var(--ink-soft)]">真太阳时</span><strong>{birthRecord.useTrueSolarTime ? '将在排盘时修正' : '不使用'}</strong></div>
          </div>
          <Link className="primary-link mt-9" href={`/charts/${profile.id}`}>查看基础命盘 <span aria-hidden="true">→</span></Link>
          <p className="mt-3 text-xs text-[var(--ink-soft)]">命盘已由确定性引擎生成，不包含 AI 推断</p>
        </section>
      ) : null}
    </div>
  );
}

function SubmitArea({ error, label, submitting }: { readonly error: string | null; readonly label: string; readonly submitting: boolean }) {
  return (
    <div className="mt-10 border-t border-[var(--line)] pt-7">
      {error ? <p aria-live="polite" className="mb-4 rounded-lg border border-red-800/20 bg-red-800/5 px-4 py-3 text-sm text-red-900">{error}</p> : null}
      <button className="primary-link w-full sm:w-auto" disabled={submitting} type="submit">
        {submitting ? '正在保存…' : label}<span aria-hidden="true">→</span>
      </button>
    </div>
  );
}

function TextField({ label, maxLength, onChange, required = false, value }: { readonly label: string; readonly maxLength?: number; readonly onChange: (value: string) => void; readonly required?: boolean; readonly value: string }) {
  return <label><span className="field-label">{label}</span><input className="field-input" maxLength={maxLength} onChange={(event) => onChange(event.target.value)} required={required} value={value} /></label>;
}

function NumberField({ label, max, min, onChange, required = false, step = '1', value }: { readonly label: string; readonly max: number; readonly min: number; readonly onChange: (value: string) => void; readonly required?: boolean; readonly step?: string; readonly value: string }) {
  return <label><span className="field-label">{label}</span><input className="field-input" max={max} min={min} onChange={(event) => onChange(event.target.value)} required={required} step={step} type="number" value={value} /></label>;
}
