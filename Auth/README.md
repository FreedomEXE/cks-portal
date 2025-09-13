CKS Auth Module

Purpose
- Centralize authentication UI and helpers while keeping hub UIs simple.
- Preserve the OG login look/flow and provide a single logout utility.

Contents
- frontend/
  - pages/Login.tsx            — OG dark login page (username/password + Google)
  - pages/ForgotPassword.tsx   — OG reset flow
  - provider/AuthProvider.tsx  — lightweight helpers (logout hook)
  - hooks/useHubRedirect.ts    — helper to compute /{code}/hub paths (future)

Usage (Frontend)
- Import pages via alias (configured in Frontend):
  import Login from 'cks-auth/pages/Login'
  import ForgotPassword from 'cks-auth/pages/ForgotPassword'

- Use logout helper in hubs:
  import { useCKSAuth } from 'cks-auth/provider/AuthProvider'
  const { logout } = useCKSAuth()
  <button onClick={logout}>Log out</button>

Notes
- Clerk remains the IdP; this module wraps Clerk hooks for consistent app behavior.
- /me/bootstrap remains the authoritative role/code resolution.
