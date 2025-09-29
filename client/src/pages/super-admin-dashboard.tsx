import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { Institution } from "@shared/schema";
import { 
  Building2, 
  Users, 
  TrendingUp, 
  Activity, 
  Calendar,
  FileText,
  Bell,
  MapPin,
  ArrowRight,
  BarChart3,
  PieChart,
  Settings,
  AlertTriangle
} from "lucide-react";
import { useInstitutionContext } from "@/hooks/use-institution-context";
import { useLocation } from "wouter";

export default function SuperAdminDashboard() {
  const { user } = useAuth();
  const { enterInstitution } = useInstitutionContext();
  const [, setLocation] = useLocation();

  // Obtener estadísticas generales del sistema
  const { data: systemStats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/system/stats"],
    enabled: !!user,
  });

  // Obtener todas las instituciones
  const { data: institutions, isLoading: institutionsLoading } = useQuery({
    queryKey: ["/api/institutions"],
    enabled: !!user,
  });

  const handleEnterInstitution = (institution: Institution) => {
    enterInstitution(institution);
    window.location.href = `/institution/${institution.id}/dashboard`;
  };

  const institutionsArray = Array.isArray(institutions?.data) ? institutions.data : [];
  const stats = systemStats?.data || {};
  
  // Handle navigation to different sections
  const handleCreateInstitution = () => {
    setLocation("/institutions");
  };
  
  const handleUserManagement = () => {
    setLocation("/user-management");
  };
  
  const handleSystemReports = () => {
    setLocation("/system-reports");
  };
  
  const handlePlatformSettings = () => {
    setLocation("/system-config");
  };

  if (statsLoading || institutionsLoading) {
    return (
      <MainLayout 
        title="Panel de Control General" 
        subtitle="Gestión estratégica de la plataforma deportiva"
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
      title="Panel de Control General" 
      subtitle="Gestión estratégica de la plataforma deportiva"
    >
      <div className="space-y-8">
        {/* KPI Cards Estratégicos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card data-testid="card-total-institutions">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Instituciones</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalInstitutions || 0}</div>
              <p className="text-xs text-muted-foreground">
                +{Math.floor((stats?.totalInstitutions || 0) * 0.1)} este mes
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-active-institutions">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Instituciones Activas</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.activeInstitutions || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.totalInstitutions > 0 ? ((stats.activeInstitutions / stats.totalInstitutions) * 100).toFixed(1) : '0'}% del total
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-total-users">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usuarios Totales</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
              <p className="text-xs text-muted-foreground">
                +12% desde el mes pasado
              </p>
            </CardContent>
          </Card>

          <Card data-testid="card-platform-growth">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Crecimiento</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+{stats?.growthRate || 0}%</div>
              <p className="text-xs text-muted-foreground">
                Crecimiento mensual promedio
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Grid Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Columna Izquierda - Instituciones */}
          <div className="lg:col-span-2 space-y-8">
            <Card data-testid="card-institutions-overview">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building2 className="w-5 h-5" />
                  <span>Instituciones Registradas</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {institutionsArray.slice(0, 5).map((institution: Institution) => (
                    <div 
                      key={institution.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      data-testid={`institution-item-${institution.id}`}
                    >
                      <div className="flex items-center space-x-4">
                        {institution.logoUrl && (
                          <img 
                            src={institution.logoUrl} 
                            alt={`Logo ${institution.name}`}
                            className="w-10 h-10 object-cover rounded-lg"
                          />
                        )}
                        <div>
                          <h4 className="font-medium">{institution.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {institution.description || "Sin descripción"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge variant={institution.isActive ? "default" : "secondary"}>
                          {institution.isActive ? "Activa" : "Inactiva"}
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEnterInstitution(institution)}
                          className="flex items-center space-x-1"
                          data-testid={`button-enter-${institution.id}`}
                        >
                          <span>Entrar</span>
                          <ArrowRight className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                {institutionsArray.length > 5 && (
                  <div className="mt-4 text-center">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setLocation("/institutions")}
                    >
                      Ver todas las instituciones ({institutionsArray.length})
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Métricas Estratégicas */}
            <Card data-testid="card-strategic-metrics">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5" />
                  <span>Métricas Estratégicas</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {stats?.strategicMetrics?.adoptionRate || 0}%
                    </div>
                    <p className="text-sm text-muted-foreground">Tasa de Adopción</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {stats?.strategicMetrics?.satisfactionRate || 0}%
                    </div>
                    <p className="text-sm text-muted-foreground">Satisfacción</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">
                      {stats?.strategicMetrics?.retentionRate || 0}%
                    </div>
                    <p className="text-sm text-muted-foreground">Retención</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Columna Derecha - Acciones y Resúmenes */}
          <div className="space-y-8">
            {/* Acciones Rápidas Estratégicas */}
            <Card data-testid="card-quick-actions">
              <CardHeader>
                <CardTitle>Acciones Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={handleCreateInstitution}
                  data-testid="button-create-institution"
                >
                  <Building2 className="w-4 h-4 mr-2" />
                  Nueva Institución
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={handleSystemReports}
                  data-testid="button-system-reports"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Reportes del Sistema
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={handlePlatformSettings}
                  data-testid="button-platform-settings"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Configuración Global
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={handleUserManagement}
                  data-testid="button-user-management"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Gestión de Usuarios
                </Button>
              </CardContent>
            </Card>

            {/* Estadísticas por Tipo */}
            <Card data-testid="card-institution-types">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <PieChart className="w-5 h-5" />
                  <span>Distribución</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Clubes Deportivos</span>
                    <Badge variant="outline">
                      {stats?.institutionDistribution?.clubsDeportivos || 0}%
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Academias</span>
                    <Badge variant="outline">
                      {stats?.institutionDistribution?.academias || 0}%
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Centros Educativos</span>
                    <Badge variant="outline">
                      {stats?.institutionDistribution?.centrosEducativos || 0}%
                    </Badge>
                  </div>
                  {stats?.institutionDistribution?.otros > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Otros</span>
                      <Badge variant="outline">
                        {stats?.institutionDistribution?.otros || 0}%
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Alertas del Sistema */}
            <Card data-testid="card-system-alerts">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bell className="w-5 h-5" />
                  <span>Alertas del Sistema</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats?.systemAlerts?.length > 0 ? (
                    stats.systemAlerts.map((alert: any, index: number) => (
                      <div 
                        key={index}
                        className={`flex items-center space-x-3 p-2 border-l-4 rounded ${
                          alert.type === 'warning' 
                            ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950'
                            : alert.type === 'error'
                            ? 'border-red-500 bg-red-50 dark:bg-red-950'
                            : 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                        }`}
                      >
                        {alert.type === 'warning' ? (
                          <Bell className="w-4 h-4 text-yellow-600" />
                        ) : alert.type === 'error' ? (
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                        ) : (
                          <Activity className="w-4 h-4 text-blue-600" />
                        )}
                        <div className="flex-1">
                          <p className="text-sm font-medium">{alert.title}</p>
                          <p className="text-xs text-muted-foreground">{alert.message}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground">No hay alertas del sistema</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}