"use client";

import Image from "next/image";
import { useState } from "react";
import { AlertCircle, CheckCircle2, CreditCard, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { formatCurrency } from "@/lib/format";
import { US_STATES } from "@/lib/validators";
import { useToast } from "@/components/providers/AppProviders";

export interface PaymentMethodOption {
  id: string;
  slot: number;
  name: string;
  iconUrl?: string | null;
  paymentUrl: string;
  buttonText: string;
  instructions?: string | null;
}

export interface CheckoutCartSummary {
  items: Array<{
    productName: string;
    variantName?: string | null;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    imageUrl?: string | null;
  }>;
  totals: {
    subtotal: number;
    discount: number;
    shippingAmount: number;
    total: number;
  };
}

interface CheckoutFormProps {
  cart: CheckoutCartSummary;
  paymentMethods: PaymentMethodOption[];
  defaultEmail?: string;
  defaultName?: string;
  defaultPhone?: string;
}

type Step = "info" | "review" | "payment";

interface CreatedOrder {
  id: string;
  orderNumber: string;
  total: number;
  paymentStatus: string;
  status: string;
  accessToken?: string;
}

async function readJson(res: Response) {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    throw new Error(text || "Invalid server response");
  }
}

export function CheckoutForm({
  cart,
  paymentMethods,
  defaultEmail = "",
  defaultName = "",
  defaultPhone = "",
}: CheckoutFormProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<Step>("info");
  const [loading, setLoading] = useState(false);
  const [paying, setPaying] = useState(false);
  const [order, setOrder] = useState<CreatedOrder | null>(null);
  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(
    paymentMethods[0]?.id || null
  );
  const [payHint, setPayHint] = useState<string | null>(null);

  const [form, setForm] = useState({
    customerName: defaultName,
    customerEmail: defaultEmail,
    customerPhone: defaultPhone,
    shippingLine1: "",
    shippingLine2: "",
    shippingCity: "",
    shippingState: "CA",
    shippingZip: "",
    shippingCountry: "United States",
    customerNotes: "",
    couponCode: "",
  });

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const createOrder = async () => {
    if (!form.customerName || !form.customerEmail || !form.shippingLine1 || !form.shippingCity || !form.shippingZip) {
      toast("Please fill all required shipping fields", "error");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await readJson(res);
      if (!res.ok) throw new Error(data.error || "Could not create order");
      const o = data.order || data;
      const accessToken = data.accessToken as string | undefined;
      if (accessToken) {
        try {
          sessionStorage.setItem(`voltora_order_token_${o.orderNumber}`, accessToken);
          sessionStorage.setItem(`voltora_order_email_${o.orderNumber}`, form.customerEmail.toLowerCase());
        } catch {
          /* ignore */
        }
      }
      setOrder({
        id: o.id,
        orderNumber: o.orderNumber,
        total: o.total,
        paymentStatus: o.paymentStatus || "PENDING",
        status: o.status || "PAYMENT_PENDING",
        accessToken,
      });
      setStep("payment");
      window.dispatchEvent(new Event("voltora:cart-updated"));
      toast("Order created — choose a payment method", "success");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Checkout failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const selectedMethod = paymentMethods.find((m) => m.id === selectedMethodId);

  const startPayment = async (sameWindow = false) => {
    if (!selectedMethod || !order) return;
    setPaying(true);
    setPayHint(null);
    try {
      let accessToken = order.accessToken;
      try {
        accessToken =
          accessToken ||
          sessionStorage.getItem(`voltora_order_token_${order.orderNumber}`) ||
          undefined;
      } catch {
        /* ignore */
      }
      const res = await fetch(`/api/orders/${order.id}/payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-guest-email": form.customerEmail,
          ...(accessToken ? { "x-order-token": accessToken } : {}),
        },
        body: JSON.stringify({
          paymentMethodId: selectedMethod.id,
          accessToken,
          guestEmail: form.customerEmail,
        }),
      });
      const data = await readJson(res);
      if (!res.ok) throw new Error(data.error || "Could not start payment");

      if (data.gatewayMsg) setPayHint(data.gatewayMsg);

      const url = data.paymentUrl || selectedMethod.paymentUrl;
      if (!url || !String(url).startsWith("http")) {
        throw new Error("No valid payment URL returned");
      }

      const track = `/order/${order.orderNumber}?email=${encodeURIComponent(form.customerEmail)}&token=${accessToken || ""}`;
      toast("Opening payment… order stays Pending until confirmed", "info");
      if (sameWindow) window.location.href = url;
      else {
        window.open(url, "_blank", "noopener,noreferrer");
        // Keep tracking link available
        void track;
      }
    } catch (e) {
      toast(e instanceof Error ? e.message : "Payment start failed", "error");
    } finally {
      setPaying(false);
    }
  };

  const steps: { key: Step; label: string }[] = [
    { key: "info", label: "Shipping" },
    { key: "review", label: "Review" },
    { key: "payment", label: "Payment" },
  ];

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div>
        <div className="mb-6 flex flex-wrap gap-2">
          {steps.map((s, i) => (
            <div key={s.key} className="flex items-center gap-2">
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                  step === s.key || (order && s.key === "payment")
                    ? "bg-[var(--brand)] text-[#04241f]"
                    : "bg-[var(--surface)] text-[var(--ink-muted)]"
                }`}
              >
                {order && s.key !== "payment" ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
              </span>
              <span className="text-sm font-medium">{s.label}</span>
              {i < steps.length - 1 ? <span className="mx-1 text-[var(--line)]">/</span> : null}
            </div>
          ))}
        </div>

        {step === "info" ? (
          <div className="card-surface space-y-4 p-5 animate-fade-up">
            <h2 className="font-display text-xl font-semibold">Shipping information</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Full name *" value={form.customerName} onChange={(e) => update("customerName", e.target.value)} required />
              <Input label="Email *" type="email" value={form.customerEmail} onChange={(e) => update("customerEmail", e.target.value)} required />
              <Input label="Phone" value={form.customerPhone} onChange={(e) => update("customerPhone", e.target.value)} />
              <Input label="Coupon code" value={form.couponCode} onChange={(e) => update("couponCode", e.target.value.toUpperCase())} />
            </div>
            <Input label="Address line 1 *" value={form.shippingLine1} onChange={(e) => update("shippingLine1", e.target.value)} required />
            <Input label="Address line 2" value={form.shippingLine2} onChange={(e) => update("shippingLine2", e.target.value)} />
            <div className="grid gap-4 sm:grid-cols-3">
              <Input label="City *" value={form.shippingCity} onChange={(e) => update("shippingCity", e.target.value)} required />
              <Select
                label="State"
                value={form.shippingState}
                onChange={(e) => update("shippingState", e.target.value)}
                options={US_STATES.map((s) => ({ value: s, label: s }))}
              />
              <Input label="ZIP code *" value={form.shippingZip} onChange={(e) => update("shippingZip", e.target.value)} required />
            </div>
            <Textarea label="Order notes (optional)" value={form.customerNotes} onChange={(e) => update("customerNotes", e.target.value)} />
            <Button onClick={() => setStep("review")} className="mt-2">
              Continue to review
            </Button>
          </div>
        ) : null}

        {step === "review" ? (
          <div className="card-surface space-y-4 p-5 animate-fade-up">
            <h2 className="font-display text-xl font-semibold">Review your order</h2>
            <div className="rounded-xl bg-[var(--surface)] p-4 text-sm">
              <p className="font-semibold">{form.customerName}</p>
              <p className="text-[var(--ink-muted)]">{form.customerEmail}</p>
              <p className="mt-2">
                {form.shippingLine1}
                {form.shippingLine2 ? `, ${form.shippingLine2}` : ""}
                <br />
                {form.shippingCity}, {form.shippingState} {form.shippingZip}
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setStep("info")}>
                Edit
              </Button>
              <Button loading={loading} onClick={createOrder}>
                Create order
              </Button>
            </div>
          </div>
        ) : null}

        {step === "payment" && order ? (
          <div className="space-y-4 animate-fade-up">
            <div className="card-surface border-[var(--warning)]/30 bg-[#fffbeb] p-5">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 shrink-0 text-[var(--warning)]" />
                <div>
                  <p className="font-display font-semibold text-[var(--ink)]">Order {order.orderNumber}</p>
                  <p className="mt-1 text-sm text-[var(--ink-muted)]">
                    Amount due: <strong className="text-[var(--ink)]">{formatCurrency(order.total)}</strong>
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[var(--warning)]">
                    Status: Payment Pending until the payment provider notifies us or an admin confirms.
                  </p>
                </div>
              </div>
            </div>

            <div className="card-surface p-5">
              <h2 className="flex items-center gap-2 font-display text-xl font-semibold">
                <CreditCard className="h-5 w-5 text-[var(--brand)]" />
                Select payment method
              </h2>
              <p className="mt-1 text-sm text-[var(--ink-muted)]">
                Cash App · Google Pay · Apple Pay · Chime (via secure payment gateway).
              </p>

              <div className="mt-4 space-y-3">
                {paymentMethods.map((method) => (
                  <label
                    key={method.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 transition ${
                      selectedMethodId === method.id
                        ? "border-[var(--brand)] bg-[var(--brand-soft)]"
                        : "border-[var(--line)] hover:border-[#b8c7db]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method.id}
                      checked={selectedMethodId === method.id}
                      onChange={() => setSelectedMethodId(method.id)}
                      className="accent-[var(--brand)]"
                    />
                    {method.iconUrl ? (
                      <Image src={method.iconUrl} alt="" width={32} height={32} className="h-8 w-8 object-contain" />
                    ) : null}
                    <div className="flex-1">
                      <p className="font-semibold">{method.name}</p>
                      {method.instructions ? (
                        <p className="mt-0.5 text-xs text-[var(--ink-muted)]">{method.instructions.replace(/WAYCODE:[A-Z0-9_]+/gi, "").trim()}</p>
                      ) : null}
                    </div>
                  </label>
                ))}
              </div>

              {selectedMethod ? (
                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <Button loading={paying} onClick={() => startPayment(false)}>
                    <ExternalLink className="h-4 w-4" />
                    {selectedMethod.buttonText}
                  </Button>
                  <Button variant="secondary" loading={paying} onClick={() => startPayment(true)}>
                    Pay in this window
                  </Button>
                </div>
              ) : null}

              {payHint ? <p className="mt-3 text-xs text-[var(--warning)]">{payHint}</p> : null}

              <p className="mt-4 text-xs text-[var(--ink-muted)]">
                Track order:{" "}
                <a
                  href={`/order/${order.orderNumber}?email=${encodeURIComponent(form.customerEmail)}&token=${order.accessToken || ""}`}
                  className="font-semibold text-[var(--brand-deep)] underline"
                >
                  /order/{order.orderNumber}
                </a>
              </p>
            </div>
          </div>
        ) : null}
      </div>

      <aside className="card-surface h-fit p-5 lg:sticky lg:top-24">
        <h2 className="font-display text-lg font-semibold">Items ({cart.items.length})</h2>
        <ul className="mt-4 space-y-3">
          {cart.items.map((item, i) => (
            <li key={i} className="flex gap-3 text-sm">
              {item.imageUrl ? (
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg">
                  <Image src={item.imageUrl} alt="" fill className="object-cover" sizes="48px" />
                </div>
              ) : null}
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 font-medium">{item.productName}</p>
                {item.variantName ? <p className="text-xs text-[var(--ink-muted)]">{item.variantName}</p> : null}
                <p className="text-xs text-[var(--ink-muted)]">Qty {item.quantity}</p>
              </div>
              <span className="font-semibold">{formatCurrency(item.lineTotal)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-2 border-t border-[var(--line)] pt-4 text-sm">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd>{formatCurrency(cart.totals.subtotal)}</dd>
          </div>
          {cart.totals.discount > 0 ? (
            <div className="flex justify-between text-[var(--success)]">
              <dt>Discount</dt>
              <dd>-{formatCurrency(cart.totals.discount)}</dd>
            </div>
          ) : null}
          <div className="flex justify-between">
            <dt>Shipping</dt>
            <dd>{cart.totals.shippingAmount === 0 ? "Free" : formatCurrency(cart.totals.shippingAmount)}</dd>
          </div>
          <div className="flex justify-between font-display text-base font-bold">
            <dt>Total</dt>
            <dd>{formatCurrency(cart.totals.total)}</dd>
          </div>
        </dl>
      </aside>
    </div>
  );
}
