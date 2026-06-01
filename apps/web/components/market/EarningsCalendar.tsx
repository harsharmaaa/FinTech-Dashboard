"use client";

import React from "react";
import { Skeleton } from "../ui/skeleton";

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
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", weekday: "short" });
  };

  if (error) {
    return (
      <div className="bg-slate-900/40 border border-red-500/20 rounded-2xl p-5 shadow-lg flex flex-col items-center justify-center text-center space-y-3 min-h-[250px] w-full">
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
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 shadow-lg space-y-5 flex-grow">
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
    <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 shadow-lg space-y-4 flex-grow">
      <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">Upcoming Earnings</h3>

      <div className="overflow-x-auto max-h-[300px] no-scrollbar">
        <table className="w-full text-left border-collapse min-w-[450px]">
          <thead>
            <tr className="border-b border-slate-800/80 text-slate-500 font-bold text-[10px] uppercase tracking-wider">
              <th className="pb-2">Date</th>
              <th className="pb-2">Symbol</th>
              <th className="pb-2">Fiscal Period</th>
              <th className="pb-2 text-right">EPS Est.</th>
              <th className="pb-2 text-right">Revenue Est.</th>
              <th className="pb-2 text-right">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/30">
            {earnings.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-xs text-slate-500 font-medium">
                  No upcoming earnings reports
                </td>
              </tr>
            ) : (
              earnings.map((event, index) => (
                <tr key={`${event.symbol}-${index}`} className="text-xs hover:bg-slate-800/10 transition-all">
                  <td className="py-3 font-semibold text-slate-300">{formatDate(event.date)}</td>
                  <td className="py-3">
                    <span className="font-bold text-white tracking-wide block">{event.symbol}</span>
                    <span className="text-[10px] text-slate-500 font-medium truncate block max-w-[120px]">{event.companyName}</span>
                  </td>
                  <td className="py-3 text-slate-400 font-medium">{event.fiscalQuarter}</td>
                  <td className="py-3 text-right font-mono text-slate-200 font-semibold">${event.epsEstimate}</td>
                  <td className="py-3 text-right font-mono text-slate-200 font-semibold">{event.revenueEstimate}</td>
                  <td className="py-3 text-right">
                    <span className={`inline-block font-semibold px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wide ${
                      event.period === "Before Market"
                        ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                    }`}>
                      {event.period === "Before Market" ? "BMO" : "AMC"}
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
