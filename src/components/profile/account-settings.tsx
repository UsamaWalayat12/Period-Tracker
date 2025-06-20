import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Separator } from "@/components/ui/separator";
import { Calendar, Check, Pencil, Save, Upload, User } from "lucide-react";
import { updateProfile, updatePassword, reauthenticateWithCredential, EmailAuthProvider, PhoneAuthProvider, multiFactor, PhoneMultiFactorGenerator, RecaptchaVerifier, Auth } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import app, { db, COLLECTIONS, auth } from "@/integrations/firebase/config";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

interface AccountSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AccountSettingsDialog({ open, onOpenChange }: AccountSettingsDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  
  // Use Firebase user fields
  const [name, setName] = useState(user?.displayName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [birthdate, setBirthdate] = useState(""); // Not in Firebase user by default
  const [avatarUrl, setAvatarUrl] = useState(user?.photoURL || "");
  
  const handleSubmit = async () => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      // Update Firebase Auth profile
      await updateProfile(user, {
        displayName: name,
        photoURL: avatarUrl
      });
      // Update Firestore user_profiles
      const userProfileRef = doc(db, COLLECTIONS.USER_PROFILES, user.uid);
      await setDoc(userProfileRef, {
        displayName: name,
        photoURL: avatarUrl,
        email: email,
        birthdate: birthdate
      }, { merge: true });
      toast({
        title: "Profile updated",
        description: "Your account settings have been updated successfully",
        variant: "default"
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Update failed",
        description: "Failed to update your profile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    setIsSubmitting(true); // Indicate submission in progress
    try {
      const formData = new FormData();
      formData.append("image", file);

      // IMPORTANT: Replace 'YOUR_IMGBB_API_KEY' with your actual API key from imgbb.com
      const imgbbApiKey = "fc6f096c417f902de758af63acc37bac"; 

      const response = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbApiKey}`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success && data.data.url) {
        const newPhotoURL = data.data.url;

        // Update Firebase Auth profile
        await updateProfile(user, {
          photoURL: newPhotoURL
        });
        
        // Update Firestore user_profiles
        const userProfileRef = doc(db, COLLECTIONS.USER_PROFILES, user.uid);
        await setDoc(userProfileRef, {
          photoURL: newPhotoURL
        }, { merge: true });
        
        setAvatarUrl(newPhotoURL); // Update the local state
        console.log("New Avatar URL from ImgBB:", newPhotoURL);
        
        toast({
          title: "Avatar uploaded",
          description: "Your profile picture has been updated using ImgBB",
          variant: "default"
        });
      } else {
        throw new Error(data.error?.message || "ImgBB upload failed");
      }
    } catch (error) {
      console.error("Error uploading avatar to ImgBB:", error);
      toast({
        title: "Upload failed",
        description: `Failed to upload avatar: ${(error as Error).message}. Please try again.`,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false); // End submission
    }
  };
  
  const handleChangePassword = async () => {
    if (!user || !user.email) return;
    setPasswordLoading(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      toast({
        title: "Password changed",
        description: "Your password has been updated successfully.",
        variant: "default"
      });
      setShowPasswordDialog(false);
      setCurrentPassword("");
      setNewPassword("");
    } catch (error: unknown) {
      let errorMessage = "Failed to change password. Please try again.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      toast({
        title: "Password change failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setPasswordLoading(false);
    }
  };
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Account Settings</DialogTitle>
            <DialogDescription>
              Update your profile information and account settings
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="flex justify-center">
              <div className="relative">
                <Avatar className="w-24 h-24">
                  {avatarUrl ? (
                    <AvatarImage src={avatarUrl} alt={name} />
                  ) : null}
                  <AvatarFallback className="text-lg">{getInitials(name || "User Profile")}</AvatarFallback>
                </Avatar>
                <Label 
                  htmlFor="avatar-upload" 
                  className="absolute bottom-0 right-0 p-1 bg-primary text-primary-foreground rounded-full cursor-pointer"
                >
                  <Upload className="h-4 w-4" />
                  <Input 
                    id="avatar-upload" 
                    type="file" 
                    accept="image/*"
                    className="sr-only"
                    onChange={handleAvatarUpload}
                  />
                </Label>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={email}
                  disabled
                  placeholder="Your email"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="birthdate">Birthdate</Label>
                <Input
                  id="birthdate"
                  value={birthdate}
                  onChange={(e) => setBirthdate(e.target.value)}
                  placeholder="YYYY-MM-DD"
                />
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <h3 className="font-medium">Account Security</h3>
              <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => setShowPasswordDialog(true)}>
                Change Password
              </Button>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Change Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your current password and a new password to update your account password.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="Current password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="New password"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleChangePassword} disabled={passwordLoading}>
              {passwordLoading ? "Changing..." : "Change Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
