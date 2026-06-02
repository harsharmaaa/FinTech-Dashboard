"use client";

import React, { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, TrendingUp, DollarSign, Activity, Percent, Layers, ShieldCheck } from "lucide-react";
import { useQuote } from "../../../../hooks/useQuote";
import { PriceDisplay } from "../../../../components/trading/PriceDisplay";
import { api } from "../../../../services/api";

import { CandlestickChart } from "../../../../components/trading/CandlestickChart";
import { OrderPanel } from "../../../../components/trading/OrderPanel";
import { PositionSummary } from "../../../../components/trading/PositionSummary";
import { MarketDepth } from "../../../../components/trading/MarketDepth";
import { RecentTrades } from "../../../../components/trading/RecentTrades";
import { SymbolWatchlist } from "../../../../components/trading/SymbolWatchlist";

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
        const res = await api.get("/api/v1/market/assets");
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
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Chart and Details Area */}
        <div className="lg:col-span-3 space-y-6">
          <CandlestickChart symbol={symbol} />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PositionSummary symbol={symbol} currentPrice={quote.price} />
            <MarketDepth currentPrice={quote.price} />
          </div>
          
          <RecentTrades symbol={symbol} />
        </div>

        {/* Sidebar Order Actions Container */}
        <div className="space-y-6 lg:col-span-1">
          <OrderPanel symbol={symbol} currentPrice={quote.price} />
          <SymbolWatchlist activeSymbol={symbol} />
        </div>
      </div>
    </div>
  );
}
