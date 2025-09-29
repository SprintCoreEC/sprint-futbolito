import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { Event } from "@shared/schema";
import { Plus, Calendar, Search, Filter, Clock, MapPin, Users, Edit } from "lucide-react";
import { useState } from "react";

export default function Events() {
  const [searchTerm, setSearchTerm] = useState("");
  
  const { data: response, isLoading } = useQuery<{ success: boolean; data: Event[] }>({
    queryKey: ["/api/events"],
    enabled: true,
  });

  const events = response?.data || [];

  const filteredEvents = events.filter(event =>
    event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <MainLayout title="Eventos" subtitle="Gestión de eventos deportivos">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <div className="h-6 bg-muted rounded w-3/4"></div>
                    <div className="h-4 bg-muted rounded w-full"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
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
    <MainLayout title="Eventos" subtitle="Gestión de eventos deportivos">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Eventos</h2>
            <p className="text-muted-foreground">
              Administra entrenamientos, partidos y eventos especiales
            </p>
          </div>
          <Button data-testid="button-create-event">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Evento
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              data-testid="input-search-events"
              placeholder="Buscar eventos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" data-testid="button-filter-events">
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </Button>
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.length === 0 ? (
            <div className="col-span-full">
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Calendar className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    {searchTerm ? "No se encontraron eventos" : "No hay eventos programados"}
                  </h3>
                  <p className="text-muted-foreground text-center mb-4">
                    {searchTerm 
                      ? "Intenta con otros términos de búsqueda"
                      : "Comienza creando tu primer evento deportivo"
                    }
                  </p>
                  {!searchTerm && (
                    <Button data-testid="button-create-first-event">
                      <Plus className="w-4 h-4 mr-2" />
                      Crear Primer Evento
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            filteredEvents.map((event, index) => {
              const startDate = new Date(event.startTime);
              const endDate = new Date(event.endTime);
              const isUpcoming = startDate > new Date();
              const isPast = endDate < new Date();
              const isOngoing = startDate <= new Date() && endDate >= new Date();

              return (
                <Card key={event.id} data-testid={`event-card-${index}`} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${
                          isOngoing ? 'bg-green-500' : 
                          isUpcoming ? 'bg-blue-500' : 
                          'bg-gray-400'
                        }`}></div>
                        <Badge variant={event.isMatch ? "default" : "secondary"}>
                          {event.isMatch ? "Partido" : "Entrenamiento"}
                        </Badge>
                      </div>
                      <Badge 
                        variant={
                          isOngoing ? "default" : 
                          isUpcoming ? "secondary" : 
                          "outline"
                        }
                        data-testid={`event-status-${index}`}
                      >
                        {isOngoing ? "En curso" : isUpcoming ? "Próximo" : "Finalizado"}
                      </Badge>
                    </div>
                    <CardTitle 
                      data-testid={`event-title-${index}`}
                      className="text-lg"
                    >
                      {event.title}
                    </CardTitle>
                    {event.description && (
                      <p 
                        data-testid={`event-description-${index}`}
                        className="text-sm text-muted-foreground line-clamp-2"
                      >
                        {event.description}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* Date and Time */}
                      <div className="flex items-center space-x-2 text-sm">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span 
                          data-testid={`event-date-${index}`}
                          className="text-foreground"
                        >
                          {startDate.toLocaleDateString('es-ES', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2 text-sm">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span 
                          data-testid={`event-time-${index}`}
                          className="text-foreground"
                        >
                          {startDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} - {endDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {/* Location */}
                      {event.location && (
                        <div className="flex items-center space-x-2 text-sm">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span 
                            data-testid={`event-location-${index}`}
                            className="text-foreground"
                          >
                            {event.location}
                          </span>
                        </div>
                      )}

                      {/* Group/Category */}
                      <div className="flex items-center space-x-2 text-sm">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span 
                          data-testid={`event-group-${index}`}
                          className="text-foreground"
                        >
                          Grupo Infantil A
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t">
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          data-testid={`button-edit-event-${index}`}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Editar
                        </Button>
                        {isUpcoming && (
                          <Button 
                            size="sm" 
                            className="flex-1"
                            data-testid={`button-attendance-${index}`}
                          >
                            <Users className="w-4 h-4 mr-1" />
                            Asistencia
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="mt-2 text-xs text-muted-foreground text-center">
                      Creado: {new Date(event.createdAt!).toLocaleDateString()}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Summary Stats */}
        {filteredEvents.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <p data-testid="stat-total-events" className="text-2xl font-bold text-foreground">
                  {filteredEvents.length}
                </p>
                <p className="text-sm text-muted-foreground">Total Eventos</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p data-testid="stat-upcoming-events" className="text-2xl font-bold text-foreground">
                  {filteredEvents.filter(e => new Date(e.startTime) > new Date()).length}
                </p>
                <p className="text-sm text-muted-foreground">Próximos</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p data-testid="stat-matches" className="text-2xl font-bold text-foreground">
                  {filteredEvents.filter(e => e.isMatch).length}
                </p>
                <p className="text-sm text-muted-foreground">Partidos</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p data-testid="stat-trainings" className="text-2xl font-bold text-foreground">
                  {filteredEvents.filter(e => !e.isMatch).length}
                </p>
                <p className="text-sm text-muted-foreground">Entrenamientos</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
