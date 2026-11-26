
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    Search, Users, ShieldCheck, UserCheck,
    UserX, ChevronDown, X, Edit, RefreshCw,
    BriefcaseBusiness, Mail, CalendarDays,
    CheckCircle2, AlertCircle, Power, PowerOff
} from 'lucide-react'

import api from '../../api/axios'

const roles = [
    'ADMIN',
    'PROJECT_MANAGER',
    'EMPLOYEE',
    'CLIENT'
]

const roleLabels = {
    ADMIN: 'Admin',
    PROJECT_MANAGER: 'Project Manager',
    EMPLOYEE: 'Employee',
    CLIENT: 'Client'
}

const roleColors = {
    ADMIN: 'bg-purple-100 text-purple-700',
    PROJECT_MANAGER: 'bg-blue-100 text-blue-700',
    EMPLOYEE: 'bg-emerald-100 text-emerald-700',
    CLIENT: 'bg-amber-100 text-amber-700'
}

function AdminUsers() {
    const navigate = useNavigate()

    const [users, setUsers] = useState([])
    const [clients, setClients] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [roleFilter, setRoleFilter] = useState('ALL')
    const [statusFilter, setStatusFilter] = useState('ALL')

    // Role modal states
    const [selectedUser, setSelectedUser] = useState(null)
    const [selectedRole, setSelectedRole] = useState('')
    const [selectedClient, setSelectedClient] = useState('')
    const [saving, setSaving] = useState(false)
    const [modalError, setModalError] = useState('')

    // Account status modal states
    const [statusTarget, setStatusTarget] = useState(null)
    const [statusSaving, setStatusSaving] = useState(false)
    const [statusModalError, setStatusModalError] = useState('')

    // Notifications
    const [message, setMessage] = useState(null)
    const [error, setError] = useState('')

    // Fetch all users
    const fetchUsers = useCallback(async () => {
        setLoading(true)
        setError('')

        try {
            const [usersResponse, clientsResponse] = await Promise.all([
                api.get('auth/users/'),
                api.get('clients/clients/'),
            ])

            setUsers(usersResponse.data.results || usersResponse.data)
            setClients(clientsResponse.data.results || clientsResponse.data)

        } catch (err) {
            if (err.response?.status === 403) {
                navigate('/dashboard', { replace: true })
                return
            }

            setError('Unable to load users. Please try again.')

        } finally {
            setLoading(false)
        }
    }, [navigate])

    useEffect(() => {
        Promise.resolve().then(fetchUsers)
    }, [fetchUsers])

    // Search and filter users
    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            const keyword = search.toLowerCase()

            const matchesSearch =
                user.username?.toLowerCase().includes(keyword) ||
                user.email?.toLowerCase().includes(keyword) ||
                user.first_name?.toLowerCase().includes(keyword) ||
                user.last_name?.toLowerCase().includes(keyword)

            const matchesRole =
                roleFilter === 'ALL' || user.role === roleFilter

            const matchesStatus =
                statusFilter === 'ALL' ||
                (statusFilter === 'ACTIVE' && user.is_active) ||
                (statusFilter === 'INACTIVE' && !user.is_active)

            return matchesSearch && matchesRole && matchesStatus
        })
    }, [users, search, roleFilter, statusFilter])

    // Statistics
    const activeCount = users.filter(user => user.is_active).length
    const inactiveCount = users.length - activeCount
    const adminCount = users.filter(user => user.role === 'ADMIN').length

    // Open role modal
    const openRoleModal = user => {
        setSelectedUser(user)
        setSelectedRole(user.role)
        setSelectedClient(user.client ? String(user.client) : '')
        setMessage(null)
        setModalError('')
    }

    // Update user role
    const updateRole = async () => {
        if (!selectedUser || !selectedRole) return

        const clientUnchanged = selectedRole !== 'CLIENT' ||
            String(selectedClient) === String(selectedUser.client || '')
        if (selectedRole === selectedUser.role && clientUnchanged) {
            setSelectedUser(null)
            return
        }

        setSaving(true)
        setMessage(null)
        setModalError('')

        try {
            const payload = {
                role: selectedRole,
                client: selectedRole === 'CLIENT' && selectedClient
                    ? Number(selectedClient)
                    : null,
            }

            const response = await api.patch(
                `auth/users/${selectedUser.id}/`,
                payload
            )

            setUsers(previous =>
                previous.map(user =>
                    user.id === selectedUser.id
                        ? { ...user, ...response.data }
                        : user
                )
            )

            setSelectedUser(null)

            setMessage({
                type: 'success',
                text: `${selectedUser.username}'s role was updated successfully.`
            })

        } catch (err) {
            const data = err.response?.data

            const errorMessage =
                (typeof data?.detail === 'string' && data.detail) ||
                (typeof data === 'string' && data) ||
                data?.role?.[0] ||
                data?.client?.[0] ||
                data?.non_field_errors?.[0] ||
                'Unable to update role. Please try again.'

            setModalError(errorMessage)

        } finally {
            setSaving(false)
        }
    }

    // Open account status confirmation modal
    const openStatusModal = user => {
        setStatusTarget(user)
        setStatusModalError('')
        setMessage(null)
    }

    // Activate or deactivate user
    const updateUserStatus = async () => {
        if (!statusTarget) return

        setStatusSaving(true)
        setStatusModalError('')
        setMessage(null)

        const newStatus = !statusTarget.is_active

        try {
            const response = await api.patch(
                `auth/users/${statusTarget.id}/`,
                {
                    is_active: newStatus
                }
            )

            setUsers(previous =>
                previous.map(user =>
                    user.id === statusTarget.id
                        ? { ...user, ...response.data }
                        : user
                )
            )

            setStatusTarget(null)

            setMessage({
                type: 'success',
                text: `${statusTarget.username}'s account has been ${
                    newStatus ? 'activated' : 'deactivated'
                } successfully.`
            })

        } catch (err) {
            const data = err.response?.data

            const errorMessage =
                (typeof data?.detail === 'string' && data.detail) ||
                (typeof data === 'string' && data) ||
                data?.is_active?.[0] ||
                data?.non_field_errors?.[0] ||
                'Unable to update account status. Please try again.'

            setStatusModalError(errorMessage)

        } finally {
            setStatusSaving(false)
        }
    }

    // Format date
    const formatDate = date => {
        if (!date) return '—'

        return new Date(date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        })
    }

    return (
        <div className="min-h-screen bg-slate-50">

            {/* Header */}
            <header className="border-b border-slate-200 bg-white px-5 py-6 sm:px-8">
                <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">

                    <div>
                        <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
                            <BriefcaseBusiness size={16} />
                            WorkSphere
                            <span>/</span>
                            Administration
                        </div>

                        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                            User Management
                        </h1>

                        <p className="mt-1 text-sm text-slate-500">
                            Manage users, roles and account access.
                        </p>
                    </div>

                    <button
                        onClick={fetchUsers}
                        disabled={loading}
                        className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
                    >
                        <RefreshCw
                            size={17}
                            className={loading ? 'animate-spin' : ''}
                        />
                        Refresh
                    </button>

                </div>
            </header>

            <main className="mx-auto max-w-7xl space-y-7 p-5 sm:p-8">

                {/* Notification */}
                {message && (
                    <div className={`flex items-center justify-between rounded-xl border p-4 ${
                        message.type === 'success'
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            : 'border-red-200 bg-red-50 text-red-700'
                    }`}>
                        <div className="flex items-center gap-2 text-sm font-medium">
                            {message.type === 'success'
                                ? <CheckCircle2 size={19} />
                                : <AlertCircle size={19} />
                            }

                            {message.text}
                        </div>

                        <button onClick={() => setMessage(null)}>
                            <X size={18} />
                        </button>
                    </div>
                )}

                {/* Statistics */}
                <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">

                    <StatCard
                        title="Total Users"
                        value={users.length}
                        icon={Users}
                        color="blue"
                    />

                    <StatCard
                        title="Active Users"
                        value={activeCount}
                        icon={UserCheck}
                        color="emerald"
                    />

                    <StatCard
                        title="Inactive Users"
                        value={inactiveCount}
                        icon={UserX}
                        color="red"
                    />

                    <StatCard
                        title="Administrators"
                        value={adminCount}
                        icon={ShieldCheck}
                        color="purple"
                    />

                </section>

                {/* User Table */}
                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                    <div className="border-b border-slate-200 p-5 sm:p-6">

                        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <h2 className="text-lg font-bold text-slate-900">
                                    All Users
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    {filteredUsers.length} users found
                                </p>
                            </div>

                            <span className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                                Admin Access
                            </span>
                        </div>

                        {/* Filters */}
                        <div className="grid gap-3 md:grid-cols-3">

                            <div className="relative md:col-span-1">
                                <Search
                                    size={18}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                />

                                <input
                                    type="text"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder="Search name, email or username..."
                                    className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                                />
                            </div>

                            <select
                                value={roleFilter}
                                onChange={e => setRoleFilter(e.target.value)}
                                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-blue-500"
                            >
                                <option value="ALL">All Roles</option>

                                {roles.map(role => (
                                    <option key={role} value={role}>
                                        {roleLabels[role]}
                                    </option>
                                ))}
                            </select>

                            <select
                                value={statusFilter}
                                onChange={e => setStatusFilter(e.target.value)}
                                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-blue-500"
                            >
                                <option value="ALL">All Status</option>
                                <option value="ACTIVE">Active</option>
                                <option value="INACTIVE">Inactive</option>
                            </select>

                        </div>
                    </div>

                    {/* Loading */}
                    {loading && (
                        <div className="flex justify-center py-20">
                            <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
                        </div>
                    )}

                    {/* Error */}
                    {!loading && error && (
                        <div className="p-10 text-center">
                            <AlertCircle
                                className="mx-auto text-red-500"
                                size={35}
                            />

                            <p className="mt-3 text-sm text-red-600">
                                {error}
                            </p>

                            <button
                                onClick={fetchUsers}
                                className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
                            >
                                Try Again
                            </button>
                        </div>
                    )}

                    {/* Empty */}
                    {!loading && !error && filteredUsers.length === 0 && (
                        <div className="py-20 text-center">
                            <Users
                                className="mx-auto text-slate-300"
                                size={42}
                            />

                            <h3 className="mt-4 font-semibold text-slate-800">
                                No users found
                            </h3>

                            <p className="mt-1 text-sm text-slate-500">
                                Try changing your search or filters.
                            </p>
                        </div>
                    )}

                    {/* Table */}
                    {!loading && !error && filteredUsers.length > 0 && (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1050px] text-left">

                                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                                    <tr>
                                        <th className="px-6 py-4 font-semibold">User</th>
                                        <th className="px-6 py-4 font-semibold">Role</th>
                                        <th className="px-6 py-4 font-semibold">Status</th>
                                        <th className="px-6 py-4 font-semibold">Joined</th>
                                        <th className="px-6 py-4 text-right font-semibold">Actions</th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-100">

                                    {filteredUsers.map(user => (
                                        <tr
                                            key={user.id}
                                            className="transition hover:bg-slate-50"
                                        >

                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">

                                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
                                                        {user.username?.charAt(0)?.toUpperCase()}
                                                    </div>

                                                    <div>
                                                        <p className="font-semibold text-slate-900">
                                                            {user.first_name || user.username} {user.last_name}
                                                        </p>

                                                        <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                                                            <Mail size={13} />
                                                            {user.email}
                                                        </p>

                                                        <p className="mt-1 text-xs text-slate-400">
                                                            @{user.username}
                                                        </p>
                                                    </div>

                                                </div>
                                            </td>

                                            <td className="px-6 py-4">
                                                <span className={`inline-flex rounded-lg px-3 py-1.5 text-xs font-semibold ${roleColors[user.role] || 'bg-slate-100 text-slate-700'}`}>
                                                    {roleLabels[user.role] || user.role}
                                                </span>
                                            </td>

                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                                                    user.is_active
                                                        ? 'text-emerald-700'
                                                        : 'text-red-600'
                                                }`}>
                                                    <span className={`h-2 w-2 rounded-full ${
                                                        user.is_active
                                                            ? 'bg-emerald-500'
                                                            : 'bg-red-500'
                                                    }`} />

                                                    {user.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>

                                            <td className="px-6 py-4">
                                                <span className="flex items-center gap-2 text-sm text-slate-500">
                                                    <CalendarDays size={15} />
                                                    {formatDate(user.date_joined)}
                                                </span>
                                            </td>

                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-2">

                                                    <button
                                                        onClick={() => openRoleModal(user)}
                                                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                                                    >
                                                        <Edit size={14} />
                                                        Role
                                                    </button>

                                                    <button
                                                        onClick={() => openStatusModal(user)}
                                                        className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                                                            user.is_active
                                                                ? 'border-red-200 text-red-600 hover:bg-red-50'
                                                                : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                                                        }`}
                                                    >
                                                        {user.is_active
                                                            ? <PowerOff size={14} />
                                                            : <Power size={14} />
                                                        }

                                                        {user.is_active ? 'Deactivate' : 'Activate'}
                                                    </button>

                                                </div>
                                            </td>

                                        </tr>
                                    ))}

                                </tbody>

                            </table>
                        </div>
                    )}

                    <div className="border-t border-slate-200 bg-slate-50 px-6 py-4">
                        <p className="text-xs text-slate-500">
                            Showing {filteredUsers.length} of {users.length} users
                        </p>
                    </div>

                </section>

            </main>

            {/* Change Role Modal */}
            {selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">

                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">

                        <div className="mb-6 flex items-start justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">
                                    Change User Role
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    Update this user's access level.
                                </p>
                            </div>

                            <button
                                onClick={() => {
                                    setSelectedUser(null)
                                    setModalError('')
                                }}
                                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="mb-5 flex items-center gap-3 rounded-xl bg-slate-50 p-4">
                            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
                                {selectedUser.username?.charAt(0)?.toUpperCase()}
                            </div>

                            <div>
                                <p className="font-semibold text-slate-900">
                                    {selectedUser.first_name || selectedUser.username}
                                </p>

                                <p className="text-xs text-slate-500">
                                    {selectedUser.email}
                                </p>
                            </div>
                        </div>

                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                            Select New Role
                        </label>

                        <div className="relative">
                            <select
                                value={selectedRole}
                                onChange={e => {
                                    setSelectedRole(e.target.value)
                                    if (e.target.value !== 'CLIENT') setSelectedClient('')
                                    setModalError('')
                                }}
                                className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 pr-10 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                            >
                                {roles.map(role => (
                                    <option key={role} value={role}>
                                        {roleLabels[role]}
                                    </option>
                                ))}
                            </select>

                            <ChevronDown
                                size={18}
                                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                            />
                        </div>

                        {selectedRole === 'CLIENT' && (
                            <label className="mt-5 block">
                                <span className="mb-2 block text-sm font-semibold text-slate-700">
                                    Client organization
                                </span>
                                <select
                                    required
                                    value={selectedClient}
                                    onChange={e => {
                                        setSelectedClient(e.target.value)
                                        setModalError('')
                                    }}
                                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                                >
                                    <option value="">Select a client organization</option>
                                    {clients.filter(client => client.is_active).map(client => (
                                        <option key={client.id} value={client.id}>
                                            {client.name}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        )}

                        {/* Role Error */}
                        {modalError && (
                            <div className="mt-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
                                <AlertCircle
                                    size={20}
                                    className="mt-0.5 shrink-0"
                                />

                                <div>
                                    <p className="text-sm font-bold">
                                        Permission Denied
                                    </p>

                                    <p className="mt-1 text-sm">
                                        {modalError}
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
                            <p className="text-xs leading-5 text-amber-800">
                                Changing a user's role changes their application access and dashboard permissions.
                            </p>
                        </div>

                        <div className="mt-7 flex gap-3">

                            <button
                                onClick={() => {
                                    setSelectedUser(null)
                                    setModalError('')
                                }}
                                disabled={saving}
                                className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={updateRole}
                                disabled={saving || (
                                    selectedRole === selectedUser.role &&
                                    (selectedRole !== 'CLIENT' || String(selectedClient) === String(selectedUser.client || ''))
                                )}
                                className="flex-1 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {saving ? 'Updating...' : 'Save Changes'}
                            </button>

                        </div>

                    </div>

                </div>
            )}

            {/* Activate / Deactivate Confirmation Modal */}
            {statusTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">

                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">

                        <div className="mb-5 flex items-start justify-between">

                            <div>
                                <h2 className="text-xl font-bold text-slate-900">
                                    {statusTarget.is_active
                                        ? 'Deactivate Account'
                                        : 'Activate Account'
                                    }
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    Confirm this account status change.
                                </p>
                            </div>

                            <button
                                onClick={() => {
                                    setStatusTarget(null)
                                    setStatusModalError('')
                                }}
                                disabled={statusSaving}
                                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                            >
                                <X size={20} />
                            </button>

                        </div>

                        <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4">

                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-700">
                                {statusTarget.username?.charAt(0)?.toUpperCase()}
                            </div>

                            <div>
                                <p className="font-semibold text-slate-900">
                                    {statusTarget.first_name || statusTarget.username}
                                </p>

                                <p className="text-xs text-slate-500">
                                    {statusTarget.email}
                                </p>

                                <p className="mt-1 text-xs font-semibold text-slate-600">
                                    {roleLabels[statusTarget.role]}
                                </p>
                            </div>

                        </div>

                        <div className={`mt-5 rounded-xl border p-4 ${
                            statusTarget.is_active
                                ? 'border-red-200 bg-red-50'
                                : 'border-emerald-200 bg-emerald-50'
                        }`}>
                            <div className="flex items-start gap-3">

                                {statusTarget.is_active
                                    ? <AlertCircle size={20} className="shrink-0 text-red-600" />
                                    : <CheckCircle2 size={20} className="shrink-0 text-emerald-600" />
                                }

                                <p className={`text-sm leading-6 ${
                                    statusTarget.is_active
                                        ? 'text-red-700'
                                        : 'text-emerald-700'
                                }`}>
                                    {statusTarget.is_active
                                        ? 'This user will no longer be able to log in while their account is inactive.'
                                        : 'This user will be able to log in and access the application again.'
                                    }
                                </p>

                            </div>
                        </div>

                        {/* Status Error */}
                        {statusModalError && (
                            <div className="mt-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">

                                <AlertCircle
                                    size={20}
                                    className="mt-0.5 shrink-0"
                                />

                                <div>
                                    <p className="text-sm font-bold">
                                        Unable to Update Account
                                    </p>

                                    <p className="mt-1 text-sm">
                                        {statusModalError}
                                    </p>
                                </div>

                            </div>
                        )}

                        <div className="mt-7 flex gap-3">

                            <button
                                onClick={() => {
                                    setStatusTarget(null)
                                    setStatusModalError('')
                                }}
                                disabled={statusSaving}
                                className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={updateUserStatus}
                                disabled={statusSaving}
                                className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-lg transition disabled:cursor-not-allowed disabled:opacity-50 ${
                                    statusTarget.is_active
                                        ? 'bg-red-600 shadow-red-600/20 hover:bg-red-700'
                                        : 'bg-emerald-600 shadow-emerald-600/20 hover:bg-emerald-700'
                                }`}
                            >
                                {statusSaving
                                    ? 'Updating...'
                                    : statusTarget.is_active
                                        ? 'Yes, Deactivate'
                                        : 'Yes, Activate'
                                }
                            </button>

                        </div>

                    </div>

                </div>
            )}

        </div>
    )
}

// Statistics Card
function StatCard({ title, value, icon: Icon, color }) {
    const colors = {
        blue: 'bg-blue-50 text-blue-600',
        emerald: 'bg-emerald-50 text-emerald-600',
        red: 'bg-red-50 text-red-600',
        purple: 'bg-purple-50 text-purple-600'
    }

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">

            <div className="flex items-center justify-between">

                <div>
                    <p className="text-sm font-medium text-slate-500">
                        {title}
                    </p>

                    <h3 className="mt-2 text-3xl font-bold text-slate-900">
                        {value}
                    </h3>
                </div>

                <div className={`rounded-xl p-3 ${colors[color]}`}>
                    <Icon size={24} />
                </div>

            </div>

        </div>
    )
}

export default AdminUsers
