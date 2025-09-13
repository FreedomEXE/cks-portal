import { useNavigate } from 'react-router-dom'

export function useHubRedirect() {
  const navigate = useNavigate()
  function toHub(code?: string) {
    const fallback = (() => {
      try { return (sessionStorage.getItem('code') || '').toLowerCase() } catch { return '' }
    })()
    const dest = (code || fallback || 'hub').toLowerCase()
    navigate(dest.startsWith('/') ? dest : `/${dest}/hub`, { replace: true })
  }
  return { toHub }
}

