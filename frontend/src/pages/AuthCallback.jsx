import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function AuthCallback() {
  const [error, setError] = useState(null);
  const nav = useNavigate();
  const { setUser, refresh } = useAuth();
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;

    // Extract session_id from URL fragment
    const hash = window.location.hash || "";
    const match = hash.match(/session_id=([^&]+)/);
    if (!match) { nav("/login"); return; }
    const sessionId = decodeURIComponent(match[1]);

    (async () => {
      try {
        const { data } = await api.post("/auth/google/session", null, {
          headers: { "X-Session-ID": sessionId },
        });
        setUser(data);
        await refresh();
        // Clear fragment
        window.history.replaceState(null, "", window.location.pathname);
        if (!data.role || data.role === "pending") nav("/onboarding");
        else if (data.role === "admin") nav("/admin");
        else if (data.role === "tutor") nav("/tutor");
        else nav("/dashboard");
      } catch (e) {
        setError(e?.response?.data?.detail || "Authentication failed");
      }
    })();
  }, [nav, setUser, refresh]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center" data-testid="auth-callback-page">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#1D4ED8] border-t-transparent" />
        <p className="mt-6 text-slate-500">{error ? error : "Signing you in…"}</p>
      </div>
    </div>
  );
}
