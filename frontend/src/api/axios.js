
import axios from 'axios'

const baseURL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/'

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
})

const refreshApi = axios.create({
  baseURL,
})

// Attach Access Token automatically
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => Promise.reject(error)
)

// Refresh Access Token when expired
api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('auth/login/') &&
      !originalRequest.url?.includes('auth/register/') &&
      !originalRequest.url?.includes('auth/token/refresh/')
    ) {
      originalRequest._retry = true

      try {
        const refresh = localStorage.getItem('refresh_token')

        if (!refresh) {
          throw new Error('Refresh token not found')
        }

        const response = await refreshApi.post(
          'auth/token/refresh/',
          { refresh }
        )

        const newAccessToken = response.data.access

        localStorage.setItem('access_token', newAccessToken)

        originalRequest.headers.Authorization =
          `Bearer ${newAccessToken}`

        return api(originalRequest)

      } catch (refreshError) {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')

        window.location.href = '/'

        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export default api
