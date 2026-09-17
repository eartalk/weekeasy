import Link from 'next/link';
import { OnboardingFlow } from '../../features/onboarding/components/onboarding-flow';

export default function StartPage() {
  return (
    <main className="relative min-h-screen overflow-hidden px-5 pb-16 sm:px-10">
      <div aria-hidden="true" className="paper-grid absolute inset-0 opacity-25" />
      <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between border-b border-[var(--line)] py-6">
        <Link className="brand-mark" href="/">
          <span aria-hidden="true">易</span>
          <strong>WeekEasy</strong>
        </Link>
        <Link className="text-sm text-[var(--ink-muted)] underline decoration-[var(--line-strong)] underline-offset-4 hover:text-[var(--jade)]" href="/">
          返回首页
        </Link>
      </nav>
      <div className="relative z-10 mx-auto grid max-w-7xl gap-12 py-12 lg:grid-cols-[0.32fr_0.68fr] lg:py-16">
        <aside className="lg:sticky lg:top-10 lg:self-start">
          <p className="display-title text-2xl text-[var(--jade)]">一次温和的<br />自我观察</p>
          <p className="mt-5 max-w-xs text-sm leading-7 text-[var(--ink-muted)]">
            你可以在任何时候停下。完整报告将区分传统解释、测评事实和 AI 表达。
          </p>
          <div className="mt-8 hidden h-40 w-px bg-gradient-to-b from-[var(--cinnabar)]/60 to-transparent lg:block" />
        </aside>
        <OnboardingFlow />
      </div>
    </main>
  );
}
