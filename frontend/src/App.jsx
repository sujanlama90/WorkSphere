import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

import ProtectedRoute from './components/ProtectedRoute'
import PublicRoute from './components/PublicRoute'
import AdminRoute from './components/AdminRoute'
import AppShell from './components/AppShell'

const Landing = lazy(() => import('./pages/Landing'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Profile = lazy(() => import('./pages/Profile'))
const TaskDetail = lazy(() => import('./pages/tasks/TaskDetail'))
const ChangePassword = lazy(() => import('./pages/ChangePassword'))
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'))
const MyTasks = lazy(() => import('./pages/employee/MyTasks'))
const MyProjects = lazy(() => import('./pages/projects/MyProjects'))
const Workspace = lazy(() => import('./pages/Workspace'))

function App() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm font-medium text-slate-500">Loading WorkSphere...</div>}>
      <Routes>
        <Route path="/" element={<Landing />} />

        <Route element={<PublicRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/change-password" element={<ChangePassword />} />
            <Route path="/employee/my-tasks" element={<MyTasks />} />
            <Route path="/tasks/:id" element={<TaskDetail />} />
            <Route path="/manager/my-projects" element={<MyProjects />}/>
            <Route path="/workspace/:section" element={<Workspace />} />
            <Route element={<AdminRoute />}>
              <Route path="/admin/users" element={<AdminUsers />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

export default App
