import React, { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";

function StarPicker({ value, onChange }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          type="button"
          key={n}
          onClick={() => onChange(n)}
          aria-label={`${n} stars`}
          data-testid={`star-${n}`}
          className="p-1"
        >
          <Star className={`h-6 w-6 transition-colors ${n <= value ? "fill-[#F59E0B] stroke-[#F59E0B]" : "stroke-slate-300"}`} />
        </button>
      ))}
    </div>
  );
}

export default function Testimonials() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ name: "", message: "", rating: 5, program: "" });
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const load = () => api.get("/testimonials").then((r) => setItems(r.data));
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data } = await api.post("/testimonials", form);
      toast({ title: "Submitted", description: data.message });
      setForm({ name: "", message: "", rating: 5, program: "" });
    } catch (err) {
      toast({ title: "Failed to submit", description: err?.response?.data?.detail || err.message, variant: "destructive" });
    } finally { setSubmitting(false); }
  };

  return (
    <div data-testid="testimonials-page">
      <section className="relative overflow-hidden bg-[#050A15] text-white">
        <div className="absolute inset-0 hero-grid-bg opacity-40" />
        <div className="container-x relative py-24 md:py-28">
          <div className="eyebrow eyebrow-inverse">Reviews</div>
          <h1 className="mt-4 font-display text-5xl font-semibold tracking-tighter md:text-7xl">Words from our students.</h1>
        </div>
      </section>

      <section className="section bg-white">
        <div className="container-x grid grid-cols-1 gap-12 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {items.map((t) => (
                <div key={t.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-8" data-testid={`testimonial-${t.id}`}>
                  <div className="flex gap-1">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-[#F59E0B] stroke-[#F59E0B]" />
                    ))}
                  </div>
                  <p className="mt-4 text-slate-700">“{t.message}”</p>
                  <div className="mt-6">
                    <div className="font-semibold">{t.name}</div>
                    {t.program && <div className="text-xs uppercase tracking-[0.2em] text-slate-500">{t.program}</div>}
                  </div>
                </div>
              ))}
              {items.length === 0 && <p className="text-slate-500">No testimonials yet. Be the first!</p>}
            </div>
          </div>

          <form onSubmit={submit} className="lg:col-span-4 space-y-5 rounded-2xl border border-slate-200 p-8 h-fit" data-testid="testimonial-form">
            <div>
              <div className="eyebrow">Share your story</div>
              <h2 className="mt-2 font-display text-2xl font-semibold">Leave a review</h2>
              <p className="mt-1 text-sm text-slate-500">Reviews appear after admin approval.</p>
            </div>
            <div>
              <label className="text-sm font-medium">Name</label>
              <Input className="mt-2 h-12" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="t-name" />
            </div>
            <div>
              <label className="text-sm font-medium">Program / Module (optional)</label>
              <Input className="mt-2 h-12" value={form.program} onChange={(e) => setForm({ ...form, program: e.target.value })} placeholder="e.g. Grade 12 Mathematics" data-testid="t-program" />
            </div>
            <div>
              <label className="text-sm font-medium">Rating</label>
              <div className="mt-2"><StarPicker value={form.rating} onChange={(v) => setForm({ ...form, rating: v })} /></div>
            </div>
            <div>
              <label className="text-sm font-medium">Message</label>
              <Textarea className="mt-2 min-h-[120px]" required value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} data-testid="t-message" />
            </div>
            <Button disabled={submitting} className="w-full rounded-full bg-[#1D4ED8] hover:bg-[#1E40AF] py-6" data-testid="t-submit">
              {submitting ? "Submitting…" : "Submit"}
            </Button>
          </form>
        </div>
      </section>
    </div>
  );
}
