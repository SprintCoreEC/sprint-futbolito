import { useEffect } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";

export default function AuthCallback() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Auth callback error:", error);
          setLocation("/login?error=auth_failed");
          return;
        }

        if (data.session) {
          // Store token for API requests
          localStorage.setItem('token', data.session.access_token);
          
          // Redirect to dashboard
          setLocation("/dashboard");
        } else {
          setLocation("/login");
        }
      } catch (error) {
        console.error("Auth callback processing error:", error);
        setLocation("/login?error=callback_failed");
      }
    };

    handleAuthCallback();
  }, [setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Completando inicio de sesión...</p>
      </div>
    </div>
  );
}