"use client";

import React, { useEffect, useRef, useState } from "react";

interface PriceDisplayProps {
  price: number;
  change: number;
  className?: string;
}

export const PriceDisplay: React.FC<PriceDisplayProps> = ({
  price,
  change,
  className = "",
}) => {
  const prevPriceRef = useRef<number | null>(null);
  const [flashType, setFlashType] = useState<"up" | "down" | null>(null);

  useEffect(() => {
    if (price === undefined || price === null || price === 0) return;

    if (prevPriceRef.current !== null && price !== prevPriceRef.current) {
      setFlashType(price > prevPriceRef.current ? "up" : "down");
      const timer = setTimeout(() => {
        setFlashType(null);
      }, 600);
      return () => clearTimeout(timer);
    }
    
    prevPriceRef.current = price;
  }, [price]);

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val);
  };

  const getFlashClasses = () => {
    if (flashType === "up") {
      return "bg-emerald-500/20 text-emerald-400 font-bold scale-[1.03] shadow-[0_0_12px_rgba(16,185,129,0.25)] border-emerald-500/30";
    }
    if (flashType === "down") {
      return "bg-rose-500/20 text-rose-400 font-bold scale-[1.03] shadow-[0_0_12px_rgba(244,63,94,0.25)] border-rose-500/30";
    }
    // Stable color classes depending on overall daily change
    return change >= 0 
      ? "text-emerald-400 border-transparent bg-emerald-500/5 hover:bg-emerald-500/10" 
      : "text-rose-400 border-transparent bg-rose-500/5 hover:bg-rose-500/10";
  };

  return (
    <span
      className={`inline-block font-mono text-base font-semibold px-2 py-0.5 rounded-lg border transition-all duration-300 ${getFlashClasses()} ${className}`}
    >
      {formatPrice(price)}
    </span>
  );
};
export default PriceDisplay;
