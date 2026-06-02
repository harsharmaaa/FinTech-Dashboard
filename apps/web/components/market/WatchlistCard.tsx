"use client";

import React, { useEffect, useState } from "react";
import { useQuote } from "../../hooks/useQuote";
import { PriceDisplay } from "../trading/PriceDisplay";
import { MiniSparkline } from "../trading/MiniSparkline";
import { Skeleton } from "../ui/skeleton";
import { api } from "../../services/api";
import { useRouter } from "next/navigation";

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
  const router = useRouter();
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
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between shadow-lg h-[145px]">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <Skeleton className="h-5 w-12" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-7 w-20" />
        </div>
        <div className="flex justify-between items-end mt-6">
          <div className="space-y-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-3 w-10" />
          </div>
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
    );
  }

  return (
    <div 
      onClick={() => router.push(`/trading/${upperSymbol}`)}
      className="relative bg-gradient-to-br from-slate-900/50 to-slate-900/90 border border-slate-800/60 hover:border-sky-500/30 rounded-2xl p-5 flex flex-col justify-between hover:bg-slate-900/90 hover:scale-[1.02] hover:shadow-[0_8px_30px_rgb(0,0,0,0.4)] transition-all duration-300 group cursor-pointer overflow-hidden"
    >
      {/* Dynamic background pulse glow corresponding to stock gains/losses */}
      <div className={`absolute -right-6 -bottom-6 h-16 w-16 rounded-full blur-[35px] opacity-10 group-hover:scale-150 transition-all ${
        isPositive ? "bg-emerald-500" : "bg-rose-500"
      }`} />

      <div className="flex justify-between items-start z-10">
        {/* Symbol and Name */}
        <div>
          <h2 className="text-lg font-black text-white tracking-tight group-hover:text-sky-400 transition-colors uppercase">
            {upperSymbol}
          </h2>
          <p className="text-[10px] text-slate-500 font-extrabold truncate max-w-[100px] uppercase tracking-wider mt-0.5">
            {companyName}
          </p>
        </div>

        {/* Live Price Display */}
        <div className="text-right">
          <PriceDisplay price={quote.price} change={quote.change} className="text-sm font-black border-slate-800/40" />
        </div>
      </div>

      <div className="flex justify-between items-end mt-6 z-10">
        {/* Daily Change indicator */}
        <div>
          <span
            className={`text-[10px] font-black font-mono px-2 py-0.5 rounded-full shadow-sm border ${
              isPositive 
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                : "bg-rose-500/10 text-rose-400 border-rose-500/20"
            }`}
          >
            {isPositive ? "+" : ""}
            {quote.changePercent.toFixed(2)}%
          </span>
          <p className="text-[9px] text-slate-500 font-bold mt-1.5 uppercase tracking-wider">
            Daily Change
          </p>
        </div>

        {/* Sparkline Visual */}
        <div className="flex items-center justify-end group-hover:scale-[1.03] transition-transform duration-300">
          {isSparklineLoading ? (
            <Skeleton className="h-9 w-24" />
          ) : error ? (
            <span className="text-[9px] text-slate-600 font-extrabold italic uppercase tracking-wider">Trend NA</span>
          ) : sparklineData.length > 0 ? (
            <MiniSparkline data={sparklineData} isPositive={isPositive} />
          ) : (
            <span className="text-xs text-slate-600 font-medium">No trend</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default WatchlistCard;
