
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
    Eye,
    EyeOff,
    BriefcaseBusiness,
    User,
    LockKeyhole,
    ArrowRight,
    CheckCircle2,
    ShieldCheck,
} from 'lucide-react'
import api from '../api/axios'

function Login() {
    const navigate = useNavigate()

    const [formData, setFormData] = useState({
        username: '',
        password: '',
    })

    const [showPassword, setShowPassword] = useState(false)
    const [errors, setErrors] = useState({})
    const [loading, setLoading] = useState(false)

    const handleChange = (e) => {
        const { name, value } = e.target

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }))

        setErrors((prev) => ({
            ...prev,
            general: null,
        }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        setErrors({})
        setLoading(true)

        try {
            const response = await api.post('auth/login/', formData)

            const { access, refresh } = response.data

            localStorage.setItem('access_token', access)
            localStorage.setItem('refresh_token', refresh)

            navigate('/dashboard', { replace: true })

        } catch (error) {
            setErrors({
                general:
                    error.response?.data?.detail ||
                    'Invalid username or password. Please try again.',
            })
        } finally {
            setLoading(false)
        }
    }

    const inputClass =
        'w-full bg-transparent py-3 pl-3 pr-4 text-sm text-slate-800 outline-none placeholder:text-slate-400'

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-12">

            {/* Background Decorations */}
            <div className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl" />

            <div className="relative z-10 grid w-full max-w-6xl overflow-hidden rounded-3xl border border-white/10 bg-white shadow-2xl lg:grid-cols-2">

                {/* Left Side - Branding */}
                <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-950 p-12 text-white lg:flex">

                    <div className="absolute -right-20 top-20 h-72 w-72 rounded-full border border-white/10" />
                    <div className="absolute -right-10 top-32 h-52 w-52 rounded-full border border-white/10" />
                    <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-blue-400/10 blur-2xl" />

                    {/* Logo */}
                    <div className="relative z-10">
                        <Link to="/" className="inline-flex items-center gap-3">
                            <div className="rounded-xl bg-white/15 p-3 backdrop-blur-sm">
                                <BriefcaseBusiness size={26} />
                            </div>

                            <span className="text-2xl font-extrabold tracking-tight">
                                WorkSphere
                            </span>
                        </Link>
                    </div>

                    {/* Branding Content */}
                    <div className="relative z-10 my-16">

                        <span className="rounded-full border border-blue-300/30 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-blue-100">
                            Welcome Back
                        </span>

                        <h1 className="mt-8 text-4xl font-extrabold leading-tight xl:text-5xl">
                            Your workspace.
                            <span className="mt-2 block text-blue-300">
                                Your productivity.
                            </span>
                        </h1>

                        <p className="mt-6 max-w-md text-base leading-8 text-blue-100/80">
                            Sign in to WorkSphere and continue managing your
                            projects, collaborating with your team and
                            achieving your goals.
                        </p>

                        <div className="mt-10 space-y-5">

                            <div className="flex items-center gap-3">
                                <CheckCircle2
                                    size={20}
                                    className="shrink-0 text-emerald-300"
                                />
                                <span className="text-sm font-medium text-blue-50">
                                    Everything organized in one place
                                </span>
                            </div>

                            <div className="flex items-center gap-3">
                                <CheckCircle2
                                    size={20}
                                    className="shrink-0 text-emerald-300"
                                />
                                <span className="text-sm font-medium text-blue-50">
                                    Collaborate with your team
                                </span>
                            </div>

                            <div className="flex items-center gap-3">
                                <CheckCircle2
                                    size={20}
                                    className="shrink-0 text-emerald-300"
                                />
                                <span className="text-sm font-medium text-blue-50">
                                    Track projects and productivity
                                </span>
                            </div>

                        </div>
                    </div>

                    {/* Footer */}
                    <div className="relative z-10 border-t border-white/15 pt-6">
                        <p className="text-sm text-blue-100/60">
                            © {new Date().getFullYear()} WorkSphere. All rights reserved.
                        </p>
                    </div>

                </div>

                {/* Right Side - Login Form */}
                <div className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-14">

                    {/* Mobile Logo */}
                    <div className="mb-10 flex justify-center lg:hidden">
                        <Link to="/" className="flex items-center gap-3">
                            <div className="rounded-xl bg-blue-600 p-3 text-white shadow-lg shadow-blue-600/20">
                                <BriefcaseBusiness size={25} />
                            </div>

                            <span className="text-2xl font-extrabold text-slate-900">
                                Work<span className="text-blue-600">Sphere</span>
                            </span>
                        </Link>
                    </div>

                    {/* Heading */}
                    <div className="mb-9">

                        <p className="text-sm font-bold uppercase tracking-widest text-blue-600">
                            Account Access
                        </p>

                        <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">
                            Welcome back!
                        </h2>

                        <p className="mt-3 text-sm leading-6 text-slate-500">
                            Enter your credentials to access your WorkSphere account.
                        </p>

                    </div>

                    {/* Error Message */}
                    {errors.general && (
                        <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                            <ShieldCheck size={20} className="shrink-0" />
                            <p>{errors.general}</p>
                        </div>
                    )}

                    {/* Login Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* Username */}
                        <div>

                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Username
                            </label>

                            <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 px-4 transition focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/10">

                                <User size={19} className="shrink-0 text-slate-400" />

                                <input
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    placeholder="Enter your username"
                                    className={inputClass}
                                    autoComplete="username"
                                    required
                                />

                            </div>

                        </div>

                        {/* Password */}
                        <div>

                            <div className="mb-2 flex items-center justify-between">
                                <label className="text-sm font-semibold text-slate-700">
                                    Password
                                </label>
                            </div>

                            <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 px-4 transition focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/10">

                                <LockKeyhole
                                    size={19}
                                    className="shrink-0 text-slate-400"
                                />

                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Enter your password"
                                    className={inputClass}
                                    autoComplete="current-password"
                                    required
                                />

                                <button
                                    type="button"
                                    onClick={() => setShowPassword((prev) => !prev)}
                                    className="shrink-0 text-slate-400 transition hover:text-blue-600"
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? (
                                        <EyeOff size={20} />
                                    ) : (
                                        <Eye size={20} />
                                    )}
                                </button>

                            </div>

                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                        >
                            {loading ? (
                                <>
                                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                    Signing In...
                                </>
                            ) : (
                                <>
                                    Sign In to WorkSphere
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>

                    </form>

                    {/* Register Link */}
                    <div className="mt-9 border-t border-slate-100 pt-7 text-center">

                        <p className="text-sm text-slate-500">
                            Don't have an account?{' '}
                            <Link
                                to="/register"
                                className="font-bold text-blue-600 transition hover:text-blue-700 hover:underline"
                            >
                                Create Account
                            </Link>
                        </p>

                    </div>

                    {/* Security Note */}
                    <div className="mt-7 flex items-center justify-center gap-2 text-xs text-slate-400">
                        <ShieldCheck size={16} />
                        Secure access to your WorkSphere workspace
                    </div>

                </div>
            </div>
        </div>
    )
}

export default Login
