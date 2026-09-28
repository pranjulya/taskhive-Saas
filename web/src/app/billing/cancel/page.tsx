import Link from "next/link";

export default function BillingCancelPage() {
  return (
    <div className="card">
      <div className="card-body">
        <h1 className="card-title">Checkout cancelled</h1>
        <p className="card-text">
          No charge was made. You can restart checkout from the dashboard whenever
          you are ready.
        </p>
        <Link className="btn btn-secondary" href="/dashboard">
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
