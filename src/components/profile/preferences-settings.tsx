import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BrainCircuit, Calendar, Globe, Languages, MoonStar, Palette, Save, Sun } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/integrations/firebase/config";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useAppPreferences, ThemeType, LanguageType } from "@/contexts/AppPreferencesContext";
import { useTranslation } from "react-i18next";

interface PreferencesSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface PreferencesState {
  theme: ThemeType;
  language: LanguageType;
  compactView: boolean;
  trackingOption1: boolean;
  trackingOption2: boolean;
}

const DEFAULT_PREFERENCES: PreferencesState = {
  theme: "system",
  language: "en",
  compactView: false,
  trackingOption1: false,
  trackingOption2: false,
};

export function PreferencesSettingsDialog({ open, onOpenChange }: PreferencesSettingsDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [preferences, setPreferences] = useState<PreferencesState>(DEFAULT_PREFERENCES);
  const { setTheme, setLanguage, setCompactView } = useAppPreferences();
  const { t, i18n } = useTranslation();

  // Load preferences from Firestore on open
  useEffect(() => {
    if (!user || !open) return;
    const fetchPreferences = async () => {
      const ref = doc(db, "user_preferences", user.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setPreferences({ ...DEFAULT_PREFERENCES, ...snap.data() as PreferencesState });
      } else {
        setPreferences(DEFAULT_PREFERENCES);
      }
    };
    fetchPreferences();
  }, [user, open]);

  const updatePreference = <K extends keyof PreferencesState>(key: K, value: PreferencesState[K]) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
    if (key === 'language') {
      i18n.changeLanguage(value as LanguageType);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: t("common.notLoggedIn"),
        description: t("common.mustBeLoggedIn"),
        variant: "destructive"
      });
      return;
    }
    setIsSubmitting(true);
    try {
      console.log("Saving preferences for user:", user.uid, preferences);
      await setDoc(doc(db, "user_preferences", user.uid), preferences, { merge: true });
      // Update global context so UI responds immediately
      setTheme(preferences.theme);
      setLanguage(preferences.language);
      setCompactView(preferences.compactView);
      toast({
        title: t("common.preferencesUpdated"),
        description: t("common.preferencesSaved"),
        variant: "default"
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast({
        title: t("common.updateFailed"),
        description: t("common.tryAgain"),
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>{t("appPreferences.title")}</DialogTitle>
          <DialogDescription>
            {t("appPreferences.description")}
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="appearance" className="w-full">
          <TabsList className="grid w-full grid-cols-1 mb-4">
            <TabsTrigger value="appearance">{t("appPreferences.appearanceTab")}</TabsTrigger>
          </TabsList>
          <TabsContent value="appearance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("appPreferences.displaySection")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                <div className="space-y-2">
                  <Label>{t("appPreferences.theme.label")}</Label>
                  <RadioGroup 
                    value={preferences.theme} 
                    onValueChange={(value: ThemeType) => updatePreference('theme', value)}
                    className="flex gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="light" id="theme-light" />
                      <Label htmlFor="theme-light" className="flex items-center gap-1">
                        <Sun className="h-4 w-4" /> {t("appPreferences.theme.light")}
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="dark" id="theme-dark" />
                      <Label htmlFor="theme-dark" className="flex items-center gap-1">
                        <MoonStar className="h-4 w-4" /> {t("appPreferences.theme.dark")}
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">{t("appPreferences.language.label")}</Label>
                  <Select 
                    value={preferences.language}
                    onValueChange={(value) => updatePreference('language', value as LanguageType)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t("appPreferences.language.selectLanguage")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">{t("appPreferences.language.english")}</SelectItem>
                      <SelectItem value="es">{t("appPreferences.language.spanish")}</SelectItem>
                      <SelectItem value="fr">{t("appPreferences.language.french")}</SelectItem>
                      <SelectItem value="de">{t("appPreferences.language.german")}</SelectItem>
                      <SelectItem value="pt">{t("appPreferences.language.portuguese")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="compact-view">Compact View</Label>
                    <p className="text-xs text-muted-foreground">Use a more compact layout for all screens</p>
                  </div>
                  <Switch 
                    id="compact-view"
                    checked={preferences.compactView}
                    onCheckedChange={(checked) => updatePreference('compactView', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button 
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? t("common.saving") : t("common.saveChanges")}
            <Save className="w-4 h-4 ml-2" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
