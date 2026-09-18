'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import type { ChartResponse } from '@weekeasy/api-contracts';
import { ApiRequestError } from '../../onboarding/api/onboarding-api';
import { getLatestChart } from '../api/chart-api';
import {
  FIVE_ELEMENTS,
  countSurfaceElements,
  positionLabel,
  presentPillars,
  relationLabel,
} from '../lib/chart-presenter';

const ELEMENT_STYLES = {
  木: 'bg-[#3f795f]',
  火: 'bg-[#b84a37]',
  土: 'bg-[#a47943]',
  金: 'bg-[#8a8271]',
  水: 'bg-[#376c7a]',
} as const;

const PILLAR_BORDERS = {
  year: 'border-r border-b lg:border-b-0',
  month: 'border-b lg:border-r lg:border-b-0',
  day: 'border-r',
  hour: '',
} as const;

function readableError(error: unknown): string {
  if (error instanceof ApiRequestError) {
    if (error.status === 401) return '游客会话已失效，请重新开始建立档案。';
    if (error.status === 404) return '没有找到这份命盘，可能尚未完成出生信息。';
    return error.message;
  }
  if (error instanceof Error && error.name === 'ZodError') {
    return '命盘数据格式异常，请稍后重试。';
  }
  return '暂时无法读取命盘，请检查网络后重试。';
}

export function ChartResult({ profileId }: { readonly profileId: string }) {
  const [chart, setChart] = useState<ChartResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadChart = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setChart(await getLatestChart(profileId));
    } catch (requestError) {
      setError(readableError(requestError));
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    void loadChart();
  }, [loadChart]);

  if (loading) return <ChartLoading />;
  if (error || !chart) return <ChartError message={error ?? '命盘暂不可用'} onRetry={loadChart} />;

  const pillars = presentPillars(chart);
  const elements = countSurfaceElements(chart);
  const elementTotal = Object.values(elements).reduce((sum, count) => sum + count, 0);
  const dayMaster = chart.chartData.day;

  return (
    <div className="space-y-10">
      <header className="reveal-up grid gap-8 border-b border-[var(--line-strong)] pb-10 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <div className="mb-5 flex items-center gap-3 text-xs font-bold tracking-[0.22em] text-[var(--cinnabar)]">
            <span className="h-px w-9 bg-current" /> DETERMINISTIC CHART
          </div>
          <h1 className="display-title text-5xl tracking-[-0.05em] sm:text-7xl">你的基础命盘</h1>
          <p className="mt-5 max-w-2xl leading-7 text-[var(--ink-muted)]">
            这是一份由历法代码确定性计算的结构快照。它展示数据，不替你下结论。
          </p>
        </div>
        <div className="flex flex-wrap gap-3 print:hidden">
          <button className="secondary-action" onClick={() => window.print()} type="button">打印留存</button>
          <Link className="secondary-action" href="/start">重新建档</Link>
        </div>
      </header>

      <section aria-labelledby="pillars-title" className="reveal-up reveal-delay">
        <div className="mb-6 flex items-end justify-between gap-5">
          <div>
            <p className="text-xs font-bold tracking-[0.2em] text-[var(--jade)]">FOUR PILLARS</p>
            <h2 className="display-title mt-2 text-3xl" id="pillars-title">四柱结构</h2>
          </div>
          <p className="hidden text-xs text-[var(--ink-soft)] sm:block">日干为日主 · 藏干相对日主推导十神</p>
        </div>
        <div className="grid grid-cols-2 overflow-hidden rounded-[1.5rem] border border-[var(--line-strong)] bg-white/30 shadow-[0_28px_70px_-50px_rgba(22,75,67,0.7)] lg:grid-cols-4">
          {pillars.map((pillar) => (
            <article
              className={`relative min-h-[24rem] border-[var(--line)] p-5 sm:p-7 ${PILLAR_BORDERS[pillar.key]} ${pillar.key === 'day' ? 'bg-[var(--jade)]/[0.055]' : ''}`}
              key={pillar.key}
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-bold tracking-[0.15em]">{pillar.label}</h3>
                {pillar.key === 'day' ? <span className="rounded-full bg-[var(--cinnabar)] px-2 py-1 text-[0.65rem] font-bold tracking-wider text-white">核心</span> : null}
              </div>
              {pillar.detail ? (
                <>
                  <div className="mt-8 space-y-3 text-center">
                    <div>
                      <span className="display-title block text-6xl leading-none">{pillar.detail.stem}</span>
                      <span className="mt-3 block text-xs text-[var(--ink-soft)]">{pillar.detail.stemYinYang}{pillar.detail.stemElement} · {pillar.detail.stemTenGod ?? '日主'}</span>
                    </div>
                    <div className="mx-auto h-px w-10 bg-[var(--cinnabar)]/45" />
                    <div>
                      <span className="display-title block text-6xl leading-none">{pillar.detail.branch}</span>
                      <span className="mt-3 block text-xs text-[var(--ink-soft)]">{pillar.detail.branchYinYang}{pillar.detail.branchElement}</span>
                    </div>
                  </div>
                  <div className="mt-8 border-t border-[var(--line)] pt-5">
                    <p className="text-[0.68rem] font-bold tracking-[0.16em] text-[var(--ink-soft)]">藏干</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {pillar.detail.hiddenStems.map((hidden) => (
                        <span className="rounded-full border border-[var(--line)] bg-white/40 px-2.5 py-1 text-xs" key={`${hidden.stem}-${hidden.tenGod}`}>
                          {hidden.stem} · {hidden.tenGod}
                        </span>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="grid min-h-[18rem] place-items-center text-center">
                  <div>
                    <span className="display-title text-5xl text-[var(--ink-soft)]">未</span>
                    <p className="mt-4 text-sm leading-6 text-[var(--ink-muted)]">出生时辰未知<br />不推测时柱</p>
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.82fr_1.18fr]">
        <article className="reveal-up rounded-[1.5rem] border border-[var(--line)] bg-white/25 p-6 sm:p-8">
          <p className="text-xs font-bold tracking-[0.2em] text-[var(--jade)]">DAY MASTER</p>
          <h2 className="display-title mt-2 text-3xl">日主</h2>
          <div className="mt-7 flex items-center gap-6">
            <span className="display-title grid h-24 w-24 shrink-0 place-items-center rounded-full border border-[var(--cinnabar)]/30 bg-[var(--cinnabar)]/[0.055] text-5xl text-[var(--cinnabar)]">{dayMaster.stem}</span>
            <div>
              <p className="text-lg font-bold">{dayMaster.stemYinYang}{dayMaster.stemElement}</p>
              <p className="mt-2 text-sm leading-6 text-[var(--ink-muted)]">日柱天干是后续十神关系的参照点。这里只陈列结构，不作性格判断。</p>
            </div>
          </div>
        </article>

        <article className="reveal-up rounded-[1.5rem] border border-[var(--line)] bg-white/25 p-6 sm:p-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold tracking-[0.2em] text-[var(--jade)]">FIVE ELEMENTS</p>
              <h2 className="display-title mt-2 text-3xl">表层五行</h2>
            </div>
            <p className="text-xs text-[var(--ink-soft)]">天干 + 地支，不含藏干权重</p>
          </div>
          <div className="mt-7 space-y-4">
            {FIVE_ELEMENTS.map((element) => (
              <div className="grid grid-cols-[1.5rem_1fr_1.5rem] items-center gap-3" key={element}>
                <span className="text-sm font-bold">{element}</span>
                <div className="h-2 overflow-hidden rounded-full bg-[var(--line)]">
                  <div className={`h-full rounded-full ${ELEMENT_STYLES[element]}`} style={{ width: `${elementTotal ? (elements[element] / elementTotal) * 100 : 0}%` }} />
                </div>
                <span className="text-right text-sm tabular-nums text-[var(--ink-muted)]">{elements[element]}</span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-[1.5rem] border border-[var(--line)] p-6 sm:p-8">
          <p className="text-xs font-bold tracking-[0.2em] text-[var(--jade)]">STRUCTURAL LINKS</p>
          <h2 className="display-title mt-2 text-3xl">地支关系</h2>
          {chart.chartData.relations.length ? (
            <ul className="mt-6 space-y-3">
              {chart.chartData.relations.map((relation, index) => (
                <li className="flex items-center justify-between gap-4 border-b border-[var(--line)] pb-3" key={`${relation.kind}-${index}`}>
                  <span className="text-sm text-[var(--ink-muted)]">{relation.positions.map(positionLabel).join(' · ')}</span>
                  <strong className="display-title text-xl text-[var(--cinnabar)]">{relationLabel(relation.kind)}</strong>
                </li>
              ))}
            </ul>
          ) : <p className="mt-6 text-sm leading-7 text-[var(--ink-muted)]">当前四柱之间未检测到基础刑、冲、合、害结构。</p>}
        </article>

        <article className="rounded-[1.5rem] border border-[var(--line)] p-6 sm:p-8">
          <p className="text-xs font-bold tracking-[0.2em] text-[var(--jade)]">DATA QUALITY</p>
          <h2 className="display-title mt-2 text-3xl">数据完整度</h2>
          <div className="mt-6 flex items-center gap-3">
            <span className={`h-2.5 w-2.5 rounded-full ${chart.warnings.length ? 'bg-amber-600' : 'bg-[var(--jade)]'}`} />
            <strong>{chart.warnings.length ? '存在需要留意的计算条件' : '输入完整，计算已完成'}</strong>
          </div>
          {chart.warnings.length ? (
            <ul className="mt-5 space-y-2 text-sm leading-6 text-[var(--ink-muted)]">
              {chart.warnings.map((warning) => <li key={warning}>— {warning}</li>)}
            </ul>
          ) : <p className="mt-4 text-sm leading-7 text-[var(--ink-muted)]">本次排盘没有产生计算警告。后续分析仍会单独展示规则证据与置信度。</p>}
        </article>
      </section>

      <details className="border-y border-[var(--line)] py-5 text-sm">
        <summary className="cursor-pointer font-bold">查看计算版本与快照信息</summary>
        <dl className="mt-5 grid gap-4 text-[var(--ink-muted)] sm:grid-cols-2 lg:grid-cols-4">
          <div><dt className="text-xs text-[var(--ink-soft)]">排盘引擎</dt><dd className="mt-1 font-mono">{chart.engineVersion}</dd></div>
          <div><dt className="text-xs text-[var(--ink-soft)]">历法适配器</dt><dd className="mt-1 font-mono">{chart.calendarAdapter} {chart.calendarAdapterVersion}</dd></div>
          <div><dt className="text-xs text-[var(--ink-soft)]">计算策略</dt><dd className="mt-1 font-mono">{chart.calculationPolicyVersion}</dd></div>
          <div><dt className="text-xs text-[var(--ink-soft)]">生成时间</dt><dd className="mt-1">{new Intl.DateTimeFormat('zh-CN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(chart.calculatedAt))}</dd></div>
        </dl>
      </details>

      <footer className="rounded-[1.5rem] bg-[var(--ink)] px-6 py-7 text-[#f3f0e7] sm:px-8">
        <p className="text-sm leading-7 text-white/75">传统八字属于文化解释模型，不构成医学、心理或人生决策建议。当前页面只展示确定性排盘数据；性格维度、证据与置信度将在规则分析完成后单独呈现。</p>
      </footer>
    </div>
  );
}

function ChartLoading() {
  return <div aria-live="polite" className="grid min-h-[60vh] place-items-center"><div className="text-center"><span className="mx-auto block h-12 w-12 animate-spin rounded-full border-2 border-[var(--line-strong)] border-t-[var(--cinnabar)]" /><p className="mt-5 text-sm tracking-[0.14em] text-[var(--ink-muted)]">正在展开命盘快照</p></div></div>;
}

function ChartError({ message, onRetry }: { readonly message: string; readonly onRetry: () => void }) {
  return (
    <section className="mx-auto max-w-xl py-24 text-center">
      <span className="display-title text-6xl text-[var(--cinnabar)]">未</span>
      <h1 className="display-title mt-6 text-4xl">暂时没有展开命盘</h1>
      <p className="mt-4 leading-7 text-[var(--ink-muted)]">{message}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3"><button className="primary-link" onClick={onRetry} type="button">重新读取</button><Link className="secondary-action" href="/start">返回建档</Link></div>
    </section>
  );
}
