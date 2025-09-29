import { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Institution, insertInstitutionSchema, type InsertInstitution } from "@shared/schema";
import { Plus, Building2, Edit, Settings, Trash2, Power, PowerOff, ArrowRight } from "lucide-react";
import { usePermissions } from "@/hooks/use-permissions";
import { useInstitutionContext } from "@/hooks/use-institution-context";

export default function Institutions() {
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  const { enterInstitution } = useInstitutionContext();
  const [selectedInstitution, setSelectedInstitution] = useState<Institution | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const { data: response, isLoading } = useQuery<{ success: boolean; data: Institution[] }>({
    queryKey: ["/api/institutions"],
    enabled: true,
  });

  const institutions = response?.data || [];

  const createForm = useForm<InsertInstitution>({
    resolver: zodResolver(insertInstitutionSchema),
    defaultValues: {
      name: "",
      description: "",
      logoUrl: "",
      primaryColor: "#3B82F6",
      secondaryColor: "#1E40AF",
      accentColor: "#EFF6FF",
      isActive: true
    }
  });

  const editForm = useForm<InsertInstitution>({
    resolver: zodResolver(insertInstitutionSchema),
    defaultValues: {
      name: "",
      description: "",
      logoUrl: "",
      primaryColor: "#3B82F6",
      secondaryColor: "#1E40AF",
      accentColor: "#EFF6FF",
      isActive: true
    }
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertInstitution) => apiRequest("POST", "/api/institutions", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/institutions"] });
      toast({ title: "Institución creada exitosamente" });
      setIsCreateDialogOpen(false);
      createForm.reset();
    },
    onError: () => {
      toast({ 
        title: "Error", 
        description: "No se pudo crear la institución", 
        variant: "destructive" 
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InsertInstitution> }) => 
      apiRequest("PUT", `/api/institutions/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/institutions"] });
      toast({ title: "Institución actualizada exitosamente" });
      setIsEditDialogOpen(false);
      setSelectedInstitution(null);
    },
    onError: () => {
      toast({ 
        title: "Error", 
        description: "No se pudo actualizar la institución", 
        variant: "destructive" 
      });
    }
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => apiRequest("PATCH", `/api/institutions/${id}/toggle`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/institutions"] });
      toast({ title: "Estado de institución actualizado" });
    },
    onError: () => {
      toast({ 
        title: "Error", 
        description: "No se pudo cambiar el estado de la institución", 
        variant: "destructive" 
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/institutions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/institutions"] });
      toast({ title: "Institución eliminada exitosamente" });
    },
    onError: () => {
      toast({ 
        title: "Error", 
        description: "No se pudo eliminar la institución", 
        variant: "destructive" 
      });
    }
  });

  const handleCreate = (data: InsertInstitution) => {
    createMutation.mutate(data);
  };

  const handleEdit = (institution: Institution) => {
    setSelectedInstitution(institution);
    editForm.reset({
      name: institution.name,
      description: institution.description || "",
      logoUrl: institution.logoUrl || "",
      primaryColor: institution.primaryColor || "#3B82F6",
      secondaryColor: institution.secondaryColor || "#1E40AF",
      accentColor: institution.accentColor || "#EFF6FF",
      isActive: institution.isActive
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = (data: InsertInstitution) => {
    if (selectedInstitution) {
      updateMutation.mutate({ id: selectedInstitution.id, data });
    }
  };

  const handleToggle = (institution: Institution) => {
    toggleMutation.mutate(institution.id);
  };

  const handleDelete = (institution: Institution) => {
    deleteMutation.mutate(institution.id);
  };

  const handleEnterInstitution = (institution: Institution) => {
    // Usar el hook para entrar a la institución
    enterInstitution(institution);
    
    // Redirigir al dashboard principal que detectará el contexto institucional
    window.location.href = `/dashboard`;
    
    toast({ 
      title: `Entrando a ${institution.name}`, 
      description: "Cargando vista institucional..." 
    });
  };

  if (isLoading) {
    return (
      <MainLayout title="Instituciones" subtitle="Gestión de instituciones deportivas">
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
    <MainLayout title="Instituciones" subtitle="Gestión de instituciones deportivas">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Instituciones</h2>
            <p className="text-muted-foreground">
              Administra las instituciones deportivas del sistema
            </p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-institution">
                <Plus className="w-4 h-4 mr-2" />
                Nueva Institución
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Crear Nueva Institución</DialogTitle>
                <DialogDescription>
                  Completa la información para crear una nueva institución deportiva.
                </DialogDescription>
              </DialogHeader>
              <Form {...createForm}>
                <form onSubmit={createForm.handleSubmit(handleCreate)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={createForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre *</FormLabel>
                          <FormControl>
                            <Input placeholder="Nombre de la institución" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createForm.control}
                      name="logoUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>URL del Logo</FormLabel>
                          <FormControl>
                            <Input placeholder="https://..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={createForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descripción</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Descripción de la institución" 
                            className="resize-none" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={createForm.control}
                      name="primaryColor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Color Primario</FormLabel>
                          <FormControl>
                            <div className="flex items-center space-x-2">
                              <Input type="color" {...field} className="w-16 h-10" />
                              <Input {...field} placeholder="#3B82F6" className="flex-1" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createForm.control}
                      name="secondaryColor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Color Secundario</FormLabel>
                          <FormControl>
                            <div className="flex items-center space-x-2">
                              <Input type="color" {...field} className="w-16 h-10" />
                              <Input {...field} placeholder="#1E40AF" className="flex-1" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={createForm.control}
                      name="accentColor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Color de Acento</FormLabel>
                          <FormControl>
                            <div className="flex items-center space-x-2">
                              <Input type="color" {...field} className="w-16 h-10" />
                              <Input {...field} placeholder="#EFF6FF" className="flex-1" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={createMutation.isPending}>
                      {createMutation.isPending ? "Creando..." : "Crear Institución"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Institutions List */}
        <div className="space-y-4">
          {institutions?.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Building2 className="w-12 h-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  No hay instituciones registradas
                </h3>
                <p className="text-muted-foreground text-center mb-4">
                  Comienza creando tu primera institución deportiva
                </p>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-create-first-institution">
                      <Plus className="w-4 h-4 mr-2" />
                      Crear Primera Institución
                    </Button>
                  </DialogTrigger>
                </Dialog>
              </CardContent>
            </Card>
          ) : (
            institutions?.map((institution, index) => (
              <Card key={institution.id} data-testid={`institution-card-${index}`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center">
                        {institution.logoUrl ? (
                          <img 
                            src={institution.logoUrl} 
                            alt={`Logo de ${institution.name}`}
                            className="w-12 h-12 object-cover rounded"
                          />
                        ) : (
                          <Building2 className="w-8 h-8 text-primary" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 
                          data-testid={`institution-name-${index}`}
                          className="text-lg font-semibold text-foreground"
                        >
                          {institution.name}
                        </h3>
                        {institution.description && (
                          <p 
                            data-testid={`institution-description-${index}`}
                            className="text-muted-foreground"
                          >
                            {institution.description}
                          </p>
                        )}
                        <div className="flex items-center space-x-2 mt-2">
                          <Badge 
                            variant={institution.isActive ? "default" : "secondary"}
                            data-testid={`institution-status-${index}`}
                          >
                            {institution.isActive ? "Activa" : "Inactiva"}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Creada: {new Date(institution.createdAt!).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {hasPermission("institutions", "enter") && (
                        <Button 
                          variant="default" 
                          size="sm"
                          onClick={() => handleEnterInstitution(institution)}
                          data-testid={`button-enter-institution-${index}`}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <ArrowRight className="w-4 h-4 mr-1" />
                          Entrar
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEdit(institution)}
                        data-testid={`button-edit-institution-${index}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleToggle(institution)}
                        disabled={toggleMutation.isPending}
                        data-testid={`button-toggle-institution-${index}`}
                      >
                        {institution.isActive ? 
                          <PowerOff className="w-4 h-4 text-orange-500" /> : 
                          <Power className="w-4 h-4 text-green-500" />
                        }
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            data-testid={`button-delete-institution-${index}`}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar institución?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción no se puede deshacer. Se eliminará permanentemente 
                              la institución "{institution.name}" y todos sus datos asociados.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDelete(institution)}
                              className="bg-red-600 hover:bg-red-700"
                              disabled={deleteMutation.isPending}
                            >
                              {deleteMutation.isPending ? "Eliminando..." : "Eliminar"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  
                  {/* Color Theme Preview */}
                  <div className="mt-4 flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">Colores:</span>
                    <div className="flex space-x-1">
                      <div 
                        className="w-6 h-6 rounded border"
                        style={{ backgroundColor: institution.primaryColor }}
                        title="Color primario"
                      ></div>
                      <div 
                        className="w-6 h-6 rounded border"
                        style={{ backgroundColor: institution.secondaryColor }}
                        title="Color secundario"
                      ></div>
                      <div 
                        className="w-6 h-6 rounded border"
                        style={{ backgroundColor: institution.accentColor }}
                        title="Color de acento"
                      ></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Editar Institución</DialogTitle>
              <DialogDescription>
                Actualiza la información de la institución.
              </DialogDescription>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(handleUpdate)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre *</FormLabel>
                        <FormControl>
                          <Input placeholder="Nombre de la institución" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="logoUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL del Logo</FormLabel>
                        <FormControl>
                          <Input placeholder="https://..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={editForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Descripción de la institución" 
                          className="resize-none" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={editForm.control}
                    name="primaryColor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Color Primario</FormLabel>
                        <FormControl>
                          <div className="flex items-center space-x-2">
                            <Input type="color" {...field} className="w-16 h-10" />
                            <Input {...field} placeholder="#3B82F6" className="flex-1" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="secondaryColor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Color Secundario</FormLabel>
                        <FormControl>
                          <div className="flex items-center space-x-2">
                            <Input type="color" {...field} className="w-16 h-10" />
                            <Input {...field} placeholder="#1E40AF" className="flex-1" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="accentColor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Color de Acento</FormLabel>
                        <FormControl>
                          <div className="flex items-center space-x-2">
                            <Input type="color" {...field} className="w-16 h-10" />
                            <Input {...field} placeholder="#EFF6FF" className="flex-1" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? "Actualizando..." : "Actualizar Institución"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
