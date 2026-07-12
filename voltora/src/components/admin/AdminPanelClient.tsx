"use client";

import { createContext, useContext } from "react";
import { AdminShell } from "@/components/admin/AdminShell";

type Admin = { id: string; name: string; email: string; role: string };

const AdminContext = createContext<Admin | null>(null);

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin requires provider");
  return ctx;
}

export default function AdminPanelLayout({
  children,
  admin,
}: {
  children: React.ReactNode;
  admin: Admin;
}) {
  return (
    <AdminContext.Provider value={admin}>
      <AdminShell admin={admin}>{children}</AdminShell>
    </AdminContext.Provider>
  );
}
