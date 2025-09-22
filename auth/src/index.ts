// Auth package exports
export { default as Login } from './pages/Login';
export { default as Logout } from './pages/Logout';
export { default as Invite } from './pages/Invite';
export { default as Callback } from './pages/Callback';

// Components
export { default as ProtectedRoute } from './components/ProtectedRoute';
export { default as RoleGuard } from './components/RoleGuard';

// Providers
export { default as ClerkProvider } from './providers/ClerkProvider';
export { default as AuthContext } from './providers/AuthContext';

// Hooks
export { useAuth } from './hooks/useAuth';

// Utils
export * from './utils/clerkClient';
export * from './utils/roleExtractor';
export * from './utils/customIdParser';
export * from './utils/tokenValidator';

// Types
export * from './types/auth.d';
