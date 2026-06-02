"use client";

import React, { useMemo } from "react";
import { FolderHeart, TrendingUp, TrendingDown } from "lucide-react";

interface PositionSummaryProps {
  symbol: string;
  currentPrice: number;
}

interface Position {
  shares: number;
  avgCost: number;
}

export const PositionSummary: React.FC<PositionSummaryProps> = ({ symbol, currentPrice }) => {
  const upperSymbol = symbol.toUpperCase().trim();
  const activePrice = currentPrice > 0 ? currentPrice : 150.00;

  // Mock positions data for demo
  const mockPositions: Record<string, Position> = {
    AAPL: { shares: 120, avgCost: 285.20 },
    TSLA: { shares: 80, avgCost: 215.40 },
    MSFT: { shares: 60, avgCost: 405.00 },
    GOOGL: { shares: 150, avgCost: 155.80 },
    AMZN: { shares: 95, avgCost: 165.10 },
  };

  const position = useMemo(() => mockPositions[upperSymbol] || null, [upperSymbol]);

  if (!position) {
    return (
      <div className="bg-slate-900/30 border border-slate-900 backdrop-blur-md rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-center min-h-[180px] group">
        <div className="flex items-center space-x-2 text-slate-500 mb-2">
          <FolderHeart className="h-4.5 w-4.5" />
          <span className="text-[10px] font-extrabold uppercase tracking-wider">Active Position</span>
        </div>
        <p className="text-xs text-slate-400 font-semibold select-none italic text-center py-6 bg-slate-950/20 border border-slate-900/60 rounded-2xl">
          No holdings in {upperSymbol}.
        </p>
      </div>
    );
  }

  const costBasis = position.shares * position.avgCost;
  const marketValue = position.shares * activePrice;
  const unrealizedPnL = marketValue - costBasis;
  const pnlPercent = (unrealizedPnL / costBasis) * 100;
  const isPositive = unrealizedPnL >= 0;

  return (
    <div className="bg-slate-900/30 border border-slate-900 backdrop-blur-md rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between group">
      {/* Decorative vertical gradient bar */}
      <div className={`absolute top-0 bottom-0 left-0 w-[2px] bg-gradient-to-b ${
        isPositive ? "from-emerald-500 to-transparent" : "from-rose-500 to-transparent"
      }`} />

      {/* Header */}
      <div className="flex items-center justify-between mb-5 select-none">
        <div className="flex items-center space-x-2.5">
          <div className="h-8 w-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <FolderHeart className="h-4.5 w-4.5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-xs font-black text-white uppercase tracking-wider">My Position</h3>
            <p className="text-[9px] text-slate-500 font-extrabold tracking-wider uppercase mt-0.5">{position.shares} shares owned</p>
          </div>
        </div>
        <span
          className={`flex items-center space-x-1 font-mono text-[9px] font-black px-2.5 py-0.5 rounded-full border shadow-sm ${
            isPositive
              ? "bg-emerald-500/10 text-emerald-450 border-emerald-500/25"
              : "bg-rose-500/10 text-rose-450 border-rose-500/25"
          }`}
        >
          {isPositive ? <TrendingUp className="h-2.5 w-2.5 mr-0.5" /> : <TrendingDown className="h-2.5 w-2.5 mr-0.5" />}
          <span>{isPositive ? "+" : ""}{pnlPercent.toFixed(2)}%</span>
        </span>
      </div>

      {/* Pricing and P&L info */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-4 mb-5 font-mono select-none">
        <div className="bg-slate-950/25 border border-slate-900/50 p-3 rounded-2xl">
          <span className="text-[9px] text-slate-500 font-sans font-extrabold uppercase tracking-wider block mb-1">Market Value</span>
          <span className="text-sm font-black text-white">
            ${marketValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div className="bg-slate-950/25 border border-slate-900/50 p-3 rounded-2xl">
          <span className="text-[9px] text-slate-500 font-sans font-extrabold uppercase tracking-wider block mb-1">Cost Basis</span>
          <span className="text-sm font-black text-slate-350">
            ${costBasis.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div className="bg-slate-950/25 border border-slate-900/50 p-3 rounded-2xl">
          <span className="text-[9px] text-slate-500 font-sans font-extrabold uppercase tracking-wider block mb-1">Avg. Purchase Price</span>
          <span className="text-sm font-black text-slate-350">
            ${position.avgCost.toFixed(2)}
          </span>
        </div>
        <div className={`bg-slate-950/25 border border-slate-900/50 p-3 rounded-2xl ${isPositive ? "shadow-[inset_0_0_12px_rgba(16,185,129,0.02)]" : "shadow-[inset_0_0_12px_rgba(244,63,94,0.02)]"}`}>
          <span className="text-[9px] text-slate-500 font-sans font-extrabold uppercase tracking-wider block mb-1">Unrealized P&L</span>
          <span className={`text-sm font-black ${isPositive ? "text-emerald-400" : "text-rose-400"}`}>
            {isPositive ? "+" : ""}${unrealizedPnL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PositionSummary;
