import { NavLink, Outlet } from "react-router-dom";
import { Building2, Contact2, KanbanSquare, LayoutDashboard, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/pipeline", label: "Pipeline", icon: KanbanSquare },
  { to: "/contacts", label: "Contacts", icon: Contact2 },
  { to: "/companies", label: "Companies", icon: Building2 },
  { to: "/reminders", label: "Reminders", icon: Bell },
];

export default function AppLayout() {
  return (
    <div className="grid min-h-screen grid-cols-[240px_1fr] bg-gradient-subtle">
      <aside className="sticky top-0 h-screen border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
        <div className="flex h-16 items-center gap-2 px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary text-primary-foreground font-bold">
            L
          </div>
          <span className="text-lg font-semibold tracking-tight">Loop CRM</span>
        </div>
        <nav className="px-3 py-2">
          {nav.map(({ to, label, icon: Icon, end }) => (
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
        </nav>
      </aside>
      <main className="min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
