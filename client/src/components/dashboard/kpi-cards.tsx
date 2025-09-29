import { Card, CardContent } from "@/components/ui/card";
import { Users, CheckCircle, Calendar, DollarSign } from "lucide-react";

interface KPICardsProps {
  stats: {
    totalAthletes: number;
    averageAttendance: number;
    upcomingEvents: number;
    monthlyRevenue: number;
  };
}

export function KPICards({ stats }: KPICardsProps) {
  const kpis = [
    {
      title: "Total Deportistas",
      value: stats.totalAthletes,
      icon: Users,
      change: "+12%",
      changeType: "positive",
      bgColor: "bg-primary/10",
      iconColor: "text-primary"
    },
    {
      title: "Asistencia Promedio",
      value: `${stats.averageAttendance}%`,
      icon: CheckCircle,
      change: "+3%",
      changeType: "positive",
      bgColor: "bg-green-100",
      iconColor: "text-green-600"
    },
    {
      title: "Próximos Eventos",
      value: stats.upcomingEvents,
      icon: Calendar,
      change: "Esta semana",
      changeType: "neutral",
      bgColor: "bg-blue-100",
      iconColor: "text-blue-600"
    },
    {
      title: "Ingresos del Mes",
      value: `$${stats.monthlyRevenue?.toLocaleString() || '0'}`,
      icon: DollarSign,
      change: "+8%",
      changeType: "positive",
      bgColor: "bg-yellow-100",
      iconColor: "text-yellow-600"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {kpis.map((kpi, index) => (
        <Card key={index} data-testid={`kpi-card-${index}`}>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className={`w-8 h-8 ${kpi.bgColor} rounded-lg flex items-center justify-center`}>
                  <kpi.icon className={`w-5 h-5 ${kpi.iconColor}`} />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-muted-foreground truncate">
                    {kpi.title}
                  </dt>
                  <dd data-testid={`kpi-value-${index}`} className="text-2xl font-semibold text-foreground">
                    {kpi.value}
                  </dd>
                </dl>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center text-sm">
                <span 
                  className={`font-medium ${
                    kpi.changeType === "positive" 
                      ? "text-green-500" 
                      : kpi.changeType === "negative"
                      ? "text-red-500"
                      : "text-muted-foreground"
                  }`}
                >
                  {kpi.change}
                </span>
                {kpi.changeType !== "neutral" && (
                  <span className="text-muted-foreground ml-2">vs mes anterior</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
