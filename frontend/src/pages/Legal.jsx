import React from "react";

export function Privacy() {
  return (
    <LegalShell title="Privacy Policy" subtitle="Last updated January 2026" testid="privacy-page">
      <p>Excel Tutoring (“we”, “us”) respects your privacy and is committed to protecting your personal information in line with South Africa's POPIA.</p>
      <h3>Information we collect</h3>
      <p>Account details (name, email, phone), billing data handled by Paystack, lesson attendance and progress data, and support communications.</p>
      <h3>How we use your information</h3>
      <p>To deliver tutoring, manage payments, provide support, send service notifications, and improve the platform. We do not sell your data.</p>
      <h3>Data retention</h3>
      <p>We retain account and billing data while your account is active and for up to 5 years thereafter (tax &amp; compliance).</p>
      <h3>Your rights</h3>
      <p>You may request access, correction or deletion of your data by emailing <a className="text-[#1D4ED8] hover:underline" href="mailto:mwandarh@gmail.com">mwandarh@gmail.com</a>.</p>
    </LegalShell>
  );
}

export function Refund() {
  return (
    <LegalShell title="Refund Policy" subtitle="Monthly subscriptions in ZAR" testid="refund-page">
      <p>Our subscriptions are billed monthly. You can cancel anytime from your Student Dashboard.</p>
      <h3>Cancellation</h3>
      <p>Cancelling stops the next billing cycle. You retain access for the remainder of the current paid month.</p>
      <h3>Refunds</h3>
      <p>Given the digital nature of live lessons, refunds are handled on a case-by-case basis. If you experience a service failure, email <a className="text-[#1D4ED8] hover:underline" href="mailto:mwandarh@gmail.com">mwandarh@gmail.com</a> within 7 days for a review.</p>
      <h3>Chargebacks</h3>
      <p>Please contact us before initiating a chargeback — we aim to resolve every issue quickly and fairly.</p>
    </LegalShell>
  );
}

export function Terms() {
  return (
    <LegalShell title="Terms & Conditions" subtitle="Please read carefully" testid="terms-page">
      <p>By creating an account or subscribing, you agree to these Terms.</p>
      <h3>Services</h3>
      <p>We provide online tutoring and related digital resources. Tutor allocation is subject to availability.</p>
      <h3>Payment</h3>
      <p>Monthly subscriptions are charged in ZAR via Paystack. Subscriptions renew automatically until cancelled.</p>
      <h3>User conduct</h3>
      <p>Students must attend scheduled sessions and treat tutors with respect. Recording sessions without consent is prohibited.</p>
      <h3>Liability</h3>
      <p>Excel Tutoring is not liable for academic outcomes or indirect damages. Our total liability is limited to amounts paid in the preceding 3 months.</p>
      <h3>Governing law</h3>
      <p>These Terms are governed by the laws of the Republic of South Africa.</p>
    </LegalShell>
  );
}

function LegalShell({ title, subtitle, children, testid }) {
  return (
    <div data-testid={testid}>
      <section className="relative overflow-hidden bg-[#050A15] text-white">
        <div className="absolute inset-0 hero-grid-bg opacity-40" />
        <div className="container-x relative py-20 md:py-24">
          <div className="eyebrow eyebrow-inverse">Legal</div>
          <h1 className="mt-4 font-display text-5xl font-semibold tracking-tighter md:text-6xl">{title}</h1>
          <p className="mt-4 text-slate-400">{subtitle}</p>
        </div>
      </section>
      <section className="section bg-white">
        <div className="container-x max-w-3xl prose prose-slate prose-headings:font-display prose-headings:tracking-tight">
          <div className="space-y-4 text-slate-700 leading-relaxed">{children}</div>
        </div>
      </section>
    </div>
  );
}
