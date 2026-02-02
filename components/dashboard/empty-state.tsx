import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { IconPlus } from "@/components/ui/icons";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-dashed bg-card px-6 py-16 text-center",
        className,
      )}
    >
      {/* Illustration */}
      <div className="mb-6">
        <svg
          width="120"
          height="96"
          viewBox="0 0 120 96"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="text-muted-foreground/20"
        >
          {/* Stack of pages */}
          <rect x="24" y="12" width="72" height="80" rx="6" className="fill-muted stroke-muted-foreground/30" strokeWidth="1.5" />
          <rect x="20" y="8" width="72" height="80" rx="6" className="fill-card stroke-muted-foreground/30" strokeWidth="1.5" />
          {/* Lines representing text */}
          <rect x="32" y="24" width="36" height="3" rx="1.5" className="fill-muted-foreground/20" />
          <rect x="32" y="33" width="48" height="3" rx="1.5" className="fill-muted-foreground/15" />
          <rect x="32" y="42" width="44" height="3" rx="1.5" className="fill-muted-foreground/15" />
          <rect x="32" y="51" width="40" height="3" rx="1.5" className="fill-muted-foreground/10" />
          <rect x="32" y="60" width="32" height="3" rx="1.5" className="fill-muted-foreground/10" />
          {/* Sparkle / plus accent */}
          <circle cx="96" cy="20" r="12" className="fill-primary/10" />
          <path d="M96 14v12M90 20h12" className="stroke-primary" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>

      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
        {description}
      </p>

      {actionLabel && (
        <div className="mt-6">
          {actionHref ? (
            <a href={actionHref}>
              <Button>
                <IconPlus className="mr-2 h-4 w-4" />
                {actionLabel}
              </Button>
            </a>
          ) : (
            <Button onClick={onAction}>
              <IconPlus className="mr-2 h-4 w-4" />
              {actionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
