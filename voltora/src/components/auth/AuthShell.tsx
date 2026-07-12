"use client";

import Link from "next/link";
import { AuthStadiumBackground } from "./AuthStadiumBackground";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-[100svh] items-center justify-center px-4 py-16">
      <AuthStadiumBackground />
      <div className="relative z-10 w-full max-w-md animate-fade-up">
        <div className="mb-6 text-center">
          <Link href="/" className="font-display text-3xl tracking-[0.14em] text-white">
            ARENA NIGHTS
          </Link>
          <p className="mt-2 text-sm text-white/60">{subtitle}</p>
        </div>
        <div className="auth-glass p-6 md:p-7">
          <h1 className="font-display text-4xl tracking-[0.08em] text-white">{title}</h1>
          <div className="mt-5">{children}</div>
        </div>
        {footer ? <div className="mt-5 text-center text-sm text-white/65">{footer}</div> : null}
      </div>
    </div>
  );
}
