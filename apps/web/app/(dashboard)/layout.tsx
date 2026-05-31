"use client";

import Link from "next/link";
import { useAuth } from "../../hooks/useAuth";
import { useRouter } from "next/navigation";
import PrivateRoute from "../../components/PrivateRoute";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, clearAuth } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    clearAuth();
    router.push("/login");
  };

  return (
    <PrivateRoute>
      <div className="flex h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 border-r border-slate-800/80 p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center space-x-3 mb-8">
            <div className="h-8 w-8 rounded-lg bg-sky-500 flex items-center justify-center font-bold text-white shadow-[0_0_15px_rgba(14,165,233,0.4)]">
              A
            </div>
            <span className="text-xl font-black tracking-tight text-white">APEX TRADING</span>
          </div>

          <nav className="space-y-1.5">
            <Link
              href="/dashboard"
              className="flex items-center space-x-3 px-4 py-3 rounded-xl bg-slate-800/50 text-white font-medium border border-slate-700/50 transition-all"
            >
              <span>Dashboard</span>
            </Link>
            <Link
              href="/trading"
              className="flex items-center space-x-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/30 transition-all"
            >
              <span>Trading</span>
            </Link>
            <div className="flex items-center space-x-3 px-4 py-3 rounded-xl text-slate-500 cursor-not-allowed">
              <span>Portfolio</span>
            </div>
            <div className="flex items-center space-x-3 px-4 py-3 rounded-xl text-slate-500 cursor-not-allowed">
              <span>Alerts</span>
            </div>
          </nav>
        </div>

        {/* User profile section in sidebar footer */}
        <div className="pt-6 border-t border-slate-800/85">
          {user ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-9 w-9 rounded-full bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 font-bold uppercase">
                  {user.fullName.charAt(0)}
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-semibold text-white truncate max-w-[120px]">
                    {user.fullName}
                  </p>
                  <p className="text-xs text-slate-400 truncate max-w-[120px]">
                    {user.email}
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-950/20 rounded-lg transition-all cursor-pointer"
                title="Logout"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center justify-center w-full bg-sky-600 hover:bg-sky-500 py-2.5 rounded-xl text-sm font-semibold transition-all"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-950">
        {/* Topbar */}
        <header className="h-16 border-b border-slate-800/80 flex items-center justify-between px-8 bg-slate-900/30 backdrop-blur-md">
          <h1 className="text-lg font-bold text-white">Dashboard</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-slate-400 font-medium">
              {user ? `Hello, ${user.fullName} 👋` : "Not signed in"}
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8 bg-slate-950/50">
          {children}
        </main>
      </div>
    </div>
    </PrivateRoute>
  );
}