"use client";

import React, { useState, useEffect, useRef } from "react";
import * as d3 from "d3";
import { TrendingUp, Wallet, ShieldCheck, Landmark } from "lucide-react";

interface ChartPoint {
  date: Date;
  value: number;
}

export const PortfolioChart: React.FC = () => {
  const [period, setPeriod] = useState<"1D" | "1W" | "1M" | "1Y" | "ALL">("1M");
  const [data, setData] = useState<ChartPoint[]>([]);
  const [hoveredPoint, setHoveredPoint] = useState<ChartPoint | null>(null);
  
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 280 });

  const netWorth = 128452.80;
  const dailyGain = 2484.50;
  const dailyGainPercent = 1.97;
  const buyingPower = 100000.00;
  const marginBalance = 28452.80;

  // Generate mock historical data based on period
  useEffect(() => {
    const points: ChartPoint[] = [];
    const now = new Date();
    let numPoints = 30;
    let daysOffset = 1;

    switch (period) {
      case "1D":
        numPoints = 24; // Hourly
        daysOffset = 1 / 24;
        break;
      case "1W":
        numPoints = 7; // Daily
        daysOffset = 1;
        break;
      case "1M":
        numPoints = 30; // Daily
        daysOffset = 1;
        break;
      case "1Y":
        numPoints = 52; // Weekly
        daysOffset = 7;
        break;
      case "ALL":
        numPoints = 60; // Monthly
        daysOffset = 30;
        break;
    }

    // Deterministic random walk starting from past up to netWorth
    let currentValue = netWorth - (numPoints * (period === "1D" ? 40 : 250) * (Math.random() - 0.3));
    
    for (let i = numPoints; i >= 0; i--) {
      const pointDate = new Date(now.getTime() - i * daysOffset * 24 * 60 * 60 * 1000);
      // Ensure positive random walks ending exactly at the current netWorth
      if (i === 0) {
        currentValue = netWorth;
      } else {
        const volatility = period === "1D" ? 150 : 800;
        currentValue += (Math.random() - 0.45) * volatility;
      }
      points.push({
        date: pointDate,
        value: Math.max(5000, currentValue),
      });
    }

    setData(points);
  }, [period]);

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
        height: Math.max(height || 280, 200),
      });
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  // Draw D3 Area Chart
  useEffect(() => {
    if (!svgRef.current || data.length === 0) return;

    const { width, height } = dimensions;
    const margin = { top: 15, right: 15, bottom: 25, left: 15 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Base Group
    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Define Gradients
    const defs = svg.append("defs");
    
    // Area Gradient (emerald green fading to transparent)
    const areaGradient = defs
      .append("linearGradient")
      .attr("id", "area-gradient")
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "0%")
      .attr("y2", "100%");

    areaGradient
      .append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "#10B981")
      .attr("stop-opacity", 0.22);

    areaGradient
      .append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "#10B981")
      .attr("stop-opacity", 0.0);

    // X & Y Scales
    const xScale = d3
      .scaleTime()
      .domain(d3.extent(data, (d) => d.date) as [Date, Date])
      .range([0, chartWidth]);

    const yMin = d3.min(data, (d) => d.value) || 0;
    const yMax = d3.max(data, (d) => d.value) || 100000;
    const yPadding = (yMax - yMin) * 0.1 || 1000;

    const yScale = d3
      .scaleLinear()
      .domain([Math.max(0, yMin - yPadding), yMax + yPadding])
      .range([chartHeight, 0]);

    // Grid lines (horizontal)
    const yTicks = yScale.ticks(5);
    yTicks.forEach((tick) => {
      g.append("line")
        .attr("x1", 0)
        .attr("y1", yScale(tick))
        .attr("x2", chartWidth)
        .attr("y2", yScale(tick))
        .attr("stroke", "#1E2026")
        .attr("stroke-width", 0.8)
        .attr("stroke-dasharray", "2,3");

      g.append("text")
        .attr("x", chartWidth - 5)
        .attr("y", yScale(tick) - 5)
        .attr("fill", "#475569")
        .attr("font-size", "8px")
        .attr("font-family", "monospace")
        .attr("text-anchor", "end")
        .text(`$${Math.floor(tick).toLocaleString()}`);
    });

    // Draw X Date Ticks
    const formatTime = (date: Date) => {
      if (period === "1D") {
        return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: false });
      }
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    };

    const xTicks = xScale.ticks(5);
    xTicks.forEach((tick) => {
      g.append("text")
        .attr("x", xScale(tick))
        .attr("y", chartHeight + 15)
        .attr("fill", "#64748B")
        .attr("font-size", "9px")
        .attr("text-anchor", "middle")
        .attr("font-weight", "bold")
        .text(formatTime(tick));
    });

    // D3 Area Builder
    const areaBuilder = d3
      .area<ChartPoint>()
      .x((d) => xScale(d.date))
      .y0(chartHeight)
      .y1((d) => yScale(d.value))
      .curve(d3.curveMonotoneX);

    // D3 Line Builder
    const lineBuilder = d3
      .line<ChartPoint>()
      .x((d) => xScale(d.date))
      .y((d) => yScale(d.value))
      .curve(d3.curveMonotoneX);

    // Draw the gradient filled area
    g.append("path")
      .datum(data)
      .attr("d", areaBuilder)
      .attr("fill", "url(#area-gradient)");

    // Draw the glowing line
    g.append("path")
      .datum(data)
      .attr("d", lineBuilder)
      .attr("fill", "none")
      .attr("stroke", "#10B981")
      .attr("stroke-width", 2.2)
      .attr("stroke-linecap", "round");

    // Dynamic Hover Crosshair
    const crosshair = g.append("g").style("display", "none");
    
    // Vertical track line
    const vLine = crosshair
      .append("line")
      .attr("stroke", "#475569")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "3,3")
      .attr("y1", 0)
      .attr("y2", chartHeight);

    // Hover dot
    crosshair
      .append("circle")
      .attr("r", 5)
      .attr("fill", "#10B981")
      .attr("stroke", "#FFFFFF")
      .attr("stroke-width", 1.5)
      .attr("class", "shadow-sm");

    // Overlay to capture cursor motions
    const trigger = g
      .append("rect")
      .attr("width", chartWidth)
      .attr("height", chartHeight)
      .attr("fill", "transparent")
      .style("cursor", "crosshair");

    // Bisector helper to find nearest point
    const bisectDate = d3.bisector<ChartPoint, Date>((d) => d.date).left;

    trigger
      .on("mouseenter", () => crosshair.style("display", null))
      .on("mouseleave", () => {
        crosshair.style("display", "none");
        setHoveredPoint(null);
      })
      .on("mousemove", function (event) {
        const [mX] = d3.pointer(event);
        const xDate = xScale.invert(mX);
        const idx = bisectDate(data, xDate, 1);
        const d0 = data[idx - 1];
        const d1 = data[idx];
        
        let nearestPoint = d0;
        if (d0 && d1) {
          nearestPoint = xDate.getTime() - d0.date.getTime() > d1.date.getTime() - xDate.getTime() ? d1 : d0;
        }

        if (nearestPoint) {
          setHoveredPoint(nearestPoint);
          const px = xScale(nearestPoint.date);
          const py = yScale(nearestPoint.value);
          
          vLine.attr("x1", px).attr("x2", px);
          crosshair.select("circle").attr("cx", px).attr("cy", py);
        }
      });

  }, [data, dimensions, period]);

  // Format helper for numbers
  const formatCurrency = (val: number) => {
    return val.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    });
  };

  const getActiveNetWorth = () => {
    if (hoveredPoint) return hoveredPoint.value;
    return netWorth;
  };

  const getActiveDateLabel = () => {
    const activeDate = hoveredPoint ? hoveredPoint.date : new Date();
    if (period === "1D") {
      return activeDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: false }) + " today";
    }
    return activeDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div className="bg-slate-900/30 border border-slate-900 backdrop-blur-md rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col group">
      {/* Background radial soft light */}
      <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-emerald-500/5 blur-[50px] pointer-events-none" />

      {/* Header and stats */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 z-10 mb-6">
        <div className="space-y-1">
          <span className="text-slate-500 font-extrabold text-[10px] tracking-wider uppercase block">Total Net Worth</span>
          <div className="flex items-baseline space-x-3.5">
            <h2 className="text-3xl font-black text-white tracking-tight font-mono">
              {formatCurrency(getActiveNetWorth())}
            </h2>
            <span className="text-emerald-400 bg-emerald-950/40 px-2 py-0.5 border border-emerald-900/40 rounded-lg text-[10px] font-black font-mono flex items-center">
              <TrendingUp className="h-3 w-3 mr-1" />
              +{dailyGainPercent.toFixed(2)}%
            </span>
          </div>
          <p className="text-[10px] text-slate-500 font-semibold font-mono tracking-wider">
            {hoveredPoint ? "Valued at: " : "Daily change: "}
            <span className={hoveredPoint ? "text-slate-350" : "text-emerald-450 font-bold"}>
              {hoveredPoint ? getActiveDateLabel() : `+${formatCurrency(dailyGain)}`}
            </span>
          </p>
        </div>

        {/* Timeframe intervals selector */}
        <div className="flex space-x-1 shrink-0 bg-slate-950/40 p-1 border border-slate-900 rounded-xl self-start sm:self-auto select-none">
          {(["1D", "1W", "1M", "1Y", "ALL"] as const).map((btn) => (
            <button
              key={btn}
              onClick={() => setPeriod(btn)}
              className={`text-[9px] font-black uppercase px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer ${
                period === btn
                  ? "bg-slate-900 border-slate-800 text-emerald-400 shadow-sm"
                  : "bg-transparent border-transparent text-slate-500 hover:text-white"
              }`}
            >
              {btn}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Canvas */}
      <div ref={containerRef} className="flex-grow min-h-[220px] w-full flex items-center justify-center relative z-10">
        {data.length === 0 ? (
          <div className="h-6 w-6 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
        ) : (
          <svg
            ref={svgRef}
            width={dimensions.width}
            height={dimensions.height}
            className="overflow-visible select-none"
          />
        )}
      </div>

      {/* Bottom accounts overview info grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-900 pt-6 mt-6 select-none">
        <div className="bg-slate-950/20 border border-slate-900/60 p-4 rounded-2xl flex items-center space-x-3.5 hover:bg-slate-950/30 transition-colors">
          <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Wallet className="h-4.5 w-4.5" />
          </div>
          <div>
            <span className="text-slate-500 text-[9px] font-extrabold uppercase tracking-wider block">Cash Power</span>
            <span className="text-xs font-mono font-black text-white">{formatCurrency(buyingPower)}</span>
          </div>
        </div>

        <div className="bg-slate-950/20 border border-slate-900/60 p-4 rounded-2xl flex items-center space-x-3.5 hover:bg-slate-950/30 transition-colors">
          <div className="h-9 w-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Landmark className="h-4.5 w-4.5" />
          </div>
          <div>
            <span className="text-slate-500 text-[9px] font-extrabold uppercase tracking-wider block">Margin Account</span>
            <span className="text-xs font-mono font-black text-white">{formatCurrency(marginBalance)}</span>
          </div>
        </div>

        <div className="bg-slate-950/20 border border-slate-900/60 p-4 rounded-2xl flex items-center space-x-3.5 hover:bg-slate-950/30 transition-colors">
          <div className="h-9 w-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
            <ShieldCheck className="h-4.5 w-4.5" />
          </div>
          <div>
            <span className="text-slate-500 text-[9px] font-extrabold uppercase tracking-wider block">Security Level</span>
            <span className="text-xs font-black text-emerald-400 uppercase tracking-widest flex items-center mt-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
              Maximum
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortfolioChart;
