"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "../../hooks/useAuth";
import { useRouter } from "next/navigation";
import PrivateRoute from "../../components/PrivateRoute";
import { WebSocketProvider } from "../../contexts/WebSocketContext";
import SymbolSearch from "../../components/market/SymbolSearch";
import CommandPalette from "../../components/ui/CommandPalette";
import { Menu, X, Home, TrendingUp, FolderHeart, BellRing, LogOut, ChevronRight } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, clearAuth } = useAuth();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    clearAuth();
    router.push("/login");
  };

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: <Home className="h-4.5 w-4.5" /> },
    { href: "/trading", label: "Trading", icon: <TrendingUp className="h-4.5 w-4.5" /> },
  ];

  const disabledLinks = [
    { label: "Portfolio", icon: <FolderHeart className="h-4.5 w-4.5" /> },
    { label: "Alerts", icon: <BellRing className="h-4.5 w-4.5" /> },
  ];

  const renderSidebarContent = (isMobile = false) => (
    <div className="flex flex-col h-full justify-between">
      <div>
        {/* Brand Logo */}
        <div className="flex items-center space-x-3 mb-8">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-500 flex items-center justify-center font-black text-white shadow-[0_0_20px_rgba(14,165,233,0.3)] text-sm">
            A
          </div>
          <span className="text-lg font-black tracking-tight text-white uppercase bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-400">
            APEX TRADING
          </span>
        </div>

        {/* Links Navigation */}
        <nav className="space-y-1.5">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => isMobile && setIsMobileMenuOpen(false)}
              className="flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-slate-800/30 text-slate-400 hover:text-white transition-all duration-200 group border border-transparent hover:border-slate-800/50"
            >
              <span className="text-slate-500 group-hover:text-sky-400 transition-colors">
                {link.icon}
              </span>
              <span className="text-xs font-bold tracking-wide uppercase">{link.label}</span>
            </Link>
          ))}

          {disabledLinks.map((link, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between px-4 py-3 rounded-xl text-slate-650 cursor-not-allowed border border-transparent select-none"
            >
              <div className="flex items-center space-x-3">
                <span className="text-slate-700">{link.icon}</span>
                <span className="text-xs font-bold tracking-wide uppercase">{link.label}</span>
              </div>
              <span className="text-[9px] bg-slate-900/80 px-2 py-0.5 rounded-full border border-slate-800/60 font-semibold tracking-wider uppercase text-slate-550 scale-90">
                Lock
              </span>
            </div>
          ))}
        </nav>
      </div>

      {/* User Section in Footer */}
      <div className="pt-6 border-t border-slate-800/60">
        {user ? (
          <div className="flex items-center justify-between bg-slate-950/40 border border-slate-800/40 p-3 rounded-2xl">
            <div className="flex items-center space-x-2.5 overflow-hidden">
              <div className="h-9 w-9 shrink-0 rounded-xl bg-gradient-to-tr from-sky-500/10 to-indigo-500/10 border border-sky-500/30 flex items-center justify-center text-sky-450 font-black text-sm uppercase">
                {user.fullName.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-white truncate max-w-[110px]">
                  {user.fullName}
                </p>
                <p className="text-[10px] text-slate-500 font-semibold truncate max-w-[110px]">
                  {user.email}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 rounded-xl transition-all cursor-pointer border border-transparent hover:border-rose-500/10"
              title="Logout"
            >
              <LogOut className="h-4.5 w-4.5" />
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="flex items-center justify-center w-full bg-gradient-to-r from-sky-600 to-indigo-650 hover:from-sky-500 hover:to-indigo-550 py-3 rounded-2xl text-xs font-extrabold transition-all duration-200 tracking-wider uppercase text-white shadow-lg"
          >
            Sign In
          </Link>
        )}
      </div>
    </div>
  );

  return (
    <PrivateRoute>
      <WebSocketProvider>
        <div className="flex h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
          {/* Responsive Sidebar - Desktop View (lg) */}
          <div className="hidden lg:flex w-66 bg-slate-900 border-r border-slate-800/80 p-6 flex-col justify-between shrink-0">
            {renderSidebarContent(false)}
          </div>

          {/* Mobile Navigation Sidebar Drawer (Slide-out Overlay) */}
          {isMobileMenuOpen && (
            <div className="fixed inset-0 z-50 flex lg:hidden">
              {/* Blur backdrop overlay */}
              <div
                className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity duration-300"
                onClick={() => setIsMobileMenuOpen(false)}
              />

              {/* Drawer Container Panel */}
              <div className="relative flex w-full max-w-xs flex-col bg-slate-900 border-r border-slate-800/80 p-6 shadow-2xl animate-fade-in focus:outline-none">
                {/* Close Button */}
                <div className="absolute top-5 right-5">
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-1.5 text-slate-400 hover:text-white bg-slate-850/60 border border-slate-800/85 rounded-xl cursor-pointer hover:border-slate-700/60 transition-all duration-150"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {renderSidebarContent(true)}
              </div>
            </div>
          )}

          {/* Main Workspace Frame */}
          <div className="flex-1 flex flex-col min-w-0 bg-slate-950 overflow-hidden">
            {/* Unified Responsive Topbar */}
            <header className="h-16 border-b border-slate-800/60 flex items-center justify-between px-4 sm:px-8 bg-slate-900/20 backdrop-blur-md gap-4 z-40 shrink-0">
              <div className="flex items-center space-x-3 flex-1 max-w-md">
                {/* Mobile Hamburger menu toggle button */}
                <button
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="lg:hidden p-2 text-slate-400 hover:text-white bg-slate-900/60 border border-slate-800 rounded-xl cursor-pointer hover:border-slate-700 transition-all duration-150"
                  aria-label="Open navigation sidebar"
                >
                  <Menu className="h-4.5 w-4.5" />
                </button>

                {/* Inline Search Bar */}
                <div className="flex-1">
                  <SymbolSearch />
                </div>
              </div>

              {/* Profile Hello Badge */}
              <div className="flex items-center space-x-4 flex-shrink-0">
                <span className="text-[11px] text-slate-400 font-bold bg-slate-900/60 border border-slate-800/80 px-3 py-1.5 rounded-xl hidden sm:inline-block select-none tracking-wide">
                  {user ? `Hello, ${user.fullName.split(" ")[0]} 👋` : "Apex Trader"}
                </span>
              </div>
            </header>

            {/* Scrollable Dashboard Panel */}
            <main className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-950/20">
              {children}
            </main>

            {/* Global Spotlight Palette listener */}
            <CommandPalette />
          </div>
        </div>
      </WebSocketProvider>
    </PrivateRoute>
  );
}