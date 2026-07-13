import { LoginForm } from "@/components/auth/LoginForm";

export default function RegisterPage() {
  return (
    <div className="container-page py-16">
      <LoginForm mode="register" />
    </div>
  );
}
