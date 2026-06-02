"use client";

import React, { useState, useEffect } from "react";
import { ShieldCheck, ArrowDown, ArrowUp, Loader2, CheckCircle2 } from "lucide-react";

interface OrderPanelProps {
  symbol: string;
  currentPrice: number;
}

export const OrderPanel: React.FC<OrderPanelProps> = ({ symbol, currentPrice }) => {
  const [tab, setTab] = useState<"buy" | "sell">("buy");
  const [orderType, setOrderType] = useState<"market" | "limit" | "stop">("market");
  const [qty, setQty] = useState<number>(10);
  const [limitPrice, setLimitPrice] = useState<string>("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const buyingPower = 100000.00; // Mock static paper buying power
  const upperSymbol = symbol.toUpperCase().trim();

  // Set default limit price when price updates
  useEffect(() => {
    if (currentPrice > 0) {
      setLimitPrice(currentPrice.toFixed(2));
    }
  }, [currentPrice]);

  const activePrice = orderType === "market" ? currentPrice : parseFloat(limitPrice) || 0;
  const estimatedCost = qty * activePrice;
  const executionFees = estimatedCost * 0.0005; // 0.05% fee
  const totalCost = estimatedCost + executionFees;

  const isInsufficient = tab === "buy" && totalCost > buyingPower;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (qty <= 0 || activePrice <= 0 || isInsufficient) return;

    setIsExecuting(true);
    setSuccessMessage(null);

    // Simulate exchange execution delay
    setTimeout(() => {
      setIsExecuting(false);
      setSuccessMessage(
        `✅ Success! ${tab === "buy" ? "Bought" : "Sold"} ${qty} shares of ${upperSymbol} at $${activePrice.toFixed(
          2
        )} per share.`
      );
      // Clear success banner after 4 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 4000);
    }, 1200);
  };

  const handlePercentageClick = (pct: number) => {
    const targetFund = buyingPower * pct;
    const computedQty = Math.floor(targetFund / activePrice);
    setQty(Math.max(1, computedQty));
  };

  return (
    <div className="bg-slate-900/30 border border-slate-900 backdrop-blur-md rounded-3xl p-6 shadow-xl relative overflow-hidden group">
      {/* Visual top border indicator */}
      <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r transition-all duration-500 ${
        tab === "buy" ? "from-emerald-500 to-transparent" : "from-rose-500 to-transparent"
      }`} />

      {/* Tabs BUY/SELL */}
      <div className="flex space-x-2.5 p-1 bg-slate-950/40 border border-slate-900 rounded-2xl mb-6 select-none">
        <button
          onClick={() => { setTab("buy"); setSuccessMessage(null); }}
          className={`flex-1 flex items-center justify-center space-x-1.5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
            tab === "buy"
              ? "bg-emerald-500 text-white shadow-[0_4px_12px_rgba(16,185,129,0.25)]"
              : "text-slate-500 hover:text-white"
          }`}
        >
          <ArrowUp className="h-3.5 w-3.5" />
          <span>Buy</span>
        </button>
        <button
          onClick={() => { setTab("sell"); setSuccessMessage(null); }}
          className={`flex-1 flex items-center justify-center space-x-1.5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
            tab === "sell"
              ? "bg-rose-500 text-white shadow-[0_4px_12px_rgba(244,63,94,0.25)]"
              : "text-slate-500 hover:text-white"
          }`}
        >
          <ArrowDown className="h-3.5 w-3.5" />
          <span>Sell</span>
        </button>
      </div>

      {/* Success Notification Banner overlay */}
      {successMessage && (
        <div className="mb-6 p-4 border border-emerald-500/20 bg-emerald-500/10 rounded-2xl flex items-start space-x-3 text-emerald-400 text-xs font-semibold leading-relaxed animate-fade-in">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400 mt-0.5" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Order Entry Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Order type selector */}
        <div className="space-y-1.5">
          <label className="block text-slate-500 text-[10px] font-extrabold uppercase tracking-wider select-none">Order Type</label>
          <div className="grid grid-cols-3 gap-2 bg-slate-950/25 p-1 border border-slate-900 rounded-xl select-none">
            {(["market", "limit", "stop"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setOrderType(type)}
                className={`text-[9px] font-black uppercase py-2 rounded-lg border transition-all cursor-pointer ${
                  orderType === type
                    ? "bg-slate-900 border-slate-800 text-white font-black"
                    : "bg-transparent border-transparent text-slate-500 hover:text-white"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Quantity Input */}
        <div className="space-y-1.5">
          <label className="block text-slate-500 text-[10px] font-extrabold uppercase tracking-wider select-none">Quantity Shares</label>
          <input
            type="number"
            min={1}
            value={qty || ""}
            onChange={(e) => setQty(parseInt(e.target.value) || 0)}
            className="w-full bg-slate-950/60 border border-slate-900 focus:border-slate-800 rounded-xl px-4 py-3 text-white font-mono font-bold text-sm outline-none transition-all"
          />
        </div>

        {/* Dynamic Percentage Selection Sliders */}
        <div className="grid grid-cols-4 gap-2 select-none">
          {[0.1, 0.25, 0.5, 1.0].map((val) => (
            <button
              key={val}
              type="button"
              onClick={() => handlePercentageClick(val)}
              className="text-[9px] font-extrabold py-2 bg-slate-950/25 border border-slate-900 hover:border-slate-800 text-slate-400 hover:text-white rounded-lg transition-all cursor-pointer"
            >
              {val === 1.0 ? "MAX" : `${val * 100}%`}
            </button>
          ))}
        </div>

        {/* Price Input (Visible when Limit / Stop) */}
        {orderType !== "market" && (
          <div className="space-y-1.5 animate-fade-in">
            <label className="block text-slate-500 text-[10px] font-extrabold uppercase tracking-wider select-none">
              {orderType === "limit" ? "Limit Price" : "Stop Price"} (USD)
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={limitPrice}
              onChange={(e) => setLimitPrice(e.target.value)}
              className="w-full bg-slate-950/60 border border-slate-900 focus:border-slate-800 rounded-xl px-4 py-3 text-white font-mono font-bold text-sm outline-none transition-all"
            />
          </div>
        )}

        {/* Cost Estimator Pane */}
        <div className="bg-slate-950/25 border border-slate-900/60 p-4 rounded-2xl space-y-3 font-semibold text-xs select-none">
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-bold uppercase text-[10px] tracking-wider">Est. Price</span>
            <span className="text-white font-mono font-bold">${activePrice.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-bold uppercase text-[10px] tracking-wider">Execution Fee (0.05%)</span>
            <span className="text-white font-mono font-bold">${executionFees.toFixed(2)}</span>
          </div>
          <div className="border-t border-slate-900/80 pt-3 flex justify-between items-center text-sm font-black">
            <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Total Cost</span>
            <span className="text-white font-mono">${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>

        {/* Submit Execution Button */}
        <button
          type="submit"
          disabled={qty <= 0 || activePrice <= 0 || isExecuting || isInsufficient}
          className={`w-full py-4 px-5 rounded-2xl font-black text-xs uppercase tracking-wider transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none cursor-pointer flex items-center justify-center shadow-lg ${
            isInsufficient
              ? "bg-slate-850 text-rose-400 border border-rose-500/10 cursor-not-allowed shadow-none"
              : tab === "buy"
                ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/20"
                : "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/20"
          }`}
        >
          {isExecuting ? (
            <Loader2 className="h-4.5 w-4.5 animate-spin" />
          ) : isInsufficient ? (
            "Insufficient Capital"
          ) : (
            `${tab === "buy" ? "Place Buy" : "Place Sell"} Order`
          )}
        </button>
      </form>

      {/* Account Status Footer Banner */}
      <div className="mt-6 pt-5 border-t border-slate-900 flex justify-between items-center select-none text-[10px]">
        <div className="flex items-center space-x-1.5">
          <ShieldCheck className="h-4.5 w-4.5 text-sky-400" />
          <span className="text-slate-400 font-bold uppercase tracking-wider">Buying Power</span>
        </div>
        <span className="text-emerald-400 font-mono font-black">${buyingPower.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
      </div>
    </div>
  );
};

export default OrderPanel;
