import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Group } from "@shared/schema";

export function AttendanceSummary() {
  const { data: response, isLoading } = useQuery<{ success: boolean; data: Group[] }>({
    queryKey: ["/api/groups"],
    enabled: true,
  });

  const groups = response?.data || [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Resumen de Asistencias</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between animate-pulse">
                <div className="space-y-1">
                  <div className="h-4 bg-muted rounded w-20"></div>
                  <div className="h-3 bg-muted rounded w-16"></div>
                </div>
                <div className="text-right space-y-1">
                  <div className="h-4 bg-muted rounded w-8"></div>
                  <div className="h-3 bg-muted rounded w-6"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const displayGroups = groups.slice(0, 3);

  // Mock attendance data - in real app would come from attendance API
  const attendanceData = [
    { name: "Infantil A", schedule: "Lun, Mie, Vie 16:00", attendance: 92, change: "+5%" },
    { name: "Juvenil B", schedule: "Mar, Jue 18:00", attendance: 85, change: "-2%" },
    { name: "Senior", schedule: "Sáb 10:00", attendance: 78, change: "+1%" }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle data-testid="text-attendance-title">Resumen de Asistencias</CardTitle>
      </CardHeader>
      <CardContent>
        {displayGroups.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No hay grupos disponibles</p>
          </div>
        ) : (
          <div className="space-y-3">
            {attendanceData.map((group, index) => (
              <div key={index} className="flex items-center justify-between">
                <div>
                  <p 
                    data-testid={`group-name-${index}`}
                    className="text-sm font-medium text-foreground"
                  >
                    {group.name}
                  </p>
                  <p 
                    data-testid={`group-schedule-${index}`}
                    className="text-xs text-muted-foreground"
                  >
                    {group.schedule}
                  </p>
                </div>
                <div className="text-right">
                  <p 
                    data-testid={`group-attendance-${index}`}
                    className="text-sm font-semibold text-foreground"
                  >
                    {group.attendance}%
                  </p>
                  <p 
                    data-testid={`group-change-${index}`}
                    className={`text-xs ${group.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {group.change}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        <Button 
          data-testid="button-view-attendance-details"
          variant="secondary"
          className="w-full mt-4"
        >
          Ver detalles de asistencia
        </Button>
      </CardContent>
    </Card>
  );
}
