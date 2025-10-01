import { MainLayout } from "@/components/layout/main-layout";
import { KPICards } from "@/components/dashboard/kpi-cards";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { RecentPublications } from "@/components/dashboard/recent-publications";
import { UpcomingEvents } from "@/components/dashboard/upcoming-events";
import { AttendanceSummary } from "@/components/dashboard/attendance-summary";
import { NotificationCenter } from "@/components/dashboard/notification-center";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { usePermissions } from "@/hooks/use-permissions";
import { useInstitutionContext } from "@/hooks/use-institution-context";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function InstitutionSpecificDashboard() {
  const { user } = useAuth();
  const { hasModuleAccess, hasPermission } = usePermissions();
  const { currentInstitution, exitInstitution } = useInstitutionContext();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    enabled: !!user,
  });

  const defaultStats = {
    totalAthletes: 0,
    averageAttendance: 0,
    upcomingEvents: 0,
    monthlyRevenue: 0
  };

  const dashboardStats = stats || defaultStats;

  const institutionName = currentInstitution?.name || "Institución";

  const handleExitInstitution = () => {
    exitInstitution();
    // Después de salir, redirigir al dashboard principal (que detectará que no hay institución)
    window.location.href = '/dashboard';
  };

  if (statsLoading) {
    return (
      <MainLayout 
        title={`Dashboard - ${institutionName}`} 
        subtitle="Gestión institucional completa"
        customHeader={
          <div className="flex items-center space-x-4">
            {user?.role === 'super_admin' && (
              <Button 
                variant="outline" 
                onClick={handleExitInstitution}
                className="flex items-center space-x-2"
                data-testid="button-exit-institution"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Salir de Institución</span>
              </Button>
            )}
          </div>
        }
      >
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-card rounded-lg border p-6 animate-pulse">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-muted rounded-lg"></div>
                  <div className="ml-5 flex-1">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-6 bg-muted rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout 
      title={`Dashboard - ${institutionName}`} 
      subtitle="Gestión institucional completa"
      customHeader={
        <div className="flex items-center space-x-4">
          {user?.role === 'super_admin' && (
            <Button 
              variant="outline" 
              onClick={handleExitInstitution}
              className="flex items-center space-x-2"
              data-testid="button-exit-institution"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Salir de Institución</span>
            </Button>
          )}
          
          {currentInstitution && (
            <div className="flex items-center space-x-2">
              {currentInstitution.logoUrl && (
                <img 
                  src={currentInstitution.logoUrl} 
                  alt={`Logo ${currentInstitution.name}`}
                  className="w-8 h-8 object-cover rounded"
                />
              )}
              <div>
                <h2 className="text-lg font-semibold">{currentInstitution.name}</h2>
              </div>
            </div>
          )}
        </div>
      }
    >
      <div className="space-y-8">
        {/* KPI Cards Específicos de la Institución */}
        <KPICards stats={dashboardStats} />

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <QuickActions />
            {hasModuleAccess('publicaciones') && <RecentPublications />}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-8">
            {hasModuleAccess('eventos') && <UpcomingEvents />}
            {hasModuleAccess('asistencias') && <AttendanceSummary />}
            {hasModuleAccess('notificaciones') && <NotificationCenter />}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}