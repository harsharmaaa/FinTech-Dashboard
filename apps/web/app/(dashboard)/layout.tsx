"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "../../hooks/useAuth";
import { useRouter, usePathname } from "next/navigation";
import PrivateRoute from "../../components/PrivateRoute";
import { WebSocketProvider } from "../../contexts/WebSocketContext";
import { useWebSocket } from "../../hooks/useWebSocket";
import SymbolSearch from "../../components/market/SymbolSearch";
import CommandPalette from "../../components/ui/CommandPalette";
import { 
  Menu, X, Home, TrendingUp, FolderHeart, BellRing, LogOut, 
  ChevronRight, ChevronLeft, ShieldCheck, User 
} from "lucide-react";

function WebSocketStatus() {
  const { isConnected } = useWebSocket();
  return (
    <div className="flex items-center space-x-2 bg-slate-900/60 border border-slate-800/80 px-3 py-1.5 rounded-xl select-none">
      <span
        className={`h-2 w-2 rounded-full transition-all duration-500 ${
          isConnected
            ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
            : "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)] animate-pulse"
        }`}
      />
      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
        {isConnected ? "Live" : "Offline"}
      </span>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, clearAuth } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = () => {
    clearAuth();
    router.push("/login");
  };

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: <Home className="h-5 w-5" /> },
    { href: "/trading", label: "Trading", icon: <TrendingUp className="h-5 w-5" /> },
  ];

  const disabledLinks = [
    { label: "Portfolio", icon: <FolderHeart className="h-5 w-5" /> },
    { label: "Alerts", icon: <BellRing className="h-5 w-5" /> },
  ];

  const renderSidebarContent = (isMobileView = false) => {
    const showLabels = isMobileView || !isCollapsed;

    return (
      <div className="flex flex-col h-full justify-between">
        <div>
          {/* Brand Logo Header */}
          <div className={`flex items-center ${showLabels ? "space-x-3" : "justify-center"} mb-8`}>
            <div className="h-10 w-10 shrink-0 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-650 flex items-center justify-center font-black text-white shadow-[0_0_20px_rgba(16,185,129,0.25)] text-base">
              A
            </div>
            {showLabels && (
              <span className="text-sm font-black tracking-widest text-white uppercase bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-400">
                APEX TRADING
              </span>
            )}
          </div>

          {/* Links Navigation */}
          <nav className="space-y-1.5">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => isMobileView && setIsMobileMenuOpen(false)}
                  className={`flex items-center ${
                    showLabels ? "space-x-3.5 px-4" : "justify-center"
                  } py-3.5 rounded-xl border transition-all duration-300 group ${
                    isActive
                      ? "bg-slate-900 border-slate-800 text-emerald-400 shadow-md font-bold"
                      : "bg-transparent border-transparent text-slate-450 hover:bg-slate-900/30 hover:text-white"
                  }`}
                  title={!showLabels ? link.label : undefined}
                >
                  <span className={`transition-colors duration-300 ${isActive ? "text-emerald-400" : "text-slate-500 group-hover:text-emerald-400"}`}>
                    {link.icon}
                  </span>
                  {showLabels && <span className="text-xs tracking-wider uppercase">{link.label}</span>}
                </Link>
              );
            })}

            {disabledLinks.map((link, idx) => (
              <div
                key={idx}
                className={`flex items-center ${
                  showLabels ? "justify-between px-4" : "justify-center"
                } py-3.5 rounded-xl text-slate-700 cursor-not-allowed select-none`}
                title={!showLabels ? `${link.label} (Locked)` : undefined}
              >
                <div className={`flex items-center ${showLabels ? "space-x-3.5" : ""}`}>
                  <span>{link.icon}</span>
                  {showLabels && <span className="text-xs tracking-wider uppercase">{link.label}</span>}
                </div>
                {showLabels && (
                  <span className="text-[9px] bg-slate-950/80 px-2 py-0.5 rounded-full border border-slate-900 font-semibold uppercase tracking-wider scale-90">
                    Lock
                  </span>
                )}
              </div>
            ))}
          </nav>
        </div>

        {/* Footer User Info */}
        <div className="pt-6 border-t border-slate-900">
          {user ? (
            <div className={`flex items-center ${
              showLabels ? "justify-between bg-slate-950/50 border border-slate-900 p-3 rounded-2xl" : "justify-center py-2"
            }`}>
              <div className="flex items-center space-x-2.5 overflow-hidden">
                <div className="h-9 w-9 shrink-0 rounded-xl bg-gradient-to-tr from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-black text-sm uppercase shadow-sm">
                  {user.fullName.charAt(0)}
                </div>
                {showLabels && (
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-white truncate max-w-[110px]">
                      {user.fullName}
                    </p>
                    <p className="text-[9px] text-slate-500 font-semibold truncate max-w-[110px] mt-0.5">
                      {user.email}
                    </p>
                  </div>
                )}
              </div>
              {showLabels ? (
                <button
                  onClick={handleLogout}
                  className="p-1.5 text-slate-450 hover:text-rose-400 hover:bg-rose-950/20 rounded-xl transition-all cursor-pointer border border-transparent hover:border-rose-500/10"
                  title="Logout"
                >
                  <LogOut className="h-4.5 w-4.5" />
                </button>
              ) : (
                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-550 hover:text-rose-400 bg-slate-950/40 hover:bg-rose-950/20 border border-slate-900 rounded-xl transition-all cursor-pointer"
                  title="Logout"
                >
                  <LogOut className="h-4.5 w-4.5" />
                </button>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className={`flex items-center justify-center w-full bg-emerald-600 hover:bg-emerald-500 py-3.5 rounded-2xl text-xs font-extrabold transition-all duration-200 tracking-wider uppercase text-white shadow-lg`}
            >
              {showLabels ? "Sign In" : <User className="h-5 w-5" />}
            </Link>
          )}

          {/* Desktop Collapse Toggle Arrow */}
          {!isMobileView && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:flex items-center justify-center w-full mt-4 py-2 text-slate-500 hover:text-white border border-dashed border-slate-900 hover:border-slate-800 rounded-xl transition-colors cursor-pointer"
              title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <PrivateRoute>
      <WebSocketProvider>
        <div className="flex h-screen bg-[#0B0C0E] text-slate-100 font-sans overflow-hidden">
          {/* Responsive Sidebar - Desktop View (lg) */}
          <div className={`hidden lg:flex ${
            isCollapsed ? "w-24" : "w-64"
          } bg-[#0E0F12] border-r border-slate-900/60 p-6 flex-col justify-between shrink-0 transition-all duration-300`}>
            {renderSidebarContent(false)}
          </div>

          {/* Mobile Navigation Sidebar Drawer (Slide-out Overlay) */}
          {isMobileMenuOpen && (
            <div className="fixed inset-0 z-50 flex lg:hidden">
              {/* Blur backdrop overlay */}
              <div
                className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm transition-opacity duration-300"
                onClick={() => setIsMobileMenuOpen(false)}
              />

              {/* Drawer Container Panel */}
              <div className="relative flex w-full max-w-xs flex-col bg-[#0E0F12] border-r border-slate-900/80 p-6 shadow-2xl animate-fade-in focus:outline-none">
                {/* Close Button */}
                <div className="absolute top-5 right-5">
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 text-slate-400 hover:text-white bg-slate-950/80 border border-slate-900/80 rounded-xl cursor-pointer hover:border-slate-800 transition-all duration-150"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {renderSidebarContent(true)}
              </div>
            </div>
          )}

          {/* Main Workspace Frame */}
          <div className="flex-1 flex flex-col min-w-0 bg-[#0B0C0E] overflow-hidden">
            {/* Unified Responsive Topbar */}
            <header className="h-16 border-b border-slate-900/60 flex items-center justify-between px-4 sm:px-8 bg-[#0E0F12]/40 backdrop-blur-md gap-4 z-40 shrink-0">
              <div className="flex items-center space-x-3 flex-1 max-w-md">
                {/* Mobile Hamburger menu toggle button */}
                <button
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="lg:hidden p-2 text-slate-400 hover:text-white bg-[#0E0F12] border border-slate-900 rounded-xl cursor-pointer hover:border-slate-800 transition-all duration-150"
                  aria-label="Open navigation sidebar"
                >
                  <Menu className="h-4.5 w-4.5" />
                </button>

                {/* Inline Search Bar */}
                <div className="flex-1">
                  <SymbolSearch />
                </div>
              </div>

              {/* Profile Hello Badge & WS Status */}
              <div className="flex items-center space-x-3 flex-shrink-0">
                <WebSocketStatus />
                <span className="text-[10px] text-slate-400 font-extrabold bg-slate-950/50 border border-slate-900 px-3.5 py-1.5 rounded-xl hidden sm:inline-block select-none tracking-wider uppercase">
                  {user ? `Hello, ${user.fullName.split(" ")[0]} 👋` : "Apex Trader"}
                </span>
              </div>
            </header>

            {/* Scrollable Dashboard Panel */}
            <main className="flex-1 overflow-y-auto p-4 sm:p-8 bg-[#0B0C0E]/10">
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