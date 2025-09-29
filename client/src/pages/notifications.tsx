import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Notification, insertNotificationSchema } from "@shared/schema";
import { Plus, Bell, Search, Send, Users, Calendar, Eye, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const createNotificationSchema = insertNotificationSchema.extend({
  title: z.string().min(1, "El título es requerido"),
  body: z.string().min(1, "El mensaje es requerido"),
  type: z.enum(["push", "inapp", "ambas"]),
});

export default function Notifications() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: response, isLoading } = useQuery<{ success: boolean; data: Notification[] }>({
    queryKey: ["/api/notifications"],
    enabled: true,
  });

  const notifications = response?.data || [];

  const form = useForm<z.infer<typeof createNotificationSchema>>({
    resolver: zodResolver(createNotificationSchema),
    defaultValues: {
      title: "",
      body: "",
      type: "push",
      audience: {},
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof createNotificationSchema>) => {
      const response = await apiRequest("POST", "/api/notifications", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({
        title: "Notificación creada",
        description: "La notificación ha sido enviada exitosamente",
      });
      form.reset();
      setShowCreateForm(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear la notificación",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: z.infer<typeof createNotificationSchema>) => {
    createMutation.mutate(values);
  };

  const filteredNotifications = notifications?.filter(notification =>
    notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    notification.body.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (isLoading) {
    return (
      <MainLayout title="Notificaciones" subtitle="Centro de notificaciones y comunicaciones">
        <div className="space-y-6">
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-muted rounded-full mt-2"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-5 bg-muted rounded w-3/4"></div>
                      <div className="h-4 bg-muted rounded w-full"></div>
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
    <MainLayout title="Notificaciones" subtitle="Centro de notificaciones y comunicaciones">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Centro de Notificaciones</h2>
            <p className="text-muted-foreground">
              Envía notificaciones push e in-app a tu comunidad deportiva
            </p>
          </div>
          <Button 
            data-testid="button-create-notification"
            onClick={() => setShowCreateForm(!showCreateForm)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nueva Notificación
          </Button>
        </div>

        {/* Create Notification Form */}
        {showCreateForm && (
          <Card>
            <CardHeader>
              <CardTitle>Crear Nueva Notificación</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Título</FormLabel>
                          <FormControl>
                            <Input 
                              data-testid="input-notification-title"
                              placeholder="Título de la notificación" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-notification-type">
                                <SelectValue placeholder="Seleccionar tipo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="push">Solo Push</SelectItem>
                              <SelectItem value="inapp">Solo In-App</SelectItem>
                              <SelectItem value="ambas">Push + In-App</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="body"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mensaje</FormLabel>
                        <FormControl>
                          <Textarea 
                            data-testid="textarea-notification-body"
                            placeholder="Escribe tu mensaje aquí..." 
                            className="min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowCreateForm(false)}
                      data-testid="button-cancel-notification"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={createMutation.isPending}
                      data-testid="button-send-notification"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {createMutation.isPending ? "Enviando..." : "Enviar Notificación"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            data-testid="input-search-notifications"
            placeholder="Buscar notificaciones..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Bell className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  {searchTerm ? "No se encontraron notificaciones" : "No hay notificaciones enviadas"}
                </h3>
                <p className="text-muted-foreground text-center mb-4">
                  {searchTerm 
                    ? "Intenta con otros términos de búsqueda"
                    : "Comienza enviando tu primera notificación a la comunidad"
                  }
                </p>
                {!searchTerm && (
                  <Button 
                    data-testid="button-create-first-notification"
                    onClick={() => setShowCreateForm(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Enviar Primera Notificación
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredNotifications.map((notification, index) => {
              const isScheduled = notification.scheduledFor && new Date(notification.scheduledFor) > new Date();
              const isSent = notification.sentAt;
              
              return (
                <Card key={notification.id} data-testid={`notification-card-${index}`} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-3">
                      {/* Status indicator */}
                      <div className="flex-shrink-0 mt-0.5">
                        <div className={`w-2 h-2 rounded-full ${
                          isSent ? 'bg-green-500' : 
                          isScheduled ? 'bg-blue-500' : 
                          'bg-yellow-500'
                        }`}></div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        {/* Header with type and status */}
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <Badge 
                              variant={notification.type === 'push' ? 'default' : notification.type === 'inapp' ? 'secondary' : 'outline'}
                              data-testid={`notification-type-${index}`}
                            >
                              {notification.type === 'push' ? '📱 Push' : 
                               notification.type === 'inapp' ? '🔔 In-App' : 
                               '📱🔔 Ambas'}
                            </Badge>
                            <Badge 
                              variant={isSent ? 'default' : isScheduled ? 'secondary' : 'outline'}
                              data-testid={`notification-status-${index}`}
                            >
                              {isSent ? 'Enviada' : isScheduled ? 'Programada' : 'Borrador'}
                            </Badge>
                          </div>
                          <div className="flex space-x-1">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              data-testid={`button-view-notification-${index}`}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              data-testid={`button-delete-notification-${index}`}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </div>

                        {/* Title */}
                        <h3 
                          data-testid={`notification-title-${index}`}
                          className="text-lg font-semibold text-foreground mb-2"
                        >
                          {notification.title}
                        </h3>

                        {/* Body */}
                        <p 
                          data-testid={`notification-body-${index}`}
                          className="text-sm text-muted-foreground line-clamp-2 mb-3"
                        >
                          {notification.body}
                        </p>

                        {/* Stats */}
                        {isSent && (
                          <div className="flex items-center space-x-4 mb-3">
                            <div className="flex items-center space-x-1 text-sm">
                              <Send className="w-4 h-4 text-green-600" />
                              <span 
                                data-testid={`notification-delivered-${index}`}
                                className="text-green-600 font-medium"
                              >
                                {notification.delivered || 0} entregadas
                              </span>
                            </div>
                            <div className="flex items-center space-x-1 text-sm">
                              <Eye className="w-4 h-4 text-blue-600" />
                              <span 
                                data-testid={`notification-read-${index}`}
                                className="text-blue-600 font-medium"
                              >
                                {notification.read || 0} leídas
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Footer info */}
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-1">
                              <Users className="w-3 h-3" />
                              <span data-testid={`notification-audience-${index}`}>
                                Toda la institución
                              </span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-3 h-3" />
                              <span data-testid={`notification-date-${index}`}>
                                {isScheduled 
                                  ? `Programada: ${new Date(notification.scheduledFor!).toLocaleDateString()}`
                                  : isSent 
                                  ? `Enviada: ${new Date(notification.sentAt!).toLocaleDateString()}`
                                  : `Creada: ${new Date(notification.createdAt!).toLocaleDateString()}`
                                }
                              </span>
                            </div>
                          </div>
                          {isSent && (
                            <div className="text-xs text-green-600">
                              ✓ Entregada exitosamente
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Summary Stats */}
        {filteredNotifications.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <p data-testid="stat-total-notifications" className="text-2xl font-bold text-foreground">
                  {filteredNotifications.length}
                </p>
                <p className="text-sm text-muted-foreground">Total</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p data-testid="stat-sent" className="text-2xl font-bold text-foreground">
                  {filteredNotifications.filter(n => n.sentAt).length}
                </p>
                <p className="text-sm text-muted-foreground">Enviadas</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p data-testid="stat-scheduled" className="text-2xl font-bold text-foreground">
                  {filteredNotifications.filter(n => n.scheduledFor && new Date(n.scheduledFor) > new Date()).length}
                </p>
                <p className="text-sm text-muted-foreground">Programadas</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p data-testid="stat-delivered" className="text-2xl font-bold text-foreground">
                  {filteredNotifications.reduce((sum, n) => sum + (n.delivered || 0), 0)}
                </p>
                <p className="text-sm text-muted-foreground">Total Entregadas</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
