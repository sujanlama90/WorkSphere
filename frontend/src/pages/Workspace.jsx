import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, NavLink, useNavigate, useParams } from 'react-router-dom'
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  Download,
  FileText,
  FolderKanban,
  LifeBuoy,
  LogOut,
  Menu,
  Plus,
  RefreshCw,
  Search,
  Send,
  Ticket,
  Users,
  X,
} from 'lucide-react'
import api from '../api/axios'

const navigation = [
  { section: 'clients', label: 'Clients', icon: Users, roles: ['ADMIN', 'PROJECT_MANAGER'] },
  { section: 'projects', label: 'Projects', icon: FolderKanban, roles: ['ADMIN', 'PROJECT_MANAGER', 'EMPLOYEE', 'CLIENT'] },
  { section: 'requests', label: 'Project requests', icon: FileText, roles: ['ADMIN', 'CLIENT'] },
  { section: 'tasks', label: 'Tasks', icon: CheckCircle2, roles: ['ADMIN', 'PROJECT_MANAGER', 'EMPLOYEE', 'CLIENT'] },
  { section: 'tickets', label: 'Support tickets', icon: Ticket, roles: ['ADMIN', 'PROJECT_MANAGER', 'EMPLOYEE', 'CLIENT'] },
  { section: 'notifications', label: 'Notifications', icon: Bell, roles: ['ADMIN', 'PROJECT_MANAGER', 'EMPLOYEE', 'CLIENT'] },
  { section: 'time', label: 'Time tracking', icon: Clock3, roles: ['ADMIN', 'PROJECT_MANAGER', 'EMPLOYEE'] },
  { section: 'reports', label: 'Reports', icon: FileText, roles: ['ADMIN', 'PROJECT_MANAGER'] },
  { section: 'activity', label: 'Activity log', icon: Activity, roles: ['ADMIN', 'PROJECT_MANAGER', 'EMPLOYEE', 'CLIENT'] },
]

const statusOptions = {
  projects: ['PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED'],
  tasks: ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED'],
  tickets: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'],
  requests: ['PENDING', 'APPROVED', 'REJECTED', 'NEEDS_INFORMATION'],
}

const priorityOptions = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']

const sectionTitles = {
  clients: 'Client directory',
  projects: 'Projects',
  requests: 'Project requests',
  tasks: 'Tasks',
  tickets: 'Support tickets',
  notifications: 'Notifications',
  time: 'Time tracking',
  reports: 'Reports',
  activity: 'Activity log',
}

const listData = (data) => {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.results)) return data.results
  return []
}

const displayStatus = (value) => (value || 'UNKNOWN').replaceAll('_', ' ')

const errorMessage = (error) => {
  const data = error.response?.data
  if (typeof data === 'string') return data
  if (data?.detail) return data.detail
  if (data?.error) return data.error
  if (data && typeof data === 'object') {
    const first = Object.values(data).flat()[0]
    if (typeof first === 'string') return first
  }
  return error.message || 'The request could not be completed.'
}

function Workspace() {
  const { section = 'projects' } = useParams()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [data, setData] = useState([])
  const [projects, setProjects] = useState([])
  const [clients, setClients] = useState([])
  const [users, setUsers] = useState([])
  const [timeTasks, setTimeTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('ALL')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({})
  const [mobileNav, setMobileNav] = useState(false)
  const [commentTicket, setCommentTicket] = useState(null)
  const [ticketComments, setTicketComments] = useState([])
  const [ticketAttachments, setTicketAttachments] = useState([])
  const [comment, setComment] = useState('')
  const [ticketFile, setTicketFile] = useState(null)
  const [activeTimer, setActiveTimer] = useState(null)
  const [reviewTarget, setReviewTarget] = useState(null)
  const [reviewStatus, setReviewStatus] = useState('')
  const [reviewFeedback, setReviewFeedback] = useState('')
  const [reviewManager, setReviewManager] = useState('')
  const [resubmitTarget, setResubmitTarget] = useState(null)
  const [resubmitText, setResubmitText] = useState('')

  const visibleNavigation = useMemo(
    () => navigation.filter((item) => item.roles.includes(user?.role)),
    [user],
  )

  const loadSection = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError('')
    try {
      const endpoints = {
        clients: 'clients/clients/',
        projects: 'projects/',
        requests: 'projects/requests/',
        tasks: 'tasks/',
        tickets: 'tickets/tickets/',
        notifications: 'notifications/notifications/',
        time: 'time-tracking/history/',
        activity: 'audit-logs/',
      }

      if (section === 'reports') {
        setData([])
        setLoading(false)
        return
      }

      const response = await api.get(endpoints[section] || endpoints.projects)
      const items = listData(response.data)
      setData(items)
      if (section === 'projects') setProjects(items)
      if (section === 'clients') setClients(items)
      if (section === 'time') {
        setActiveTimer(items.find((entry) => !entry.end_time) || null)
        const taskResponse = await api.get('tasks/')
        setTimeTasks(listData(taskResponse.data))
      }

      if (section === 'tasks' || section === 'tickets') {
        const projectResponse = await api.get('projects/')
        setProjects(listData(projectResponse.data))
      }

      if (['ADMIN', 'PROJECT_MANAGER'].includes(user.role) && ['projects', 'tasks', 'tickets'].includes(section)) {
        const clientResponse = await api.get('clients/clients/')
        setClients(listData(clientResponse.data))
      }

      if (user.role === 'ADMIN' && ['projects', 'tasks', 'tickets', 'requests'].includes(section)) {
        try {
          const userResponse = await api.get('auth/users/')
          setUsers(listData(userResponse.data))
        } catch {
          setUsers([])
        }
      }
    } catch (requestError) {
      setError(errorMessage(requestError))
    } finally {
      setLoading(false)
    }
  }, [section, user])

  useEffect(() => {
    let active = true
    api.get('auth/profile/')
      .then((response) => {
        if (active) setUser(response.data)
      })
      .catch(() => {
        if (active) navigate('/login', { replace: true })
      })
    return () => { active = false }
  }, [navigate])

  useEffect(() => {
    if (!user) return undefined
    let active = true
    Promise.resolve().then(() => {
      if (active) return loadSection()
      return undefined
    })
    return () => { active = false }
  }, [loadSection, user])

  const logout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    navigate('/login', { replace: true })
  }

  const resetSectionUI = () => {
    setMobileNav(false)
    setQuery('')
    setFilter('ALL')
    setNotice('')
    setError('')
    setFormOpen(false)
    setCommentTicket(null)
  }

  const openForm = (item = null) => {
    setEditing(item)
    setNotice('')
    setError('')
    const defaults = {
      clients: { name: '', contact_person: '', email: '', phone: '', address: '', description: '', is_active: true },
      projects: {
        name: '', description: '', client: '', project_manager: user?.id || '',
        start_date: '', deadline: '', status: 'PLANNING', priority: 'MEDIUM',
      },
      tasks: { project: '', title: '', description: '', assigned_to: '', due_date: '', status: 'TODO', priority: 'MEDIUM' },
      tickets: { project: '', title: '', description: '', assigned_to: '', status: 'OPEN', priority: 'MEDIUM' },
      requests: { name: '', description: '', requirements: '', expected_start_date: '', expected_deadline: '' },
    }
    setForm(item ? { ...item } : defaults[section] || {})
    setFormOpen(true)
  }

  const saveForm = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setNotice('')
    try {
      const endpoint = {
        clients: 'clients/clients/',
        projects: 'projects/',
        tasks: 'tasks/',
        tickets: 'tickets/tickets/',
        requests: 'projects/requests/',
      }[section]
      const payload = { ...form }
      if (section === 'projects' && user?.role === 'PROJECT_MANAGER') {
        payload.project_manager = user.id
      }
      if (section === 'tasks' && !payload.assigned_to) delete payload.assigned_to
      if (section === 'tickets' && !payload.assigned_to) delete payload.assigned_to
      if (section === 'projects' && !payload.employees) delete payload.employees
      if (['projects', 'tasks', 'tickets'].includes(section)) {
        for (const field of ['client', 'project_manager', 'project', 'assigned_to']) {
          if (payload[field] !== undefined && payload[field] !== '') {
            payload[field] = Number(payload[field])
          }
        }
      }
      if (editing) {
        await api.patch(`${endpoint}${editing.id}/`, payload)
      } else {
        await api.post(endpoint, payload)
      }
      setFormOpen(false)
      setNotice(editing ? 'Changes saved successfully.' : 'Created successfully.')
      await loadSection()
    } catch (requestError) {
      setError(errorMessage(requestError))
    } finally {
      setSaving(false)
    }
  }

  const removeClient = async (item) => {
    if (!window.confirm(`Delete "${item.name}"?`)) return
    setError('')
    try {
      await api.delete(`clients/clients/${item.id}/`)
      setNotice('Client deleted.')
      await loadSection()
    } catch (requestError) {
      setError(errorMessage(requestError))
    }
  }

  const deleteResource = async (item) => {
    const endpoints = {
      projects: 'projects/',
      tasks: 'tasks/',
      tickets: 'tickets/tickets/',
    }
    if (!window.confirm(`Delete "${item.name || item.title}"? This cannot be undone.`)) return
    try {
      await api.delete(`${endpoints[section]}${item.id}/`)
      setNotice('Item deleted.')
      await loadSection()
    } catch (requestError) {
      setError(errorMessage(requestError))
    }
  }

  const updateStatus = async (item, value) => {
    const endpoint = section === 'tickets' ? 'tickets/tickets/' : 'tasks/'
    setError('')
    try {
      const response = await api.patch(`${endpoint}${item.id}/`, { status: value })
      setData((current) => current.map((entry) => entry.id === item.id ? response.data : entry))
      setNotice('Status updated.')
    } catch (requestError) {
      setError(errorMessage(requestError))
    }
  }

  const markRead = async (item) => {
    try {
      const response = await api.patch(`notifications/notifications/${item.id}/`, { is_read: true })
      setData((current) => current.map((entry) => entry.id === item.id ? response.data : entry))
    } catch (requestError) {
      setError(errorMessage(requestError))
    }
  }

  const openTicketComments = async (ticket) => {
    setCommentTicket(ticket)
    setComment('')
    try {
      const [commentResponse, attachmentResponse] = await Promise.all([
        api.get('tickets/comments/', { params: { ticket: ticket.id } }),
        api.get('tickets/attachments/', { params: { ticket: ticket.id } }),
      ])
      setTicketComments(listData(commentResponse.data))
      setTicketAttachments(listData(attachmentResponse.data))
    } catch (requestError) {
      setError(errorMessage(requestError))
      setTicketComments([])
      setTicketAttachments([])
    }
  }

  const postTicketComment = async (event) => {
    event.preventDefault()
    if (!comment.trim() || !commentTicket) return
    try {
      await api.post('tickets/comments/', { ticket: commentTicket.id, message: comment.trim() })
      setComment('')
      await openTicketComments(commentTicket)
      setNotice('Reply posted.')
    } catch (requestError) {
      setError(errorMessage(requestError))
    }
  }

  const uploadTicketFile = async (event) => {
    event.preventDefault()
    if (!ticketFile || !commentTicket) return
    const body = new FormData()
    body.append('ticket', commentTicket.id)
    body.append('file', ticketFile)
    try {
      await api.post('tickets/attachments/', body, { headers: { 'Content-Type': 'multipart/form-data' } })
      setTicketFile(null)
      setNotice('Attachment uploaded.')
    } catch (requestError) {
      setError(errorMessage(requestError))
    }
  }

  const openReview = (item, decision) => {
    setReviewTarget(item)
    setReviewStatus(decision)
    setReviewFeedback('')
    setReviewManager('')
  }

  const reviewRequest = async (event) => {
    event.preventDefault()
    if (!reviewTarget) return
    if (reviewStatus !== 'APPROVED' && !reviewFeedback.trim()) {
      setError('Add feedback when requesting information or rejecting a request.')
      return
    }
    try {
      const payload = { status: reviewStatus, admin_feedback: reviewFeedback.trim() }
      if (reviewStatus === 'APPROVED') payload.project_manager = Number(reviewManager)
      await api.post(`projects/requests/${reviewTarget.id}/review/`, payload)
      setReviewTarget(null)
      setNotice('Request reviewed.')
      await loadSection()
    } catch (requestError) {
      setError(errorMessage(requestError))
    }
  }

  const resubmitRequest = async (event) => {
    event.preventDefault()
    if (!resubmitTarget || !resubmitText.trim()) return
    try {
      await api.post(`projects/requests/${resubmitTarget.id}/resubmit/`, { additional_information: resubmitText.trim() })
      setResubmitTarget(null)
      setResubmitText('')
      setNotice('Additional information submitted.')
      await loadSection()
    } catch (requestError) {
      setError(errorMessage(requestError))
    }
  }

  const startTimer = async (event) => {
    event.preventDefault()
    try {
      const response = await api.post('time-tracking/start/', {
        task: Number(form.task),
        description: form.description || '',
      })
      setActiveTimer(response.data)
      setNotice('Timer started.')
      await loadSection()
    } catch (requestError) {
      setError(errorMessage(requestError))
    }
  }

  const stopTimer = async () => {
    if (!activeTimer) return
    try {
      await api.post('time-tracking/stop/', { time_entry: activeTimer.id })
      setActiveTimer(null)
      setNotice('Timer stopped and entry saved.')
      await loadSection()
    } catch (requestError) {
      setError(errorMessage(requestError))
    }
  }

  const downloadReport = async (report) => {
    try {
      const response = await api.get(`reports/${report}/`, { responseType: 'blob' })
      const url = URL.createObjectURL(response.data)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `${report}_report.csv`
      anchor.click()
      URL.revokeObjectURL(url)
    } catch (requestError) {
      setError(errorMessage(requestError))
    }
  }

  const filteredData = useMemo(() => data.filter((item) => {
    const searchable = [
      item.name, item.title, item.description, item.client_name, item.username,
      item.message, item.action, item.model_name, item.notification_type,
    ].filter(Boolean).join(' ').toLowerCase()
    const matchesQuery = searchable.includes(query.toLowerCase())
    const matchesFilter = filter === 'ALL' ||
      item.status === filter ||
      (filter === 'UNREAD' && !item.is_read)
    return matchesQuery && matchesFilter
  }), [data, filter, query])

  if (!user) {
    return <LoadingState label="Loading your workspace..." />
  }

  const activeSection = visibleNavigation.find((item) => item.section === section)
  if (!activeSection && section !== 'reports') {
    return <main className="p-8"><p>This section is not available for your account.</p><Link className="text-blue-700" to="/dashboard">Return to dashboard</Link></main>
  }
  const PageIcon = activeSection?.icon || FileText
  const canCreate = ['clients', 'projects', 'tasks', 'tickets', 'requests'].includes(section) &&
    (section !== 'clients' || ['ADMIN', 'PROJECT_MANAGER'].includes(user.role)) &&
    (section !== 'projects' || ['ADMIN', 'PROJECT_MANAGER'].includes(user.role)) &&
    (section !== 'tasks' || ['ADMIN', 'PROJECT_MANAGER'].includes(user.role)) &&
    (section !== 'tickets' || ['ADMIN', 'PROJECT_MANAGER', 'CLIENT'].includes(user.role)) &&
    (section !== 'requests' || user.role === 'CLIENT')

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {mobileNav && <button aria-label="Close menu" onClick={() => setMobileNav(false)} className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden" />}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-slate-950 text-white transition-transform lg:translate-x-0 ${mobileNav ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-[76px] items-center justify-between border-b border-white/10 px-6">
          <Link to="/dashboard" className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600"><BriefcaseBusiness size={21} /></span>
            <span><strong className="block leading-tight">WorkSphere</strong><small className="text-xs text-slate-400">Team workspace</small></span>
          </Link>
          <button onClick={() => setMobileNav(false)} className="text-slate-400 lg:hidden" aria-label="Close navigation"><X size={20} /></button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-6">
          <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-[.18em] text-slate-500">Workspace</p>
          <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`} onClick={resetSectionUI}>
            <BriefcaseBusiness size={18} /> Overview
          </NavLink>
          {visibleNavigation.map((item) => {
            const Icon = item.icon
            return <NavLink key={item.section} to={`/workspace/${item.section}`} className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`} onClick={resetSectionUI}>
              <Icon size={18} />{item.label}
            </NavLink>
          })}
          {user.role === 'ADMIN' && <NavLink to="/admin/users" className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`} onClick={resetSectionUI}><Users size={18} />User management</NavLink>}
          <div className="my-6 border-t border-white/10" />
          <NavLink to="/profile" className="nav-item" onClick={resetSectionUI}><Users size={18} />My profile</NavLink>
          <NavLink to="/change-password" className="nav-item" onClick={resetSectionUI}><LifeBuoy size={18} />Account security</NavLink>
        </nav>
        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-blue-500 font-bold">{(user.first_name || user.username || 'U')[0].toUpperCase()}</span>
            <span className="min-w-0 flex-1"><strong className="block truncate text-sm">{user.first_name || user.username}</strong><small className="block truncate text-xs text-slate-400">{displayStatus(user.role)}</small></span>
            <button onClick={logout} className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white" title="Sign out"><LogOut size={17} /></button>
          </div>
        </div>
      </aside>

      <div className="min-h-screen lg:pl-72">
        <header className="sticky top-0 z-30 flex min-h-[76px] items-center justify-between border-b border-slate-200 bg-white/90 px-5 backdrop-blur-md sm:px-8">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileNav(true)} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden" aria-label="Open navigation"><Menu size={21} /></button>
            <Link to="/dashboard" className="hidden items-center gap-1 text-sm text-slate-400 hover:text-slate-700 sm:flex"><ArrowLeft size={15} />Overview</Link>
            <span className="hidden h-5 border-l border-slate-200 sm:block" />
            <div><p className="text-xs font-medium text-slate-400">WORKSPACE / {displayStatus(section)}</p><h1 className="text-lg font-bold">{sectionTitles[section] || 'Workspace'}</h1></div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={loadSection} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"><RefreshCw size={16} className={loading ? 'animate-spin' : ''} /><span className="hidden sm:inline">Refresh</span></button>
            {canCreate && <button onClick={() => openForm()} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"><Plus size={17} /><span className="hidden sm:inline">{section === 'requests' ? 'New request' : `New ${section === 'clients' ? 'client' : section === 'projects' ? 'project' : section === 'tasks' ? 'task' : 'ticket'}`}</span><span className="sm:hidden">New</span></button>}
          </div>
        </header>

        <main className="mx-auto max-w-[1440px] space-y-6 p-5 sm:p-8">
          <section className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-700"><PageIcon size={14} />{displayStatus(user.role)}</div>
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{sectionTitles[section] || 'Reports'}</h2>
              <p className="mt-1 text-sm text-slate-500">{getSectionDescription(section, user.role)}</p>
            </div>
            {['clients', 'projects', 'requests', 'tasks', 'tickets', 'notifications', 'activity'].includes(section) && (
              <div className="flex flex-wrap gap-2">
                <label className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search..." className="h-10 w-52 rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" />
                </label>
                {statusOptions[section] ? <select value={filter} onChange={(event) => setFilter(event.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500"><option value="ALL">All statuses</option>{statusOptions[section].map((status) => <option key={status} value={status}>{displayStatus(status)}</option>)}</select> : section === 'notifications' ? <select value={filter} onChange={(event) => setFilter(event.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm"><option value="ALL">All notifications</option><option value="UNREAD">Unread only</option></select> : null}
              </div>
            )}
          </section>

          {notice && <div role="status" className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"><CheckCircle2 size={17} />{notice}<button className="ml-auto" onClick={() => setNotice('')} aria-label="Dismiss"><X size={16} /></button></div>}
          {error && <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"><AlertCircle size={17} className="mt-0.5 shrink-0" /><span>{error}</span><button className="ml-auto" onClick={() => setError('')} aria-label="Dismiss"><X size={16} /></button></div>}

          {loading ? <LoadingState label={`Loading ${sectionTitles[section]?.toLowerCase() || 'workspace'}...`} /> : (
            <>
              {section === 'clients' && <ClientsView items={filteredData} onEdit={openForm} onDelete={removeClient} canManage={['ADMIN', 'PROJECT_MANAGER'].includes(user.role)} canDelete={user.role === 'ADMIN'} />}
              {section === 'projects' && <ProjectsView items={filteredData} clients={clients} user={user} onEdit={openForm} onDelete={deleteResource} canManage={['ADMIN', 'PROJECT_MANAGER'].includes(user.role)} />}
              {section === 'requests' && <RequestsView items={filteredData} role={user.role} onReview={openReview} onResubmit={(item) => { setResubmitTarget(item); setResubmitText('') }} />}
              {section === 'tasks' && <TasksView items={filteredData} projects={projects} user={user} onEdit={openForm} onDelete={deleteResource} onStatus={updateStatus} />}
              {section === 'tickets' && <TicketsView items={filteredData} projects={projects} role={user.role} onEdit={openForm} onDelete={deleteResource} onStatus={updateStatus} onComments={openTicketComments} />}
              {section === 'notifications' && <NotificationsView items={filteredData} onRead={markRead} />}
              {section === 'time' && <TimeView items={data} tasks={timeTasks} activeTimer={activeTimer} form={form} setForm={setForm} onStart={startTimer} onStop={stopTimer} />}
              {section === 'reports' && <ReportsView onDownload={downloadReport} />}
              {section === 'activity' && <ActivityView items={filteredData} />}
            </>
          )}
        </main>
      </div>

      {formOpen && <Modal title={`${editing ? 'Edit' : 'Create'} ${sectionTitles[section]?.replace(/s$/, '') || 'item'}`} onClose={() => setFormOpen(false)}>
        <form onSubmit={saveForm} className="space-y-4">
          <ResourceFields section={section} form={form} setForm={setForm} projects={projects} clients={clients} users={users} role={user.role} editing={Boolean(editing)} />
          {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button type="button" onClick={() => setFormOpen(false)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600">Cancel</button>
            <button disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{saving && <RefreshCw size={15} className="animate-spin" />}{editing ? 'Save changes' : 'Create'}</button>
          </div>
        </form>
      </Modal>}

      {commentTicket && <Modal title={commentTicket.title} subtitle={`Ticket #${commentTicket.id} · ${displayStatus(commentTicket.status)}`} onClose={() => setCommentTicket(null)}>
        {ticketAttachments.length > 0 && <div className="mb-4 space-y-2 border-b border-slate-100 pb-4">{ticketAttachments.map((attachment) => <a key={attachment.id} href={attachment.file} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-blue-700 hover:underline"><FileText size={15} />{attachment.file?.split('/').pop() || `Attachment #${attachment.id}`}</a>)}</div>}
        <div className="max-h-[50vh] space-y-3 overflow-y-auto">
          {ticketComments.length ? ticketComments.map((entry) => <article key={entry.id} className="rounded-xl bg-slate-50 p-3"><div className="flex justify-between gap-3 text-xs text-slate-500"><strong>{entry.user || 'Workspace member'}</strong><span>{formatDate(entry.created_at)}</span></div><p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{entry.message}</p></article>) : <p className="py-6 text-center text-sm text-slate-500">No replies yet.</p>}
        </div>
        <form onSubmit={postTicketComment} className="mt-4 flex gap-2"><input value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Write a reply..." className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm" required /><button className="rounded-xl bg-blue-600 px-4 text-white" aria-label="Send reply"><Send size={17} /></button></form>
        <form onSubmit={uploadTicketFile} className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4"><input type="file" onChange={(event) => setTicketFile(event.target.files?.[0] || null)} className="min-w-0 flex-1 text-xs" /><button disabled={!ticketFile} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold disabled:opacity-40">Upload attachment</button></form>
      </Modal>}

      {reviewTarget && <Modal title="Review project request" subtitle={reviewTarget.name} onClose={() => setReviewTarget(null)}>
        <form onSubmit={reviewRequest} className="space-y-4">
          {reviewStatus === 'APPROVED' ? <label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-600">Project manager *</span><select required value={reviewManager} onChange={(event) => setReviewManager(event.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"><option value="">Select a manager</option>{users.filter((item) => item.role === 'PROJECT_MANAGER' && item.is_active).map((item) => <option key={item.id} value={item.id}>{item.first_name ? `${item.first_name} ${item.last_name}` : item.username}</option>)}</select></label> : <label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-600">Feedback for the client *</span><textarea required rows={4} value={reviewFeedback} onChange={(event) => setReviewFeedback(event.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" placeholder="Explain what is needed or why the request was declined." /></label>}
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4"><button type="button" onClick={() => setReviewTarget(null)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600">Cancel</button><button className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white">{reviewStatus === 'APPROVED' ? 'Approve request' : reviewStatus === 'REJECTED' ? 'Reject request' : 'Request information'}</button></div>
        </form>
      </Modal>}

      {resubmitTarget && <Modal title="Provide additional information" subtitle={resubmitTarget.name} onClose={() => setResubmitTarget(null)}>
        <form onSubmit={resubmitRequest} className="space-y-4"><label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-600">Additional information *</span><textarea required rows={5} value={resubmitText} onChange={(event) => setResubmitText(event.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" placeholder="Add the details requested by the review team." /></label><div className="flex justify-end gap-2 border-t border-slate-100 pt-4"><button type="button" onClick={() => setResubmitTarget(null)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600">Cancel</button><button className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white">Resubmit</button></div></form>
      </Modal>}
    </div>
  )
}

function getSectionDescription(section, role) {
  const descriptions = {
    clients: 'Keep client organizations and contact details organized.',
    projects: 'Track project ownership, delivery dates and progress.',
    requests: role === 'ADMIN' ? 'Review incoming client project requests.' : 'Submit a project brief and follow its review status.',
    tasks: 'Plan work, manage priorities and keep delivery moving.',
    tickets: 'Coordinate client support requests and their resolution.',
    notifications: 'Stay up to date with important workspace activity.',
    time: 'Start and stop a timer for a task, then review recorded hours.',
    reports: 'Export project and task data as CSV reports.',
    activity: 'Review recent changes and actions in your workspace.',
  }
  return descriptions[section] || 'Manage your work in WorkSphere.'
}

function ClientsView({ items, onEdit, onDelete, canManage, canDelete }) {
  return <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{items.map((item) => <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex items-start justify-between gap-3"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-blue-50 text-blue-700"><Users size={20} /></span><div><h3 className="font-bold">{item.name}</h3><p className="text-xs text-slate-500">{item.contact_person || 'Client organization'}</p></div></div><StatusPill value={item.is_active ? 'ACTIVE' : 'INACTIVE'} /></div>
    <div className="mt-5 space-y-2 text-sm text-slate-600"><p>{item.email || 'No email provided'}</p><p>{item.phone || 'No phone provided'}</p><p className="line-clamp-2 text-xs text-slate-500">{item.address || item.description || 'No additional details.'}</p></div>
    {canManage && <div className="mt-5 flex gap-2 border-t border-slate-100 pt-4"><button onClick={() => onEdit(item)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold hover:bg-slate-50">Edit</button>{canDelete && <button onClick={() => onDelete(item)} className="rounded-lg border border-red-100 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50">Delete</button>}</div>}
  </article>)}<EmptyState show={!items.length} title="No clients found" body="Create a client to start organizing projects by organization." /></div>
}

function ProjectsView({ items, clients, user, onEdit, onDelete, canManage }) {
  return <div className="grid gap-4 xl:grid-cols-2">{items.map((item) => <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex items-start justify-between gap-3"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-violet-50 text-violet-700"><FolderKanban size={20} /></span><div><h3 className="font-bold">{item.name}</h3><p className="text-xs text-slate-500">{item.client_name || clients.find((client) => client.id === item.client)?.name || `Client #${item.client}`}</p></div></div><StatusPill value={item.status} /></div>
    <p className="mt-4 line-clamp-2 text-sm leading-6 text-slate-600">{item.description || 'No project description provided.'}</p>
    <div className="mt-5 grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-4 text-xs"><div><span className="text-slate-400">Project manager</span><strong className="mt-1 block text-slate-700">{item.project_manager_name || 'Assigned manager'}</strong></div><div><span className="text-slate-400">Priority</span><strong className="mt-1 block text-slate-700">{displayStatus(item.priority)}</strong></div><div><span className="text-slate-400">Start date</span><strong className="mt-1 block text-slate-700">{item.start_date || '—'}</strong></div><div><span className="text-slate-400">Deadline</span><strong className="mt-1 block text-slate-700">{item.deadline || '—'}</strong></div></div>
    {canManage && <div className="mt-4 flex gap-2"><button onClick={() => onEdit(item)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold hover:bg-slate-50">Edit project</button><button onClick={() => onDelete(item)} className="rounded-lg border border-red-100 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50">Delete project</button></div>}
    {user.role === 'CLIENT' && <p className="mt-4 text-xs text-slate-400">Project #{item.id}</p>}
  </article>)}<EmptyState show={!items.length} title="No projects yet" body="Projects available to your account will appear here." /></div>
}

function RequestsView({ items, role, onReview, onResubmit }) {
  return <div className="space-y-4">{items.map((item) => <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-blue-600">Request #{item.id} · {item.client_name || 'Your organization'}</p><h3 className="mt-1 text-lg font-bold">{item.name}</h3></div><StatusPill value={item.status} /></div><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">{item.description}</p>{item.requirements && <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-600"><strong>Requirements:</strong> {item.requirements}</p>}<div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-500"><span>Expected start: {item.expected_start_date}</span><span>Expected deadline: {item.expected_deadline}</span></div>{item.admin_feedback && <p className="mt-4 rounded-xl border border-amber-100 bg-amber-50 p-3 text-sm text-amber-800"><strong>Feedback:</strong> {item.admin_feedback}</p>}{role === 'ADMIN' && ['PENDING', 'NEEDS_INFORMATION'].includes(item.status) && <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4"><button onClick={() => onReview(item, 'APPROVED')} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white">Approve & create project</button><button onClick={() => onReview(item, 'NEEDS_INFORMATION')} className="rounded-lg border border-amber-200 px-3 py-2 text-xs font-semibold text-amber-800">Request more information</button><button onClick={() => onReview(item, 'REJECTED')} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700">Reject</button></div>}{role === 'CLIENT' && item.status === 'NEEDS_INFORMATION' && <button onClick={() => onResubmit(item)} className="mt-4 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white">Resubmit information</button>}</article>)}<EmptyState show={!items.length} title="No project requests" body={role === 'CLIENT' ? 'Submit a request to begin discussing a new project.' : 'There are no requests waiting for review.'} /></div>
}

function TasksView({ items, projects, user, onEdit, onDelete, onStatus }) {
  const mayManage = ['ADMIN', 'PROJECT_MANAGER'].includes(user.role)
  return <div className="space-y-3">{items.map((item) => <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex sm:items-center sm:gap-4">
    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><CheckCircle2 size={20} /></span>
    <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><Link to={`/tasks/${item.id}`} className="font-bold hover:text-blue-700">{item.title}</Link><StatusPill value={item.status} /><StatusPill value={item.priority} /></div><p className="mt-1 line-clamp-1 text-xs text-slate-500">{item.description || 'No description'} · {projects.find((project) => project.id === item.project)?.name || `Project #${item.project}`}</p><p className="mt-2 flex items-center gap-1 text-xs text-slate-400"><CalendarDays size={13} />Due {item.due_date || 'date not set'}</p></div>
    {!mayManage && user.role === 'EMPLOYEE' && <select aria-label={`Update status for ${item.title}`} value={item.status} onChange={(event) => onStatus(item, event.target.value)} className="mt-3 rounded-lg border border-slate-200 px-2 py-2 text-xs sm:mt-0">{(item.status === 'TODO' ? ['TODO', 'IN_PROGRESS'] : item.status === 'IN_PROGRESS' ? ['IN_PROGRESS', 'IN_REVIEW'] : [item.status]).map((status) => <option key={status} value={status}>{displayStatus(status)}</option>)}</select>}
    {mayManage && <div className="mt-3 flex gap-2 sm:mt-0"><button onClick={() => onEdit(item)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold">Edit</button><button onClick={() => onDelete(item)} className="rounded-lg border border-red-100 px-3 py-2 text-xs font-semibold text-red-600">Delete</button></div>}
  </article>)}<EmptyState show={!items.length} title="No tasks found" body="Tasks assigned to your workspace will show up here." /></div>
}

function TicketsView({ items, projects, role, onEdit, onDelete, onStatus, onComments }) {
  return <div className="grid gap-4 xl:grid-cols-2">{items.map((item) => <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-orange-50 text-orange-700"><Ticket size={19} /></span><div><p className="text-xs text-slate-400">Ticket #{item.id}</p><h3 className="font-bold">{item.title}</h3></div></div><StatusPill value={item.status} /></div><p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{item.description}</p><div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500"><span>{projects.find((project) => project.id === item.project)?.name || `Project #${item.project}`}</span><span>·</span><span>{displayStatus(item.priority)} priority</span>{item.deadline_at && <><span>·</span><span>Due {formatDate(item.deadline_at)}</span></>}</div><div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-4"><button onClick={() => onComments(item)} className="text-xs font-semibold text-blue-700 hover:underline">View discussion & attachments</button>{['ADMIN', 'PROJECT_MANAGER'].includes(role) && <div className="flex gap-2"><button onClick={() => onEdit(item)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold">Edit</button><button onClick={() => onDelete(item)} className="rounded-lg border border-red-100 px-3 py-2 text-xs font-semibold text-red-600">Delete</button></div>}{role === 'EMPLOYEE' && <select aria-label={`Update ticket ${item.id}`} value={item.status} onChange={(event) => onStatus(item, event.target.value)} className="rounded-lg border border-slate-200 px-2 py-2 text-xs">{statusOptions.tickets.map((status) => <option key={status} value={status}>{displayStatus(status)}</option>)}</select>}</div></article>)}<EmptyState show={!items.length} title="No support tickets" body="Support requests linked to your projects will appear here." /></div>
}

function NotificationsView({ items, onRead }) {
  return <div className="space-y-3">{items.map((item) => <article key={item.id} className={`flex gap-4 rounded-2xl border p-4 ${item.is_read ? 'border-slate-200 bg-white' : 'border-blue-100 bg-blue-50/60'}`}><span className={`mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-xl ${item.is_read ? 'bg-slate-100 text-slate-500' : 'bg-blue-100 text-blue-700'}`}><Bell size={17} /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{item.title}</h3><StatusPill value={item.notification_type} /></div><p className="mt-1 text-sm leading-6 text-slate-600">{item.message}</p><p className="mt-2 text-xs text-slate-400">{item.actor ? `From ${item.actor} · ` : ''}{formatDate(item.created_at)}</p></div>{!item.is_read && <button onClick={() => onRead(item)} className="self-start rounded-lg p-2 text-blue-700 hover:bg-blue-100" title="Mark as read"><Check size={17} /></button>}</article>)}<EmptyState show={!items.length} title="You're all caught up" body="New workspace updates will appear here." /></div>
}

function TimeView({ items, tasks, activeTimer, form, setForm, onStart, onStop }) {
  const availableTasks = tasks.filter((task, index, list) => list.findIndex((entry) => entry.id === task.id) === index)
  return <div className="space-y-5">
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Current session</p><h3 className="mt-1 text-lg font-bold">{activeTimer ? `Tracking task #${activeTimer.task}` : 'No timer running'}</h3><p className="mt-1 text-sm text-slate-500">{activeTimer ? `Started ${formatDate(activeTimer.start_time)}` : 'Choose a task to start recording time.'}</p></div>{activeTimer ? <button onClick={onStop} className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700">Stop timer</button> : <form onSubmit={onStart} className="flex flex-wrap gap-2"><select required value={form.task || ''} onChange={(event) => setForm((value) => ({ ...value, task: event.target.value }))} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm"><option value="">Select task</option>{availableTasks.map((task) => <option key={task.id} value={task.id}>{task.title || `Task #${task.id}`}</option>)}</select><input value={form.description || ''} onChange={(event) => setForm((value) => ({ ...value, description: event.target.value }))} placeholder="What are you working on?" className="w-52 rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /><button className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white">Start timer</button></form>}</div></section>
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 px-5 py-4"><h3 className="font-bold">Time history</h3></div>{items.length ? <div className="divide-y divide-slate-100">{items.map((item) => <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"><div><p className="font-semibold">Task #{item.task}</p><p className="mt-1 text-xs text-slate-500">{item.description || 'No description'} · {formatDate(item.start_time)}</p></div><div className="text-right"><p className="text-sm font-bold">{item.duration || (item.end_time ? 'Saved' : 'Running')}</p><p className="text-xs text-slate-400">{item.end_time ? 'Completed' : 'In progress'}</p></div></div>)}</div> : <EmptyState title="No time entries yet" body="Start a timer to record your first work session." />}</section>
  </div>
}

function ReportsView({ onDownload }) {
  return <div className="grid gap-4 md:grid-cols-2"><ReportCard title="Projects report" description="Export project names, clients, managers, priorities and delivery dates." onClick={() => onDownload('projects')} /><ReportCard title="Tasks report" description="Export task ownership, status, priority and due dates." onClick={() => onDownload('tasks')} /></div>
}

function ReportCard({ title, description, onClick }) {
  return <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><span className="grid h-12 w-12 place-items-center rounded-xl bg-blue-50 text-blue-700"><FileText size={22} /></span><h3 className="mt-4 text-lg font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{description}</p><button onClick={onClick} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"><Download size={16} />Download CSV</button></article>
}

function ActivityView({ items }) {
  return <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="divide-y divide-slate-100">{items.map((item) => <article key={item.id} className="flex gap-4 p-4 sm:p-5"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-violet-50 text-violet-700"><Activity size={18} /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><strong className="text-sm">{item.username || 'Workspace member'}</strong><StatusPill value={item.action} /><span className="text-xs text-slate-400">{item.model_name} #{item.object_id}</span></div><p className="mt-1 text-sm text-slate-600">{item.description}</p><p className="mt-2 text-xs text-slate-400">{formatDate(item.created_at)}</p></div></article>)}</div><EmptyState show={!items.length} title="No activity to show" body="Workspace activity will appear here as work changes." /></div>
}

function ResourceFields({ section, form, setForm, projects, clients, users, role, editing }) {
  const field = (name, label, type = 'text', options = null, required = false, hint = '') => <label key={name} className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-600">{label}{required && <span className="text-red-500"> *</span>}</span>{options ? <select required={required} value={form[name] ?? ''} disabled={editing && name === 'project'} onChange={(event) => setForm((value) => ({ ...value, [name]: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm disabled:bg-slate-100"><option value="">Select {label.toLowerCase()}</option>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select> : type === 'textarea' ? <textarea required={required} rows={3} value={form[name] ?? ''} onChange={(event) => setForm((value) => ({ ...value, [name]: event.target.value }))} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" /> : <input required={required} type={type} value={form[name] ?? ''} onChange={(event) => setForm((value) => ({ ...value, [name]: event.target.value }))} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm" />}{hint && <small className="mt-1 block text-xs text-slate-400">{hint}</small>}</label>
  const clientOptions = clients.filter((item) => item.is_active).map((item) => ({ value: item.id, label: item.name }))
  const projectOptions = projects.map((item) => ({ value: item.id, label: item.name }))
  const employeeOptions = users.filter((item) => ['EMPLOYEE', 'PROJECT_MANAGER'].includes(item.role) && item.is_active).map((item) => ({ value: item.id, label: `${item.first_name || item.username} · ${displayStatus(item.role)}` }))
  const statusFields = (key) => statusOptions[key].map((value) => ({ value, label: displayStatus(value) }))
  const priorityFields = priorityOptions.map((value) => ({ value, label: displayStatus(value) }))

  if (section === 'clients') return <div className="grid gap-3 sm:grid-cols-2">{field('name', 'Organization name', 'text', null, true)}{field('contact_person', 'Contact person')}{field('email', 'Email', 'email')}{field('phone', 'Phone')}{field('address', 'Address', 'textarea')}{field('description', 'Notes', 'textarea')}{editing && field('is_active', 'Account status', 'text', [{ value: true, label: 'Active' }, { value: false, label: 'Inactive' }])}</div>
  if (section === 'projects') return <div className="grid gap-3 sm:grid-cols-2">{field('name', 'Project name', 'text', null, true)}{field('client', 'Client', 'text', clientOptions, true)}{role === 'ADMIN' && field('project_manager', 'Project manager', 'text', users.filter((item) => item.role === 'PROJECT_MANAGER' && item.is_active).map((item) => ({ value: item.id, label: item.first_name ? `${item.first_name} ${item.last_name}` : item.username })), true)}{field('start_date', 'Start date', 'date', null, true)}{field('deadline', 'Deadline', 'date', null, true)}{field('status', 'Status', 'text', statusFields('projects'))}{field('priority', 'Priority', 'text', priorityFields)}<div className="sm:col-span-2">{field('description', 'Description', 'textarea')}</div></div>
  if (section === 'tasks') return <div className="grid gap-3 sm:grid-cols-2">{!editing && field('project', 'Project', 'text', projectOptions, true)}{field('title', 'Task title', 'text', null, true)}{field('due_date', 'Due date', 'date', null, true)}{field('status', 'Status', 'text', statusFields('tasks'))}{field('priority', 'Priority', 'text', priorityFields)}{role === 'ADMIN' && field('assigned_to', 'Employee (optional)', 'text', employeeOptions)}<div className="sm:col-span-2">{field('description', 'Description', 'textarea')}</div></div>
  if (section === 'tickets') return <div className="grid gap-3 sm:grid-cols-2">{!editing && field('project', 'Project', 'text', projectOptions, true)}{field('title', 'Ticket title', 'text', null, true)}{field('status', 'Status', 'text', statusFields('tickets'))}{field('priority', 'Priority', 'text', priorityFields)}{role === 'ADMIN' && field('assigned_to', 'Assign to (optional)', 'text', employeeOptions)}<div className="sm:col-span-2">{field('description', 'Description', 'textarea', null, true)}</div></div>
  if (section === 'requests') return <div className="grid gap-3 sm:grid-cols-2">{field('name', 'Project name', 'text', null, true)}{field('expected_start_date', 'Expected start', 'date', null, true)}{field('expected_deadline', 'Expected deadline', 'date', null, true)}<div className="sm:col-span-2">{field('description', 'Project overview', 'textarea', null, true)}{field('requirements', 'Requirements', 'textarea')}</div></div>
  return null
}

function StatusPill({ value }) {
  const normalized = value || 'UNKNOWN'
  const color = ['COMPLETED', 'RESOLVED', 'APPROVED', 'ACTIVE', 'LOW'].includes(normalized) ? 'bg-emerald-50 text-emerald-700' :
    ['IN_PROGRESS', 'PLANNING', 'PENDING', 'MEDIUM', 'PROJECT'].includes(normalized) ? 'bg-blue-50 text-blue-700' :
      ['URGENT', 'REJECTED', 'CANCELLED', 'INACTIVE'].includes(normalized) ? 'bg-red-50 text-red-700' :
        ['HIGH', 'NEEDS_INFORMATION', 'IN_REVIEW', 'ON_HOLD'].includes(normalized) ? 'bg-amber-50 text-amber-800' : 'bg-slate-100 text-slate-600'
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${color}`}>{displayStatus(normalized)}</span>
}

function EmptyState({ show, title, body }) {
  if (!show) return null
  return <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center"><span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-400"><BriefcaseBusiness size={21} /></span><h3 className="mt-4 font-bold">{title}</h3><p className="mt-1 text-sm text-slate-500">{body}</p></div>
}

function Modal({ title, subtitle, onClose, children }) {
  return <div className="fixed inset-0 z-[60] grid place-items-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}><section role="dialog" aria-modal="true" aria-label={title} className="my-8 w-full max-w-2xl rounded-2xl bg-white p-5 shadow-2xl sm:p-7"><div className="mb-5 flex items-start justify-between gap-4"><div><h2 className="text-xl font-bold">{title}</h2>{subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}</div><button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100" aria-label="Close dialog"><X size={19} /></button></div>{children}</section></div>
}

function LoadingState({ label }) {
  return <div className="flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white"><RefreshCw size={26} className="animate-spin text-blue-600" /><p className="mt-3 text-sm text-slate-500">{label}</p></div>
}

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString([], { dateStyle: 'medium', timeStyle: value.includes('T') ? 'short' : undefined })
}

export default Workspace
