// Compatibility shim: re-export the central `useUser` from project root so
// older relative imports like "../../lib/auth" resolve inside `src/pages/*`.
export { useUser } from "../../lib/auth";
