import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import api, { formatApiError } from "@/lib/api";

const ROLES = [
  { id: "student_highschool", label: "High School Student" },
  { id: "student_university", label: "University Student" },
];

export default function Signup() {
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", role: "student_highschool" });
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuth();
  const nav = useNavigate();
  const { toast } = useToast();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/auth/register", form);
      setUser(data);
      toast({ title: "Account created", description: "Welcome to Excel Tutoring!" });
      nav("/dashboard");
    } catch (err) {
      toast({ title: "Signup failed", description: formatApiError(err), variant: "destructive" });
    } finally { setLoading(false); }
  };

  const googleLogin = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + "/auth/callback";
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="grid min-h-[calc(100vh-5rem)] grid-cols-1 lg:grid-cols-12" data-testid="signup-page">
      <div className="relative hidden lg:col-span-6 lg:block">
        <img src="https://images.pexels.com/photos/6326370/pexels-photo-6326370.jpeg" alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-[#050A15]/60" />
        <div className="absolute inset-x-0 bottom-0 p-12 text-white">
          <div className="font-display text-3xl font-semibold tracking-tight">Premium tutoring, priced for South Africa.</div>
          <div className="mt-2 text-slate-300">Flexible monthly plans. Cancel anytime.</div>
        </div>
      </div>

      <div className="lg:col-span-6 flex items-center justify-center p-8">
        <form onSubmit={submit} className="w-full max-w-md space-y-6" data-testid="signup-form">
          <div>
            <div className="eyebrow">Create account</div>
            <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">Start learning today.</h1>
            <p className="mt-2 text-slate-600">Takes 30 seconds. No credit card required.</p>
          </div>

          <Button type="button" onClick={googleLogin} variant="outline" className="w-full rounded-full h-12" data-testid="signup-google">
            <svg className="mr-2 h-4 w-4" viewBox="0 0 48 48" aria-hidden>
              <path fill="#FFC107" d="M43.6 20.5h-1.9V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z" />
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
              <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.3 35 26.8 36 24 36c-5.2 0-9.6-3.1-11.3-7.5l-6.5 5C9.6 39.7 16.2 44 24 44z" />
              <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.3 5.5l6.3 5.3c-.4.4 6.7-4.9 6.7-14.8 0-1.3-.1-2.3-.4-3.5z" />
            </svg>
            Continue with Google
          </Button>

          <div className="flex items-center gap-3 text-xs text-slate-400">
            <div className="h-px flex-1 bg-slate-200" /> or <div className="h-px flex-1 bg-slate-200" />
          </div>

          <div>
            <label className="text-sm font-medium">I am a…</label>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {ROLES.map((r) => (
                <button type="button" key={r.id} onClick={() => setForm({ ...form, role: r.id })}
                  className={`rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${form.role === r.id ? "border-[#1D4ED8] bg-[#EFF6FF] text-[#1D4ED8]" : "border-slate-200 text-slate-700 hover:border-slate-300"}`}
                  data-testid={`signup-role-${r.id}`}>
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Full name</label>
            <Input className="mt-2 h-12" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="signup-name" />
          </div>
          <div>
            <label className="text-sm font-medium">Email</label>
            <Input className="mt-2 h-12" required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} data-testid="signup-email" />
          </div>
          <div>
            <label className="text-sm font-medium">Phone (optional)</label>
            <Input className="mt-2 h-12" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} data-testid="signup-phone" />
          </div>
          <div>
            <label className="text-sm font-medium">Password</label>
            <Input className="mt-2 h-12" required type="password" minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} data-testid="signup-password" />
          </div>
          <Button disabled={loading} className="w-full rounded-full bg-[#1D4ED8] hover:bg-[#1E40AF] h-12" data-testid="signup-submit">
            {loading ? "Creating account…" : "Create account"}
          </Button>
          <p className="text-sm text-slate-600">Already have an account? <Link to="/login" className="font-semibold text-[#1D4ED8] hover:underline">Sign in</Link></p>
        </form>
      </div>
    </div>
  );
}
