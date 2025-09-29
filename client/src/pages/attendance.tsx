import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { Event, Group } from "@shared/schema";
import { CheckCircle, XCircle, Clock, User, Calendar, QrCode, Filter, Download, Users } from "lucide-react";
import { useState } from "react";

interface AttendanceRecord {
  id: string;
  eventId: string;
  athleteId: string;
  athleteName: string;
  status: 'presente' | 'ausente' | 'tardanza' | 'justificado';
  markedAt: string;
  notes?: string;
}

export default function Attendance() {
  const [selectedGroup, setSelectedGroup] = useState<string>("all");
  const [selectedEvent, setSelectedEvent] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  
  const { data: eventsResponse, isLoading: eventsLoading } = useQuery<{ success: boolean; data: Event[] }>({
    queryKey: ["/api/events"],
    enabled: true,
  });

  const { data: groupsResponse, isLoading: groupsLoading } = useQuery<{ success: boolean; data: Group[] }>({
    queryKey: ["/api/groups"],
    enabled: true,
  });

  const events = eventsResponse?.data || [];
  const groups = groupsResponse?.data || [];

  // Mock attendance data - in real app would come from API
  const mockAttendance: AttendanceRecord[] = [
    {
      id: "1",
      eventId: "event1",
      athleteId: "athlete1",
      athleteName: "María González",
      status: "presente",
      markedAt: new Date().toISOString(),
    },
    {
      id: "2",
      eventId: "event1",
      athleteId: "athlete2",
      athleteName: "Carlos Ruiz",
      status: "ausente",
      markedAt: new Date().toISOString(),
    },
    {
      id: "3",
      eventId: "event1",
      athleteId: "athlete3",
      athleteName: "Ana López",
      status: "tardanza",
      markedAt: new Date().toISOString(),
    },
    {
      id: "4",
      eventId: "event1",
      athleteId: "athlete4",
      athleteName: "Diego Martínez",
      status: "presente",
      markedAt: new Date().toISOString(),
    },
    {
      id: "5",
      eventId: "event2",
      athleteId: "athlete5",
      athleteName: "Sofía Hernández",
      status: "justificado",
      markedAt: new Date().toISOString(),
      notes: "Cita médica programada"
    },
  ];

  const filteredAttendance = mockAttendance.filter(record => {
    const matchesSearch = record.athleteName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGroup = selectedGroup === "all" || true; // Would filter by group in real app
    const matchesEvent = selectedEvent === "all" || record.eventId === selectedEvent;
    
    return matchesSearch && matchesGroup && matchesEvent;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'presente':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'ausente':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'tardanza':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'justificado':
        return <User className="w-4 h-4 text-blue-600" />;
      default:
        return <User className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'presente':
        return 'default';
      case 'ausente':
        return 'destructive';
      case 'tardanza':
        return 'secondary';
      case 'justificado':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'presente':
        return 'Presente';
      case 'ausente':
        return 'Ausente';
      case 'tardanza':
        return 'Tardanza';
      case 'justificado':
        return 'Justificado';
      default:
        return 'Desconocido';
    }
  };

  if (eventsLoading || groupsLoading) {
    return (
      <MainLayout title="Asistencias" subtitle="Control de asistencia a entrenamientos y eventos">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="h-8 bg-muted rounded"></div>
                    <div className="h-4 bg-muted rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  // Calculate stats
  const totalPresent = filteredAttendance.filter(r => r.status === 'presente').length;
  const totalAbsent = filteredAttendance.filter(r => r.status === 'ausente').length;
  const totalLate = filteredAttendance.filter(r => r.status === 'tardanza').length;
  const totalJustified = filteredAttendance.filter(r => r.status === 'justificado').length;
  const attendanceRate = filteredAttendance.length > 0 
    ? Math.round((totalPresent / filteredAttendance.length) * 100)
    : 0;

  return (
    <MainLayout title="Asistencias" subtitle="Control de asistencia a entrenamientos y eventos">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Control de Asistencias</h2>
            <p className="text-muted-foreground">
              Gestiona y supervisa la asistencia de deportistas a eventos
            </p>
          </div>
          <div className="flex gap-2">
            <Button data-testid="button-generate-qr">
              <QrCode className="w-4 h-4 mr-2" />
              Generar QR
            </Button>
            <Button variant="outline" data-testid="button-export-attendance">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Users className="w-5 h-5 text-primary" />
                <span data-testid="stat-total-records" className="text-2xl font-bold text-foreground">
                  {filteredAttendance.length}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">Total Registros</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span data-testid="stat-present" className="text-2xl font-bold text-foreground">
                  {totalPresent}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">Presentes</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <XCircle className="w-5 h-5 text-red-600" />
                <span data-testid="stat-absent" className="text-2xl font-bold text-foreground">
                  {totalAbsent}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">Ausentes</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Clock className="w-5 h-5 text-yellow-600" />
                <span data-testid="stat-late" className="text-2xl font-bold text-foreground">
                  {totalLate}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">Tardanzas</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <span className="text-2xl font-bold text-foreground" data-testid="stat-attendance-rate">
                  {attendanceRate}%
                </span>
              </div>
              <p className="text-sm text-muted-foreground">Tasa Asistencia</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Input
              data-testid="input-search-attendance"
              placeholder="Buscar deportista..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-4"
            />
          </div>
          
          <Select value={selectedGroup} onValueChange={setSelectedGroup}>
            <SelectTrigger data-testid="select-group-filter">
              <SelectValue placeholder="Filtrar por grupo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los grupos</SelectItem>
              {groups?.map((group) => (
                <SelectItem key={group.id} value={group.id}>
                  {group.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedEvent} onValueChange={setSelectedEvent}>
            <SelectTrigger data-testid="select-event-filter">
              <SelectValue placeholder="Filtrar por evento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los eventos</SelectItem>
              {events?.slice(0, 10).map((event) => (
                <SelectItem key={event.id} value={event.id}>
                  {event.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" data-testid="button-clear-filters">
            <Filter className="w-4 h-4 mr-2" />
            Limpiar Filtros
          </Button>
        </div>

        {/* Attendance Records */}
        <Card>
          <CardHeader>
            <CardTitle data-testid="text-attendance-records-title">Registros de Asistencia</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredAttendance.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Users className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  {searchTerm ? "No se encontraron registros" : "No hay registros de asistencia"}
                </h3>
                <p className="text-muted-foreground text-center mb-4">
                  {searchTerm 
                    ? "Intenta con otros términos de búsqueda"
                    : "Los registros aparecerán cuando se tome asistencia en eventos"
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredAttendance.map((record, index) => (
                  <div 
                    key={record.id} 
                    data-testid={`attendance-record-${index}`}
                    className="flex items-center justify-between p-4 bg-muted/30 rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h4 
                          data-testid={`athlete-name-${index}`}
                          className="font-medium text-foreground"
                        >
                          {record.athleteName}
                        </h4>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          <span data-testid={`event-date-${index}`}>
                            Entrenamiento del {new Date(record.markedAt).toLocaleDateString()}
                          </span>
                          <span data-testid={`marked-time-${index}`}>
                            • {new Date(record.markedAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        {record.notes && (
                          <p 
                            data-testid={`attendance-notes-${index}`}
                            className="text-xs text-muted-foreground mt-1"
                          >
                            Nota: {record.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      {getStatusIcon(record.status)}
                      <Badge 
                        variant={getStatusColor(record.status)}
                        data-testid={`attendance-status-${index}`}
                      >
                        {getStatusLabel(record.status)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
