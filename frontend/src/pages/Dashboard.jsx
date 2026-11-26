
import { useEffect, useState } from 'react'
import { useNavigate, NavLink } from 'react-router-dom'

import {
    LayoutDashboard,
    BriefcaseBusiness,
    UserCircle,
    LogOut,
    Menu,
    X,
    Settings,
    LockKeyhole,
    Mail,
    Phone,
    CalendarDays,
    ArrowUpRight,
    Bell,
    ChevronRight,
    Users,
    ClipboardList,
    Clock3,
    CalendarClock,
    FolderKanban,
    ChartNoAxesCombined,
    FileText,
    Ticket,
    Activity,
    RefreshCw
} from 'lucide-react'

import api from '../api/axios'


// Role Based Dashboard Configuration
const roleDashboard = {
    ADMIN: {
        title: 'Admin Dashboard',
        description: 'Manage users, projects and your entire workspace.',
        features: [
            {
                title: 'User Management',
                description: 'Manage users and assign roles.',
                icon: Users,
                color: 'blue'
            },
            {
                title: 'Projects',
                description: 'Monitor and manage all projects.',
                icon: FolderKanban,
                color: 'purple'
            },
            {
                title: 'Tasks',
                description: 'Track tasks across the organization.',
                icon: ClipboardList,
                color: 'emerald'
            },
            {
                title: 'Reports',
                description: 'Review workspace performance.',
                icon: ChartNoAxesCombined,
                color: 'orange'
            },
            {
                title: 'Audit Logs',
                description: 'Monitor important system activities.',
                icon: Activity,
                color: 'pink'
            },
            {
                title: 'Settings',
                description: 'Manage workspace settings.',
                icon: Settings,
                color: 'slate'
            }
        ]
    },

    PROJECT_MANAGER: {
        title: 'Project Manager Dashboard',
        description: 'Manage your projects, team members and project progress.',
        features: [
            {
                title: 'My Projects',
                description: 'View and manage assigned projects.',
                icon: FolderKanban,
                color: 'blue'
            },
            {
                title: 'Team Members',
                description: 'View your project team.',
                icon: Users,
                color: 'purple'
            },
            {
                title: 'Tasks',
                description: 'Create and monitor project tasks.',
                icon: ClipboardList,
                color: 'emerald'
            },
            {
                title: 'Project Progress',
                description: 'Monitor project completion.',
                icon: ChartNoAxesCombined,
                color: 'orange'
            },
            {
                title: 'Reports',
                description: 'Review project reports.',
                icon: FileText,
                color: 'pink'
            }
        ]
    },

    EMPLOYEE: {
        title: 'Employee Dashboard',
        description: 'Stay productive and keep track of your daily work.',
        features: [
            {
                title: 'My Tasks',
                description: 'View and manage your assigned tasks.',
                icon: ClipboardList,
                color: 'blue'
            },
            {
                title: 'Deadlines',
                description: 'Keep track of upcoming deadlines.',
                icon: CalendarClock,
                color: 'orange'
            },
            {
                title: 'Time Tracking',
                description: 'Track your working hours.',
                icon: Clock3,
                color: 'purple'
            },
            {
                title: 'Notifications',
                description: 'Stay updated with your activities.',
                icon: Bell,
                color: 'pink'
            },
            {
                title: 'My Projects',
                description: 'View projects you are working on.',
                icon: FolderKanban,
                color: 'emerald'
            }
        ]
    },

    CLIENT: {
        title: 'Client Dashboard',
        description: 'Track your projects and stay updated on progress.',
        features: [
            {
                title: 'My Projects',
                description: 'View your company projects.',
                icon: FolderKanban,
                color: 'blue'
            },
            {
                title: 'Project Progress',
                description: 'Track project completion status.',
                icon: ChartNoAxesCombined,
                color: 'purple'
            },
            {
                title: 'Task Status',
                description: 'Review project task updates.',
                icon: ClipboardList,
                color: 'emerald'
            },
            {
                title: 'Support Tickets',
                description: 'Create and track support tickets.',
                icon: Ticket,
                color: 'orange'
            },
            {
                title: 'Notifications',
                description: 'Receive important project updates.',
                icon: Bell,
                color: 'pink'
            }
        ]
    }
}


const colorStyles = {
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    orange: 'bg-orange-50 text-orange-600',
    pink: 'bg-pink-50 text-pink-600',
    slate: 'bg-slate-100 text-slate-600'
}


function MetricCard({ title, value, icon: Icon, tint }) {
    const styles = {
        blue: 'bg-blue-50 text-blue-700',
        purple: 'bg-violet-50 text-violet-700',
        emerald: 'bg-emerald-50 text-emerald-700',
        orange: 'bg-orange-50 text-orange-700'
    }

    return (
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-500">{title}</p>
                <span className={`grid h-10 w-10 place-items-center rounded-xl ${styles[tint]}`}>
                    <Icon size={20} />
                </span>
            </div>
            <p className="mt-4 text-3xl font-bold text-slate-900">{value ?? '—'}</p>
        </article>
    )
}

function Dashboard() {
    const navigate = useNavigate()

    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [dashboardStats, setDashboardStats] = useState(null)
    const [statsError, setStatsError] = useState('')

    // Client project states
    const [clientProjects, setClientProjects] = useState([])
    const [projectsLoading, setProjectsLoading] = useState(false)
    const [projectsError, setProjectsError] = useState('')

    const fetchClientProjects = async () => {
        try {
            setProjectsLoading(true)
            setProjectsError('')

            const response = await api.get('projects/')
            const data = response.data.results || response.data

            setClientProjects(data)
        } catch (error) {
            setProjectsError(
                error.response?.data?.detail ||
                'Unable to load your projects.'
            )
        } finally {
            setProjectsLoading(false)
        }
    }

    useEffect(() => {
        const token = localStorage.getItem('access_token')

        if (!token) {
            navigate('/')
            return
        }

        const fetchProfile = async () => {
            try {
                const response = await api.get('auth/profile/')
                const profile = response.data

                setUser(profile)

                try {
                    const dashboardResponse = await api.get('dashboard/')
                    setDashboardStats(dashboardResponse.data)
                    setStatsError('')
                } catch {
                    setStatsError('Dashboard metrics are temporarily unavailable.')
                }

                if (profile.role === 'CLIENT') {
                    await fetchClientProjects()
                }

            } catch {
                localStorage.removeItem('access_token')
                localStorage.removeItem('refresh_token')
                navigate('/')
            } finally {
                setLoading(false)
            }
        }

        fetchProfile()
    }, [navigate])


    const handleLogout = () => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        navigate('/')
    }


    const dashboard = roleDashboard[user?.role] || {
        title: 'Dashboard',
        description: 'Welcome to your WorkSphere workspace.',
        features: []
    }


    // Role Based Sidebar Navigation
    const menuItems = [
        {
            name: 'Dashboard',
            path: '/dashboard',
            icon: LayoutDashboard
        },
        {
            name: 'My Profile',
            path: '/profile',
            icon: UserCircle
        },
        {
            name: 'Change Password',
            path: '/change-password',
            icon: LockKeyhole
        },

        ...(user?.role === 'EMPLOYEE'
            ? [
                {
                    name: 'My Tasks',
                    path: '/employee/my-tasks',
                    icon: ClipboardList
                }
            ]
            : []),

        ...(user?.role === 'PROJECT_MANAGER'
            ? [
                {
                    name: 'My Projects',
                    path: '/manager/my-projects',
                    icon: FolderKanban
                }
            ]
            : []),

        ...(user?.role === 'ADMIN'
            ? [
                {
                    name: 'User Management',
                    path: '/admin/users',
                    icon: Users
                }
            ]
            : []),

        ...(['ADMIN', 'PROJECT_MANAGER'].includes(user?.role)
            ? [{ name: 'Clients', path: '/workspace/clients', icon: Users }]
            : []),

        ...(['ADMIN', 'PROJECT_MANAGER', 'EMPLOYEE', 'CLIENT'].includes(user?.role)
            ? [
                { name: 'Projects', path: '/workspace/projects', icon: FolderKanban },
                { name: 'Tasks', path: '/workspace/tasks', icon: ClipboardList },
                { name: 'Support Tickets', path: '/workspace/tickets', icon: Ticket },
                { name: 'Notifications', path: '/workspace/notifications', icon: Bell },
                { name: 'Activity Log', path: '/workspace/activity', icon: Activity }
            ]
            : []),

        ...(['ADMIN', 'CLIENT'].includes(user?.role)
            ? [{ name: 'Project Requests', path: '/workspace/requests', icon: FileText }]
            : []),

        ...(['ADMIN', 'PROJECT_MANAGER'].includes(user?.role)
            ? [{ name: 'Reports', path: '/workspace/reports', icon: ChartNoAxesCombined }]
            : []),

        ...(['ADMIN', 'PROJECT_MANAGER', 'EMPLOYEE'].includes(user?.role)
            ? [{ name: 'Time Tracking', path: '/workspace/time', icon: Clock3 }]
            : [])
    ]


    const getStatusStyle = status => {
        const styles = {
            PLANNING: 'bg-blue-100 text-blue-700',
            IN_PROGRESS: 'bg-amber-100 text-amber-700',
            COMPLETED: 'bg-emerald-100 text-emerald-700',
            ON_HOLD: 'bg-gray-100 text-gray-700',
            CANCELLED: 'bg-red-100 text-red-700'
        }

        return styles[status] || 'bg-slate-100 text-slate-700'
    }


    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="mt-4 text-sm font-medium text-slate-500">
                        Loading your workspace...
                    </p>
                </div>
            </div>
        )
    }


    if (!user) {
        return null
    }


    return (
        <div className="min-h-screen bg-slate-50">

            {/* Mobile Overlay */}
            {sidebarOpen && (
                <div
                    onClick={() => setSidebarOpen(false)}
                    className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden"
                />
            )}


            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-slate-950 text-white transition-transform duration-300 lg:translate-x-0 ${
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >

                {/* Logo */}
                <div className="flex h-20 items-center justify-between border-b border-white/10 px-7">

                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-600/30">
                            <BriefcaseBusiness size={23} />
                        </div>

                        <div>
                            <h1 className="text-xl font-bold tracking-tight">
                                WorkSphere
                            </h1>
                            <p className="text-xs text-slate-400">
                                Workspace Management
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="text-slate-400 hover:text-white lg:hidden"
                    >
                        <X size={22} />
                    </button>

                </div>


                {/* Navigation */}
                <div className="flex-1 px-4 py-8">

                    <p className="mb-4 px-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
                        Main Menu
                    </p>

                    <nav className="space-y-2">

                        {menuItems.map((item) => {
                            const Icon = item.icon

                            return (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setSidebarOpen(false)}
                                    className={({ isActive }) =>
                                        `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                                            isActive
                                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                                                : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                        }`
                                    }
                                >
                                    <Icon size={19} />
                                    {item.name}
                                </NavLink>
                            )
                        })}

                    </nav>


                    <p className="mb-4 mt-10 px-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
                        Account
                    </p>

                    <button
                        onClick={() => navigate('/workspace/notifications')}
                        className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-400 transition hover:bg-white/5 hover:text-white"
                    >
                        <Settings size={19} />
                        Account Settings
                    </button>

                </div>


                {/* Sidebar User */}
                <div className="border-t border-white/10 p-5">

                    <div className="flex items-center gap-3">

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 font-bold">
                            {user?.username?.charAt(0)?.toUpperCase()}
                        </div>

                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-white">
                                {user?.first_name || user?.username}
                            </p>
                            <p className="truncate text-xs text-slate-400">
                                {user?.email}
                            </p>
                        </div>

                        <button
                            onClick={handleLogout}
                            title="Logout"
                            className="rounded-lg p-2 text-slate-400 transition hover:bg-red-500/10 hover:text-red-400"
                        >
                            <LogOut size={19} />
                        </button>

                    </div>

                </div>

            </aside>


            {/* Main Content */}
            <div className="min-h-screen lg:pl-72">

                {/* Top Navbar */}
                <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 bg-white/90 px-5 backdrop-blur-md sm:px-8">

                    <div className="flex items-center gap-4">

                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
                        >
                            <Menu size={23} />
                        </button>

                        <div>
                            <p className="text-sm text-slate-500">
                                Workspace / Overview
                            </p>
                            <h2 className="text-lg font-bold text-slate-900">
                                {dashboard.title}
                            </h2>
                        </div>

                    </div>


                    <div className="flex items-center gap-3">

                        <button
                            onClick={() => navigate('/profile')}
                            className="relative rounded-xl border border-slate-200 p-2.5 text-slate-600 transition hover:bg-slate-50"
                            title="Notifications"
                        >
                            <Bell size={19} />
                        </button>

                        <button
                            onClick={() => navigate('/profile')}
                            className="flex items-center gap-3 rounded-xl p-1.5 transition hover:bg-slate-50"
                        >
                            <div className="hidden text-right sm:block">
                                <p className="text-sm font-semibold text-slate-800">
                                    {user?.first_name || user?.username}
                                </p>
                                <p className="text-xs text-slate-500">
                                    {user?.role?.replace('_', ' ')}
                                </p>
                            </div>

                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
                                {user?.username?.charAt(0)?.toUpperCase()}
                            </div>
                        </button>

                    </div>

                </header>


                {/* Dashboard Body */}
                <main className="mx-auto max-w-7xl p-5 sm:p-8">

                    {/* Welcome Section */}
                    <section className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 p-7 text-white shadow-xl shadow-blue-600/10 sm:p-10">

                        <div className="relative z-10 max-w-2xl">

                            <p className="mb-3 text-sm font-medium text-blue-100">
                                <CalendarDays size={16} className="mr-2 inline" />
                                Your workspace at a glance
                            </p>

                            <h1 className="text-2xl font-bold sm:text-3xl lg:text-4xl">
                                Welcome back, {user?.first_name || user?.username}!
                            </h1>

                            <p className="mt-3 max-w-xl text-sm leading-6 text-blue-100 sm:text-base">
                                {dashboard.description}
                            </p>

                            <button
                                onClick={() => navigate('/profile')}
                                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
                            >
                                View My Profile
                                <ArrowUpRight size={17} />
                            </button>

                        </div>

                        <div className="absolute -right-10 -top-20 h-72 w-72 rounded-full border-[35px] border-white/10" />
                        <div className="absolute -bottom-28 right-32 h-64 w-64 rounded-full bg-white/10 blur-2xl" />

                    </section>

                    {dashboardStats && (
                        <section className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                            <MetricCard title="Projects" value={dashboardStats.total_projects} icon={FolderKanban} tint="blue" />
                            <MetricCard title="Active projects" value={dashboardStats.active_projects} icon={BriefcaseBusiness} tint="purple" />
                            <MetricCard title="Open tasks" value={(dashboardStats.pending_tasks || 0) + (dashboardStats.in_progress_tasks || 0)} icon={ClipboardList} tint="emerald" />
                            <MetricCard title="Overdue tasks" value={dashboardStats.overdue_tasks} icon={CalendarClock} tint="orange" />
                        </section>
                    )}
                    {statsError && <p role="status" className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{statsError}</p>}


                    {/* Role Based Dashboard Features */}
                    <section className="mb-8">

                        <div className="mb-5">
                            <h2 className="text-xl font-bold text-slate-900">
                                {dashboard.title}
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                Features available for your account.
                            </p>
                        </div>

                        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">

                            {dashboard.features.map((feature) => {
                                const Icon = feature.icon

                                return (
                                    <div
                                        key={feature.title}
                                        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                                    >
                                        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${colorStyles[feature.color]}`}>
                                            <Icon size={24} />
                                        </div>

                                        <h3 className="mt-5 text-lg font-bold text-slate-900">
                                            {feature.title}
                                        </h3>

                                        <p className="mt-2 text-sm leading-6 text-slate-500">
                                            {feature.description}
                                        </p>

                                        {user?.role === 'PROJECT_MANAGER' &&
                                            feature.title === 'My Projects' && (
                                                <button
                                                    onClick={() => navigate('/manager/my-projects')}
                                                    className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800"
                                                >
                                                    View Projects
                                                    <ArrowUpRight size={16} />
                                                </button>
                                            )}
                                    </div>
                                )
                            })}

                        </div>

                    </section>


                    {/* CLIENT PROJECT OVERVIEW */}
                    {user?.role === 'CLIENT' && (
                        <section className="mb-8">

                            <div className="mb-5">
                                <h2 className="text-xl font-bold text-slate-900">
                                    My Projects Overview
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    Track your company's project activities and progress.
                                </p>
                            </div>

                            {projectsLoading ? (
                                <div className="flex justify-center rounded-2xl border border-slate-200 bg-white py-12">
                                    <RefreshCw className="animate-spin text-blue-600" size={30} />
                                </div>
                            ) : projectsError ? (
                                <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-600">
                                    <p>{projectsError}</p>
                                    <button
                                        onClick={fetchClientProjects}
                                        className="mt-3 font-semibold underline"
                                    >
                                        Try Again
                                    </button>
                                </div>
                            ) : (
                                <>
                                    {/* Project Summary */}
                                    <div className="mb-6 grid gap-5 sm:grid-cols-3">

                                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                            <p className="text-sm text-slate-500">
                                                Total Projects
                                            </p>
                                            <h3 className="mt-3 text-3xl font-bold text-slate-900">
                                                {clientProjects.length}
                                            </h3>
                                        </div>

                                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                            <p className="text-sm text-slate-500">
                                                In Progress
                                            </p>
                                            <h3 className="mt-3 text-3xl font-bold text-amber-600">
                                                {clientProjects.filter(
                                                    project => project.status === 'IN_PROGRESS'
                                                ).length}
                                            </h3>
                                        </div>

                                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                                            <p className="text-sm text-slate-500">
                                                Completed
                                            </p>
                                            <h3 className="mt-3 text-3xl font-bold text-emerald-600">
                                                {clientProjects.filter(
                                                    project => project.status === 'COMPLETED'
                                                ).length}
                                            </h3>
                                        </div>

                                    </div>

                                    {/* Project List */}
                                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                                        <div className="mb-5 flex items-center justify-between">
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-900">
                                                    My Projects
                                                </h3>
                                                <p className="mt-1 text-sm text-slate-500">
                                                    Projects assigned to your company.
                                                </p>
                                            </div>

                                            <FolderKanban className="text-blue-600" size={25} />
                                        </div>

                                        {clientProjects.length === 0 ? (
                                            <div className="py-10 text-center">
                                                <FolderKanban
                                                    size={40}
                                                    className="mx-auto mb-3 text-slate-300"
                                                />
                                                <p className="font-semibold text-slate-700">
                                                    No Projects Assigned
                                                </p>
                                                <p className="mt-2 text-sm text-slate-500">
                                                    Your projects will appear here.
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">

                                                {clientProjects.map(project => (
                                                    <div
                                                        key={project.id}
                                                        className="rounded-xl border border-slate-200 p-5 transition hover:border-blue-200 hover:bg-slate-50"
                                                    >

                                                        <div className="flex flex-wrap items-center justify-between gap-3">

                                                            <div>
                                                                <h4 className="font-bold text-slate-800">
                                                                    {project.name}
                                                                </h4>
                                                                <p className="mt-1 text-xs text-slate-400">
                                                                    Project #{project.id}
                                                                </p>
                                                            </div>

                                                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(project.status)}`}>
                                                                {project.status?.replaceAll('_', ' ')}
                                                            </span>

                                                        </div>

                                                        {project.description && (
                                                            <p className="mt-3 text-sm leading-6 text-slate-500">
                                                                {project.description}
                                                            </p>
                                                        )}

                                                        <div className="mt-5 grid gap-4 sm:grid-cols-2">

                                                            <div>
                                                                <p className="text-xs text-slate-400">
                                                                    Project Manager
                                                                </p>
                                                                <p className="mt-1 text-sm font-semibold text-slate-700">
                                                                    {project.project_manager_name || 'N/A'}
                                                                </p>
                                                            </div>

                                                            <div>
                                                                <p className="text-xs text-slate-400">
                                                                    Deadline
                                                                </p>
                                                                <p className="mt-1 text-sm font-semibold text-slate-700">
                                                                    {project.deadline || 'N/A'}
                                                                </p>
                                                            </div>

                                                        </div>

                                                    </div>
                                                ))}

                                            </div>
                                        )}

                                    </div>
                                </>
                            )}

                        </section>
                    )}


                    {/* Account Information and Quick Actions */}
                    <section className="grid gap-6 lg:grid-cols-3">

                        {/* Profile Details */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">

                            <div className="mb-6 flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">
                                        Personal Information
                                    </h3>
                                    <p className="mt-1 text-sm text-slate-500">
                                        Your registered account details.
                                    </p>
                                </div>

                                <UserCircle className="text-blue-600" size={25} />
                            </div>

                            <div className="grid gap-6 sm:grid-cols-2">

                                <div>
                                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                                        First Name
                                    </p>
                                    <p className="font-semibold text-slate-800">
                                        {user?.first_name || 'Not provided'}
                                    </p>
                                </div>

                                <div>
                                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                                        Last Name
                                    </p>
                                    <p className="font-semibold text-slate-800">
                                        {user?.last_name || 'Not provided'}
                                    </p>
                                </div>

                                <div>
                                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                                        Email Address
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <Mail size={16} className="text-slate-400" />
                                        <p className="break-all font-medium text-slate-700">
                                            {user?.email || 'Not provided'}
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                                        Phone Number
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <Phone size={16} className="text-slate-400" />
                                        <p className="font-medium text-slate-700">
                                            {user?.phone || 'Not provided'}
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                                        Username
                                    </p>
                                    <p className="font-medium text-slate-700">
                                        {user?.username}
                                    </p>
                                </div>

                                <div>
                                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                                        Role
                                    </p>
                                    <span className="inline-flex rounded-lg bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
                                        {user?.role?.replace('_', ' ')}
                                    </span>
                                </div>

                            </div>

                            <div className="mt-8 border-t border-slate-100 pt-5">
                                <button
                                    onClick={() => navigate('/profile')}
                                    className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 transition hover:text-blue-800"
                                >
                                    Edit Profile
                                    <ChevronRight size={17} />
                                </button>
                            </div>

                        </div>


                        {/* Quick Actions */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                            <h3 className="text-lg font-bold text-slate-900">
                                Quick Actions
                            </h3>

                            <p className="mt-1 text-sm text-slate-500">
                                Manage your account.
                            </p>

                            <div className="mt-6 space-y-3">

                                <button
                                    onClick={() => navigate('/profile')}
                                    className="group flex w-full items-center justify-between rounded-xl border border-slate-200 p-4 text-left transition hover:border-blue-200 hover:bg-blue-50"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="rounded-lg bg-blue-100 p-2 text-blue-600">
                                            <UserCircle size={19} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-800">
                                                Edit Profile
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                Update personal details
                                            </p>
                                        </div>
                                    </div>

                                    <ChevronRight size={18} className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-blue-600" />
                                </button>


                                <button
                                    onClick={() => navigate('/change-password')}
                                    className="group flex w-full items-center justify-between rounded-xl border border-slate-200 p-4 text-left transition hover:border-purple-200 hover:bg-purple-50"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="rounded-lg bg-purple-100 p-2 text-purple-600">
                                            <LockKeyhole size={19} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-800">
                                                Change Password
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                Keep your account secure
                                            </p>
                                        </div>
                                    </div>

                                    <ChevronRight size={18} className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-purple-600" />
                                </button>


                                {user?.role === 'PROJECT_MANAGER' && (
                                    <button
                                        onClick={() => navigate('/manager/my-projects')}
                                        className="group flex w-full items-center justify-between rounded-xl border border-blue-200 bg-blue-50/50 p-4 text-left transition hover:border-blue-300 hover:bg-blue-50"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="rounded-lg bg-blue-100 p-2 text-blue-600">
                                                <FolderKanban size={19} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-slate-800">
                                                    My Projects
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    View and manage your projects
                                                </p>
                                            </div>
                                        </div>

                                        <ChevronRight size={18} className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-blue-600" />
                                    </button>
                                )}


                                {user?.role === 'ADMIN' && (
                                    <button
                                        onClick={() => navigate('/admin/users')}
                                        className="group flex w-full items-center justify-between rounded-xl border border-indigo-200 bg-indigo-50/50 p-4 text-left transition hover:border-indigo-300 hover:bg-indigo-50"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="rounded-lg bg-indigo-100 p-2 text-indigo-600">
                                                <Users size={19} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-slate-800">
                                                    User Management
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    Manage users and assign roles
                                                </p>
                                            </div>
                                        </div>

                                        <ChevronRight size={18} className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-indigo-600" />
                                    </button>
                                )}


                                <button
                                    onClick={handleLogout}
                                    className="group flex w-full items-center justify-between rounded-xl border border-slate-200 p-4 text-left transition hover:border-red-200 hover:bg-red-50"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="rounded-lg bg-red-100 p-2 text-red-600">
                                            <LogOut size={19} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-800">
                                                Logout
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                Sign out of your account
                                            </p>
                                        </div>
                                    </div>

                                    <ChevronRight size={18} className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-red-600" />
                                </button>

                            </div>

                        </div>

                    </section>


                    {/* Footer */}
                    <footer className="mt-10 border-t border-slate-200 py-6 text-center text-sm text-slate-400">
                        © {new Date().getFullYear()} WorkSphere. All rights reserved.
                    </footer>

                </main>

            </div>

        </div>
    )
}

export default Dashboard
