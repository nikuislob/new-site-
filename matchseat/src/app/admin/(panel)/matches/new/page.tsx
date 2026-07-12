import { MatchForm } from "@/components/admin/MatchForm";

export default function NewMatchPage() {
  return (
    <div className="grid gap-6">
      <div>
        <p className="text-sm font-black uppercase tracking-[0.25em] text-[#1f8a4c]">Inventory ops</p>
        <h1 className="mt-2 font-display text-5xl text-[#0a1628]">Create match</h1>
      </div>
      <MatchForm mode="create" />
    </div>
  );
}
