"use client";

import React, { useEffect, useState } from "react";
import { useWebSocket } from "../../hooks/useWebSocket";
import { Activity } from "lucide-react";

interface RecentTradesProps {
  symbol: string;
}

interface Trade {
  time: string;
  price: number;
  size: number;
  direction: "buy" | "sell";
}

export const RecentTrades: React.FC<RecentTradesProps> = ({ symbol }) => {
  const { lastMessage } = useWebSocket();
  const [trades, setTrades] = useState<Trade[]>([]);

  // Seed initial mock trades
  useEffect(() => {
    const initialTrades: Trade[] = [];
    const now = new Date();
    for (let i = 0; i < 8; i++) {
      const timeOffset = new Date(now.getTime() - i * 15 * 1000);
      initialTrades.push({
        time: timeOffset.toLocaleTimeString("en-US", { hour12: false }),
        price: 0, // Will be filled once pricing is known or defaults to mock
        size: Math.floor(10 + Math.random() * 80) * 10,
        direction: Math.random() > 0.5 ? "buy" : "sell",
      });
    }
    setTrades(initialTrades);
  }, [symbol]);

  // Prepend live ticks from WebSocket
  useEffect(() => {
    if (
      lastMessage &&
      lastMessage.type === "quote" &&
      lastMessage.symbol.toUpperCase() === symbol.toUpperCase()
    ) {
      const price = lastMessage.price;
      const direction = Math.random() > 0.45 ? "buy" : "sell";
      const size = Math.floor(10 + Math.random() * 150) * 5;

      const newTrade: Trade = {
        time: new Date().toLocaleTimeString("en-US", { hour12: false }),
        price,
        size,
        direction,
      };

      setTrades((prev) => {
        // Hydrate default price for seeded trades if they were 0
        const list = prev.map((t) => (t.price === 0 ? { ...t, price: price * (1 + (Math.random() - 0.5) * 0.002) } : t));
        return [newTrade, ...list.slice(0, 7)];
      });
    }
  }, [lastMessage, symbol]);

  return (
    <div className="bg-slate-900/30 border border-slate-900 backdrop-blur-md rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between flex-grow">
      {/* Header */}
      <div className="flex items-center space-x-2.5 mb-5 select-none">
        <div className="h-8 w-8 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
          <Activity className="h-4.5 w-4.5 text-sky-400" />
        </div>
        <div>
          <h3 className="text-xs font-black text-white uppercase tracking-wider">Recent Executions</h3>
          <p className="text-[9px] text-slate-500 font-extrabold tracking-wider uppercase mt-0.5">Live ticks stream updates</p>
        </div>
      </div>

      {/* Trades Table List */}
      <div className="space-y-1.5 flex-grow">
        <div className="flex justify-between text-[9px] text-slate-500 font-bold uppercase tracking-wider select-none px-2.5 pb-2 border-b border-slate-900">
          <span>Time</span>
          <span className="text-right">Price</span>
          <span className="text-right">Size (Shares)</span>
        </div>

        <div className="space-y-0.5">
          {trades.map((trade, idx) => {
            const isBuy = trade.direction === "buy";
            return (
              <div
                key={idx}
                className="flex justify-between items-center py-2 px-2.5 rounded-lg hover:bg-slate-800/10 transition-colors text-xs font-mono font-medium"
              >
                <span className="text-slate-500 font-bold">{trade.time}</span>
                <span className={`text-right font-black ${isBuy ? "text-emerald-455" : "text-rose-455"}`}>
                  ${trade.price > 0 ? trade.price.toFixed(2) : "..."}
                </span>
                <span className="text-slate-350 text-right font-bold">{trade.size}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RecentTrades;
