import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  createContact, deleteContact, listCompanies, listContacts, updateContact,
} from "@/lib/api";
import type { Contact } from "@/lib/types";

export default function Contacts() {
  const qc = useQueryClient();
  const { data: contacts = [] } = useQuery({ queryKey: ["contacts"], queryFn: listContacts });
  const { data: companies = [] } = useQuery({ queryKey: ["companies"], queryFn: listCompanies });

  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const allTags = useMemo(
    () => Array.from(new Set(contacts.flatMap((c) => c.tags ?? []))).sort(),
    [contacts]
  );

  const filtered = contacts.filter((c) => {
    const q = search.toLowerCase();
    const hay = `${c.first_name} ${c.last_name ?? ""} ${c.email ?? ""} ${c.title ?? ""}`.toLowerCase();
    if (q && !hay.includes(q)) return false;
    if (tagFilter && !(c.tags ?? []).includes(tagFilter)) return false;
    return true;
  });

  const remove = useMutation({
    mutationFn: deleteContact,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contacts"] });
      toast.success("Contact deleted");
    },
  });

  return (
    <>
      <PageHeader
        title="Contacts"
        description={`${contacts.length} contact${contacts.length === 1 ? "" : "s"}`}
        actions={
          <ContactDialog
            companies={companies}
            open={open}
            setOpen={setOpen}
            onSaved={() => qc.invalidateQueries({ queryKey: ["contacts"] })}
            trigger={
              <Button>
                <Plus className="h-4 w-4" /> New contact
              </Button>
            }
          />
        }
      />
      <div className="space-y-4 px-8 py-6">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, title…"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {allTags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              {allTags.map((t) => (
                <button
                  key={t}
                  onClick={() => setTagFilter(tagFilter === t ? null : t)}
                  className={`rounded-full px-2.5 py-0.5 text-xs ring-1 ring-inset transition-colors ${
                    tagFilter === t
                      ? "bg-primary text-primary-foreground ring-primary"
                      : "bg-muted text-muted-foreground ring-border hover:bg-accent"
                  }`}
                >
                  #{t}
                </button>
              ))}
              {tagFilter && (
                <button
                  onClick={() => setTagFilter(null)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  <X className="inline h-3 w-3" /> clear
                </button>
              )}
            </div>
          )}
        </div>

        <Card className="overflow-hidden shadow-soft">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Tags</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                    No contacts found.
                  </td>
                </tr>
              )}
              {filtered.map((c) => {
                const co = companies.find((x) => x.id === c.company_id);
                return (
                  <tr key={c.id} className="hover:bg-muted/40">
                    <td className="px-4 py-3 font-medium">
                      {c.first_name} {c.last_name}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{c.title ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{co?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.email ?? "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(c.tags ?? []).map((t) => (
                          <span key={t} className="rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground">
                            #{t}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => remove.mutate(c.id)}
                        aria-label="Delete contact"
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      </div>
    </>
  );
}

function ContactDialog({
  companies, open, setOpen, onSaved, trigger, contact,
}: {
  companies: { id: string; name: string }[];
  open: boolean;
  setOpen: (v: boolean) => void;
  onSaved: () => void;
  trigger: React.ReactNode;
  contact?: Contact;
}) {
  const [first, setFirst] = useState(contact?.first_name ?? "");
  const [last, setLast] = useState(contact?.last_name ?? "");
  const [email, setEmail] = useState(contact?.email ?? "");
  const [phone, setPhone] = useState(contact?.phone ?? "");
  const [title, setTitle] = useState(contact?.title ?? "");
  const [companyId, setCompanyId] = useState<string>(contact?.company_id ?? "");
  const [tags, setTags] = useState((contact?.tags ?? []).join(", "));

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        first_name: first.trim(),
        last_name: last.trim() || null,
        email: email.trim() || null,
        phone: phone.trim() || null,
        title: title.trim() || null,
        company_id: companyId || null,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      };
      if (contact) return updateContact(contact.id, payload);
      return createContact(payload);
    },
    onSuccess: () => {
      toast.success(contact ? "Contact updated" : "Contact added");
      onSaved();
      setOpen(false);
      if (!contact) {
        setFirst(""); setLast(""); setEmail(""); setPhone(""); setTitle(""); setCompanyId(""); setTags("");
      }
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to save"),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{contact ? "Edit contact" : "New contact"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>First name</Label>
              <Input value={first} onChange={(e) => setFirst(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label>Last name</Label>
              <Input value={last} onChange={(e) => setLast(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label>Phone</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label>Company</Label>
            <Select value={companyId || "none"} onValueChange={(v) => setCompanyId(v === "none" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="No company" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No company</SelectItem>
                {companies.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label>Tags (comma-separated)</Label>
            <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="vip, newsletter" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={() => save.mutate()} disabled={!first.trim() || save.isPending}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
