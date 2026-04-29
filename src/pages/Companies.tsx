import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { createCompany, deleteCompany, listCompanies, listContacts } from "@/lib/api";

export default function Companies() {
  const qc = useQueryClient();
  const { data: companies = [] } = useQuery({ queryKey: ["companies"], queryFn: listCompanies });
  const { data: contacts = [] } = useQuery({ queryKey: ["contacts"], queryFn: listContacts });

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [industry, setIndustry] = useState("");

  const create = useMutation({
    mutationFn: () => createCompany({ name: name.trim(), website: website || null, industry: industry || null }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["companies"] });
      setOpen(false); setName(""); setWebsite(""); setIndustry("");
      toast.success("Company added");
    },
  });

  const remove = useMutation({
    mutationFn: deleteCompany,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["companies"] });
      toast.success("Company deleted");
    },
  });

  return (
    <>
      <PageHeader
        title="Companies"
        description={`${companies.length} compan${companies.length === 1 ? "y" : "ies"}`}
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4" /> New company</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New company</DialogTitle></DialogHeader>
              <div className="grid gap-3">
                <div className="grid gap-1.5"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
                <div className="grid gap-1.5"><Label>Website</Label><Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://" /></div>
                <div className="grid gap-1.5"><Label>Industry</Label><Input value={industry} onChange={(e) => setIndustry(e.target.value)} /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={() => create.mutate()} disabled={!name.trim() || create.isPending}>Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />
      <div className="grid gap-4 px-8 py-6 sm:grid-cols-2 lg:grid-cols-3">
        {companies.length === 0 && (
          <Card className="col-span-full p-10 text-center text-muted-foreground shadow-soft">
            No companies yet. Add your first company.
          </Card>
        )}
        {companies.map((c) => {
          const linked = contacts.filter((x) => x.company_id === c.id);
          return (
            <Card key={c.id} className="group p-5 shadow-soft transition-shadow hover:shadow-elegant">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-semibold">{c.name}</div>
                    {c.industry && <div className="text-xs text-muted-foreground">{c.industry}</div>}
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => remove.mutate(c.id)}>
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
              {c.website && (
                <a href={c.website} target="_blank" rel="noreferrer" className="mt-3 block truncate text-sm text-primary hover:underline">
                  {c.website}
                </a>
              )}
              <div className="mt-4 border-t border-border pt-3">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Contacts ({linked.length})</div>
                <ul className="mt-2 space-y-1 text-sm">
                  {linked.slice(0, 4).map((p) => (
                    <li key={p.id} className="truncate">
                      {p.first_name} {p.last_name}
                      {p.title && <span className="text-muted-foreground"> · {p.title}</span>}
                    </li>
                  ))}
                  {linked.length === 0 && <li className="text-muted-foreground">No linked contacts</li>}
                </ul>
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}
