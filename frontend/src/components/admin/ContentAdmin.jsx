import React, { useState } from "react";
import { Pencil, Trash2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";

/* ========================== Modules ========================== */
const emptyModule = { level: "high_school", code: "", name: "", description: "", grade_range: "" };

function ModuleDialog({ open, onOpenChange, initial, onSaved }) {
  const [form, setForm] = useState(initial || emptyModule);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  React.useEffect(() => { setForm(initial || emptyModule); }, [initial, open]);

  const save = async () => {
    if (!form.code || !form.name || !form.description) {
      toast({ title: "Fill all required fields", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      if (initial?.id) {
        await api.patch(`/admin/modules/${initial.id}`, form);
        toast({ title: "Module updated" });
      } else {
        await api.post("/admin/modules", form);
        toast({ title: "Module created" });
      }
      onOpenChange(false);
      onSaved?.();
    } catch (e) {
      toast({ title: "Failed", description: e?.response?.data?.detail || e.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{initial?.id ? "Edit module" : "New module"}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Level</label>
            <div className="mt-2 flex gap-2">
              {[{ id: "high_school", label: "High School" }, { id: "university", label: "University" }].map((l) => (
                <button type="button" key={l.id} onClick={() => setForm({ ...form, level: l.id })}
                  className={`rounded-full border px-4 py-2 text-sm ${form.level === l.id ? "border-[#1D4ED8] bg-[#EFF6FF] text-[#1D4ED8]" : "border-slate-200"}`}
                  data-testid={`mod-level-${l.id}`}>{l.label}</button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Code</label>
              <Input className="mt-2 h-12" placeholder="e.g. HS-MAT" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} data-testid="mod-code" />
            </div>
            <div>
              <label className="text-sm font-medium">Grade range (optional)</label>
              <Input className="mt-2 h-12" placeholder="e.g. 8–12" value={form.grade_range || ""} onChange={(e) => setForm({ ...form, grade_range: e.target.value })} data-testid="mod-range" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Name</label>
            <Input className="mt-2 h-12" placeholder="Mathematics" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="mod-name" />
          </div>
          <div>
            <label className="text-sm font-medium">Description</label>
            <Textarea className="mt-2 min-h-[100px]" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} data-testid="mod-desc" />
          </div>
          <Button onClick={save} disabled={saving} className="w-full rounded-full bg-[#1D4ED8] hover:bg-[#1E40AF]" data-testid="mod-save">
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ModulesAdmin({ modules, onChange }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const { toast } = useToast();

  const del = async (m) => {
    if (!window.confirm(`Delete module "${m.name}"? This also removes existing enrollments for it.`)) return;
    try { await api.delete(`/admin/modules/${m.id}`); toast({ title: "Deleted" }); onChange?.(); }
    catch (e) { toast({ title: "Failed", description: e?.response?.data?.detail || e.message, variant: "destructive" }); }
  };

  const openNew = () => { setEditing(null); setOpen(true); };
  const openEdit = (m) => { setEditing(m); setOpen(true); };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{modules.length} modules · managed from here</p>
        <Button onClick={openNew} className="rounded-full bg-[#1D4ED8] hover:bg-[#1E40AF]" data-testid="new-module-btn">
          <Plus className="mr-2 h-4 w-4" /> New module
        </Button>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-[0.18em] text-slate-500">
            <tr><th className="p-4">Code</th><th className="p-4">Name</th><th className="p-4">Level</th><th className="p-4">Description</th><th className="p-4 text-right">Actions</th></tr>
          </thead>
          <tbody>
            {modules.map((m) => (
              <tr key={m.id} className="border-t border-slate-100 align-top" data-testid={`module-row-${m.id}`}>
                <td className="p-4 font-mono text-xs text-[#1D4ED8]">{m.code}</td>
                <td className="p-4 font-medium">{m.name}{m.grade_range ? <div className="text-xs text-slate-500">Grades {m.grade_range}</div> : null}</td>
                <td className="p-4"><Badge variant="secondary">{m.level.replace("_", " ")}</Badge></td>
                <td className="p-4 text-slate-600 max-w-md">{m.description}</td>
                <td className="p-4 text-right">
                  <div className="inline-flex gap-2">
                    <Button variant="outline" size="sm" className="rounded-full" onClick={() => openEdit(m)} data-testid={`edit-module-${m.id}`}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button variant="outline" size="sm" className="rounded-full border-red-200 text-red-600 hover:bg-red-50" onClick={() => del(m)} data-testid={`del-module-${m.id}`}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </td>
              </tr>
            ))}
            {modules.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-slate-400">No modules yet.</td></tr>}
          </tbody>
        </table>
      </div>
      <ModuleDialog open={open} onOpenChange={setOpen} initial={editing} onSaved={onChange} />
    </div>
  );
}

/* ========================== Pricing ========================== */
const emptyPlan = { name: "", audience: "high_school", price_zar: 0, period: "month", order: 0, features: [], popular: false };

function FeaturesEditor({ value, onChange }) {
  const [input, setInput] = useState("");
  const add = () => {
    const v = input.trim();
    if (!v) return;
    onChange([...(value || []), v]);
    setInput("");
  };
  return (
    <div>
      <label className="text-sm font-medium">Features</label>
      <div className="mt-2 flex gap-2">
        <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }} placeholder="Add a feature and press Enter" data-testid="plan-feature-input" />
        <Button type="button" onClick={add} variant="outline" className="rounded-full" data-testid="plan-feature-add">Add</Button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {(value || []).map((f, i) => (
          <span key={i} className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs">
            {f}
            <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} aria-label="Remove feature" className="text-slate-400 hover:text-red-600">
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}

function PlanDialog({ open, onOpenChange, initial, onSaved }) {
  const [form, setForm] = useState(initial || emptyPlan);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  React.useEffect(() => { setForm(initial || emptyPlan); }, [initial, open]);

  const save = async () => {
    if (!form.name || !form.price_zar) { toast({ title: "Name and price required", variant: "destructive" }); return; }
    setSaving(true);
    try {
      const payload = { ...form, price_zar: Number(form.price_zar), order: Number(form.order) };
      if (initial?.id) {
        await api.patch(`/admin/pricing/${initial.id}`, payload);
        toast({ title: "Plan updated" });
      } else {
        await api.post("/admin/pricing", payload);
        toast({ title: "Plan created" });
      }
      onOpenChange(false);
      onSaved?.();
    } catch (e) {
      toast({ title: "Failed", description: e?.response?.data?.detail || e.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{initial?.id ? "Edit plan" : "New pricing plan"}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Audience</label>
            <div className="mt-2 flex gap-2">
              {[{ id: "high_school", label: "High School" }, { id: "university", label: "University" }].map((l) => (
                <button type="button" key={l.id} onClick={() => setForm({ ...form, audience: l.id })}
                  className={`rounded-full border px-4 py-2 text-sm ${form.audience === l.id ? "border-[#1D4ED8] bg-[#EFF6FF] text-[#1D4ED8]" : "border-slate-200"}`}
                  data-testid={`plan-audience-${l.id}`}>{l.label}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Plan name</label>
            <Input className="mt-2 h-12" placeholder="e.g. High School • Essentials" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="plan-name" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Price (ZAR)</label>
              <Input className="mt-2 h-12" type="number" min={0} value={form.price_zar} onChange={(e) => setForm({ ...form, price_zar: e.target.value })} data-testid="plan-price" />
            </div>
            <div>
              <label className="text-sm font-medium">Period</label>
              <Input className="mt-2 h-12" value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} data-testid="plan-period" />
            </div>
            <div>
              <label className="text-sm font-medium">Order</label>
              <Input className="mt-2 h-12" type="number" value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} data-testid="plan-order" />
            </div>
          </div>
          <FeaturesEditor value={form.features} onChange={(features) => setForm({ ...form, features })} />
          <label className="flex items-center gap-3">
            <input type="checkbox" checked={!!form.popular} onChange={(e) => setForm({ ...form, popular: e.target.checked })} className="h-4 w-4 rounded border-slate-300" data-testid="plan-popular" />
            <span className="text-sm">Mark as <strong>Most Popular</strong> (highlighted on pricing page)</span>
          </label>
          <Button onClick={save} disabled={saving} className="w-full rounded-full bg-[#1D4ED8] hover:bg-[#1E40AF]" data-testid="plan-save">
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function PricingAdmin({ plans, onChange }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const { toast } = useToast();

  const del = async (p) => {
    if (!window.confirm(`Delete plan "${p.name}"?`)) return;
    try { await api.delete(`/admin/pricing/${p.id}`); toast({ title: "Deleted" }); onChange?.(); }
    catch (e) { toast({ title: "Failed", description: e?.response?.data?.detail || e.message, variant: "destructive" }); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{plans.length} pricing plans · shown on /pricing</p>
        <Button onClick={() => { setEditing(null); setOpen(true); }} className="rounded-full bg-[#1D4ED8] hover:bg-[#1E40AF]" data-testid="new-plan-btn">
          <Plus className="mr-2 h-4 w-4" /> New plan
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {plans.map((p) => (
          <div key={p.id} className={`relative rounded-2xl border p-6 ${p.popular ? "border-[#1D4ED8] bg-[#EFF6FF]" : "border-slate-200 bg-white"}`} data-testid={`plan-card-${p.id}`}>
            {p.popular && <div className="absolute right-4 top-4 rounded-full bg-[#1D4ED8] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">Popular</div>}
            <div className="text-xs uppercase tracking-[0.2em] text-slate-500">{p.audience === "high_school" ? "High School" : "University"}</div>
            <div className="mt-2 font-display text-xl font-semibold">{p.name}</div>
            <div className="mt-1 text-slate-600">R{p.price_zar} / {p.period}</div>
            <div className="mt-1 text-xs text-slate-400">Order: {p.order ?? 0}</div>
            <ul className="mt-4 space-y-1 text-sm text-slate-700">
              {(p.features || []).slice(0, 4).map((f, i) => <li key={i}>• {f}</li>)}
              {(p.features || []).length > 4 && <li className="text-slate-400">+{p.features.length - 4} more</li>}
            </ul>
            <div className="mt-4 flex gap-2">
              <Button variant="outline" size="sm" className="rounded-full" onClick={() => { setEditing(p); setOpen(true); }} data-testid={`edit-plan-${p.id}`}><Pencil className="mr-1 h-3.5 w-3.5" /> Edit</Button>
              <Button variant="outline" size="sm" className="rounded-full border-red-200 text-red-600 hover:bg-red-50" onClick={() => del(p)} data-testid={`del-plan-${p.id}`}><Trash2 className="mr-1 h-3.5 w-3.5" /> Delete</Button>
            </div>
          </div>
        ))}
        {plans.length === 0 && <div className="col-span-full rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-400">No plans yet.</div>}
      </div>
      <PlanDialog open={open} onOpenChange={setOpen} initial={editing} onSaved={onChange} />
    </div>
  );
}
