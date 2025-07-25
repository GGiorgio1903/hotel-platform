import React, { createContext, useContext, useState, useEffect } from 'react'

interface Guest {
  id: string
  email: string
  first_name: string
  last_name: string
  phone: string
  created_at: string
}

interface AuthContextType {
  isAuthenticated: boolean
  guest: Guest | null
  loading: boolean
  login: (email: string, otp: string) => Promise<boolean>
  logout: () => void
  requestOTP: (email: string) => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [guest, setGuest] = useState<Guest | null>(null)
  const [loading, setLoading] = useState(true)

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token) {
      fetchCurrentGuest(token)
    } else {
      setLoading(false)
    }
  }, [])

  const fetchCurrentGuest = async (token: string) => {
    try {
      const response = await fetch(`${API_URL}/guests/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const guestData = await response.json()
        setGuest(guestData)
        setIsAuthenticated(true)
      } else {
        localStorage.removeItem('access_token')
      }
    } catch (error) {
      console.error('Error fetching current guest:', error)
      localStorage.removeItem('access_token')
    } finally {
      setLoading(false)
    }
  }

  const requestOTP = async (email: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}/auth/request-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      return response.ok
    } catch (error) {
      console.error('Error requesting OTP:', error)
      return false
    }
  }

  const login = async (email: string, otp: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp }),
      })

      if (response.ok) {
        const data = await response.json()
        localStorage.setItem('access_token', data.access_token)
        setGuest(data.guest)
        setIsAuthenticated(true)
        return true
      }
      return false
    } catch (error) {
      console.error('Error logging in:', error)
      return false
    }
  }

  const logout = () => {
    localStorage.removeItem('access_token')
    setGuest(null)
    setIsAuthenticated(false)
  }

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      guest,
      loading,
      login,
      logout,
      requestOTP,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
