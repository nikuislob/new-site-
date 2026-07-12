import { Suspense } from "react";
import ResetForm from "./ResetForm";

export const metadata = { title: "Reset Password" };

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0b1026]" />}>
      <ResetForm />
    </Suspense>
  );
}
