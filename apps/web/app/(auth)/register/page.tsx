"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { authService } from "../../../services/auth.service";

const registerSchema = z
  .object({
    fullName: z.string().min(2, "Full name must be at least 2 characters long"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters long"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function Register() {
  const [isSuccess, setIsSuccess] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const passwordVal = watch("password") || "";

  // Password strength meter calculation
  const getPasswordStrength = (pass: string) => {
    let score = 0;
    if (!pass) return { score, label: "Empty", color: "bg-slate-800" };
    
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    switch (score) {
      case 0:
      case 1:
        return { score, label: "Weak", color: "bg-red-500 w-1/4" };
      case 2:
        return { score, label: "Fair", color: "bg-orange-500 w-2/4" };
      case 3:
        return { score, label: "Good", color: "bg-yellow-500 w-3/4" };
      case 4:
        return { score, label: "Strong", color: "bg-emerald-500 w-full" };
      default:
        return { score, label: "Weak", color: "bg-red-500 w-1/4" };
    }
  };

  const strength = getPasswordStrength(passwordVal);

  const onSubmit = async (values: RegisterFormValues) => {
    try {
      setApiError(null);
      await authService.register({
        email: values.email,
        password: values.password,
        fullName: values.fullName,
      });
      setIsSuccess(true);
    } catch (err: any) {
      setApiError(err.response?.data?.error?.message || "Registration failed. Please try again.");
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l8-5.333a2 2 0 012.22 0l8 5.333A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-2.25-1.5a2 2 0 00-2.22 0l-2.25 1.5" />
            </svg>
          </div>
          <h2 className="text-white text-3xl font-extrabold tracking-tight mb-2">Check your email</h2>
          <p className="text-slate-400 text-sm mb-8 leading-relaxed">
            We have sent a verification link to your email address. Please click the link in the email to activate your account.
          </p>
          <Link
            href="/login"
            className="inline-block w-full bg-sky-600 hover:bg-sky-500 py-3 px-4 rounded-xl text-white font-bold transition-all shadow-[0_4px_15px_rgba(14,165,233,0.3)]"
          >
            Return to Login
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
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-block px-3 py-1 text-xs font-semibold text-sky-400 bg-sky-950/50 border border-sky-800/40 rounded-full mb-3 tracking-wider uppercase">
            Apex Trading Portal
          </div>
          <h1 className="text-white text-3xl font-extrabold tracking-tight mb-1 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Create Account
          </h1>
          <p className="text-slate-400 text-sm">Join Apex to start trading and managing assets.</p>
        </div>

        {/* Global Error Notice */}
        {apiError && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-900/50 text-red-400 text-sm text-center">
            {apiError}
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider">
              Full Name
            </label>
            <input
              type="text"
              {...register("fullName")}
              placeholder="John Doe"
              className="w-full bg-slate-950/80 border border-slate-800 focus:border-sky-500 rounded-xl px-4 py-3 text-white text-sm outline-none transition-all placeholder-slate-600"
            />
            {errors.fullName && (
              <p className="text-red-400 text-xs mt-1 pl-1">{errors.fullName.message}</p>
            )}
          </div>

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

          {/* Password */}
          <div className="space-y-1.5">
            <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider">
              Password
            </label>
            <input
              type="password"
              {...register("password")}
              placeholder="••••••••"
              className="w-full bg-slate-950/80 border border-slate-800 focus:border-sky-500 rounded-xl px-4 py-3 text-white text-sm outline-none transition-all placeholder-slate-600"
            />
            {errors.password && (
              <p className="text-red-400 text-xs mt-1 pl-1">{errors.password.message}</p>
            )}

            {/* Password Strength Indicator */}
            {passwordVal && (
              <div className="mt-2 space-y-1 pl-1">
                <div className="flex justify-between text-[10px] font-semibold uppercase tracking-wider">
                  <span className="text-slate-500">Strength:</span>
                  <span
                    className={
                      strength.score <= 2 ? "text-orange-400" : "text-emerald-400"
                    }
                  >
                    {strength.label}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className={`h-full transition-all duration-300 ${strength.color}`} />
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider">
              Confirm Password
            </label>
            <input
              type="password"
              {...register("confirmPassword")}
              placeholder="••••••••"
              className="w-full bg-slate-950/80 border border-slate-800 focus:border-sky-500 rounded-xl px-4 py-3 text-white text-sm outline-none transition-all placeholder-slate-600"
            />
            {errors.confirmPassword && (
              <p className="text-red-400 text-xs mt-1 pl-1">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-[0_4px_15px_rgba(14,165,233,0.25)] transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none cursor-pointer flex items-center justify-center"
          >
            {isSubmitting ? (
              <div className="h-5 w-5 rounded-full border-2 border-t-transparent border-white animate-spin" />
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        {/* Redirect Footer */}
        <div className="mt-8 text-center text-sm text-slate-400">
          Already have an account?{" "}
          <Link href="/login" className="text-sky-400 hover:text-sky-300 font-semibold transition-all">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}