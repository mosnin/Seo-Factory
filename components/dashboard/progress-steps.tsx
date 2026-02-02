import { cn } from "@/lib/utils";
import { IconCheck, IconLoader, IconSearch, IconFileText } from "@/components/ui/icons";

type Stage = "RESEARCHING" | "OUTLINING" | "WRITING" | "FACT_CHECKING" | "OPTIMIZING" | "REVIEWING";

interface Step {
  key: Stage;
  label: string;
  icon: React.ReactNode;
}

const steps: Step[] = [
  { key: "RESEARCHING", label: "Research", icon: <IconSearch className="h-4 w-4" /> },
  { key: "OUTLINING", label: "Outline", icon: <IconFileText className="h-4 w-4" /> },
  { key: "WRITING", label: "Draft", icon: <IconPenLine /> },
  { key: "FACT_CHECKING", label: "Fact-Check", icon: <IconFactCheck /> },
  { key: "OPTIMIZING", label: "Optimize", icon: <IconOptimize /> },
  { key: "REVIEWING", label: "Review", icon: <IconReview /> },
];

const stageOrder: Record<Stage, number> = {
  RESEARCHING: 0,
  OUTLINING: 1,
  WRITING: 2,
  FACT_CHECKING: 3,
  OPTIMIZING: 4,
  REVIEWING: 5,
};

interface ProgressStepsProps {
  currentStage: Stage;
  className?: string;
}

export function ProgressSteps({ currentStage, className }: ProgressStepsProps) {
  const currentIndex = stageOrder[currentStage];

  return (
    <div className={cn("flex items-center", className)}>
      {steps.map((step, i) => {
        const isCompleted = i < currentIndex;
        const isCurrent = i === currentIndex;
        const isPending = i > currentIndex;

        return (
          <div key={step.key} className="flex items-center">
            {/* Step circle + label */}
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors",
                  isCompleted &&
                    "border-success bg-success text-success-foreground",
                  isCurrent &&
                    "border-primary bg-primary text-primary-foreground",
                  isPending &&
                    "border-muted-foreground/30 bg-background text-muted-foreground/50",
                )}
              >
                {isCompleted ? (
                  <IconCheck className="h-4 w-4" />
                ) : isCurrent ? (
                  <IconLoader className="h-4 w-4" />
                ) : (
                  step.icon
                )}
              </div>
              <span
                className={cn(
                  "text-xs font-medium",
                  isCompleted && "text-success",
                  isCurrent && "text-primary",
                  isPending && "text-muted-foreground/50",
                )}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line (not after last step) */}
            {i < steps.length - 1 && (
              <div
                className={cn(
                  "mb-5 h-0.5 w-8 sm:w-12",
                  i < currentIndex ? "bg-success" : "bg-muted",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* Inline mini-icons to avoid bloating the main icons file */
function IconPenLine() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M12 20h9" />
      <path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z" />
    </svg>
  );
}

function IconFactCheck() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function IconOptimize() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M12 3v5" /><path d="m9 10 3-2 3 2" /><path d="M12 22v-5" /><path d="m9 14 3 2 3-2" /><path d="M3 12h5" /><path d="m10 15-2-3 2-3" /><path d="M22 12h-5" /><path d="m14 9 2 3-2 3" />
    </svg>
  );
}

function IconReview() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
