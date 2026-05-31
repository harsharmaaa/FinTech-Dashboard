"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { authService } from "../../../services/auth.service";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const infoMode = searchParams.get("info") === "check";

  const [status, setStatus] = useState<"loading" | "success" | "error" | "info">(
    token ? "loading" : "info"
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      setStatus("loading");
      authService
        .verifyEmail(token)
        .then(() => {
          setStatus("success");
          console.log("✉️ Email verification successful!");
        })
        .catch((err) => {
          setStatus("error");
          setErrorMessage(
            err.response?.data?.error?.message ||
              "The verification link is invalid or has expired."
          );
        });
    }
  }, [token]);

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-950 overflow-hidden font-sans">
      {/* Background Decorative Gradients */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-sky-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Glassmorphic Container */}
      <div className="relative z-10 w-full max-w-md p-8 bg-slate-900/60 border border-slate-800 backdrop-blur-2xl rounded-2xl shadow-2xl text-center">
        
        {/* LOADING STATE */}
        {status === "loading" && (
          <div className="py-6">
            <div className="relative mx-auto w-12 h-12 mb-6">
              <div className="h-12 w-12 rounded-full border-t-2 border-r-2 border-sky-500 animate-spin shadow-[0_0_15px_rgba(14,165,233,0.3)]"></div>
              <div className="absolute inset-0 h-12 w-12 rounded-full border-b-2 border-l-2 border-slate-800 animate-ping opacity-30"></div>
            </div>
            <h2 className="text-white text-2xl font-bold tracking-tight mb-2">Verifying Your Email</h2>
            <p className="text-slate-400 text-sm">Securing your credentials, please wait...</p>
          </div>
        )}

        {/* SUCCESS STATE */}
        {status === "success" && (
          <div>
            <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold mb-6">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-white text-3xl font-extrabold tracking-tight mb-2">Email Verified!</h2>
            <p className="text-slate-400 text-sm mb-8 leading-relaxed">
              Your email address has been successfully verified. Your Apex Trading account is now active and ready.
            </p>
            <Link
              href="/login"
              className="inline-block w-full bg-sky-600 hover:bg-sky-500 py-3.5 px-4 rounded-xl text-white font-bold transition-all shadow-[0_4px_15px_rgba(14,165,233,0.3)]"
            >
              Sign In to Dashboard
            </Link>
          </div>
        )}

        {/* ERROR STATE */}
        {status === "error" && (
          <div>
            <div className="mx-auto w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 font-bold mb-6">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-white text-2xl font-bold tracking-tight mb-2">Verification Failed</h2>
            <p className="text-red-400 text-sm mb-6">{errorMessage}</p>
            <p className="text-slate-400 text-sm mb-8">
              The link might have expired or already been used. Please log in to request a new verification link.
            </p>
            <Link
              href="/login"
              className="inline-block w-full bg-slate-800 hover:bg-slate-700 py-3.5 px-4 rounded-xl text-white font-bold transition-all border border-slate-700/80"
            >
              Back to Login
            </Link>
          </div>
        )}

        {/* INFO STATE (NO TOKEN SPECIFIED / FALLBACK CHECK MAIL) */}
        {status === "info" && (
          <div>
            <div className="mx-auto w-16 h-16 rounded-full bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 font-bold mb-6">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l8-5.333a2 2 0 012.22 0l8 5.333A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5" />
              </svg>
            </div>
            <h2 className="text-white text-3xl font-extrabold tracking-tight mb-2">Check Your Inbox</h2>
            <p className="text-slate-400 text-sm mb-8 leading-relaxed">
              We have sent a verification link to your email address. Please click the link to activate your account and start trading.
            </p>
            <Link
              href="/login"
              className="inline-block w-full bg-sky-600 hover:bg-sky-500 py-3.5 px-4 rounded-xl text-white font-bold transition-all shadow-[0_4px_15px_rgba(14,165,233,0.3)]"
            >
              Return to Login
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}

export default function VerifyEmail() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white font-sans">
          Loading...
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
