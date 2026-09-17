import Link from 'next/link';

const steps = [
  ['一', '留下基础坐标', '昵称与出生信息只用于建立你的分析档案。'],
  ['二', '完成真实自评', '用简版 Big Five 记录此刻的行为与感受。'],
  ['三', '对照两种视角', '结论会展示依据、置信度与可以亲自验证的问题。'],
] as const;

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden px-5 pb-10 sm:px-10">
      <div aria-hidden="true" className="paper-grid absolute inset-0 opacity-35" />
      <div aria-hidden="true" className="seal-orbit -right-40 top-24 hidden lg:block" />

      <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between border-b border-[var(--line)] py-6">
        <Link className="brand-mark" href="/">
          <span aria-hidden="true">易</span>
          <strong>WeekEasy</strong>
        </Link>
        <p className="hidden text-sm tracking-[0.16em] text-[var(--ink-muted)] sm:block">
          传统视角 × 人格测评 × 真实反馈
        </p>
      </nav>

      <section className="relative z-10 mx-auto grid min-h-[calc(100vh-7rem)] max-w-7xl items-center gap-14 py-14 lg:grid-cols-[1.22fr_0.78fr] lg:py-20">
        <div className="reveal-up">
          <div className="mb-8 flex items-center gap-4 text-xs font-semibold tracking-[0.24em] text-[var(--cinnabar)]">
            <span className="h-px w-10 bg-current" />
            SELF KNOWLEDGE, NOT FATE
          </div>
          <h1 className="display-title max-w-4xl text-[clamp(3.5rem,8vw,7.8rem)] leading-[0.96] tracking-[-0.07em]">
            换一个角度，
            <span className="mt-3 block pl-[0.7em] text-[var(--jade)]">读懂自己。</span>
          </h1>
          <p className="mt-10 max-w-2xl text-lg leading-8 text-[var(--ink-muted)] sm:text-xl sm:leading-9">
            把传统八字结构与 Big Five 人格测评放在同一张桌上。我们提供证据和问题，不替你决定答案。
          </p>
          <div className="mt-11 flex flex-wrap items-center gap-5">
            <Link className="primary-link group" href="/start">
              开始了解自己
              <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
            </Link>
            <span className="text-sm text-[var(--ink-soft)]">约 12 分钟 · 无需先注册</span>
          </div>
        </div>

        <aside className="reveal-up reveal-delay relative border-l border-[var(--line-strong)] pl-7 sm:pl-10">
          <p className="mb-10 text-xs font-bold tracking-[0.22em] text-[var(--jade)]">理解如何发生</p>
          <ol className="space-y-9">
            {steps.map(([number, title, description]) => (
              <li className="group grid grid-cols-[2rem_1fr] gap-4" key={number}>
                <span className="display-title text-2xl text-[var(--cinnabar)]">{number}</span>
                <div className="border-b border-[var(--line)] pb-8">
                  <h2 className="text-lg font-semibold tracking-[0.04em]">{title}</h2>
                  <p className="mt-2 text-sm leading-7 text-[var(--ink-muted)]">{description}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-8 text-xs leading-6 text-[var(--ink-soft)]">
            传统文化解释不等同于科学诊断。所有结果都允许你质疑、修正和反馈。
          </p>
        </aside>
      </section>
    </main>
  );
}
