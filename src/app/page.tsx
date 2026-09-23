import Link from 'next/link';
import { ArrowRight, ShieldCheck, Sparkles, Users } from 'lucide-react';

const stats = [
  { label: 'Active users', value: '12.4k', icon: Users },
  { label: 'Security score', value: '99.2%', icon: ShieldCheck },
  { label: 'Automation coverage', value: '84%', icon: Sparkles },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto flex max-w-7xl flex-col px-6 py-16 lg:px-8">
        <header className="mb-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-lg font-semibold text-primary-foreground">
              A
            </div>
            <div>
              <p className="text-lg font-semibold">Adminhub</p>
              <p className="text-sm text-slate-300">Administration platform</p>
            </div>
          </div>

          <nav className="hidden items-center gap-6 text-sm text-slate-300 md:flex">
            <Link href="#features">Features</Link>
            <Link href="#security">Security</Link>
            <Link href="#dashboard">Dashboard</Link>
          </nav>
        </header>

        <section className="grid items-center gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="mb-4 inline-flex rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs uppercase tracking-[0.18em] text-sky-300">
              Foundation ready
            </p>
            <h1 className="max-w-xl text-4xl font-bold tracking-tight text-white md:text-6xl">
              Secure administration for modern operations.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-slate-300">
              A production-ready administration platform that centralizes users, teams, records,
              tasks, approvals, audit logs, files, and reports.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-soft transition hover:opacity-95"
              >
                View dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="#features" className="rounded-xl border border-slate-700 px-5 py-3 text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:bg-slate-900">
                Explore features
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-soft">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">System overview</p>
                <h2 className="mt-1 text-2xl font-semibold text-white">Operations</h2>
              </div>
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-300">
                Healthy
              </span>
            </div>

            <div className="space-y-4">
              {stats.map(({ label, value, icon: Icon }) => (
                <div key={label} className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-sky-500/10 p-2 text-sky-300">
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="text-sm text-slate-300">{label}</span>
                  </div>
                  <span className="text-lg font-semibold text-white">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
