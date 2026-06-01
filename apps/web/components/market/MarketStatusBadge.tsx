"use client";

import React, { useState, useEffect } from "react";

export interface ClockData {
  is_open: boolean;
  next_open: string;
  next_close: string;
}

interface MarketStatusBadgeProps {
  clock: ClockData | null;
}

export const MarketStatusBadge: React.FC<MarketStatusBadgeProps> = ({ clock }) => {
  const [countdown, setCountdown] = useState<string>("");

  useEffect(() => {
    if (!clock) return;

    const targetDate = new Date(clock.is_open ? clock.next_close : clock.next_open);

    const updateTimer = () => {
      const now = new Date();
      const diffMs = targetDate.getTime() - now.getTime();

      if (diffMs <= 0) {
        setCountdown("Updating...");
        return;
      }

      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

      const formatted = [
        String(hours).padStart(2, "0"),
        String(minutes).padStart(2, "0"),
        String(seconds).padStart(2, "0"),
      ].join(":");

      setCountdown(formatted);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [clock]);

  if (!clock) {
    return (
      <div className="h-7 w-48 bg-slate-800/60 border border-slate-800/80 animate-pulse rounded-full" />
    );
  }

  return (
    <div className="flex items-center space-x-2.5 bg-slate-900/60 border border-slate-800/65 px-4 py-1.5 rounded-full shadow-lg">
      <span className="flex h-2 w-2 relative shrink-0">
        {clock.is_open ? (
          <>
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </>
        ) : (
          <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
        )}
      </span>
      <span className="text-xs font-bold text-slate-200 uppercase tracking-wide">
        {clock.is_open ? "Market Open" : "Market Closed"}
      </span>
      <span className="text-slate-600 font-bold text-[10px] tracking-widest uppercase">
        |
      </span>
      <span className="text-xs font-mono font-bold text-sky-400">
        {clock.is_open ? `closes in ${countdown}` : `opens in ${countdown}`}
      </span>
    </div>
  );
};

export default MarketStatusBadge;
