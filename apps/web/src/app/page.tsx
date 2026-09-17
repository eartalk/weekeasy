import { Button } from '@weekeasy/ui';

const steps = [
  ['01', '建立档案', '用出生信息形成可追溯、带版本的基础结构。'],
  ['02', '完成测评', '用简版 Big Five 记录此刻真实的自我观察。'],
  ['03', '交叉理解', '看见一致、互补、冲突与仍需验证的部分。'],
] as const;

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-8 sm:px-10">
      <nav className="flex items-center justify-between border-b border-teal-950/10 pb-6">
        <span className="text-lg font-bold tracking-tight">WeekEasy</span>
        <span className="text-sm text-teal-950/60">传统视角 × 人格测评</span>
      </nav>

      <section className="grid flex-1 items-center gap-16 py-20 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <p className="mb-5 text-sm font-semibold tracking-[0.2em] text-teal-700">不预测命运，只增加理解</p>
          <h1 className="max-w-3xl text-5xl leading-[1.06] font-semibold tracking-[-0.045em] text-balance sm:text-7xl">
            多一种视角，<br />更诚实地理解自己。
          </h1>
          <p className="mt-8 max-w-xl text-lg leading-8 text-teal-950/65">
            将传统八字结构与 Big Five 测评放在一起比较。结论附带证据、置信度和可验证问题，由你判断什么真正适合自己。
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-5">
            <Button className="px-7 py-3.5">开始了解自己</Button>
            <span className="text-sm text-teal-950/50">约 12 分钟 · 可先游客体验</span>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/80 bg-white/65 p-6 shadow-[0_30px_80px_-45px_rgba(15,78,69,0.5)] backdrop-blur sm:p-8">
          <p className="mb-8 text-xs font-bold tracking-[0.18em] text-teal-700">HOW IT WORKS</p>
          <ol className="space-y-7">
            {steps.map(([number, title, description]) => (
              <li className="grid grid-cols-[2.5rem_1fr] gap-4" key={number}>
                <span className="font-mono text-sm text-teal-700">{number}</span>
                <div>
                  <h2 className="font-semibold">{title}</h2>
                  <p className="mt-1 text-sm leading-6 text-teal-950/55">{description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </main>
  );
}
