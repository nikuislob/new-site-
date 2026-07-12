import { Suspense } from "react";
import LoginForm from "./LoginForm";

export const metadata = { title: "Login" };

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0b1026]" />}>
      <LoginForm />
    </Suspense>
  );
}
