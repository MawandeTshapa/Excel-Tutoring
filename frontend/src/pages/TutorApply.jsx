import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";

const SUBJECTS = [
  "Mathematics", "Physical Sciences", "Life Sciences",
  "University Mathematics", "Statistics", "Computer Science", "Chemistry"
];

export default function TutorApply() {
  const [form, setForm] = useState({
    full_name: "", email: "", phone: "",
    qualification: "", subjects: [], level: "both",
    experience_years: 0, bio: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const toggleSubject = (s) => {
    setForm((f) => f.subjects.includes(s)
      ? { ...f, subjects: f.subjects.filter((x) => x !== s) }
      : { ...f, subjects: [...f.subjects, s] });
  };

  const submit = async (e) => {
    e.preventDefault();
    if (form.subjects.length === 0) { toast({ title: "Pick at least one subject", variant: "destructive" }); return; }
    setSubmitting(true);
    try {
      const { data } = await api.post("/tutors/apply", form);
      toast({ title: "Application received", description: data.message });
      setForm({ full_name: "", email: "", phone: "", qualification: "", subjects: [], level: "both", experience_years: 0, bio: "" });
    } catch (err) {
      toast({ title: "Failed", description: err?.response?.data?.detail || err.message, variant: "destructive" });
    } finally { setSubmitting(false); }
  };

  return (
    <div data-testid="tutor-apply-page">
      <section className="relative overflow-hidden bg-[#050A15] text-white">
        <div className="absolute inset-0 hero-grid-bg opacity-40" />
        <div className="container-x relative py-24 md:py-28">
          <div className="eyebrow eyebrow-inverse">Careers</div>
          <h1 className="mt-4 font-display text-5xl font-semibold tracking-tighter md:text-7xl">Tutor with Excel.</h1>
          <p className="mt-6 max-w-2xl text-lg text-slate-300">Teach students across South Africa, set your own schedule, and earn in Rands. We take care of matching, scheduling and billing.</p>
        </div>
      </section>

      <section className="section bg-white">
        <div className="container-x max-w-3xl">
          <form onSubmit={submit} className="space-y-6 rounded-2xl border border-slate-200 p-8" data-testid="tutor-form">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium">Full name</label>
                <Input className="mt-2 h-12" required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} data-testid="tutor-name" />
              </div>
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input className="mt-2 h-12" required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} data-testid="tutor-email" />
              </div>
              <div>
                <label className="text-sm font-medium">Phone</label>
                <Input className="mt-2 h-12" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} data-testid="tutor-phone" />
              </div>
              <div>
                <label className="text-sm font-medium">Experience (years)</label>
                <Input className="mt-2 h-12" type="number" min={0} value={form.experience_years} onChange={(e) => setForm({ ...form, experience_years: Number(e.target.value) })} data-testid="tutor-experience" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Qualification</label>
              <Input className="mt-2 h-12" required placeholder="e.g. BSc Mathematics, University of Johannesburg" value={form.qualification} onChange={(e) => setForm({ ...form, qualification: e.target.value })} data-testid="tutor-qualification" />
            </div>
            <div>
              <label className="text-sm font-medium">Level</label>
              <div className="mt-3 flex flex-wrap gap-2">
                {[
                  { id: "high_school", label: "High School" },
                  { id: "university", label: "University" },
                  { id: "both", label: "Both" },
                ].map((l) => (
                  <button
                    type="button"
                    key={l.id}
                    onClick={() => setForm({ ...form, level: l.id })}
                    className={`rounded-full border px-4 py-2 text-sm transition-colors ${form.level === l.id ? "border-[#1D4ED8] bg-[#EFF6FF] text-[#1D4ED8]" : "border-slate-200 text-slate-700 hover:border-slate-300"}`}
                    data-testid={`tutor-level-${l.id}`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Subjects (select all that apply)</label>
              <div className="mt-3 flex flex-wrap gap-2">
                {SUBJECTS.map((s) => (
                  <button
                    type="button"
                    key={s}
                    onClick={() => toggleSubject(s)}
                    className={`rounded-full border px-4 py-2 text-sm transition-colors ${form.subjects.includes(s) ? "border-[#1D4ED8] bg-[#EFF6FF] text-[#1D4ED8]" : "border-slate-200 text-slate-700 hover:border-slate-300"}`}
                    data-testid={`tutor-subject-${s}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Short bio</label>
              <Textarea className="mt-2 min-h-[140px]" required placeholder="Tell us about your teaching style and impact." value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} data-testid="tutor-bio" />
            </div>
            <Button disabled={submitting} className="rounded-full bg-[#1D4ED8] hover:bg-[#1E40AF] py-6 px-8 text-white" data-testid="tutor-submit">
              {submitting ? "Submitting…" : "Submit application"}
            </Button>
          </form>
        </div>
      </section>
    </div>
  );
}
