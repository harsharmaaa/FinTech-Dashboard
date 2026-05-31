"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { useAuth } from "../../../hooks/useAuth";
import { authService } from "../../../services/auth.service";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function LoginContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { setAuth, isAuthenticated } = useAuth();
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  // Decode JWT Payload statelessly
  const decodeTokenAndSetAuth = (token: string) => {
    const base64Url = token.split(".")[1];
    if (!base64Url) throw new Error("Invalid token format");
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const payload = JSON.parse(jsonPayload);

    const user = {
      id: payload.userId,
      email: payload.email,
      fullName: payload.fullName || "User",
      role: payload.role || "USER",
    };

    setAuth(user, token);
  };

  // Google OAuth redirect callback listener
  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      try {
        decodeTokenAndSetAuth(token);
        console.log("🔑 Google login successful!");
        router.replace("/dashboard");
      } catch (error) {
        console.error("Failed to parse Google login token:", error);
        setApiError("Google authentication failed. Please try again.");
      }
    }
  }, [searchParams, router]);

  // Session expired notice
  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam === "session_expired") {
      setApiError("Your session has expired. Please sign in again.");
    } else if (errorParam === "oauth_failed") {
      setApiError("Google Sign-In failed. Please try again.");
    }
  }, [searchParams]);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, router]);

  const onLocalSubmit = async (values: LoginFormValues) => {
    try {
      setApiError(null);
      const res = await authService.login({
        email: values.email,
        password: values.password,
      });

      const token = res.data.accessToken;
      decodeTokenAndSetAuth(token);

      console.log("🔑 Credentials login successful!");
      router.replace("/dashboard");
    } catch (err: any) {
      setApiError(
        err.response?.data?.error?.message || "Invalid credentials. Please check your inputs."
      );
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:3001/api/v1/auth/oauth/google";
  };

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
            Welcome Back
          </h1>
          <p className="text-slate-400 text-sm">Sign in to manage your portfolio and trade.</p>
        </div>

        {/* Global Error Notice */}
        {apiError && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-900/50 text-red-400 text-sm text-center">
            {apiError}
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit(onLocalSubmit)} className="space-y-5">
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
            <div className="flex justify-between items-center">
              <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs text-sky-400 hover:text-sky-300 font-semibold transition-all"
              >
                Forgot Password?
              </Link>
            </div>
            <input
              type="password"
              {...register("password")}
              placeholder="••••••••"
              className="w-full bg-slate-950/80 border border-slate-800 focus:border-sky-500 rounded-xl px-4 py-3 text-white text-sm outline-none transition-all placeholder-slate-600"
            />
            {errors.password && (
              <p className="text-red-400 text-xs mt-1 pl-1">{errors.password.message}</p>
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
              "Sign In"
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800/80"></div>
          </div>
          <span className="relative z-10 px-4 bg-slate-900/60 text-slate-500 text-xs font-semibold uppercase tracking-wider">
            Or continue with
          </span>
        </div>

        {/* Google SSO Button */}
        <button
          onClick={handleGoogleLogin}
          className="flex items-center justify-center w-full bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-950 font-bold py-3.5 px-4 rounded-xl border border-slate-200 shadow-[0_4px_12px_rgba(255,255,255,0.05)] transition-all duration-300 transform hover:-translate-y-0.5 cursor-pointer"
        >
          <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          Continue with Google
        </button>

        {/* Redirect Footer */}
        <div className="mt-8 text-center text-sm text-slate-400">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-sky-400 hover:text-sky-300 font-semibold transition-all">
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function Login() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white font-sans">
          Loading...
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}