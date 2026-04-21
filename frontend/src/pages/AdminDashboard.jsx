import React, { useEffect, useState } from "react";
import { Users, GraduationCap, DollarSign, CheckCircle2, XCircle, Trash2, Star, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ModulesAdmin, PricingAdmin } from "@/components/admin/ContentAdmin";
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

function fmt(d) { return d ? new Date(d).toLocaleDateString("en-ZA", { year: "numeric", month: "short", day: "numeric" }) : "—"; }

function AssignDialog({ students, tutors, modules, onAssigned }) {
  const [open, setOpen] = useState(false);
  const [studentId, setStudentId] = useState("");
  const [tutorId, setTutorId] = useState("");
  const [moduleId, setModuleId] = useState("");
  const { toast } = useToast();

  const save = async () => {
    if (!studentId || !moduleId) { toast({ title: "Select a student and a module", variant: "destructive" }); return; }
    try {
      await api.post("/admin/assignments", { student_user_id: studentId, tutor_user_id: tutorId || null, module_id: moduleId });
      toast({ title: "Assigned" });
      setOpen(false);
      setStudentId(""); setTutorId(""); setModuleId("");
      onAssigned?.();
    } catch (e) { toast({ title: "Failed", description: e?.response?.data?.detail || e.message, variant: "destructive" }); }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-full bg-[#1D4ED8] hover:bg-[#1E40AF]" data-testid="btn-assign">Assign tutor/module</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Assign tutor &amp; module</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Student</label>
            <select className="mt-2 h-12 w-full rounded-lg border border-slate-200 bg-white px-3" value={studentId} onChange={(e) => setStudentId(e.target.value)} data-testid="select-student">
              <option value="">Select…</option>
              {students.map((s) => <option key={s.user_id} value={s.user_id}>{s.name} — {s.email}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Module</label>
            <select className="mt-2 h-12 w-full rounded-lg border border-slate-200 bg-white px-3" value={moduleId} onChange={(e) => setModuleId(e.target.value)} data-testid="select-module">
              <option value="">Select…</option>
              {modules.map((m) => <option key={m.id} value={m.id}>{m.name} ({m.level})</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Tutor (optional)</label>
            <select className="mt-2 h-12 w-full rounded-lg border border-slate-200 bg-white px-3" value={tutorId} onChange={(e) => setTutorId(e.target.value)} data-testid="select-tutor">
              <option value="">Unassigned</option>
              {tutors.map((t) => <option key={t.user_id} value={t.user_id}>{t.name} — {t.email}</option>)}
            </select>
          </div>
          <Button onClick={save} className="w-full rounded-full bg-[#1D4ED8] hover:bg-[#1E40AF]" data-testid="save-assign">Save assignment</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [students, setStudents] = useState([]);
  const [apps, setApps] = useState([]);
  const [activeTutors, setActiveTutors] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [subs, setSubs] = useState([]);
  const [msgs, setMsgs] = useState([]);
  const [modules, setModules] = useState([]);
  const [plans, setPlans] = useState([]);
  const { toast } = useToast();

  const load = async () => {
    try {
      const [a, s, t, tu, ts, sb, m, mo, pl] = await Promise.all([
        api.get("/admin/analytics"),
        api.get("/admin/students"),
        api.get("/admin/tutors"),
        api.get("/admin/all-tutors"),
        api.get("/admin/testimonials"),
        api.get("/admin/subscriptions"),
        api.get("/admin/contact-messages"),
        api.get("/modules"),
        api.get("/pricing"),
      ]);
      setAnalytics(a.data); setStudents(s.data); setApps(t.data); setActiveTutors(tu.data);
      setTestimonials(ts.data); setSubs(sb.data); setMsgs(m.data); setModules(mo.data); setPlans(pl.data);
    } catch (e) { toast({ title: "Failed to load", description: e?.response?.data?.detail || e.message, variant: "destructive" }); }
  };
  useEffect(() => { load(); }, []);

  const tutorAction = async (id, action) => {
    try {
      await api.patch(`/admin/tutors/${id}/${action}`);
      toast({ title: `Application ${action}d` });
      load();
    } catch (e) { toast({ title: "Failed", description: e?.response?.data?.detail || e.message, variant: "destructive" }); }
  };
  const approveTestimonial = async (id) => {
    try { await api.patch(`/admin/testimonials/${id}/approve`); toast({ title: "Approved" }); load(); }
    catch (e) { toast({ title: "Failed", description: e?.response?.data?.detail || e.message, variant: "destructive" }); }
  };
  const deleteTestimonial = async (id) => {
    if (!window.confirm("Delete this testimonial?")) return;
    try { await api.delete(`/admin/testimonials/${id}`); toast({ title: "Deleted" }); load(); }
    catch (e) { toast({ title: "Failed", description: e?.response?.data?.detail || e.message, variant: "destructive" }); }
  };

  return (
    <div className="bg-slate-50 min-h-screen" data-testid="admin-dashboard">
      <div className="container-x py-12">
        <div className="flex items-end justify-between flex-wrap gap-6">
          <div>
            <div className="eyebrow">Admin</div>
            <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">Control panel</h1>
          </div>
          <AssignDialog students={students} tutors={activeTutors} modules={modules} onAssigned={load} />
        </div>

        {analytics && (
          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
            <Stat icon={Users} label="Students" value={analytics.total_students} testid="stat-students" />
            <Stat icon={GraduationCap} label="Tutors" value={analytics.total_tutors} testid="stat-tutors" />
            <Stat icon={CheckCircle2} label="Active subs" value={analytics.active_subscriptions} testid="stat-subs" />
            <Stat icon={DollarSign} label="Revenue (R)" value={`R${analytics.revenue_zar}`} testid="stat-revenue" />
          </div>
        )}

        <Tabs defaultValue="students" className="mt-10">
          <TabsList className="flex flex-wrap gap-2 bg-transparent p-0 h-auto">
            <TabsTrigger value="students" className="rounded-full data-[state=active]:bg-[#050A15] data-[state=active]:text-white" data-testid="tab-students">Students ({students.length})</TabsTrigger>
            <TabsTrigger value="tutors" className="rounded-full data-[state=active]:bg-[#050A15] data-[state=active]:text-white" data-testid="tab-tutors">Tutor apps ({apps.length})</TabsTrigger>
            <TabsTrigger value="subs" className="rounded-full data-[state=active]:bg-[#050A15] data-[state=active]:text-white" data-testid="tab-subs">Subscriptions ({subs.length})</TabsTrigger>
            <TabsTrigger value="testimonials" className="rounded-full data-[state=active]:bg-[#050A15] data-[state=active]:text-white" data-testid="tab-testimonials">Testimonials ({testimonials.length})</TabsTrigger>
            <TabsTrigger value="messages" className="rounded-full data-[state=active]:bg-[#050A15] data-[state=active]:text-white" data-testid="tab-messages">Messages ({msgs.length})</TabsTrigger>
            <TabsTrigger value="modules" className="rounded-full data-[state=active]:bg-[#050A15] data-[state=active]:text-white" data-testid="tab-modules">Modules ({modules.length})</TabsTrigger>
            <TabsTrigger value="plans" className="rounded-full data-[state=active]:bg-[#050A15] data-[state=active]:text-white" data-testid="tab-plans">Pricing ({plans.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="students" className="mt-6">
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-[0.18em] text-slate-500">
                  <tr><th className="p-4">Name</th><th className="p-4">Email</th><th className="p-4">Role</th><th className="p-4">Joined</th></tr>
                </thead>
                <tbody>
                  {students.map((s) => (
                    <tr key={s.user_id} className="border-t border-slate-100" data-testid={`student-row-${s.user_id}`}>
                      <td className="p-4 font-medium">{s.name}</td>
                      <td className="p-4 text-slate-600">{s.email}</td>
                      <td className="p-4"><Badge variant="secondary">{s.role.replace("student_", "")}</Badge></td>
                      <td className="p-4 text-slate-600">{fmt(s.created_at)}</td>
                    </tr>
                  ))}
                  {students.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-slate-400">No students yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="tutors" className="mt-6">
            <div className="space-y-4">
              {apps.map((a) => (
                <div key={a.id} className="rounded-2xl border border-slate-200 bg-white p-6" data-testid={`app-${a.id}`}>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <div className="font-display text-xl font-semibold">{a.full_name}</div>
                        <Badge className={a.status === "approved" ? "bg-emerald-100 text-emerald-700" : a.status === "rejected" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-800"}>{a.status}</Badge>
                      </div>
                      <div className="mt-1 text-sm text-slate-600">{a.email} · {a.phone} · {a.experience_years} yrs</div>
                      <div className="mt-2 text-sm text-slate-700"><strong>Qualification:</strong> {a.qualification}</div>
                      <div className="mt-1 text-sm text-slate-700"><strong>Level:</strong> {a.level} · <strong>Subjects:</strong> {a.subjects?.join(", ")}</div>
                      <p className="mt-3 text-sm text-slate-600">{a.bio}</p>
                    </div>
                    {a.status === "pending" && (
                      <div className="flex gap-2">
                        <Button onClick={() => tutorAction(a.id, "approve")} className="rounded-full bg-emerald-600 hover:bg-emerald-700" data-testid={`approve-${a.id}`}>
                          <CheckCircle2 className="mr-2 h-4 w-4" /> Approve
                        </Button>
                        <Button onClick={() => tutorAction(a.id, "reject")} variant="outline" className="rounded-full border-red-200 text-red-600 hover:bg-red-50" data-testid={`reject-${a.id}`}>
                          <XCircle className="mr-2 h-4 w-4" /> Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {apps.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-400">No tutor applications yet.</div>}
            </div>
          </TabsContent>

          <TabsContent value="subs" className="mt-6">
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-[0.18em] text-slate-500">
                  <tr><th className="p-4">Student</th><th className="p-4">Plan</th><th className="p-4">Amount</th><th className="p-4">Status</th><th className="p-4">Next payment</th></tr>
                </thead>
                <tbody>
                  {subs.map((s, i) => (
                    <tr key={i} className="border-t border-slate-100" data-testid={`sub-row-${i}`}>
                      <td className="p-4 font-medium">{s.user?.name} <div className="text-xs text-slate-500">{s.user?.email}</div></td>
                      <td className="p-4">{s.plan_name}</td>
                      <td className="p-4">R{s.amount_zar}</td>
                      <td className="p-4"><Badge variant="secondary">{s.status}</Badge></td>
                      <td className="p-4 text-slate-600">{fmt(s.next_payment_date)}</td>
                    </tr>
                  ))}
                  {subs.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-slate-400">No subscriptions yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="testimonials" className="mt-6 space-y-4">
            {testimonials.map((t) => (
              <div key={t.id} className="rounded-2xl border border-slate-200 bg-white p-6" data-testid={`tst-${t.id}`}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <div className="font-display text-lg font-semibold">{t.name}</div>
                      <Badge className={t.approved ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-800"}>{t.approved ? "approved" : "pending"}</Badge>
                      <div className="flex gap-0.5">{Array.from({ length: t.rating }).map((_, i) => <Star key={i} className="h-3 w-3 fill-[#F59E0B] stroke-[#F59E0B]" />)}</div>
                    </div>
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-500">{t.program}</div>
                    <p className="mt-3 text-slate-700">“{t.message}”</p>
                  </div>
                  <div className="flex gap-2">
                    {!t.approved && <Button onClick={() => approveTestimonial(t.id)} className="rounded-full bg-emerald-600 hover:bg-emerald-700" data-testid={`approve-tst-${t.id}`}><CheckCircle2 className="mr-2 h-4 w-4" /> Approve</Button>}
                    <Button onClick={() => deleteTestimonial(t.id)} variant="outline" className="rounded-full border-red-200 text-red-600 hover:bg-red-50" data-testid={`del-tst-${t.id}`}><Trash2 className="mr-2 h-4 w-4" /> Delete</Button>
                  </div>
                </div>
              </div>
            ))}
            {testimonials.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-400">No testimonials.</div>}
          </TabsContent>

          <TabsContent value="messages" className="mt-6 space-y-4">
            {msgs.map((m, i) => (
              <div key={i} className="rounded-2xl border border-slate-200 bg-white p-6" data-testid={`msg-${i}`}>
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-5 w-5 text-[#1D4ED8]" />
                  <div className="font-semibold">{m.name}</div>
                  <div className="text-xs text-slate-500">{m.email} · {m.phone || "—"}</div>
                  <div className="ml-auto text-xs text-slate-500">{fmt(m.created_at)}</div>
                </div>
                <p className="mt-3 text-slate-700">{m.message}</p>
              </div>
            ))}
            {msgs.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-400">No messages.</div>}
          </TabsContent>

          <TabsContent value="modules" className="mt-6">
            <ModulesAdmin modules={modules} onChange={load} />
          </TabsContent>

          <TabsContent value="plans" className="mt-6">
            <PricingAdmin plans={plans} onChange={load} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
