# Clerk Integration

This guide documents how Clerk is wired into the CKS Portal (Vite + React 18) and the production settings required on Vercel/Render.

## Environment Variables (Frontend)

Vite requires `VITE_`-prefixed envs:

- `VITE_CLERK_PUBLISHABLE_KEY` – required, the frontend public key
- `VITE_CLERK_SIGN_IN_URL` – SPA route for sign-in (e.g. `/sign-in`)
- `VITE_CLERK_SIGN_UP_URL` – SPA route for sign-up (e.g. `/sign-up`)
- `VITE_CLERK_AFTER_SIGN_IN_URL` – where to land after auth (e.g. `/hub`)
- `VITE_CLERK_AFTER_SIGN_UP_URL` – where to land after auth (e.g. `/hub`)

Recommended additional envs:

- `VITE_API_URL` – API base (e.g. `https://api.portal.ckscontracting.ca/api`)
- Loader customization (optional):
  - `VITE_LOADER_SVG=/portal-icon.svg`
  - `VITE_LOADER_COLOR`, `VITE_LOADER_SIZE`, `VITE_LOADER_FORCE_VECTOR`

## Provider Placement (Critical)

Place the providers in this order to avoid auth race conditions and hydration issues:

1. `ThemeProvider` (outermost)
2. `ClerkProvider`
3. `SWRConfig`
4. `LoadingProvider`
5. `CartProvider`
6. `BrowserRouter`

In code (apps/frontend/src/main.tsx):

```
<ThemeProvider>
  <ClerkProvider publishableKey={VITE_CLERK_PUBLISHABLE_KEY}
                 signInUrl={VITE_CLERK_SIGN_IN_URL}
                 signUpUrl={VITE_CLERK_SIGN_UP_URL}>
    <SWRConfig>...
      <LoadingProvider>
        <CartProvider>
          <BrowserRouter>
            <SignedIn><AuthenticatedApp /></SignedIn>
            <SignedOut><UnauthenticatedApp /></SignedOut>
          </BrowserRouter>
          <GlobalLoader />
        </CartProvider>
      </LoadingProvider>
    </SWRConfig>
  </ClerkProvider>
</ThemeProvider>
```

Notes:

- Our `ThemeProvider` is SSR-safe and returns a no-op hook until mounted to avoid early-render crashes.
- Clerk redirects are handled via SPA routes; ensure Vercel rewrites are configured so `/hub` (and other routes) serve `index.html`.

## Clerk Dashboard Settings

Production domain must be added to Clerk:

- Allowed Origins: `https://portal.ckscontracting.ca`
- Authorized Redirect URLs: `https://portal.ckscontracting.ca`, `https://portal.ckscontracting.ca/*`

When switching from dev to prod keys:

- Update Vercel envs for the portal project with the prod publishable key.
- Update Render envs for the backend with the prod secret key (`CLERK_SECRET_KEY`).
- Add the new domain(s) to Clerk Allowed Origins/Redirect URLs.

## Hiding Clerk UI for Photo Upload

To avoid exposing the full Clerk profile page and branding, we handle photo uploads in-app:

- Call `user.setProfileImage({ file })` from `@clerk/clerk-react` `useUser()` client.
- Keep “Manage Account” link for security if desired, but photo changes do not require opening Clerk UI.

## Password Reset (1‑click)

Backend route:

- `POST /api/account/request-password-reset`
  - Guards: authentication required; user can only reset their own password.
  - Integration: Clerk server SDK createPasswordReset API
  - Rate limit recommended (e.g., 5/minute per IP)

Frontend wiring:

- A button in Settings triggers the API; toast success/error feedback.
- If `user?.passwordEnabled === false` (SSO), hide the reset option and show an SSO note instead.

## Troubleshooting

- 404 on `/hub` or other client routes on Vercel:
  - Ensure SPA rewrites exist (`vercel.json`) so all unmatched routes rewrite to `/index.html`.
- `ReferenceError: useTheme is not defined` during auth transitions:
  - Verify imports from `ThemeContext` and that `ThemeProvider` is mounted outermost.
- `ReferenceError: require is not defined` on backend start:
  - Use ESM-safe patterns (`import.meta.url` for dirname; avoid `require.main`). Our backend start command uses `tsx` to run TypeScript in ESM mode.
