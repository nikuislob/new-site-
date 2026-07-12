import Link from "next/link";

export default function HowItWorksPage() {
  return (
    <div className="container-page py-12">
      <h1 className="font-display text-5xl font-bold sm:text-6xl">How it works</h1>
      <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {[
          { n: "01", t: "Pick a match", d: "Browse upcoming US venues and kickoff times." },
          { n: "02", t: "Choose seats", d: "Basic $70 or Premium $140 — max 2 tickets per customer." },
          { n: "03", t: "Checkout", d: "We calculate your total ($70 / $140 / $210 / $280) and open the matching Cash App or Apple Pay link." },
          { n: "04", t: "Confirmation", d: "Order stays Payment Pending until PitchPass operators verify payment in the admin panel." },
        ].map((step) => (
          <div key={step.n} className="card-quiet p-6">
            <p className="font-display text-4xl font-bold text-[var(--brand)]">{step.n}</p>
            <h2 className="mt-3 font-display text-2xl font-bold">{step.t}</h2>
            <p className="mt-2 text-sm text-[var(--ink-muted)]">{step.d}</p>
          </div>
        ))}
      </div>
      <div className="card-quiet mt-10 p-6">
        <h2 className="font-display text-3xl font-bold">Fewer payment links</h2>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[var(--ink-muted)]">
          Operators configure Cash App and Apple Pay URL templates with an <code className="rounded bg-[var(--brand-soft)] px-1">{`{amount}`}</code> placeholder
          (for example <code className="rounded bg-[var(--brand-soft)] px-1">https://cash.app/$YourTag/{"{amount}"}</code>).
          Optional per-amount overrides cover $70, $140, $210, and $280 when you need fixed destinations.
        </p>
      </div>
      <Link href="/matches" className="btn btn-primary mt-8 inline-flex">
        Start with matches
      </Link>
    </div>
  );
}
