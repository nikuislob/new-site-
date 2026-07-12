import Link from "next/link";

export default function DownloadPage() {
  return (
    <div className="container-page py-12">
      <h1 className="font-display text-5xl font-bold sm:text-6xl">Download PitchPass</h1>
      <p className="mt-3 max-w-2xl text-[var(--ink-muted)]">
        Get the full project as a zip — storefront, admin panel, seed data scripts, and docs. Unzip, install, and run on your machine.
      </p>

      <div className="card-quiet mt-10 max-w-xl p-8">
        <p className="font-display text-3xl font-bold">pitchpass-tickets.zip</p>
        <p className="mt-2 text-sm text-[var(--ink-muted)]">
          Includes source code (no node_modules). After download:
        </p>
        <pre className="mt-4 overflow-x-auto rounded-xl bg-[var(--bg)] p-4 text-xs text-[#d5ebe0]">
{`unzip pitchpass-tickets.zip
cd matchseat
cp .env.example .env
npm install
npx prisma db push
npm run db:seed
npm run dev`}
        </pre>
        <a
          href="/downloads/pitchpass-tickets.zip"
          download="pitchpass-tickets.zip"
          className="btn btn-primary mt-6 inline-flex"
        >
          Download zip
        </a>
      </div>

      <p className="mt-8 text-sm text-[var(--ink-muted)]">
        Prefer GitHub? Clone the repo branch or grab the zip from the project root.{" "}
        <Link href="/" className="font-semibold text-[var(--brand-deep)] underline">
          Back home
        </Link>
      </p>
    </div>
  );
}
