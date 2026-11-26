import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, UserCircle } from 'lucide-react'
import api from '../api/axios'

function Profile() {
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    username: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role: '',
  })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [errors, setErrors] = useState({})

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('auth/profile/')
        setFormData(response.data)
      } catch {
        navigate('/')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [navigate])

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
    setSaving(true)
    setErrors({})
    setMessage('')

    try {
      const response = await api.patch(
        'auth/profile/',
        {
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone: formData.phone,
        }
      )

      setFormData(response.data)
      setMessage('Profile updated successfully!')

    } catch (error) {
      setErrors(error.response?.data || {
        general: 'Unable to update profile.',
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading Profile...
      </div>
    )
  }

  const getError = (field) => {
    const error = errors[field]
    return Array.isArray(error) ? error[0] : error
  }

  return (
    <div className="min-h-screen bg-slate-100 p-6">

      <div className="max-w-2xl mx-auto">

        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-blue-600 mb-6"
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </button>

        <div className="bg-white rounded-2xl shadow-lg p-8">

          <div className="flex items-center gap-3 mb-7">
            <UserCircle size={35} className="text-blue-600" />

            <div>
              <h1 className="text-2xl font-bold">
                My Profile
              </h1>

              <p className="text-slate-500 text-sm">
                Update your personal information
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
                Username
              </label>

              <input
                value={formData.username}
                disabled
                className="w-full bg-slate-100 border rounded-lg p-3"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">

              <div>
                <label className="block text-sm font-medium mb-2">
                  First Name
                </label>

                <input
                  name="first_name"
                  value={formData.first_name || ''}
                  onChange={handleChange}
                  className="w-full border rounded-lg p-3"
                />

                {getError('first_name') && (
                  <p className="text-red-500 text-xs mt-1">
                    {getError('first_name')}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Last Name
                </label>

                <input
                  name="last_name"
                  value={formData.last_name || ''}
                  onChange={handleChange}
                  className="w-full border rounded-lg p-3"
                />

                {getError('last_name') && (
                  <p className="text-red-500 text-xs mt-1">
                    {getError('last_name')}
                  </p>
                )}
              </div>

            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Email
              </label>

              <input
                type="email"
                name="email"
                value={formData.email || ''}
                onChange={handleChange}
                className="w-full border rounded-lg p-3"
              />

              {getError('email') && (
                <p className="text-red-500 text-xs mt-1">
                  {getError('email')}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Phone
              </label>

              <input
                name="phone"
                value={formData.phone || ''}
                onChange={handleChange}
                className="w-full border rounded-lg p-3"
              />

              {getError('phone') && (
                <p className="text-red-500 text-xs mt-1">
                  {getError('phone')}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Role
              </label>

              <input
                value={formData.role || ''}
                disabled
                className="w-full bg-slate-100 border rounded-lg p-3"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-blue-600 text-white py-3 rounded-lg flex justify-center items-center gap-2 hover:bg-blue-700 disabled:opacity-50"
            >
              <Save size={18} />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>

          </form>

        </div>
      </div>
    </div>
  )
}

export default Profile
