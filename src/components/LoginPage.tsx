import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "./AuthProvider";
import { supabase } from "@/integrations/supabase/client";

type UserRole = "doctor" | "nurse" | "finance";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showDemoAccounts, setShowDemoAccounts] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn, profile } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        toast({
          title: "Login Failed",
          description: error.message || "Invalid credentials. Please try again.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Login Successful",
          description: "Welcome back!"
        });
      }
    } catch (error) {
      toast({
        title: "Login Failed",
        description: "An unexpected error occurred.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithDemo = async (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setIsLoading(true);
    
    try {
      const { error } = await signIn(demoEmail, demoPassword);
      
      if (error) {
        toast({
          title: "Demo Login Failed",
          description: error.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Demo Login Failed",
        description: "An unexpected error occurred.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createAdminAccount = async () => {
    setIsLoading(true);
    
    try {
      // Create admin user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: "admin@demo.com",
        password: "password321",
        options: {
          data: {
            username: "admin@demo.com",
            role: "admin"
          }
        }
      });

      if (authError) {
        toast({
          title: "Admin Account Creation Failed",
          description: authError.message,
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Admin Account Created",
        description: "Admin account created successfully! You can now login with admin@demo.com / password321",
      });
      
      setShowAdminLogin(true);
    } catch (error) {
      toast({
        title: "Admin Account Creation Failed",
        description: "An unexpected error occurred.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Redirect if already logged in and profile is loaded
  if (profile) {
    switch (profile.role) {
      case "doctor":
        navigate("/doctor-dashboard");
        break;
      case "nurse":
        navigate("/nurse-dashboard");
        break;
      case "finance":
        navigate("/finance-dashboard");
        break;
      case "admin":
        navigate("/admin-dashboard");
        break;
    }
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary flex items-center justify-center">
            <svg className="h-6 w-6 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 2C5.58 2 2 5.58 2 10s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zM8 12H6v-2h2v2zm0-3H6V7h2v2zm4 3h-2v-2h2v2zm0-3h-2V7h2v2z" clipRule="evenodd" />
            </svg>
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">Hospital Management</CardTitle>
          <CardDescription className="text-muted-foreground">
            Secure access for medical professionals
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
          
          <div className="mt-4 space-y-2">
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => setShowDemoAccounts(!showDemoAccounts)}
            >
              {showDemoAccounts ? "Hide" : "Show"} Demo Accounts
            </Button>
            
            {showDemoAccounts && (
              <div className="space-y-2 p-3 bg-muted rounded-md">
                <p className="text-sm font-medium">Demo Accounts:</p>
                <div className="space-y-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => loginWithDemo("nurse@demo.com", "password123")}
                  >
                    Nurse: nurse@demo.com / password123
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => loginWithDemo("doctor@demo.com", "password123")}
                  >
                    Doctor: doctor@demo.com / password123
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => loginWithDemo("finance@demo.com", "password123")}
                  >
                    Finance: finance@demo.com / password123
                  </Button>
                  {showAdminLogin && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => loginWithDemo("admin@demo.com", "password321")}
                    >
                      Admin: admin@demo.com / password321
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Admin Access Button */}
      <Button
        variant="ghost"
        size="sm"
        className="fixed bottom-4 right-4 text-xs text-muted-foreground hover:text-foreground"
        onClick={() => setShowAdminLogin(!showAdminLogin)}
      >
        Admin?
      </Button>
      
      {/* Admin Setup Dialog */}
      {showAdminLogin && !showDemoAccounts && (
        <Card className="fixed bottom-16 right-4 w-80 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Admin Access</CardTitle>
            <CardDescription className="text-sm">
              Create or login with admin account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={createAdminAccount}
              disabled={isLoading}
            >
              Create Admin Account
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={() => loginWithDemo("admin@demo.com", "password321")}
            >
              Login: admin@demo.com / password321
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LoginPage;