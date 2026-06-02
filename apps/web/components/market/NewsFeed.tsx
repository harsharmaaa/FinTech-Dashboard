"use client";

import React from "react";
import { Skeleton } from "../ui/skeleton";
import { ExternalLink, Clock, Newspaper } from "lucide-react";

export interface NewsArticle {
  id: number;
  headline: string;
  source: string;
  url: string;
  summary: string;
  created_at: string;
}

interface NewsFeedProps {
  news: NewsArticle[];
  isLoading: boolean;
  error?: string | null;
}

export const NewsFeed: React.FC<NewsFeedProps> = ({ news, isLoading, error }) => {
  const getRelativeTime = (dateStr: string) => {
    const now = new Date();
    const created = new Date(dateStr);
    const diffMs = now.getTime() - created.getTime();
    
    const minutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  if (error) {
    return (
      <div className="bg-slate-900/30 border border-red-500/20 rounded-2xl p-6 shadow-lg flex flex-col items-center justify-center text-center space-y-3 min-h-[250px] w-full backdrop-blur-md">
        <div className="h-10 w-10 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center shadow-md">
          <svg className="w-5 h-5 text-red-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div>
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">News Unavailable</h4>
          <p className="text-[10px] text-slate-400 mt-1 max-w-[200px] leading-relaxed">{error}</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-5 shadow-lg space-y-5 flex-grow backdrop-blur-md">
        <div className="flex justify-between items-center">
          <Skeleton className="h-4 w-1/3" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-3.5 w-3/4" />
              <Skeleton className="h-2.5 w-1/4" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-5 md:p-6 shadow-xl flex flex-col backdrop-blur-md relative overflow-hidden flex-grow">
      {/* Decorative gradient overlay */}
      <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-sky-500/20 via-indigo-500/20 to-transparent" />

      <h3 className="text-xs font-extrabold text-white uppercase tracking-wider mb-4 flex items-center">
        <Newspaper className="h-3.5 w-3.5 mr-2 text-sky-400" />
        Latest Market News
      </h3>
      
      <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-1 divide-y divide-slate-800/50 no-scrollbar scroll-smooth">
        {news.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-12 font-bold italic select-none">No recent news articles found</p>
        ) : (
          news.map((item, index) => (
            <div 
              key={item.id || index} 
              className="pt-3.5 first:pt-0 group cursor-pointer transition-all duration-150"
            >
              <a 
                href={item.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="block hover:no-underline"
              >
                <div className="flex items-start justify-between gap-2.5">
                  <h4 className="text-xs font-bold text-slate-200 group-hover:text-sky-400 leading-snug transition-colors line-clamp-2">
                    {item.headline}
                  </h4>
                  <ExternalLink className="h-3 w-3 text-slate-600 group-hover:text-sky-400 shrink-0 mt-0.5 transition-colors" />
                </div>
                
                <div className="flex items-center space-x-2.5 mt-2.5 text-[9px] text-slate-500 font-extrabold uppercase tracking-wider">
                  <span className="text-sky-500/85 bg-sky-950/20 border border-sky-500/10 px-2 py-0.5 rounded-md">{item.source}</span>
                  <span className="flex items-center text-slate-550 font-bold font-sans">
                    <Clock className="h-2.5 w-2.5 mr-1" />
                    {getRelativeTime(item.created_at)}
                  </span>
                </div>
                {item.summary && (
                  <p className="text-[10px] text-slate-400 font-semibold leading-relaxed mt-2 line-clamp-2 select-none group-hover:text-slate-350 transition-colors">
                    {item.summary}
                  </p>
                )}
              </a>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NewsFeed;
