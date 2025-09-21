// In React 18+, useSyncExternalStore is built-in. We expose it directly so that
// any libraries importing `use-sync-external-store/shim` via Vite alias resolve here
// without creating a circular self-import.
import { useSyncExternalStore as reactUseSyncExternalStore } from 'react';

export const useSyncExternalStore = reactUseSyncExternalStore;
export default reactUseSyncExternalStore;
