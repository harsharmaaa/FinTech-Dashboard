"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useDebounce } from "use-debounce";
import { Search } from "lucide-react";
import { api } from "../../services/api";

interface Asset {
  symbol: string;
  name: string;
  exchange: string;
  tradable: boolean;
}

let globalAssetsList: Asset[] | null = null;

const POPULAR_TICKERS: Asset[] = [
  { symbol: "AAPL", name: "Apple Inc.", exchange: "NASDAQ", tradable: true },
  { symbol: "MSFT", name: "Microsoft Corporation", exchange: "NASDAQ", tradable: true },
  { symbol: "TSLA", name: "Tesla Inc.", exchange: "NASDAQ", tradable: true },
  { symbol: "NVDA", name: "NVIDIA Corporation", exchange: "NASDAQ", tradable: true },
  { symbol: "AMZN", name: "Amazon.com Inc.", exchange: "NASDAQ", tradable: true },
];

export const SymbolSearch: React.FC = () => {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [debouncedQuery] = useDebounce(query, 300);
  const [isOpen, setIsOpen] = useState(false);
  const [assets, setAssets] = useState<Asset[]>(globalAssetsList || []);
  const [results, setResults] = useState<Asset[]>([]);
  const [recentSearches, setRecentSearches] = useState<Asset[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load active assets in the background on mount or focus
  useEffect(() => {
    if (globalAssetsList) {
      setAssets(globalAssetsList);
      return;
    }

    async function fetchAssets() {
      try {
        const res = await api.get("/v1/market/assets");
        const list = res.data.data || [];
        globalAssetsList = list;
        setAssets(list);
      } catch (err) {
        console.error("Failed to load assets list:", err);
      }
    }

    fetchAssets();
  }, []);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("apex:recent-searches");
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (err) {
        console.error("Failed to parse recent searches:", err);
      }
    }
  }, [isOpen]);

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Global key listener for '/' and 'Ctrl+K'
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      const isInputActive =
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA" ||
        document.activeElement?.getAttribute("contenteditable") === "true";

      if (e.key === "/" && !isInputActive) {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      } else if ((e.ctrlKey || e.metaKey) && e.key?.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };
    window.addEventListener("keydown", handleGlobalKey);
    return () => window.removeEventListener("keydown", handleGlobalKey);
  }, []);

  // Search logic combining client-side filter and API fallback
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      setActiveIndex(-1);
      return;
    }

    const searchQuery = debouncedQuery.toLowerCase().trim();
    setIsLoading(true);

    // 1. Client-side filtering
    const clientMatches = assets.filter((asset) => {
      const sym = asset.symbol?.toLowerCase() || "";
      const name = asset.name?.toLowerCase() || "";
      return sym.includes(searchQuery) || name.includes(searchQuery);
    });

    if (clientMatches.length > 0) {
      setResults(clientMatches.slice(0, 10));
      setActiveIndex(0);
      setIsLoading(false);
    } else {
      // 2. Fallback to API search
      async function fallbackSearch() {
        try {
          const res = await api.get(`/v1/market/search?q=${encodeURIComponent(debouncedQuery)}`);
          const apiMatches = res.data.data.results || [];
          setResults(apiMatches.slice(0, 10));
          setActiveIndex(apiMatches.length > 0 ? 0 : -1);
        } catch (err) {
          console.error("API search fallback failed:", err);
          setResults([]);
        } finally {
          setIsLoading(false);
        }
      }
      fallbackSearch();
    }
  }, [debouncedQuery, assets]);

  const saveRecentSearch = (asset: Asset) => {
    const filtered = recentSearches.filter((item) => item.symbol !== asset.symbol);
    const updated = [asset, ...filtered].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem("apex:recent-searches", JSON.stringify(updated));
  };

  const handleSelect = (asset: Asset) => {
    saveRecentSearch(asset);
    setIsOpen(false);
    setQuery("");
    inputRef.current?.blur();
    router.push(`/trading/${asset.symbol}`);
  };

  // Keyboard navigation within dropdown
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) return;

    const listToNavigate = results.length > 0 ? results : recentSearches.length > 0 ? recentSearches : POPULAR_TICKERS;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % listToNavigate.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + listToNavigate.length) % listToNavigate.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < listToNavigate.length) {
        const selected = listToNavigate[activeIndex];
        if (selected) handleSelect(selected);
      } else if (listToNavigate.length > 0) {
        const selected = listToNavigate[0];
        if (selected) handleSelect(selected);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const renderDropdown = () => {
    if (!isOpen) return null;

    const hasQuery = query.trim().length > 0;
    const showRecent = !hasQuery && recentSearches.length > 0;
    const showPopular = !hasQuery && recentSearches.length === 0;

    return (
      <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900/95 border border-slate-800/90 rounded-2xl shadow-2xl overflow-hidden z-50 p-2 backdrop-blur-xl animate-fade-in max-h-96 overflow-y-auto no-scrollbar">
        {isLoading && (
          <div className="py-4 text-center text-xs text-slate-500 font-medium animate-pulse">
            Searching assets...
          </div>
        )}

        {!isLoading && hasQuery && results.length === 0 && (
          <div className="py-4 text-center text-xs text-slate-500 font-medium">
            No matching symbols found
          </div>
        )}

        {/* Search Results */}
        {!isLoading && hasQuery && results.length > 0 && (
          <div>
            <div className="px-3 py-1.5 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
              Search Results
            </div>
            <div className="space-y-0.5 mt-1">
              {results.map((asset, index) => (
                <div
                  key={asset.symbol}
                  onClick={() => handleSelect(asset)}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150 ${
                    activeIndex === index
                      ? "bg-slate-800/80 text-white scale-[1.01] shadow-md border-l-2 border-sky-500"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <span className="font-bold text-xs bg-slate-800 px-2 py-1 rounded text-white tracking-wide">
                      {asset.symbol}
                    </span>
                    <span className="text-xs truncate max-w-[200px] font-medium">
                      {asset.name}
                    </span>
                  </div>
                  <span className="text-[10px] font-extrabold text-slate-500 tracking-wider">
                    {asset.exchange}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Searches */}
        {showRecent && (
          <div>
            <div className="px-3 py-1.5 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider flex justify-between items-center">
              <span>Recent Searches</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setRecentSearches([]);
                  localStorage.removeItem("apex:recent-searches");
                }}
                className="text-[9px] text-slate-500 hover:text-slate-300 cursor-pointer font-bold lowercase tracking-normal"
              >
                Clear
              </button>
            </div>
            <div className="space-y-0.5 mt-1">
              {recentSearches.map((asset, index) => (
                <div
                  key={asset.symbol}
                  onClick={() => handleSelect(asset)}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150 ${
                    activeIndex === index
                      ? "bg-slate-800/80 text-white border-l-2 border-sky-500"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="font-bold text-xs bg-slate-800 px-2 py-1 rounded text-white tracking-wide">
                      {asset.symbol}
                    </span>
                    <span className="text-xs font-medium">{asset.name}</span>
                  </div>
                  <span className="text-[10px] font-extrabold text-slate-500 tracking-wider">
                    {asset.exchange}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Popular Tickers (Initial fallback) */}
        {showPopular && (
          <div>
            <div className="px-3 py-1.5 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
              Popular Equities
            </div>
            <div className="space-y-0.5 mt-1">
              {POPULAR_TICKERS.map((asset, index) => (
                <div
                  key={asset.symbol}
                  onClick={() => handleSelect(asset)}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150 ${
                    activeIndex === index
                      ? "bg-slate-800/80 text-white border-l-2 border-sky-500"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="font-bold text-xs bg-slate-800 px-2 py-1 rounded text-white tracking-wide">
                      {asset.symbol}
                    </span>
                    <span className="text-xs font-medium">{asset.name}</span>
                  </div>
                  <span className="text-[10px] font-extrabold text-slate-500 tracking-wider">
                    {asset.exchange}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="flex items-center bg-slate-900 border border-slate-800/80 rounded-xl px-3 py-2 focus-within:border-sky-500/50 focus-within:ring-1 focus-within:ring-sky-500/50 transition-all duration-200">
        <Search className="h-4 w-4 text-slate-400 mr-2 flex-shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search symbols (press '/' or 'Ctrl+K')"
          className="bg-transparent border-0 outline-0 p-0 m-0 text-xs text-white placeholder-slate-500 w-full focus:ring-0 focus:outline-none"
        />
        <div className="flex items-center space-x-1 flex-shrink-0 ml-2">
          <kbd className="hidden sm:inline-block bg-slate-800/80 border border-slate-700/80 text-slate-400 text-[10px] font-mono px-1.5 py-0.5 rounded leading-none">
            Ctrl K
          </kbd>
        </div>
      </div>
      {renderDropdown()}
    </div>
  );
};

export default SymbolSearch;
