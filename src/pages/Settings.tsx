import { useState } from "react";
import { toast } from "sonner";
import { Save, User, Globe, SlidersHorizontal, Bell } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { DEFAULT_SETTINGS, loadSettings, saveSettings, type AppSettings } from "@/lib/settings";
import { STAGES } from "@/lib/types";

export default function SettingsPage() {
  const [s, setS] = useState<AppSettings>(() => loadSettings());

  const update = <K extends keyof AppSettings>(k: K, v: AppSettings[K]) =>
    setS((prev) => ({ ...prev, [k]: v }));

  const onSave = () => {
    saveSettings(s);
    toast.success("Settings saved");
  };

  const onReset = () => {
    setS(DEFAULT_SETTINGS);
    saveSettings(DEFAULT_SETTINGS);
    toast.success("Settings reset to defaults");
  };

  return (
    <>
      <PageHeader
        title="Settings"
        description="Manage your workspace, profile, and preferences."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={onReset}>Reset</Button>
            <Button onClick={onSave}><Save className="h-4 w-4" /> Save changes</Button>
          </div>
        }
      />
      <div className="grid max-w-4xl gap-6 px-8 py-6">
        <Card className="p-6 shadow-soft">
          <div className="mb-4 flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary" />
            <h2 className="text-base font-semibold">Workspace</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="siteName">Site name</Label>
              <Input id="siteName" value={s.siteName} onChange={(e) => update("siteName", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="tagline">Tagline</Label>
              <Input id="tagline" value={s.tagline} onChange={(e) => update("tagline", e.target.value)} />
            </div>
          </div>
        </Card>

        <Card className="p-6 shadow-soft">
          <div className="mb-4 flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            <h2 className="text-base font-semibold">Profile</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="userName">Full name</Label>
              <Input id="userName" value={s.userName} onChange={(e) => update("userName", e.target.value)} placeholder="Jane Doe" />
            </div>
            <div>
              <Label htmlFor="userEmail">Email</Label>
              <Input id="userEmail" type="email" value={s.userEmail} onChange={(e) => update("userEmail", e.target.value)} placeholder="jane@company.com" />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="userRole">Role</Label>
              <Input id="userRole" value={s.userRole} onChange={(e) => update("userRole", e.target.value)} />
            </div>
          </div>
        </Card>

        <Card className="p-6 shadow-soft">
          <div className="mb-4 flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-primary" />
            <h2 className="text-base font-semibold">Preferences</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Default deal stage</Label>
              <Select value={s.defaultStage} onValueChange={(v) => update("defaultStage", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STAGES.map((st) => <SelectItem key={st.key} value={st.key}>{st.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Week starts on</Label>
              <Select value={s.weekStart} onValueChange={(v) => update("weekStart", v as AppSettings["weekStart"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sunday">Sunday</SelectItem>
                  <SelectItem value="monday">Monday</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>List density</Label>
              <Select value={s.density} onValueChange={(v) => update("density", v as AppSettings["density"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="comfortable">Comfortable</SelectItem>
                  <SelectItem value="compact">Compact</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        <Card className="p-6 shadow-soft">
          <div className="mb-4 flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            <h2 className="text-base font-semibold">Notifications</h2>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Reminders</div>
              <div className="text-xs text-muted-foreground">Show upcoming tasks and follow-ups on the dashboard.</div>
            </div>
            <Switch checked={s.remindersEnabled} onCheckedChange={(v) => update("remindersEnabled", v)} />
          </div>
        </Card>
      </div>
    </>
  );
}
