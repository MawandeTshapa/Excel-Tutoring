import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import api, { formatApiError } from "@/lib/api";

export default function PaymentCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [state, setState] = useState("checking"); // checking | active | failed | error
  const [error, setError] = useState("");

  useEffect(() => {
    const reference = params.get("reference") || params.get("trxref");
    if (!reference) {
      setState("error");
      setError("No payment reference was returned by Paystack.");
      return;
    }
    (async () => {
      try {
        const { data } = await api.get(`/payment/verify/${reference}`);
        setState(data.status === "active" ? "active" : "failed");
      } catch (err) {
        setState("error");
        setError(formatApiError(err));
      }
    })();
  }, [params]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6" data-testid="payment-callback-page">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-10 text-center">
        {state === "checking" && (
          <>
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-[#1D4ED8]" />
            <h1 className="mt-6 font-display text-2xl font-semibold">Confirming your payment…</h1>
            <p className="mt-2 text-slate-600">This only takes a moment.</p>
          </>
        )}
        {state === "active" && (
          <>
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
            <h1 className="mt-6 font-display text-2xl font-semibold">Payment successful</h1>
            <p className="mt-2 text-slate-600">Your subscription is now active. Welcome aboard!</p>
            <Button onClick={() => navigate("/dashboard")} className="mt-8 w-full rounded-full bg-[#1D4ED8] hover:bg-[#1E40AF]" data-testid="payment-go-dashboard">
              Go to dashboard
            </Button>
          </>
        )}
        {state === "failed" && (
          <>
            <XCircle className="mx-auto h-12 w-12 text-red-600" />
            <h1 className="mt-6 font-display text-2xl font-semibold">Payment not completed</h1>
            <p className="mt-2 text-slate-600">Paystack reported this transaction wasn't successful. No charge was made.</p>
            <Button onClick={() => navigate("/pricing")} className="mt-8 w-full rounded-full bg-[#1D4ED8] hover:bg-[#1E40AF]" data-testid="payment-try-again">
              Try again
            </Button>
          </>
        )}
        {state === "error" && (
          <>
            <XCircle className="mx-auto h-12 w-12 text-red-600" />
            <h1 className="mt-6 font-display text-2xl font-semibold">Couldn't confirm payment</h1>
            <p className="mt-2 text-slate-600">{error}</p>
            <p className="mt-2 text-sm text-slate-500">If money left your account, it will still be confirmed automatically — check your dashboard shortly, or contact us if it doesn't update.</p>
            <Link to="/dashboard"><Button className="mt-8 w-full rounded-full bg-[#1D4ED8] hover:bg-[#1E40AF]" data-testid="payment-error-dashboard">Go to dashboard</Button></Link>
          </>
        )}
      </div>
    </div>
  );
}