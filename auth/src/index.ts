// Auth package exports
export { default as Callback } from './pages/Callback';
export { default as Invite } from './pages/Invite';
export { default as Login } from './pages/Login';
export { default as Logout } from './pages/Logout';

// Components
export { default as ProtectedRoute } from './components/ProtectedRoute';
export { default as RoleGuard } from './components/RoleGuard';

// Providers
export { default as AuthContext } from './providers/AuthContext';
export { default as ClerkProvider } from './providers/ClerkProvider';

// Hooks
export { useAuth } from './hooks/useAuth';

// Utils
export * from './utils/clerkClient';
export * from './utils/customIdParser';
export * from './utils/roleExtractor';
export * from './utils/tokenValidator';

// Types
export * from './types/auth.d';

