import { Headphones, MessageCircle, ReceiptText, ShieldAlert } from "lucide-react";

export const metadata = { title: "Customer support" };

export default function SupportPage() {
  return (
    <div className="container-page py-14 sm:py-20">
      <div className="max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-[.2em] text-[#17845f]">PitchPass support</p>
        <h1 className="mt-3 font-display text-5xl font-extrabold tracking-tight">We keep your order context in the conversation.</h1>
        <p className="mt-5 text-base leading-7 text-[var(--ink-muted)]">Use the chat to get help with a match, payment, or ticket delivery. If checkout sent you here, your booking reference, ticket selection, amount, and payment method are already attached.</p>
      </div>
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {[
          [MessageCircle, "Order-linked chat", "No need to explain your ticket selection again."],
          [ReceiptText, "Approved payment links", "Links are sent only by authorized staff and do not mark orders paid when clicked."],
          [ShieldAlert, "Keep credentials private", "We never request passwords, full card numbers, CVVs, or one-time codes in chat."],
        ].map(([Icon, title, copy]) => {
          const ItemIcon = Icon as typeof Headphones;
          return <div key={title as string} className="rounded-[24px] border border-[#dce8e2] bg-white p-6"><ItemIcon className="h-5 w-5 text-[#17845f]" /><h2 className="mt-4 font-display text-lg font-bold">{title as string}</h2><p className="mt-2 text-sm leading-6 text-[var(--ink-muted)]">{copy as string}</p></div>;
        })}
      </div>
      <div className="mt-10 rounded-[28px] bg-[#082018] p-8 text-white"><Headphones className="h-7 w-7 text-[var(--brand)]" /><h2 className="mt-4 font-display text-2xl font-bold">Open the chat bubble to continue</h2><p className="mt-2 text-sm text-white/55">Conversation history and unread replies remain available in this browser and your account.</p></div>
    </div>
  );
}
