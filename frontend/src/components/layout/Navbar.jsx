import React from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { Menu, X, GraduationCap } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

const links = [
  { to: "/", label: "Home" },
  { to: "/high-school", label: "High School" },
  { to: "/university", label: "University" },
  { to: "/pricing", label: "Pricing" },
  { to: "/testimonials", label: "Testimonials" },
  { to: "/tutor-apply", label: "Become a Tutor" },
  { to: "/contact", label: "Contact" },
];

export default function Navbar() {
  const [open, setOpen] = React.useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const dashHref = user?.role === "admin" ? "/admin" : "/dashboard";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/70 bg-white/85 backdrop-blur-xl" data-testid="site-header">
      <div className="container-x flex h-20 items-center justify-between">
        <Link to="/" className="flex items-center gap-2" data-testid="nav-logo">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#050A15] text-white">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div className="leading-none">
            <div className="font-display text-lg font-semibold tracking-tight">Excel Tutoring</div>
            <div className="text-[10px] uppercase tracking-[0.24em] text-slate-500">South Africa • Est. 2026</div>
          </div>
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `text-sm font-medium transition-colors ${isActive ? "text-[#1D4ED8]" : "text-slate-700 hover:text-[#1D4ED8]"}`
              }
              data-testid={`nav-${l.label.toLowerCase().replace(/\s+/g, "-")}`}
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {user ? (
            <>
              <Link to={dashHref}>
                <Button variant="ghost" className="rounded-full" data-testid="nav-dashboard">
                  Dashboard
                </Button>
              </Link>
              <Button
                onClick={async () => { await logout(); navigate("/"); }}
                className="rounded-full bg-[#050A15] hover:bg-[#111a34] text-white"
                data-testid="nav-logout"
              >
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" className="rounded-full" data-testid="nav-login">
                  Log in
                </Button>
              </Link>
              <Link to="/signup">
                <Button className="rounded-full bg-[#1D4ED8] hover:bg-[#1E40AF] text-white" data-testid="nav-signup">
                  Get started
                </Button>
              </Link>
            </>
          )}
        </div>

        <button
          className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
          data-testid="nav-mobile-toggle"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="lg:hidden border-t border-slate-200 bg-white">
          <div className="container-x flex flex-col gap-2 py-4">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} onClick={() => setOpen(false)} className="py-2 text-slate-800" data-testid={`mnav-${l.label.toLowerCase().replace(/\s+/g, "-")}`}>
                {l.label}
              </NavLink>
            ))}
            <div className="flex gap-3 pt-3">
              {user ? (
                <>
                  <Link to={dashHref} onClick={() => setOpen(false)} className="flex-1">
                    <Button className="w-full rounded-full">Dashboard</Button>
                  </Link>
                  <Button onClick={async () => { await logout(); setOpen(false); navigate("/"); }} className="flex-1 rounded-full bg-[#050A15] text-white">Logout</Button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setOpen(false)} className="flex-1">
                    <Button variant="outline" className="w-full rounded-full">Log in</Button>
                  </Link>
                  <Link to="/signup" onClick={() => setOpen(false)} className="flex-1">
                    <Button className="w-full rounded-full bg-[#1D4ED8] text-white">Sign up</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
