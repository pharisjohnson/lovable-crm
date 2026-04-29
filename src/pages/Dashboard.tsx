import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { format, isPast, isToday, parseISO } from "date-fns";
import { ArrowRight, CheckCircle2, DollarSign, Target, Users } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import StageBadge from "@/components/StageBadge";
import { Card } from "@/components/ui/card";
import { listContacts, listDeals, listUpcomingTasks } from "@/lib/api";
import { STAGES } from "@/lib/types";

export default function Dashboard() {
  const { data: deals = [] } = useQuery({ queryKey: ["deals"], queryFn: listDeals });
  const { data: contacts = [] } = useQuery({ queryKey: ["contacts"], queryFn: listContacts });
  const { data: tasks = [] } = useQuery({ queryKey: ["tasks", "upcoming"], queryFn: listUpcomingTasks });

  const openDeals = deals.filter((d) => d.stage !== "won" && d.stage !== "lost");
  const pipelineValue = openDeals.reduce((s, d) => s + Number(d.value || 0), 0);
  const wonValue = deals
    .filter((d) => d.stage === "won")
    .reduce((s, d) => s + Number(d.value || 0), 0);

  const stats = [
    { label: "Open deals", value: openDeals.length, icon: Target },
    { label: "Pipeline value", value: `$${pipelineValue.toLocaleString()}`, icon: DollarSign },
    { label: "Won this period", value: `$${wonValue.toLocaleString()}`, icon: CheckCircle2 },
    { label: "Contacts", value: contacts.length, icon: Users },
  ];

  return (
    <>
      <PageHeader title="Dashboard" description="Your pipeline at a glance." />
      <div className="space-y-6 px-8 py-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <Card key={s.label} className="p-5 shadow-soft">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{s.label}</span>
                <s.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="mt-3 text-2xl font-semibold">{s.value}</div>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2 p-6 shadow-soft">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold">Pipeline by stage</h2>
              <Link to="/pipeline" className="text-sm text-primary hover:underline">
                Open pipeline <ArrowRight className="inline h-3 w-3" />
              </Link>
            </div>
            <div className="space-y-3">
              {STAGES.map((s) => {
                const stageDeals = deals.filter((d) => d.stage === s.key);
                const total = stageDeals.reduce((sum, d) => sum + Number(d.value || 0), 0);
                const max = Math.max(1, ...STAGES.map((st) => deals.filter((d) => d.stage === st.key).length));
                const pct = (stageDeals.length / max) * 100;
                return (
                  <div key={s.key}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <StageBadge stage={s.key} />
                      <span className="text-muted-foreground">
                        {stageDeals.length} · ${total.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-gradient-primary transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="p-6 shadow-soft">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold">Upcoming tasks</h2>
              <Link to="/reminders" className="text-sm text-primary hover:underline">
                All <ArrowRight className="inline h-3 w-3" />
              </Link>
            </div>
            {tasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming tasks. 🎉</p>
            ) : (
              <ul className="space-y-2">
                {tasks.slice(0, 6).map((t) => {
                  const due = t.due_date ? parseISO(t.due_date) : null;
                  const overdue = due ? isPast(due) && !isToday(due) : false;
                  return (
                    <li key={t.id} className="flex items-start gap-3 rounded-md p-2 hover:bg-muted/60">
                      <div className="mt-1 h-2 w-2 rounded-full bg-primary" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{t.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {due ? format(due, "MMM d") : "No due date"}
                          {overdue && <span className="ml-1 text-destructive">· overdue</span>}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
