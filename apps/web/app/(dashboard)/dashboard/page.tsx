"use client";

import React, { useEffect, useState } from "react";
import WatchlistCard from "../../../components/market/WatchlistCard";
import MarketOverviewBar from "../../../components/market/MarketOverviewBar";
import MarketStatusBadge, { ClockData } from "../../../components/market/MarketStatusBadge";
import TopMoversTable, { Mover } from "../../../components/market/TopMoversTable";
import NewsFeed, { NewsArticle } from "../../../components/market/NewsFeed";
import EarningsCalendar, { EarningsEvent } from "../../../components/market/EarningsCalendar";
import { api } from "../../../services/api";

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
          setOverviewError(err.response?.data?.error?.message || "Failed to retrieve market statistics. Please try again.");
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
          setNewsError(err.response?.data?.error?.message || "Failed to retrieve stock market news. Please try again.");
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
          setEarningsError(err.response?.data?.error?.message || "Failed to retrieve earnings calendar. Please try again.");
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
      {/* Header with Title and Market Status Clock */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white">
            Market Dashboard
          </h1>
          <p className="text-xs text-slate-400 font-semibold mt-1">
            Real-time equity quotes, global indices tracking, and latest market insights.
          </p>
        </div>
        <div className="self-start sm:self-auto">
          <MarketStatusBadge clock={clock} />
        </div>
      </div>

      {/* Indices Overview Scrolling Bar */}
      <MarketOverviewBar />

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (takes 2/3 space on large screens) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Watchlist Grid */}
          <div>
            <div className="flex items-center mb-4">
              <span className="h-2 w-2 rounded-full bg-sky-500 mr-2 animate-pulse shadow-[0_0_8px_#0ea5e9]" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                My Watchlist
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
              {watchlist.map((symbol) => (
                <WatchlistCard key={symbol} symbol={symbol} />
              ))}
            </div>
          </div>

          {/* Top Movers Columns */}
          <div className="space-y-4">
            <TopMoversTable 
              gainers={movers.gainers} 
              losers={movers.losers} 
              isLoading={isOverviewLoading}
              error={overviewError}
            />
          </div>
        </div>

        {/* Right Column (takes 1/3 space) */}
        <div className="space-y-6 flex flex-col">
          {/* News Feed Widget */}
          <NewsFeed news={news} isLoading={isNewsLoading} error={newsError} />

          {/* Earnings Calendar Widget */}
          <EarningsCalendar earnings={earnings} isLoading={isEarningsLoading} error={earningsError} />
        </div>
      </div>
    </div>
  );
}