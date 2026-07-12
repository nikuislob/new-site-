"use client";

import { useEffect, useState } from "react";
import { PageLoader } from "@/components/ui/PageLoader";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 900);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <PageLoader show={loading} />
      {children}
    </>
  );
}
