import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { 
  BarChart3, 
  Download, 
  Calendar,
  Users,
  Building2,
  TrendingUp,
  FileText,
  Activity
} from "lucide-react";
import { useState } from "react";

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'on-demand';
  lastGenerated?: string;
  fileSize?: string;
}

export default function SystemReports() {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Obtener estadísticas para reportes
  const { data: stats } = useQuery({
    queryKey: ["/api/system/stats"],
    enabled: !!user,
  });

  const reportTemplates: ReportTemplate[] = [
    {
      id: 'institutions-summary',
      name: 'Resumen de Instituciones',
      description: 'Estadísticas generales de todas las instituciones registradas',
      category: 'instituciones',
      frequency: 'monthly',
      lastGenerated: '2025-09-01',
      fileSize: '2.4 MB'
    },
    {
      id: 'users-activity',
      name: 'Actividad de Usuarios',
      description: 'Análisis de actividad y uso de la plataforma por usuarios',
      category: 'usuarios',
      frequency: 'weekly',
      lastGenerated: '2025-09-05',
      fileSize: '1.8 MB'
    },
    {
      id: 'events-analytics',
      name: 'Análisis de Eventos',
      description: 'Métricas de eventos, asistencia y participación',
      category: 'eventos',
      frequency: 'monthly',
      lastGenerated: '2025-09-01',
      fileSize: '3.1 MB'
    },
    {
      id: 'financial-summary',
      name: 'Resumen Financiero',
      description: 'Ingresos, suscripciones y métricas financieras',
      category: 'financiero',
      frequency: 'monthly',
      lastGenerated: '2025-09-01',
      fileSize: '1.2 MB'
    },
    {
      id: 'system-performance',
      name: 'Rendimiento del Sistema',
      description: 'Métricas de rendimiento, errores y uso de recursos',
      category: 'sistema',
      frequency: 'daily',
      lastGenerated: '2025-09-05',
      fileSize: '850 KB'
    },
    {
      id: 'security-audit',
      name: 'Auditoría de Seguridad',
      description: 'Logs de seguridad, intentos de acceso y vulnerabilidades',
      category: 'seguridad',
      frequency: 'weekly',
      lastGenerated: '2025-09-02',
      fileSize: '1.5 MB'
    }
  ];

  const categories = [
    { key: 'all', label: 'Todos', count: reportTemplates.length },
    { key: 'instituciones', label: 'Instituciones', count: reportTemplates.filter(r => r.category === 'instituciones').length },
    { key: 'usuarios', label: 'Usuarios', count: reportTemplates.filter(r => r.category === 'usuarios').length },
    { key: 'eventos', label: 'Eventos', count: reportTemplates.filter(r => r.category === 'eventos').length },
    { key: 'financiero', label: 'Financiero', count: reportTemplates.filter(r => r.category === 'financiero').length },
    { key: 'sistema', label: 'Sistema', count: reportTemplates.filter(r => r.category === 'sistema').length },
    { key: 'seguridad', label: 'Seguridad', count: reportTemplates.filter(r => r.category === 'seguridad').length }
  ];

  const filteredReports = selectedCategory === 'all' 
    ? reportTemplates 
    : reportTemplates.filter(r => r.category === selectedCategory);

  const handleGenerateReport = (reportId: string) => {
    // Aquí se implementaría la generación del reporte
    console.log(`Generating report: ${reportId}`);
  };

  const handleDownloadReport = (reportId: string) => {
    // Aquí se implementaría la descarga del reporte
    console.log(`Downloading report: ${reportId}`);
  };

  const getFrequencyColor = (frequency: string) => {
    switch (frequency) {
      case 'daily': return 'bg-green-100 text-green-800';
      case 'weekly': return 'bg-blue-100 text-blue-800';
      case 'monthly': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case 'daily': return 'Diario';
      case 'weekly': return 'Semanal';
      case 'monthly': return 'Mensual';
      default: return 'Bajo demanda';
    }
  };

  return (
    <MainLayout 
      title="Reportes del Sistema" 
      subtitle="Generar y descargar reportes analíticos del sistema"
    >
      <div className="space-y-8">
        {/* Métricas Resumen */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Building2 className="h-8 w-8 text-blue-600" />
                <div className="ml-5">
                  <p className="text-sm font-medium text-muted-foreground">Instituciones</p>
                  <p className="text-2xl font-bold">{stats?.totalInstitutions || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-green-600" />
                <div className="ml-5">
                  <p className="text-sm font-medium text-muted-foreground">Usuarios Totales</p>
                  <p className="text-2xl font-bold">{stats?.totalUsers || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Activity className="h-8 w-8 text-orange-600" />
                <div className="ml-5">
                  <p className="text-sm font-medium text-muted-foreground">Eventos</p>
                  <p className="text-2xl font-bold">{stats?.totalEvents || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-purple-600" />
                <div className="ml-5">
                  <p className="text-sm font-medium text-muted-foreground">Retención</p>
                  <p className="text-2xl font-bold">{stats?.strategicMetrics?.retentionRate || 0}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros por Categoría */}
        <Card>
          <CardHeader>
            <CardTitle>Categorías de Reportes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Button
                  key={category.key}
                  variant={selectedCategory === category.key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category.key)}
                  data-testid={`filter-${category.key}`}
                >
                  {category.label} ({category.count})
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Lista de Reportes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredReports.map((report) => (
            <Card key={report.id} data-testid={`report-card-${report.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{report.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {report.description}
                    </p>
                  </div>
                  <Badge className={getFrequencyColor(report.frequency)}>
                    {getFrequencyLabel(report.frequency)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {report.lastGenerated && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Último generado:</span>
                      <span>{new Date(report.lastGenerated).toLocaleDateString()}</span>
                    </div>
                  )}
                  {report.fileSize && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Tamaño del archivo:</span>
                      <span>{report.fileSize}</span>
                    </div>
                  )}
                  
                  <div className="flex space-x-2 pt-2">
                    <Button 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleGenerateReport(report.id)}
                      data-testid={`button-generate-${report.id}`}
                    >
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Generar
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleDownloadReport(report.id)}
                      data-testid={`button-download-${report.id}`}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Descargar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Acciones Rápidas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>Acciones Rápidas</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline" className="h-16 flex-col space-y-2">
                <Calendar className="w-6 h-6" />
                <span className="text-sm">Programar Reporte</span>
              </Button>
              <Button variant="outline" className="h-16 flex-col space-y-2">
                <Download className="w-6 h-6" />
                <span className="text-sm">Exportar Todos</span>
              </Button>
              <Button variant="outline" className="h-16 flex-col space-y-2">
                <BarChart3 className="w-6 h-6" />
                <span className="text-sm">Dashboard Ejecutivo</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}