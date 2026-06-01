"use client";

import React, { useRef, useEffect } from "react";
import * as d3 from "d3";

interface MiniSparklineProps {
  data: number[];
  width?: number;
  height?: number;
  isPositive?: boolean;
}

export const MiniSparkline: React.FC<MiniSparklineProps> = ({
  data,
  width = 120,
  height = 36,
  isPositive = true,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!svgRef.current || !data || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const xScale = d3
      .scaleLinear()
      .domain([0, data.length - 1])
      .range([0, width]);

    const yMin = d3.min(data) || 0;
    const yMax = d3.max(data) || 0;
    
    // Add small visual padding
    const yDomainPadding = (yMax - yMin) * 0.05 || 1;
    const yScale = d3
      .scaleLinear()
      .domain([yMin - yDomainPadding, yMax + yDomainPadding])
      .range([height, 0]);

    // Create line generator with smooth curve
    const lineGenerator = d3
      .line<number>()
      .x((_, i) => xScale(i))
      .y((d) => yScale(d))
      .curve(d3.curveMonotoneX);

    // Create area generator for the gradient fill underneath
    const areaGenerator = d3
      .area<number>()
      .x((_, i) => xScale(i))
      .y0(height)
      .y1((d) => yScale(d))
      .curve(d3.curveMonotoneX);

    // Dynamic unique gradient ID to prevent overlaps in lists
    const gradientId = `sparkline-gradient-${Math.random().toString(36).substr(2, 9)}`;

    const defs = svg.append("defs");
    const linearGradient = defs
      .append("linearGradient")
      .attr("id", gradientId)
      .attr("x1", "0%")
      .attr("y1", "0%")
      .attr("x2", "0%")
      .attr("y2", "100%");

    // Gradient colors based on direction
    linearGradient
      .append("stop")
      .attr("offset", "0%")
      .attr("stop-color", isPositive ? "#10b981" : "#f43f5e")
      .attr("stop-opacity", 0.18);

    linearGradient
      .append("stop")
      .attr("offset", "100%")
      .attr("stop-color", isPositive ? "#10b981" : "#f43f5e")
      .attr("stop-opacity", 0);

    // Append area path
    svg
      .append("path")
      .datum(data)
      .attr("fill", `url(#${gradientId})`)
      .attr("d", areaGenerator);

    // Append stroke path
    svg
      .append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", isPositive ? "#10b981" : "#f43f5e")
      .attr("stroke-width", 2.2)
      .attr("stroke-linecap", "round")
      .attr("stroke-linejoin", "round")
      .attr("d", lineGenerator);
  }, [data, width, height, isPositive]);

  return (
    <svg 
      ref={svgRef} 
      width={width} 
      height={height} 
      className="overflow-visible select-none pointer-events-none" 
    />
  );
};

export default MiniSparkline;
