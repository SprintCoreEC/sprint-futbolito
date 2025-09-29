import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Notification } from "@shared/schema";

export function NotificationCenter() {
  const { data: response, isLoading } = useQuery<{ success: boolean; data: Notification[] }>({
    queryKey: ["/api/notifications"],
    enabled: true,
  });

  const notifications = response?.data || [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Centro de Notificaciones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start space-x-3 p-3 bg-muted/50 rounded-lg animate-pulse">
                <div className="w-2 h-2 bg-muted rounded-full mt-1"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-full"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const recentNotifications = notifications.slice(0, 3);
  const unreadCount = 3; // Mock unread count

  // Mock notification data for display
  const mockNotifications = [
    {
      title: "Nuevo deportista registrado",
      message: "María González se ha registrado en el grupo Infantil A",
      time: "Hace 15 min",
      type: "primary",
      borderColor: "border-primary"
    },
    {
      title: "Pago confirmado",
      message: "Pago de mensualidad de Carlos Ruiz procesado exitosamente",
      time: "Hace 1 hora",
      type: "green",
      borderColor: "border-green-400"
    },
    {
      title: "Recordatorio: Reunión de entrenadores",
      message: "Reunión programada para mañana a las 18:00",
      time: "Hace 3 horas",
      type: "yellow",
      borderColor: "border-yellow-400"
    }
  ];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle data-testid="text-notifications-title">Centro de Notificaciones</CardTitle>
        <Badge 
          data-testid="badge-unread-count"
          variant="destructive" 
          className="text-xs"
        >
          {unreadCount}
        </Badge>
      </CardHeader>
      <CardContent>
        {recentNotifications.length === 0 ? (
          <div className="space-y-3">
            {mockNotifications.map((notification, index) => (
              <div 
                key={index} 
                className={`flex items-start space-x-3 p-3 ${
                  notification.type === 'primary' ? 'bg-primary/5 border-l-4' : 
                  notification.type === 'green' ? 'bg-green-50 border-l-4' :
                  'bg-yellow-50 border-l-4'
                } ${notification.borderColor} rounded-r-lg`}
              >
                <div className="flex-shrink-0 mt-0.5">
                  <div className={`w-2 h-2 ${
                    notification.type === 'primary' ? 'bg-primary' : 
                    notification.type === 'green' ? 'bg-green-400' :
                    'bg-yellow-400'
                  } rounded-full`}></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p 
                    data-testid={`notification-title-${index}`}
                    className="text-sm font-medium text-foreground"
                  >
                    {notification.title}
                  </p>
                  <p 
                    data-testid={`notification-message-${index}`}
                    className="text-xs text-muted-foreground"
                  >
                    {notification.message}
                  </p>
                  <p 
                    data-testid={`notification-time-${index}`}
                    className="text-xs text-muted-foreground mt-1"
                  >
                    {notification.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {recentNotifications.map((notification, index) => (
              <div key={notification.id} className="flex items-start space-x-3 p-3 bg-primary/5 border-l-4 border-primary rounded-r-lg">
                <div className="flex-shrink-0 mt-0.5">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p 
                    data-testid={`notification-title-${index}`}
                    className="text-sm font-medium text-foreground"
                  >
                    {notification.title}
                  </p>
                  <p 
                    data-testid={`notification-message-${index}`}
                    className="text-xs text-muted-foreground"
                  >
                    {notification.body}
                  </p>
                  <p 
                    data-testid={`notification-time-${index}`}
                    className="text-xs text-muted-foreground mt-1"
                  >
                    {new Date(notification.createdAt!).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        <Button 
          data-testid="button-view-all-notifications"
          className="w-full mt-4 bg-primary/10 text-primary hover:bg-primary/20"
        >
          Ver todas las notificaciones
        </Button>
      </CardContent>
    </Card>
  );
}
