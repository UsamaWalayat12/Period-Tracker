import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Calendar, Clock, Save } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/integrations/firebase/config";
import { doc, getDoc, setDoc, collection, addDoc } from "firebase/firestore";
import { Input } from "@/components/ui/input";

interface NotificationsSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DEFAULT_SETTINGS = {
  push: false,
  inApp: true,
  reminderTime: "08:00",
  periodReminders: true,
  symptomReminders: true,
};

export function NotificationsSettingsDialog({ open, onOpenChange }: NotificationsSettingsDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [pushPermission, setPushPermission] = useState<NotificationPermission | null>(null);

  // Load settings from Firestore on open
  useEffect(() => {
    if (!user || !open) return;
    const fetchSettings = async () => {
      const ref = doc(db, "user_notifications", user.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setSettings({ ...DEFAULT_SETTINGS, ...snap.data() });
      } else {
        setSettings(DEFAULT_SETTINGS);
      }
    };
    fetchSettings();
  }, [user, open]);

  // Check push notification permission
  useEffect(() => {
    if ("Notification" in window) {
      setPushPermission(Notification.permission);
    }
  }, []);

  const updateSetting = <K extends keyof typeof DEFAULT_SETTINGS>(key: K, value: typeof DEFAULT_SETTINGS[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      await setDoc(doc(db, "user_notifications", user.uid), settings, { merge: true });
      toast({
        title: "Notification settings updated",
        description: "Your notification preferences have been saved",
        variant: "default"
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Update failed",
        description: "Failed to update notification settings. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestPushPermission = async () => {
    if ("Notification" in window && Notification.permission !== "granted") {
      const permission = await Notification.requestPermission();
      setPushPermission(permission);
      if (permission === "granted") {
        toast({ title: "Push enabled", description: "You will receive browser notifications." });
      } else {
        toast({ title: "Push denied", description: "You denied browser notification permission.", variant: "destructive" });
      }
    }
  };

  const handleTestPush = () => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("Test Notification", { body: "This is a test push notification." });
    } else {
      toast({ title: "Push not enabled", description: "Please enable push notifications first.", variant: "destructive" });
    }
  };

  const handleTestInApp = async () => {
    if (!user) return;
    try {
      await addDoc(collection(db, "notifications"), {
        type: "in-app",
        userId: user.uid,
        title: "Test In-App Notification",
        message: "This is a test in-app notification from your app.",
        status: "pending",
        read: false,
        createdAt: new Date().toISOString(),
      });
      toast({ title: "Test in-app notification triggered", description: "A test in-app notification has been added to your notification center." });
    } catch (error) {
      console.error("In-app notification test error:", error);
      toast({
        title: "Failed to trigger in-app notification",
        description: error instanceof Error ? error.message : "Please try again later",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] md:max-w-[700px] h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Notification Settings</DialogTitle>
          <DialogDescription>
            Configure your notification preferences
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label>Push Notifications</Label>
            <Switch
              checked={settings.push}
              onCheckedChange={v => {
                updateSetting('push', v);
                if (v && pushPermission !== "granted") handleRequestPushPermission();
              }}
            />
            <div className="flex items-center gap-2 mt-1">
              <Button size="sm" variant="outline" onClick={handleRequestPushPermission} disabled={pushPermission === "granted"}>
                {pushPermission === "granted" ? "Enabled" : "Enable Push"}
              </Button>
            </div>
            <div className="text-xs text-muted-foreground">Push notifications require browser permission. This is a demo using the browser Notification API.</div>
          </div>
          <div className="space-y-2">
            <Label>In-App Notifications</Label>
            <Switch
              checked={settings.inApp}
              onCheckedChange={v => updateSetting('inApp', v)}
            />
            <div className="text-xs text-muted-foreground">In-app notifications are displayed directly within the application.</div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reminderTime">Reminder Time</Label>
            <div className="flex items-center gap-2 mt-1">
              <Input
                type="time"
                value={settings.reminderTime}
                onChange={e => updateSetting('reminderTime', e.target.value)}
                className="w-32"
              />
              <Button size="icon" variant="outline" onClick={() => { /* Implement time picker or reminder trigger */ }}>
                <Clock className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Period Reminders</Label>
            <Switch
              checked={settings.periodReminders}
              onCheckedChange={v => updateSetting('periodReminders', v)}
            />
          </div>
          <div className="space-y-2">
            <Label>Symptom Reminders</Label>
            <Switch
              checked={settings.symptomReminders}
              onCheckedChange={v => updateSetting('symptomReminders', v)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
