"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SuccessBody() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  return (
    <div className="card">
      <div className="card-body">
        <h1 className="card-title">Payment received</h1>
        <p className="card-text">
          Thanks — Stripe Checkout completed. Subscription status is not recorded
          against your account yet (there is no webhook), so this page is only a
          confirmation of the redirect.
        </p>
        {sessionId && (
          <p className="text-muted small">
            Stripe session: <code>{sessionId}</code>
          </p>
        )}
        <Link className="btn btn-primary" href="/dashboard">
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}

export default function BillingSuccessPage() {
  return (
    <Suspense fallback={<p>Confirming payment…</p>}>
      <SuccessBody />
    </Suspense>
  );
}
