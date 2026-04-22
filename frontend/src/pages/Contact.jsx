import React, { useState } from "react";
import { Mail, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/contact", form);
      toast({ title: "Message sent", description: "We'll be in touch shortly." });
      setForm({ name: "", email: "", phone: "", message: "" });
    } catch (err) {
      toast({ title: "Failed to send", description: err?.response?.data?.detail || err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div data-testid="contact-page">
      <section className="relative overflow-hidden bg-[#050A15] text-white">
        <div className="absolute inset-0 hero-grid-bg opacity-40" />
        <div className="container-x relative py-24 md:py-28">
          <div className="eyebrow eyebrow-inverse">Contact</div>
          <h1 className="mt-4 font-display text-5xl font-semibold tracking-tighter md:text-7xl">Let's talk.</h1>
          <p className="mt-6 max-w-2xl text-lg text-slate-300">Questions about programs, pricing or becoming a tutor? We typically reply within 24 hours.</p>
        </div>
      </section>

      <section className="section bg-white">
        <div className="container-x grid grid-cols-1 gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5 space-y-8">
            <div className="rounded-2xl border border-slate-200 p-8">
              <div className="eyebrow">Contact details</div>
              <div className="mt-5 space-y-4 text-slate-700">
                <div className="flex items-center gap-3"><Mail className="h-5 w-5 text-[#1D4ED8]" /> <a href="mailto:mwandarh@gmail.com" className="hover:underline">mwandarh@gmail.com</a></div>
                <div className="flex items-center gap-3"><Phone className="h-5 w-5 text-[#1D4ED8]" /> <a href="tel:+27781246757" className="hover:underline">+27 78 124 6757</a></div>
                <div className="flex items-center gap-3"><MapPin className="h-5 w-5 text-[#1D4ED8]" /> Durban, KwaZulu-Natal, South Africa</div>
              </div>
            </div>
            <div className="rounded-2xl bg-[#EFF6FF] p-8">
              <div className="eyebrow">Fastest reply</div>
              <p className="mt-3 text-slate-700">Tap the WhatsApp button in the bottom right for an instant chat with our team.</p>
            </div>
          </div>
          <form onSubmit={submit} className="lg:col-span-7 rounded-2xl border border-slate-200 p-8 space-y-5" data-testid="contact-form">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-700">Name</label>
                <Input className="mt-2 h-12" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="contact-name" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Email</label>
                <Input className="mt-2 h-12" required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} data-testid="contact-email" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Phone (optional)</label>
              <Input className="mt-2 h-12" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} data-testid="contact-phone" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Message</label>
              <Textarea className="mt-2 min-h-[140px]" required value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} data-testid="contact-message" />
            </div>
            <Button type="submit" disabled={submitting} className="rounded-full bg-[#1D4ED8] hover:bg-[#1E40AF] px-8 py-6 text-white" data-testid="contact-submit">
              {submitting ? "Sending…" : "Send message"}
            </Button>
          </form>
        </div>
      </section>
    </div>
  );
}
