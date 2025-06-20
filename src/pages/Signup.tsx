import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Eye, EyeOff, UserPlus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { PregnancyDataDialog } from "@/components/pregnancy-data-dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FirebaseError } from "firebase/app";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPregnancyDialog, setShowPregnancyDialog] = useState(false);
  const [maritalStatus, setMaritalStatus] = useState<'married' | 'unmarried' | null>(null);
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signup, isAuthenticated, isNewUser, setIsNewUser } = useAuth();

  // Show pregnancy dialog when a new user is authenticated
  useEffect(() => {
    if (isAuthenticated && isNewUser) {
      setShowPregnancyDialog(true);
    }
  }, [isAuthenticated, isNewUser]);

  // When pregnancy dialog is closed, redirect to homepage
  const handleDialogOpenChange = (open: boolean) => {
    setShowPregnancyDialog(open);
    if (!open && isAuthenticated) {
      // Reset new user status and navigate to home
      setIsNewUser(false);
      navigate("/");
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match",
        variant: "destructive",
      });
      return;
    }

    if (!maritalStatus) {
      toast({
        title: "Missing Information",
        description: "Please select your marital status.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);

    try {
      const { error } = await signup(email, password, maritalStatus);
      
      if (error) {
        let errorMessage = "There was an error creating your account.";
        if (error instanceof FirebaseError) {
          switch (error.code) {
            case "auth/email-already-in-use":
              errorMessage = "This email is already in use. Please try logging in or use a different email.";
              break;
            case "auth/invalid-email":
              errorMessage = "Please enter a valid email address.";
              break;
            case "auth/weak-password":
              errorMessage = "Password is too weak. Please use at least 6 characters.";
              break;
            default:
              errorMessage = error.message;
          }
        }

        toast({
          title: "Signup failed",
          description: errorMessage,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Account created",
          description: "Welcome to Luna! Please enter your pregnancy information.",
        });
        // PregnancyDataDialog will be shown due to the useEffect above
      }
    } catch (error) {
      console.error("Signup error:", error);
      toast({
        title: "Signup failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="page-container max-w-lg mx-auto p-4 sm:p-8">
        <div className="glass-card w-full max-w-md p-8 space-y-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary">Create an account</h1>
            <p className="text-muted-foreground mt-2">Join Luna and start tracking your cycle</p>
          </div>

          <form onSubmit={handleSignup} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                placeholder="Enter your email"
                type="email"
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect="off"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  placeholder="Create a password"
                  type={showPassword ? "text" : "password"}
                  autoCapitalize="none"
                  autoComplete="new-password"
                  autoCorrect="off"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1 h-8 w-8 text-muted-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  <span className="sr-only">
                    {showPassword ? "Hide password" : "Show password"}
                  </span>
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  placeholder="Confirm your password"
                  type={showPassword ? "text" : "password"}
                  autoCapitalize="none"
                  autoComplete="new-password"
                  autoCorrect="off"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Are you married?</Label>
              <RadioGroup
                onValueChange={(value: 'married' | 'unmarried') => setMaritalStatus(value)}
                value={maritalStatus || ''}
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="married" id="r1" />
                  <Label htmlFor="r1">Married</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="unmarried" id="r2" />
                  <Label htmlFor="r2">Unmarried</Label>
                </div>
              </RadioGroup>
            </div>
            <Button className="w-full" type="submit" disabled={isLoading}>
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Creating account...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Sign up
                </span>
              )}
            </Button>
          </form>
          
          <div className="mt-6 text-center text-sm">
            <p className="text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="font-medium text-primary hover:underline">
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>
      
      {/* Pregnancy Data Dialog for new users */}
      <PregnancyDataDialog 
        open={showPregnancyDialog && maritalStatus === 'married'} 
        onOpenChange={handleDialogOpenChange} 
      />
    </>
  );
}
