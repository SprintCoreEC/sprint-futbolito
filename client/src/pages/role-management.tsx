import React, { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useInstitutionalQuery } from "@/hooks/use-institutional-query";
import { BackButton } from "@/components/ui/back-button";
import { Sidebar } from "@/components/layout/sidebar";
import { usePermissions } from "@/hooks/use-permissions";
import { Plus, Trash2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Checkbox } from "@/components/ui/checkbox";

const createRoleSchema = z.object({
  name: z.string().optional(), // Generated automatically
  displayName: z.string().min(1, "Nombre para mostrar requerido"),
  description: z.string().optional(),
  permissions: z.object({
    dashboard: z.object({ view: z.boolean(), edit: z.boolean() }),
    institutions: z.object({ 
      view: z.boolean(), 
      create: z.boolean(), 
      edit: z.boolean(), 
      delete: z.boolean() 
    }),
    venues: z.object({ 
      view: z.boolean(), 
      create: z.boolean(), 
      edit: z.boolean(), 
      delete: z.boolean() 
    }),
    users: z.object({ 
      view: z.boolean(), 
      create: z.boolean(), 
      edit: z.boolean(), 
      delete: z.boolean() 
    }),
    groups: z.object({ 
      view: z.boolean(), 
      create: z.boolean(), 
      edit: z.boolean(), 
      delete: z.boolean() 
    }),
    athletes: z.object({ 
      view: z.boolean(), 
      create: z.boolean(), 
      edit: z.boolean(), 
      delete: z.boolean() 
    }),
    events: z.object({ 
      view: z.boolean(), 
      create: z.boolean(), 
      edit: z.boolean(), 
      delete: z.boolean() 
    }),
    publications: z.object({ 
      view: z.boolean(), 
      create: z.boolean(), 
      edit: z.boolean(), 
      delete: z.boolean() 
    }),
    notifications: z.object({ 
      view: z.boolean(), 
      create: z.boolean(), 
      edit: z.boolean(), 
      delete: z.boolean() 
    }),
    attendance: z.object({ view: z.boolean(), edit: z.boolean() }),
    reports: z.object({ view: z.boolean(), export: z.boolean() }),
  }),
});

type CreateRoleForm = z.infer<typeof createRoleSchema>;

type CustomRole = {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  permissions: any;
  is_active: boolean;
  created_at: string;
  institution_id?: string;
};

export default function RoleManagement() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<CustomRole | null>(null);
  const [usersWithRole, setUsersWithRole] = useState<any[]>([]);
  const [showReassignDialog, setShowReassignDialog] = useState(false);
  const { toast } = useToast();
  const { hasPermission } = usePermissions();

  // Fetch custom roles - manual approach to debug
  const [roles, setRoles] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  
  const fetchRoles = React.useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Use direct fetch with cache busting since apiRequest has cache issues
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      };
      
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      const directResponse = await fetch('/api/roles', {
        method: 'GET',
        credentials: 'include',
        headers
      });
      
      const data = await directResponse.json();
      setRoles(data?.data || []);
    } catch (error) {
      console.error('Error fetching roles:', error);
      setRoles([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  // Create role mutation
  const createRoleMutation = useMutation({
    mutationFn: async (data: CreateRoleForm) => {
      return apiRequest("POST", "/api/roles", data);
    },
    onSuccess: () => {
      fetchRoles(); // Refresh local data
      queryClient.invalidateQueries({ predicate: (query) => 
        query.queryKey[0]?.toString().startsWith('/api/roles')
      }); // Invalidate global cache
      setIsCreateDialogOpen(false);
      toast({
        title: "Rol creado",
        description: "El rol ha sido creado exitosamente.",
      });
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al crear rol",
        variant: "destructive",
      });
    },
  });

  // Toggle role status mutation
  const toggleRoleStatusMutation = useMutation({
    mutationFn: async ({ roleId, isActive }: { roleId: string; isActive: boolean }) => {
      // Use direct fetch like the others to avoid cache issues
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      };
      
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      const response = await fetch(`/api/roles/${roleId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ is_active: !isActive })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error al actualizar estado del rol: ${response.status}`);
      }
      
      // Check if response is JSON before parsing
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return response.json();
      } else {
        // If not JSON, return a simple success response
        return { success: true };
      }
    },
    onSuccess: () => {
      // Force immediate refresh of local state
      fetchRoles();
      // Also invalidate global cache for roles (used in user-management)
      queryClient.invalidateQueries({ predicate: (query) => 
        query.queryKey[0]?.toString().startsWith('/api/roles')
      });
      toast({
        title: "Estado actualizado",
        description: "El estado del rol ha sido actualizado.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al actualizar estado",
        variant: "destructive",
      });
    },
  });

  // Delete role mutation
  const deleteRoleMutation = useMutation({
    mutationFn: async (roleId: string) => {
      return apiRequest("DELETE", `/api/roles/${roleId}`);
    },
    onSuccess: () => {
      fetchRoles(); // Refresh local data
      queryClient.invalidateQueries({ predicate: (query) => 
        query.queryKey[0]?.toString().startsWith('/api/roles')
      }); // Invalidate global cache
      toast({
        title: "Rol eliminado",
        description: "El rol ha sido eliminado exitosamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al eliminar rol",
        variant: "destructive",
      });
    },
  });

  // Check users count before delete
  const checkUsersCountMutation = useMutation({
    mutationFn: async (roleId: string) => {
      return apiRequest("GET", `/api/roles/${roleId}/users-count`);
    },
  });

  // Get users with specific role
  const getUsersWithRoleMutation = useMutation({
    mutationFn: async (roleId: string) => {
      return apiRequest("GET", `/api/roles/${roleId}/users`);
    },
  });

  // Form setup
  const form = useForm<CreateRoleForm>({
    resolver: zodResolver(createRoleSchema),
    defaultValues: {
      name: "", // Will be auto-generated
      displayName: "",
      description: "",
      permissions: {
        dashboard: { view: true, edit: false },
        institutions: { view: false, create: false, edit: false, delete: false },
        venues: { view: false, create: false, edit: false, delete: false },
        users: { view: false, create: false, edit: false, delete: false },
        groups: { view: true, create: false, edit: false, delete: false },
        athletes: { view: true, create: false, edit: false, delete: false },
        events: { view: true, create: false, edit: false, delete: false },
        publications: { view: false, create: false, edit: false, delete: false },
        notifications: { view: false, create: false, edit: false, delete: false },
        attendance: { view: false, edit: false },
        reports: { view: false, export: false },
      },
    },
  });

  const onSubmit = (data: CreateRoleForm) => {
    // Generate a unique internal name automatically
    const timestamp = Date.now();
    const safeName = data.displayName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
    
    const uniqueData = {
      ...data,
      name: `custom_${safeName}_${timestamp}`
    };
    
    createRoleMutation.mutate(uniqueData);
  };

  const toggleRoleStatus = (role: CustomRole) => {
    toggleRoleStatusMutation.mutate({
      roleId: role.id,
      isActive: role.is_active,
    });
  };

  const deleteRole = async (role: CustomRole) => {
    try {
      const result = await checkUsersCountMutation.mutateAsync(role.id);
      const userCount = result.count;
      
      if (userCount > 0) {
        // Get the list of users with this role
        const usersResult = await getUsersWithRoleMutation.mutateAsync(role.id);
        setUsersWithRole(usersResult.data || []);
        setRoleToDelete(role);
        setShowReassignDialog(true);
        return;
      }
      
      const confirmMessage = "¿Estás seguro de que quieres eliminar este rol? Esta acción no se puede deshacer.";
      
      if (confirm(confirmMessage)) {
        deleteRoleMutation.mutate(role.id);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo verificar los usuarios asignados a este rol.",
        variant: "destructive",
      });
    }
  };

  const modules = [
    { key: "dashboard", label: "Dashboard", actions: ["view", "edit"] },
    { key: "institutions", label: "Instituciones", actions: ["view", "create", "edit", "delete"] },
    { key: "venues", label: "Sedes", actions: ["view", "create", "edit", "delete"] },
    { key: "users", label: "Usuarios", actions: ["view", "create", "edit", "delete"] },
    { key: "groups", label: "Grupos", actions: ["view", "create", "edit", "delete"] },
    { key: "athletes", label: "Deportistas", actions: ["view", "create", "edit", "delete"] },
    { key: "events", label: "Eventos", actions: ["view", "create", "edit", "delete"] },
    { key: "publications", label: "Publicaciones", actions: ["view", "create", "edit", "delete"] },
    { key: "notifications", label: "Notificaciones", actions: ["view", "create", "edit", "delete"] },
    { key: "attendance", label: "Asistencias", actions: ["view", "edit"] },
    { key: "reports", label: "Reportes", actions: ["view", "export"] },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="p-6">
          <BackButton />
          <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Roles</h1>
          <p className="text-muted-foreground">
            Crea y administra roles personalizados con permisos específicos.
            <br />
            <strong>Nota:</strong> Para modificar un rol, elimínalo y crea uno nuevo.
          </p>
        </div>
        
        {hasPermission('colaboradores', 'create') && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-role">
                <Plus className="h-4 w-4 mr-2" />
                Crear Rol
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Crear Nuevo Rol</DialogTitle>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 gap-4">
                    <FormField
                      control={form.control}
                      name="displayName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre del Rol</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="ej: Entrenador Personalizado" data-testid="input-display-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descripción (Opcional)</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="Descripción del rol..." data-testid="textarea-description" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div>
                    <h3 className="text-lg font-semibold mb-4">Permisos por Módulo</h3>
                    <div className="grid gap-4">
                      {modules.map((module) => (
                        <div key={module.key} className="border rounded-lg p-4">
                          <h4 className="font-medium mb-3">{module.label}</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {module.actions.map((action) => (
                              <FormField
                                key={`${module.key}-${action}`}
                                control={form.control}
                                name={`permissions.${module.key}.${action}` as any}
                                render={({ field }) => (
                                  <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                        data-testid={`checkbox-${module.key}-${action}`}
                                      />
                                    </FormControl>
                                    <FormLabel className="text-sm font-normal cursor-pointer">
                                      {action === "view" && "Ver"}
                                      {action === "create" && "Crear"}
                                      {action === "edit" && "Editar"}
                                      {action === "delete" && "Eliminar"}
                                      {action === "export" && "Exportar"}
                                    </FormLabel>
                                  </FormItem>
                                )}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreateDialogOpen(false)}
                      data-testid="button-cancel"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={createRoleMutation.isPending}
                      data-testid="button-submit"
                    >
                      {createRoleMutation.isPending ? "Creando..." : "Crear Rol"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>

        {isLoading ? (
          <div className="text-center py-8">Cargando roles...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Nombre para Mostrar</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Permisos</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.length > 0 ? (
                roles.map((role: CustomRole) => (
                  <TableRow key={role.id}>
                    <TableCell className="font-medium">{role.name}</TableCell>
                    <TableCell>{role.display_name}</TableCell>
                    <TableCell className="max-w-xs truncate">{role.description || "-"}</TableCell>
                    <TableCell className="max-w-xs">
                      <div className="text-xs text-gray-600">
                        {Object.entries(role.permissions || {}).filter(([_, perms]: [string, any]) => 
                          Object.values(perms).some(p => p === true)
                        ).map(([module, _]) => module).join(", ") || "Sin permisos"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={role.is_active ? "default" : "secondary"}>
                        {role.is_active ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {hasPermission('colaboradores', 'edit') && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleRoleStatus(role)}
                            disabled={toggleRoleStatusMutation.isPending}
                            data-testid={`button-toggle-status-${role.id}`}
                          >
                            {role.is_active ? (
                              <>
                                <X className="h-4 w-4 mr-1" />
                                Desactivar
                              </>
                            ) : (
                              <>
                                <Check className="h-4 w-4 mr-1" />
                                Activar
                              </>
                            )}
                          </Button>
                        )}
                        {hasPermission('colaboradores', 'delete') && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteRole(role)}
                            disabled={deleteRoleMutation.isPending}
                            data-testid={`button-delete-${role.id}`}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Eliminar
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    No hay roles personalizados creados
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}

        </div>
      </div>

      {/* Dialog de reasignación de usuarios */}
      <Dialog open={showReassignDialog} onOpenChange={setShowReassignDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>No se puede eliminar el rol</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              El rol <strong>{roleToDelete?.display_name}</strong> está asignado a los siguientes usuarios:
            </p>
            
            <div className="max-h-60 overflow-y-auto border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersWithRole.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.first_name} {user.last_name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
              <p className="text-amber-800 text-sm">
                <strong>Para eliminar este rol:</strong>
                <br />
                1. Ve a <strong>Gestión de Usuarios</strong>
                <br />
                2. Edita cada usuario listado arriba
                <br />
                3. Asigna un nuevo rol a cada usuario
                <br />
                4. Regresa aquí e intenta eliminar el rol nuevamente
              </p>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowReassignDialog(false)}
              >
                Entendido
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}