import React from 'react';

type ErrorBoundaryProps = {
  children: React.ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
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

export default class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private redirectTimeout: number | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('[ErrorBoundary] Unhandled render error', error, errorInfo);

    if (IS_DEV) {
      return;
    }

    clearAuthStorage();
    void clearClerkSession();

    this.redirectTimeout = window.setTimeout(() => {
      window.location.assign('/login');
    }, LOGIN_REDIRECT_DELAY_MS);
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
          <p>Your session has expired. Redirecting to login...</p>
        </div>
      );
    }

    return this.props.children;
  }
}
