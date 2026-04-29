import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { Calendar, Plus } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  createDeal, listCompanies, listContacts, listDeals, updateDealStage,
} from "@/lib/api";
import { STAGES, type Deal, type StageKey } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function Pipeline() {
  const qc = useQueryClient();
  const { data: deals = [] } = useQuery({ queryKey: ["deals"], queryFn: listDeals });
  const { data: contacts = [] } = useQuery({ queryKey: ["contacts"], queryFn: listContacts });
  const { data: companies = [] } = useQuery({ queryKey: ["companies"], queryFn: listCompanies });

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [value, setValue] = useState("");
  const [stage, setStage] = useState<StageKey>("lead");
  const [contactId, setContactId] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [followUp, setFollowUp] = useState("");

  const create = useMutation({
    mutationFn: () =>
      createDeal({
        title: title.trim(),
        value: Number(value || 0),
        stage,
        contact_id: contactId || null,
        company_id: companyId || null,
        next_follow_up: followUp || null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["deals"] });
      setOpen(false);
      setTitle(""); setValue(""); setStage("lead"); setContactId(""); setCompanyId(""); setFollowUp("");
      toast.success("Deal created");
    },
  });

  const move = useMutation({
    mutationFn: ({ deal, newStage }: { deal: Deal; newStage: StageKey }) =>
      updateDealStage(deal, newStage),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["deals"] });
      qc.invalidateQueries({ queryKey: ["activities"] });
    },
  });

  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<StageKey | null>(null);

  return (
    <>
      <PageHeader
        title="Pipeline"
        description="Drag deals between stages, or use the dropdown."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4" /> New deal</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New deal</DialogTitle></DialogHeader>
              <div className="grid gap-3">
                <div className="grid gap-1.5"><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5"><Label>Value ($)</Label><Input type="number" value={value} onChange={(e) => setValue(e.target.value)} /></div>
                  <div className="grid gap-1.5">
                    <Label>Stage</Label>
                    <Select value={stage} onValueChange={(v) => setStage(v as StageKey)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {STAGES.map((s) => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5">
                    <Label>Contact</Label>
                    <Select value={contactId || "none"} onValueChange={(v) => setContactId(v === "none" ? "" : v)}>
                      <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {contacts.map((c) => <SelectItem key={c.id} value={c.id}>{c.first_name} {c.last_name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Company</Label>
                    <Select value={companyId || "none"} onValueChange={(v) => setCompanyId(v === "none" ? "" : v)}>
                      <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {companies.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-1.5"><Label>Next follow-up</Label><Input type="date" value={followUp} onChange={(e) => setFollowUp(e.target.value)} /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={() => create.mutate()} disabled={!title.trim() || create.isPending}>Create</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />
      <div className="overflow-x-auto px-8 py-6">
        <div className="flex gap-4">
          {STAGES.map((s) => {
            const stageDeals = deals.filter((d) => d.stage === s.key);
            const total = stageDeals.reduce((sum, d) => sum + Number(d.value || 0), 0);
            return (
              <div
                key={s.key}
                onDragOver={(e) => { e.preventDefault(); setDragOver(s.key); }}
                onDragLeave={() => setDragOver((d) => (d === s.key ? null : d))}
                onDrop={() => {
                  setDragOver(null);
                  if (!dragId) return;
                  const deal = deals.find((d) => d.id === dragId);
                  if (deal) move.mutate({ deal, newStage: s.key });
                  setDragId(null);
                }}
                className={cn(
                  "flex w-72 shrink-0 flex-col rounded-xl border border-border bg-card/60 transition-colors",
                  dragOver === s.key && "border-primary bg-accent"
                )}
              >
                <div className="flex items-center justify-between px-4 pb-2 pt-3">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full bg-stage-${s.key}`} />
                    <span className="text-sm font-semibold">{s.label}</span>
                    <span className="text-xs text-muted-foreground">({stageDeals.length})</span>
                  </div>
                  <span className="text-xs text-muted-foreground">${total.toLocaleString()}</span>
                </div>
                <div className="flex flex-1 flex-col gap-2 p-2">
                  {stageDeals.map((d) => {
                    const contact = contacts.find((c) => c.id === d.contact_id);
                    const company = companies.find((c) => c.id === d.company_id);
                    return (
                      <Link key={d.id} to={`/deals/${d.id}`}>
                        <Card
                          draggable
                          onDragStart={() => setDragId(d.id)}
                          onDragEnd={() => setDragId(null)}
                          className={cn(
                            "cursor-grab p-3 shadow-soft transition-all hover:shadow-elegant active:cursor-grabbing",
                            dragId === d.id && "opacity-50"
                          )}
                        >
                          <div className="text-sm font-semibold">{d.title}</div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {company?.name ?? contact?.first_name ?? "—"}
                          </div>
                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-sm font-medium text-foreground">
                              ${Number(d.value || 0).toLocaleString()}
                            </span>
                            {d.next_follow_up && (
                              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                {format(parseISO(d.next_follow_up), "MMM d")}
                              </span>
                            )}
                          </div>
                        </Card>
                      </Link>
                    );
                  })}
                  {stageDeals.length === 0 && (
                    <div className="rounded-md border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                      Drop deals here
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
