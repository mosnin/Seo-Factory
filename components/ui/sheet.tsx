"use client";

import { useEffect, HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

function Sheet({ open, onOpenChange, children }: SheetProps) {
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onOpenChange(false);
    }
    if (open) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
      return () => {
        document.removeEventListener("keydown", handleEscape);
        document.body.style.overflow = "";
      };
    }
  }, [open, onOpenChange]);

  if (!open) return null;

  return <>{children}</>;
}

function SheetOverlay({
  className,
  onClick,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "fixed inset-0 z-50 bg-black/50 animate-fade-in",
        className,
      )}
      onClick={onClick}
      {...props}
    />
  );
}

function SheetContent({
  className,
  onClose,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement> & { onClose: () => void }) {
  return (
    <>
      <SheetOverlay onClick={onClose} />
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 bg-sidebar shadow-xl animate-slide-in-left",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    </>
  );
}

export { Sheet, SheetContent, SheetOverlay };
export type { SheetProps };
