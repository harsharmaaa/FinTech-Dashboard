"use client";

import React, { useEffect, useState } from "react";
import WatchlistCard from "../../../components/market/WatchlistCard";
import MarketOverviewBar from "../../../components/market/MarketOverviewBar";
import MarketStatusBadge, { ClockData } from "../../../components/market/MarketStatusBadge";
import TopMoversTable, { Mover } from "../../../components/market/TopMoversTable";
import NewsFeed, { NewsArticle } from "../../../components/market/NewsFeed";
import EarningsCalendar, { EarningsEvent } from "../../../components/market/EarningsCalendar";
import { api } from "../../../services/api";
import { LineChart, ShieldAlert } from "lucide-react";

export default function Dashboard() {
  const watchlist = ["AAPL", "MSFT", "TSLA", "GOOGL", "AMZN"];

  const [clock, setClock] = useState<ClockData | null>(null);
  const [movers, setMovers] = useState<{ gainers: Mover[]; losers: Mover[] }>({ gainers: [], losers: [] });
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [earnings, setEarnings] = useState<EarningsEvent[]>([]);

  const [isOverviewLoading, setIsOverviewLoading] = useState(true);
  const [isNewsLoading, setIsNewsLoading] = useState(true);
  const [isEarningsLoading, setIsEarningsLoading] = useState(true);

  const [overviewError, setOverviewError] = useState<string | null>(null);
  const [newsError, setNewsError] = useState<string | null>(null);
  const [earningsError, setEarningsError] = useState<string | null>(null);

  // Fetch overview (clock & movers)
  useEffect(() => {
    let active = true;
    async function loadOverview() {
      try {
        setIsOverviewLoading(true);
        setOverviewError(null);
        const res = await api.get("/v1/market/overview");
        const data = res.data.data;
        if (active) {
          setClock(data.clock);
          setMovers({
            gainers: data.topGainers || [],
            losers: data.topLosers || [],
          });
        }
      } catch (err: any) {
        console.error("Failed to load market overview data:", err);
        if (active) {
          setOverviewError(err.response?.data?.error?.message || "Failed to retrieve market statistics.");
        }
      } finally {
        if (active) {
          setIsOverviewLoading(false);
        }
      }
    }
    loadOverview();
    return () => {
      active = false;
    };
  }, []);

  // Fetch news
  useEffect(() => {
    let active = true;
    async function loadNews() {
      try {
        setIsNewsLoading(true);
        setNewsError(null);
        const res = await api.get("/v1/market/news?limit=20");
        if (active) {
          setNews(res.data.data || []);
        }
      } catch (err: any) {
        console.error("Failed to load market news:", err);
        if (active) {
          setNewsError(err.response?.data?.error?.message || "Failed to retrieve stock market news.");
        }
      } finally {
        if (active) {
          setIsNewsLoading(false);
        }
      }
    }
    loadNews();
    return () => {
      active = false;
    };
  }, []);

  // Fetch earnings
  useEffect(() => {
    let active = true;
    async function loadEarnings() {
      try {
        setIsEarningsLoading(true);
        setEarningsError(null);
        const res = await api.get("/v1/market/calendar/earnings?days=7");
        if (active) {
          setEarnings(res.data.data || []);
        }
      } catch (err: any) {
        console.error("Failed to load earnings calendar:", err);
        if (active) {
          setEarningsError(err.response?.data?.error?.message || "Failed to retrieve earnings calendar.");
        }
      } finally {
        if (active) {
          setIsEarningsLoading(false);
        }
      }
    }
    loadEarnings();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fade-in">
      {/* Premium Header Title Section & Market Status Clock */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 bg-gradient-to-br from-slate-900/20 to-slate-900/60 border border-slate-800/40 p-6 md:p-8 rounded-3xl backdrop-blur-md relative overflow-hidden group shadow-xl">
        {/* Soft blue glowing element */}
        <div className="absolute -left-12 -top-12 h-24 w-24 rounded-full bg-sky-500 blur-[40px] opacity-10" />

        <div className="space-y-1.5 z-10">
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white uppercase flex items-center bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-400">
            <LineChart className="h-7 w-7 text-sky-400 mr-2.5" />
            Market Dashboard
          </h1>
          <p className="text-[10px] md:text-xs text-slate-400 font-bold uppercase tracking-wider">
            Real-time equity quotes, global indices tracking, and latest market insights.
          </p>
        </div>
        <div className="self-start md:self-auto z-10 shrink-0">
          <MarketStatusBadge clock={clock} />
        </div>
      </div>

      {/* Indices Ticker Overview Horizontal Scrolling Bar */}
      <MarketOverviewBar />

      {/* Main Grid Responsive Partition Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Columns Container (occupies 2/3 of space on lg screens) */}
        <div className="lg:col-span-2 space-y-6 flex flex-col">
          {/* Watchlist Section */}
          <div className="space-y-4">
            <div className="flex items-center px-1">
              <span className="h-2 w-2 rounded-full bg-sky-400 mr-2.5 animate-pulse shadow-[0_0_8px_#0ea5e9]" />
              <h2 className="text-xs font-black text-white uppercase tracking-wider select-none">
                My Active Watchlist
              </h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
              {watchlist.map((symbol) => (
                <WatchlistCard key={symbol} symbol={symbol} />
              ))}
            </div>
          </div>

          {/* Top Movers section */}
          <div className="flex-1 flex flex-col">
            <TopMoversTable 
              gainers={movers.gainers} 
              losers={movers.losers} 
              isLoading={isOverviewLoading}
              error={overviewError}
            />
          </div>
        </div>

        {/* Right Columns Container (occupies 1/3 of space) */}
        <div className="space-y-6 flex flex-col shrink-0">
          {/* News Feed Widget Card */}
          <NewsFeed news={news} isLoading={isNewsLoading} error={newsError} />

          {/* Earnings Calendar Widget Card */}
          <EarningsCalendar earnings={earnings} isLoading={isEarningsLoading} error={earningsError} />
        </div>
      </div>
    </div>
  );
}