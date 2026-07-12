import { redirect } from "next/navigation";

export default async function SeatsRedirect({ params }: { params: Promise<{ matchId: string }> }) {
  const { matchId } = await params;
  redirect(`/book/${matchId}`);
}
