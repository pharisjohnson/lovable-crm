import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { formatDistanceToNow, parseISO } from "date-fns";
import { Search, StickyNote, Trash2 } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { deleteNote, listAllNotes, listDeals } from "@/lib/api";

export default function Notes() {
  const qc = useQueryClient();
  const { data: notes = [] } = useQuery({ queryKey: ["notes", "all"], queryFn: listAllNotes });
  const { data: deals = [] } = useQuery({ queryKey: ["deals"], queryFn: listDeals });
  const [q, setQ] = useState("");

  const dealMap = useMemo(() => Object.fromEntries(deals.map((d) => [d.id, d])), [deals]);

  const filtered = notes.filter((n) =>
    !q.trim() ? true : n.body.toLowerCase().includes(q.toLowerCase())
  );

  const del = useMutation({
    mutationFn: (id: string) => deleteNote(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notes", "all"] }),
  });

  return (
    <>
      <PageHeader title="Notes" description="All notes captured across your deals." />
      <div className="space-y-4 px-8 py-6">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search notes…" className="pl-9" />
        </div>

        {filtered.length === 0 ? (
          <Card className="p-10 text-center text-muted-foreground shadow-soft">
            <StickyNote className="mx-auto mb-3 h-8 w-8" />
            No notes found.
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {filtered.map((n) => {
              const deal = dealMap[n.deal_id];
              return (
                <Card key={n.id} className="p-4 shadow-soft">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      {deal ? (
                        <Link to={`/deals/${deal.id}`} className="text-sm font-medium hover:underline">
                          {deal.title}
                        </Link>
                      ) : (
                        <span className="text-sm text-muted-foreground">Unlinked</span>
                      )}
                      <div className="text-xs text-muted-foreground">
                        {formatDistanceToNow(parseISO(n.created_at), { addSuffix: true })}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => del.mutate(n.id)}>
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                  <p className="whitespace-pre-wrap text-sm">{n.body}</p>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
