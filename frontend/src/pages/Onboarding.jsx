import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const ROLES = [
  { id: "student_highschool", label: "High School Student", desc: "CAPS-aligned tutoring for Grades 8–12." },
  { id: "student_university", label: "University Student", desc: "Math, Stats, CS and Chemistry modules." },
  { id: "tutor", label: "Prospective Tutor", desc: "Apply to teach on the platform." },
];

export default function Onboarding() {
  const { user, setUser } = useAuth();
  const [role, setRole] = useState("student_highschool");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();
  const { toast } = useToast();

  if (!user) return null;
  if (user.role && user.role !== "pending") {
    nav(user.role === "admin" ? "/admin" : "/dashboard");
    return null;
  }

  const submit = async () => {
    setLoading(true);
    try {
      const { data } = await api.post("/auth/set-role", { role });
      setUser(data);
      if (role === "tutor") { nav("/tutor-apply"); return; }
      nav("/dashboard");
    } catch (err) {
      toast({ title: "Failed", description: err?.response?.data?.detail || err.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  return (
    <div className="section bg-slate-50" data-testid="onboarding-page">
      <div className="container-x max-w-2xl">
        <div className="eyebrow">Welcome, {user.name?.split(" ")[0]}</div>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">Tell us who you are.</h1>
        <p className="mt-3 text-slate-600">We'll tailor your experience accordingly.</p>

        <div className="mt-10 space-y-3">
          {ROLES.map((r) => (
            <button key={r.id} onClick={() => setRole(r.id)}
              className={`w-full rounded-2xl border bg-white p-6 text-left transition-all ${role === r.id ? "border-[#1D4ED8] ring-2 ring-[#1D4ED8]/15" : "border-slate-200 hover:border-slate-300"}`}
              data-testid={`onboarding-role-${r.id}`}>
              <div className="font-display text-xl font-semibold">{r.label}</div>
              <div className="mt-1 text-sm text-slate-600">{r.desc}</div>
            </button>
          ))}
        </div>

        <Button onClick={submit} disabled={loading} className="mt-8 rounded-full bg-[#1D4ED8] hover:bg-[#1E40AF] px-8 py-6" data-testid="onboarding-submit">
          {loading ? "Saving…" : "Continue"}
        </Button>
      </div>
    </div>
  );
}
