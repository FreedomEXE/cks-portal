/// <reference types="vite/client" />

// Strong typing for Vite-exposed environment variables used by the frontend.
interface ImportMetaEnv {
  readonly VITE_CLERK_PUBLISHABLE_KEY: string;
  readonly VITE_CLERK_FRONTEND_API?: string;
  readonly VITE_CLERK_API_URL?: string;
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
