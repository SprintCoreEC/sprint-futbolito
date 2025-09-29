import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DynamicTheme } from "@/components/dynamic-theme";
import { useAuth } from "@/lib/auth";
import { useEffect } from "react";

// Pages
import Dashboard from "@/pages/dashboard";
import Login from "@/pages/login";
import Institutions from "@/pages/institutions";
import Venues from "@/pages/venues";
import Groups from "@/pages/groups";
import Athletes from "@/pages/athletes";
import Events from "@/pages/events";
import Publications from "@/pages/publications";
import Notifications from "@/pages/notifications";
import Attendance from "@/pages/attendance";
import AuthCallback from "@/pages/auth/callback";
import UserManagement from "@/pages/user-management";
import RoleManagement from "@/pages/role-management";
import InstitutionDashboard from "@/pages/institution-dashboard";
import SystemConfig from "@/pages/system-config";
import SystemReports from "@/pages/system-reports";
import NotFound from "@/pages/not-found";

// Protected Route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    window.location.href = "/login";
    return null;
  }

  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      <Route path="/auth/callback" component={AuthCallback} />
      <Route path="/" component={() => <ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/dashboard" component={() => <ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/institutions" component={() => <ProtectedRoute><Institutions /></ProtectedRoute>} />
      <Route path="/venues" component={() => <ProtectedRoute><Venues /></ProtectedRoute>} />
      <Route path="/groups" component={() => <ProtectedRoute><Groups /></ProtectedRoute>} />
      <Route path="/athletes" component={() => <ProtectedRoute><Athletes /></ProtectedRoute>} />
      <Route path="/events" component={() => <ProtectedRoute><Events /></ProtectedRoute>} />
      <Route path="/publications" component={() => <ProtectedRoute><Publications /></ProtectedRoute>} />
      <Route path="/notifications" component={() => <ProtectedRoute><Notifications /></ProtectedRoute>} />
      <Route path="/attendance" component={() => <ProtectedRoute><Attendance /></ProtectedRoute>} />
      <Route path="/institution/:id/dashboard" component={() => <ProtectedRoute><InstitutionDashboard /></ProtectedRoute>} />
      <Route path="/user-management" component={() => <ProtectedRoute><UserManagement /></ProtectedRoute>} />
      <Route path="/role-management" component={() => <ProtectedRoute><RoleManagement /></ProtectedRoute>} />
      <Route path="/system-config" component={() => <ProtectedRoute><SystemConfig /></ProtectedRoute>} />
      <Route path="/system-reports" component={() => <ProtectedRoute><SystemReports /></ProtectedRoute>} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const { initialize } = useAuth();

  // Initialize auth and dark mode
  useEffect(() => {
    // Initialize Supabase auth
    initialize();

    // Initialize dark mode from localStorage
    if (localStorage.getItem('darkMode') === 'true') {
      document.documentElement.classList.add('dark');
    }
  }, [initialize]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
