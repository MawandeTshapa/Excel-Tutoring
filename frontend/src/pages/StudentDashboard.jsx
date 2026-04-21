import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Calendar, CheckCircle2, CreditCard, BookOpen, AlertCircle, User2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";

function Card({ children, className = "" }) {
  return <div className={`rounded-2xl border border-slate-200 bg-white p-6 ${className}`}>{children}</div>;
}

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-ZA", { year: "numeric", month: "short", day: "numeric" });
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const nav = useNavigate();
  const { toast } = useToast();
  const [enrolls, setEnrolls] = useState([]);
  const [sub, setSub] = useState(null);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [e, s, n] = await Promise.all([
        api.get("/student/enrollments"),
        api.get("/student/subscription"),
        api.get("/student/notifications"),
      ]);
      setEnrolls(e.data);
      setSub(Object.keys(s.data || {}).length ? s.data : null);
      setNotes(n.data);
    } finally { setLoading(false); }
  };

  useEffect(() => { if (user) load(); }, [user]);

  if (!user) return null;

  const cancel = async () => {
    if (!window.confirm("Cancel subscription? You keep access until the end of the current period.")) return;
    try {
      await api.post("/student/subscription/cancel");
      toast({ title: "Subscription cancelled" });
      load();
    } catch (err) { toast({ title: "Failed", description: err?.response?.data?.detail || err.message, variant: "destructive" }); }
  };

  const confirmPaid = async () => {
    try {
      await api.post("/student/subscription/confirm");
      toast({ title: "Thanks!", description: "Your subscription is now active." });
      load();
    } catch (err) { toast({ title: "Failed", description: err?.response?.data?.detail || err.message, variant: "destructive" }); }
  };

  const statusBadge = () => {
    if (!sub) return <Badge variant="secondary" data-testid="sub-status">Not subscribed</Badge>;
    if (sub.status === "active") return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100" data-testid="sub-status">Active</Badge>;
    if (sub.status === "pending_payment") return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100" data-testid="sub-status">Payment pending</Badge>;
    if (sub.status === "cancelled") return <Badge variant="secondary" data-testid="sub-status">Cancelled</Badge>;
    return <Badge variant="secondary" data-testid="sub-status">{sub.status}</Badge>;
  };

  return (
    <div className="bg-slate-50 min-h-screen" data-testid="student-dashboard">
      <div className="container-x py-12">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <div className="eyebrow">Student dashboard</div>
            <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight">Hi, {user.name?.split(" ")[0]} 👋</h1>
            <p className="mt-1 text-slate-600">{user.role === "student_highschool" ? "High School student" : user.role === "student_university" ? "University student" : user.role}</p>
          </div>
          <div className="flex gap-2">
            <Link to="/pricing"><Button variant="outline" className="rounded-full">Change plan</Button></Link>
            <Link to="/contact"><Button className="rounded-full bg-[#050A15] hover:bg-[#111a34] text-white">Support</Button></Link>
          </div>
        </div>

        {/* Notifications */}
        {notes.length > 0 && (
          <div className="mt-8 space-y-3" data-testid="notifications">
            {notes.map((n, i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
                <AlertCircle className="mt-0.5 h-5 w-5 flex-none" />
                <div>
                  <div className="font-semibold">{n.title}</div>
                  <div className="text-sm">{n.message}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card data-testid="card-subscription">
            <div className="flex items-center justify-between">
              <div className="eyebrow">Subscription</div>
              {statusBadge()}
            </div>
            {sub ? (
              <>
                <div className="mt-4 font-display text-2xl font-semibold">{sub.plan_name}</div>
                <div className="mt-1 text-slate-600">R{sub.amount_zar} / month</div>
                <div className="mt-5 space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-slate-700"><Calendar className="h-4 w-4 text-[#1D4ED8]" /> Next payment: <strong>{fmtDate(sub.next_payment_date)}</strong></div>
                  <div className="flex items-center gap-2 text-slate-700"><CreditCard className="h-4 w-4 text-[#1D4ED8]" /> Outstanding: <strong>R{sub.outstanding_zar ?? 0}</strong></div>
                </div>
                <div className="mt-6 flex flex-wrap gap-2">
                  {sub.status === "pending_payment" && sub.paystack_url && (
                    <>
                      <a href={sub.paystack_url} target="_blank" rel="noopener noreferrer">
                        <Button className="rounded-full bg-[#1D4ED8] hover:bg-[#1E40AF]" data-testid="pay-paystack">Pay with Paystack</Button>
                      </a>
                      <Button variant="outline" onClick={confirmPaid} className="rounded-full" data-testid="confirm-paid">I've paid</Button>
                    </>
                  )}
                  {sub.status === "active" && (
                    <Button onClick={cancel} variant="outline" className="rounded-full text-red-600 border-red-200 hover:bg-red-50" data-testid="cancel-sub">
                      <XCircle className="mr-2 h-4 w-4" /> Cancel subscription
                    </Button>
                  )}
                  {sub.status === "cancelled" && (
                    <Button onClick={() => nav("/pricing")} className="rounded-full bg-[#1D4ED8] hover:bg-[#1E40AF]">Resubscribe</Button>
                  )}
                </div>
              </>
            ) : (
              <>
                <p className="mt-4 text-slate-600">No active subscription.</p>
                <Button onClick={() => nav("/pricing")} className="mt-4 rounded-full bg-[#1D4ED8] hover:bg-[#1E40AF]" data-testid="see-plans">See plans</Button>
              </>
            )}
          </Card>

          <Card data-testid="card-enrollments" className="lg:col-span-2">
            <div className="flex items-center justify-between">
              <div className="eyebrow">Modules &amp; tutors</div>
              <Badge variant="secondary">{enrolls.length} enrolled</Badge>
            </div>
            {loading ? (
              <p className="mt-4 text-slate-400">Loading…</p>
            ) : enrolls.length === 0 ? (
              <div className="mt-6 rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
                <BookOpen className="mx-auto h-8 w-8 text-slate-400" />
                <p className="mt-3">No modules yet. Once an admin assigns tutors, they'll appear here.</p>
              </div>
            ) : (
              <div className="mt-5 divide-y divide-slate-100">
                {enrolls.map((e) => (
                  <div key={e.id} className="flex items-center justify-between py-5" data-testid={`enroll-${e.id}`}>
                    <div>
                      <div className="font-semibold">{e.module?.name || "Module"}</div>
                      <div className="text-xs uppercase tracking-[0.2em] text-slate-500">{e.module?.code}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      {e.tutor ? (
                        <div className="flex items-center gap-2 text-sm">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EFF6FF] text-[#1D4ED8]"><User2 className="h-4 w-4" /></div>
                          <div>
                            <div className="font-medium">{e.tutor.name}</div>
                            <a href={`mailto:${e.tutor.email}`} className="text-xs text-slate-500 hover:text-[#1D4ED8]">{e.tutor.email}</a>
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-amber-700">Awaiting tutor assignment</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="lg:col-span-3" data-testid="card-tips">
            <div className="eyebrow">Next steps</div>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-500" /><div><div className="font-semibold">Complete your subscription</div><div className="text-sm text-slate-600">Activate lessons by completing Paystack payment.</div></div></div>
              <div className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-500" /><div><div className="font-semibold">Meet your tutor</div><div className="text-sm text-slate-600">We'll assign and email your tutor within 24 hours.</div></div></div>
              <div className="flex items-start gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-500" /><div><div className="font-semibold">Join WhatsApp support</div><div className="text-sm text-slate-600">Use the floating WhatsApp button for instant help.</div></div></div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
