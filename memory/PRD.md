# Excel Tutoring — Product Requirements Document

## Original Problem Statement
Redesign & upgrade of the Excel Tutoring website — a premium, professional tutoring platform for South African high school and university students. Build from scratch, avoid the original look. Include student + admin accounts, tutor applications, paid monthly subscriptions (Paystack, ZAR), legal pages, testimonials with moderation, FAQ, WhatsApp chat.

## Tech Stack
- **Backend**: FastAPI (Python) + Motor (async MongoDB). Single `server.py` for MVP.
- **Frontend**: React 19 + React Router 7 + Tailwind 3 + shadcn/ui.
- **Typography**: Outfit (headings) + Manrope (body). Color: dark #050A15 + white + blue accent #1D4ED8.
- **Auth**: Custom JWT email/password (httpOnly cookies, bcrypt, brute-force lockout) + Emergent Google OAuth session flow (unified `users` collection).
- **Payments**: Paystack hosted payment page (https://paystack.shop/pay/58ayfebh60). Manual "I've paid" confirm for MVP (webhooks not wired).

## User Personas
1. **High School student (CAPS)** — Grades 8–12 needing Math / Physical / Life Sciences help.
2. **University student** — foundational Math, Stats, CS, Chemistry support.
3. **Tutor (applicant)** — applies via public form, approved by admin.
4. **Admin** — manages students, tutors, subscriptions, testimonials, content and analytics.

## Core Requirements (static)
- Monthly subscriptions in ZAR with cancel-anytime and dashboard visibility (next payment date, outstanding, status).
- Signup/login + Google sign-in + role-based onboarding.
- Public pages: Home, High School, University, Pricing, Contact, FAQ, Testimonials (submit + view), Tutor Apply, Privacy, Refund, Terms.
- Student dashboard: enrolled modules, assigned tutors, subscription management, notifications.
- Admin dashboard: analytics, student & tutor management, tutor app approvals, subscription view, testimonial moderation, tutor/module assignment, contact messages.
- Floating WhatsApp button (wa.me/27781246757).

## What's Been Implemented — 2026-01
- Complete backend with 30+ endpoints (auth, public, student, admin), MongoDB seed (7 modules, 4 plans, 4 testimonials, admin + 2 demo students).
- Complete frontend: 16 pages, responsive, dark+white+blue premium design, Outfit/Manrope fonts, shadcn/ui components, `data-testid`s throughout.
- Auth: JWT (httpOnly, SameSite=None, Secure), Emergent Google OAuth (/auth/callback route, session_id hash handling), brute-force lockout with X-Forwarded-For support.
- Paystack: hosted-link subscription flow with manual confirmation.
- Full admin control panel with 5 tabs + assign dialog.
- Testing: 26/27 backend + 100% frontend pass (iteration_1).
- SEO: branded `<title>` and meta description.

## Backlog / Future Enhancements
- P1: Real Paystack subscriptions + webhook verification + automatic next_payment_date rollover.
- P1: Email notifications (SendGrid/Resend) for signup, payment, cancellation, tutor approval with temp password.
- P2: Tutor dashboard (own students, schedule, availability).
- P2: In-app lesson scheduling + video meeting link generation.
- P2: Content CMS for modules/pricing from admin UI (currently seed-driven).
- P2: Live chat widget (replace WhatsApp float) — optional.
- P3: Analytics charts (line/bar) using recharts (monthly_signups already returned).
- P3: Password reset via email link (backend hooks ready, frontend missing).
- P3: Referral program for shareability.

## Next Tasks (for next session)
1. Wire up real Paystack API subscriptions with webhook-based confirmation.
2. Add SendGrid / Resend email notifications.
3. Build tutor dashboard.
4. Add admin "Modules & Pricing" editor UI.

## Key Files
- Backend: `/app/backend/server.py`, `/app/backend/.env`
- Frontend entry: `/app/frontend/src/App.js`, pages under `/app/frontend/src/pages/`
- Layout: `/app/frontend/src/components/layout/`
- Design guidelines: `/app/design_guidelines.json`
- Auth testing: `/app/auth_testing.md`
- Credentials: `/app/memory/test_credentials.md`
