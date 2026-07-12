import { redirect } from "next/navigation";
import { getCurrentAdmin, publicAdmin } from "@/lib/auth";
import AdminPanelClient from "@/components/admin/AdminPanelClient";

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  return <AdminPanelClient admin={publicAdmin(admin)}>{children}</AdminPanelClient>;
}
