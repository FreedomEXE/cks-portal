import { useAuth } from '@clerk/clerk-react'
import { useNavigate } from 'react-router-dom'

export function useCKSAuth() {
  const { isSignedIn, signOut } = useAuth()
  const navigate = useNavigate()

  async function logout() {
    try {
      try { localStorage.setItem('userLoggedOut', 'true') } catch {}
      await signOut()
    } finally {
      navigate('/login', { replace: true })
    }
  }

  return { isSignedIn: !!isSignedIn, logout }
}

export function LogoutButton({ children = 'Log out' }: { children?: React.ReactNode }) {
  const { logout } = useCKSAuth()
  return (
    <button onClick={logout}>{children}</button>
  )
}

