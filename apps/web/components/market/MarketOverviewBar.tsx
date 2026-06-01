"use client";

import React from "react";
import { useQuote } from "../../hooks/useQuote";

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
    <div className="w-full bg-slate-900/40 border-y border-slate-800/80 overflow-x-auto no-scrollbar scroll-smooth flex items-center py-3.5 px-6 space-x-6">
      {indices.map(({ label, symbol, quote }) => {
        const isPositive = quote.changePercent >= 0;
        return (
          <div 
            key={symbol} 
            className="flex items-center space-x-4 shrink-0 bg-slate-900/40 border border-slate-800/60 px-4 py-2 rounded-xl hover:bg-slate-900/60 hover:border-slate-700/50 transition-all duration-300 shadow-md"
          >
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-slate-400 tracking-tight">{label}</span>
              <span className="text-[10px] font-bold text-slate-500 font-mono mt-0.5 uppercase tracking-wide">{symbol}</span>
            </div>
            
            <div className="flex flex-col items-end">
              <span className="font-mono text-sm font-bold text-white">
                {quote.isLoading ? (
                  <span className="inline-block h-4 w-16 bg-slate-800 animate-pulse rounded" />
                ) : (
                  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(quote.price)
                )}
              </span>
              <span
                className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded mt-0.5 ${
                  isPositive 
                    ? "bg-emerald-500/10 text-emerald-400" 
                    : "bg-rose-500/10 text-rose-400"
                }`}
              >
                {quote.isLoading ? (
                  <span className="inline-block h-3.5 w-10 bg-slate-800/80 animate-pulse rounded" />
                ) : (
                  `${isPositive ? "+" : ""}${quote.changePercent.toFixed(2)}%`
                )}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MarketOverviewBar;
