"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { InteractiveStadium, type StadiumZoneView } from "@/components/stadium/InteractiveStadium";
import { BookingPanel } from "@/components/stadium/BookingPanel";

type MatchPayload = {
  id: string;
  slug: string;
  title: string;
  salesEnabled: boolean;
  isSoldOut: boolean;
  zones: StadiumZoneView[];
  categories: Array<{ id: string; priceCents: number; available: number }>;
};

export function StadiumExperience() {
  const router = useRouter();
  const [match, setMatch] = useState<MatchPayload | null>(null);
  const [selected, setSelected] = useState<StadiumZoneView | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const maxQuantity = 2;

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/matches/featured");
        const data = await res.json();
        if (!data.match) {
          setError("No featured match is currently available.");
          return;
        }
        setMatch(data.match);
      } catch {
        setError("Unable to load stadium inventory.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const continueCheckout = () => {
    if (!match || !selected) return;
    const payload = {
      matchId: match.id,
      matchSlug: match.slug,
      ticketCategoryId: selected.categoryId,
      categoryName: selected.categoryName,
      zoneCode: selected.code,
      zoneName: selected.name,
      quantity,
      unitPriceCents: selected.priceCents,
    };
    sessionStorage.setItem("arenanights_checkout", JSON.stringify(payload));
    router.push("/checkout");
  };

  if (loading) {
    return (
      <div className="container-page py-16">
        <div className="skeleton h-10 w-64" />
        <div className="mt-6 skeleton h-[420px] w-full" />
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="container-page py-20">
        <div className="glass-panel p-8 text-center">
          <h1 className="font-display text-4xl text-white">Stadium Unavailable</h1>
          <p className="mt-3 text-white/60">{error || "Please check back soon."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-36 md:pb-16">
      <div className="container-page py-10">
        <div className="max-w-2xl">
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent)]">
            Interactive Stadium
          </div>
          <h1 className="mt-2 font-display text-5xl tracking-[0.06em] text-white md:text-6xl">
            Choose Your View
          </h1>
          <p className="mt-3 text-white/65">
            Select a seating zone on the stadium map. Maximum {maxQuantity} tickets per normal order.
          </p>
        </div>

        <div id="map" className="mt-8 grid gap-5 lg:grid-cols-[1.45fr_0.7fr]">
          <InteractiveStadium
            zones={match.zones}
            selectedZoneCode={selected?.code}
            onSelect={setSelected}
          />
          <div className="hidden lg:block">
            <BookingPanel
              selectedZone={selected}
              quantity={quantity}
              maxQuantity={maxQuantity}
              onQuantityChange={setQuantity}
              onContinue={continueCheckout}
            />
          </div>
        </div>
      </div>

      <div className="lg:hidden">
        <BookingPanel
          selectedZone={selected}
          quantity={quantity}
          maxQuantity={maxQuantity}
          onQuantityChange={setQuantity}
          onContinue={continueCheckout}
          sticky
        />
      </div>
    </div>
  );
}
