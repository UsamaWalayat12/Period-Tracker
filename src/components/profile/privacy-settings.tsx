import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, Download, KeyRound, Lock, Save, Shield, Trash } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/integrations/firebase/config";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { format } from 'date-fns';
import { ChangePasswordDialog } from './ChangePasswordDialog';

interface PrivacySettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DEFAULT_PRIVACY = {
  dataSharing: "anonymous",
  locationTracking: false,
  analytics: true,
  advertisingId: false,
  encryption: true,
  biometricAuth: false,
  autoLock: true
};

export function PrivacySettingsDialog({ open, onOpenChange }: PrivacySettingsDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [privacySettings, setPrivacySettings] = useState(DEFAULT_PRIVACY);
  const [isChangePasswordDialogOpen, setIsChangePasswordDialogOpen] = useState(false);

  // Load privacy settings from Firestore on open
  useEffect(() => {
    if (!user || !open) return;
    const fetchPrivacy = async () => {
      const ref = doc(db, "user_privacy", user.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setPrivacySettings({ ...DEFAULT_PRIVACY, ...snap.data() });
      } else {
        setPrivacySettings(DEFAULT_PRIVACY);
      }
    };
    fetchPrivacy();
  }, [user, open]);

  const updateSetting = <K extends keyof typeof DEFAULT_PRIVACY>(key: K, value: typeof DEFAULT_PRIVACY[K]) => {
    setPrivacySettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      await setDoc(doc(db, "user_privacy", user.uid), privacySettings, { merge: true });
      toast({
        title: "Privacy settings updated",
        description: "Your privacy and security settings have been saved",
        variant: "default"
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Update failed",
        description: "Failed to update privacy settings. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadData = () => {
    if (!user) {
      toast({ title: "Error", description: "User not logged in.", variant: "destructive" });
      return;
    }
    try {
      // Simulate fetching user data from a mock source or current settings
      const userData = {
        userId: user.uid,
        privacySettings: privacySettings,
        // In a real app, you would fetch all user data from Firestore/backend
        mockData: "This is a placeholder for your actual health data.",
        timestamp: new Date().toISOString(),
      };
      const filename = `user_data_${user.uid}_${format(new Date(), 'yyyyMMdd_HHmmss')}.json`;
      const jsonString = JSON.stringify(userData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const href = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = href;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(href); // Clean up the URL object
  
      toast({
        title: "Data Download Initiated",
        description: "Your privacy settings (as a demo) are being downloaded.",
        variant: "default",
      });
    } catch (error) {
      console.error("Error downloading data:", error);
      toast({
        title: "Download Failed",
        description: "Could not initiate data download. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteData = () => {
    if (!user) {
      toast({ title: "Error", description: "User not logged in.", variant: "destructive" });
      return;
    }
    if (window.confirm("Are you sure you want to delete all your data? This action cannot be undone.")) {
      console.log(`[SIMULATED] Deleting all data for user: ${user.uid}`);
      toast({
        title: "Data Deletion Initiated (Simulated)",
        description: "Your data deletion process has been simulated. Actual deletion requires backend implementation to remove data from Firestore.",
        variant: "destructive",
      });
      // TODO: In a real application, you would trigger a Firebase Cloud Function here:
      // await firebase.functions().httpsCallable('deleteAllUserData')({ userId: user.uid });
      // And then potentially sign out the user:
      // await firebase.auth().signOut();
    } else {
      toast({
        title: "Deletion Cancelled",
        description: "Your data was not deleted.",
        variant: "default",
      });
    }
  };

  const handleChangePassword = () => {
    setIsChangePasswordDialogOpen(true);
  };

  const handleTwoFactorAuth = () => {
    toast({
      title: "Two-Factor Authentication (2FA)",
      description: "Setting up 2FA requires a multi-step user flow and backend integration (e.g., with Firebase Authentication or a custom solution). This is a frontend placeholder.",
      variant: "default",
    });
    // TODO: Implement actual 2FA setup flow
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Privacy & Security</DialogTitle>
          <DialogDescription>
            Manage your data and privacy settings
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="privacy" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="privacy">Privacy</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>
          <TabsContent value="privacy" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Data Collection</CardTitle>
                <CardDescription>Control how your data is collected and used</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                <div className="space-y-2">
                  <Label>Anonymous Data Sharing</Label>
                  <RadioGroup 
                    value={privacySettings.dataSharing} 
                    onValueChange={(value) => updateSetting('dataSharing', value)}
                  >
                    <div className="flex items-center space-x-2 py-1">
                      <RadioGroupItem value="full" id="data-full" />
                      <Label htmlFor="data-full">Full data sharing</Label>
                    </div>
                    <div className="flex items-center space-x-2 py-1">
                      <RadioGroupItem value="anonymous" id="data-anonymous" />
                      <Label htmlFor="data-anonymous">Anonymous data only</Label>
                    </div>
                    <div className="flex items-center space-x-2 py-1">
                      <RadioGroupItem value="none" id="data-none" />
                      <Label htmlFor="data-none">Don\'t share any data</Label>
                    </div>
                  </RadioGroup>
                  <p className="text-xs text-muted-foreground mt-1">
                    Anonymous data helps us improve the app and provide more accurate predictions.
                  </p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="analytics">Usage Analytics</Label>
                    <p className="text-xs text-muted-foreground">Collect anonymous usage statistics</p>
                  </div>
                  <Switch 
                    id="analytics"
                    checked={privacySettings.analytics}
                    onCheckedChange={(checked) => updateSetting('analytics', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="locationTracking">Location Tracking</Label>
                    <p className="text-xs text-muted-foreground">Allow app to access your location</p>
                  </div>
                  <Switch 
                    id="locationTracking"
                    checked={privacySettings.locationTracking}
                    onCheckedChange={(checked) => updateSetting('locationTracking', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="advertisingId">Advertising ID</Label>
                    <p className="text-xs text-muted-foreground">Allow use of advertising ID for personalized ads</p>
                  </div>
                  <Switch 
                    id="advertisingId"
                    checked={privacySettings.advertisingId}
                    onCheckedChange={(checked) => updateSetting('advertisingId', checked)}
                  />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Data Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                <Button variant="outline" size="sm" className="w-full flex items-center gap-2" onClick={handleDownloadData}>
                  <Download className="h-4 w-4" />
                  Download My Data
                </Button>
                
                <Button variant="outline" size="sm" className="w-full flex items-center gap-2 text-destructive hover:text-destructive" onClick={handleDeleteData}>
                  <Trash className="h-4 w-4" />
                  Delete All My Data
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Security Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="encryption">Data Encryption</Label>
                    <p className="text-xs text-muted-foreground">Encrypt all sensitive health data</p>
                  </div>
                  <Switch 
                    id="encryption"
                    checked={privacySettings.encryption}
                    onCheckedChange={(checked) => updateSetting('encryption', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="biometric">Biometric Authentication</Label>
                    <p className="text-xs text-muted-foreground">Use fingerprint or face ID to log in</p>
                  </div>
                  <Switch 
                    id="biometric"
                    checked={privacySettings.biometricAuth}
                    onCheckedChange={(checked) => updateSetting('biometricAuth', checked)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="autoLock">Auto-Lock</Label>
                    <p className="text-xs text-muted-foreground">Automatically lock the app after inactivity</p>
                  </div>
                  <Switch 
                    id="autoLock"
                    checked={privacySettings.autoLock}
                    onCheckedChange={(checked) => updateSetting('autoLock', checked)}
                  />
                </div>
                
                <Button variant="outline" size="sm" className="w-full flex items-center gap-2" onClick={handleChangePassword}>
                  <KeyRound className="h-4 w-4" />
                  Change Password
                </Button>
                
                <Button variant="outline" size="sm" className="w-full flex items-center gap-2" onClick={handleTwoFactorAuth}>
                  <Shield className="h-4 w-4" />
                  Two-Factor Authentication
                </Button>
              </CardContent>
            </Card>
            
            <Alert variant="destructive" className="bg-destructive/10 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Security Notice</AlertTitle>
              <AlertDescription>
                We never share your health data with third parties without your explicit consent.
              </AlertDescription>
            </Alert>
            
            <Alert>
              <Lock className="h-4 w-4" />
              <AlertTitle>End-to-End Encryption</AlertTitle>
              <AlertDescription>
                Your sensitive health data is encrypted on your device before being sent to our servers.
              </AlertDescription>
            </Alert>
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
      {isChangePasswordDialogOpen && (
        <ChangePasswordDialog
          open={isChangePasswordDialogOpen}
          onOpenChange={setIsChangePasswordDialogOpen}
        />
      )}
    </Dialog>
  );
}
