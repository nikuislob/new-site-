"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { MatchForm } from "@/components/admin/MatchForm";
import type { AdminMatch } from "@/components/admin/types";
import { Spinner } from "@/components/ui/Spinner";
import { adminFetch } from "@/lib/admin-fetch";

export default function EditMatchPage() {
  const params = useParams<{ id: string }>();
  const [match, setMatch] = useState<AdminMatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    adminFetch<{ match: AdminMatch }>(`/api/admin/matches/${params.id}`)
      .then((data) => {
        if (mounted) setMatch(data.match);
      })
      .catch((err) => {
        if (mounted) setError(err instanceof Error ? err.message : "Unable to load match.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [params.id]);

  if (loading) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !match) {
    return <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 font-bold text-rose-700">{error}</div>;
  }

  return (
    <div className="grid gap-6">
      <div>
        <p className="text-sm font-black uppercase tracking-[0.25em] text-[#1f8a4c]">Inventory ops</p>
        <h1 className="mt-2 font-display text-5xl text-[#0a1628]">Edit match</h1>
        <p className="mt-2 text-slate-500">
          {match.homeTeam} vs {match.awayTeam}
        </p>
      </div>
      <MatchForm mode="edit" match={match} />
    </div>
  );
}
