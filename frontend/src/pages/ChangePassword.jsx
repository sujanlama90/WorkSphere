
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, LockKeyhole } from 'lucide-react'
import api from '../api/axios'

function ChangePassword() {
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    old_password: '',
    new_password: '',
    confirm_new_password: '',
  })

  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })

    setErrors({})
    setMessage('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    setLoading(true)
    setErrors({})
    setMessage('')

    try {
      const response = await api.post(
        'auth/change-password/',
        formData
      )

      setMessage(response.data.message)

      setFormData({
        old_password: '',
        new_password: '',
        confirm_new_password: '',
      })

    } catch (error) {
      setErrors(error.response?.data || {
        general: 'Unable to change password.',
      })
    } finally {
      setLoading(false)
    }
  }

  const getError = (field) => {
    const error = errors[field]
    return Array.isArray(error) ? error[0] : error
  }

  return (
    <div className="min-h-screen bg-slate-100 p-6">

      <div className="max-w-lg mx-auto">

        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-blue-600 mb-6"
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </button>

        <div className="bg-white rounded-2xl shadow-lg p-8">

          <div className="flex items-center gap-3 mb-7">
            <LockKeyhole size={32} className="text-blue-600" />

            <div>
              <h1 className="text-2xl font-bold">
                Change Password
              </h1>

              <p className="text-sm text-slate-500">
                Update your account password
              </p>
            </div>
          </div>

          {message && (
            <p className="bg-green-100 text-green-700 p-3 rounded-lg mb-5">
              {message}
            </p>
          )}

          {errors.general && (
            <p className="bg-red-100 text-red-700 p-3 rounded-lg mb-5">
              {errors.general}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            <div>
              <label className="block text-sm font-medium mb-2">
                Current Password
              </label>

              <input
                type="password"
                name="old_password"
                value={formData.old_password}
                onChange={handleChange}
                className="w-full border rounded-lg p-3"
                required
              />

              {getError('old_password') && (
                <p className="text-red-500 text-xs mt-1">
                  {getError('old_password')}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                New Password
              </label>

              <input
                type="password"
                name="new_password"
                value={formData.new_password}
                onChange={handleChange}
                className="w-full border rounded-lg p-3"
                required
              />

              {getError('new_password') && (
                <p className="text-red-500 text-xs mt-1">
                  {getError('new_password')}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Confirm New Password
              </label>

              <input
                type="password"
                name="confirm_new_password"
                value={formData.confirm_new_password}
                onChange={handleChange}
                className="w-full border rounded-lg p-3"
                required
              />

              {getError('confirm_new_password') && (
                <p className="text-red-500 text-xs mt-1">
                  {getError('confirm_new_password')}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Change Password'}
            </button>

          </form>

        </div>
      </div>
    </div>
  )
}

export default ChangePassword
