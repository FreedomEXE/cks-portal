// src/pages/LinkAccount.jsx (redirect after link)
import { useState } from "react";
import { useUser } from "../lib/auth";
import { useNavigate } from "react-router-dom";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import Alert from "../components/ui/Alert";
import { apiFetch, buildUrl } from "../lib/apiBase";

export default function LinkAccount() {
  const { user } = useUser();
  const [code, setCode] = useState("");
  const [status, setStatus] = useState("");
  const navigate = useNavigate();

  const headers = {
    "Content-Type": "application/json",
    "x-user-id": user?.id || "",
    "x-user-email": user?.primaryEmailAddress?.emailAddress || ""
  };

  async function submit() {
    setStatus("...");
    try {
  const res = await apiFetch(buildUrl('/me/link'), {
        method: "POST",
        headers,
        body: JSON.stringify({ internal_code: code, email: user?.primaryEmailAddress?.emailAddress || '' })
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Failed");
      setStatus("Linked!");
      navigate("/hub", { replace: true });
    } catch (e) {
      setStatus("Error: " + (e.message || e));
    }
  }

  const isError = status.startsWith('Error:');
  return (
    <div className="p-6 max-w-xl">
      <h1 className="text-2xl font-bold mb-3">Link your CKS ID</h1>
      <p className="mb-4 text-ink-600">
        Enter your CKS code (e.g., <code>001-A</code>, <code>001-B</code>, <code>MGR-001</code>).
      </p>
      <div className="flex gap-2">
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="CKS Code"
        />
        <Button onClick={submit} variant="primary">Link</Button>
      </div>
      <div className="mt-3 text-sm">
        {status ? (isError ? <Alert variant="error">{status}</Alert> : status) : null}
      </div>
    </div>
  );
}
