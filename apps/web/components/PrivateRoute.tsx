"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../hooks/useAuth";

export default function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isHydrated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isHydrated, isAuthenticated, router]);

  if (!isHydrated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-slate-100 font-sans">
        <div className="relative mb-4">
          <div className="h-12 w-12 rounded-full border-t-2 border-r-2 border-sky-500 animate-spin shadow-[0_0_15px_rgba(14,165,233,0.3)]"></div>
          <div className="absolute inset-0 h-12 w-12 rounded-full border-b-2 border-l-2 border-slate-800 animate-ping opacity-30"></div>
        </div>
        <p className="text-slate-400 text-xs font-semibold animate-pulse tracking-widest uppercase">
          Securing Connection...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Prevent showing dashboard content while redirecting
  }

  return <>{children}</>;
}
