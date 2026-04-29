import { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  Activity, Bell, Building2, CheckSquare, Contact2, KanbanSquare,
  LayoutDashboard, Paperclip, Settings, StickyNote,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { loadSettings, type AppSettings } from "@/lib/settings";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/pipeline", label: "Pipeline", icon: KanbanSquare },
  { to: "/contacts", label: "Contacts", icon: Contact2 },
  { to: "/companies", label: "Companies", icon: Building2 },
  { to: "/reminders", label: "Reminders", icon: Bell },
];

const workspace = [
  { to: "/notes", label: "Notes", icon: StickyNote },
  { to: "/tasks", label: "Tasks", icon: CheckSquare },
  { to: "/activities", label: "Activity", icon: Activity },
  { to: "/attachments", label: "Attachments", icon: Paperclip },
];

const system = [
  { to: "/settings", label: "Settings", icon: Settings },
];

export default function AppLayout() {
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  useEffect(() => {
    const handler = (e: Event) => setSettings((e as CustomEvent<AppSettings>).detail);
    window.addEventListener("settings:updated", handler);
    return () => window.removeEventListener("settings:updated", handler);
  }, []);

  const renderGroup = (items: typeof nav, label?: string) => (
    <div className="mb-2">
      {label && (
        <div className="px-3 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
          {label}
        </div>
      )}
      {items.map(({ to, label, icon: Icon, end }: any) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-sidebar-accent text-sidebar-primary"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            )
          }
        >
          <Icon className="h-4 w-4" />
          {label}
        </NavLink>
      ))}
    </div>
  );

  return (
    <div className="grid min-h-screen grid-cols-[240px_1fr] bg-gradient-subtle">
      <aside className="sticky top-0 flex h-screen flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
        <div className="flex h-16 items-center gap-2 px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary text-primary-foreground font-bold">
            {settings.siteName.charAt(0).toUpperCase() || "L"}
          </div>
          <span className="truncate text-lg font-semibold tracking-tight">{settings.siteName}</span>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-2">
          {renderGroup(nav)}
          {renderGroup(workspace, "Workspace")}
          {renderGroup(system, "System")}
        </nav>
      </aside>
      <main className="min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
