
import { useCallback, useEffect, useState } from 'react'
import {
    FolderKanban,
    Search,
    CalendarDays,
    Users,
    Clock,
    AlertCircle,
    RefreshCw,
    ChevronDown,
    ChevronUp,
    MessageSquare,
    Send,
    User,
    CheckCircle2
} from 'lucide-react'

import api from '../../api/axios'

function MyProjects() {
    const [projects, setProjects] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('ALL')

    const [expandedProject, setExpandedProject] = useState(null)
    const [tasksByProject, setTasksByProject] = useState({})
    const [loadingTasks, setLoadingTasks] = useState(false)

    const [expandedTask, setExpandedTask] = useState(null)
    const [commentsByTask, setCommentsByTask] = useState({})
    const [loadingComments, setLoadingComments] = useState(false)

    const [commentInputs, setCommentInputs] = useState({})
    const [postingComment, setPostingComment] = useState(null)
    const [commentErrors, setCommentErrors] = useState({})
    const [commentSuccess, setCommentSuccess] = useState({})

    const fetchProjects = useCallback(async () => {
        try {
            setLoading(true)
            setError('')

            const response = await api.get('projects/')
            const data = response.data.results || response.data

            setProjects(data)
        } catch (err) {
            setError(
                err.response?.data?.detail ||
                'Unable to load projects. Please try again.'
            )
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        Promise.resolve().then(fetchProjects)
    }, [fetchProjects])

    const fetchProjectTasks = async (projectId) => {
        try {
            setLoadingTasks(true)

            const response = await api.get('tasks/')
            const data = response.data.results || response.data

            const projectTasks = data.filter(task => {
                const taskProjectId =
                    typeof task.project === 'object'
                        ? task.project?.id
                        : task.project

                return Number(taskProjectId) === Number(projectId)
            })

            setTasksByProject(prev => ({
                ...prev,
                [projectId]: projectTasks
            }))
        } catch (err) {
            console.error('Unable to load tasks:', err)
        } finally {
            setLoadingTasks(false)
        }
    }

    const handleProjectToggle = async (projectId) => {
        if (expandedProject === projectId) {
            setExpandedProject(null)
            setExpandedTask(null)
            return
        }

        setExpandedProject(projectId)
        setExpandedTask(null)

        if (!tasksByProject[projectId]) {
            await fetchProjectTasks(projectId)
        }
    }

    const fetchTaskComments = async (taskId) => {
        try {
            setLoadingComments(true)

            const response = await api.get('tasks/comments/', {
                params: { task: taskId }
            })

            const data = response.data.results || response.data

            setCommentsByTask(prev => ({
                ...prev,
                [taskId]: data
            }))
        } catch (err) {
            console.error('Unable to load comments:', err)
            setCommentErrors(prev => ({
                ...prev,
                [taskId]: 'Unable to load comments.'
            }))
        } finally {
            setLoadingComments(false)
        }
    }

    const handleTaskToggle = async (taskId) => {
        if (expandedTask === taskId) {
            setExpandedTask(null)
            return
        }

        setExpandedTask(taskId)

        if (!commentsByTask[taskId]) {
            await fetchTaskComments(taskId)
        }
    }

    const handleCommentChange = (taskId, value) => {
        setCommentInputs(prev => ({
            ...prev,
            [taskId]: value
        }))
    }

    const handlePostComment = async (e, taskId) => {
        e.preventDefault()

        const message = commentInputs[taskId]?.trim()

        if (!message) {
            setCommentErrors(prev => ({
                ...prev,
                [taskId]: 'Please write a comment first.'
            }))
            return
        }

        try {
            setPostingComment(taskId)

            setCommentErrors(prev => ({
                ...prev,
                [taskId]: ''
            }))

            setCommentSuccess(prev => ({
                ...prev,
                [taskId]: ''
            }))

            await api.post('tasks/comments/', {
                task: taskId,
                message
            })

            setCommentInputs(prev => ({
                ...prev,
                [taskId]: ''
            }))

            await fetchTaskComments(taskId)

            setCommentSuccess(prev => ({
                ...prev,
                [taskId]: 'Comment posted successfully!'
            }))
        } catch (err) {
            const data = err.response?.data

            setCommentErrors(prev => ({
                ...prev,
                [taskId]:
                    data?.message?.[0] ||
                    data?.task?.[0] ||
                    data?.detail ||
                    'Unable to post comment. Please try again.'
            }))
        } finally {
            setPostingComment(null)
        }
    }

    const filteredProjects = projects.filter(project => {
        const matchesSearch =
            project.name?.toLowerCase().includes(search.toLowerCase()) ||
            project.client_name?.toLowerCase().includes(search.toLowerCase()) ||
            project.project_manager_name?.toLowerCase().includes(search.toLowerCase())

        const matchesStatus =
            statusFilter === 'ALL' || project.status === statusFilter

        return matchesSearch && matchesStatus
    })

    const getStatusStyle = status => {
        const styles = {
            PLANNING: 'bg-blue-100 text-blue-700',
            IN_PROGRESS: 'bg-amber-100 text-amber-700',
            IN_REVIEW: 'bg-purple-100 text-purple-700',
            COMPLETED: 'bg-emerald-100 text-emerald-700',
            ON_HOLD: 'bg-gray-100 text-gray-700',
            CANCELLED: 'bg-red-100 text-red-700',
            TODO: 'bg-slate-100 text-slate-700'
        }

        return styles[status] || 'bg-gray-100 text-gray-700'
    }

    const getPriorityStyle = priority => {
        const styles = {
            LOW: 'text-green-600 bg-green-50',
            MEDIUM: 'text-blue-600 bg-blue-50',
            HIGH: 'text-orange-600 bg-orange-50',
            URGENT: 'text-red-600 bg-red-50'
        }

        return styles[priority] || 'text-gray-600 bg-gray-50'
    }

    const formatDate = date => {
        if (!date) return 'N/A'

        return new Date(date).toLocaleDateString()
    }

    return (
        <div className="min-h-screen bg-slate-50 p-6 lg:p-8">

            {/* Header */}
            <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <p className="mb-2 text-sm font-semibold text-indigo-600">
                        PROJECT MANAGEMENT
                    </p>

                    <h1 className="text-3xl font-bold text-slate-900">
                        My Projects
                    </h1>

                    <p className="mt-2 text-sm text-slate-500">
                        Manage projects, monitor tasks and communicate with your team.
                    </p>
                </div>

                <button
                    onClick={fetchProjects}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100"
                >
                    <RefreshCw size={16} />
                    Refresh
                </button>
            </div>

            {/* Summary */}
            <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-slate-500">
                            Total Projects
                        </p>
                        <FolderKanban className="text-indigo-600" />
                    </div>
                    <h2 className="mt-4 text-3xl font-bold text-slate-900">
                        {projects.length}
                    </h2>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-slate-500">
                            In Progress
                        </p>
                        <Clock className="text-amber-500" />
                    </div>
                    <h2 className="mt-4 text-3xl font-bold text-slate-900">
                        {projects.filter(p => p.status === 'IN_PROGRESS').length}
                    </h2>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-slate-500">
                            Completed
                        </p>
                        <CheckCircle2 className="text-emerald-600" />
                    </div>
                    <h2 className="mt-4 text-3xl font-bold text-slate-900">
                        {projects.filter(p => p.status === 'COMPLETED').length}
                    </h2>
                </div>
            </div>

            {/* Search and Filter */}
            <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row">
                <div className="relative flex-1">
                    <Search
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search projects, clients or managers..."
                        className="w-full rounded-xl border border-slate-200 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                    />
                </div>

                <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-indigo-500"
                >
                    <option value="ALL">All Status</option>
                    <option value="PLANNING">Planning</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="ON_HOLD">On Hold</option>
                    <option value="CANCELLED">Cancelled</option>
                </select>
            </div>

            {/* Projects */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <RefreshCw className="animate-spin text-indigo-600" size={30} />
                </div>
            ) : error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
                    <AlertCircle className="mx-auto mb-3 text-red-500" size={30} />
                    <p className="text-sm text-red-700">{error}</p>
                    <button
                        onClick={fetchProjects}
                        className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white"
                    >
                        Try Again
                    </button>
                </div>
            ) : filteredProjects.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center">
                    <FolderKanban className="mx-auto mb-4 text-slate-300" size={45} />
                    <h3 className="text-lg font-bold text-slate-800">
                        No Projects Found
                    </h3>
                    <p className="mt-2 text-sm text-slate-500">
                        No projects match your search or filter.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                    {filteredProjects.map(project => (
                        <div
                            key={project.id}
                            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-lg"
                        >
                            {/* Project Header */}
                            <div className="p-6">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600">
                                            <FolderKanban size={22} />
                                        </div>

                                        <div>
                                            <h3 className="font-bold text-slate-900">
                                                {project.name}
                                            </h3>
                                            <p className="mt-1 text-xs text-slate-400">
                                                Project #{project.id}
                                            </p>
                                        </div>
                                    </div>

                                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(project.status)}`}>
                                        {project.status?.replaceAll('_', ' ')}
                                    </span>
                                </div>

                                {project.description && (
                                    <p className="mt-4 text-sm leading-6 text-slate-500">
                                        {project.description}
                                    </p>
                                )}

                                {/* Project Information */}
                                <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
                                    <div>
                                        <p className="text-xs font-medium text-slate-400">
                                            CLIENT
                                        </p>
                                        <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                                            <Users size={16} className="text-indigo-500" />
                                            {project.client_name || 'N/A'}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-xs font-medium text-slate-400">
                                            PROJECT MANAGER
                                        </p>
                                        <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                                            <User size={16} className="text-indigo-500" />
                                            {project.project_manager_name || 'N/A'}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-xs font-medium text-slate-400">
                                            PRIORITY
                                        </p>
                                        <span className={`mt-2 inline-block rounded-lg px-2 py-1 text-xs font-semibold ${getPriorityStyle(project.priority)}`}>
                                            {project.priority || 'N/A'}
                                        </span>
                                    </div>

                                    <div>
                                        <p className="text-xs font-medium text-slate-400">
                                            START DATE
                                        </p>
                                        <p className="mt-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                                            <CalendarDays size={15} />
                                            {formatDate(project.start_date)}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-xs font-medium text-slate-400">
                                            DEADLINE
                                        </p>
                                        <p className="mt-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                                            <CalendarDays size={15} />
                                            {formatDate(project.deadline)}
                                        </p>
                                    </div>
                                </div>

                                {/* View Tasks Button */}
                                <button
                                    onClick={() => handleProjectToggle(project.id)}
                                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
                                >
                                    <FolderKanban size={17} />
                                    {expandedProject === project.id
                                        ? 'Hide Project Tasks'
                                        : 'View Project Tasks'}

                                    {expandedProject === project.id
                                        ? <ChevronUp size={17} />
                                        : <ChevronDown size={17} />}
                                </button>
                            </div>

                            {/* Project Tasks */}
                            {expandedProject === project.id && (
                                <div className="border-t border-slate-200 bg-slate-50 p-5">
                                    <h4 className="mb-4 flex items-center gap-2 font-bold text-slate-800">
                                        <FolderKanban size={18} className="text-indigo-600" />
                                        Project Tasks
                                    </h4>

                                    {loadingTasks ? (
                                        <div className="flex justify-center py-8">
                                            <RefreshCw className="animate-spin text-indigo-600" />
                                        </div>
                                    ) : !tasksByProject[project.id]?.length ? (
                                        <p className="rounded-xl bg-white p-5 text-center text-sm text-slate-500">
                                            No tasks found for this project.
                                        </p>
                                    ) : (
                                        <div className="space-y-4">
                                            {tasksByProject[project.id].map(task => (
                                                <div
                                                    key={task.id}
                                                    className="overflow-hidden rounded-xl border border-slate-200 bg-white"
                                                >
                                                    <div className="p-4">
                                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                                            <div>
                                                                <h5 className="font-semibold text-slate-800">
                                                                    {task.title}
                                                                </h5>
                                                                <p className="mt-1 text-xs text-slate-400">
                                                                    Task #{task.id}
                                                                </p>
                                                            </div>

                                                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(task.status)}`}>
                                                                {task.status?.replaceAll('_', ' ')}
                                                            </span>
                                                        </div>

                                                        {task.description && (
                                                            <p className="mt-3 text-sm text-slate-500">
                                                                {task.description}
                                                            </p>
                                                        )}

                                                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                                                            <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                                                                <span className={`rounded-md px-2 py-1 font-semibold ${getPriorityStyle(task.priority)}`}>
                                                                    {task.priority}
                                                                </span>

                                                                <span className="flex items-center gap-1">
                                                                    <CalendarDays size={13} />
                                                                    {formatDate(task.due_date)}
                                                                </span>
                                                            </div>

                                                            <button
                                                                onClick={() => handleTaskToggle(task.id)}
                                                                className="flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800"
                                                            >
                                                                <MessageSquare size={16} />
                                                                Comments
                                                                {expandedTask === task.id
                                                                    ? <ChevronUp size={15} />
                                                                    : <ChevronDown size={15} />}
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Comments */}
                                                    {expandedTask === task.id && (
                                                        <div className="border-t border-slate-100 bg-slate-50 p-4">
                                                            <h6 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-800">
                                                                <MessageSquare size={16} />
                                                                Task Discussion
                                                            </h6>

                                                            {loadingComments && !commentsByTask[task.id] ? (
                                                                <div className="flex justify-center py-5">
                                                                    <RefreshCw className="animate-spin text-indigo-600" />
                                                                </div>
                                                            ) : (
                                                                <div className="mb-5 space-y-3">
                                                                    {commentsByTask[task.id]?.length > 0 ? (
                                                                        commentsByTask[task.id].map(comment => (
                                                                            <div
                                                                                key={comment.id}
                                                                                className="rounded-xl border border-slate-200 bg-white p-4"
                                                                            >
                                                                                <div className="flex flex-wrap items-center justify-between gap-2">
                                                                                    <p className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                                                                                        <User size={15} className="text-indigo-500" />
                                                                                        {comment.user || 'User'}
                                                                                    </p>

                                                                                    <span className="text-xs text-slate-400">
                                                                                        {comment.created_at
                                                                                            ? new Date(comment.created_at).toLocaleString()
                                                                                            : ''}
                                                                                    </span>
                                                                                </div>

                                                                                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                                                                                    {comment.message}
                                                                                </p>
                                                                            </div>
                                                                        ))
                                                                    ) : (
                                                                        <p className="rounded-xl bg-white p-4 text-center text-sm text-slate-500">
                                                                            No comments yet. Start the discussion.
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            )}

                                                            {commentErrors[task.id] && (
                                                                <p className="mb-3 text-sm text-red-600">
                                                                    {commentErrors[task.id]}
                                                                </p>
                                                            )}

                                                            {commentSuccess[task.id] && (
                                                                <p className="mb-3 text-sm text-emerald-600">
                                                                    {commentSuccess[task.id]}
                                                                </p>
                                                            )}

                                                            {/* Add Comment */}
                                                            <form
                                                                onSubmit={e => handlePostComment(e, task.id)}
                                                                className="space-y-3"
                                                            >
                                                                <textarea
                                                                    value={commentInputs[task.id] || ''}
                                                                    onChange={e => handleCommentChange(task.id, e.target.value)}
                                                                    placeholder="Write a comment..."
                                                                    rows={3}
                                                                    className="w-full resize-none rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                                                                />

                                                                <div className="flex justify-end">
                                                                    <button
                                                                        type="submit"
                                                                        disabled={postingComment === task.id}
                                                                        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                                                                    >
                                                                        {postingComment === task.id ? (
                                                                            <RefreshCw size={16} className="animate-spin" />
                                                                        ) : (
                                                                            <Send size={16} />
                                                                        )}

                                                                        {postingComment === task.id
                                                                            ? 'Posting...'
                                                                            : 'Post Comment'}
                                                                    </button>
                                                                </div>
                                                            </form>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export default MyProjects
