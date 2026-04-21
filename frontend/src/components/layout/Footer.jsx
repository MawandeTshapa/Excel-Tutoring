import React from "react";
import { Link } from "react-router-dom";
import { GraduationCap, Mail, Phone, MapPin } from "lucide-react";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-[#050A15] text-white" data-testid="site-footer">
      <div className="container-x py-20">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-5">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-white text-[#050A15]">
                <GraduationCap className="h-5 w-5" />
              </div>
              <div className="font-display text-lg font-semibold">Excel Tutoring</div>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-400">
              Online tutoring for South African high school (CAPS) and university students. Distinctions through clarity, structure, and care.
            </p>
            <div className="mt-6 space-y-2 text-sm text-slate-400">
              <p className="flex items-center gap-2"><Mail className="h-4 w-4" /> mwandarh@gmail.com</p>
              <p className="flex items-center gap-2"><Phone className="h-4 w-4" /> +27 78 124 6757</p>
              <p className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Johannesburg, South Africa</p>
            </div>
          </div>

          <div>
            <div className="eyebrow eyebrow-inverse">Programs</div>
            <ul className="mt-4 space-y-2 text-sm text-slate-300">
              <li><Link to="/high-school" className="hover:text-white">High School</Link></li>
              <li><Link to="/university" className="hover:text-white">University</Link></li>
              <li><Link to="/pricing" className="hover:text-white">Pricing</Link></li>
              <li><Link to="/tutor-apply" className="hover:text-white">Become a Tutor</Link></li>
            </ul>
          </div>

          <div>
            <div className="eyebrow eyebrow-inverse">Company</div>
            <ul className="mt-4 space-y-2 text-sm text-slate-300">
              <li><Link to="/testimonials" className="hover:text-white">Testimonials</Link></li>
              <li><Link to="/faq" className="hover:text-white">FAQ</Link></li>
              <li><Link to="/contact" className="hover:text-white">Contact</Link></li>
            </ul>
          </div>

          <div>
            <div className="eyebrow eyebrow-inverse">Legal</div>
            <ul className="mt-4 space-y-2 text-sm text-slate-300">
              <li><Link to="/terms" className="hover:text-white">Terms &amp; Conditions</Link></li>
              <li><Link to="/privacy" className="hover:text-white">Privacy Policy</Link></li>
              <li><Link to="/refund" className="hover:text-white">Refund Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-8 md:flex-row md:items-center">
          <p className="text-xs text-slate-500">© {year} Excel Tutoring. All rights reserved.</p>
          <p className="text-xs text-slate-500">Built for South African students. Proudly ZAR (R).</p>
        </div>
      </div>
    </footer>
  );
}
