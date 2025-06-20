import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    // Debug log to verify the email and password being sent
    console.log("Login attempt with email:", email);

    try {
      // Make sure to trim whitespace from both email and password
      const trimmedEmail = email.trim().toLowerCase(); // Convert to lowercase to ensure consistency
      const trimmedPassword = password.trim();

      const { error } = await login(trimmedEmail, trimmedPassword);
      
      if (error) {
        console.log("Login error details:", error);
        
        if (error.message.includes("Invalid login credentials")) {
          setErrorMessage(
            "Login failed. Please verify that:\n" +
            "1. Your email is correct\n" +
            "2. Your password is correct\n" +
            "3. You have already signed up for an account"
          );
        } else if (error.message.includes("Email not confirmed")) {
          setErrorMessage("Please confirm your email before logging in. Check your inbox for a confirmation link.");
        } else {
          setErrorMessage(error.message || "Login failed. Please try again.");
        }
        
        toast({
          title: "Login failed",
          description: "Please check the error message below",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Login successful",
          description: "Welcome back to Luna!",
        });
        navigate("/");
      }
    } catch (error) {
      console.error("Unexpected login error:", error);
      setErrorMessage("An unexpected error occurred. Please try again.");
      toast({
        title: "Login failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-container max-w-md mx-auto p-4 sm:p-8">
      <div className="glass-card w-full max-w-md p-8 space-y-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary">Welcome to Luna</h1>
          <p className="text-muted-foreground mt-2">Your personal period tracker</p>
        </div>

        {errorMessage && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
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
                placeholder="Enter your password"
                type={showPassword ? "text" : "password"}
                autoCapitalize="none"
                autoComplete="current-password"
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
          <Button className="w-full" type="submit" disabled={isLoading}>
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Logging in...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <LogIn className="h-4 w-4" />
                Login
              </span>
            )}
          </Button>
        </form>
        
        <div className="mt-6 text-center text-sm">
          <p className="text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/signup" className="font-medium text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
