import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  IconMoreVertical,
  IconExternalLink,
  IconPencil,
  IconCopy,
  IconTrash,
} from "@/components/ui/icons";

type ArticleStatus =
  | "QUEUED"
  | "RESEARCHING"
  | "OUTLINING"
  | "WRITING"
  | "REVIEWING"
  | "PUBLISHED"
  | "FAILED";

interface ArticleCardProps {
  id: string;
  keyword: string;
  title?: string | null;
  status: ArticleStatus;
  seoScore?: number | null;
  readabilityScore?: number | null;
  wordCount?: number | null;
  brandVoiceName?: string | null;
  createdAt: Date | string;
  className?: string;
}

const statusConfig: Record<
  ArticleStatus,
  { label: string; variant: "default" | "secondary" | "success" | "warning" | "destructive" | "outline" }
> = {
  QUEUED: { label: "Queued", variant: "secondary" },
  RESEARCHING: { label: "Researching", variant: "outline" },
  OUTLINING: { label: "Outlining", variant: "outline" },
  WRITING: { label: "Writing", variant: "warning" },
  REVIEWING: { label: "Reviewing", variant: "warning" },
  PUBLISHED: { label: "Published", variant: "success" },
  FAILED: { label: "Failed", variant: "destructive" },
};

function ScoreRing({
  score,
  label,
}: {
  score: number;
  label: string;
}) {
  const circumference = 2 * Math.PI * 16;
  const offset = circumference - (score / 100) * circumference;
  const color =
    score >= 80
      ? "text-success"
      : score >= 50
        ? "text-warning"
        : "text-destructive";

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative h-11 w-11">
        <svg className="h-11 w-11 -rotate-90" viewBox="0 0 36 36">
          <circle
            cx="18"
            cy="18"
            r="16"
            fill="none"
            className="stroke-muted"
            strokeWidth="2.5"
          />
          <circle
            cx="18"
            cy="18"
            r="16"
            fill="none"
            className={cn("transition-all duration-500", color)}
            stroke="currentColor"
            strokeWidth="2.5"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold">
          {Math.round(score)}
        </span>
      </div>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}

export function ArticleCard({
  keyword,
  title,
  status,
  seoScore,
  readabilityScore,
  wordCount,
  brandVoiceName,
  createdAt,
  className,
}: ArticleCardProps) {
  const cfg = statusConfig[status];

  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 space-y-1">
            <CardTitle className="text-base leading-snug">
              {title ?? keyword}
            </CardTitle>
            {title && (
              <p className="text-xs text-muted-foreground">{keyword}</p>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground">
              <IconMoreVertical className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>
                <IconExternalLink className="mr-2 h-3.5 w-3.5" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem>
                <IconPencil className="mr-2 h-3.5 w-3.5" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem>
                <IconCopy className="mr-2 h-3.5 w-3.5" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem destructive>
                <IconTrash className="mr-2 h-3.5 w-3.5" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="flex-1 pb-3">
        <div className="flex items-center gap-2">
          <Badge variant={cfg.variant}>{cfg.label}</Badge>
          {brandVoiceName && (
            <Badge variant="outline" className="font-normal">
              {brandVoiceName}
            </Badge>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between border-t pt-4">
        <div className="flex items-center gap-3">
          {seoScore != null && <ScoreRing score={seoScore} label="SEO" />}
          {readabilityScore != null && (
            <ScoreRing score={readabilityScore} label="Read" />
          )}
          {wordCount != null && (
            <div className="flex flex-col items-center gap-1">
              <span className="text-sm font-semibold">
                {wordCount.toLocaleString()}
              </span>
              <span className="text-[10px] text-muted-foreground">words</span>
            </div>
          )}
        </div>
        <span className="text-xs text-muted-foreground">
          {formatDate(createdAt)}
        </span>
      </CardFooter>
    </Card>
  );
}
