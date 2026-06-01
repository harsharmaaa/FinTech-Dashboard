"use client";

import React from "react";
import { Skeleton } from "../ui/skeleton";

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
      <div className="bg-slate-900/40 border border-red-500/20 rounded-2xl p-5 shadow-lg flex flex-col items-center justify-center text-center space-y-3 min-h-[250px] w-full">
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
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 shadow-lg space-y-5 flex-grow">
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
    <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 shadow-lg space-y-4 flex-grow">
      <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">Latest News</h3>
      
      <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1 divide-y divide-slate-800/40 no-scrollbar">
        {news.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-8 font-medium">No recent news articles found</p>
        ) : (
          news.map((item, index) => (
            <div 
              key={item.id || index} 
              className="pt-4 first:pt-0 group"
            >
              <a 
                href={item.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="block hover:no-underline"
              >
                <h4 className="text-xs font-bold text-slate-200 group-hover:text-sky-400 leading-snug transition-colors line-clamp-2">
                  {item.headline}
                </h4>
                <div className="flex items-center space-x-2.5 mt-2 text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                  <span className="text-sky-500/85">{item.source}</span>
                  <span>•</span>
                  <span>{getRelativeTime(item.created_at)}</span>
                </div>
                {item.summary && (
                  <p className="text-[11px] text-slate-400/80 leading-relaxed mt-1.5 line-clamp-2">
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
