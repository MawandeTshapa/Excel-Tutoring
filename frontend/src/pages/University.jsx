import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";

export default function University() {
  const [mods, setMods] = useState([]);
  useEffect(() => { api.get("/modules").then((r) => setMods(r.data.filter((m) => m.level === "university"))); }, []);

  return (
    <div data-testid="university-page">
      <section className="relative overflow-hidden bg-[#050A15] text-white">
        <div className="absolute inset-0 hero-grid-bg opacity-40" />
        <div className="container-x relative grid grid-cols-1 gap-16 py-24 md:py-32 lg:grid-cols-12">
          <div className="lg:col-span-7 stagger">
            <div className="eyebrow eyebrow-inverse">University • Foundation modules</div>
            <h1 className="mt-4 font-display text-5xl font-semibold tracking-tighter md:text-7xl">From semester stress to semester results.</h1>
            <p className="mt-6 max-w-xl text-lg text-slate-300">Targeted tutoring for Mathematics, Statistics, Computer Science and Chemistry — including assignment support and exam intensives.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/pricing"><Button className="rounded-full bg-[#1D4ED8] px-8 py-6 hover:bg-[#1E40AF] blue-glow">See pricing</Button></Link>
              <Link to="/signup"><Button variant="outline" className="rounded-full border-white/30 bg-transparent px-8 py-6 text-white hover:bg-white hover:text-[#050A15]">Get started</Button></Link>
            </div>
          </div>
          <div className="lg:col-span-5">
            <img src="https://images.pexels.com/photos/6684506/pexels-photo-6684506.jpeg" alt="University students" className="w-full rounded-3xl object-cover shadow-2xl" style={{ aspectRatio: "4/5" }} />
          </div>
        </div>
      </section>

      <section className="section bg-white">
        <div className="container-x">
          <div className="eyebrow">Modules</div>
          <h2 className="mt-4 font-display text-4xl font-semibold tracking-tight md:text-5xl">Core modules we tutor.</h2>
          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {mods.map((m) => (
              <div key={m.id} className="rounded-2xl border border-slate-200 bg-white p-7 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-900/5" data-testid={`uni-module-${m.id}`}>
                <div className="text-xs font-semibold uppercase tracking-[0.22em] text-[#1D4ED8]">{m.code}</div>
                <h3 className="mt-3 font-display text-xl font-semibold">{m.name}</h3>
                <p className="mt-3 text-sm text-slate-600">{m.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section bg-slate-50">
        <div className="container-x grid grid-cols-1 gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <div className="eyebrow">Why it works</div>
            <h2 className="mt-4 font-display text-4xl font-semibold tracking-tight md:text-5xl">Built for demanding semesters.</h2>
            <p className="mt-6 text-slate-600 text-lg">We tutor the way university actually tests: thorough, structured, question-by-question — with past paper walkthroughs and assignment support.</p>
          </div>
          <ul className="lg:col-span-7 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[
              "1-on-1 tutor matching",
              "Assignment & tutorial help",
              "Past paper walkthroughs",
              "Exam intensives",
              "Flexible scheduling",
              "Recorded lessons",
            ].map((f) => (
              <li key={f} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-5">
                <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-[#EFF6FF] text-[#1D4ED8]"><Check className="h-4 w-4" /></div>
                <span className="text-slate-700">{f}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section bg-[#1D4ED8] text-white">
        <div className="container-x flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <h2 className="font-display text-3xl font-semibold md:text-5xl">Ready for your next module?</h2>
          <Link to="/pricing"><Button className="rounded-full bg-white px-8 py-6 text-[#050A15] hover:bg-slate-100">View plans <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
        </div>
      </section>
    </div>
  );
}
