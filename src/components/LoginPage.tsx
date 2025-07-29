import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "./AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Lock, Stethoscope, ChevronDown, FileText, MessageSquare } from "lucide-react";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [accessRequestEmail, setAccessRequestEmail] = useState("");
  const [isRequestingAccess, setIsRequestingAccess] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn, profile } = useAuth();

  useEffect(() => {
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
        case "pharmacy":
          navigate("/pharmacy-dashboard");
          break;
      }
    }
  }, [profile, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive",
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
          variant: "destructive",
        });
      } else {
        toast({
          title: "Login Successful",
          description: "Welcome back!",
        });
      }
    } catch {
      toast({
        title: "Login Failed",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccessRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!accessRequestEmail) {
      toast({
        title: "Missing Information",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    setIsRequestingAccess(true);

    try {
      const { error } = await supabase.functions.invoke('send-access-request', {
        body: { email: accessRequestEmail }
      });

      if (error) {
        toast({
          title: "Request Failed",
          description: "Failed to send access request. Please try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Request Submitted",
          description: "Your access request has been sent successfully. We'll get back to you soon!",
        });
        setAccessRequestEmail("");
      }
    } catch {
      toast({
        title: "Request Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRequestingAccess(false);
    }
  };

  if (profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg animate-fade-in">
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Redirecting...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute top-4 right-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              App Testers, Click Here
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-background border border-border">
            <DropdownMenuItem 
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => window.open('https://drive.google.com/file/d/1ruIOufRf8nvxLS_FytqN76aqkc-H0MxW/view?usp=sharing', '_blank')}
            >
              <FileText className="h-4 w-4" />
              Docs
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => window.open('https://tally.so/r/3j8AoY', '_blank')}
            >
              <MessageSquare className="h-4 w-4" />
              Feedback Form
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <Card className="w-full max-w-md shadow-xl rounded-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary flex items-center justify-center">
            <Stethoscope className="h-8 w-8 text-primary-foreground" />
          </div>
          <CardTitle
  className="text-3xl font-bold"
  style={{ color: '#C6F91F', fontFamily: '"Inter", sans-serif' }}
>
  NCare Nigeria
</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Enhancing Service Delivery In Nigerian Hospitals
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  className="pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  className="pl-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground text-center mb-3">
              Don't have access yet?
            </p>
            <form onSubmit={handleAccessRequest} className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="accessEmail">Request Access</Label>
                <Input
                  id="accessEmail"
                  type="email"
                  placeholder="Enter your email to request access"
                  value={accessRequestEmail}
                  onChange={(e) => setAccessRequestEmail(e.target.value)}
                  required
                />
              </div>
              <Button
                type="submit"
                variant="outline"
                className="w-full"
                disabled={isRequestingAccess}
              >
                {isRequestingAccess ? "Sending Request..." : "Request Access"}
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
