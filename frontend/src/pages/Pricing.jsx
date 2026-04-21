import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Check, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";

function Plan({ p, onSubscribe }) {
  const popular = p.popular;
  return (
    <div className={`relative flex flex-col rounded-3xl border p-8 transition-all ${popular ? "border-[#1D4ED8] bg-[#EFF6FF] shadow-xl" : "border-slate-200 bg-white"}`} data-testid={`pricing-plan-${p.id}`}>
      {popular && (
        <div className="absolute -top-3 left-8 flex items-center gap-1 rounded-full bg-[#1D4ED8] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white">
          <Star className="h-3 w-3 fill-white" /> Most popular
        </div>
      )}
      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{p.audience === "high_school" ? "High School" : "University"}</div>
      <h3 className="mt-3 font-display text-2xl font-semibold">{p.name}</h3>
      <div className="mt-6 flex items-baseline gap-1">
        <span className="font-display text-5xl font-semibold tracking-tighter">R{p.price_zar}</span>
        <span className="text-slate-500">/ month</span>
      </div>
      <ul className="mt-6 space-y-3">
        {p.features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-slate-700">
            <Check className="mt-0.5 h-4 w-4 flex-none text-[#1D4ED8]" /> {f}
          </li>
        ))}
      </ul>
      <Button
        onClick={() => onSubscribe(p)}
        className={`mt-8 rounded-full py-6 ${popular ? "bg-[#1D4ED8] hover:bg-[#1E40AF] text-white" : "bg-[#050A15] hover:bg-[#111a34] text-white"}`}
        data-testid={`pricing-subscribe-${p.id}`}
      >
        Subscribe with Paystack
      </Button>
    </div>
  );
}

export default function Pricing() {
  const [plans, setPlans] = useState([]);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => { api.get("/pricing").then((r) => setPlans(r.data)); }, []);

  const onSubscribe = async (plan) => {
    if (!user) {
      toast({ title: "Please sign in first", description: "Create an account or log in to subscribe." });
      navigate("/signup");
      return;
    }
    if (!["student_highschool", "student_university"].includes(user.role)) {
      toast({ title: "Students only", description: "Subscriptions are for student accounts." });
      return;
    }
    try {
      const { data } = await api.post("/student/subscribe", { plan_id: plan.id });
      if (data.paystack_url) {
        toast({ title: "Redirecting to Paystack", description: "Complete your payment to activate lessons." });
        window.open(data.paystack_url, "_blank", "noopener,noreferrer");
        navigate("/dashboard");
      }
    } catch (e) {
      toast({ title: "Could not start checkout", description: e?.response?.data?.detail || e.message, variant: "destructive" });
    }
  };

  const hs = plans.filter((p) => p.audience === "high_school");
  const uni = plans.filter((p) => p.audience === "university");

  return (
    <div data-testid="pricing-page">
      <section className="relative overflow-hidden bg-[#050A15] text-white">
        <div className="absolute inset-0 hero-grid-bg opacity-40" />
        <div className="container-x relative py-24 md:py-28">
          <div className="eyebrow eyebrow-inverse">Pricing</div>
          <h1 className="mt-4 font-display text-5xl font-semibold tracking-tighter md:text-7xl">Plans in Rands. No surprises.</h1>
          <p className="mt-6 max-w-2xl text-lg text-slate-300">Monthly subscriptions. Cancel anytime from your dashboard. All billing is handled securely via Paystack.</p>
        </div>
      </section>

      <section className="section bg-white">
        <div className="container-x">
          <div className="eyebrow">High School</div>
          <h2 className="mt-3 font-display text-3xl font-semibold md:text-4xl">For Grades 8–12</h2>
          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
            {hs.map((p) => <Plan key={p.id} p={p} onSubscribe={onSubscribe} />)}
          </div>
        </div>
      </section>

      <section className="section bg-slate-50">
        <div className="container-x">
          <div className="eyebrow">University</div>
          <h2 className="mt-3 font-display text-3xl font-semibold md:text-4xl">For undergraduate students</h2>
          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
            {uni.map((p) => <Plan key={p.id} p={p} onSubscribe={onSubscribe} />)}
          </div>
          <p className="mt-8 text-sm text-slate-500">Need something bespoke? <Link to="/contact" className="font-semibold text-[#1D4ED8] hover:underline">Contact us</Link> for custom plans.</p>
        </div>
      </section>
    </div>
  );
}
