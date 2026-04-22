import React, { useEffect, useState } from "react";
import { Mail, Phone, User2, BookOpen, CheckCircle2, Users, GraduationCap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";

function Stat({ icon: Icon, label, value, testid }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6" data-testid={testid}>
      <div className="flex items-center justify-between">
        <div className="eyebrow">{label}</div>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#1D4ED8]"><Icon className="h-5 w-5" /></div>
      </div>
      <div className="mt-3 font-display text-4xl font-semibold tracking-tighter">{value}</div>
    </div>
  );
}

function subStatusBadge(s) {
  if (s === "active") return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Active</Badge>;
  if (s === "pending_payment") return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Payment pending</Badge>;
  if (s === "cancelled") return <Badge variant="secondary">Cancelled</Badge>;
  return <Badge variant="secondary">No subscription</Badge>;
}

export default function TutorDashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const [s, st] = await Promise.all([
        api.get("/tutor/summary"),
        api.get("/tutor/students"),
      ]);
      setSummary(s.data);
      setStudents(st.data);
    } catch (e) {
      toast({ title: "Failed to load", description: e?.response?.data?.detail || e.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  useEffect(() => { if (user) load(); }, [user]);
  if (!user) return null;

  // Group by module
  const byModule = students.reduce((acc, s) => {
    const key = s.module?.id || "unassigned";
    (acc[key] = acc[key] || { module: s.module, rows: [] }).rows.push(s);
    return acc;
  }, {});

  return (
    <div className="bg-slate-50 min-h-screen" data-testid="tutor-dashboard">
      <div className="container-x py-12">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="eyebrow">Tutor dashboard</div>
            <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">Welcome, {user.name?.split(" ")[0]} 👋</h1>
            <p className="mt-1 text-slate-600">Here are the students and modules assigned to you.</p>
          </div>
        </div>

        {summary && (
          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
            <Stat icon={Users} label="My students" value={summary.total_students} testid="tutor-stat-students" />
            <Stat icon={BookOpen} label="Modules I teach" value={summary.total_modules} testid="tutor-stat-modules" />
            <Stat icon={CheckCircle2} label="Active subs" value={summary.active_subscriptions} testid="tutor-stat-active" />
            <Stat icon={GraduationCap} label="Enrollments" value={summary.enrollments} testid="tutor-stat-enroll" />
          </div>
        )}

        <div className="mt-10">
          <div className="flex items-center justify-between">
            <div>
              <div className="eyebrow">Your roster</div>
              <h2 className="mt-2 font-display text-2xl font-semibold">Students &amp; modules</h2>
            </div>
          </div>

          {loading ? (
            <p className="mt-6 text-slate-400">Loading…</p>
          ) : students.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-500" data-testid="tutor-empty">
              <BookOpen className="mx-auto h-10 w-10 text-slate-400" />
              <p className="mt-4 font-medium">No students assigned yet.</p>
              <p className="mt-1 text-sm">Admin will assign you students from the Admin Control Panel → Assign tutor/module.</p>
            </div>
          ) : (
            <div className="mt-6 space-y-6">
              {Object.entries(byModule).map(([key, { module, rows }]) => (
                <div key={key} className="rounded-2xl border border-slate-200 bg-white p-6" data-testid={`tutor-module-group-${key}`}>
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[#1D4ED8]">{module?.code || "—"}</div>
                      <div className="font-display text-xl font-semibold">{module?.name || "Unassigned module"}</div>
                      {module?.level && <div className="text-xs text-slate-500 mt-0.5">{module.level === "high_school" ? "High School" : "University"}</div>}
                    </div>
                    <Badge variant="secondary">{rows.length} student{rows.length === 1 ? "" : "s"}</Badge>
                  </div>
                  <div className="mt-4 divide-y divide-slate-100">
                    {rows.map((r) => (
                      <div key={r.enrollment_id} className="flex flex-wrap items-center justify-between gap-4 py-4" data-testid={`tutor-student-${r.enrollment_id}`}>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EFF6FF] text-[#1D4ED8]"><User2 className="h-5 w-5" /></div>
                          <div>
                            <div className="font-semibold">{r.student.name}</div>
                            <div className="mt-0.5 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                              <a href={`mailto:${r.student.email}`} className="inline-flex items-center gap-1 hover:text-[#1D4ED8]"><Mail className="h-3 w-3" /> {r.student.email}</a>
                              {r.student.phone && <a href={`https://wa.me/${(r.student.phone || "").replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-[#1D4ED8]"><Phone className="h-3 w-3" /> {r.student.phone}</a>}
                              <Badge variant="secondary" className="text-[10px]">{r.student.role?.replace("student_", "") || "student"}</Badge>
                            </div>
                          </div>
                        </div>
                        <div>{subStatusBadge(r.subscription_status)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-6" data-testid="tutor-tips">
          <div className="eyebrow">Tips</div>
          <ul className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3 text-sm text-slate-700">
            <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500" /> Send first session links via email within 24 hours.</li>
            <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500" /> Keep a weekly note for each student — they love consistency.</li>
            <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-500" /> Need help? Message admin from your tutor WhatsApp channel.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
