"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatCurrency } from "@/lib/utils";
import { formatMatchDate } from "@/lib/format";

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const me = await fetch("/api/auth/me");
      if (!me.ok) {
        router.replace("/account/login?redirect=/account");
        return;
      }
      const meData = await me.json();
      setUser(meData.user);
      setFullName(meData.user.fullName);
      setPhone(meData.user.phone || "");
      const ord = await fetch("/api/auth/orders");
      const ordData = await ord.json();
      setOrders(ordData.orders || []);
      setLoading(false);
    })();
  }, [router]);

  const save = async () => {
    setMessage(null);
    const res = await fetch("/api/auth/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, phone }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error || "Failed");
      return;
    }
    setUser(data.user);
    setMessage("Profile updated");
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  if (loading) {
    return (
      <div className="container-page py-16">
        <div className="skeleton h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="container-page py-10 md:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent)]">My Account</div>
          <h1 className="mt-2 font-display text-5xl text-white">Hello, {user?.fullName?.split(" ")[0]}</h1>
        </div>
        <Button variant="secondary" onClick={logout}>
          Logout
        </Button>
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="ticket-glow p-5">
          <h2 className="font-display text-2xl text-white">My Profile</h2>
          <div className="mt-4 space-y-3">
            <Input label="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            <Input label="Email" value={user?.email || ""} disabled />
            <Input label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
            {message ? <p className="text-sm text-[var(--brand)]">{message}</p> : null}
            <Button onClick={save} className="btn-glow">
              Save Profile
            </Button>
          </div>
          <div className="mt-6 flex flex-col gap-2 text-sm">
            <Link href="/account/orders" className="rounded-xl border border-white/10 px-4 py-3 hover:bg-white/5">
              My Orders
            </Link>
            <Link href="/account/tickets" className="rounded-xl border border-white/10 px-4 py-3 hover:bg-white/5">
              My Tickets / QR Passes
            </Link>
            <Link href="/stadium" className="rounded-xl border border-white/10 px-4 py-3 hover:bg-white/5">
              Book more seats
            </Link>
          </div>
        </section>

        <section className="ticket-glow p-5">
          <h2 className="font-display text-2xl text-white">Recent Orders</h2>
          <div className="mt-4 space-y-3">
            {orders.length === 0 ? (
              <p className="text-sm text-white/60">No bookings yet. Pick your seats in the stadium.</p>
            ) : (
              orders.slice(0, 4).map((o) => (
                <div key={o.id} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-mono text-sm text-[var(--brand)]">{o.orderNumber}</div>
                    <span className="badge badge-neutral">{o.status}</span>
                  </div>
                  <div className="mt-2 text-sm text-white/70">
                    {o.match.teamAName} vs {o.match.teamBName}
                    <br />
                    {formatMatchDate(o.match.matchDate)} · {formatCurrency(o.totalCents)}
                  </div>
                  {o.items?.[0]?.section ? (
                    <div className="mt-2 text-xs text-white/50">
                      Seat {o.items.map((i: any) => `${i.section}/${i.row}/${i.seatNumber}`).join(", ")}
                    </div>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
