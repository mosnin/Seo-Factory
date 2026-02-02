"use client";

import { useState, HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface TooltipProps {
  content: string;
  side?: "top" | "bottom";
  children: React.ReactNode;
}

function Tooltip({ content, side = "top", children }: TooltipProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div
          role="tooltip"
          className={cn(
            "absolute z-50 whitespace-nowrap rounded-md bg-foreground px-3 py-1.5 text-xs text-background shadow-md animate-fade-in",
            side === "top" && "bottom-full left-1/2 mb-2 -translate-x-1/2",
            side === "bottom" && "top-full left-1/2 mt-2 -translate-x-1/2",
          )}
        >
          {content}
        </div>
      )}
    </div>
  );
}

export { Tooltip };
export type { TooltipProps };
