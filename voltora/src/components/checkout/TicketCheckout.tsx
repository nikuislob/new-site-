"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Apple, Check, ChevronLeft, CreditCard, Loader2, MessageCircle, ShieldCheck, Smartphone } from "lucide-react";
import { formatMoney } from "@/lib/utils";
import { cn } from "@/lib/utils";

type ReservationData = {
  reservation: {
    token: string;
    quantity: number;
    expiresAt: string;
    listing: {
      category: string;
      section: string;
      row: string | null;
      exactSeats: string | null;
      price: number;
      currency: string;
      ticketType: string;
      deliveryMethod: string;
      notes: string | null;
      match: {
        homeTeam: string;
        awayTeam: string;
        round: string;
        kickoffAt: string;
        venue: { name: string; city: string; timezone: string };
      };
    };
  };
  pricing: { subtotal: number; serviceFee: number; taxAmount: number; total: number };
};

const steps = ["Review", "Your details", "Delivery", "Payment"];

export function TicketCheckout({ token }: { token: string }) {
  const router = useRouter();
  const [data, setData] = useState<ReservationData | null>(null);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [remaining, setRemaining] = useState(0);
  const [booking, setBooking] = useState<{ reference: string; accessToken: string } | null>(null);
  const [customer, setCustomer] = useState({ firstName: "", lastName: "", email: "", phone: "", country: "United States" });

  useEffect(() => {
    fetch(`/api/tickets/reservation/${encodeURIComponent(token)}`)
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || "Reservation unavailable");
        setData(body);
        setRemaining(Math.max(0, new Date(body.reservation.expiresAt).getTime() - Date.now()));
      })
      .catch((cause) => setError(cause instanceof Error ? cause.message : "Reservation unavailable"))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    if (!data || booking) return;
    const timer = window.setInterval(() => {
      const value = Math.max(0, new Date(data.reservation.expiresAt).getTime() - Date.now());
      setRemaining(value);
      if (!value) setError("Your reservation has expired. Please select tickets again.");
    }, 1000);
    return () => window.clearInterval(timer);
  }, [data, booking]);

  const timerText = useMemo(() => `${String(Math.floor(remaining / 60_000)).padStart(2, "0")}:${String(Math.floor((remaining / 1000) % 60)).padStart(2, "0")}`, [remaining]);

  function customerValid() {
    return customer.firstName.length > 1 && customer.lastName.length > 1 && /\S+@\S+\.\S+/.test(customer.email) && customer.phone.length >= 7 && customer.country.length > 1;
  }

  async function createBooking() {
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reservationToken: token, ...customer }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to create booking");
      setBooking({ reference: body.booking.reference, accessToken: body.accessToken });
      sessionStorage.setItem(`pitchpass_booking_${body.booking.reference}`, body.accessToken);
      setStep(3);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to create booking");
    } finally {
      setSubmitting(false);
    }
  }

  async function choosePayment(method: "CASH_APP" | "GOOGLE_PAY" | "APPLE_PAY" | "CARD") {
    if (!booking) return;
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch(`/api/bookings/${booking.reference}/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          method,
          accessToken: booking.accessToken,
          idempotencyKey: crypto.randomUUID(),
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to start payment");
      if (body.supportRequired) {
        sessionStorage.setItem("pitchpass_support_email", customer.email);
        window.location.href = `/support?conversation=${encodeURIComponent(body.conversationId)}&booking=${encodeURIComponent(booking.reference)}`;
        return;
      }
      if (body.checkoutUrl) {
        window.location.href = body.checkoutUrl;
        return;
      }
      router.push(`/booking/${booking.reference}?token=${encodeURIComponent(booking.accessToken)}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to start payment");
      setSubmitting(false);
    }
  }

  if (loading) return <CheckoutState><Loader2 className="h-7 w-7 animate-spin text-[#17845f]" /><p>Loading your reserved tickets…</p></CheckoutState>;
  if (!data) return <CheckoutState><p className="font-display text-xl font-bold">Reservation unavailable</p><p className="text-sm text-[var(--ink-muted)]">{error}</p><button className="btn btn-dark" onClick={() => router.push("/#matches")}>Return to matches</button></CheckoutState>;

  const listing = data.reservation.listing;
  const match = listing.match;
  return (
    <div className="container-page py-8 sm:py-12">
      <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
        <button type="button" onClick={() => step ? setStep(step - 1) : router.back()} className="inline-flex items-center gap-2 text-sm font-semibold text-[#587067]"><ChevronLeft className="h-4 w-4" /> Back</button>
        {!booking ? <div className="rounded-full bg-[#0b2a1f] px-4 py-2 font-mono text-sm font-bold text-[var(--brand)]">Reserved for {timerText}</div> : <div className="rounded-full bg-[#e5f6ed] px-4 py-2 text-xs font-bold text-[#14704d]">Booking {booking.reference}</div>}
      </div>
      <div className="mb-8 grid grid-cols-4 gap-2">
        {steps.map((label, index) => <div key={label}><div className={cn("h-1 rounded-full", index <= step ? "bg-[#1aa56c]" : "bg-[#dce7e1]")} /><p className={cn("mt-2 hidden text-xs sm:block", index === step ? "font-bold text-[#153d2f]" : "text-[#81948c]")}>{index + 1}. {label}</p></div>)}
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_390px]">
        <section className="rounded-[28px] border border-[#dce8e2] bg-white p-6 shadow-sm sm:p-8">
          {step === 0 ? <Review data={data} /> : null}
          {step === 1 ? (
            <div>
              <h1 className="font-display text-3xl font-bold">Who should we contact?</h1>
              <p className="mt-2 text-sm text-[var(--ink-muted)]">We use these details for order and ticket-delivery updates.</p>
              <div className="mt-7 grid gap-5 sm:grid-cols-2">
                {[
                  ["firstName", "First name", "text"],
                  ["lastName", "Last name", "text"],
                  ["email", "Email address", "email"],
                  ["phone", "Phone number", "tel"],
                  ["country", "Country", "text"],
                ].map(([key, label, type]) => <label key={key} className={key === "country" ? "sm:col-span-2" : ""}><span className="label">{label}</span><input className="input" type={type} value={customer[key as keyof typeof customer]} onChange={(event) => setCustomer({ ...customer, [key]: event.target.value })} required /></label>)}
              </div>
            </div>
          ) : null}
          {step === 2 ? (
            <div>
              <h1 className="font-display text-3xl font-bold">Ticket delivery</h1>
              <p className="mt-2 text-sm text-[var(--ink-muted)]">Your listing includes the delivery method below.</p>
              <div className="mt-7 rounded-2xl border-2 border-[#1aa56c] bg-[#f4fbf7] p-5">
                <div className="flex items-start gap-4"><span className="grid h-11 w-11 place-items-center rounded-xl bg-[#dff7ea] text-[#15784f]"><Smartphone /></span><div><h2 className="font-display text-lg font-bold">{listing.deliveryMethod}</h2><p className="mt-1 text-sm leading-6 text-[#5a7267]">When tickets are ready, we will email you and add secure access to your PitchPass account. Download links are protected and never publicly listed.</p></div></div>
              </div>
              <div className="mt-5 flex items-start gap-3 rounded-2xl bg-[#f6f8f7] p-4 text-xs leading-5 text-[#62776e]"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#17845f]" /> Ticket delivery timing may depend on the original issuer. Status updates remain visible in your booking.</div>
            </div>
          ) : null}
          {step === 3 ? (
            <div>
              <h1 className="font-display text-3xl font-bold">Choose payment method</h1>
              <p className="mt-2 text-sm text-[var(--ink-muted)]">Cash App connects to the configured provider. Other methods continue with order-linked support.</p>
              <div className="mt-7 grid gap-3">
                {[
                  ["CASH_APP", "Cash App Pay", Smartphone, "Pay through the connected Cash App provider"],
                  ["GOOGLE_PAY", "Google Pay", Smartphone, "Continue with our secure payment support team"],
                  ["APPLE_PAY", "Apple Pay", Apple, "Continue with our secure payment support team"],
                  ["CARD", "Credit / Debit Card", CreditCard, "Continue with our secure payment support team"],
                ].map(([method, label, Icon, copy]) => {
                  const PaymentIcon = Icon as typeof Smartphone;
                  return <button key={method as string} type="button" disabled={submitting} onClick={() => choosePayment(method as "CASH_APP" | "GOOGLE_PAY" | "APPLE_PAY" | "CARD")} className="flex items-center gap-4 rounded-2xl border border-[#dce8e2] p-4 text-left transition hover:border-[#1aa56c] hover:bg-[#f6fbf8] disabled:opacity-60"><span className="grid h-11 w-11 place-items-center rounded-xl bg-[#eef5f1]"><PaymentIcon className="h-5 w-5" /></span><span className="flex-1"><span className="block font-display font-bold">{label as string}</span><span className="mt-0.5 block text-xs text-[#6c8178]">{copy as string}</span></span>{method === "CASH_APP" ? <Check className="h-4 w-4 text-[#1aa56c]" /> : <MessageCircle className="h-4 w-4 text-[#7c9188]" />}</button>;
                })}
              </div>
            </div>
          ) : null}
          {error ? <p className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p> : null}
          {step < 3 ? <button type="button" disabled={(step === 1 && !customerValid()) || submitting || (!remaining && !booking)} onClick={() => step === 2 ? createBooking() : setStep(step + 1)} className="btn btn-dark mt-8 w-full py-3.5">{submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : step === 2 ? "Continue to payment" : "Continue"}</button> : null}
        </section>
        <aside className="rounded-[28px] bg-[#0a241a] p-6 text-white lg:sticky lg:top-32 lg:self-start">
          <p className="text-[10px] font-bold uppercase tracking-[.18em] text-[var(--brand)]">{match.round}</p>
          <h2 className="mt-3 font-display text-xl font-bold leading-7">{match.homeTeam}<br /><span className="text-white/35">vs</span> {match.awayTeam}</h2>
          <p className="mt-4 text-xs leading-5 text-white/50">{match.venue.name}, {match.venue.city}<br />{new Date(match.kickoffAt).toLocaleString()}</p>
          <div className="my-6 h-px bg-white/10" />
          <div className="grid gap-3 text-sm"><Row label={`${listing.category} · ${listing.section}`} value={`× ${data.reservation.quantity}`} /><Row label="Ticket subtotal" value={formatMoney(data.pricing.subtotal, listing.currency)} /><Row label="Service fee" value={formatMoney(data.pricing.serviceFee, listing.currency)} /><Row label="Taxes" value={data.pricing.taxAmount ? formatMoney(data.pricing.taxAmount, listing.currency) : "$0.00"} /></div>
          <div className="mt-5 flex items-end justify-between border-t border-white/10 pt-5"><span className="font-bold">Total</span><span className="font-display text-2xl font-extrabold">{formatMoney(data.pricing.total, listing.currency)}</span></div>
          <p className="mt-4 text-[10px] leading-4 text-white/40">No charges are added after this total. Currency: {listing.currency}.</p>
        </aside>
      </div>
    </div>
  );
}

function Review({ data }: { data: ReservationData }) {
  const listing = data.reservation.listing;
  return <div><p className="text-xs font-bold uppercase tracking-[.18em] text-[#17845f]">Review order</p><h1 className="mt-3 font-display text-3xl font-bold">{listing.match.homeTeam} vs {listing.match.awayTeam}</h1><p className="mt-2 text-sm text-[var(--ink-muted)]">{listing.match.round} · {listing.match.venue.name}, {listing.match.venue.city}</p><div className="mt-7 grid gap-4 rounded-2xl bg-[#f5f9f7] p-5 sm:grid-cols-2"><Detail label="Ticket" value={`${listing.category} · ${listing.section}`} /><Detail label="Seat details" value={`${listing.row ? `Row ${listing.row}` : "Row assigned later"} · ${listing.exactSeats ? `Seats ${listing.exactSeats}` : "Seats assigned later"}`} /><Detail label="Quantity" value={`${data.reservation.quantity} ${data.reservation.quantity === 1 ? "ticket" : "tickets"}`} /><Detail label="Delivery" value={listing.deliveryMethod} /></div>{listing.notes ? <p className="mt-5 text-xs leading-5 text-[#61786d]">{listing.notes}</p> : null}</div>;
}
function Detail({ label, value }: { label: string; value: string }) { return <div><p className="text-[10px] font-bold uppercase tracking-wider text-[#879a91]">{label}</p><p className="mt-1 text-sm font-semibold">{value}</p></div>; }
function Row({ label, value }: { label: string; value: string }) { return <div className="flex justify-between gap-3"><span className="text-white/55">{label}</span><span>{value}</span></div>; }
function CheckoutState({ children }: { children: React.ReactNode }) { return <div className="container-page flex min-h-[500px] flex-col items-center justify-center gap-4 text-center">{children}</div>; }
