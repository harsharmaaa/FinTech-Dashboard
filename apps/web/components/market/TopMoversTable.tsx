"use client";

import React, { useState } from "react";
import { Skeleton } from "../ui/skeleton";
import { ArrowUpRight, ArrowDownRight, ChevronUp, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";

export interface Mover {
  symbol: string;
  price: number;
  changePercent: number;
}

interface TopMoversTableProps {
  gainers: Mover[];
  losers: Mover[];
  isLoading?: boolean;
  error?: string | null;
}

type SortKey = "symbol" | "price" | "changePercent";

export const TopMoversTable: React.FC<TopMoversTableProps> = ({
  gainers,
  losers,
  isLoading = false,
  error = null,
}) => {
  const router = useRouter();
  const [gainerSortKey, setGainerSortKey] = useState<SortKey>("changePercent");
  const [gainerSortDesc, setGainerSortDesc] = useState(true);

  const [loserSortKey, setLoserSortKey] = useState<SortKey>("changePercent");
  const [loserSortDesc, setLoserSortDesc] = useState(false); // ASC sorting by default for losers (worst first)

  const handleSort = (column: "gainers" | "losers", key: SortKey) => {
    if (column === "gainers") {
      if (gainerSortKey === key) {
        setGainerSortDesc(!gainerSortDesc);
      } else {
        setGainerSortKey(key);
        setGainerSortDesc(true);
      }
    } else {
      if (loserSortKey === key) {
        setLoserSortDesc(!loserSortDesc);
      } else {
        setLoserSortKey(key);
        setLoserSortDesc(key === "changePercent" ? false : true);
      }
    }
  };

  const getSortedList = (list: Mover[], key: SortKey, desc: boolean) => {
    return [...list].sort((a, b) => {
      if (key === "symbol") {
        const valA = a.symbol;
        const valB = b.symbol;
        return desc ? valB.localeCompare(valA) : valA.localeCompare(valB);
      }
      const valA = a[key] as number;
      const valB = b[key] as number;
      return desc ? valB - valA : valA - valB;
    });
  };

  const sortedGainers = getSortedList(gainers, gainerSortKey, gainerSortDesc);
  const sortedLosers = getSortedList(losers, loserSortKey, loserSortDesc);

  if (error) {
    return (
      <div className="bg-slate-900/40 border border-red-500/20 rounded-2xl p-6 shadow-lg flex flex-col items-center justify-center text-center space-y-3 min-h-[250px] w-full backdrop-blur-md">
        <div className="h-10 w-10 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center shadow-md">
          <svg className="w-5 h-5 text-red-400 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div>
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">Movers Unavailable</h4>
          <p className="text-[10px] text-slate-400 mt-1 max-w-[200px] leading-relaxed">{error}</p>
        </div>
      </div>
    );
  }

  const renderSortIndicator = (key: SortKey, currentKey: SortKey, desc: boolean) => {
    if (currentKey !== key) return null;
    return desc ? <ChevronDown className="h-3 w-3 ml-0.5 inline-block" /> : <ChevronUp className="h-3 w-3 ml-0.5 inline-block" />;
  };

  const renderTable = (
    column: "gainers" | "losers",
    list: Mover[],
    currentKey: SortKey,
    desc: boolean
  ) => {
    const isGainer = column === "gainers";

    return (
      <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-5 md:p-6 shadow-xl flex-1 backdrop-blur-md relative overflow-hidden group">
        {/* Visual corner badge */}
        <div className={`absolute top-0 right-0 h-[2px] w-24 bg-gradient-to-r ${
          isGainer ? "from-emerald-500 to-transparent" : "from-rose-500 to-transparent"
        }`} />

        <h3
          className={`text-xs font-extrabold mb-5 flex items-center uppercase tracking-wider ${
            isGainer ? "text-emerald-400" : "text-rose-400"
          }`}
        >
          <span
            className={`h-2.5 w-2.5 rounded-full mr-2.5 border ${
              isGainer
                ? "bg-emerald-500 border-emerald-400/40 animate-pulse shadow-[0_0_10px_#10b981]"
                : "bg-rose-500 border-rose-400/40 shadow-[0_0_10px_#f43f5e]"
            }`}
          />
          {isGainer ? "Top Gainers" : "Top Losers"}
        </h3>

        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse min-w-[240px]">
            <thead>
              <tr className="border-b border-slate-800/80 text-slate-500 font-extrabold text-[10px] uppercase tracking-wider">
                <th
                  className="pb-3 cursor-pointer hover:text-white select-none transition-colors align-middle"
                  onClick={() => handleSort(column, "symbol")}
                >
                  Symbol {renderSortIndicator("symbol", currentKey, desc)}
                </th>
                <th
                  className="pb-3 text-right cursor-pointer hover:text-white select-none transition-colors align-middle"
                  onClick={() => handleSort(column, "price")}
                >
                  Price {renderSortIndicator("price", currentKey, desc)}
                </th>
                <th
                  className="pb-3 text-right cursor-pointer hover:text-white select-none transition-colors align-middle"
                  onClick={() => handleSort(column, "changePercent")}
                >
                  Change% {renderSortIndicator("changePercent", currentKey, desc)}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/30">
              {isLoading ? (
                [1, 2, 3, 4, 5].map((i) => (
                  <tr key={i}>
                    <td className="py-3.5">
                      <Skeleton className="h-4.5 w-12" />
                    </td>
                    <td className="py-3.5 text-right">
                      <Skeleton className="h-4.5 w-16 ml-auto" />
                    </td>
                    <td className="py-3.5 text-right">
                      <Skeleton className="h-4.5 w-12 ml-auto" />
                    </td>
                  </tr>
                ))
              ) : list.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-xs text-slate-500 font-bold select-none italic">
                    No active movers today
                  </td>
                </tr>
              ) : (
                list.map((item) => (
                  <tr 
                    key={item.symbol} 
                    onClick={() => router.push(`/trading/${item.symbol.toUpperCase()}`)}
                    className="text-xs hover:bg-slate-800/20 transition-all duration-150 cursor-pointer"
                  >
                    <td className="py-3.5 font-bold text-white tracking-wide uppercase">{item.symbol}</td>
                    <td className="py-3.5 text-right font-mono font-semibold text-slate-350">
                      ${item.price.toFixed(2)}
                    </td>
                    <td
                      className={`py-3.5 text-right font-mono font-extrabold flex items-center justify-end space-x-1 ${
                        isGainer ? "text-emerald-405 text-emerald-405 bg-emerald-500/0" : "text-rose-405"
                      }`}
                    >
                      <span>
                        {isGainer ? <ArrowUpRight className="h-3 w-3 text-emerald-400 inline-block mr-0.5" /> : <ArrowDownRight className="h-3 w-3 text-rose-400 inline-block mr-0.5" />}
                        {isGainer ? "+" : ""}
                        {item.changePercent.toFixed(2)}%
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col md:flex-row gap-5 w-full">
      {renderTable("gainers", sortedGainers, gainerSortKey, gainerSortDesc)}
      {renderTable("losers", sortedLosers, loserSortKey, loserSortDesc)}
    </div>
  );
};

export default TopMoversTable;
