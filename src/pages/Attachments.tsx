import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { formatDistanceToNow, parseISO } from "date-fns";
import { FileText, Image as ImageIcon, Search, Trash2 } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { deleteAttachment, listAllAttachments, listDeals } from "@/lib/api";

const isImage = (mt?: string | null) => !!mt && mt.startsWith("image/");

export default function Attachments() {
  const qc = useQueryClient();
  const { data: files = [] } = useQuery({ queryKey: ["attachments", "all"], queryFn: listAllAttachments });
  const { data: deals = [] } = useQuery({ queryKey: ["deals"], queryFn: listDeals });
  const dealMap = useMemo(() => Object.fromEntries(deals.map((d) => [d.id, d])), [deals]);
  const [q, setQ] = useState("");

  const filtered = files.filter((f) =>
    !q.trim() ? true : f.filename.toLowerCase().includes(q.toLowerCase())
  );

  const totalSize = filtered.reduce((s, f) => s + (f.size ?? 0), 0);

  const del = useMutation({
    mutationFn: (id: string) => deleteAttachment(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["attachments", "all"] }),
  });

  return (
    <>
      <PageHeader
        title="Attachments"
        description={`${filtered.length} files · ${(totalSize / 1024 / 1024).toFixed(2)} MB`}
      />
      <div className="space-y-4 px-8 py-6">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search files…" className="pl-9" />
        </div>

        {filtered.length === 0 ? (
          <Card className="p-10 text-center text-muted-foreground shadow-soft">
            No attachments. Upload files from a deal page.
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((a) => {
              const deal = dealMap[a.deal_id];
              return (
                <Card key={a.id} className="overflow-hidden shadow-soft">
                  <div className="flex h-32 items-center justify-center bg-muted/40">
                    {isImage(a.mime_type) && a.url ? (
                      <img src={a.url} alt={a.filename} className="h-full w-full object-cover" />
                    ) : isImage(a.mime_type) ? (
                      <ImageIcon className="h-10 w-10 text-muted-foreground" />
                    ) : (
                      <FileText className="h-10 w-10 text-muted-foreground" />
                    )}
                  </div>
                  <div className="p-3">
                    <a
                      href={a.url ?? "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="block truncate text-sm font-medium hover:underline"
                    >
                      {a.filename}
                    </a>
                    <div className="text-xs text-muted-foreground">
                      {a.size ? `${(a.size / 1024).toFixed(1)} KB · ` : ""}
                      {formatDistanceToNow(parseISO(a.created_at), { addSuffix: true })}
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      {deal ? (
                        <Link to={`/deals/${deal.id}`} className="truncate text-xs text-primary hover:underline">
                          {deal.title}
                        </Link>
                      ) : <span className="text-xs text-muted-foreground">Unlinked</span>}
                      <Button variant="ghost" size="icon" onClick={() => del.mutate(a.id)}>
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
