import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useInstitutionalQuery } from "@/hooks/use-institutional-query";
import { Group } from "@shared/schema";
import { Plus, Users, Calendar, User, Settings } from "lucide-react";

export default function Groups() {
  const { data: response, isLoading } = useInstitutionalQuery<{ success: boolean; data: Group[] }>(
    "/api/groups"
  );

  const groups = response?.data || [];

  if (isLoading) {
    return (
      <MainLayout title="Grupos" subtitle="Gestión de grupos deportivos">
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-muted rounded-lg"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-6 bg-muted rounded w-1/3"></div>
                    <div className="h-4 bg-muted rounded w-2/3"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Grupos" subtitle="Gestión de grupos deportivos">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Grupos</h2>
            <p className="text-muted-foreground">
              Administra los grupos y categorías deportivas
            </p>
          </div>
          <Button data-testid="button-create-group">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Grupo
          </Button>
        </div>

        {/* Groups Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups?.length === 0 ? (
            <div className="col-span-full">
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Users className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    No hay grupos registrados
                  </h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Comienza creando tu primer grupo deportivo
                  </p>
                  <Button data-testid="button-create-first-group">
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Primer Grupo
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            groups?.map((group, index) => (
              <Card key={group.id} data-testid={`group-card-${index}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Users className="w-6 h-6 text-primary" />
                    </div>
                    <Badge 
                      variant={group.isActive ? "default" : "secondary"}
                      data-testid={`group-status-${index}`}
                    >
                      {group.isActive ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                  <CardTitle 
                    data-testid={`group-name-${index}`}
                    className="text-lg"
                  >
                    {group.name}
                  </CardTitle>
                  {group.description && (
                    <p 
                      data-testid={`group-description-${index}`}
                      className="text-sm text-muted-foreground"
                    >
                      {group.description}
                    </p>
                  )}
                </CardHeader>
                <CardContent>
                  {/* Group Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center">
                      <p 
                        data-testid={`group-athletes-${index}`}
                        className="text-2xl font-bold text-foreground"
                      >
                        15
                      </p>
                      <p className="text-xs text-muted-foreground">Deportistas</p>
                    </div>
                    <div className="text-center">
                      <p 
                        data-testid={`group-attendance-${index}`}
                        className="text-2xl font-bold text-foreground"
                      >
                        92%
                      </p>
                      <p className="text-xs text-muted-foreground">Asistencia</p>
                    </div>
                  </div>

                  {/* Training Schedule */}
                  <div className="mb-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Horarios:</span>
                    </div>
                    <div 
                      data-testid={`group-schedule-${index}`}
                      className="text-sm text-muted-foreground"
                    >
                      Lun, Mie, Vie - 16:00 a 18:00
                    </div>
                  </div>

                  {/* Main Trainer */}
                  <div className="mb-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Entrenador Principal:</span>
                    </div>
                    <div 
                      data-testid={`group-trainer-${index}`}
                      className="text-sm text-muted-foreground"
                    >
                      Carlos Rodríguez
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      data-testid={`button-view-athletes-${index}`}
                    >
                      <Users className="w-4 h-4 mr-1" />
                      Deportistas
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      data-testid={`button-group-settings-${index}`}
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="mt-3 text-xs text-muted-foreground">
                    Creado: {new Date(group.createdAt!).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </MainLayout>
  );
}
