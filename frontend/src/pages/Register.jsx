
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  BriefcaseBusiness,
  Mail,
  Phone,
  User,
  LockKeyhole,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react'
import api from '../api/axios'

function Register() {
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    username: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    confirm_password: '',
  })

  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    setErrors((prev) => ({
      ...prev,
      [name]: null,
      general: null,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    setErrors({})
    setSuccess('')
    setLoading(true)

    try {
      const response = await api.post(
        'auth/register/',
        formData
      )

      setSuccess('Account created successfully! Redirecting to login...')

      console.log('Registration Response:', response.data)

      setTimeout(() => {
        navigate('/login', { replace: true })
      }, 1500)

    } catch (error) {
      if (error.response?.data) {
        setErrors(error.response.data)
      } else {
        setErrors({
          general: 'Unable to connect to server. Please try again.',
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const getError = (field) => {
    const error = errors[field]

    if (!error) return null

    return Array.isArray(error) ? error[0] : error
  }

  const inputClass =
    'w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10'

  const iconInputClass =
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

          <div className="relative z-10 my-16">
            <span className="rounded-full border border-blue-300/30 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-blue-100">
              Your Workspace Starts Here
            </span>

            <h1 className="mt-8 text-4xl font-extrabold leading-tight xl:text-5xl">
              Bring your team together.
              <span className="mt-2 block text-blue-300">
                Achieve more.
              </span>
            </h1>

            <p className="mt-6 max-w-md text-base leading-8 text-blue-100/80">
              Create your WorkSphere account and manage projects,
              organize tasks and collaborate with your team
              from one powerful workspace.
            </p>

            <div className="mt-10 space-y-5">

              {[
                'Manage projects and tasks easily',
                'Collaborate with your team',
                'Track progress and productivity',
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <CheckCircle2
                    size={20}
                    className="shrink-0 text-emerald-300"
                  />
                  <span className="text-sm font-medium text-blue-50">
                    {item}
                  </span>
                </div>
              ))}

            </div>
          </div>

          <div className="relative z-10 border-t border-white/15 pt-6">
            <p className="text-sm text-blue-100/60">
              © {new Date().getFullYear()} WorkSphere. All rights reserved.
            </p>
          </div>

        </div>

        {/* Right Side - Registration Form */}
        <div className="px-6 py-10 sm:px-10 lg:px-12 lg:py-12">

          {/* Mobile Logo */}
          <div className="mb-8 flex justify-center lg:hidden">
            <Link to="/" className="flex items-center gap-3">
              <div className="rounded-xl bg-blue-600 p-3 text-white shadow-lg shadow-blue-600/20">
                <BriefcaseBusiness size={25} />
              </div>

              <span className="text-2xl font-extrabold text-slate-900">
                Work<span className="text-blue-600">Sphere</span>
              </span>
            </Link>
          </div>

          <div className="mb-8">
            <p className="text-sm font-bold uppercase tracking-widest text-blue-600">
              Get Started
            </p>

            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">
              Create your account
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              Join WorkSphere and take control of your projects
              and team collaboration.
            </p>
          </div>

          {/* Success Message */}
          {success && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
              <CheckCircle2 size={20} className="shrink-0" />
              <p>{success}</p>
            </div>
          )}

          {/* General Error */}
          {errors.general && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
              {getError('general')}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* First Name & Last Name */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  First Name
                </label>

                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  placeholder="First name"
                  className={inputClass}
                  autoComplete="given-name"
                  required
                />

                {getError('first_name') && (
                  <p className="mt-1.5 text-xs text-red-500">
                    {getError('first_name')}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Last Name
                </label>

                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  placeholder="Last name"
                  className={inputClass}
                  autoComplete="family-name"
                  required
                />

                {getError('last_name') && (
                  <p className="mt-1.5 text-xs text-red-500">
                    {getError('last_name')}
                  </p>
                )}
              </div>

            </div>

            {/* Username */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Username
              </label>

              <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 px-4 transition focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/10">
                <User size={18} className="shrink-0 text-slate-400" />

                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Choose a username"
                  className={iconInputClass}
                  autoComplete="username"
                  required
                />
              </div>

              {getError('username') && (
                <p className="mt-1.5 text-xs text-red-500">
                  {getError('username')}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Email Address
              </label>

              <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 px-4 transition focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/10">
                <Mail size={18} className="shrink-0 text-slate-400" />

                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  className={iconInputClass}
                  autoComplete="email"
                  required
                />
              </div>

              {getError('email') && (
                <p className="mt-1.5 text-xs text-red-500">
                  {getError('email')}
                </p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Phone Number
              </label>

              <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 px-4 transition focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/10">
                <Phone size={18} className="shrink-0 text-slate-400" />

                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter phone number"
                  className={iconInputClass}
                  autoComplete="tel"
                  required
                />
              </div>

              {getError('phone') && (
                <p className="mt-1.5 text-xs text-red-500">
                  {getError('phone')}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Password
              </label>

              <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 px-4 transition focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/10">
                <LockKeyhole size={18} className="shrink-0 text-slate-400" />

                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a password"
                  className={iconInputClass}
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </div>

              {getError('password') && (
                <p className="mt-1.5 text-xs text-red-500">
                  {getError('password')}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Confirm Password
              </label>

              <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 px-4 transition focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/10">
                <LockKeyhole size={18} className="shrink-0 text-slate-400" />

                <input
                  type="password"
                  name="confirm_password"
                  value={formData.confirm_password}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  className={iconInputClass}
                  autoComplete="new-password"
                  required
                />
              </div>

              {getError('confirm_password') && (
                <p className="mt-1.5 text-xs text-red-500">
                  {getError('confirm_password')}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
            >
              {loading ? (
                <>
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Creating Account...
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight size={18} />
                </>
              )}
            </button>

          </form>

          {/* Login Link */}
          <div className="mt-8 border-t border-slate-100 pt-6 text-center">
            <p className="text-sm text-slate-500">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-bold text-blue-600 transition hover:text-blue-700 hover:underline"
              >
                Sign In
              </Link>
            </p>
          </div>

          <p className="mt-5 text-center text-xs text-slate-400">
            By creating an account, you agree to use WorkSphere responsibly.
          </p>

        </div>
      </div>
    </div>
  )
}

export default Register
