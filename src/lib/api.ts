import { insforge } from "./insforge";
import type { Activity, Attachment, Company, Contact, Deal, Note, Task } from "./types";

function unwrap<T>(res: { data: T | null; error: unknown }): T {
  if (res.error) throw res.error;
  return res.data as T;
}

// Companies
export const listCompanies = async () =>
  unwrap<Company[]>(await insforge.database.from("companies").select("*").order("name"));

export const createCompany = async (input: Partial<Company>) =>
  unwrap<Company[]>(await insforge.database.from("companies").insert(input).select())[0];

export const deleteCompany = async (id: string) =>
  unwrap(await insforge.database.from("companies").delete().eq("id", id));

// Contacts
export const listContacts = async () =>
  unwrap<Contact[]>(
    await insforge.database.from("contacts").select("*").order("created_at", { ascending: false })
  );

export const createContact = async (input: Partial<Contact>) =>
  unwrap<Contact[]>(await insforge.database.from("contacts").insert(input).select())[0];

export const updateContact = async (id: string, input: Partial<Contact>) =>
  unwrap<Contact[]>(await insforge.database.from("contacts").update(input).eq("id", id).select())[0];

export const deleteContact = async (id: string) =>
  unwrap(await insforge.database.from("contacts").delete().eq("id", id));

// Deals
export const listDeals = async () =>
  unwrap<Deal[]>(
    await insforge.database.from("deals").select("*").order("updated_at", { ascending: false })
  );

export const getDeal = async (id: string) =>
  unwrap<Deal[]>(await insforge.database.from("deals").select("*").eq("id", id).limit(1))[0];

export const createDeal = async (input: Partial<Deal>) => {
  const deal = unwrap<Deal[]>(await insforge.database.from("deals").insert(input).select())[0];
  await logActivity(deal.id, "created", `Deal "${deal.title}" created`);
  return deal;
};

export const updateDealStage = async (deal: Deal, newStage: string) => {
  if (deal.stage === newStage) return deal;
  const updated = unwrap<Deal[]>(
    await insforge.database
      .from("deals")
      .update({ stage: newStage, updated_at: new Date().toISOString() })
      .eq("id", deal.id)
      .select()
  )[0];
  await logActivity(
    deal.id,
    "stage_change",
    `Stage changed from ${deal.stage} to ${newStage}`,
    { from: deal.stage, to: newStage }
  );
  return updated;
};

export const updateDeal = async (id: string, input: Partial<Deal>) =>
  unwrap<Deal[]>(
    await insforge.database
      .from("deals")
      .update({ ...input, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
  )[0];

export const deleteDeal = async (id: string) =>
  unwrap(await insforge.database.from("deals").delete().eq("id", id));

// Notes
export const listNotes = async (dealId: string) =>
  unwrap<Note[]>(
    await insforge.database
      .from("notes")
      .select("*")
      .eq("deal_id", dealId)
      .order("created_at", { ascending: false })
  );

export const createNote = async (dealId: string, body: string) => {
  const note = unwrap<Note[]>(
    await insforge.database.from("notes").insert({ deal_id: dealId, body }).select()
  )[0];
  await logActivity(dealId, "note_added", body.slice(0, 120));
  return note;
};

// Tasks
export const listTasks = async (dealId?: string) => {
  let q = insforge.database.from("tasks").select("*").order("due_date", { ascending: true });
  if (dealId) q = q.eq("deal_id", dealId);
  return unwrap<Task[]>(await q);
};

export const listUpcomingTasks = async () =>
  unwrap<Task[]>(
    await insforge.database
      .from("tasks")
      .select("*")
      .eq("completed", false)
      .order("due_date", { ascending: true })
  );

export const createTask = async (input: Partial<Task>) => {
  const task = unwrap<Task[]>(await insforge.database.from("tasks").insert(input).select())[0];
  if (task.deal_id)
    await logActivity(task.deal_id, "task_added", `Task: ${task.title}`);
  return task;
};

export const toggleTask = async (task: Task) => {
  const updated = unwrap<Task[]>(
    await insforge.database
      .from("tasks")
      .update({ completed: !task.completed })
      .eq("id", task.id)
      .select()
  )[0];
  if (updated.deal_id && updated.completed)
    await logActivity(updated.deal_id, "task_completed", `Completed: ${updated.title}`);
  return updated;
};

export const deleteTask = async (id: string) =>
  unwrap(await insforge.database.from("tasks").delete().eq("id", id));

// Activities
export const listActivities = async (dealId: string) =>
  unwrap<Activity[]>(
    await insforge.database
      .from("activities")
      .select("*")
      .eq("deal_id", dealId)
      .order("created_at", { ascending: false })
  );

export const listAllActivities = async () =>
  unwrap<Activity[]>(
    await insforge.database
      .from("activities")
      .select("*")
      .order("created_at", { ascending: false })
  );

export const listAllNotes = async () =>
  unwrap<Note[]>(
    await insforge.database
      .from("notes")
      .select("*")
      .order("created_at", { ascending: false })
  );

export const deleteNote = async (id: string) =>
  unwrap(await insforge.database.from("notes").delete().eq("id", id));

export const listAllAttachments = async () =>
  unwrap<Attachment[]>(
    await insforge.database
      .from("attachments")
      .select("*")
      .order("created_at", { ascending: false })
  );

export const logActivity = async (
  dealId: string,
  type: Activity["type"],
  message: string,
  meta?: Record<string, unknown>
) =>
  unwrap(
    await insforge.database
      .from("activities")
      .insert({ deal_id: dealId, type, message, meta: meta ?? null })
  );

// Attachments
export const listAttachments = async (dealId: string) =>
  unwrap<Attachment[]>(
    await insforge.database
      .from("attachments")
      .select("*")
      .eq("deal_id", dealId)
      .order("created_at", { ascending: false })
  );

export const createAttachment = async (input: Partial<Attachment>) =>
  unwrap<Attachment[]>(await insforge.database.from("attachments").insert(input).select())[0];

export const deleteAttachment = async (id: string) =>
  unwrap(await insforge.database.from("attachments").delete().eq("id", id));
