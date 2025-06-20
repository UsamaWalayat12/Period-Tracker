import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { LogOut, User, Settings, Shield, Bell } from "lucide-react";
import { AccountSettingsDialog } from "@/components/profile/account-settings";
import { NotificationsSettingsDialog } from "@/components/profile/notifications-settings";
import { PreferencesSettingsDialog } from "@/components/profile/preferences-settings";
import { PrivacySettingsDialog } from "@/components/profile/privacy-settings";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { db, COLLECTIONS } from "@/integrations/firebase/config";
import { doc, getDoc } from "firebase/firestore";
import { useTranslation } from "react-i18next";

interface UserProfile {
  displayName?: string;
  email?: string;
  photoURL?: string;
  birthdate?: string;
}

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  
  // State for managing dialog visibility
  const [openDialog, setOpenDialog] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    console.log("Current i18n language:", i18n.language);
    console.log("Translated profile.accountSettings.title:", t("profile.accountSettings.title"));

    const fetchProfile = async () => {
      if (!user) return;
      const ref = doc(db, COLLECTIONS.USER_PROFILES, user.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setProfile(snap.data() as UserProfile);
      } else {
        setProfile(null);
      }
    };
    fetchProfile();
  }, [user, refreshTrigger, i18n.language]); // Add i18n.language to dependencies

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleDialogClose = (open: boolean) => {
    setOpenDialog(open ? "account" : null);
    if (!open) {
      // Trigger a refresh when the dialog is closed
      setRefreshTrigger(prev => prev + 1);
    }
  };

  const displayName = profile?.displayName || user?.displayName || "User";
  const email = profile?.email || user?.email || "";
  const avatarUrl = profile?.photoURL || user?.photoURL || "";
  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);

  return (
    <div className="page-container pb-20">
      <h1 className="section-title text-3xl font-bold">Profile</h1>
      <div className="glass-card p-6 mb-6">
        <div className="flex items-center space-x-4 mb-6">
          <Avatar className="h-16 w-16">
            {avatarUrl ? (
              <AvatarImage src={avatarUrl} alt={displayName} />
            ) : null}
            <AvatarFallback className="text-lg">{getInitials(displayName)}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-xl font-semibold">{displayName}</h2>
            <p className="text-muted-foreground">{email}</p>
          </div>
        </div>
        <div className="space-y-4">
          <ProfileItem 
            icon={<User className="h-5 w-5" />}
            title={t("profile.accountSettings.title")}
            description={t("profile.accountSettings.description")}
            onClick={() => setOpenDialog("account")}
          />
          <ProfileItem 
            icon={<Bell className="h-5 w-5" />}
            title={t("profile.notifications.title")}
            description={t("profile.notifications.description")}
            onClick={() => setOpenDialog("notifications")}
          />
          <ProfileItem 
            icon={<Settings className="h-5 w-5" />}
            title={t("profile.preferences.title")}
            description={t("profile.preferences.description")}
            onClick={() => setOpenDialog("preferences")}
          />
          <ProfileItem 
            icon={<Shield className="h-5 w-5" />}
            title={t("profile.privacySecurity.title")}
            description={t("profile.privacySecurity.description")}
            onClick={() => setOpenDialog("privacy")}
          />
          <div className="pt-4">
            <Button 
              variant="destructive" 
              className="w-full mt-4"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              {t("profile.logout")}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Settings Dialogs */}
      <AccountSettingsDialog 
        open={openDialog === "account"} 
        onOpenChange={handleDialogClose}
      />
      
      <NotificationsSettingsDialog 
        open={openDialog === "notifications"} 
        onOpenChange={(open) => setOpenDialog(open ? "notifications" : null)} 
      />
      
      <PreferencesSettingsDialog 
        open={openDialog === "preferences"} 
        onOpenChange={(open) => setOpenDialog(open ? "preferences" : null)} 
      />
      
      <PrivacySettingsDialog 
        open={openDialog === "privacy"} 
        onOpenChange={(open) => setOpenDialog(open ? "privacy" : null)} 
      />
    </div>
  );
}

function ProfileItem({ 
  icon, 
  title, 
  description,
  onClick
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
  onClick: () => void;
}) {
  return (
    <div 
      className="flex items-center space-x-4 p-4 rounded-lg bg-background/50 hover:bg-accent/50 transition-colors cursor-pointer"
      onClick={onClick}
    >
      <div className="text-primary">{icon}</div>
      <div>
        <h3 className="font-medium">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
