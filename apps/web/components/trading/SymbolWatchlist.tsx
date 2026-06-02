"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useQuote } from "../../hooks/useQuote";
import { BookOpen, TrendingUp, TrendingDown } from "lucide-react";

interface SymbolWatchlistProps {
  activeSymbol: string;
}

interface WatchlistItemProps {
  symbol: string;
  isActive: boolean;
}

const WatchlistItem: React.FC<WatchlistItemProps> = ({ symbol, isActive }) => {
  const router = useRouter();
  const quote = useQuote(symbol);
  const isPositive = quote.changePercent >= 0;

  return (
    <div
      onClick={() => router.push(`/trading/${symbol.toUpperCase()}`)}
      className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all duration-300 cursor-pointer ${
        isActive
          ? "bg-slate-900 border-slate-800 text-emerald-400 font-bold shadow-md"
          : "bg-transparent border-transparent hover:bg-slate-900/35 hover:text-white text-slate-400"
      }`}
    >
      <div className="flex flex-col">
        <span className={`text-xs font-black uppercase ${isActive ? "text-emerald-400" : "text-white"}`}>
          {symbol}
        </span>
        <span className="text-[9px] text-slate-550 font-bold uppercase tracking-wider mt-0.5">
          {symbol === "AAPL" && "Apple"}
          {symbol === "MSFT" && "Microsoft"}
          {symbol === "TSLA" && "Tesla"}
          {symbol === "GOOGL" && "Google"}
          {symbol === "AMZN" && "Amazon"}
        </span>
      </div>

      <div className="flex flex-col items-end border-l border-slate-900/80 pl-3">
        <span className="font-mono text-[11px] font-extrabold text-white">
          {quote.isLoading ? "..." : `$${quote.price.toFixed(2)}`}
        </span>
        
        {!quote.isLoading && (
          <span
            className={`font-mono text-[9px] font-black mt-1 flex items-center ${
              isPositive ? "text-emerald-400" : "text-rose-455"
            }`}
          >
            {isPositive ? "+" : ""}
            {quote.changePercent.toFixed(2)}%
          </span>
        )}
      </div>
    </div>
  );
};

export const SymbolWatchlist: React.FC<SymbolWatchlistProps> = ({ activeSymbol }) => {
  const watchlist = ["AAPL", "MSFT", "TSLA", "GOOGL", "AMZN"];
  const upperActive = activeSymbol.toUpperCase().trim();

  return (
    <div className="bg-slate-900/30 border border-slate-900 backdrop-blur-md rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center space-x-2.5 mb-5 select-none">
        <div className="h-8 w-8 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
          <BookOpen className="h-4.5 w-4.5 text-sky-400" />
        </div>
        <div>
          <h3 className="text-xs font-black text-white uppercase tracking-wider">Tickers Watchlist</h3>
          <p className="text-[9px] text-slate-500 font-extrabold tracking-wider uppercase mt-0.5">Click to switch views</p>
        </div>
      </div>

      {/* Symbol List Grid */}
      <div className="space-y-1.5">
        {watchlist.map((symbol) => (
          <WatchlistItem
            key={symbol}
            symbol={symbol}
            isActive={symbol === upperActive}
          />
        ))}
      </div>
    </div>
  );
};

export default SymbolWatchlist;
