"use client";

import React, { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, TrendingUp, DollarSign, Activity, Percent, Layers, ShieldCheck } from "lucide-react";
import { useQuote } from "../../../../hooks/useQuote";
import { PriceDisplay } from "../../../../components/trading/PriceDisplay";
import { api } from "../../../../services/api";

interface PageProps {
  params: Promise<{ symbol: string }>;
}

interface AssetDetails {
  symbol: string;
  name: string;
  exchange: string;
  tradable: boolean;
}

export default function TradingSymbolPage({ params }: PageProps) {
  const { symbol } = use(params);
  const router = useRouter();
  const quote = useQuote(symbol);
  
  const [assetDetails, setAssetDetails] = useState<AssetDetails | null>(null);

  useEffect(() => {
    async function loadAssetMetadata() {
      try {
        const res = await api.get("/v1/market/assets");
        const list = res.data.data || [];
        const match = list.find((a: any) => a.symbol.toUpperCase() === symbol.toUpperCase());
        if (match) {
          setAssetDetails(match);
        }
      } catch (err) {
        console.error("Failed to load asset metadata:", err);
      }
    }
    loadAssetMetadata();
  }, [symbol]);

  const displayName = assetDetails?.name || `${symbol.toUpperCase()} Corporation`;
  const displayExchange = assetDetails?.exchange || "US Equity";

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="flex items-center text-xs font-bold text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 transition-all cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5 mr-2" />
          Back to Dashboard
        </Link>
        <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider bg-slate-900/50 border border-slate-800 px-3 py-1 rounded-full flex items-center">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse shadow-[0_0_6px_#10b981]" />
          Live Connected
        </span>
      </div>

      {/* Main Stock Banner */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 backdrop-blur-md">
        <div className="space-y-2">
          <div className="flex items-center space-x-3.5">
            <span className="text-3xl font-black text-white bg-slate-850 border border-slate-800 px-3.5 py-1.5 rounded-2xl tracking-wide shadow-md">
              {symbol.toUpperCase()}
            </span>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">{displayName}</h1>
              <p className="text-[10px] text-slate-500 font-extrabold tracking-wider uppercase mt-0.5">{displayExchange} • Tradable Equity</p>
            </div>
          </div>
        </div>

        {/* Real-time Pricing Info */}
        <div className="flex items-center space-x-6">
          <div className="text-right">
            <p className="text-[10px] text-slate-500 font-extrabold tracking-wider uppercase mb-1">Last Quote Price</p>
            <div className="flex items-center space-x-2">
              <PriceDisplay price={quote.price} change={quote.change} className="text-xl py-1 px-3 rounded-xl" />
            </div>
          </div>
          
          <div className="text-right border-l border-slate-800/85 pl-6">
            <p className="text-[10px] text-slate-500 font-extrabold tracking-wider uppercase mb-1">24h Change</p>
            <span className={`text-base font-mono font-bold ${quote.changePercent >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {quote.changePercent >= 0 ? "+" : ""}
              {quote.changePercent.toFixed(2)}%
            </span>
          </div>
        </div>
      </div>

      {/* Grid containing Chart and Sidebar Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Area */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 shadow-xl flex flex-col h-[480px] justify-between relative overflow-hidden group">
            {/* Grid Mesh effect in background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-[0.12]" />

            <div className="flex items-center justify-between z-10">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4 text-sky-500" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Interactive Candlestick Chart</h3>
              </div>
              <div className="flex space-x-1">
                {["1m", "5m", "1H", "1D", "1W"].map((tf) => (
                  <button
                    key={tf}
                    className={`text-[10px] font-extrabold px-2.5 py-1.5 rounded-lg border transition-all ${
                      tf === "1D"
                        ? "bg-sky-500 border-sky-600 text-white font-black"
                        : "bg-slate-800/50 border-slate-700/50 text-slate-400 hover:text-white"
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>

            {/* Glowing placeholder center graphics */}
            <div className="flex-1 flex flex-col items-center justify-center space-y-4 z-10">
              <div className="h-16 w-16 rounded-3xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(14,165,233,0.15)] group-hover:scale-105 transition-all duration-300">
                <TrendingUp className="h-8 w-8 text-sky-400" />
              </div>
              <div className="text-center max-w-sm">
                <h4 className="text-sm font-extrabold text-white">OHLCV Candlesticks Engine</h4>
                <p className="text-xs text-slate-400 mt-1 font-semibold leading-relaxed">
                  Interactive TimescaleDB querying, custom timeframe intervals, and volume charts are coming in Day 21.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-800/60 pt-4 z-10 text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
              <span>Timezone: EST (NY TIME)</span>
              <span>Alpaca Feed: IEX Real-time</span>
            </div>
          </div>

          {/* Quick Metrics Statistics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 shadow-md">
              <div className="flex items-center space-x-1 text-slate-500 mb-1">
                <DollarSign className="h-3.5 w-3.5" />
                <span className="text-[10px] font-extrabold uppercase tracking-wider">Bid Price</span>
              </div>
              <p className="text-sm font-mono font-bold text-white">${quote.bid.toFixed(2)}</p>
            </div>
            
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 shadow-md">
              <div className="flex items-center space-x-1 text-slate-500 mb-1">
                <Activity className="h-3.5 w-3.5" />
                <span className="text-[10px] font-extrabold uppercase tracking-wider">Ask Price</span>
              </div>
              <p className="text-sm font-mono font-bold text-white">${quote.ask.toFixed(2)}</p>
            </div>

            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 shadow-md">
              <div className="flex items-center space-x-1 text-slate-500 mb-1">
                <Layers className="h-3.5 w-3.5" />
                <span className="text-[10px] font-extrabold uppercase tracking-wider">Daily Volume</span>
              </div>
              <p className="text-sm font-mono font-bold text-white">
                {quote.volume > 1e6 ? `${(quote.volume / 1e6).toFixed(2)}M` : quote.volume.toLocaleString()}
              </p>
            </div>

            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 shadow-md">
              <div className="flex items-center space-x-1 text-slate-500 mb-1">
                <Percent className="h-3.5 w-3.5" />
                <span className="text-[10px] font-extrabold uppercase tracking-wider">Spread</span>
              </div>
              <p className="text-sm font-mono font-bold text-white">
                {quote.ask > quote.bid ? `$${(quote.ask - quote.bid).toFixed(2)}` : "$0.01"}
              </p>
            </div>
          </div>
        </div>

        {/* Sidebar Order Actions Container */}
        <div className="space-y-6">
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 shadow-xl space-y-6 backdrop-blur-md">
            <div>
              <h3 className="text-sm font-extrabold text-white uppercase tracking-wider mb-1">Execution Hub</h3>
              <p className="text-xs text-slate-500 font-semibold">Place virtual mock trading executions for this symbol.</p>
            </div>

            {/* Mock Execution Options */}
            <div className="space-y-4">
              <div className="flex space-x-3">
                <button className="flex-1 bg-emerald-500 hover:bg-emerald-400 py-3 rounded-2xl text-xs font-extrabold text-white transition-all cursor-not-allowed shadow-[0_4px_12px_rgba(16,185,129,0.2)]">
                  Buy {symbol.toUpperCase()}
                </button>
                <button className="flex-1 bg-rose-500 hover:bg-rose-400 py-3 rounded-2xl text-xs font-extrabold text-white transition-all cursor-not-allowed shadow-[0_4px_12px_rgba(244,63,94,0.2)]">
                  Sell {symbol.toUpperCase()}
                </button>
              </div>

              <div className="border-t border-slate-800/80 pt-4 space-y-3">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-400">Order Type</span>
                  <span className="text-white">Market Order</span>
                </div>
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-400">Route Type</span>
                  <span className="text-white">IEX Direct</span>
                </div>
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-400">Buying Power</span>
                  <span className="text-emerald-400">$100,000.00 (Paper)</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-start space-x-3">
              <ShieldCheck className="h-5 w-5 text-sky-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-white">Paper Trading Enabled</h4>
                <p className="text-[10px] text-slate-400 font-medium leading-relaxed mt-0.5">
                  Apex operates fully under paper credentials. Rest easy, no real capital is ever put at risk.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
