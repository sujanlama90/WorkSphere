
import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
    ArrowLeft,
    CalendarDays,
    Clock,
    User,
    FolderKanban,
    Flag,
    CheckCircle2,
    AlertCircle,
    RefreshCw,
    MessageSquare,
    Send,
    Paperclip,
    FileText,
    Activity
} from 'lucide-react'

import api from '../../api/axios'

const statusOptions = [
    { value: 'TODO', label: 'To Do' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'IN_REVIEW', label: 'In Review' },
    { value: 'COMPLETED', label: 'Completed' }
]

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

function TaskDetail() {
    const { id } = useParams()
    const navigate = useNavigate()

    const [task, setTask] = useState(null)
    const [user, setUser] = useState(null)
    const [comments, setComments] = useState([])
    const [commentText, setCommentText] = useState('')
    const [attachments, setAttachments] = useState([])
    const [activities, setActivities] = useState([])
    const [attachmentFile, setAttachmentFile] = useState(null)

    const [loading, setLoading] = useState(true)
    const [commentsLoading, setCommentsLoading] = useState(true)
    const [postingComment, setPostingComment] = useState(false)
    const [uploadingAttachment, setUploadingAttachment] = useState(false)
    const [updating, setUpdating] = useState(false)

    const [error, setError] = useState('')
    const [commentError, setCommentError] = useState('')
    const [attachmentError, setAttachmentError] = useState('')
    const [success, setSuccess] = useState('')

    const fetchTask = useCallback(async () => {
        try {
            setLoading(true)
            setError('')

            const response = await api.get(`tasks/${id}/`)
            setTask(response.data)
        } catch (err) {
            setError(
                err.response?.data?.detail ||
                'Unable to load task details.'
            )
        } finally {
            setLoading(false)
        }
    }, [id])

    const fetchProfile = useCallback(async () => {
        try {
            const response = await api.get('auth/profile/')
            setUser(response.data)
        } catch (err) {
            console.error('Profile loading failed:', err)
        }
    }, [])

    const fetchComments = useCallback(async () => {
        try {
            setCommentsLoading(true)
            setCommentError('')

            const response = await api.get('tasks/comments/', {
                params: { task: id }
            })

            const data = response.data.results || response.data
            setComments(data)
        } catch (err) {
            setCommentError(
                err.response?.data?.detail ||
                'Unable to load comments.'
            )
        } finally {
            setCommentsLoading(false)
        }
    }, [id])

    const fetchTaskExtras = useCallback(async () => {
        try {
            const [attachmentResponse, activityResponse] = await Promise.all([
                api.get('tasks/attachments/', { params: { task: id } }),
                api.get('tasks/activities/', { params: { task: id } })
            ])
            setAttachments(attachmentResponse.data.results || attachmentResponse.data)
            setActivities(activityResponse.data.results || activityResponse.data)
            setAttachmentError('')
        } catch (err) {
            setAttachmentError(
                err.response?.data?.detail ||
                'Unable to load task files and activity.'
            )
        }
    }, [id])

    useEffect(() => {
        let active = true
        Promise.resolve().then(() => {
            if (!active) return
            fetchTask()
            fetchProfile()
            fetchComments()
            fetchTaskExtras()
        })
        return () => { active = false }
    }, [fetchComments, fetchProfile, fetchTask, fetchTaskExtras])

    const handleUploadAttachment = async (e) => {
        e.preventDefault()

        if (!attachmentFile) return

        const formData = new FormData()
        formData.append('task', id)
        formData.append('file', attachmentFile)

        try {
            setUploadingAttachment(true)
            setAttachmentError('')
            await api.post('tasks/attachments/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
            setAttachmentFile(null)
            await fetchTaskExtras()
        } catch (err) {
            setAttachmentError(
                err.response?.data?.task?.[0] ||
                err.response?.data?.detail ||
                'Unable to upload this file.'
            )
        } finally {
            setUploadingAttachment(false)
        }
    }

    const handlePostComment = async (e) => {
        e.preventDefault()

        if (!commentText.trim()) {
            setCommentError('Please enter a comment.')
            return
        }

        try {
            setPostingComment(true)
            setCommentError('')
            setSuccess('')

            await api.post('tasks/comments/', {
                task: Number(id),
                message: commentText.trim()
            })

            setCommentText('')
            setSuccess('Comment posted successfully!')

            await fetchComments()
        } catch (err) {
            const errorData = err.response?.data

            setCommentError(
                errorData?.message?.[0] ||
                errorData?.task?.[0] ||
                errorData?.detail ||
                'Unable to post comment.'
            )
        } finally {
            setPostingComment(false)
        }
    }

    const handleStatusUpdate = async (newStatus) => {
        if (!newStatus || newStatus === task.status) return

        try {
            setUpdating(true)
            setError('')
            setSuccess('')

            const response = await api.patch(`tasks/${id}/`, {
                status: newStatus
            })

            setTask(response.data)
            setSuccess('Task status updated successfully!')
        } catch (err) {
            const errorData = err.response?.data

            setError(
                errorData?.status?.[0] ||
                errorData?.detail ||
                'Unable to update task status.'
            )
        } finally {
            setUpdating(false)
        }
    }

    const getAllowedStatuses = () => {
        if (!task || !user) return []

        if (user.role === 'EMPLOYEE') {
            if (task.status === 'TODO') return ['IN_PROGRESS']
            if (task.status === 'IN_PROGRESS') return ['IN_REVIEW']
            return []
        }

        if (user.role === 'PROJECT_MANAGER') {
            if (task.status === 'IN_REVIEW') {
                return ['COMPLETED', 'IN_PROGRESS']
            }
            return []
        }

        if (user.role === 'ADMIN') {
            return statusOptions
                .filter(item => item.value !== task.status)
                .map(item => item.value)
        }

        return []
    }

    const formatDate = (date) => {
        if (!date) return 'Not available'

        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    const formatDateTime = (date) => {
        if (!date) return ''

        return new Date(date).toLocaleString('en-US', {
            dateStyle: 'medium',
            timeStyle: 'short'
        })
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <RefreshCw className="animate-spin text-indigo-600" size={32} />
            </div>
        )
    }

    if (error && !task) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6">
                <AlertCircle size={40} className="text-red-500 mb-4" />
                <p className="text-slate-700 mb-4">{error}</p>
                <button
                    onClick={() => navigate(-1)}
                    className="px-5 py-2 bg-indigo-600 text-white rounded-lg"
                >
                    Go Back
                </button>
            </div>
        )
    }

    if (!task) return null

    const allowedStatuses = getAllowedStatuses()

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8">
            <div className="max-w-5xl mx-auto">

                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 mb-6"
                >
                    <ArrowLeft size={18} />
                    Back
                </button>

                {/* Task Details */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

                    <div className="p-6 md:p-8 border-b border-slate-100">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">

                            <div>
                                <p className="text-sm font-semibold text-indigo-600 mb-2">
                                    TASK #{task.id}
                                </p>

                                <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
                                    {task.title}
                                </h1>

                                <p className="text-slate-500 mt-3">
                                    Project #{task.project}
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${statusStyles[task.status] || ''}`}>
                                    {task.status?.replace('_', ' ')}
                                </span>

                                <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${priorityStyles[task.priority] || ''}`}>
                                    {task.priority}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 md:p-8">

                        {error && (
                            <div className="mb-5 p-4 rounded-lg bg-red-50 text-red-700 text-sm">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="mb-5 p-4 rounded-lg bg-emerald-50 text-emerald-700 text-sm flex items-center gap-2">
                                <CheckCircle2 size={18} />
                                {success}
                            </div>
                        )}

                        <h2 className="text-lg font-bold text-slate-900 mb-3">
                            Description
                        </h2>

                        <p className="text-slate-600 leading-7 whitespace-pre-wrap">
                            {task.description || 'No description provided.'}
                        </p>

                        <div className="grid sm:grid-cols-2 gap-5 mt-8">

                            <InfoItem icon={FolderKanban} label="Project" value={`Project #${task.project}`} />

                            <InfoItem
                                icon={User}
                                label="Assigned Employee"
                                value={task.assigned_to ? `User #${task.assigned_to}` : 'Unassigned'}
                            />

                            <InfoItem icon={Flag} label="Priority" value={task.priority} />

                            <InfoItem icon={CalendarDays} label="Due Date" value={formatDate(task.due_date)} />

                            <InfoItem icon={Clock} label="Created At" value={formatDate(task.created_at)} />

                            <InfoItem icon={RefreshCw} label="Last Updated" value={formatDate(task.updated_at)} />

                        </div>

                        {/* Status Update */}
                        {allowedStatuses.length > 0 && (
                            <div className="mt-10 pt-7 border-t border-slate-100">

                                <h2 className="text-lg font-bold text-slate-900 mb-2">
                                    Update Task Status
                                </h2>

                                <p className="text-sm text-slate-500 mb-4">
                                    Current status: {task.status.replace('_', ' ')}
                                </p>

                                <div className="flex flex-wrap gap-3">
                                    {allowedStatuses.map(status => (
                                        <button
                                            key={status}
                                            disabled={updating}
                                            onClick={() => handleStatusUpdate(status)}
                                            className="px-5 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-50 transition"
                                        >
                                            {updating
                                                ? 'Updating...'
                                                : statusOptions.find(item => item.value === status)?.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <section className="mt-8 grid gap-6 lg:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center gap-3">
                            <span className="rounded-xl bg-blue-50 p-3 text-blue-700"><Paperclip size={20} /></span>
                            <div>
                                <h2 className="font-bold text-slate-900">Attachments</h2>
                                <p className="text-xs text-slate-500">{attachments.length} file(s)</p>
                            </div>
                        </div>
                        {attachmentError && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{attachmentError}</p>}
                        <div className="mt-4 space-y-2">
                            {attachments.map(attachment => (
                                <a key={attachment.id} href={attachment.file} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 text-sm text-slate-700 hover:bg-slate-50">
                                    <FileText size={17} className="shrink-0 text-blue-600" />
                                    <span className="min-w-0 flex-1 truncate">{attachment.file?.split('/').pop() || `Attachment #${attachment.id}`}</span>
                                    <span className="text-xs text-slate-400">{attachment.uploaded_by || ''}</span>
                                </a>
                            ))}
                            {attachments.length === 0 && !attachmentError && <p className="py-3 text-sm text-slate-400">No files have been added to this task.</p>}
                        </div>
                        <form onSubmit={handleUploadAttachment} className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
                            <input type="file" onChange={event => setAttachmentFile(event.target.files?.[0] || null)} className="min-w-0 flex-1 text-xs" />
                            <button disabled={!attachmentFile || uploadingAttachment} className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">
                                {uploadingAttachment ? 'Uploading...' : 'Upload file'}
                            </button>
                        </form>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center gap-3">
                            <span className="rounded-xl bg-violet-50 p-3 text-violet-700"><Activity size={20} /></span>
                            <div>
                                <h2 className="font-bold text-slate-900">Task activity</h2>
                                <p className="text-xs text-slate-500">A history of updates and changes.</p>
                            </div>
                        </div>
                        <div className="mt-5 max-h-72 space-y-4 overflow-y-auto">
                            {activities.map(activity => (
                                <div key={activity.id} className="flex gap-3">
                                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-violet-500" />
                                    <div>
                                        <p className="text-sm font-medium text-slate-700">{activity.description}</p>
                                        <p className="mt-1 text-xs text-slate-400">{activity.user} · {formatDateTime(activity.created_at)}</p>
                                    </div>
                                </div>
                            ))}
                            {activities.length === 0 && <p className="text-sm text-slate-400">No activity recorded yet.</p>}
                        </div>
                    </div>
                </section>

                {/* Comments Section */}
                <div className="mt-8 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8">

                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                            <MessageSquare size={22} />
                        </div>

                        <div>
                            <h2 className="text-xl font-bold text-slate-900">
                                Comments
                            </h2>
                            <p className="text-sm text-slate-500">
                                Discuss and share feedback about this task.
                            </p>
                        </div>
                    </div>

                    {/* Add Comment */}
                    <form onSubmit={handlePostComment} className="mb-8">

                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Write a comment
                        </label>

                        <textarea
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            rows={3}
                            placeholder="Write your feedback or message..."
                            className="w-full border border-slate-200 rounded-xl p-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-y"
                        />

                        {commentError && (
                            <p className="text-sm text-red-600 mt-2">
                                {commentError}
                            </p>
                        )}

                        <div className="flex justify-end mt-3">
                            <button
                                type="submit"
                                disabled={postingComment || !commentText.trim()}
                                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-50 transition"
                            >
                                {postingComment ? (
                                    <>
                                        <RefreshCw size={17} className="animate-spin" />
                                        Posting...
                                    </>
                                ) : (
                                    <>
                                        <Send size={17} />
                                        Post Comment
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    <div className="border-t border-slate-100 pt-6">

                        <h3 className="font-bold text-slate-900 mb-5">
                            All Comments ({comments.length})
                        </h3>

                        {commentsLoading ? (
                            <div className="flex justify-center py-8">
                                <RefreshCw className="animate-spin text-indigo-600" />
                            </div>
                        ) : comments.length === 0 ? (
                            <div className="text-center py-10">
                                <MessageSquare size={35} className="mx-auto text-slate-300 mb-3" />
                                <p className="text-slate-500 font-medium">
                                    No comments yet.
                                </p>
                                <p className="text-sm text-slate-400 mt-1">
                                    Be the first to share your feedback.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {comments.map(comment => (
                                    <div
                                        key={comment.id}
                                        className="p-4 rounded-xl bg-slate-50 border border-slate-100"
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">

                                            <div className="flex items-center gap-2">
                                                <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                                                    {comment.user?.charAt(0)?.toUpperCase() || 'U'}
                                                </div>

                                                <div>
                                                    <p className="text-sm font-bold text-slate-800">
                                                        {comment.user}
                                                    </p>
                                                    <p className="text-xs text-slate-400">
                                                        {formatDateTime(comment.created_at)}
                                                    </p>
                                                </div>
                                            </div>

                                        </div>

                                        <p className="text-sm text-slate-700 leading-6 whitespace-pre-wrap">
                                            {comment.message}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    )
}

function InfoItem({ icon: Icon, label, value }) {
    return (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50">
            <div className="p-2 rounded-lg bg-white text-indigo-600">
                <Icon size={19} />
            </div>

            <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    {label}
                </p>
                <p className="text-sm font-semibold text-slate-800 mt-1">
                    {value}
                </p>
            </div>
        </div>
    )
}

export default TaskDetail
