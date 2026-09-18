import Link from 'next/link';
import { AssessmentFlow } from '../../../features/assessment/components/assessment-flow';

export default async function AssessmentPage({ params }: { readonly params: Promise<{ profileId: string }> }) {
  const { profileId } = await params;
  return (
    <main className="relative min-h-screen overflow-hidden px-5 pb-16 sm:px-10">
      <div aria-hidden="true" className="paper-grid absolute inset-0 opacity-25" />
      <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between border-b border-[var(--line)] py-6">
        <Link className="brand-mark" href="/"><span aria-hidden="true">易</span><strong>WeekEasy</strong></Link>
        <Link className="text-sm text-[var(--ink-muted)] underline decoration-[var(--line-strong)] underline-offset-4 hover:text-[var(--jade)]" href={`/charts/${profileId}`}>返回命盘</Link>
      </nav>
      <div className="relative z-10 mx-auto max-w-7xl py-12 lg:py-16"><AssessmentFlow profileId={profileId} /></div>
    </main>
  );
}
