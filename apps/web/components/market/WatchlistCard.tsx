"use client";

import React, { useEffect, useState } from "react";
import { useQuote } from "../../hooks/useQuote";
import { PriceDisplay } from "../trading/PriceDisplay";
import { MiniSparkline } from "../trading/MiniSparkline";
import { Skeleton } from "../ui/skeleton";
import { api } from "../../services/api";

const COMPANY_NAMES: Record<string, string> = {
  AAPL: "Apple Inc.",
  MSFT: "Microsoft Corp.",
  TSLA: "Tesla Inc.",
  GOOGL: "Alphabet Inc.",
  AMZN: "Amazon.com Inc.",
};

interface WatchlistCardProps {
  symbol: string;
}

export const WatchlistCard: React.FC<WatchlistCardProps> = ({ symbol }) => {
  const upperSymbol = symbol.toUpperCase().trim();
  const companyName = COMPANY_NAMES[upperSymbol] || "Unknown Corp";

  const quote = useQuote(upperSymbol);
  const [sparklineData, setSparklineData] = useState<number[]>([]);
  const [isSparklineLoading, setIsSparklineLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch the last 20 daily bars for sparkline trends
  useEffect(() => {
    let active = true;
    async function fetchHistoricalData() {
      try {
        const res = await api.get(`/v1/market/bars/${upperSymbol}?timeframe=1Day&limit=20`);
        const bars = res.data.data.bars || [];
        if (active) {
          const closes = bars.map((b: any) => Number(b.close));
          setSparklineData(closes);
          setIsSparklineLoading(false);
        }
      } catch (err) {
        console.error(`Error loading sparkline data for ${upperSymbol}:`, err);
        if (active) {
          setError("Failed to fetch historical trends");
          setIsSparklineLoading(false);
        }
      }
    }

    fetchHistoricalData();
    return () => {
      active = false;
    };
  }, [upperSymbol]);

  const isPositive = quote.changePercent >= 0;

  if (quote.isLoading) {
    return (
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between shadow-lg h-[142px]">
        <div className="flex justify-between items-start">
          <div className="space-y-1.5">
            <Skeleton className="h-5 w-12" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-7 w-20" />
        </div>
        <div className="flex justify-between items-end mt-6">
          <div className="space-y-1.5">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-3 w-10" />
          </div>
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between hover:bg-slate-900/85 hover:border-slate-700/60 transition-all duration-300 group shadow-lg">
      <div className="flex justify-between items-start">
        {/* Symbol and Name */}
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight group-hover:text-sky-400 transition-colors">
            {upperSymbol}
          </h2>
          <p className="text-xs text-slate-400 font-medium truncate max-w-[140px]">
            {companyName}
          </p>
        </div>

        {/* Live Price Display */}
        <div className="text-right">
          <PriceDisplay price={quote.price} change={quote.change} />
        </div>
      </div>

      <div className="flex justify-between items-end mt-6">
        {/* Daily Change indicator */}
        <div>
          <span
            className={`text-xs font-bold font-mono px-2 py-0.5 rounded-full ${
              isPositive 
                ? "bg-emerald-500/10 text-emerald-400" 
                : "bg-rose-500/10 text-rose-400"
            }`}
          >
            {isPositive ? "+" : ""}
            {quote.changePercent.toFixed(2)}%
          </span>
          <p className="text-[10px] text-slate-500 font-semibold mt-1 uppercase tracking-wider">
            Daily Change
          </p>
        </div>

        {/* Sparkline Visual */}
        <div className="flex items-center justify-end">
          {isSparklineLoading ? (
            <Skeleton className="h-9 w-24" />
          ) : error ? (
            <span className="text-[10px] text-slate-600 font-medium italic">Trend unavailable</span>
          ) : sparklineData.length > 0 ? (
            <MiniSparkline data={sparklineData} isPositive={isPositive} />
          ) : (
            <span className="text-xs text-slate-600 font-medium">No trend data</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default WatchlistCard;
