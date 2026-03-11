import React from 'react';

type ErrorBoundaryProps = {
  children: React.ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
  mode: 'session' | 'generic';
};

const IS_DEV = import.meta.env.DEV;
const LOGIN_REDIRECT_DELAY_MS = 2000;

const SESSION_KEYS = ['role', 'code', 'cks_login_draft'];
const LOCAL_KEYS = ['userLoggedOut'];
const IMPERSONATION_KEYS = ['cks_impersonation_active', 'cks_impersonation_ticket', 'cks_impersonation_return', 'cks_impersonation_attempt'];

function clearAuthStorage(): void {
  try {
    SESSION_KEYS.forEach((key) => window.sessionStorage.removeItem(key));
    IMPERSONATION_KEYS.forEach((key) => window.sessionStorage.removeItem(key));
    LOCAL_KEYS.forEach((key) => window.localStorage.removeItem(key));

    // Remove Clerk/session token-like keys without clearing unrelated app data.
    const sessionKeys = Object.keys(window.sessionStorage);
    sessionKeys.forEach((key) => {
      if (/clerk|auth|token|session/i.test(key)) {
        window.sessionStorage.removeItem(key);
      }
    });

    const localKeys = Object.keys(window.localStorage);
    localKeys.forEach((key) => {
      if (/clerk|auth|token|session/i.test(key)) {
        window.localStorage.removeItem(key);
      }
    });
  } catch {
    // Ignore storage cleanup failures.
  }
}

async function clearClerkSession(): Promise<void> {
  try {
    const clerk = (window as any).Clerk;
    if (clerk?.signOut) {
      await clerk.signOut();
    }
  } catch (error) {
    console.warn('[ErrorBoundary] Failed to clear Clerk session', error);
  }
}

function isSessionError(error: Error | null): boolean {
  if (!error) {
    return false;
  }

  const status = (error as any)?.status;
  if (status === 401 || status === 403) {
    return true;
  }

  const message = String(error.message || '').toLowerCase();
  return (
    message.includes('unauthorized') ||
    message.includes('forbidden') ||
    message.includes('session') ||
    message.includes('token expired') ||
    message.includes('authentication') ||
    message.includes('clerk')
  );
}

export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private redirectTimeout: number | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, mode: 'generic' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
      mode: isSessionError(error) ? 'session' : 'generic',
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('[ErrorBoundary] Unhandled render error', error, errorInfo);

    if (IS_DEV) {
      return;
    }

    if (isSessionError(error)) {
      clearAuthStorage();
      void clearClerkSession();

      this.redirectTimeout = window.setTimeout(() => {
        window.location.assign('/login');
      }, LOGIN_REDIRECT_DELAY_MS);
    }
  }

  componentWillUnmount(): void {
    if (this.redirectTimeout !== null) {
      window.clearTimeout(this.redirectTimeout);
    }
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      if (IS_DEV && this.state.error) {
        throw this.state.error;
      }

      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            textAlign: 'center',
            background: '#f8fafc',
            color: '#0f172a',
            fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
          }}
        >
          {this.state.mode === 'session' ? (
            <p>Your session has expired. Redirecting to login...</p>
          ) : (
            <div>
              <p>Something went wrong loading this view.</p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                style={{
                  marginTop: '0.75rem',
                  padding: '0.55rem 0.9rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#0f172a',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Reload app
              </button>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
