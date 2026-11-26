
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import {
    ClipboardList,
    Search,
    CalendarDays,
    FolderKanban,
    AlertCircle,
    RefreshCw,
    ArrowLeft,
    CheckCircle2,
    Clock3,
    Eye,
    ArrowUpRight
} from 'lucide-react'

import api from '../../api/axios'

const statusStyles = {
    TODO: 'bg-slate-100 text-slate-700',
    IN_PROGRESS: 'bg-blue-100 text-blue-700',
    IN_REVIEW: 'bg-amber-100 text-amber-700',
    COMPLETED: 'bg-emerald-100 text-emerald-700'
}

const priorityStyles = {
    LOW: 'bg-slate-100 text-slate-600',
    MEDIUM: 'bg-blue-100 text-blue-700',
    HIGH: 'bg-orange-100 text-orange-700',
    URGENT: 'bg-red-100 text-red-700'
}

const formatLabel = (value) => {
    if (!value) return 'N/A'

    return value
        .replaceAll('_', ' ')
        .toLowerCase()
        .replace(/\b\w/g, char => char.toUpperCase())
}

function MyTasks() {
    const navigate = useNavigate()

    const [tasks, setTasks] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('ALL')
    const [priorityFilter, setPriorityFilter] = useState('ALL')

    const fetchTasks = useCallback(async () => {
        setLoading(true)
        setError('')

        try {
            const response = await api.get('tasks/')
            const data = response.data

            setTasks(Array.isArray(data) ? data : data.results || [])
        } catch (err) {
            if (err.response?.status === 401) {
                setError('Your session has expired. Please login again.')
            } else if (err.response?.status === 403) {
                setError('You do not have permission to view these tasks.')
            } else {
                setError('Unable to load your tasks. Please try again.')
            }
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        Promise.resolve().then(fetchTasks)
    }, [fetchTasks])

    // Open Task Detail Page
    const openTaskDetails = (taskId) => {
        navigate(`/tasks/${taskId}`)
    }

    const filteredTasks = useMemo(() => {
        return tasks.filter(task => {
            const searchMatch =
                task.title?.toLowerCase().includes(search.toLowerCase()) ||
                task.description?.toLowerCase().includes(search.toLowerCase())

            const statusMatch =
                statusFilter === 'ALL' || task.status === statusFilter

            const priorityMatch =
                priorityFilter === 'ALL' || task.priority === priorityFilter

            return searchMatch && statusMatch && priorityMatch
        })
    }, [tasks, search, statusFilter, priorityFilter])

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const getDueDateInfo = (dueDate, status) => {
        if (!dueDate) {
            return {
                label: 'No deadline',
                style: 'text-slate-500'
            }
        }

        const date = new Date(`${dueDate}T00:00:00`)

        if (status === 'COMPLETED') {
            return {
                label: date.toLocaleDateString(),
                style: 'text-emerald-600'
            }
        }

        if (date < today) {
            return {
                label: `Overdue · ${date.toLocaleDateString()}`,
                style: 'text-red-600'
            }
        }

        return {
            label: date.toLocaleDateString(),
            style: 'text-slate-600'
        }
    }

    const completedCount = tasks.filter(
        task => task.status === 'COMPLETED'
    ).length

    const inProgressCount = tasks.filter(
        task => task.status === 'IN_PROGRESS'
    ).length

    const pendingCount = tasks.filter(
        task => task.status === 'TODO' || task.status === 'IN_REVIEW'
    ).length

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="text-center">
                    <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
                    <p className="mt-4 text-sm font-medium text-slate-500">
                        Loading your tasks...
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50">

            {/* Header */}
            <header className="border-b border-slate-200 bg-white">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
                            title="Back to Dashboard"
                        >
                            <ArrowLeft size={21} />
                        </button>

                        <div>
                            <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
                                My Tasks
                            </h1>
                            <p className="mt-1 text-sm text-slate-500">
                                View and track your assigned tasks.
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={fetchTasks}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                        <RefreshCw size={16} />
                        <span className="hidden sm:inline">Refresh</span>
                    </button>

                </div>
            </header>

            <main className="mx-auto max-w-7xl p-5 sm:p-8">

                {/* Summary Cards */}
                <section className="mb-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">

                    <SummaryCard
                        title="Total Tasks"
                        count={tasks.length}
                        icon={ClipboardList}
                        color="blue"
                    />

                    <SummaryCard
                        title="In Progress"
                        count={inProgressCount}
                        icon={Clock3}
                        color="purple"
                    />

                    <SummaryCard
                        title="Completed"
                        count={completedCount}
                        icon={CheckCircle2}
                        color="emerald"
                    />

                </section>

                {/* Pending Information */}
                <div className="mb-6 flex items-center gap-2 text-sm text-slate-500">
                    <AlertCircle size={16} />
                    {pendingCount} tasks waiting to be started or reviewed.
                </div>

                {/* Filters */}
                <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

                    <div className="grid gap-4 md:grid-cols-3">

                        <div className="relative">
                            <Search
                                size={18}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                            />

                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search tasks..."
                                className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            />
                        </div>

                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                        >
                            <option value="ALL">All Status</option>
                            <option value="TODO">To Do</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="IN_REVIEW">In Review</option>
                            <option value="COMPLETED">Completed</option>
                        </select>

                        <select
                            value={priorityFilter}
                            onChange={(e) => setPriorityFilter(e.target.value)}
                            className="rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                        >
                            <option value="ALL">All Priorities</option>
                            <option value="LOW">Low</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="HIGH">High</option>
                            <option value="URGENT">Urgent</option>
                        </select>

                    </div>
                </section>

                {/* Error */}
                {error && (
                    <div className="mb-6 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        <span>{error}</span>

                        <button
                            onClick={fetchTasks}
                            className="font-semibold underline"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {/* Task List */}
                <section>

                    <div className="mb-5 flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">
                                Assigned Tasks
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                {filteredTasks.length} task(s) found
                            </p>
                        </div>
                    </div>

                    {filteredTasks.length === 0 && !error ? (
                        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                                <ClipboardList size={30} />
                            </div>

                            <h3 className="mt-5 text-lg font-bold text-slate-900">
                                No tasks found
                            </h3>

                            <p className="mt-2 text-sm text-slate-500">
                                You currently have no tasks matching your filters.
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-5 lg:grid-cols-2">

                            {filteredTasks.map(task => {
                                const dueDate = getDueDateInfo(
                                    task.due_date,
                                    task.status
                                )

                                return (
                                    <article
                                        key={task.id}
                                        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                                    >

                                        <div className="flex items-start justify-between gap-3">

                                            <div className="min-w-0">
                                                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                                                    Task #{task.id}
                                                </p>

                                                <button
                                                    onClick={() => openTaskDetails(task.id)}
                                                    className="break-words text-left text-lg font-bold text-slate-900 hover:text-indigo-600 transition"
                                                >
                                                    {task.title}
                                                </button>
                                            </div>

                                            <span className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold ${priorityStyles[task.priority] || priorityStyles.MEDIUM}`}>
                                                {formatLabel(task.priority)}
                                            </span>

                                        </div>

                                        <p className="mt-3 line-clamp-3 min-h-12 text-sm leading-6 text-slate-500">
                                            {task.description || 'No description provided.'}
                                        </p>

                                        <div className="mt-5 flex flex-wrap items-center gap-3">

                                            <span className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${statusStyles[task.status] || statusStyles.TODO}`}>
                                                {formatLabel(task.status)}
                                            </span>

                                            <span className={`flex items-center gap-1.5 text-xs font-medium ${dueDate.style}`}>
                                                <CalendarDays size={14} />
                                                {dueDate.label}
                                            </span>

                                        </div>

                                        <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">

                                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                                <FolderKanban size={16} />
                                                Project #{task.project}
                                            </div>

                                            <span className="text-xs text-slate-400">
                                                Updated: {
                                                    task.updated_at
                                                        ? new Date(task.updated_at).toLocaleDateString()
                                                        : 'N/A'
                                                }
                                            </span>

                                        </div>

                                        {/* View Details Button */}
                                        <div className="mt-5 border-t border-slate-100 pt-4">
                                            <button
                                                onClick={() => openTaskDetails(task.id)}
                                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
                                            >
                                                <Eye size={17} />
                                                View Task Details
                                                <ArrowUpRight size={16} />
                                            </button>
                                        </div>

                                    </article>
                                )
                            })}

                        </div>
                    )}

                </section>

                {/* Footer */}
                <footer className="mt-10 border-t border-slate-200 py-6 text-center text-sm text-slate-400">
                    © {new Date().getFullYear()} WorkSphere. All rights reserved.
                </footer>

            </main>
        </div>
    )
}

function SummaryCard({ title, count, icon: Icon, color }) {
    const styles = {
        blue: 'bg-blue-50 text-blue-600',
        purple: 'bg-purple-50 text-purple-600',
        emerald: 'bg-emerald-50 text-emerald-600'
    }

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${styles[color]}`}>
                    <Icon size={23} />
                </div>

                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Tasks
                </span>
            </div>

            <p className="mt-5 text-sm text-slate-500">
                {title}
            </p>

            <h3 className="mt-1 text-3xl font-bold text-slate-900">
                {count}
            </h3>
        </div>
    )
}

export default MyTasks
