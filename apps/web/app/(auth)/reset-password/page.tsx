"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { authService } from "../../../services/auth.service";

const resetPasswordSchema = z
  .object({
    password: z.string().min(6, "Password must be at least 6 characters long"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [isSuccess, setIsSuccess] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setApiError("Reset token is missing from the link. Please request a new link.");
    }
  }, [token]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (values: ResetPasswordValues) => {
    if (!token) {
      setApiError("Invalid reset token.");
      return;
    }

    try {
      setApiError(null);
      await authService.resetPassword({
        token,
        password: values.password,
      });
      setIsSuccess(true);
      
      // Auto-redirect to login after 3 seconds
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (err: any) {
      setApiError(
        err.response?.data?.error?.message ||
          "Failed to reset password. The link may have expired or is invalid."
      );
    }
  };

  if (isSuccess) {
    return (
      <div className="relative min-h-screen flex items-center justify-center bg-slate-950 overflow-hidden font-sans">
        {/* Background Gradients */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 w-full max-w-md p-8 bg-slate-900/60 border border-slate-800 backdrop-blur-2xl rounded-2xl shadow-2xl text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold mb-6">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-white text-3xl font-extrabold tracking-tight mb-2">Password Reset!</h2>
          <p className="text-slate-400 text-sm mb-8 leading-relaxed">
            Your password has been successfully updated. You are being redirected to the login page...
          </p>
          <Link
            href="/login"
            className="inline-block w-full bg-sky-600 hover:bg-sky-500 py-3.5 px-4 rounded-xl text-white font-bold transition-all shadow-[0_4px_15px_rgba(14,165,233,0.3)]"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-950 overflow-hidden font-sans">
      {/* Background Decorative Gradients */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-sky-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Cyber/Glassmorphic Container */}
      <div className="relative z-10 w-full max-w-md p-8 bg-slate-900/60 border border-slate-800 backdrop-blur-2xl rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-block px-3 py-1 text-xs font-semibold text-sky-400 bg-sky-950/50 border border-sky-800/40 rounded-full mb-3 tracking-wider uppercase">
            Security Update
          </div>
          <h1 className="text-white text-3xl font-extrabold tracking-tight mb-1 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Reset Password
          </h1>
          <p className="text-slate-400 text-sm font-medium">Create a strong new password for your account.</p>
        </div>

        {/* Global Error Notice */}
        {apiError && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-900/50 text-red-400 text-sm text-center">
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* New Password */}
          <div className="space-y-1.5">
            <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider">
              New Password
            </label>
            <input
              type="password"
              {...register("password")}
              placeholder="••••••••"
              disabled={!token}
              className="w-full bg-slate-950/80 border border-slate-800 focus:border-sky-500 rounded-xl px-4 py-3 text-white text-sm outline-none transition-all placeholder-slate-600 disabled:opacity-55"
            />
            {errors.password && (
              <p className="text-red-400 text-xs mt-1 pl-1">{errors.password.message}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider">
              Confirm New Password
            </label>
            <input
              type="password"
              {...register("confirmPassword")}
              placeholder="••••••••"
              disabled={!token}
              className="w-full bg-slate-950/80 border border-slate-800 focus:border-sky-500 rounded-xl px-4 py-3 text-white text-sm outline-none transition-all placeholder-slate-600 disabled:opacity-55"
            />
            {errors.confirmPassword && (
              <p className="text-red-400 text-xs mt-1 pl-1">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting || !token}
            className="w-full bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-[0_4px_15px_rgba(14,165,233,0.25)] transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none cursor-pointer flex items-center justify-center"
          >
            {isSubmitting ? (
              <div className="h-5 w-5 rounded-full border-2 border-t-transparent border-white animate-spin" />
            ) : (
              "Save New Password"
            )}
          </button>
        </form>

        {/* Footer Redirect */}
        <div className="mt-8 text-center text-sm text-slate-400">
          Go back to{" "}
          <Link href="/login" className="text-sky-400 hover:text-sky-300 font-semibold transition-all">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ResetPassword() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white font-sans">
          Loading...
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
