import useMeProfile from "./useMeProfile";
import { deriveCodeFrom } from "../utils/profileCode";

export default function useMyCode() {
  const state = useMeProfile();
  const code = deriveCodeFrom(state.kind as any, state.data as any);
  return { ...state, code } as const;
}
