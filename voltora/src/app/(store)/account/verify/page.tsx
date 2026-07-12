import Link from "next/link";
import { Mail } from "lucide-react";

export const metadata = {
  title: "Verify Email",
};

export default function VerifyPage() {
  return (
    <div className="container-page py-10 sm:py-14">
      <div className="card-surface mx-auto max-w-md p-8 text-center animate-fade-up">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--brand-soft)] text-[var(--brand-deep)]">
          <Mail className="h-6 w-6" />
        </div>
        <h1 className="font-display text-2xl font-bold">Check your inbox</h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--ink-muted)]">
          We sent a verification link to your email. Click the link to activate your PitchPass account.
          The link may take a few minutes to arrive — check spam if needed.
        </p>
        <Link
          href="/account/login"
          className="mt-6 inline-block text-sm font-semibold text-[var(--brand-deep)] hover:underline"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
