"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { authService } from "../../../services/auth.service";

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const [isSuccess, setIsSuccess] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (values: ForgotPasswordValues) => {
    try {
      setApiError(null);
      await authService.forgotPassword(values.email);
      setIsSuccess(true);
    } catch (err: any) {
      setApiError(
        err.response?.data?.error?.message ||
          "Failed to request password reset. Please try again."
      );
    }
  };

  if (isSuccess) {
    return (
      <div className="relative min-h-screen flex items-center justify-center bg-slate-950 overflow-hidden font-sans">
        {/* Background Gradients */}
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-sky-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 w-full max-w-md p-8 bg-slate-900/60 border border-slate-800 backdrop-blur-2xl rounded-2xl shadow-2xl text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 font-bold mb-6">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l8-5.333a2 2 0 012.22 0l8 5.333A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5" />
            </svg>
          </div>
          <h2 className="text-white text-3xl font-extrabold tracking-tight mb-2">Check Your Inbox</h2>
          <p className="text-slate-400 text-sm mb-8 leading-relaxed">
            If an account matches that email, we have sent a password reset link to it. Please follow the link to select a new password.
          </p>
          <Link
            href="/login"
            className="inline-block w-full bg-sky-600 hover:bg-sky-500 py-3.5 px-4 rounded-xl text-white font-bold transition-all shadow-[0_4px_15px_rgba(14,165,233,0.3)]"
          >
            Back to Login
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
            Reset Request
          </div>
          <h1 className="text-white text-3xl font-extrabold tracking-tight mb-1 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Forgot Password
          </h1>
          <p className="text-slate-400 text-sm">
            Enter your email and we will send you a reset link.
          </p>
        </div>

        {/* Global Error Notice */}
        {apiError && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-900/50 text-red-400 text-sm text-center">
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Email */}
          <div className="space-y-1.5">
            <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider">
              Email Address
            </label>
            <input
              type="email"
              {...register("email")}
              placeholder="john@example.com"
              className="w-full bg-slate-950/80 border border-slate-800 focus:border-sky-500 rounded-xl px-4 py-3 text-white text-sm outline-none transition-all placeholder-slate-600"
            />
            {errors.email && (
              <p className="text-red-400 text-xs mt-1 pl-1">{errors.email.message}</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-[0_4px_15px_rgba(14,165,233,0.25)] transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none cursor-pointer flex items-center justify-center"
          >
            {isSubmitting ? (
              <div className="h-5 w-5 rounded-full border-2 border-t-transparent border-white animate-spin" />
            ) : (
              "Send Reset Link"
            )}
          </button>
        </form>

        {/* Footer Redirect */}
        <div className="mt-8 text-center text-sm text-slate-400">
          Remember your password?{" "}
          <Link href="/login" className="text-sky-400 hover:text-sky-300 font-semibold transition-all">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
