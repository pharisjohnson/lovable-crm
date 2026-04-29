export const STAGES = [
  { key: "lead", label: "Lead" },
  { key: "qualified", label: "Qualified" },
  { key: "proposal", label: "Proposal" },
  { key: "negotiation", label: "Negotiation" },
  { key: "won", label: "Won" },
  { key: "lost", label: "Lost" },
] as const;

export type StageKey = (typeof STAGES)[number]["key"];

export const STAGE_LABEL: Record<string, string> = Object.fromEntries(
  STAGES.map((s) => [s.key, s.label])
);

export interface Company {
  id: string;
  name: string;
  website?: string | null;
  industry?: string | null;
  created_at: string;
}

export interface Contact {
  id: string;
  first_name: string;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  title?: string | null;
  company_id?: string | null;
  tags: string[];
  created_at: string;
}

export interface Deal {
  id: string;
  title: string;
  value: number;
  stage: StageKey;
  contact_id?: string | null;
  company_id?: string | null;
  next_follow_up?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Note {
  id: string;
  deal_id: string;
  body: string;
  created_at: string;
}

export interface Task {
  id: string;
  deal_id?: string | null;
  title: string;
  due_date?: string | null;
  completed: boolean;
  created_at: string;
}

export interface Activity {
  id: string;
  deal_id: string;
  type:
    | "created"
    | "stage_change"
    | "note_added"
    | "task_added"
    | "task_completed"
    | "file_uploaded";
  message: string;
  meta?: Record<string, unknown> | null;
  created_at: string;
}

export interface Attachment {
  id: string;
  deal_id: string;
  filename: string;
  object_key: string;
  url?: string | null;
  size?: number | null;
  mime_type?: string | null;
  created_at: string;
}
