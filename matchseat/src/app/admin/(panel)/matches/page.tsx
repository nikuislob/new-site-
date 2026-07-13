"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { DataTable, type DataTableColumn } from "@/components/admin/DataTable";
import type { AdminMatch } from "@/components/admin/types";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { adminFetch } from "@/lib/admin-fetch";
import { formatCurrency } from "@/lib/utils";
import { SEAT_TIERS } from "@/lib/tickets";

const columns: DataTableColumn<AdminMatch>[] = [
  {
    key: "homeTeam",
    header: "Match",
    cell: (match) => (
      <div>
        <Link className="font-black text-[#0a1628] hover:text-[#1f8a4c]" href={`/admin/matches/${match.id}`}>
          {match.homeFlag ? `${match.homeFlag} ` : ""}
          {match.homeTeam} vs {match.awayTeam}
          {match.awayFlag ? ` ${match.awayFlag}` : ""}
        </Link>
        <p className="text-xs text-slate-500">{match.stage}{match.groupName ? ` - ${match.groupName}` : ""}</p>
      </div>
    ),
  },
  {
    key: "kickoffAt",
    header: "Kickoff",
    cell: (match) => new Date(match.kickoffAt).toLocaleString(),
  },
  {
    key: "venueName",
    header: "Venue",
    cell: (match) => (
      <span>
        {match.venueName}, {match.venueCity}
      </span>
    ),
  },
  {
    key: "basicStock",
    header: "Inventory",
    cell: (match) => (
      <div className="text-xs">
        <p>
          Basic: <strong>{match.basicStock}</strong> at {formatCurrency(SEAT_TIERS.BASIC.priceCents)}
        </p>
        <p>
          Premium: <strong>{match.premiumStock}</strong> at {formatCurrency(SEAT_TIERS.PREMIUM.priceCents)}
        </p>
      </div>
    ),
  },
  {
    key: "isPublished",
    header: "State",
    cell: (match) => (
      <div className="flex flex-wrap gap-2">
        <span className={match.isPublished ? "font-bold text-emerald-700" : "font-bold text-slate-400"}>
          {match.isPublished ? "Published" : "Draft"}
        </span>
        {match.isFeatured ? <span className="font-bold text-amber-700">Featured</span> : null}
      </div>
    ),
  },
  {
    key: "id",
    header: "",
    cell: (match) => (
      <Link className="font-black text-[#1f8a4c] hover:underline" href={`/admin/matches/${match.id}`}>
        Edit
      </Link>
    ),
  },
];

export default function AdminMatchesPage() {
  const [matches, setMatches] = useState<AdminMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    adminFetch<{ matches: AdminMatch[] }>("/api/admin/matches")
      .then((data) => {
        if (mounted) setMatches(data.matches);
      })
      .catch((err) => {
        if (mounted) setError(err instanceof Error ? err.message : "Unable to load matches.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.25em] text-[#1f8a4c]">Inventory ops</p>
          <h1 className="mt-2 font-display text-5xl text-[#0a1628]">Matches</h1>
        </div>
        <Link href="/admin/matches/new">
          <Button>
            <Plus size={18} />
            Create new
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="grid min-h-[45vh] place-items-center rounded-3xl bg-white">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 font-bold text-rose-700">{error}</div>
      ) : (
        <DataTable columns={columns} rows={matches} rowKey={(match) => match.id} emptyState="No matches yet." />
      )}
    </div>
  );
}
