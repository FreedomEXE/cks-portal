/** CKS: AfterSignIn redirect to /:username/hub */
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";

export default function AfterSignIn() {
  const nav = useNavigate();
  const { user } = useUser();
  useEffect(() => {
    if (!user) return;
    const uname = (user.username || user.primaryEmailAddress?.emailAddress?.split("@")[0] || "me").toLowerCase();
    nav(`/${uname}/hub`, { replace: true });
  }, [user, nav]);
  return null;
}
