import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useInstitutionalQuery } from "@/hooks/use-institutional-query";
import { Venue } from "@shared/schema";
import { Plus, MapPin, Edit, Users } from "lucide-react";

export default function Venues() {
  const { data: response, isLoading } = useInstitutionalQuery<{ success: boolean; data: Venue[] }>(
    "/api/venues"
  );

  const venues = response?.data || [];

  if (isLoading) {
    return (
      <MainLayout title="Sedes" subtitle="Gestión de sedes deportivas">
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
    <MainLayout title="Sedes" subtitle="Gestión de sedes deportivas">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Sedes</h2>
            <p className="text-muted-foreground">
              Administra las sedes y ubicaciones de entrenamiento
            </p>
          </div>
          <Button data-testid="button-create-venue">
            <Plus className="w-4 h-4 mr-2" />
            Nueva Sede
          </Button>
        </div>

        {/* Venues Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {venues?.length === 0 ? (
            <div className="col-span-full">
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <MapPin className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    No hay sedes registradas
                  </h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Comienza agregando tu primera sede deportiva
                  </p>
                  <Button data-testid="button-create-first-venue">
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Primera Sede
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            venues?.map((venue, index) => (
              <Card key={venue.id} data-testid={`venue-card-${index}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      {venue.logoUrl ? (
                        <img 
                          src={venue.logoUrl} 
                          alt={`Logo de ${venue.name}`}
                          className="w-8 h-8 object-cover rounded"
                        />
                      ) : (
                        <MapPin className="w-6 h-6 text-primary" />
                      )}
                    </div>
                    <Badge 
                      variant={venue.isActive ? "default" : "secondary"}
                      data-testid={`venue-status-${index}`}
                    >
                      {venue.isActive ? "Activa" : "Inactiva"}
                    </Badge>
                  </div>
                  <CardTitle 
                    data-testid={`venue-name-${index}`}
                    className="text-lg"
                  >
                    {venue.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {venue.address && (
                    <div className="flex items-start space-x-2 mb-3">
                      <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <p 
                        data-testid={`venue-address-${index}`}
                        className="text-sm text-muted-foreground"
                      >
                        {venue.address}
                      </p>
                    </div>
                  )}

                  {/* Mock stats - in real app would come from API */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center">
                      <p 
                        data-testid={`venue-groups-${index}`}
                        className="text-2xl font-bold text-foreground"
                      >
                        3
                      </p>
                      <p className="text-xs text-muted-foreground">Grupos</p>
                    </div>
                    <div className="text-center">
                      <p 
                        data-testid={`venue-athletes-${index}`}
                        className="text-2xl font-bold text-foreground"
                      >
                        45
                      </p>
                      <p className="text-xs text-muted-foreground">Deportistas</p>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      data-testid={`button-edit-venue-${index}`}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Editar
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      data-testid={`button-view-groups-${index}`}
                    >
                      <Users className="w-4 h-4 mr-1" />
                      Grupos
                    </Button>
                  </div>

                  <div className="mt-3 text-xs text-muted-foreground">
                    Creada: {new Date(venue.createdAt!).toLocaleDateString()}
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
