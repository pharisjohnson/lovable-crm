import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { differenceInCalendarDays, format, isPast, isToday, parseISO } from "date-fns";
import { Bell, Calendar, CheckCircle2, Circle } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { listDeals, listUpcomingTasks, toggleTask } from "@/lib/api";

export default function Reminders() {
  const qc = useQueryClient();
  const { data: tasks = [] } = useQuery({ queryKey: ["tasks", "upcoming"], queryFn: listUpcomingTasks });
  const { data: deals = [] } = useQuery({ queryKey: ["deals"], queryFn: listDeals });

  const toggle = useMutation({
    mutationFn: toggleTask,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks", "upcoming"] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const followUps = deals
    .filter((d) => d.next_follow_up && d.stage !== "won" && d.stage !== "lost")
    .sort((a, b) => (a.next_follow_up! < b.next_follow_up! ? -1 : 1));

  const dueLabel = (d: string) => {
    const date = parseISO(d);
    if (isToday(date)) return { label: "Today", tone: "text-warning" };
    if (isPast(date)) return { label: `${Math.abs(differenceInCalendarDays(date, new Date()))}d overdue`, tone: "text-destructive" };
    const diff = differenceInCalendarDays(date, new Date());
    return { label: `In ${diff}d`, tone: "text-muted-foreground" };
  };

  return (
    <>
      <PageHeader title="Reminders" description="Upcoming tasks and follow-ups." />
      <div className="grid gap-6 px-8 py-6 lg:grid-cols-2">
        <Card className="p-5 shadow-soft">
          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold">
            <Bell className="h-4 w-4 text-primary" /> Tasks ({tasks.length})
          </h2>
          {tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">All caught up. Nice work!</p>
          ) : (
            <ul className="divide-y divide-border">
              {tasks.map((t) => {
                const due = t.due_date ? dueLabel(t.due_date) : null;
                return (
                  <li key={t.id} className="flex items-center gap-3 py-3">
                    <button onClick={() => toggle.mutate(t)} aria-label="toggle">
                      {t.completed
                        ? <CheckCircle2 className="h-5 w-5 text-success" />
                        : <Circle className="h-5 w-5 text-muted-foreground" />}
                    </button>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{t.title}</div>
                      {t.due_date && (
                        <div className="text-xs text-muted-foreground">
                          {format(parseISO(t.due_date), "MMM d, yyyy")}{" "}
                          {due && <span className={due.tone}>· {due.label}</span>}
                        </div>
                      )}
                    </div>
                    {t.deal_id && (
                      <Link to={`/deals/${t.deal_id}`}>
                        <Button variant="outline" size="sm">View deal</Button>
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card className="p-5 shadow-soft">
          <h2 className="mb-4 flex items-center gap-2 text-base font-semibold">
            <Calendar className="h-4 w-4 text-primary" /> Follow-ups ({followUps.length})
          </h2>
          {followUps.length === 0 ? (
            <p className="text-sm text-muted-foreground">No follow-ups scheduled.</p>
          ) : (
            <ul className="divide-y divide-border">
              {followUps.map((d) => {
                const due = dueLabel(d.next_follow_up!);
                return (
                  <li key={d.id} className="flex items-center gap-3 py-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{d.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {format(parseISO(d.next_follow_up!), "MMM d, yyyy")} <span className={due.tone}>· {due.label}</span>
                      </div>
                    </div>
                    <Link to={`/deals/${d.id}`}>
                      <Button variant="outline" size="sm">Open</Button>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
