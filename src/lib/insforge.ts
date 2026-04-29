import { createClient } from "@insforge/sdk";

const baseUrl = import.meta.env.VITE_INSFORGE_URL as string;
const anonKey = import.meta.env.VITE_INSFORGE_ANON_KEY as string;

export const insforge = createClient({ baseUrl, anonKey });

export const ATTACHMENTS_BUCKET = "attachments";
