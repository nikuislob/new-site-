import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="container-page py-16">
      <LoginForm mode="login" />
    </div>
  );
}
