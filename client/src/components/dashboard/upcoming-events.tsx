import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Event } from "@shared/schema";

export function UpcomingEvents() {
  const { data: response, isLoading } = useQuery<{ success: boolean; data: Event[] }>({
    queryKey: ["/api/events"],
    enabled: true,
  });

  const events = response?.data || [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Próximos Eventos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg animate-pulse">
                <div className="w-10 h-10 bg-muted rounded-lg"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Filter for upcoming events and take first 3
  const upcomingEvents = events.filter(event => 
    new Date(event.startTime) > new Date()
  ).slice(0, 3);

  return (
    <Card>
      <CardHeader>
        <CardTitle data-testid="text-upcoming-events-title">Próximos Eventos</CardTitle>
      </CardHeader>
      <CardContent>
        {upcomingEvents.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No hay eventos próximos</p>
          </div>
        ) : (
          <div className="space-y-4">
            {upcomingEvents.map((event, index) => {
              const startDate = new Date(event.startTime);
              const dayOfMonth = startDate.getDate();
              const timeRange = `${startDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} - ${new Date(event.endTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
              
              return (
                <div key={event.id} className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                  <div className="flex-shrink-0">
                    <div className={`w-10 h-10 ${index % 3 === 0 ? 'bg-primary/10' : index % 3 === 1 ? 'bg-green-100' : 'bg-blue-100'} rounded-lg flex items-center justify-center`}>
                      <span className={`text-xs font-bold ${index % 3 === 0 ? 'text-primary' : index % 3 === 1 ? 'text-green-600' : 'text-blue-600'}`}>
                        {dayOfMonth}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p 
                      data-testid={`event-title-${index}`}
                      className="text-sm font-medium text-foreground truncate"
                    >
                      {event.title}
                    </p>
                    <p 
                      data-testid={`event-time-${index}`}
                      className="text-xs text-muted-foreground"
                    >
                      {timeRange}
                    </p>
                    <p 
                      data-testid={`event-location-${index}`}
                      className="text-xs text-muted-foreground"
                    >
                      {event.location || 'Ubicación por definir'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <Button 
          data-testid="button-view-calendar"
          className="w-full mt-4 bg-primary/10 text-primary hover:bg-primary/20"
        >
          Ver calendario completo
        </Button>
      </CardContent>
    </Card>
  );
}
