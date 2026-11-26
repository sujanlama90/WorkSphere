import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Bell,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  FileText,
  FolderKanban,
  LifeBuoy,
  MessageSquare,
  ShieldCheck,
  Ticket,
  Users,
} from 'lucide-react'

const features = [
  {
    icon: FolderKanban,
    title: 'Client-to-project workflow',
    description:
      'Keep client organizations, project requests, project owners, priorities, and delivery dates connected.',
    tint: 'blue',
  },
  {
    icon: ClipboardCheck,
    title: 'Clear task ownership',
    description:
      'Create project tasks, assign work, set due dates, and move tasks through a defined review workflow.',
    tint: 'violet',
  },
  {
    icon: MessageSquare,
    title: 'Context in one place',
    description:
      'Discuss tasks and support tickets with comments, attachments, and a visible activity history.',
    tint: 'emerald',
  },
  {
    icon: Ticket,
    title: 'Support that stays connected',
    description:
      'Track client support tickets against their project, with priority, assignment, and resolution status.',
    tint: 'orange',
  },
  {
    icon: Clock3,
    title: 'Practical time tracking',
    description:
      'Let administrators, project managers, and employees record time against the tasks they can access.',
    tint: 'cyan',
  },
  {
    icon: Activity,
    title: 'Useful visibility',
    description:
      'Use role-aware dashboards, notifications, activity history, and project or task CSV exports.',
    tint: 'rose',
  },
]

const roles = [
  {
    name: 'Administrators',
    detail: 'Manage users and roles, clients, projects, requests, tickets, reports, and workspace activity.',
    icon: ShieldCheck,
  },
  {
    name: 'Project managers',
    detail: 'Coordinate owned projects, organize tasks, review work, and follow support requests.',
    icon: BriefcaseBusiness,
  },
  {
    name: 'Employees',
    detail: 'Focus on assigned tasks, update their progress, collaborate, and track working time.',
    icon: Users,
  },
  {
    name: 'Clients',
    detail: 'Follow company projects, submit project requests, and raise or discuss support tickets.',
    icon: LifeBuoy,
  },
]

function Landing() {
  const navigate = useNavigate()

  useEffect(() => {
    if (localStorage.getItem('access_token')) {
      navigate('/dashboard', { replace: true })
    }
  }, [navigate])

  return (
    <div className="min-h-screen overflow-hidden bg-[#f7f8fa] text-slate-950">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <nav className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link to="/" className="flex items-center gap-3" aria-label="WorkSphere home">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-950 text-white shadow-lg shadow-slate-900/10">
              <BriefcaseBusiness size={20} />
            </span>
            <span className="text-xl font-extrabold tracking-tight">
              Work<span className="text-blue-600">Sphere</span>
            </span>
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            <a href="#platform" className="text-sm font-medium text-slate-600 transition hover:text-blue-700">Platform</a>
            <a href="#workflow" className="text-sm font-medium text-slate-600 transition hover:text-blue-700">How it works</a>
            <a href="#teams" className="text-sm font-medium text-slate-600 transition hover:text-blue-700">For your team</a>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <Link to="/login" className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 sm:px-4">
              Sign in
            </Link>
            <Link to="/register" className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 sm:px-5">
              Create account
              <ArrowRight size={16} />
            </Link>
          </div>
        </nav>
      </header>

      <main>
        <section className="relative isolate">
          <div className="pointer-events-none absolute -right-36 top-8 -z-10 h-[520px] w-[520px] rounded-full bg-blue-200/40 blur-3xl" />
          <div className="pointer-events-none absolute -left-48 top-64 -z-10 h-[420px] w-[420px] rounded-full bg-violet-100/70 blur-3xl" />

          <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 pb-20 pt-16 sm:px-8 sm:pt-24 lg:grid-cols-[.95fr_1.05fr] lg:gap-10 lg:pb-28 lg:pt-24">
            <div className="relative z-10">
              <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-3.5 py-2 text-xs font-bold uppercase tracking-[.13em] text-blue-800 shadow-sm">
                <span className="h-2 w-2 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
                A clearer way to run project work
              </div>

              <h1 className="max-w-2xl text-[2.8rem] font-bold leading-[1.07] tracking-[-.045em] text-slate-950 sm:text-6xl lg:text-[4.25rem]">
                From the first request
                <span className="mt-1 block text-blue-700">to the final delivery.</span>
              </h1>

              <p className="mt-7 max-w-xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
                WorkSphere brings client organizations, project plans, task workflows, and support tickets into one workspace—so every role can focus on the work that belongs to them.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link to="/register" className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-xl shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700">
                  Create a client account
                  <ArrowRight size={17} />
                </Link>
                <a href="#platform" className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white/80 px-6 py-3.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-white">
                  Explore the platform
                  <ChevronRight size={17} />
                </a>
              </div>

              <p className="mt-5 max-w-lg text-xs leading-5 text-slate-500">
                Public registration creates a client account. An administrator manages team roles and access.
              </p>

              <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 border-t border-slate-200 pt-6 text-sm font-medium text-slate-600">
                <span className="inline-flex items-center gap-2"><Check size={16} className="text-emerald-600" />Projects and tasks</span>
                <span className="inline-flex items-center gap-2"><Check size={16} className="text-emerald-600" />Client support</span>
                <span className="inline-flex items-center gap-2"><Check size={16} className="text-emerald-600" />Role-based access</span>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[650px] lg:ml-auto">
              <div className="absolute -inset-5 rounded-[2rem] bg-gradient-to-br from-blue-200/70 via-violet-100/50 to-cyan-100/70 blur-2xl" />
              <div className="relative rounded-[1.7rem] border border-slate-200/80 bg-white/70 p-2.5 shadow-[0_32px_100px_-40px_rgba(15,23,42,.35)] backdrop-blur sm:p-4">
                <div className="overflow-hidden rounded-[1.25rem] border border-slate-200 bg-white">
                  <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5 sm:px-5">
                    <div className="flex items-center gap-2.5">
                      <span className="grid h-8 w-8 place-items-center rounded-lg bg-slate-950 text-white"><BriefcaseBusiness size={16} /></span>
                      <div>
                        <p className="text-xs font-bold text-slate-900">WorkSphere</p>
                        <p className="text-[10px] text-slate-400">Sample workspace</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Project overview
                    </span>
                  </div>

                  <div className="grid min-h-[350px] sm:grid-cols-[142px_1fr]">
                    <aside className="hidden border-r border-slate-100 bg-slate-50/80 p-3 sm:block">
                      <p className="px-2 pb-3 pt-1 text-[9px] font-bold uppercase tracking-[.16em] text-slate-400">Workspace</p>
                      <div className="space-y-1">
                        <PreviewNav icon={FolderKanban} label="Projects" active />
                        <PreviewNav icon={ClipboardCheck} label="Tasks" />
                        <PreviewNav icon={Ticket} label="Support" />
                        <PreviewNav icon={Bell} label="Updates" />
                      </div>
                      <div className="mt-8 rounded-xl border border-slate-200 bg-white p-3">
                        <p className="text-[10px] font-bold text-slate-700">Keep the work connected</p>
                        <p className="mt-1 text-[9px] leading-4 text-slate-400">Projects, tasks, and support stay linked.</p>
                      </div>
                    </aside>

                    <div className="p-4 sm:p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-[.14em] text-blue-700">Workspace overview</p>
                          <h2 className="mt-1 text-lg font-bold tracking-tight text-slate-900">Your work, in context</h2>
                          <p className="mt-1 text-[11px] text-slate-500">A sample view of the WorkSphere workspace.</p>
                        </div>
                        <span className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[10px] font-semibold text-slate-500">Example data</span>
                      </div>

                      <div className="mt-5 grid grid-cols-3 gap-2">
                        <PreviewMetric label="Projects" value="Organized" icon={FolderKanban} color="blue" />
                        <PreviewMetric label="Tasks" value="Assigned" icon={ClipboardCheck} color="violet" />
                        <PreviewMetric label="Support" value="Connected" icon={LifeBuoy} color="orange" />
                      </div>

                      <div className="mt-4 rounded-xl border border-slate-200">
                        <div className="flex items-center justify-between border-b border-slate-100 px-3.5 py-3">
                          <div>
                            <h3 className="text-xs font-bold text-slate-800">Project activity</h3>
                            <p className="mt-0.5 text-[9px] text-slate-400">Example workflow</p>
                          </div>
                          <ArrowUpRight size={15} className="text-slate-400" />
                        </div>
                        <div className="divide-y divide-slate-100">
                          <PreviewItem title="Website refresh" detail="Design review task" status="IN REVIEW" tint="violet" />
                          <PreviewItem title="Client onboarding" detail="Project request" status="PENDING" tint="amber" />
                          <PreviewItem title="Billing question" detail="Support ticket" status="IN PROGRESS" tint="blue" />
                        </div>
                      </div>

                      <div className="mt-4 flex items-center gap-2 rounded-xl bg-slate-50 px-3.5 py-3">
                        <span className="grid h-7 w-7 place-items-center rounded-lg bg-white text-blue-700 shadow-sm"><MessageSquare size={14} /></span>
                        <p className="text-[10px] leading-4 text-slate-600">Keep discussion and files alongside the work.</p>
                        <CheckCircle2 size={15} className="ml-auto shrink-0 text-emerald-600" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-5 -left-3 hidden items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-xl sm:flex lg:-left-10">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><Activity size={18} /></span>
                <span><strong className="block text-xs text-slate-800">Clear progress</strong><small className="text-[10px] text-slate-500">Visible to the right people</small></span>
              </div>
            </div>
          </div>
        </section>

        <section id="platform" className="scroll-mt-24 border-y border-slate-200 bg-white py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-xs font-bold uppercase tracking-[.18em] text-blue-700">One connected workflow</p>
              <h2 className="mt-4 text-3xl font-bold tracking-[-.035em] text-slate-950 sm:text-4xl">The tools your project work depends on</h2>
              <p className="mt-4 text-base leading-7 text-slate-600">
                Move from a client request to planned work, team collaboration, and support without losing the context.
              </p>
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => {
                const Icon = feature.icon
                const iconStyle = {
                  blue: 'bg-blue-50 text-blue-700',
                  violet: 'bg-violet-50 text-violet-700',
                  emerald: 'bg-emerald-50 text-emerald-700',
                  orange: 'bg-orange-50 text-orange-700',
                  cyan: 'bg-cyan-50 text-cyan-700',
                  rose: 'bg-rose-50 text-rose-700',
                }[feature.tint]

                return (
                  <article key={feature.title} className="group rounded-2xl border border-slate-200 bg-white p-6 transition duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-slate-900/5 sm:p-7">
                    <span className={`grid h-11 w-11 place-items-center rounded-xl ${iconStyle}`}>
                      <Icon size={20} />
                    </span>
                    <h3 className="mt-5 text-base font-bold text-slate-900">{feature.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{feature.description}</p>
                    <span className="mt-5 inline-flex items-center gap-1 text-xs font-semibold text-blue-700 opacity-0 transition group-hover:opacity-100">
                      Part of the workspace <ChevronRight size={14} />
                    </span>
                  </article>
                )
              })}
            </div>
          </div>
        </section>

        <section id="workflow" className="scroll-mt-24 py-20 sm:py-24">
          <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[.8fr_1.2fr] lg:items-start">
            <div className="lg:sticky lg:top-32">
              <p className="text-xs font-bold uppercase tracking-[.18em] text-blue-700">How it works</p>
              <h2 className="mt-4 text-3xl font-bold leading-tight tracking-[-.035em] text-slate-950 sm:text-4xl">
                A shared path from request to delivery.
              </h2>
              <p className="mt-5 max-w-md text-base leading-7 text-slate-600">
                Each step keeps the right people informed while responsibilities stay clear.
              </p>
              <Link to="/register" className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-blue-700 hover:text-blue-800">
                Start with a client account <ArrowRight size={16} />
              </Link>
            </div>

            <div className="space-y-4">
              <WorkflowStep
                number="01"
                icon={FileText}
                title="Capture the request"
                description="Clients submit a project brief and expected dates. Administrators can review it, request more information, or approve it into a project."
              />
              <WorkflowStep
                number="02"
                icon={ClipboardCheck}
                title="Plan and move the work"
                description="Managers organize projects and tasks. Employees update assigned task progress through a clear review flow."
              />
              <WorkflowStep
                number="03"
                icon={MessageSquare}
                title="Keep the conversation connected"
                description="Use comments, attachments, notifications, and project-linked support tickets to keep important context with the work."
              />
            </div>
          </div>
        </section>

        <section id="teams" className="scroll-mt-24 bg-slate-950 py-20 text-white sm:py-24">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-end">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.18em] text-blue-300">Built around roles</p>
                <h2 className="mt-4 text-3xl font-bold tracking-[-.035em] sm:text-4xl">Everyone sees their part of the work.</h2>
              </div>
              <p className="max-w-xl text-sm leading-7 text-slate-300 lg:justify-self-end">
                WorkSphere uses role-based access for administrators, project managers, employees, and clients. Pages and actions are governed by the account’s role and project access.
              </p>
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {roles.map((role) => {
                const Icon = role.icon
                return (
                  <article key={role.name} className="rounded-2xl border border-white/10 bg-white/[.04] p-5 transition hover:border-blue-300/40 hover:bg-white/[.07]">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-500/15 text-blue-300"><Icon size={19} /></span>
                    <h3 className="mt-5 text-sm font-bold">{role.name}</h3>
                    <p className="mt-2 text-xs leading-5 text-slate-400">{role.detail}</p>
                  </article>
                )
              })}
            </div>
          </div>
        </section>

        <section className="bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="relative overflow-hidden rounded-[1.75rem] bg-blue-700 px-6 py-10 text-white sm:px-10 sm:py-12 lg:px-14">
              <div className="pointer-events-none absolute -right-16 -top-32 h-80 w-80 rounded-full border-[40px] border-white/[.08]" />
              <div className="pointer-events-none absolute -bottom-40 right-1/3 h-72 w-72 rounded-full bg-cyan-300/10 blur-3xl" />
              <div className="relative flex flex-col justify-between gap-8 lg:flex-row lg:items-center">
                <div className="max-w-2xl">
                  <p className="text-xs font-bold uppercase tracking-[.18em] text-blue-100">Get started</p>
                  <h2 className="mt-3 text-3xl font-bold tracking-[-.035em] sm:text-4xl">Bring your project work into focus.</h2>
                  <p className="mt-3 text-sm leading-6 text-blue-100">
                    Create a client account to submit project requests and follow your organization’s work in WorkSphere.
                  </p>
                </div>
                <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
                  <Link to="/register" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-blue-800 shadow-lg transition hover:bg-blue-50">
                    Create client account <ArrowRight size={16} />
                  </Link>
                  <Link to="/login" className="inline-flex items-center justify-center rounded-xl border border-white/30 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10">
                    Sign in
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-[#f7f8fa]">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-5 py-7 sm:flex-row sm:px-8">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-slate-950 text-white"><BriefcaseBusiness size={16} /></span>
            <span className="font-bold tracking-tight">WorkSphere</span>
          </Link>
          <p className="text-center text-xs text-slate-500">A connected workspace for client projects, task delivery, and support.</p>
          <p className="text-xs text-slate-400">© {new Date().getFullYear()} WorkSphere</p>
        </div>
      </footer>
    </div>
  )
}

function PreviewNav({ icon: Icon, label, active = false }) {
  return (
    <div className={`flex items-center gap-2 rounded-lg px-2.5 py-2 text-[10px] font-semibold ${active ? 'bg-blue-50 text-blue-700' : 'text-slate-500'}`}>
      <Icon size={13} />
      {label}
    </div>
  )
}

function PreviewMetric({ label, value, icon: Icon, color }) {
  const styles = {
    blue: 'bg-blue-50 text-blue-700',
    violet: 'bg-violet-50 text-violet-700',
    orange: 'bg-orange-50 text-orange-700',
  }
  return (
    <div className="rounded-xl border border-slate-100 bg-white p-2.5 sm:p-3">
      <div className="flex items-center justify-between gap-1">
        <p className="text-[9px] font-medium text-slate-500">{label}</p>
        <span className={`grid h-6 w-6 place-items-center rounded-md ${styles[color]}`}><Icon size={12} /></span>
      </div>
      <p className="mt-2 text-[10px] font-bold text-slate-800 sm:text-[11px]">{value}</p>
    </div>
  )
}

function PreviewItem({ title, detail, status, tint }) {
  const statusStyles = {
    violet: 'bg-violet-50 text-violet-700',
    amber: 'bg-amber-50 text-amber-700',
    blue: 'bg-blue-50 text-blue-700',
  }
  return (
    <div className="flex items-center justify-between gap-2 px-3.5 py-2.5">
      <div className="min-w-0">
        <p className="truncate text-[10px] font-bold text-slate-800">{title}</p>
        <p className="mt-0.5 truncate text-[9px] text-slate-400">{detail}</p>
      </div>
      <span className={`shrink-0 rounded-md px-2 py-1 text-[8px] font-bold ${statusStyles[tint]}`}>{status}</span>
    </div>
  )
}

function WorkflowStep({ number, icon: Icon, title, description }) {
  return (
    <article className="group flex gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-blue-200 hover:shadow-lg hover:shadow-slate-900/5 sm:gap-5 sm:p-6">
      <div className="flex shrink-0 flex-col items-center gap-3">
        <span className="text-xs font-bold tracking-widest text-blue-700">{number}</span>
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-blue-50 text-blue-700 transition group-hover:bg-blue-600 group-hover:text-white"><Icon size={19} /></span>
      </div>
      <div className="pt-1">
        <h3 className="text-base font-bold text-slate-900">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      </div>
    </article>
  )
}

export default Landing
