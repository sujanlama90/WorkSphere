import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
    BriefcaseBusiness,
    Mail,
    LockKeyhole,
    Eye,
    EyeOff,
} from 'lucide-react'

function Login() {
    const [showPassword, setShowPassword] = useState(false)

    return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">

            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">

                <div className="flex justify-center mb-6">
                    <div className="bg-blue-600 p-3 rounded-xl">
                        <BriefcaseBusiness size={32} className="text-white" />
                    </div>
                </div>

                <h1 className="text-3xl font-bold text-center text-slate-900">
                    WorkSphere
                </h1>

                <p className="text-center text-slate-500 mt-2 mb-8">
                    Sign in to manage your workspace
                </p>

                <form onSubmit={(e) => e.preventDefault()}>

                    <div className="mb-5">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Email Address
                        </label>

                        <div className="flex items-center border border-slate-300 rounded-lg px-3">
                            <Mail size={19} className="text-slate-400" />

                            <input
                                type="email"
                                placeholder="Enter your email"
                                className="w-full p-3 outline-none"
                                required
                            />
                        </div>
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Password
                        </label>

                        <div className="flex items-center border border-slate-300 rounded-lg px-3">
                            <LockKeyhole size={19} className="text-slate-400" />

                            <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Enter your password"
                                className="w-full p-3 outline-none"
                                required
                            />

                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="text-slate-400"
                            >
                                {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
                    >
                        Sign In
                    </button>

                </form>
                <p className="text-center text-sm text-slate-500 mt-6">
                    Don't have an account?{' '}
                    <Link
                        to="/register"
                        className="text-blue-600 font-semibold hover:underline"
                    >
                        Create Account
                    </Link>
                </p>

                <p className="text-center text-sm text-slate-400 mt-8">
                    © 2026 WorkSphere. All rights reserved.
                </p>

            </div>
        </div>
    )
}

export default Login
