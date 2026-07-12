import { Suspense } from "react";
import AdminLoginForm from "./LoginForm";

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#050b14] text-white/60">
          Loading…
        </div>
      }
    >
      <AdminLoginForm />
    </Suspense>
  );
}
