"use client";

import React from "react";
import { Skeleton } from "../ui/skeleton";
import { Calendar, Clock } from "lucide-react";
import { useRouter } from "next/navigation";

export interface EarningsEvent {
  symbol: string;
  companyName: string;
  date: string;
  fiscalQuarter: string;
  epsEstimate: string;
  revenueEstimate: string;
  period: string;
}

interface EarningsCalendarProps {
  earnings: EarningsEvent[];
  isLoading: boolean;
  error?: string | null;
}

export const EarningsCalendar: React.FC<EarningsCalendarProps> = ({ earnings, isLoading, error }) => {
  const router = useRouter();
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", weekday: "short" });
  };

  if (error) {
    return (
      <div className="bg-slate-900/30 border border-red-500/20 rounded-2xl p-6 shadow-lg flex flex-col items-center justify-center text-center space-y-3 min-h-[250px] w-full backdrop-blur-md">
        <div className="h-10 w-10 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center shadow-md">
          <svg className="w-5 h-5 text-red-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div>
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">Earnings Unavailable</h4>
          <p className="text-[10px] text-slate-400 mt-1 max-w-[200px] leading-relaxed">{error}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-5 shadow-lg space-y-5 flex-grow backdrop-blur-md">
        <Skeleton className="h-4 w-1/3" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3.5 w-1/4" />
              <Skeleton className="h-3.5 w-full animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-5 md:p-6 shadow-xl flex flex-col backdrop-blur-md relative overflow-hidden flex-grow">
      {/* Decorative gradient border top */}
      <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-indigo-500/20 to-sky-500/20" />

      <h3 className="text-xs font-extrabold text-white uppercase tracking-wider mb-4 flex items-center">
        <Calendar className="h-3.5 w-3.5 mr-2 text-indigo-400" />
        Upcoming Corporate Earnings
      </h3>

      <div className="overflow-x-auto max-h-[320px] no-scrollbar scroll-smooth border border-slate-800/40 rounded-xl">
        <table className="w-full text-left border-collapse min-w-[500px]">
          <thead>
            <tr className="border-b border-slate-800/80 bg-slate-950/45 text-slate-500 font-extrabold text-[9px] uppercase tracking-wider">
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Company</th>
              <th className="py-3 px-4">Fiscal Period</th>
              <th className="py-3 px-4 text-right">EPS Est</th>
              <th className="py-3 px-4 text-right">Rev Est</th>
              <th className="py-3 px-4 text-center">Session</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/30 bg-slate-900/10">
            {earnings.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-xs text-slate-500 font-bold select-none italic">
                  No upcoming earnings reports
                </td>
              </tr>
            ) : (
              earnings.map((event, index) => (
                <tr 
                  key={`${event.symbol}-${index}`} 
                  onClick={() => router.push(`/trading/${event.symbol.toUpperCase()}`)}
                  className="text-xs hover:bg-slate-800/25 transition-all duration-150 cursor-pointer"
                >
                  <td className="py-3.5 px-4 font-semibold text-slate-350">{formatDate(event.date)}</td>
                  <td className="py-3.5 px-4">
                    <span className="font-extrabold text-white tracking-wide block uppercase">{event.symbol}</span>
                    <span className="text-[9px] text-slate-550 font-bold truncate block max-w-[120px] uppercase tracking-wider mt-0.5">{event.companyName}</span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-450 font-bold uppercase text-[10px]">{event.fiscalQuarter}</td>
                  <td className="py-3.5 px-4 text-right font-mono text-slate-300 font-bold">${event.epsEstimate}</td>
                  <td className="py-3.5 px-4 text-right font-mono text-slate-300 font-bold">{event.revenueEstimate}</td>
                  <td className="py-3.5 px-4 text-center">
                    <span className={`inline-flex items-center space-x-1 font-extrabold px-2.5 py-0.5 rounded-full text-[9px] uppercase tracking-wider border shadow-sm ${
                      event.period === "Before Market"
                        ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                    }`}>
                      <Clock className="h-2 w-2 mr-0.5 shrink-0" />
                      <span>{event.period === "Before Market" ? "BMO" : "AMC"}</span>
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EarningsCalendar;
