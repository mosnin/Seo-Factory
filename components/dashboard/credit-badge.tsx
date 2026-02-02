import { cn } from "@/lib/utils";
import { IconCoins, IconAlertTriangle } from "@/components/ui/icons";

interface CreditBadgeProps {
  credits: number;
  className?: string;
}

export function CreditBadge({ credits, className }: CreditBadgeProps) {
  const isLow = credits < 10;
  const isEmpty = credits <= 0;

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        isEmpty
          ? "bg-destructive/10 text-destructive dark:bg-destructive/20"
          : isLow
            ? "bg-warning/10 text-warning dark:bg-warning/20"
            : "bg-secondary text-secondary-foreground",
        className,
      )}
    >
      {isLow ? (
        <IconAlertTriangle className="h-4 w-4 shrink-0" />
      ) : (
        <IconCoins className="h-4 w-4 shrink-0" />
      )}
      <span>
        {credits.toLocaleString()} credit{credits !== 1 ? "s" : ""}
      </span>
      {isEmpty && (
        <span className="text-xs font-normal opacity-75">- Top up to continue</span>
      )}
      {isLow && !isEmpty && (
        <span className="text-xs font-normal opacity-75">- Running low</span>
      )}
    </div>
  );
}
