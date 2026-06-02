"use client";

import React, { useMemo } from "react";
import { Layers } from "lucide-react";

interface MarketDepthProps {
  currentPrice: number;
}

interface OrderBookLevel {
  price: number;
  size: number;
  total: number;
}

export const MarketDepth: React.FC<MarketDepthProps> = ({ currentPrice }) => {
  const activePrice = currentPrice > 0 ? currentPrice : 150.0;

  // Generate mock order book levels based on currentPrice
  const { bids, asks, maxCumulativeSize, spread, spreadPercent } = useMemo(() => {
    const bidLevels: OrderBookLevel[] = [];
    const askLevels: OrderBookLevel[] = [];
    
    // Hardcoded factors to generate deterministic offsets
    const bidOffsets = [0.03, 0.08, 0.15, 0.24, 0.35];
    const bidSizes = [450, 1200, 850, 2100, 1600];

    const askOffsets = [0.04, 0.10, 0.18, 0.28, 0.40];
    const askSizes = [380, 750, 1400, 920, 1950];

    let bidCum = 0;
    for (let i = 0; i < 5; i++) {
      const price = activePrice - (bidOffsets[i] || 0.01);
      const size = bidSizes[i] || 100;
      bidCum += size;
      bidLevels.push({ price, size, total: bidCum });
    }

    let askCum = 0;
    for (let i = 0; i < 5; i++) {
      const price = activePrice + (askOffsets[i] || 0.01);
      const size = askSizes[i] || 100;
      askCum += size;
      askLevels.push({ price, size, total: askCum });
    }

    const maxCum = Math.max(bidCum, askCum);
    const spr = (askLevels[0]?.price || 0) - (bidLevels[0]?.price || 0);
    const sprPct = (spr / activePrice) * 100;

    return {
      bids: bidLevels,
      asks: askLevels,
      maxCumulativeSize: maxCum,
      spread: spr,
      spreadPercent: sprPct,
    };
  }, [activePrice]);

  return (
    <div className="bg-slate-900/30 border border-slate-900 backdrop-blur-md rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center space-x-2.5 mb-6">
        <div className="h-8 w-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
          <Layers className="h-4 w-4 text-indigo-400" />
        </div>
        <div>
          <h3 className="text-xs font-black text-white uppercase tracking-wider">Market Depth</h3>
          <p className="text-[9px] text-slate-500 font-extrabold tracking-wider uppercase mt-0.5">Real-time order book bids & asks</p>
        </div>
      </div>

      {/* Main depths comparison columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        {/* Asks (Sell orders - Red depth, sorted worst/highest top, best lowest) */}
        <div className="space-y-3.5">
          <h4 className="text-[10px] font-black text-rose-400 uppercase tracking-widest flex items-center select-none">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500 mr-2 shadow-[0_0_6px_#f43f5e]" />
            Ask Offers (Sells)
          </h4>
          <div className="space-y-1.5">
            <div className="flex justify-between text-[9px] text-slate-500 font-bold uppercase tracking-wider select-none px-1">
              <span>Price (USD)</span>
              <span>Size (Shares)</span>
            </div>
            
            <div className="space-y-1">
              {asks.map((ask, idx) => {
                const percentage = (ask.total / maxCumulativeSize) * 100;
                return (
                  <div
                    key={idx}
                    className="relative flex justify-between items-center py-2 px-2.5 rounded-lg overflow-hidden text-xs font-mono font-medium hover:bg-slate-800/10 cursor-pointer"
                  >
                    {/* Depth shade bar */}
                    <div
                      className="absolute right-0 top-0 bottom-0 bg-rose-500/[0.04] transition-all duration-300 pointer-events-none"
                      style={{ width: `${percentage}%` }}
                    />
                    <span className="text-rose-455 font-bold z-10">${ask.price.toFixed(2)}</span>
                    <span className="text-slate-300 font-bold z-10">{ask.size.toLocaleString()}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bids (Buy orders - Green depth, sorted best highest top, worst lowest) */}
        <div className="space-y-3.5">
          <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center select-none">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-2 shadow-[0_0_6px_#10b981]" />
            Bid Offers (Buys)
          </h4>
          <div className="space-y-1.5">
            <div className="flex justify-between text-[9px] text-slate-500 font-bold uppercase tracking-wider select-none px-1">
              <span>Price (USD)</span>
              <span>Size (Shares)</span>
            </div>

            <div className="space-y-1">
              {bids.map((bid, idx) => {
                const percentage = (bid.total / maxCumulativeSize) * 100;
                return (
                  <div
                    key={idx}
                    className="relative flex justify-between items-center py-2 px-2.5 rounded-lg overflow-hidden text-xs font-mono font-medium hover:bg-slate-800/10 cursor-pointer"
                  >
                    {/* Depth shade bar */}
                    <div
                      className="absolute right-0 top-0 bottom-0 bg-emerald-500/[0.04] transition-all duration-300 pointer-events-none"
                      style={{ width: `${percentage}%` }}
                    />
                    <span className="text-emerald-455 font-bold z-10">${bid.price.toFixed(2)}</span>
                    <span className="text-slate-300 font-bold z-10">{bid.size.toLocaleString()}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Spread footer banner */}
      <div className="mt-6 pt-5 border-t border-slate-900 flex justify-between items-center select-none text-[10px] font-mono">
        <span className="text-slate-500 font-sans font-extrabold uppercase tracking-wider">Spread Bid/Ask</span>
        <span className="text-slate-400 font-bold">
          ${spread.toFixed(2)} <span className="text-sky-400/80 ml-1.5">({spreadPercent.toFixed(3)}%)</span>
        </span>
      </div>
    </div>
  );
};

export default MarketDepth;
