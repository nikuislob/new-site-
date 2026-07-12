"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatCurrency } from "@/lib/utils";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [q, setQ] = useState("");

  const load = async () => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    const res = await fetch(`/api/admin/users?${params}`);
    const data = await res.json();
    setUsers(data.users || []);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-4xl text-white">Registered Users</h1>
      <div className="flex gap-3">
        <Input placeholder="Search name or email" value={q} onChange={(e) => setQ(e.target.value)} />
        <Button onClick={load}>Search</Button>
      </div>
      <div className="space-y-3">
        {users.map((u) => (
          <div key={u.id} className="rounded-2xl border border-white/10 bg-[#0a1420] p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="font-semibold text-white">{u.fullName}</div>
                <div className="text-sm text-white/55">{u.email}</div>
                <div className="text-xs text-white/40">
                  Joined {new Date(u.createdAt).toLocaleDateString()} · {u.orderCount} order(s)
                </div>
              </div>
            </div>
            {u.recentOrders?.length ? (
              <div className="mt-3 space-y-2 text-sm text-white/65">
                {u.recentOrders.map((o: any) => (
                  <div key={o.id} className="rounded-xl border border-white/5 bg-black/20 px-3 py-2">
                    <Link href={`/admin/orders/${o.id}`} className="text-[var(--brand)]">
                      {o.orderNumber}
                    </Link>{" "}
                    · {o.status} · {formatCurrency(o.totalCents)}
                    <div className="text-xs text-white/45">
                      {o.items
                        ?.map((i: any) =>
                          i.section
                            ? `${i.categoryName} Sec ${i.section} R${i.row} S${i.seatNumber}`
                            : i.categoryName
                        )
                        .join(" · ")}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
