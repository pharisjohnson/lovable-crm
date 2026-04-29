import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { format, isPast, isToday, parseISO } from "date-fns";
import { CheckCircle2, Circle, Plus, Trash2 } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  createTask, deleteTask, listDeals, listTasks, toggleTask,
} from "@/lib/api";
import type { Task } from "@/lib/types";

type Filter = "all" | "open" | "completed" | "overdue";

export default function Tasks() {
  const qc = useQueryClient();
  const { data: tasks = [] } = useQuery({ queryKey: ["tasks", "all"], queryFn: () => listTasks() });
  const { data: deals = [] } = useQuery({ queryKey: ["deals"], queryFn: listDeals });
  const dealMap = useMemo(() => Object.fromEntries(deals.map((d) => [d.id, d])), [deals]);

  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const [dealId, setDealId] = useState<string>("none");
  const [filter, setFilter] = useState<Filter>("open");

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["tasks", "all"] });
    qc.invalidateQueries({ queryKey: ["tasks", "upcoming"] });
  };

  const add = useMutation({
    mutationFn: () =>
      createTask({
        title: title.trim(),
        due_date: due || null,
        deal_id: dealId === "none" ? null : dealId,
      }),
    onSuccess: () => {
      setTitle(""); setDue(""); setDealId("none");
      invalidate();
    },
  });

  const toggle = useMutation({
    mutationFn: (t: Task) => toggleTask(t),
    onSuccess: invalidate,
  });

  const del = useMutation({
    mutationFn: (id: string) => deleteTask(id),
    onSuccess: invalidate,
  });

  const filtered = tasks.filter((t) => {
    if (filter === "open") return !t.completed;
    if (filter === "completed") return t.completed;
    if (filter === "overdue")
      return !t.completed && t.due_date && isPast(parseISO(t.due_date)) && !isToday(parseISO(t.due_date));
    return true;
  });

  return (
    <>
      <PageHeader title="Tasks" description="Plan and track everything that needs doing." />
      <div className="space-y-6 px-8 py-6">
        <Card className="p-5 shadow-soft">
          <div className="grid gap-2 sm:grid-cols-[1fr_180px_200px_auto]">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What needs doing?" />
            <Input type="date" value={due} onChange={(e) => setDue(e.target.value)} />
            <Select value={dealId} onValueChange={setDealId}>
              <SelectTrigger><SelectValue placeholder="Link to deal (optional)" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No deal</SelectItem>
                {deals.map((d) => <SelectItem key={d.id} value={d.id}>{d.title}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button onClick={() => add.mutate()} disabled={!title.trim() || add.isPending}>
              <Plus className="h-4 w-4" /> Add
            </Button>
          </div>
        </Card>

        <div className="flex flex-wrap gap-2">
          {(["open", "overdue", "completed", "all"] as Filter[]).map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f)}
              className="capitalize"
            >
              {f}
            </Button>
          ))}
        </div>

        <Card className="shadow-soft">
          {filtered.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">No tasks here.</div>
          ) : (
            <ul className="divide-y divide-border">
              {filtered.map((t) => {
                const deal = t.deal_id ? dealMap[t.deal_id] : null;
                const due = t.due_date ? parseISO(t.due_date) : null;
                const overdue = due && !t.completed && isPast(due) && !isToday(due);
                return (
                  <li key={t.id} className="flex items-center gap-3 px-4 py-3">
                    <button onClick={() => toggle.mutate(t)} aria-label="toggle">
                      {t.completed
                        ? <CheckCircle2 className="h-5 w-5 text-success" />
                        : <Circle className="h-5 w-5 text-muted-foreground" />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className={`truncate text-sm ${t.completed ? "text-muted-foreground line-through" : "font-medium"}`}>
                        {t.title}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {due ? format(due, "MMM d, yyyy") : "No due date"}
                        {overdue && <span className="ml-1 text-destructive">· overdue</span>}
                        {deal && (
                          <>
                            {" · "}
                            <Link to={`/deals/${deal.id}`} className="hover:underline">{deal.title}</Link>
                          </>
                        )}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => del.mutate(t.id)}>
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
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
