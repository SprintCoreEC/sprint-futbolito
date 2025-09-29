import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, Megaphone, Bell } from "lucide-react";
import { usePermissions } from "@/hooks/use-permissions";

export function QuickActions() {
  const { hasPermission } = usePermissions();
  
  const actions = [
    {
      title: "Nuevo Deportista",
      icon: Plus,
      color: "bg-primary/5 hover:bg-primary/10 border-primary/20",
      iconColor: "text-primary",
      module: "athletes",
      action: "create"
    },
    {
      title: "Crear Evento",
      icon: Calendar,
      color: "bg-green-50 hover:bg-green-100 border-green-200",
      iconColor: "text-green-600",
      module: "events",
      action: "create"
    },
    {
      title: "Nueva Publicación",
      icon: Megaphone,
      color: "bg-blue-50 hover:bg-blue-100 border-blue-200",
      iconColor: "text-blue-600",
      module: "publications",
      action: "create"
    },
    {
      title: "Enviar Notificación",
      icon: Bell,
      color: "bg-purple-50 hover:bg-purple-100 border-purple-200",
      iconColor: "text-purple-600",
      module: "notifications",
      action: "create"
    }
  ];

  const filteredActions = actions.filter(action => 
    hasPermission(action.module, action.action)
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle data-testid="text-quick-actions-title">Acciones Rápidas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {filteredActions.map((action, index) => (
            <Button
              key={index}
              data-testid={`button-quick-action-${index}`}
              variant="outline"
              className={`flex flex-col items-center p-4 h-auto transition-colors border ${action.color}`}
            >
              <action.icon className={`w-8 h-8 ${action.iconColor} mb-2`} />
              <span className="text-sm font-medium text-foreground">
                {action.title}
              </span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
