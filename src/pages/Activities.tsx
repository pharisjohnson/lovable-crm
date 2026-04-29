import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { Activity as ActivityIcon } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { listAllActivities, listDeals } from "@/lib/api";
import type { Activity } from "@/lib/types";

const TYPES: { key: Activity["type"] | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "created", label: "Created" },
  { key: "stage_change", label: "Stage" },
  { key: "note_added", label: "Notes" },
  { key: "task_added", label: "Tasks" },
  { key: "task_completed", label: "Completed" },
  { key: "file_uploaded", label: "Files" },
];

export default function Activities() {
  const { data: activities = [] } = useQuery({ queryKey: ["activities", "all"], queryFn: listAllActivities });
  const { data: deals = [] } = useQuery({ queryKey: ["deals"], queryFn: listDeals });
  const dealMap = useMemo(() => Object.fromEntries(deals.map((d) => [d.id, d])), [deals]);
  const [filter, setFilter] = useState<Activity["type"] | "all">("all");

  const filtered = activities.filter((a) => filter === "all" || a.type === filter);

  // Group by date
  const grouped = filtered.reduce<Record<string, Activity[]>>((acc, a) => {
    const key = format(parseISO(a.created_at), "yyyy-MM-dd");
    (acc[key] ||= []).push(a);
    return acc;
  }, {});

  return (
    <>
      <PageHeader title="Activity" description="Everything that's happened across your workspace." />
      <div className="space-y-6 px-8 py-6">
        <div className="flex flex-wrap gap-2">
          {TYPES.map((t) => (
            <Button
              key={t.key}
              variant={filter === t.key ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(t.key)}
            >
              {t.label}
            </Button>
          ))}
        </div>

        {Object.keys(grouped).length === 0 ? (
          <Card className="p-10 text-center text-muted-foreground shadow-soft">
            <ActivityIcon className="mx-auto mb-3 h-8 w-8" />
            No activity yet.
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([date, items]) => (
              <Card key={date} className="p-5 shadow-soft">
                <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {format(parseISO(date), "EEEE, MMM d, yyyy")}
                </div>
                <ol className="relative space-y-4 border-l border-border pl-5">
                  {items.map((a) => {
                    const deal = dealMap[a.deal_id];
                    return (
                      <li key={a.id} className="relative">
                        <span className="absolute -left-[27px] top-1.5 h-3 w-3 rounded-full bg-gradient-primary ring-4 ring-background" />
                        <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                          <span>{a.type.replace("_", " ")}</span>
                          {deal && (
                            <>
                              <span>·</span>
                              <Link to={`/deals/${deal.id}`} className="normal-case text-primary hover:underline">
                                {deal.title}
                              </Link>
                            </>
                          )}
                        </div>
                        <div className="mt-0.5 text-sm">{a.message}</div>
                        <div className="text-xs text-muted-foreground">
                          {format(parseISO(a.created_at), "h:mm a")}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
