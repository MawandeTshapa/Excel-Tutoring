import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, Sparkles, Star, Award, Users, BookOpen, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";

function Stat({ num, label }) {
  return (
    <div className="flex flex-col">
      <div className="font-display text-5xl font-semibold tracking-tighter md:text-6xl" data-testid={`stat-${label}`}>{num}</div>
      <div className="mt-2 text-sm uppercase tracking-[0.2em] text-slate-500">{label}</div>
    </div>
  );
}

export default function Home() {
  const [tlist, setTlist] = useState([]);
  useEffect(() => {
    api.get("/testimonials").then((r) => setTlist(r.data.slice(0, 3))).catch(() => {});
  }, []);

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden bg-[#050A15] text-white" data-testid="hero-section">
        <div className="absolute inset-0 hero-grid-bg opacity-40" />
        <div className="absolute -right-24 -top-24 h-[560px] w-[560px] rounded-full bg-[#1D4ED8] blur-[160px] opacity-30" />
        <div className="container-x relative grid min-h-[88vh] grid-cols-1 items-center gap-16 py-24 lg:grid-cols-12">
          <div className="lg:col-span-7 stagger">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-300">
              <Sparkles className="h-3.5 w-3.5 text-[#60A5FA]" /> Premium tutoring for SA students
            </div>
            <h1 className="mt-8 font-display text-5xl font-semibold leading-[0.95] tracking-tighter md:text-7xl lg:text-[88px]">
              Distinctions<br />
              begin with <span className="text-[#60A5FA]">clarity.</span>
            </h1>
            <p className="mt-8 max-w-xl text-lg leading-relaxed text-slate-300">
              Excel Tutoring pairs South African high school and university students with expert tutors in Mathematics, Sciences, Statistics and Computer Science. Live lessons. Real results. Monthly plans in Rands.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link to="/high-school">
                <Button className="rounded-full bg-[#1D4ED8] px-8 py-6 text-base hover:bg-[#1E40AF] blue-glow" data-testid="hero-cta-highschool">
                  High School Program <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/university">
                <Button variant="outline" className="rounded-full border-white/30 bg-transparent px-8 py-6 text-base text-white hover:bg-white hover:text-[#050A15]" data-testid="hero-cta-university">
                  University Modules <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="mt-16 grid grid-cols-3 gap-8 border-t border-white/10 pt-10">
              <Stat num="500+" label="Students" />
              <Stat num="98%" label="Pass rate" />
              <Stat num="4.9★" label="Average rating" />
            </div>
          </div>

          <div className="lg:col-span-5 animate-fade-up">
            <div className="relative">
              <div className="absolute -inset-4 rounded-3xl bg-[#1D4ED8]/20 blur-2xl" />
              <img
                src="https://images.pexels.com/photos/6684506/pexels-photo-6684506.jpeg"
                alt="Students studying"
                className="relative w-full rounded-3xl object-cover shadow-2xl"
                style={{ aspectRatio: "4/5" }}
              />
              <div className="absolute -left-6 bottom-6 rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur-xl">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1D4ED8]"><Award className="h-5 w-5" /></div>
                  <div>
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-300">Registered</div>
                    <div className="font-medium">SA tutoring business</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* VALUE PROPS */}
      <section className="section bg-white" data-testid="value-section">
        <div className="container-x">
          <div className="grid grid-cols-1 gap-16 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <div className="eyebrow">Why Excel</div>
              <h2 className="mt-4 font-display text-4xl font-semibold tracking-tight md:text-5xl">A serious platform, for serious results.</h2>
              <p className="mt-6 text-lg text-slate-600">Every plan is designed with one outcome in mind: improved grades and real understanding. Live sessions, personal assignment and an admin who actually replies.</p>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:col-span-8">
              {[
                { icon: BookOpen, title: "CAPS-aligned & university-ready", text: "Curricula aligned to your syllabus — from Grade 8 to university core modules." },
                { icon: Users, title: "1-on-1 tutor matching", text: "We hand-pick tutors based on your subjects, goals and schedule." },
                { icon: TrendingUp, title: "Progress you can see", text: "Weekly reports, homework tracking and score trendlines in your dashboard." },
                { icon: Award, title: "Registered & trusted", text: "Officially registered SA business with a proven track record." },
              ].map((v) => (
                <div key={v.title} className="rounded-2xl border border-slate-200 bg-white p-8 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-900/5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#1D4ED8]">
                    <v.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-6 font-display text-xl font-semibold">{v.title}</h3>
                  <p className="mt-3 text-slate-600">{v.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* PROGRAMS PREVIEW */}
      <section className="section bg-slate-50" data-testid="programs-section">
        <div className="container-x">
          <div className="flex items-end justify-between gap-8">
            <div>
              <div className="eyebrow">Programs</div>
              <h2 className="mt-4 font-display text-4xl font-semibold tracking-tight md:text-5xl">Pick your level.</h2>
            </div>
            <Link to="/pricing" className="hidden md:inline-flex items-center gap-2 text-sm font-semibold text-[#1D4ED8] hover:underline">
              View pricing <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-2">
            <Link to="/high-school" className="group relative overflow-hidden rounded-3xl" data-testid="card-program-highschool">
              <img src="https://images.pexels.com/photos/6325934/pexels-photo-6325934.jpeg" alt="High school tutoring" className="aspect-[4/3] w-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#050A15] via-[#050A15]/50 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-10 text-white">
                <div className="eyebrow eyebrow-inverse">Grades 8–12</div>
                <h3 className="mt-3 font-display text-3xl font-semibold md:text-4xl">High School Tutoring</h3>
                <p className="mt-3 max-w-md text-slate-300">CAPS-aligned Mathematics, Physical &amp; Life Sciences. Weekly live lessons, homework help and exam prep.</p>
                <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold">Explore program <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></div>
              </div>
            </Link>

            <Link to="/university" className="group relative overflow-hidden rounded-3xl" data-testid="card-program-university">
              <img src="https://images.pexels.com/photos/6326370/pexels-photo-6326370.jpeg" alt="University tutoring" className="aspect-[4/3] w-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#050A15] via-[#050A15]/50 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-10 text-white">
                <div className="eyebrow eyebrow-inverse">University • Foundation</div>
                <h3 className="mt-3 font-display text-3xl font-semibold md:text-4xl">University Modules</h3>
                <p className="mt-3 max-w-md text-slate-300">Mathematics, Statistics, Computer Science &amp; Chemistry foundations across SA universities.</p>
                <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold">Explore modules <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="section bg-white" data-testid="testimonials-preview">
        <div className="container-x">
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
            <div>
              <div className="eyebrow">Stories</div>
              <h2 className="mt-4 font-display text-4xl font-semibold tracking-tight md:text-5xl">Students who got their distinctions.</h2>
            </div>
            <Link to="/testimonials" className="text-sm font-semibold text-[#1D4ED8] hover:underline">All testimonials →</Link>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            {tlist.length === 0 && <div className="text-slate-400">Loading…</div>}
            {tlist.map((t) => (
              <div key={t.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-8">
                <div className="flex gap-1">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-[#F59E0B] stroke-[#F59E0B]" />
                  ))}
                </div>
                <p className="mt-5 text-slate-700">“{t.message}”</p>
                <div className="mt-6 flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{t.name}</div>
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-500">{t.program}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section bg-[#1D4ED8] text-white" data-testid="cta-section">
        <div className="container-x grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <div className="eyebrow text-blue-200">Ready?</div>
            <h2 className="mt-4 font-display text-4xl font-semibold tracking-tight md:text-6xl">Start the term on the front foot.</h2>
            <p className="mt-4 max-w-xl text-blue-100 text-lg">Monthly plans in ZAR. Cancel anytime. First consultation is free.</p>
            <ul className="mt-8 space-y-2 text-blue-50">
              <li className="flex items-center gap-2"><Check className="h-4 w-4" /> Pay in Rands via Paystack</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4" /> Live online lessons, recorded for revision</li>
              <li className="flex items-center gap-2"><Check className="h-4 w-4" /> Assigned tutor + weekly progress report</li>
            </ul>
          </div>
          <div className="lg:col-span-4">
            <div className="flex flex-col gap-3">
              <Link to="/signup">
                <Button className="w-full rounded-full bg-white px-8 py-6 text-base text-[#050A15] hover:bg-slate-100" data-testid="cta-signup">Create your account</Button>
              </Link>
              <Link to="/pricing">
                <Button variant="outline" className="w-full rounded-full border-white/50 bg-transparent px-8 py-6 text-base text-white hover:bg-white hover:text-[#050A15]" data-testid="cta-pricing">See pricing</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
