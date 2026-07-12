"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils";

type OrderRow = {
  id: string;
  customerEmail: string;
  customerName: string | null;
  ticketType: string;
  quantity: number;
  totalFormatted: string;
  paymentStatus: string;
  paymentLinkSent: string | null;
  assignedSeats: string[];
  linkWorkflow: string;
  matchLabel: string;
  venue: string;
};

type MatchRow = {
  id: string;
  homeTeam: string;
  awayTeam: string;
  venue: string;
  matchDate: string;
  standardAvailable: number;
  premiumAvailable: number;
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [links, setLinks] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [homeTeam, setHomeTeam] = useState("");
  const [awayTeam, setAwayTeam] = useState("");
  const [venue, setVenue] = useState("");
  const [stadiumViewUrl, setStadiumViewUrl] = useState("/images/stadium-metlife.svg");
  const [matchDate, setMatchDate] = useState("");
  const [standardAvailable, setStandardAvailable] = useState(300);
  const [premiumAvailable, setPremiumAvailable] = useState(120);

  const load = useCallback(async () => {
    const me = await fetch("/api/admin/auth");
    if (!me.ok) {
      router.replace("/admin");
      return;
    }
    const [oRes, mRes] = await Promise.all([
      fetch("/api/admin/orders"),
      fetch("/api/admin/matches"),
    ]);
    const oData = await oRes.json();
    const mData = await mRes.json();
    if (!oRes.ok) throw new Error(oData.error || "Failed orders");
    if (!mRes.ok) throw new Error(mData.error || "Failed matches");
    setOrders(oData.orders);
    setMatches(
      mData.matches.map((m: MatchRow & { matchDate: string }) => ({
        ...m,
        matchDate: typeof m.matchDate === "string" ? m.matchDate : new Date(m.matchDate).toISOString(),
      }))
    );
    setReady(true);
  }, [router]);

  useEffect(() => {
    load().catch((err) => setError(err instanceof Error ? err.message : "Load failed"));
  }, [load]);

  const createMatch = async (e: FormEvent) => {
    e.preventDefault();
    setNotice(null);
    setError(null);
    const iso = new Date(matchDate).toISOString();
    const res = await fetch("/api/admin/matches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        homeTeam,
        awayTeam,
        venue,
        stadiumViewUrl,
        matchDate: iso,
        standardAvailable,
        premiumAvailable,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to create match");
      return;
    }
    setNotice(`Scheduled ${data.match.homeTeam} vs ${data.match.awayTeam}`);
    setHomeTeam("");
    setAwayTeam("");
    setVenue("");
    await load();
  };

  const sendLink = async (orderId: string) => {
    setNotice(null);
    setError(null);
    const res = await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId,
        action: "send_link",
        paymentLink: links[orderId],
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to send link");
      return;
    }
    setNotice(data.notice || "Payment link saved");
    await load();
  };

  const markReceived = async (orderId: string) => {
    setNotice(null);
    setError(null);
    const res = await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, action: "mark_received" }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Failed to mark received");
      return;
    }
    setNotice("Payment marked as received — order completed");
    await load();
  };

  const logout = async () => {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.push("/admin");
  };

  if (!ready) {
    return (
      <div className="container-page py-16">
        <div className="glass-panel p-8 text-slate-300">Loading admin dashboard…</div>
      </div>
    );
  }

  const pending = orders.filter((o) =>
    ["pending_link", "awaiting_payment"].includes(o.paymentStatus)
  );

  return (
    <div className="container-page space-y-8 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-black uppercase tracking-[0.18em] text-lime-400">Admin</div>
          <h1 className="mt-1 text-4xl font-black text-white">Operations Dashboard</h1>
        </div>
        <button type="button" className="btn btn-secondary" onClick={logout}>
          Logout
        </button>
      </div>

      {notice ? <p className="rounded-xl border border-lime-400/30 bg-lime-400/10 px-4 py-3 text-sm text-lime-200">{notice}</p> : null}
      {error ? <p className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</p> : null}

      <section className="glass-panel p-6">
        <h2 className="text-2xl font-black text-white">Match Scheduler</h2>
        <p className="mt-1 text-sm text-slate-400">Insert upcoming games into PostgreSQL.</p>
        <form onSubmit={createMatch} className="mt-5 grid gap-3 md:grid-cols-2">
          <div>
            <label className="label">Home Team</label>
            <input className="input" value={homeTeam} onChange={(e) => setHomeTeam(e.target.value)} required />
          </div>
          <div>
            <label className="label">Away Team</label>
            <input className="input" value={awayTeam} onChange={(e) => setAwayTeam(e.target.value)} required />
          </div>
          <div className="md:col-span-2">
            <label className="label">Venue</label>
            <input className="input" value={venue} onChange={(e) => setVenue(e.target.value)} required />
          </div>
          <div>
            <label className="label">Match Date / Time</label>
            <input
              className="input"
              type="datetime-local"
              value={matchDate}
              onChange={(e) => setMatchDate(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">Stadium Graphic URL</label>
            <input
              className="input"
              value={stadiumViewUrl}
              onChange={(e) => setStadiumViewUrl(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">Standard Available</label>
            <input
              className="input"
              type="number"
              min={0}
              value={standardAvailable}
              onChange={(e) => setStandardAvailable(Number(e.target.value))}
              required
            />
          </div>
          <div>
            <label className="label">Premium Available</label>
            <input
              className="input"
              type="number"
              min={0}
              value={premiumAvailable}
              onChange={(e) => setPremiumAvailable(Number(e.target.value))}
              required
            />
          </div>
          <div className="md:col-span-2">
            <button type="submit" className="btn btn-primary">
              Schedule Match
            </button>
          </div>
        </form>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.12em] text-slate-400">
              <tr>
                <th className="px-2 py-2">Match</th>
                <th className="px-2 py-2">Venue</th>
                <th className="px-2 py-2">Date</th>
                <th className="px-2 py-2">Std</th>
                <th className="px-2 py-2">Prem</th>
              </tr>
            </thead>
            <tbody>
              {matches.map((m) => (
                <tr key={m.id} className="border-t border-white/5 text-slate-200">
                  <td className="px-2 py-3 font-bold">
                    {m.homeTeam} vs {m.awayTeam}
                  </td>
                  <td className="px-2 py-3">{m.venue}</td>
                  <td className="px-2 py-3">
                    {new Date(m.matchDate).toLocaleString("en-US")}
                  </td>
                  <td className="px-2 py-3">{m.standardAvailable}</td>
                  <td className="px-2 py-3">{m.premiumAvailable}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="glass-panel p-6">
        <h2 className="text-2xl font-black text-white">Manual Payment Link Processor</h2>
        <p className="mt-1 text-sm text-slate-400">
          Live grid for orders in <code>pending_link</code> or <code>awaiting_payment</code>.
        </p>

        <div className="mt-5 space-y-4">
          {pending.length === 0 ? (
            <p className="text-sm text-slate-400">No pending payment-link orders right now.</p>
          ) : (
            pending.map((order) => (
              <div key={order.id} className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-lg font-black text-white">{order.matchLabel}</div>
                    <div className="mt-1 text-sm text-slate-400">
                      {order.customerEmail}
                      {order.customerName ? ` · ${order.customerName}` : ""} · {order.quantity}×{" "}
                      {order.ticketType} · {order.totalFormatted} · workflow {order.linkWorkflow}
                    </div>
                    <div className="mt-2 text-xs text-emerald-300">
                      Seats: {order.assignedSeats.join(" · ")}
                    </div>
                    <span
                      className={`badge mt-3 ${
                        order.paymentStatus === "pending_link" ? "badge-amber" : "badge-slate"
                      }`}
                    >
                      {order.paymentStatus}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary !py-2 !text-xs"
                    onClick={() => markReceived(order.id)}
                  >
                    Mark Payment as Received
                  </button>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
                  <div>
                    <label className="label">Paste Apple Pay / Cash App Link</label>
                    <input
                      className="input"
                      placeholder="https://cash.app/... or Apple Pay link"
                      value={links[order.id] || order.paymentLinkSent || ""}
                      onChange={(e) =>
                        setLinks((prev) => ({ ...prev, [order.id]: e.target.value }))
                      }
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      className="btn btn-primary w-full md:w-auto"
                      onClick={() => sendLink(order.id)}
                    >
                      Send Link to Customer
                    </button>
                  </div>
                </div>
                {order.paymentLinkSent ? (
                  <p className="mt-2 break-all text-xs text-slate-400">
                    Current link: {order.paymentLinkSent}
                  </p>
                ) : null}
              </div>
            ))
          )}
        </div>

        <div className="mt-8">
          <h3 className="text-lg font-black text-white">All Orders</h3>
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.12em] text-slate-400">
                <tr>
                  <th className="px-2 py-2">Customer</th>
                  <th className="px-2 py-2">Match</th>
                  <th className="px-2 py-2">Qty</th>
                  <th className="px-2 py-2">Total</th>
                  <th className="px-2 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-t border-white/5 text-slate-200">
                    <td className="px-2 py-3">{o.customerEmail}</td>
                    <td className="px-2 py-3">{o.matchLabel}</td>
                    <td className="px-2 py-3">
                      {o.quantity}× {o.ticketType}
                    </td>
                    <td className="px-2 py-3">{o.totalFormatted || formatCurrency(0)}</td>
                    <td className="px-2 py-3">{o.paymentStatus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
