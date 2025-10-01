import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useInstitutionalQuery } from "@/hooks/use-institutional-query";
import { BackButton } from "@/components/ui/back-button";
import { Sidebar } from "@/components/layout/sidebar";
import { usePermissions } from "@/hooks/use-permissions";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import type { Institution, Venue, UserWithColaborador } from "@shared/schema";
import { Plus, Edit, Trash2, UserCheck, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { User } from "@shared/schema";

const createUserSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      "La contraseña debe contener al menos: 1 mayúscula, 1 minúscula, 1 número y 1 carácter especial"),
  confirmPassword: z.string(),
  firstName: z.string().min(1, "Nombre requerido"),
  lastName: z.string().min(1, "Apellido requerido"),
  role: z.string().min(1, "Rol requerido"),
  phone: z.string()
    .min(10, "El teléfono debe tener exactamente 10 dígitos")
    .max(10, "El teléfono debe tener exactamente 10 dígitos")
    .regex(/^\d{10}$/, "El teléfono debe contener solo números"),
  institutionId: z.string().optional(),
  venueId: z.string().optional(),
  isColaborador: z.boolean().optional(),
  // Colaborador fields - make required when isColaborador is true
  cityId: z.string().min(1, "Ciudad requerida"),
  cedula: z.string()
    .min(10, "La cédula debe tener exactamente 10 dígitos")
    .max(10, "La cédula debe tener exactamente 10 dígitos")
    .regex(/^\d{10}$/, "La cédula debe contener solo números"),
  birthDate: z.string().min(1, "Fecha de nacimiento requerida"),
  address: z.string().optional(),
  startContract: z.string().optional(),
  endContract: z.string().optional(),
  observations: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

const editUserSchema = z.object({
  email: z.string().email("Email inválido"),
  firstName: z.string().min(1, "Nombre requerido"),
  lastName: z.string().min(1, "Apellido requerido"),
  role: z.string().min(1, "Rol requerido"),
  phone: z.string()
    .min(10, "El teléfono debe tener exactamente 10 dígitos")
    .max(10, "El teléfono debe tener exactamente 10 dígitos")
    .regex(/^\d{10}$/, "El teléfono debe contener solo números"),
  institutionId: z.string().optional(),
  venueId: z.string().optional(),
  isActive: z.boolean().optional(),
  isColaborador: z.boolean().optional(),
  // Colaborador fields - required when isColaborador is true
  cityId: z.string().min(1, "Ciudad requerida"),
  cedula: z.string()
    .min(10, "La cédula debe tener exactamente 10 dígitos")
    .max(10, "La cédula debe tener exactamente 10 dígitos")
    .regex(/^\d{10}$/, "La cédula debe contener solo números"),
  birthDate: z.string().min(1, "Fecha de nacimiento requerida"),
  address: z.string().optional(),
  startContract: z.string().optional(),
  endContract: z.string().optional(),
  observations: z.string().optional(),
});

type CreateUserForm = z.infer<typeof createUserSchema>;
type EditUserForm = z.infer<typeof editUserSchema>;

const roleLabels = {
  super_admin: "Super Administrador",
  admin_institucion: "Administrador de Institución",
  admin_sede: "Administrador de Sede",
  entrenador: "Entrenador",
  secretario: "Secretario",
  representante: "Representante",
  deportista: "Deportista",
};


// Removed isStaffRoleCheck function - now using explicit isColaborador boolean

export default function UserManagement() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedInstitutionId, setSelectedInstitutionId] = useState("");
  const [selectedProvinceId, setSelectedProvinceId] = useState("");
  const [selectedEditInstitutionId, setSelectedEditInstitutionId] = useState("");
  const [selectedEditProvinceId, setSelectedEditProvinceId] = useState("");
  const [userToEdit, setUserToEdit] = useState<UserWithColaborador | null>(null);
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';

  // Get users query
  const { data: users, isLoading } = useInstitutionalQuery<{ success: boolean; data: UserWithColaborador[] }>(
    "/api/users"
  );

  // Get roles for dropdown
  const { data: rolesResponse } = useInstitutionalQuery<{ success: boolean; data: any[] }>(
    "/api/roles"
  );

  const roles = rolesResponse?.data || [];
  

  // Get institutions (only for super admin)
  const { data: institutionsResponse } = useQuery<{ success: boolean; data: Institution[] }>({
    queryKey: ["/api/institutions"],
    enabled: isSuperAdmin,
  });

  const institutions = institutionsResponse?.data || [];

  // Get venues for selected institution (or user's institution if not super admin)
  const institutionIdForVenues = isSuperAdmin ? selectedInstitutionId : user?.institutionId;
  const { data: venuesResponse } = useInstitutionalQuery<{ success: boolean; data: Venue[] }>(
    "/api/venues"
  );

  const venues = venuesResponse?.data?.filter((venue: Venue) => {
    if (isSuperAdmin) {
      // For super admin, show venues of the selected institution, or empty array if no institution selected
      return selectedInstitutionId ? venue.institutionId === selectedInstitutionId : false;
    } else {
      // For institutional users, show venues of their institution
      return venue.institutionId === user?.institutionId;
    }
  }) || [];

  // Get venues for edit dialog
  const editVenues = venuesResponse?.data?.filter((venue: Venue) => {
    if (isSuperAdmin) {
      // For super admin, show venues of the selected edit institution
      return selectedEditInstitutionId ? venue.institutionId === selectedEditInstitutionId : false;
    } else {
      // For institutional users, show venues of their institution
      return venue.institutionId === user?.institutionId;
    }
  }) || [];

  // Create user mutation
  const createUserMutation = useMutation({
    mutationFn: async (userData: CreateUserForm) => {
      return apiRequest("POST", "/api/users", userData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsCreateDialogOpen(false);
      toast({
        title: "Usuario creado",
        description: "El usuario ha sido creado exitosamente.",
      });
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al crear usuario",
        variant: "destructive",
      });
    },
  });

  // Toggle user status mutation
  const toggleUserStatusMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      return apiRequest("PATCH", `/api/users/${userId}`, { is_active: !isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Estado actualizado",
        description: "El estado del usuario ha sido actualizado.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al actualizar usuario",
        variant: "destructive",
      });
    },
  });

  // Edit user mutation
  const editUserMutation = useMutation({
    mutationFn: async ({ userId, userData }: { userId: string; userData: EditUserForm }) => {
      return apiRequest("PATCH", `/api/users/${userId}`, userData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsEditDialogOpen(false);
      setUserToEdit(null);
      toast({
        title: "Usuario actualizado",
        description: "El usuario ha sido actualizado exitosamente.",
      });
      editForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al actualizar usuario",
        variant: "destructive",
      });
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return apiRequest("DELETE", `/api/users/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Usuario eliminado",
        description: "El usuario ha sido eliminado exitosamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al eliminar usuario",
        variant: "destructive",
      });
    },
  });

  // Get provinces for dropdown
  const { data: provincesResponse } = useQuery<{ success: boolean; data: any[] }>({
    queryKey: ["/api/provinces"],
  });
  const provinces = provincesResponse?.data || [];

  // Get cities for selected province (create form)
  const { data: citiesResponse } = useInstitutionalQuery<{ success: boolean; data: any[] }>(
    `/api/cities${selectedProvinceId ? `?provinceId=${selectedProvinceId}` : ''}`,
    { enabled: !!selectedProvinceId }
  );
  const cities = citiesResponse?.data || [];

  // Get cities for selected province (edit form)
  const { data: editCitiesResponse } = useInstitutionalQuery<{ success: boolean; data: any[] }>(
    `/api/cities${selectedEditProvinceId ? `?provinceId=${selectedEditProvinceId}` : ''}`,
    { enabled: !!selectedEditProvinceId }
  );
  const editCities = editCitiesResponse?.data || [];

  // Form setup for creating users
  const form = useForm<CreateUserForm>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      role: "deportista",
      phone: "",
      institutionId: "",
      venueId: "",
      isColaborador: false,
      cityId: "",
      cedula: "",
      birthDate: "",
      address: "",
      startContract: "",
      endContract: "",
      observations: "",
    },
  });

  // Form setup for editing users
  const editForm = useForm<EditUserForm>({
    resolver: zodResolver(editUserSchema),
  });

  const onSubmit = (data: CreateUserForm) => {
    // Send the role directly as selected from dropdown
    // Both predefined and custom roles should be sent as 'role'
    const apiData = {
      ...data,
      permissions: {} // Initialize empty permissions
    };
    
    createUserMutation.mutate(apiData);
  };

  // Check if user is marked as colaborador
  const isColaborador = form.watch("isColaborador");
  const isEditColaborador = editForm.watch("isColaborador");

  const onEditSubmit = (data: EditUserForm) => {
    if (userToEdit) {
      // Send the role directly as selected from dropdown
      // Both predefined and custom roles should be sent as 'role'
      const apiData = {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        phone: data.phone,
        institutionId: data.institutionId,
        venueId: data.venueId,
        is_active: data.isActive,
        isColaborador: data.isColaborador,
        // Include colaborador fields
        cityId: data.cityId,
        cedula: data.cedula,
        birthDate: data.birthDate,
        address: data.address,
        startContract: data.startContract,
        endContract: data.endContract,
        observations: data.observations
      };
      
      editUserMutation.mutate({ userId: userToEdit.id, userData: apiData });
    }
  };

  const openEditDialog = async (user: UserWithColaborador) => {
    setUserToEdit(user);
    
    // Get colaborador data for the user if it exists
    let colaboradorData = null;
    try {
      const response: any = await apiRequest("GET", `/api/users/${user.id}/colaborador`);
      colaboradorData = response.data;
    } catch (error) {
      // User might not have colaborador data, which is fine
      console.log("No colaborador data found for user");
    }

    // If user has cityId, find and set the province
    let userProvinceId = "";
    if (colaboradorData?.cityId) {
      try {
        const cityResponse: any = await apiRequest("GET", `/api/cities/${colaboradorData.cityId}`);
        userProvinceId = cityResponse.data?.provinceId || "";
      } catch (error) {
        console.log("Could not find province for city");
      }
    }
    
    // Set the province for edit dialog
    setSelectedEditProvinceId(userProvinceId);
    setSelectedEditInstitutionId(user.institutionId || "");
    
    editForm.reset({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role, // Use the role directly from database
      phone: user.phone || "",
      institutionId: user.institutionId || "",
      venueId: (user.venueIds as string[])?.[0] || "", // Take first venue if multiple
      isActive: user.isActive ?? false,
      isColaborador: colaboradorData?.id ? true : false,
      // Include colaborador fields
      cityId: colaboradorData?.cityId || "",
      cedula: colaboradorData?.cedula || "",
      birthDate: colaboradorData?.birthDate || "",
      address: colaboradorData?.address || "",
      startContract: colaboradorData?.startContract || "",
      endContract: colaboradorData?.endContract || "",
      observations: colaboradorData?.observations || ""
    });
    setIsEditDialogOpen(true);
  };

  const toggleUserStatus = (user: UserWithColaborador) => {
    toggleUserStatusMutation.mutate({
      userId: user.id,
      isActive: user.isActive || false,
    });
  };

  const deleteUser = (userId: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar este usuario? Esta acción no se puede deshacer.")) {
      deleteUserMutation.mutate(userId);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="p-6">
          <BackButton />
          <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
          <p className="text-muted-foreground">
            Administra los usuarios del sistema
          </p>
        </div>
        
        {hasPermission('colaboradores', 'create') && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-user">
                <Plus className="mr-2 h-4 w-4" />
                Crear Usuario
              </Button>
            </DialogTrigger>
          <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Usuario</DialogTitle>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-firstName" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Apellido</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-lastName" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} data-testid="input-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contraseña</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} data-testid="input-password" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmar Contraseña</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} data-testid="input-confirm-password" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rol</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-role">
                            <SelectValue placeholder="Seleccionar rol" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(roleLabels).map(([value, label]) => (
                            <SelectItem key={`predefined-${value}`} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                          {roles
                            .filter((role) => role.isActive || role.is_active)
                            .map((role) => (
                            <SelectItem key={`custom-${role.id}`} value={role.name}>
                              {role.display_name || role.displayName} (Personalizado)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isColaborador"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value || false}
                          onChange={(e) => field.onChange(e.target.checked)}
                          className="mt-1"
                          data-testid="checkbox-colaborador"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm font-normal">
                          Es Colaborador
                        </FormLabel>
                        <FormDescription>
                          Marcar si este usuario es un colaborador (requiere información adicional)
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teléfono</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-phone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Campos de institución y sede solo para super admin */}
                {isSuperAdmin && (
                  <>
                    <FormField
                      control={form.control}
                      name="institutionId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Institución (Opcional)</FormLabel>
                          <Select 
                            onValueChange={(value) => {
                              const institutionId = value === "none" ? "" : value;
                              field.onChange(institutionId);
                              setSelectedInstitutionId(institutionId);
                              // Reset venue when institution changes
                              form.setValue("venueId", "");
                            }} 
                            value={field.value || "none"}
                          >
                            <FormControl>
                              <SelectTrigger data-testid="select-institution">
                                <SelectValue placeholder="Seleccionar institución" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">Sin institución específica</SelectItem>
                              {institutions.map((institution) => (
                                <SelectItem key={institution.id} value={institution.id}>
                                  {institution.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {selectedInstitutionId && (
                      <FormField
                        control={form.control}
                        name="venueId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Sede (Opcional)</FormLabel>
                            <Select onValueChange={(value) => {
                              const venueId = value === "none" ? "" : value;
                              field.onChange(venueId);
                            }} value={field.value || "none"}>
                              <FormControl>
                                <SelectTrigger data-testid="select-venue">
                                  <SelectValue placeholder="Seleccionar sede" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="none">Toda la institución</SelectItem>
                                {venues.map((venue) => (
                                  <SelectItem key={venue.id} value={venue.id}>
                                    {venue.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </>
                )}

                {/* Para usuarios institucionales, solo mostrar sedes de su institución */}
                {!isSuperAdmin && user?.institutionId && (
                  <FormField
                    control={form.control}
                    name="venueId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sede (Opcional)</FormLabel>
                        <Select onValueChange={(value) => {
                          const venueId = value === "none" ? "" : value;
                          field.onChange(venueId);
                        }} value={field.value || "none"}>
                          <FormControl>
                            <SelectTrigger data-testid="select-venue">
                              <SelectValue placeholder="Seleccionar sede" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">Toda la institución</SelectItem>
                            {venues.map((venue) => (
                              <SelectItem key={venue.id} value={venue.id}>
                                {venue.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Campos de colaborador */}
                {isColaborador && (
                  <div className="space-y-4 pt-4 border-t">
                    <h4 className="font-semibold text-sm text-muted-foreground">Información de Colaborador</h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="cedula"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cédula</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-cedula" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="birthDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Fecha de Nacimiento</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} data-testid="input-birthDate" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dirección (Opcional)</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-address" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Provincia (Opcional)</Label>
                        <Select 
                          onValueChange={(value) => {
                            const provinceId = value === "none" ? "" : value;
                            setSelectedProvinceId(provinceId);
                            // Clear city when province changes
                            form.setValue("cityId", "");
                          }} 
                          value={selectedProvinceId || "none"}
                        >
                          <SelectTrigger data-testid="select-province">
                            <SelectValue placeholder="Seleccionar provincia" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Sin provincia específica</SelectItem>
                            {provinces.map((province) => (
                              <SelectItem key={province.id} value={province.id}>
                                {province.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {selectedProvinceId && (
                        <FormField
                          control={form.control}
                          name="cityId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Ciudad</FormLabel>
                              <Select 
                                onValueChange={(value) => {
                                  const cityId = value === "none" ? "" : value;
                                  field.onChange(cityId);
                                }} 
                                value={field.value || "none"}
                              >
                                <FormControl>
                                  <SelectTrigger data-testid="select-city">
                                    <SelectValue placeholder="Seleccionar ciudad" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="none">Sin ciudad específica</SelectItem>
                                  {cities.map((city: any) => (
                                    <SelectItem key={city.id} value={city.id}>
                                      {city.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="startContract"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Inicio de Contrato (Opcional)</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} data-testid="input-startContract" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="endContract"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Fin de Contrato (Opcional)</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} data-testid="input-endContract" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="observations"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Observaciones (Opcional)</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-observations" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-4">
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
                    disabled={createUserMutation.isPending}
                    data-testid="button-submit"
                  >
                    {createUserMutation.isPending ? "Creando..." : "Crear Usuario"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        )}

        {/* Edit User Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Usuario</DialogTitle>
            </DialogHeader>
            
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-edit-firstName" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Apellido</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-edit-lastName" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={editForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          {...field} 
                          disabled 
                          className="bg-muted cursor-not-allowed"
                          data-testid="input-edit-email" 
                        />
                      </FormControl>
                      <FormDescription>
                        El email no puede ser modificado
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teléfono</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-edit-phone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rol</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-edit-role">
                            <SelectValue placeholder="Seleccionar rol" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(roleLabels).map(([value, label]) => (
                            <SelectItem key={`predefined-${value}`} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                          {roles
                            .filter((role) => role.isActive || role.is_active)
                            .map((role) => (
                            <SelectItem key={`custom-edit-${role.id}`} value={role.name}>
                              {role.display_name || role.displayName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="isColaborador"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value || false}
                          onChange={(e) => field.onChange(e.target.checked)}
                          className="mt-1"
                          data-testid="checkbox-edit-colaborador"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm font-normal">
                          Es Colaborador
                        </FormLabel>
                        <FormDescription>
                          Marcar si este usuario es un colaborador (requiere información adicional)
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                {/* Campos de institución y sede solo para super admin */}
                {isSuperAdmin && (
                  <>
                    <FormField
                      control={editForm.control}
                      name="institutionId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Institución (Opcional)</FormLabel>
                          <Select 
                            onValueChange={(value) => {
                              const institutionId = value === "none" ? "" : value;
                              field.onChange(institutionId);
                              setSelectedEditInstitutionId(institutionId);
                              // Reset venue when institution changes
                              editForm.setValue("venueId", "");
                            }} 
                            value={field.value || "none"}
                          >
                            <FormControl>
                              <SelectTrigger data-testid="select-edit-institution">
                                <SelectValue placeholder="Seleccionar institución" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">Sin institución específica</SelectItem>
                              {institutions.map((institution) => (
                                <SelectItem key={institution.id} value={institution.id}>
                                  {institution.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {selectedEditInstitutionId && (
                      <FormField
                        control={editForm.control}
                        name="venueId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Sede (Opcional)</FormLabel>
                            <Select onValueChange={(value) => {
                              const venueId = value === "none" ? "" : value;
                              field.onChange(venueId);
                            }} value={field.value || "none"}>
                              <FormControl>
                                <SelectTrigger data-testid="select-edit-venue">
                                  <SelectValue placeholder="Seleccionar sede" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="none">Toda la institución</SelectItem>
                                {editVenues.map((venue) => (
                                  <SelectItem key={venue.id} value={venue.id}>
                                    {venue.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </>
                )}

                {/* Para usuarios institucionales, solo mostrar sedes de su institución */}
                {!isSuperAdmin && user?.institutionId && (
                  <FormField
                    control={editForm.control}
                    name="venueId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sede (Opcional)</FormLabel>
                        <Select onValueChange={(value) => {
                          const venueId = value === "none" ? "" : value;
                          field.onChange(venueId);
                        }} value={field.value || "none"}>
                          <FormControl>
                            <SelectTrigger data-testid="select-edit-venue">
                              <SelectValue placeholder="Seleccionar sede" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">Toda la institución</SelectItem>
                            {editVenues.map((venue) => (
                              <SelectItem key={venue.id} value={venue.id}>
                                {venue.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Estado del usuario */}
                <FormField
                  control={editForm.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value || false}
                          onChange={(e) => field.onChange(e.target.checked)}
                          data-testid="checkbox-edit-isActive"
                          className="mt-1"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Usuario Activo</FormLabel>
                        <FormDescription>
                          Permitir que el usuario acceda al sistema
                        </FormDescription>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Campos de colaborador */}
                {isEditColaborador && (
                  <div className="space-y-4 pt-4 border-t">
                    <h4 className="font-semibold text-sm text-muted-foreground">Información de Colaborador</h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={editForm.control}
                        name="cedula"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cédula</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-edit-cedula" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={editForm.control}
                        name="birthDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Fecha de Nacimiento</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} data-testid="input-edit-birthDate" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={editForm.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dirección (Opcional)</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-edit-address" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Provincia (Opcional)</Label>
                        <Select 
                          onValueChange={(value) => {
                            const provinceId = value === "none" ? "" : value;
                            setSelectedEditProvinceId(provinceId);
                            // Clear city when province changes
                            editForm.setValue("cityId", "");
                          }} 
                          value={selectedEditProvinceId || "none"}
                        >
                          <SelectTrigger data-testid="select-edit-province">
                            <SelectValue placeholder="Seleccionar provincia" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Sin provincia específica</SelectItem>
                            {provinces.map((province) => (
                              <SelectItem key={province.id} value={province.id}>
                                {province.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {selectedEditProvinceId && (
                        <FormField
                          control={editForm.control}
                          name="cityId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Ciudad</FormLabel>
                              <Select 
                                onValueChange={(value) => {
                                  const cityId = value === "none" ? "" : value;
                                  field.onChange(cityId);
                                }} 
                                value={field.value || "none"}
                              >
                                <FormControl>
                                  <SelectTrigger data-testid="select-edit-city">
                                    <SelectValue placeholder="Seleccionar ciudad" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="none">Sin ciudad específica</SelectItem>
                                  {editCities.map((city: any) => (
                                    <SelectItem key={city.id} value={city.id}>
                                      {city.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={editForm.control}
                        name="startContract"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Inicio de Contrato (Opcional)</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} data-testid="input-edit-startContract" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={editForm.control}
                        name="endContract"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Fin de Contrato (Opcional)</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} data-testid="input-edit-endContract" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={editForm.control}
                      name="observations"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Observaciones (Opcional)</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-edit-observations" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsEditDialogOpen(false)}
                    data-testid="button-edit-cancel"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={editUserMutation.isPending}
                    data-testid="button-edit-submit"
                  >
                    {editUserMutation.isPending ? "Actualizando..." : "Actualizar Usuario"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

      </div>

      {/* Users Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead>Institución</TableHead>
              <TableHead>Sede</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Cédula</TableHead>
              <TableHead>Ciudad</TableHead>
              <TableHead>Contrato</TableHead>
              <TableHead>Última Conexión</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={12} className="text-center py-8">
                  Cargando usuarios...
                </TableCell>
              </TableRow>
            ) : users?.data?.length ? (
              users.data.map((user) => (
                <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                  <TableCell data-testid={`text-name-${user.id}`}>
                    <div className="font-medium">
                      {user.firstName} {user.lastName}
                    </div>
                  </TableCell>
                  <TableCell data-testid={`text-email-${user.id}`}>
                    {user.email}
                  </TableCell>
                  <TableCell data-testid={`text-phone-${user.id}`}>
                    {user.phone || "—"}
                  </TableCell>
                  <TableCell data-testid={`text-institution-${user.id}`}>
                    {(() => {
                      const institution = institutions.find(i => i.id === user.institutionId);
                      return institution?.name || "—";
                    })()}
                  </TableCell>
                  <TableCell data-testid={`text-venue-${user.id}`}>
                    {(() => {
                      const venue = venues.find(v => (user.venueIds as string[])?.includes(v.id));
                      return venue?.name || "Toda la institución";
                    })()}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" data-testid={`badge-role-${user.id}`}>
                      {(() => {
                        // Check if user.role is a custom role (starts with "custom_")
                        if (user.role?.startsWith('custom_')) {
                          // Find the custom role display name
                          const role = roles.find(r => r.name === user.role);
                          return role?.displayName || role?.display_name || user.role;
                        }
                        
                        // Use predefined role label
                        return roleLabels[user.role as keyof typeof roleLabels];
                      })()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={user.isActive ? "default" : "destructive"}
                      data-testid={`badge-status-${user.id}`}
                    >
                      {user.isActive ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  
                  {/* Colaborador information columns */}
                  <TableCell data-testid={`text-cedula-${user.id}`}>
                    {user.colaborador?.cedula ? user.colaborador.cedula : "—"}
                  </TableCell>
                  <TableCell data-testid={`text-city-${user.id}`}>
                    {user.colaborador?.city ? 
                      `${user.colaborador.city.name}, ${user.colaborador.city.province?.name || ''}` : "—"}
                  </TableCell>
                  <TableCell data-testid={`text-contract-${user.id}`}>
                    {user.colaborador?.startContract ? (
                      <div className="text-sm">
                        <div>Inicio: {new Date(user.colaborador.startContract).toLocaleDateString()}</div>
                        {user.colaborador.endContract && (
                          <div>Fin: {new Date(user.colaborador.endContract).toLocaleDateString()}</div>
                        )}
                      </div>
                    ) : "—"}
                  </TableCell>
                  
                  <TableCell data-testid={`text-last-login-${user.id}`}>
                    {user.createdAt 
                      ? new Date(user.createdAt).toLocaleDateString() 
                      : "Nunca"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {hasPermission('colaboradores', 'edit') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleUserStatus(user)}
                          disabled={toggleUserStatusMutation.isPending}
                          data-testid={`button-toggle-status-${user.id}`}
                        >
                          {user.isActive ? (
                            <>
                              <UserX className="h-4 w-4 mr-1" />
                              Desactivar
                            </>
                          ) : (
                            <>
                              <UserCheck className="h-4 w-4 mr-1" />
                              Activar
                            </>
                          )}
                        </Button>
                      )}
                      {hasPermission('colaboradores', 'edit') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(user)}
                          data-testid={`button-edit-${user.id}`}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                      )}
                      {hasPermission('colaboradores', 'delete') && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteUser(user.id)}
                          disabled={deleteUserMutation.isPending}
                          data-testid={`button-delete-${user.id}`}
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
                <TableCell colSpan={12} className="text-center py-8">
                  No hay usuarios registrados
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
          </div>
        </div>
      </div>
    </div>
  );
}