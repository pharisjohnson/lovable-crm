import { cn } from "@/lib/utils";
import { STAGE_LABEL } from "@/lib/types";

const stageClasses: Record<string, string> = {
  lead: "bg-stage-lead/10 text-stage-lead ring-stage-lead/20",
  qualified: "bg-stage-qualified/10 text-stage-qualified ring-stage-qualified/20",
  proposal: "bg-stage-proposal/10 text-stage-proposal ring-stage-proposal/20",
  negotiation: "bg-stage-negotiation/10 text-stage-negotiation ring-stage-negotiation/20",
  won: "bg-stage-won/10 text-stage-won ring-stage-won/20",
  lost: "bg-stage-lost/10 text-stage-lost ring-stage-lost/20",
};

export default function StageBadge({ stage, className }: { stage: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        stageClasses[stage] ?? stageClasses.lead,
        className
      )}
    >
      {STAGE_LABEL[stage] ?? stage}
    </span>
  );
}
