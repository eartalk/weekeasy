'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  AssessmentAnswer,
  AssessmentAttemptResponse,
  AssessmentResultResponse,
} from '@weekeasy/api-contracts';
import { ApiRequestError } from '../../onboarding/api/onboarding-api';
import {
  completeAssessment,
  getLatestAssessmentResult,
  saveAssessmentAnswers,
  startAssessment,
} from '../api/assessment-api';
import {
  LIKERT_OPTIONS,
  orderedDimensionResults,
} from '../lib/assessment-presenter';

function readableError(error: unknown): string {
  if (error instanceof ApiRequestError) {
    if (error.status === 401) return '游客会话已失效，请重新建立档案。';
    if (error.status === 404) return '没有找到可继续的档案或测评。';
    return error.message;
  }
  if (error instanceof Error && error.name === 'ZodError') return '测评数据格式异常，请稍后重试。';
  return '暂时无法连接测评服务，请检查网络后重试。';
}

export function AssessmentFlow({ profileId }: { readonly profileId: string }) {
  const [attempt, setAttempt] = useState<AssessmentAttemptResponse | null>(null);
  const [result, setResult] = useState<AssessmentResultResponse | null>(null);
  const [answers, setAnswers] = useState<ReadonlyMap<string, number>>(new Map());
  const [questionIndex, setQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const begin = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const started = await startAssessment(profileId);
      const restored = new Map(started.answers.map((answer) => [answer.questionId, answer.value]));
      const firstUnanswered = started.definition.questions.findIndex((question) => !restored.has(question.id));
      setAttempt(started);
      setAnswers(restored);
      setQuestionIndex(firstUnanswered === -1 ? started.definition.questions.length - 1 : firstUnanswered);
      setResult(null);
    } catch (requestError) {
      setError(readableError(requestError));
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setResult(await getLatestAssessmentResult(profileId));
    } catch (requestError) {
      if (requestError instanceof ApiRequestError && requestError.status === 404) {
        await begin();
        return;
      }
      setError(readableError(requestError));
    } finally {
      setLoading(false);
    }
  }, [begin, profileId]);

  useEffect(() => { void load(); }, [load]);

  const answerList = useMemo<AssessmentAnswer[]>(
    () => Array.from(answers, ([questionId, value]) => ({ questionId, value })),
    [answers],
  );

  async function choose(questionId: string, value: number): Promise<void> {
    if (!attempt || saving) return;
    const nextAnswers = new Map(answers).set(questionId, value);
    const snapshot = Array.from(nextAnswers, ([savedQuestionId, savedValue]) => ({
      questionId: savedQuestionId,
      value: savedValue,
    }));
    setAnswers(nextAnswers);
    setSaving(true);
    setError(null);
    try {
      await saveAssessmentAnswers(profileId, attempt.id, snapshot);
      if (questionIndex < attempt.definition.questions.length - 1) {
        setQuestionIndex((current) => current + 1);
      }
    } catch (requestError) {
      setError(readableError(requestError));
    } finally {
      setSaving(false);
    }
  }

  async function finish(): Promise<void> {
    if (!attempt || answerList.length !== attempt.definition.questions.length) return;
    setSaving(true);
    setError(null);
    try {
      setResult(await completeAssessment(profileId, attempt.id, answerList));
      setAttempt(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (requestError) {
      setError(readableError(requestError));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <AssessmentLoading />;
  if (result) return <AssessmentResult profileId={profileId} result={result} onRetake={begin} />;
  if (error && !attempt) return <AssessmentError message={error} onRetry={load} />;
  if (!attempt) return <AssessmentError message="测评暂不可用" onRetry={load} />;

  const question = attempt.definition.questions[questionIndex]!;
  const answeredCount = answers.size;
  const progress = (answeredCount / attempt.definition.questions.length) * 100;
  const allAnswered = answeredCount === attempt.definition.questions.length;

  return (
    <div className="grid gap-10 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-16">
      <aside className="lg:sticky lg:top-8 lg:self-start">
        <p className="text-xs font-bold tracking-[0.22em] text-[var(--cinnabar)]">MINI-IPIP · 20</p>
        <h1 className="display-title mt-4 text-4xl leading-tight">观察此刻的自己</h1>
        <p className="mt-4 text-sm leading-7 text-[var(--ink-muted)]">按通常状态作答，没有正确答案。每次选择都会自动保存。</p>
        <div className="mt-8">
          <div className="flex justify-between text-xs text-[var(--ink-soft)]"><span>已完成</span><span>{answeredCount} / {attempt.definition.questions.length}</span></div>
          <div className="mt-3 h-1 overflow-hidden rounded-full bg-[var(--line)]"><div className="h-full bg-[var(--cinnabar)] transition-[width] duration-500" style={{ width: `${progress}%` }} /></div>
        </div>
        <ol aria-label="答题进度" className="mt-8 grid grid-cols-10 gap-2 lg:grid-cols-5">
          {attempt.definition.questions.map((item, index) => (
            <li key={item.id}>
              <button
                aria-label={`第 ${index + 1} 题${answers.has(item.id) ? '，已作答' : ''}`}
                className={`grid h-8 w-full place-items-center rounded-sm text-[0.68rem] transition ${index === questionIndex ? 'bg-[var(--ink)] text-white' : answers.has(item.id) ? 'bg-[var(--jade)] text-white' : 'border border-[var(--line)] text-[var(--ink-soft)]'}`}
                onClick={() => setQuestionIndex(index)}
                type="button"
              >{index + 1}</button>
            </li>
          ))}
        </ol>
      </aside>

      <section aria-labelledby="question-title" className="reveal-up min-w-0">
        <div className="flex items-center gap-4 text-xs font-bold tracking-[0.18em] text-[var(--jade)]">
          <span className="display-title text-5xl leading-none text-[var(--cinnabar)]/65">{String(question.position).padStart(2, '0')}</span>
          <span>OF {attempt.definition.questions.length}</span>
        </div>
        <h2 className="display-title mt-8 max-w-3xl text-4xl leading-[1.35] sm:text-5xl" id="question-title" key={question.id}>{question.prompt}</h2>
        <fieldset className="mt-12" disabled={saving}>
          <legend className="sr-only">这句话符合你的程度</legend>
          <div className="grid gap-3 sm:grid-cols-5">
            {LIKERT_OPTIONS.map((option) => {
              const selected = answers.get(question.id) === option.value;
              return (
                <label className={`group cursor-pointer rounded-[1.1rem] border p-4 text-center transition sm:min-h-36 sm:pt-7 ${selected ? 'border-[var(--jade)] bg-[var(--jade)] text-white shadow-lg shadow-[var(--jade)]/10' : 'border-[var(--line-strong)] bg-white/30 hover:-translate-y-1 hover:border-[var(--jade)] hover:bg-white/60'}`} key={option.value}>
                  <input checked={selected} className="sr-only" name={`question-${question.id}`} onChange={() => void choose(question.id, option.value)} type="radio" value={option.value} />
                  <span className={`display-title block text-3xl ${selected ? 'text-white' : 'text-[var(--cinnabar)]'}`}>{option.value}</span>
                  <span className="mt-3 block text-sm font-bold">{option.shortLabel}</span>
                  <span className={`mt-1 block text-[0.68rem] ${selected ? 'text-white/65' : 'text-[var(--ink-soft)]'}`}>{option.label}</span>
                </label>
              );
            })}
          </div>
        </fieldset>
        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--line)] pt-6">
          <button className="secondary-action disabled:opacity-40" disabled={questionIndex === 0 || saving} onClick={() => setQuestionIndex((current) => current - 1)} type="button">上一题</button>
          <div aria-live="polite" className="text-xs text-[var(--ink-soft)]">{saving ? '正在保存…' : error ?? '进度已保存'}</div>
          {allAnswered ? (
            <button className="primary-link" disabled={saving} onClick={() => void finish()} type="button">完成并查看结果 <span aria-hidden="true">→</span></button>
          ) : (
            <button className="secondary-action disabled:opacity-40" disabled={questionIndex >= attempt.definition.questions.length - 1 || saving} onClick={() => setQuestionIndex((current) => current + 1)} type="button">下一题</button>
          )}
        </div>
        <p className="mt-8 max-w-2xl text-xs leading-6 text-[var(--ink-soft)]">Mini-IPIP 是简短的自我报告工具。结果用于自我反思，不是医学或心理诊断，也不代表固定人格类型。</p>
      </section>
    </div>
  );
}

function AssessmentResult({ profileId, result, onRetake }: {
  readonly profileId: string;
  readonly result: AssessmentResultResponse;
  readonly onRetake: () => Promise<void>;
}) {
  const dimensions = orderedDimensionResults(result);
  return (
    <div className="space-y-12">
      <header className="grid gap-8 border-b border-[var(--line-strong)] pb-10 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="text-xs font-bold tracking-[0.22em] text-[var(--cinnabar)]">SELF-REPORTED · BIG FIVE</p>
          <h1 className="display-title mt-4 text-5xl tracking-[-0.04em] sm:text-7xl">五条连续谱</h1>
          <p className="mt-5 max-w-2xl leading-7 text-[var(--ink-muted)]">这是你对近期通常状态的自我描述。分数表示本问卷量表内的位置，不是人群百分位，也不是好坏排名。</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link className="secondary-action" href={`/charts/${profileId}`}>查看基础命盘</Link>
          <button className="secondary-action" onClick={() => void onRetake()} type="button">重新测评</button>
        </div>
      </header>

      <section aria-label="Big Five 五维结果" className="space-y-5">
        {dimensions.map((item, index) => (
          <article className="reveal-up grid gap-5 rounded-[1.4rem] border border-[var(--line)] bg-white/25 p-6 sm:grid-cols-[12rem_1fr] sm:p-8" key={item.dimension} style={{ animationDelay: `${index * 70}ms` }}>
            <div>
              <p className="text-[0.65rem] font-bold tracking-[0.18em] text-[var(--jade)]">{item.english}</p>
              <h2 className="display-title mt-2 text-3xl">{item.name}</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--ink-muted)]">{item.description}</p>
            </div>
            <div className="self-center">
              <div className="flex items-end justify-between"><span className="text-xs text-[var(--ink-soft)]">{item.low}</span><strong className="display-title text-3xl text-[var(--cinnabar)]">{Math.round(item.score)}</strong><span className="text-xs text-[var(--ink-soft)]">{item.high}</span></div>
              <div className="relative mt-4 h-3 rounded-full bg-gradient-to-r from-[var(--paper-deep)] via-[#d7ded8] to-[var(--jade)]/75">
                <span className="absolute top-1/2 h-6 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--cinnabar)] shadow-[0_0_0_4px_rgba(243,240,231,0.9)]" style={{ left: `${item.score}%` }} />
              </div>
            </div>
          </article>
        ))}
      </section>

      {result.validity.issues.length ? (
        <aside className="rounded-[1.4rem] border border-amber-700/25 bg-amber-50/50 p-6">
          <h2 className="font-bold">这次结果需要谨慎看待</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--ink-muted)]">{result.validity.issues.includes('TOO_FAST') ? '作答时间较短。' : ''}{result.validity.issues.includes('STRAIGHT_LINING') ? '较多题目选择了同一选项。' : ''}你可以重新作答，以获得更稳定的自我观察。</p>
        </aside>
      ) : null}

      <footer className="rounded-[1.5rem] bg-[var(--ink)] px-6 py-7 text-[#f3f0e7] sm:px-8">
        <p className="text-sm leading-7 text-white/75">Mini-IPIP 每个维度只有 4 道题，适合快速观察，不适合精确诊断。结果来自你的问卷答案，与传统命盘是不同证据来源；后续交叉分析会明确区分两者。</p>
        <p className="mt-3 text-xs text-white/45">问卷版本 {result.definitionVersion} · 完整度 {Math.round(result.dataCompleteness * 100)}%</p>
      </footer>
    </div>
  );
}

function AssessmentLoading() {
  return <div aria-live="polite" className="grid min-h-[60vh] place-items-center"><div className="text-center"><span className="mx-auto block h-12 w-12 animate-spin rounded-full border-2 border-[var(--line-strong)] border-t-[var(--cinnabar)]" /><p className="mt-5 text-sm tracking-[0.14em] text-[var(--ink-muted)]">正在打开观察手册</p></div></div>;
}

function AssessmentError({ message, onRetry }: { readonly message: string; readonly onRetry: () => void }) {
  return <section className="mx-auto max-w-xl py-24 text-center"><span className="display-title text-6xl text-[var(--cinnabar)]">问</span><h1 className="display-title mt-6 text-4xl">测评暂时没有展开</h1><p className="mt-4 leading-7 text-[var(--ink-muted)]">{message}</p><div className="mt-8 flex justify-center gap-3"><button className="primary-link" onClick={onRetry} type="button">重新读取</button><Link className="secondary-action" href="/start">返回建档</Link></div></section>;
}
