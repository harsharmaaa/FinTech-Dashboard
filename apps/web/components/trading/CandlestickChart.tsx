"use client";

import React, { useState, useEffect, useRef } from "react";
import * as d3 from "d3";
import { api } from "../../services/api";
import { Skeleton } from "../ui/skeleton";
import { TrendingUp, Activity } from "lucide-react";

interface CandlestickChartProps {
  symbol: string;
}

interface BarData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export const CandlestickChart: React.FC<CandlestickChartProps> = ({ symbol }) => {
  const [timeframe, setTimeframe] = useState("1Day"); // 1Min, 5Min, 1Hour, 1Day
  const [bars, setBars] = useState<BarData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Ref for the outer wrapper to calculate size responsively
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  
  const [dimensions, setDimensions] = useState({ width: 600, height: 350 });
  const [hoveredBar, setHoveredBar] = useState<BarData | null>(null);

  // Timeframe buttons mapping
  const timeframeButtons = [
    { label: "1m", value: "1Min" },
    { label: "5m", value: "5Min" },
    { label: "1H", value: "1Hour" },
    { label: "1D", value: "1Day" },
  ];

  // Fetch historical data on timeframe or symbol change
  useEffect(() => {
    let active = true;
    async function fetchBars() {
      try {
        setIsLoading(true);
        setError(null);
        // limit 70 bars for a clean chart visual spacing
        const res = await api.get(
          `/api/v1/market/bars/${symbol}?timeframe=${timeframe}&limit=70`
        );
        const fetchedBars = res.data.data.bars || [];
        if (active) {
          setBars(fetchedBars);
        }
      } catch (err: any) {
        console.error("Failed to load bars for chart:", err);
        if (active) {
          setError("Failed to load chart data");
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }
    fetchBars();
    return () => {
      active = false;
    };
  }, [symbol, timeframe]);

  // Handle container resizing
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setDimensions({
        width: Math.max(width, 300),
        height: Math.max(height || 350, 250),
      });
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Draw chart via D3
  useEffect(() => {
    if (!svgRef.current || bars.length === 0) return;

    const { width, height } = dimensions;
    const margin = { top: 25, right: 60, bottom: 25, left: 15 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Create the base group with padding
    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // 1. Scales
    // Band scale for X positioning (bars)
    const xScale = d3
      .scaleBand<number>()
      .domain(d3.range(bars.length))
      .range([0, chartWidth])
      .padding(0.35);

    // Linear scale for Y price axis
    const yMin = d3.min(bars, (d) => d.low) || 0;
    const yMax = d3.max(bars, (d) => d.high) || 100;
    const pricePadding = (yMax - yMin) * 0.08 || 2;
    
    const yScale = d3
      .scaleLinear()
      .domain([yMin - pricePadding, yMax + pricePadding])
      .range([chartHeight, 0]);

    // Volume yScale (bottom 18% of chart height)
    const volMax = d3.max(bars, (d) => d.volume) || 1000;
    const yVolScale = d3
      .scaleLinear()
      .domain([0, volMax])
      .range([chartHeight, chartHeight - chartHeight * 0.18]);

    // 2. Grids & Axis Lines
    // Y price ticks
    const priceTicks = yScale.ticks(6);
    priceTicks.forEach((tick) => {
      g.append("line")
        .attr("x1", 0)
        .attr("y1", yScale(tick))
        .attr("x2", chartWidth)
        .attr("y2", yScale(tick))
        .attr("stroke", "#1E2026")
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "2,3");
    });

    // Right margin Y-Axis labels
    priceTicks.forEach((tick) => {
      g.append("text")
        .attr("x", chartWidth + 8)
        .attr("y", yScale(tick) + 4)
        .attr("fill", "#64748B")
        .attr("font-size", "9px")
        .attr("font-family", "monospace")
        .attr("font-weight", "bold")
        .text(`$${tick.toFixed(2)}`);
    });

    // X Date ticks
    const xTicksCount = Math.min(5, bars.length);
    const tickStep = Math.floor(bars.length / xTicksCount);
    for (let i = 0; i < bars.length; i += tickStep) {
      const dateStr = bars[i]?.time;
      if (!dateStr) continue;
      const d = new Date(dateStr);
      const label = timeframe === "1Day"
        ? d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
        : d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: false });
      
      const xPos = (xScale(i) || 0) + xScale.bandwidth() / 2;

      g.append("line")
        .attr("x1", xPos)
        .attr("y1", 0)
        .attr("x2", xPos)
        .attr("y2", chartHeight)
        .attr("stroke", "#1E2026")
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "2,3");

      g.append("text")
        .attr("x", xPos)
        .attr("y", chartHeight + 16)
        .attr("fill", "#64748B")
        .attr("font-size", "9px")
        .attr("font-weight", "bold")
        .attr("text-anchor", "middle")
        .text(label);
    }

    // 3. Render Volume overlay
    bars.forEach((d, i) => {
      const isPositive = d.close >= d.open;
      g.append("rect")
        .attr("x", xScale(i) || 0)
        .attr("y", yVolScale(d.volume))
        .attr("width", xScale.bandwidth())
        .attr("height", chartHeight - yVolScale(d.volume))
        .attr("fill", isPositive ? "#10B981" : "#F43F5E")
        .attr("fill-opacity", 0.15);
    });

    // 4. Render Candlestick Shadows & Bodies
    bars.forEach((d, i) => {
      const isPositive = d.close >= d.open;
      const color = isPositive ? "#10B981" : "#F43F5E";
      const xMid = (xScale(i) || 0) + xScale.bandwidth() / 2;

      // Shadows (Wicks)
      g.append("line")
        .attr("x1", xMid)
        .attr("y1", yScale(d.high))
        .attr("x2", xMid)
        .attr("y2", yScale(d.low))
        .attr("stroke", color)
        .attr("stroke-width", 1.5);

      // Body Rect
      const yBody = yScale(Math.max(d.open, d.close));
      const hBody = Math.max(1.5, Math.abs(yScale(d.open) - yScale(d.close)));

      g.append("rect")
        .attr("x", xScale(i) || 0)
        .attr("y", yBody)
        .attr("width", xScale.bandwidth())
        .attr("height", hBody)
        .attr("fill", color)
        .attr("stroke", color)
        .attr("stroke-width", 0.5)
        .attr("rx", 1);
    });

    // 5. Hover Interactive Crosshairs
    const crosshairGroup = g.append("g").style("display", "none");
    const vLine = crosshairGroup.append("line").attr("stroke", "#475569").attr("stroke-width", 0.8).attr("stroke-dasharray", "3,3").attr("y1", 0).attr("y2", chartHeight);
    const hLine = crosshairGroup.append("line").attr("stroke", "#475569").attr("stroke-width", 0.8).attr("stroke-dasharray", "3,3").attr("x1", 0).attr("x2", chartWidth);
    
    const yPriceTag = crosshairGroup.append("g");
    const yTagRect = yPriceTag.append("rect").attr("fill", "#0EA5E9").attr("height", 16).attr("width", 50).attr("rx", 4);
    const yTagText = yPriceTag.append("text").attr("fill", "#FFFFFF").attr("font-size", "9px").attr("font-family", "monospace").attr("text-anchor", "middle").attr("alignment-baseline", "central");

    // Capture interaction movements
    const triggerOverlay = g
      .append("rect")
      .attr("width", chartWidth)
      .attr("height", chartHeight)
      .attr("fill", "transparent")
      .style("cursor", "crosshair");

    triggerOverlay
      .on("mouseenter", () => crosshairGroup.style("display", null))
      .on("mouseleave", () => {
        crosshairGroup.style("display", "none");
        setHoveredBar(null);
      })
      .on("mousemove", function (event) {
        const [mX, mY] = d3.pointer(event);
        
        // Find closest index
        const bandwidth = xScale.step();
        const hoveredIndex = Math.max(0, Math.min(bars.length - 1, Math.floor(mX / bandwidth)));
        
        const selectedBar = bars[hoveredIndex];
        if (!selectedBar) return;

        setHoveredBar(selectedBar);

        // Center crosshair X on bar midpoint
        const xPos = (xScale(hoveredIndex) || 0) + xScale.bandwidth() / 2;
        vLine.attr("x1", xPos).attr("x2", xPos);
        hLine.attr("y1", mY).attr("y2", mY);

        // Hover price calculation
        const hoverPrice = yScale.invert(mY);
        yPriceTag.attr("transform", `translate(${chartWidth + 6}, ${mY - 8})`);
        yTagText.attr("x", 25).attr("y", 8).text(`$${hoverPrice.toFixed(2)}`);
      });

  }, [bars, dimensions, timeframe]);

  // Calculate stats formatting
  const formatDateString = (dateStr: string) => {
    const d = new Date(dateStr);
    return timeframe === "1Day"
      ? d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      : d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + " " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: false });
  };

  const getActiveBar = () => {
    if (hoveredBar) return hoveredBar;
    if (bars.length > 0) return bars[bars.length - 1];
    return null;
  };

  const activeBar = getActiveBar();

  return (
    <div className="bg-slate-900/30 border border-slate-900 backdrop-blur-md rounded-3xl p-6 shadow-xl flex flex-col group overflow-hidden relative">
      {/* Visual background grid effect */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

      {/* Header controls & stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 z-10 mb-6 pb-4 border-b border-slate-900">
        <div className="flex items-center space-x-3.5">
          <div className="h-9 w-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
            <TrendingUp className="h-4.5 w-4.5 text-sky-400" />
          </div>
          <div>
            <h3 className="text-xs font-black text-white uppercase tracking-wider">Trading Terminal Chart</h3>
            <p className="text-[10px] text-slate-500 font-extrabold tracking-wider uppercase mt-0.5">Real-Time streaming canvas</p>
          </div>
        </div>

        {/* Timeframe intervals */}
        <div className="flex space-x-1 shrink-0 bg-slate-950/40 p-1 border border-slate-900 rounded-xl self-start sm:self-auto">
          {timeframeButtons.map((btn) => (
            <button
              key={btn.value}
              onClick={() => setTimeframe(btn.value)}
              className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                timeframe === btn.value
                  ? "bg-slate-900 border-slate-800 text-emerald-400 font-black shadow-sm"
                  : "bg-transparent border-transparent text-slate-500 hover:text-white"
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* OHLCV Hover Tooltip banner */}
      <div className="min-h-[36px] bg-slate-950/20 border border-slate-900/60 p-3 rounded-2xl flex flex-wrap items-center gap-x-6 gap-y-2 mb-6 z-10 text-[10px] select-none font-mono">
        {isLoading ? (
          <Skeleton className="h-4.5 w-full" />
        ) : activeBar ? (
          <>
            <span className="text-slate-500 font-sans font-extrabold uppercase">
              Date: <span className="text-white ml-1 font-mono">{formatDateString(activeBar.time)}</span>
            </span>
            <span className="text-slate-500 font-sans font-extrabold uppercase">
              Open: <span className="text-white ml-1 font-mono">${activeBar.open.toFixed(2)}</span>
            </span>
            <span className="text-slate-500 font-sans font-extrabold uppercase">
              High: <span className="text-emerald-400 ml-1 font-mono">${activeBar.high.toFixed(2)}</span>
            </span>
            <span className="text-slate-500 font-sans font-extrabold uppercase">
              Low: <span className="text-rose-400 ml-1 font-mono">${activeBar.low.toFixed(2)}</span>
            </span>
            <span className="text-slate-500 font-sans font-extrabold uppercase">
              Close: <span className="text-white ml-1 font-mono">${activeBar.close.toFixed(2)}</span>
            </span>
            <span className="text-slate-500 font-sans font-extrabold uppercase">
              Volume: <span className="text-sky-400 ml-1 font-mono">{activeBar.volume.toLocaleString()}</span>
            </span>
          </>
        ) : (
          <span className="text-slate-500 font-extrabold uppercase">No active bar data available</span>
        )}
      </div>

      {/* Chart Canvas */}
      <div ref={containerRef} className="flex-1 min-h-[300px] w-full flex items-center justify-center relative">
        {isLoading ? (
          <div className="space-y-4 w-full">
            <Skeleton className="h-[250px] w-full" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center text-center space-y-3 p-6 border border-red-500/10 bg-red-950/10 rounded-2xl max-w-sm">
            <Activity className="h-8 w-8 text-red-400 animate-pulse" />
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Feed Unavailable</h4>
            <p className="text-[10px] text-slate-400 leading-relaxed">{error}</p>
          </div>
        ) : bars.length === 0 ? (
          <p className="text-xs text-slate-500 font-bold select-none italic">No chart points returned</p>
        ) : (
          <svg
            ref={svgRef}
            width={dimensions.width}
            height={dimensions.height}
            className="overflow-visible select-none"
          />
        )}
      </div>

      {/* Info bar footer */}
      <div className="flex items-center justify-between border-t border-slate-900 pt-4 mt-6 z-10 text-[9px] text-slate-500 font-extrabold uppercase tracking-wider">
        <span>Timezone: EST (New York)</span>
        <span className="flex items-center">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
          Upstream Feed: Alpaca Web API
        </span>
      </div>
    </div>
  );
};

export default CandlestickChart;
