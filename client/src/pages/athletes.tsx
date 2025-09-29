import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useInstitutionalQuery } from "@/hooks/use-institutional-query";
import { Athlete } from "@shared/schema";
import { Plus, UserCheck, Search, Filter, Edit, User } from "lucide-react";
import { useState } from "react";

export default function Athletes() {
  const [searchTerm, setSearchTerm] = useState("");
  
  const { data: response, isLoading } = useInstitutionalQuery<{ success: boolean; data: Athlete[] }>(
    "/api/athletes"
  );

  const athletes = response?.data || [];

  const filteredAthletes = athletes?.filter(athlete =>
    athlete.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    athlete.lastName.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (isLoading) {
    return (
      <MainLayout title="Deportistas" subtitle="Gestión de deportistas">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-muted rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-5 bg-muted rounded w-3/4"></div>
                      <div className="h-4 bg-muted rounded w-1/2"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Deportistas" subtitle="Gestión de deportistas">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Deportistas</h2>
            <p className="text-muted-foreground">
              Administra los deportistas registrados
            </p>
          </div>
          <Button data-testid="button-create-athlete">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Deportista
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              data-testid="input-search-athletes"
              placeholder="Buscar deportistas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" data-testid="button-filter-athletes">
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </Button>
        </div>

        {/* Athletes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredAthletes.length === 0 ? (
            <div className="col-span-full">
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <UserCheck className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    {searchTerm ? "No se encontraron deportistas" : "No hay deportistas registrados"}
                  </h3>
                  <p className="text-muted-foreground text-center mb-4">
                    {searchTerm 
                      ? "Intenta con otros términos de búsqueda"
                      : "Comienza registrando tu primer deportista"
                    }
                  </p>
                  {!searchTerm && (
                    <Button data-testid="button-create-first-athlete">
                      <Plus className="w-4 h-4 mr-2" />
                      Registrar Primer Deportista
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            filteredAthletes.map((athlete, index) => (
              <Card key={athlete.id} data-testid={`athlete-card-${index}`} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      {athlete.avatarUrl ? (
                        <img 
                          src={athlete.avatarUrl} 
                          alt={`${athlete.firstName} ${athlete.lastName}`}
                          className="w-12 h-12 object-cover rounded-full"
                        />
                      ) : (
                        <User className="w-6 h-6 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 
                        data-testid={`athlete-name-${index}`}
                        className="font-semibold text-foreground truncate"
                      >
                        {athlete.firstName} {athlete.lastName}
                      </h3>
                      <p 
                        data-testid={`athlete-group-${index}`}
                        className="text-sm text-muted-foreground"
                      >
                        Grupo Infantil A
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {athlete.birthDate && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Edad:</span>
                        <span 
                          data-testid={`athlete-age-${index}`}
                          className="font-medium"
                        >
                          {new Date().getFullYear() - new Date(athlete.birthDate).getFullYear()} años
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Asistencia:</span>
                      <Badge 
                        variant="secondary"
                        data-testid={`athlete-attendance-${index}`}
                      >
                        95%
                      </Badge>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Estado:</span>
                      <Badge 
                        variant={athlete.isActive ? "default" : "secondary"}
                        data-testid={`athlete-status-${index}`}
                      >
                        {athlete.isActive ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      data-testid={`button-edit-athlete-${index}`}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Editar Perfil
                    </Button>
                  </div>

                  <div className="mt-2 text-xs text-muted-foreground text-center">
                    Registrado: {new Date(athlete.createdAt!).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Summary Stats */}
        {filteredAthletes.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <p data-testid="stat-total-athletes" className="text-2xl font-bold text-foreground">
                  {filteredAthletes.length}
                </p>
                <p className="text-sm text-muted-foreground">Total Deportistas</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p data-testid="stat-active-athletes" className="text-2xl font-bold text-foreground">
                  {filteredAthletes.filter(a => a.isActive).length}
                </p>
                <p className="text-sm text-muted-foreground">Activos</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p data-testid="stat-average-age" className="text-2xl font-bold text-foreground">
                  12
                </p>
                <p className="text-sm text-muted-foreground">Edad Promedio</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
