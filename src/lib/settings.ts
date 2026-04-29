export interface AppSettings {
  siteName: string;
  tagline: string;
  userName: string;
  userEmail: string;
  userRole: string;
  defaultStage: string;
  weekStart: "sunday" | "monday";
  remindersEnabled: boolean;
  density: "comfortable" | "compact";
}

const KEY = "loop-crm-settings";

export const DEFAULT_SETTINGS: AppSettings = {
  siteName: "Loop CRM",
  tagline: "Your pipeline, in one loop.",
  userName: "",
  userEmail: "",
  userRole: "Account Executive",
  defaultStage: "lead",
  weekStart: "monday",
  remindersEnabled: true,
  density: "comfortable",
};

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(s: AppSettings) {
  localStorage.setItem(KEY, JSON.stringify(s));
  window.dispatchEvent(new CustomEvent("settings:updated", { detail: s }));
}
