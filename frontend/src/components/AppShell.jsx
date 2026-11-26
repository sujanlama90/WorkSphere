import { useEffect, useMemo, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Activity,
  Bell,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  FileText,
  FolderKanban,
  LayoutDashboard,
  LifeBuoy,
  LockKeyhole,
  LogOut,
  Menu,
  Ticket,
  UserCircle,
  Users,
  X,
} from 'lucide-react'
import api from '../api/axios'

const navigation = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'PROJECT_MANAGER', 'EMPLOYEE', 'CLIENT'] },
  { label: 'Clients', path: '/workspace/clients', icon: Users, roles: ['ADMIN', 'PROJECT_MANAGER'] },
  { label: 'Projects', path: '/workspace/projects', icon: FolderKanban, roles: ['ADMIN', 'PROJECT_MANAGER', 'EMPLOYEE', 'CLIENT'] },
  { label: 'Project requests', path: '/workspace/requests', icon: FileText, roles: ['ADMIN', 'CLIENT'] },
  { label: 'Tasks', path: '/workspace/tasks', icon: CheckCircle2, roles: ['ADMIN', 'PROJECT_MANAGER', 'EMPLOYEE', 'CLIENT'] },
  { label: 'Support tickets', path: '/workspace/tickets', icon: Ticket, roles: ['ADMIN', 'PROJECT_MANAGER', 'EMPLOYEE', 'CLIENT'] },
  { label: 'Notifications', path: '/workspace/notifications', icon: Bell, roles: ['ADMIN', 'PROJECT_MANAGER', 'EMPLOYEE', 'CLIENT'] },
  { label: 'Time tracking', path: '/workspace/time', icon: Clock3, roles: ['ADMIN', 'PROJECT_MANAGER', 'EMPLOYEE'] },
  { label: 'Reports', path: '/workspace/reports', icon: FileText, roles: ['ADMIN', 'PROJECT_MANAGER'] },
  { label: 'Activity log', path: '/workspace/activity', icon: Activity, roles: ['ADMIN', 'PROJECT_MANAGER', 'EMPLOYEE', 'CLIENT'] },
]

const pageTitles = {
  '/profile': 'My Profile',
  '/change-password': 'Change Password',
  '/employee/my-tasks': 'My Tasks',
  '/manager/my-projects': 'My Projects',
  '/admin/users': 'User Management',
}

function AppShell() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const hasOwnLayout = pathname === '/dashboard' || pathname.startsWith('/workspace/')
  const menuItems = useMemo(
    () => navigation.filter((item) => item.roles.includes(user?.role)),
    [user],
  )

  useEffect(() => {
    if (hasOwnLayout) return undefined

    let active = true
    api.get('auth/profile/')
      .then((response) => {
        if (active) setUser(response.data)
      })
      .catch(() => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        if (active) navigate('/login', { replace: true })
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => { active = false }
  }, [hasOwnLayout, navigate])

  const signOut = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    navigate('/login', { replace: true })
  }

  if (hasOwnLayout) return <Outlet />

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="mt-3 text-sm text-slate-500">Loading your workspace...</p>
        </div>
      </div>
    )
  }

  const title = pageTitles[pathname] || 'Workspace'

  return (
    <div className="min-h-screen bg-slate-50">
      {sidebarOpen && (
        <button
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden"
        />
      )}

      <aside className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-slate-950 text-white transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-[76px] items-center justify-between border-b border-white/10 px-6">
          <NavLink to="/dashboard" className="flex items-center gap-3" onClick={() => setSidebarOpen(false)}>
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600">
              <BriefcaseBusiness size={21} />
            </span>
            <span>
              <strong className="block leading-tight">WorkSphere</strong>
              <small className="text-xs text-slate-400">Team workspace</small>
            </span>
          </NavLink>
          <button onClick={() => setSidebarOpen(false)} className="text-slate-400 lg:hidden" aria-label="Close menu">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-6">
          <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-[.18em] text-slate-500">Main menu</p>
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}
              >
                <Icon size={18} />
                {item.label}
              </NavLink>
            )
          })}

          {user.role === 'ADMIN' && (
            <NavLink
              to="/admin/users"
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}
            >
              <Users size={18} />
              User management
            </NavLink>
          )}

          <div className="my-6 border-t border-white/10" />
          <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-[.18em] text-slate-500">Account</p>
          <NavLink to="/profile" onClick={() => setSidebarOpen(false)} className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}>
            <UserCircle size={18} />
            My Profile
          </NavLink>
          <NavLink to="/change-password" onClick={() => setSidebarOpen(false)} className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}>
            <LockKeyhole size={18} />
            Change Password
          </NavLink>
          <NavLink to="/workspace/activity" onClick={() => setSidebarOpen(false)} className="nav-item">
            <LifeBuoy size={18} />
            Help & activity
          </NavLink>
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-blue-500 font-bold">
              {(user.first_name || user.username || 'U')[0].toUpperCase()}
            </span>
            <span className="min-w-0 flex-1">
              <strong className="block truncate text-sm">{user.first_name || user.username}</strong>
              <small className="block truncate text-xs text-slate-400">{user.role?.replaceAll('_', ' ')}</small>
            </span>
            <button onClick={signOut} className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white" title="Sign out">
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>

      <div className="min-h-screen lg:pl-72">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/95 px-5 backdrop-blur sm:px-8">
          <button onClick={() => setSidebarOpen(true)} className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden" aria-label="Open main menu">
            <Menu size={21} />
          </button>
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-slate-400">WORKSPACE / {title.toUpperCase()}</p>
            <h1 className="truncate text-base font-bold text-slate-900">{title}</h1>
          </div>
          <span className="ml-auto hidden text-sm text-slate-500 sm:block">
            {user.first_name || user.username}
          </span>
        </header>
        <Outlet />
      </div>
    </div>
  )
}

export default AppShell
