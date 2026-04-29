import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import {
  ArrowLeft, Calendar, CheckCircle2, Circle, FileText, Paperclip,
  StickyNote, Trash2, Upload,
} from "lucide-react";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader";
import StageBadge from "@/components/StageBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  createAttachment, createNote, createTask, deleteAttachment, deleteTask,
  getDeal, listActivities, listAttachments, listCompanies, listContacts,
  listNotes, listTasks, logActivity, toggleTask, updateDeal, updateDealStage,
} from "@/lib/api";
import { STAGES, type StageKey } from "@/lib/types";
import { ATTACHMENTS_BUCKET, insforge } from "@/lib/insforge";

export default function DealDetail() {
  const { id = "" } = useParams();
  const qc = useQueryClient();

  const { data: deal } = useQuery({ queryKey: ["deal", id], queryFn: () => getDeal(id), enabled: !!id });
  const { data: contacts = [] } = useQuery({ queryKey: ["contacts"], queryFn: listContacts });
  const { data: companies = [] } = useQuery({ queryKey: ["companies"], queryFn: listCompanies });
  const { data: notes = [] } = useQuery({ queryKey: ["notes", id], queryFn: () => listNotes(id), enabled: !!id });
  const { data: tasks = [] } = useQuery({ queryKey: ["tasks", id], queryFn: () => listTasks(id), enabled: !!id });
  const { data: activities = [] } = useQuery({ queryKey: ["activities", id], queryFn: () => listActivities(id), enabled: !!id });
  const { data: attachments = [] } = useQuery({ queryKey: ["attachments", id], queryFn: () => listAttachments(id), enabled: !!id });

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ["deal", id] });
    qc.invalidateQueries({ queryKey: ["deals"] });
    qc.invalidateQueries({ queryKey: ["activities", id] });
  };

  const stageMut = useMutation({
    mutationFn: (newStage: StageKey) => updateDealStage(deal!, newStage),
    onSuccess: invalidateAll,
  });

  const followUpMut = useMutation({
    mutationFn: (date: string) => updateDeal(id, { next_follow_up: date || null }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["deal", id] }),
  });

  const [noteBody, setNoteBody] = useState("");
  const addNote = useMutation({
    mutationFn: () => createNote(id, noteBody.trim()),
    onSuccess: () => {
      setNoteBody("");
      qc.invalidateQueries({ queryKey: ["notes", id] });
      qc.invalidateQueries({ queryKey: ["activities", id] });
    },
  });

  const [taskTitle, setTaskTitle] = useState("");
  const [taskDue, setTaskDue] = useState("");
  const addTask = useMutation({
    mutationFn: () =>
      createTask({ deal_id: id, title: taskTitle.trim(), due_date: taskDue || null }),
    onSuccess: () => {
      setTaskTitle(""); setTaskDue("");
      qc.invalidateQueries({ queryKey: ["tasks", id] });
      qc.invalidateQueries({ queryKey: ["tasks", "upcoming"] });
      qc.invalidateQueries({ queryKey: ["activities", id] });
    },
  });

  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const onUpload = async (file: File) => {
    setUploading(true);
    try {
      const { data, error } = await insforge.storage
        .from(ATTACHMENTS_BUCKET)
        .upload(`deals/${id}/${Date.now()}-${file.name}`, file);
      if (error || !data) throw error ?? new Error("Upload failed");
      await createAttachment({
        deal_id: id,
        filename: file.name,
        object_key: data.key,
        url: data.url,
        size: data.size,
        mime_type: data.mimeType,
      });
      await logActivity(id, "file_uploaded", `Uploaded ${file.name}`);
      qc.invalidateQueries({ queryKey: ["attachments", id] });
      qc.invalidateQueries({ queryKey: ["activities", id] });
      toast.success("File uploaded");
    } catch (e: any) {
      toast.error(e?.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  if (!deal) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        Loading deal…
      </div>
    );
  }

  const contact = contacts.find((c) => c.id === deal.contact_id);
  const company = companies.find((c) => c.id === deal.company_id);

  return (
    <>
      <PageHeader
        title={deal.title}
        description={`$${Number(deal.value || 0).toLocaleString()}${
          company ? ` · ${company.name}` : ""
        }${contact ? ` · ${contact.first_name} ${contact.last_name ?? ""}` : ""}`}
        actions={
          <Link to="/pipeline">
            <Button variant="outline"><ArrowLeft className="h-4 w-4" /> Pipeline</Button>
          </Link>
        }
      />
      <div className="grid gap-6 px-8 py-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card className="p-5 shadow-soft">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Stage</div>
                <div className="mt-2"><StageBadge stage={deal.stage} /></div>
                <Select value={deal.stage} onValueChange={(v) => stageMut.mutate(v as StageKey)}>
                  <SelectTrigger className="mt-2 h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STAGES.map((s) => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Next follow-up</div>
                <div className="mt-2 flex items-center gap-1 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  {deal.next_follow_up ? format(parseISO(deal.next_follow_up), "MMM d, yyyy") : "—"}
                </div>
                <Input
                  type="date"
                  className="mt-2 h-8 text-xs"
                  value={deal.next_follow_up ?? ""}
                  onChange={(e) => followUpMut.mutate(e.target.value)}
                />
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Created</div>
                <div className="mt-2 text-sm">{format(parseISO(deal.created_at), "MMM d, yyyy")}</div>
              </div>
            </div>
          </Card>

          <Card className="p-5 shadow-soft">
            <h2 className="mb-3 flex items-center gap-2 text-base font-semibold">
              <StickyNote className="h-4 w-4 text-primary" /> Notes
            </h2>
            <div className="space-y-2">
              <Textarea
                value={noteBody}
                onChange={(e) => setNoteBody(e.target.value)}
                placeholder="Add a note…"
                rows={3}
              />
              <div className="flex justify-end">
                <Button onClick={() => addNote.mutate()} disabled={!noteBody.trim() || addNote.isPending}>
                  Add note
                </Button>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {notes.length === 0 && <p className="text-sm text-muted-foreground">No notes yet.</p>}
              {notes.map((n) => (
                <div key={n.id} className="rounded-lg border border-border bg-muted/30 p-3">
                  <div className="text-xs text-muted-foreground">
                    {formatDistanceToNow(parseISO(n.created_at), { addSuffix: true })}
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-sm">{n.body}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5 shadow-soft">
            <h2 className="mb-3 flex items-center gap-2 text-base font-semibold">
              <CheckCircle2 className="h-4 w-4 text-primary" /> Tasks
            </h2>
            <div className="grid gap-2 sm:grid-cols-[1fr_180px_auto]">
              <Input value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="What needs doing?" />
              <Input type="date" value={taskDue} onChange={(e) => setTaskDue(e.target.value)} />
              <Button onClick={() => addTask.mutate()} disabled={!taskTitle.trim() || addTask.isPending}>Add</Button>
            </div>
            <ul className="mt-4 divide-y divide-border">
              {tasks.length === 0 && <li className="py-3 text-sm text-muted-foreground">No tasks yet.</li>}
              {tasks.map((t) => {
                const toggle = () =>
                  toggleTask(t).then(() => {
                    qc.invalidateQueries({ queryKey: ["tasks", id] });
                    qc.invalidateQueries({ queryKey: ["tasks", "upcoming"] });
                    qc.invalidateQueries({ queryKey: ["activities", id] });
                  });
                return (
                  <li key={t.id} className="flex items-center gap-3 py-2.5">
                    <button onClick={toggle} aria-label="toggle">
                      {t.completed
                        ? <CheckCircle2 className="h-5 w-5 text-success" />
                        : <Circle className="h-5 w-5 text-muted-foreground" />}
                    </button>
                    <div className="flex-1">
                      <div className={`text-sm ${t.completed ? "text-muted-foreground line-through" : ""}`}>{t.title}</div>
                      {t.due_date && (
                        <div className="text-xs text-muted-foreground">Due {format(parseISO(t.due_date), "MMM d")}</div>
                      )}
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => deleteTask(t.id).then(() => qc.invalidateQueries({ queryKey: ["tasks", id] }))}>
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </li>
                );
              })}
            </ul>
          </Card>

          <Card className="p-5 shadow-soft">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-base font-semibold">
                <Paperclip className="h-4 w-4 text-primary" /> Attachments
              </h2>
              <input
                ref={fileInput}
                type="file"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onUpload(f);
                  e.target.value = "";
                }}
              />
              <Button variant="outline" onClick={() => fileInput.current?.click()} disabled={uploading}>
                <Upload className="h-4 w-4" /> {uploading ? "Uploading…" : "Upload"}
              </Button>
            </div>
            {attachments.length === 0 ? (
              <p className="text-sm text-muted-foreground">No files attached.</p>
            ) : (
              <ul className="grid gap-2 sm:grid-cols-2">
                {attachments.map((a) => (
                  <li key={a.id} className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <a href={a.url ?? "#"} target="_blank" rel="noreferrer" className="block truncate text-sm font-medium hover:underline">
                        {a.filename}
                      </a>
                      <div className="text-xs text-muted-foreground">
                        {a.size ? `${(a.size / 1024).toFixed(1)} KB · ` : ""}
                        {formatDistanceToNow(parseISO(a.created_at), { addSuffix: true })}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        deleteAttachment(a.id).then(() => qc.invalidateQueries({ queryKey: ["attachments", id] }))
                      }
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <Card className="h-fit p-5 shadow-soft">
          <h2 className="mb-4 text-base font-semibold">Activity timeline</h2>
          {activities.length === 0 ? (
            <p className="text-sm text-muted-foreground">No activity yet.</p>
          ) : (
            <ol className="relative space-y-4 border-l border-border pl-5">
              {activities.map((a) => (
                <li key={a.id} className="relative">
                  <span className="absolute -left-[27px] top-1.5 h-3 w-3 rounded-full bg-gradient-primary ring-4 ring-background" />
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">
                    {a.type.replace("_", " ")}
                  </div>
                  <div className="mt-0.5 text-sm">{a.message}</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {formatDistanceToNow(parseISO(a.created_at), { addSuffix: true })}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>
    </>
  );
}
