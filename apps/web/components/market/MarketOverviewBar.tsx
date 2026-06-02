"use client";

import React from "react";
import { useQuote } from "../../hooks/useQuote";
import { TrendingUp, TrendingDown, RefreshCw } from "lucide-react";

export const MarketOverviewBar: React.FC = () => {
  const spy = useQuote("SPY");
  const qqq = useQuote("QQQ");
  const dia = useQuote("DIA");
  const iwm = useQuote("IWM");

  const indices = [
    { label: "S&P 500", symbol: "SPY", quote: spy },
    { label: "NASDAQ 100", symbol: "QQQ", quote: qqq },
    { label: "DOW 30", symbol: "DIA", quote: dia },
    { label: "Russell 2000", symbol: "IWM", quote: iwm },
  ];

  return (
    <div className="w-full bg-slate-900/10 border-y border-slate-800/40 overflow-x-auto no-scrollbar scroll-smooth flex items-center py-4 px-6 space-x-6 select-none shrink-0 backdrop-blur-3xl">
      {indices.map(({ label, symbol, quote }) => {
        const isPositive = quote.changePercent >= 0;
        
        return (
          <div 
            key={symbol} 
            className="flex items-center space-x-4 shrink-0 bg-gradient-to-br from-slate-900/40 to-slate-900/80 border border-slate-800/60 hover:border-slate-700/60 px-5 py-3 rounded-2xl hover:scale-[1.01] hover:bg-slate-900/80 transition-all duration-300 shadow-lg group relative overflow-hidden"
          >
            {/* Soft decorative background glow */}
            <div className={`absolute top-0 right-0 h-10 w-10 rounded-full blur-[25px] opacity-15 transition-all group-hover:scale-125 ${
              quote.isLoading 
                ? "bg-slate-500" 
                : isPositive 
                  ? "bg-emerald-500" 
                  : "bg-rose-500"
            }`} />

            {/* Label and Ticker symbol */}
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-slate-400 group-hover:text-white transition-colors tracking-wide uppercase">{label}</span>
              <span className="text-[10px] font-extrabold text-slate-500 font-mono mt-0.5 tracking-wider uppercase">{symbol}</span>
            </div>
            
            {/* Price values and Change status */}
            <div className="flex items-center space-x-3 border-l border-slate-800/85 pl-4">
              <div className="flex flex-col items-end">
                <span className="font-mono text-xs font-black text-white tracking-tight">
                  {quote.isLoading ? (
                    <div className="h-4.5 w-16 bg-slate-800 animate-pulse rounded-lg" />
                  ) : (
                    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(quote.price)
                  )}
                </span>
                
                <span
                  className={`font-mono text-[9px] font-extrabold px-2 py-0.5 rounded-full mt-1 flex items-center space-x-1 shadow-sm uppercase ${
                    quote.isLoading 
                      ? "bg-slate-800/85 text-slate-500" 
                      : isPositive 
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                        : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                  }`}
                >
                  {quote.isLoading ? (
                    <div className="h-3 w-8 bg-slate-800/60 animate-pulse rounded-full" />
                  ) : (
                    <>
                      {isPositive ? <TrendingUp className="h-2.5 w-2.5 mr-0.5" /> : <TrendingDown className="h-2.5 w-2.5 mr-0.5" />}
                      <span>{isPositive ? "+" : ""}{quote.changePercent.toFixed(2)}%</span>
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MarketOverviewBar;
