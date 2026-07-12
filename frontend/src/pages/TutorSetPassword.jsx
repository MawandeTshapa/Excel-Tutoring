import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import api, { formatApiError } from "@/lib/api";

export default function TutorSetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [invite, setInvite] = useState(null);
  const [inviteError, setInviteError] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/tutors/invite/${token}`);
        setInvite(data);
      } catch (err) {
        setInviteError(formatApiError(err));
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const submit = async (e) => {
    e.preventDefault();
    if (password.length < 6) { toast({ title: "Password too short", description: "Use at least 6 characters.", variant: "destructive" }); return; }
    if (password !== confirm) { toast({ title: "Passwords don't match", variant: "destructive" }); return; }
    setSubmitting(true);
    try {
      const { data } = await api.post(`/tutors/invite/${token}/complete`, { password });
      setUser(data);
      toast({ title: "Welcome to Excel Tutoring!", description: "Your account is ready." });
      navigate("/tutor");
    } catch (err) {
      toast({ title: "Couldn't set your password", description: formatApiError(err), variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#1D4ED8] border-t-transparent" />
      </div>
    );
  }

  if (inviteError) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-6" data-testid="tutor-invite-error">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-10 text-center">
          <h1 className="font-display text-2xl font-semibold">This link isn't valid</h1>
          <p className="mt-2 text-slate-600">{inviteError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center p-8" data-testid="tutor-invite-page">
      <form onSubmit={submit} className="w-full max-w-md space-y-6" data-testid="tutor-invite-form">
        <div>
          <div className="eyebrow">Welcome, {invite.full_name.split(" ")[0]}</div>
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">Set your password</h1>
          <p className="mt-2 text-slate-600">You've been approved to tutor with Excel. Choose a password for {invite.email} to finish setting up your account.</p>
        </div>
        <div>
          <label className="text-sm font-medium">New password</label>
          <Input className="mt-2 h-12" required type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} data-testid="tutor-invite-password" />
        </div>
        <div>
          <label className="text-sm font-medium">Confirm password</label>
          <Input className="mt-2 h-12" required type="password" minLength={6} value={confirm} onChange={(e) => setConfirm(e.target.value)} data-testid="tutor-invite-confirm" />
        </div>
        <Button disabled={submitting} className="w-full rounded-full bg-[#1D4ED8] hover:bg-[#1E40AF] h-12" data-testid="tutor-invite-submit">
          {submitting ? "Setting up your account…" : "Set password & continue"}
        </Button>
      </form>
    </div>
  );
}