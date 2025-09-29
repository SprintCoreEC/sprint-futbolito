import type { Express } from "express";
import { createServer, type Server } from "http";
import jwt from 'jsonwebtoken';
import { storage } from "./storage";
import { authenticate, authorize, authorizeWithPermissions, AuthenticatedRequest } from "./services/auth";
import { 
  insertInstitutionSchema, insertVenueSchema, insertUserSchema, 
  insertGroupSchema, insertAthleteSchema, insertEventSchema,
  insertPublicationSchema, insertNotificationSchema,
  insertProvinceSchema, insertCitySchema, insertColaboradorSchema
} from "@shared/schema";
import { z } from "zod";

// Helper function to clean date fields - converts empty strings to null
function cleanDateFields(data: any) {
  const cleaned = { ...data };
  const dateFields = ['birthDate', 'startContract', 'endContract'];
  
  dateFields.forEach(field => {
    if (cleaned[field] === "" || cleaned[field] === undefined) {
      cleaned[field] = null;
    }
  });
  
  return cleaned;
}


export async function registerRoutes(app: Express): Promise<Server> {
  // User management routes (Admin only)
  app.get("/api/users", authenticate, authorizeWithPermissions("users", "view"), async (req: AuthenticatedRequest, res) => {
    try {
      const { institutionId, role } = req.user!;
      const { contextInstitutionId } = req.query;
      
      // Use direct Supabase call for better performance
      const { supabaseAdmin } = await import("./services/supabase");
      
      let query = supabaseAdmin
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      
      // Determinar qué usuarios mostrar
      if (contextInstitutionId && role === 'super_admin') {
        // Super admin navegando dentro de una institución específica
        // Solo usuarios de esa institución, excluyendo roles del sistema
        query = query
          .eq('institution_id', contextInstitutionId)
          .not('role', 'in', '(super_admin)');
      } else if (role === 'super_admin') {
        // Super admin en vista global: ve todos los usuarios
      } else if (institutionId) {
        // Usuarios institucionales solo ven usuarios de su institución
        // Y excluyen roles del sistema
        query = query
          .eq('institution_id', institutionId)
          .not('role', 'in', '(super_admin)');
      }
      
      const { data, error } = await query;

      if (error) throw error;
      
      // Get colaborador information for users who have colaborador records
      let colaboradoresMap = new Map();
      if (data && data.length > 0) {
        const { data: colaboradores } = await supabaseAdmin
          .from('colaboradores')
          .select(`
            *,
            cities(
              id, name,
              provinces(id, name)
            )
          `)
          .in('user_id', data.map(u => u.id));
          
        colaboradores?.forEach(col => {
          colaboradoresMap.set(col.user_id, {
            id: col.id,
            userId: col.user_id,
            institutionId: col.institution_id,
            customRoleId: col.custom_role_id,
            cityId: col.city_id,
            cedula: col.cedula,
            birthDate: col.birth_date,
            address: col.address,
            startContract: col.start_contract,
            endContract: col.end_contract,
            observations: col.observations,
            isActive: col.is_active,
            createdAt: col.created_at,
            updatedAt: col.updated_at,
            city: col.cities ? {
              id: col.cities.id,
              name: col.cities.name,
              province: col.cities.provinces ? {
                id: col.cities.provinces.id,
                name: col.cities.provinces.name
              } : null
            } : null
          });
        });
      }
      
      // Map database fields to frontend expectations
      const mappedData = data?.map(user => ({
        ...user,
        firstName: user.first_name,
        lastName: user.last_name,
        isActive: user.is_active,
        institutionId: user.institution_id,
        venueIds: user.venue_ids,
        groupIds: user.group_ids,
        avatarUrl: user.avatar_url,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        colaborador: colaboradoresMap.get(user.id) || null
      }));
      
      res.json({ success: true, data: mappedData || [] });
    } catch (error) {
      console.error('Users error:', error);
      res.status(500).json({ success: false, error: "Error al obtener usuarios" });
    }
  });

  app.post("/api/users", authenticate, authorize(["super_admin", "admin_institucion"]), async (req: AuthenticatedRequest, res) => {
    try {
      const { 
        email, password, firstName, lastName, role, phone, institutionId, venueId, isColaborador,
        // Colaborador fields (optional, only when isColaborador is true)
        cityId, cedula, birthDate, address, startContract, endContract, observations
      } = req.body;
      
      // Import supabase admin early for use throughout the function
      const { supabaseAdmin } = await import("./services/supabase");
      
      // Role restrictions for security - dynamic validation
      const userRole = req.user?.role;
      
      // Critical security check: admin_institucion cannot create super_admin
      if (userRole === 'admin_institucion' && role === 'super_admin') {
        return res.status(403).json({ 
          success: false, 
          error: 'No tienes permisos para crear usuarios con el rol super_admin' 
        });
      }
      
      // Define system roles that are always allowed
      const systemRoles = ['super_admin', 'admin_institucion', 'admin_sede', 'entrenador', 'asistente', 'director_tecnico', 'secretario', 'representante', 'deportista'];
      const allowedSystemRolesByUserRole = {
        super_admin: systemRoles,
        admin_institucion: systemRoles.filter(r => r !== 'super_admin')
      };
      
      // Check if it's a system role
      const isSystemRole = systemRoles.includes(role);
      
      if (isSystemRole) {
        // Validate system role assignment permissions
        const allowedSystemRoles = allowedSystemRolesByUserRole[userRole as keyof typeof allowedSystemRolesByUserRole] || [];
        if (!allowedSystemRoles.includes(role)) {
          return res.status(403).json({ 
            success: false, 
            error: `No tienes permisos para crear usuarios con el rol ${role}` 
          });
        }
      } else {
        // For custom roles, check if they exist in the database
        try {
          const { data: customRole, error: roleError } = await supabaseAdmin
            .from('custom_roles')
            .select('id, name, is_active')
            .eq('name', role)
            .eq('is_active', true)
            .single();
          
          if (roleError || !customRole) {
            return res.status(400).json({
              success: false,
              error: `El rol personalizado '${role}' no existe o no está activo`
            });
          }
          
          // For institution admins, ensure the custom role belongs to their institution
          if (userRole === 'admin_institucion' && req.user?.institutionId) {
            const { data: roleCheck } = await supabaseAdmin
              .from('custom_roles')
              .select('institution_id')
              .eq('name', role)
              .single();
              
            if (roleCheck?.institution_id && roleCheck.institution_id !== req.user.institutionId) {
              return res.status(403).json({
                success: false,
                error: 'No tienes permisos para usar este rol personalizado'
              });
            }
          }
        } catch (error) {
          console.error('Error validating custom role:', error);
          return res.status(500).json({
            success: false,
            error: 'Error al validar el rol personalizado'
          });
        }
      }
      
      // Validate base user data
      const baseUserValidation = insertUserSchema.pick({
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phone: true
      }).parse({
        email, firstName, lastName, role, phone
      });
      
      // Initialize colaborador data
      let colaboradorData = null;
      
      // Check if user already exists first
      const { data: existingUser } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      if (existingUser) {
        return res.status(400).json({ 
          success: false, 
          error: "Ya existe un usuario con este email" 
        });
      }
      
      // Determine institution and venue assignment BEFORE creating auth user
      let assignedInstitutionId: string | null = null;
      let assignedVenueIds: string[] = [];

      if (req.user?.role === 'super_admin') {
        // Super admin can assign any institution/venue
        if (institutionId) {
          assignedInstitutionId = institutionId;
          if (venueId) {
            assignedVenueIds = [venueId];
          }
        }
      } else if (req.user?.role === 'admin_institucion' && req.user?.institutionId) {
        // Institution admin can only assign venues within their institution
        assignedInstitutionId = req.user.institutionId;
        if (venueId) {
          // Validate that the venue belongs to the institution
          const { data: venue } = await supabaseAdmin
            .from('venues')
            .select('id')
            .eq('id', venueId)
            .eq('institution_id', req.user.institutionId)
            .single();
          
          if (venue) {
            assignedVenueIds = [venueId];
          }
        }
      }

      // Check for duplicate phone number
      if (phone) {
        const { data: existingUserWithPhone } = await supabaseAdmin
          .from('users')
          .select('id')
          .eq('phone', phone)
          .single();
          
        if (existingUserWithPhone) {
          return res.status(400).json({
            success: false,
            error: "Ya existe un usuario con este número de teléfono"
          });
        }
      }

      // For colaborador users, validate and require institution AFTER institution is determined
      if (isColaborador) {
        if (!assignedInstitutionId) {
          return res.status(400).json({
            success: false,
            error: "El campo institución es requerido para colaboradores"
          });
        }
        
        // Check for duplicate cedula
        if (cedula) {
          const { data: existingColaboradorWithCedula } = await supabaseAdmin
            .from('colaboradores')
            .select('id')
            .eq('cedula', cedula)
            .single();
            
          if (existingColaboradorWithCedula) {
            return res.status(400).json({
              success: false,
              error: "Ya existe un colaborador con esta cédula"
            });
          }
        }
        
        // Clean date fields first (convert empty strings to null)
        const cleanedColaboradorData = cleanDateFields({
          cityId, cedula, birthDate, address, startContract, endContract, observations
        });
        
        // Validate colaborador data (partial because most fields are optional)  
        const colaboradorValidation = insertColaboradorSchema.partial().parse(cleanedColaboradorData);
        colaboradorData = colaboradorValidation;
      }

      // Create user in Supabase Auth with complete metadata
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          first_name: firstName,
          last_name: lastName,
          role: role,
          institution_id: assignedInstitutionId,
          venue_ids: assignedVenueIds,
          group_ids: []
        }
      });

      if (error) {
        if (error.message.includes("already been registered")) {
          throw new Error("Ya existe un usuario con este email");
        }
        throw new Error(error.message);
      }

      if (!data.user) {
        throw new Error("No se pudo crear el usuario");
      }

      // Institution assignment was already determined above

      // Create user in our database
      const userData = {
        id: data.user.id,
        email,
        first_name: firstName,
        last_name: lastName,
        role, // Now we can store custom roles directly
        phone,
        institution_id: assignedInstitutionId,
        venue_ids: assignedVenueIds,
        group_ids: [],
        permissions: {},
        avatar_url: null,
        is_active: true
      };

      // Create user directly in database with Supabase for better performance
      const { data: dbUser, error: dbError } = await supabaseAdmin
        .from('users')
        .insert(userData)
        .select()
        .single();

      if (dbError) {
        // If database insert fails, delete the auth user
        await supabaseAdmin.auth.admin.deleteUser(data.user.id);
        throw new Error(dbError.message);
      }

      // If this is a colaborador user, create colaborador record
      if (isColaborador) {
        try {
          const colaboradorToCreate = {
            userId: dbUser.id,
            institutionId: assignedInstitutionId,
            customRoleId: null, // Will be linked later if needed
            ...colaboradorData // Use validated data (empty object if no fields provided)
          };

          colaboradorData = await storage.createColaborador(colaboradorToCreate);
        } catch (colaboradorError: any) {
          console.error('Colaborador creation error:', colaboradorError);
          // If colaborador creation fails, delete the user to maintain consistency
          await supabaseAdmin.auth.admin.deleteUser(data.user.id);
          await supabaseAdmin.from('users').delete().eq('id', dbUser.id);
          
          throw new Error(`Usuario creado pero falló al crear información de colaborador: ${colaboradorError.message}`);
        }
      }

      // Return user data with colaborador info if available
      const responseData = {
        ...dbUser,
        firstName: dbUser.first_name,
        lastName: dbUser.last_name,
        isActive: dbUser.is_active,
        institutionId: dbUser.institution_id,
        venueIds: dbUser.venue_ids,
        groupIds: dbUser.group_ids,
        avatarUrl: dbUser.avatar_url,
        createdAt: dbUser.created_at,
        updatedAt: dbUser.updated_at,
        colaborador: colaboradorData
      };

      res.json({ success: true, data: responseData });
    } catch (error: any) {
      console.error('Create user error:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message || "Error al crear usuario" 
      });
    }
  });

  app.patch("/api/users/:id", authenticate, authorize(["super_admin", "admin_institucion"]), async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const { supabaseAdmin } = await import("./services/supabase");
      
      // Get current user data first
      const { data: currentUser, error: getCurrentError } = await supabaseAdmin
        .from('users')
        .select('role, institution_id')
        .eq('id', id)
        .single();
      
      if (getCurrentError) throw getCurrentError;
      if (!currentUser) {
        return res.status(404).json({ 
          success: false, 
          error: "Usuario no encontrado" 
        });
      }
      
      // Separate user fields from colaborador fields
      const {
        // Colaborador fields
        isColaborador, cityId, cedula, birthDate, address, startContract, endContract, observations,
        // User fields (everything else)
        ...userUpdates
      } = req.body;
      
      // Check if role is changing and validate new role if provided
      const newRole = userUpdates.role || currentUser.role;
      const roleIsChanging = userUpdates.role && userUpdates.role !== currentUser.role;
      
      // If role is changing, validate the new role (similar to POST validation)
      if (roleIsChanging) {
        const userRole = req.user?.role;
        
        // Critical security check: admin_institucion cannot assign super_admin
        if (userRole === 'admin_institucion' && newRole === 'super_admin') {
          return res.status(403).json({ 
            success: false, 
            error: 'No tienes permisos para asignar el rol super_admin' 
          });
        }
        
        // Define system roles
        const systemRoles = ['super_admin', 'admin_institucion', 'admin_sede', 'entrenador', 'asistente', 'director_tecnico', 'secretario', 'representante', 'deportista'];
        const allowedSystemRolesByUserRole = {
          super_admin: systemRoles,
          admin_institucion: systemRoles.filter(r => r !== 'super_admin')
        };
        
        const isSystemRole = systemRoles.includes(newRole);
        
        if (isSystemRole) {
          // Validate system role assignment permissions
          const allowedSystemRoles = allowedSystemRolesByUserRole[userRole as keyof typeof allowedSystemRolesByUserRole] || [];
          if (!allowedSystemRoles.includes(newRole)) {
            return res.status(403).json({ 
              success: false, 
              error: `No tienes permisos para asignar el rol ${newRole}` 
            });
          }
        } else {
          // For custom roles, check if they exist in the database
          const { data: customRole, error: roleError } = await supabaseAdmin
            .from('custom_roles')
            .select('id, name, is_active')
            .eq('name', newRole)
            .eq('is_active', true)
            .single();
          
          if (roleError || !customRole) {
            return res.status(400).json({
              success: false,
              error: `El rol personalizado '${newRole}' no existe o no está activo`
            });
          }
          
          // For institution admins, ensure the custom role belongs to their institution
          if (userRole === 'admin_institucion' && req.user?.institutionId) {
            const { data: roleCheck } = await supabaseAdmin
              .from('custom_roles')
              .select('institution_id')
              .eq('name', newRole)
              .single();
              
            if (roleCheck?.institution_id && roleCheck.institution_id !== req.user.institutionId) {
              return res.status(403).json({
                success: false,
                error: 'No tienes permisos para usar este rol personalizado'
              });
            }
          }
        }
      }
      
      // Check for duplicate phone number (excluding current user)
      if (userUpdates.phone) {
        const { data: existingUserWithPhone } = await supabaseAdmin
          .from('users')
          .select('id')
          .eq('phone', userUpdates.phone)
          .neq('id', id)
          .single();
          
        if (existingUserWithPhone) {
          return res.status(400).json({
            success: false,
            error: "Ya existe un usuario con este número de teléfono"
          });
        }
      }

      // Check for duplicate cedula if isColaborador is true (excluding current user)
      if (isColaborador && cedula) {
        const { data: existingColaboradorWithCedula } = await supabaseAdmin
          .from('colaboradores')
          .select('id, user_id')
          .eq('cedula', cedula)
          .neq('user_id', id)
          .single();
          
        if (existingColaboradorWithCedula) {
          return res.status(400).json({
            success: false,
            error: "Ya existe un colaborador con esta cédula"
          });
        }
      }
      
      // Update user in database
      const { data: updatedUser, error: updateError } = await supabaseAdmin
        .from('users')
        .update({ ...userUpdates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;
      
      // Handle colaborador data if isColaborador is true
      let colaboradorData = null;
      // Get current colaborador status
      const { data: currentColaborador } = await supabaseAdmin
        .from('colaboradores')
        .select('id')
        .eq('user_id', id)
        .single();
      const currentIsColaborador = !!currentColaborador;
      const newIsColaborador = isColaborador !== undefined ? isColaborador : currentIsColaborador;
      
      // Check if any colaborador fields were provided
      const hasColaboradorFields = cityId !== undefined || cedula !== undefined || 
                                   birthDate !== undefined || address !== undefined || 
                                   startContract !== undefined || endContract !== undefined || 
                                   observations !== undefined;
      
      if (newIsColaborador && hasColaboradorFields) {
        // User is/will be staff and colaborador fields were provided
        
        // Clean date fields first (convert empty strings to null)
        const cleanedColaboradorData = cleanDateFields({
          cityId, cedula, birthDate, address, startContract, endContract, observations
        });
        
        // Validate colaborador data
        const colaboradorUpdates = insertColaboradorSchema.partial().parse(cleanedColaboradorData);
        
        // Check if colaborador record exists
        const { data: existingColaborador } = await supabaseAdmin
          .from('colaboradores')
          .select('*')
          .eq('user_id', id)
          .single();
        
        if (existingColaborador) {
          // Update existing colaborador
          const { data: updatedColaborador, error: colaboradorError } = await supabaseAdmin
            .from('colaboradores')
            .update({ ...colaboradorUpdates, updated_at: new Date().toISOString() })
            .eq('user_id', id)
            .select(`
              *,
              cities(
                id, name,
                provinces(id, name)
              )
            `)
            .single();
            
          if (colaboradorError) throw colaboradorError;
          
          // Map colaborador data
          colaboradorData = {
            id: updatedColaborador.id,
            userId: updatedColaborador.user_id,
            institutionId: updatedColaborador.institution_id,
            customRoleId: updatedColaborador.custom_role_id,
            cityId: updatedColaborador.city_id,
            cedula: updatedColaborador.cedula,
            birthDate: updatedColaborador.birth_date,
            address: updatedColaborador.address,
            startContract: updatedColaborador.start_contract,
            endContract: updatedColaborador.end_contract,
            observations: updatedColaborador.observations,
            isActive: updatedColaborador.is_active,
            createdAt: updatedColaborador.created_at,
            updatedAt: updatedColaborador.updated_at,
            city: updatedColaborador.cities ? {
              id: updatedColaborador.cities.id,
              name: updatedColaborador.cities.name,
              province: updatedColaborador.cities.provinces ? {
                id: updatedColaborador.cities.provinces.id,
                name: updatedColaborador.cities.provinces.name
              } : null
            } : null
          };
        } else {
          // Create new colaborador record
          const colaboradorToCreate = {
            userId: id,
            institutionId: updatedUser.institution_id || currentUser.institution_id,
            customRoleId: null,
            ...colaboradorUpdates
          };
          
          colaboradorData = await storage.createColaborador(colaboradorToCreate);
        }
      } else if (!newIsColaborador && currentIsColaborador) {
        // User is changing from staff to non-staff role, optionally delete colaborador
        // For now, we'll keep the colaborador record but mark it as inactive
        const { error: deactivateError } = await supabaseAdmin
          .from('colaboradores')
          .update({ is_active: false, updated_at: new Date().toISOString() })
          .eq('user_id', id);
          
        if (deactivateError) {
          console.error('Error deactivating colaborador:', deactivateError);
          // Don't fail the whole operation for this
        }
      } else if (newIsColaborador && !hasColaboradorFields) {
        // User is staff but no colaborador fields provided, fetch existing data
        const { data: existingColaborador } = await supabaseAdmin
          .from('colaboradores')
          .select(`
            *,
            cities(
              id, name,
              provinces(id, name)
            )
          `)
          .eq('user_id', id)
          .single();
          
        if (existingColaborador) {
          colaboradorData = {
            id: existingColaborador.id,
            userId: existingColaborador.user_id,
            institutionId: existingColaborador.institution_id,
            customRoleId: existingColaborador.custom_role_id,
            cityId: existingColaborador.city_id,
            cedula: existingColaborador.cedula,
            birthDate: existingColaborador.birth_date,
            address: existingColaborador.address,
            startContract: existingColaborador.start_contract,
            endContract: existingColaborador.end_contract,
            observations: existingColaborador.observations,
            isActive: existingColaborador.is_active,
            createdAt: existingColaborador.created_at,
            updatedAt: existingColaborador.updated_at,
            city: existingColaborador.cities ? {
              id: existingColaborador.cities.id,
              name: existingColaborador.cities.name,
              province: existingColaborador.cities.provinces ? {
                id: existingColaborador.cities.provinces.id,
                name: existingColaborador.cities.provinces.name
              } : null
            } : null
          };
        }
      }
      
      // Map database fields to frontend expectations
      const mappedData = {
        ...updatedUser,
        firstName: updatedUser.first_name,
        lastName: updatedUser.last_name,
        isActive: updatedUser.is_active,
        institutionId: updatedUser.institution_id,
        venueIds: updatedUser.venue_ids,
        groupIds: updatedUser.group_ids,
        avatarUrl: updatedUser.avatar_url,
        createdAt: updatedUser.created_at,
        updatedAt: updatedUser.updated_at,
        colaborador: colaboradorData
      };
      
      res.json({ success: true, data: mappedData });
    } catch (error: any) {
      console.error('Update user error:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message || "Error al actualizar usuario" 
      });
    }
  });

  app.delete("/api/users/:id", authenticate, authorize(["super_admin", "admin_institucion"]), async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const { supabaseAdmin } = await import("./services/supabase");
      
      // First delete from users table
      const { error: userError } = await supabaseAdmin
        .from('users')
        .delete()
        .eq('id', id);
      
      if (userError) throw userError;

      // Then delete from auth
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);
      if (authError) throw authError;

      res.json({ success: true, message: "Usuario eliminado exitosamente" });
    } catch (error: any) {
      console.error('Delete user error:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message || "Error al eliminar usuario" 
      });
    }
  });

  // Role management routes (Admin only)
  app.get("/api/roles", authenticate, authorize(["super_admin", "admin_institucion"]), async (req: AuthenticatedRequest, res) => {
    try {
      const { institutionId, role } = req.user!;
      const { contextInstitutionId } = req.query;
      const { supabaseAdmin } = await import("./services/supabase");
      
      // Try to get from custom_roles table first
      let query = supabaseAdmin
        .from('custom_roles')
        .select('*')
        .order('created_at', { ascending: false });
      
      // Super admin ve todos los roles, otros usuarios solo los de su institución
      if (role !== 'super_admin' && institutionId) {
        query = query.eq('institution_id', institutionId);
      }
      
      const { data, error } = await query;
      
      if (error && error.code === 'PGRST205') {
        // Table doesn't exist, return mock data for now
        console.log('⚠️ Tabla custom_roles no encontrada, usando datos temporales');
        res.json({ 
          success: true, 
          data: [
            {
              id: 'temp-1',
              name: 'entrenador_personalizado',
              displayName: 'Entrenador Personalizado',
              description: 'Rol temporal - crear tabla custom_roles en Supabase',
              permissions: {
                dashboard: { view: true, edit: false },
                institutions: { view: false, create: false, edit: false, delete: false },
                venues: { view: true, create: false, edit: false, delete: false },
                users: { view: false, create: false, edit: false, delete: false },
                groups: { view: true, create: false, edit: true, delete: false },
                athletes: { view: true, create: true, edit: true, delete: false },
                events: { view: true, create: true, edit: true, delete: false },
                publications: { view: false, create: false, edit: false, delete: false },
                notifications: { view: false, create: false, edit: false, delete: false },
                attendance: { view: true, edit: true },
                reports: { view: true, export: false }
              },
              isActive: true,
              createdAt: new Date().toISOString()
            }
          ]
        });
        return;
      }
      
      if (error) throw error;
      
      // Map database fields to frontend expectations
      const mappedData = data?.map(role => ({
        ...role,
        displayName: role.display_name,
        isActive: role.is_active
      }));
      
      res.json({ success: true, data: mappedData || [] });
    } catch (error: any) {
      console.error('Roles error:', error);
      res.status(500).json({ success: false, error: "Error al obtener roles" });
    }
  });

  app.post("/api/roles", authenticate, authorize(["super_admin", "admin_institucion"]), async (req: AuthenticatedRequest, res) => {
    try {
      const { name, displayName, description, permissions } = req.body;
      const { institutionId, role } = req.user!;
      const { supabaseAdmin } = await import("./services/supabase");
      
      // Allow multiple roles with same base name by adding timestamp suffix if needed
      let uniqueName = name;
      let attempts = 0;
      const maxAttempts = 10;
      
      while (attempts < maxAttempts) {
        try {
          const insertData: any = {
            name: uniqueName,
            display_name: displayName,
            description,
            permissions
          };
          
          // Only set institution_id for non-super admin users
          if (role !== 'super_admin' && institutionId) {
            insertData.institution_id = institutionId;
          }
          
          const { data, error } = await supabaseAdmin
            .from('custom_roles')
            .insert(insertData)
            .select()
            .single();
          
          if (error) throw error;
          
          // Success - map and return
          const mappedData = {
            ...data,
            displayName: data.display_name,
            isActive: data.is_active
          };
          
          return res.json({ success: true, data: mappedData });
          
        } catch (insertError: any) {
          if (insertError.code === '23505' && insertError.message.includes('custom_roles_name_key')) {
            // Duplicate name, try with suffix
            attempts++;
            uniqueName = `${name}_${attempts}`;
            console.log(`Duplicate name detected, trying: ${uniqueName}`);
            continue;
          } else {
            // Different error, rethrow
            throw insertError;
          }
        }
      }
      
      // If we get here, we failed after max attempts
      throw new Error('No se pudo crear el rol: demasiados nombres similares existentes');
    } catch (error: any) {
      console.error('Create role error:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message || "Error al crear rol" 
      });
    }
  });

  // Check users count before deleting role
  app.get("/api/roles/:id/users-count", authenticate, authorize(["super_admin", "admin_institucion"]), async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const { supabaseAdmin } = await import("./services/supabase");
      
      // First get the custom role name
      const { data: roleData, error: roleError } = await supabaseAdmin
        .from('custom_roles')
        .select('name')
        .eq('id', id)
        .single();
      
      if (roleError) throw roleError;
      if (!roleData) {
        return res.json({ success: true, count: 0 });
      }
      
      // Then count users with this custom role
      const { count, error } = await supabaseAdmin
        .from('users')
        .select('*', { count: 'exact', head: true })
        .contains('permissions', { custom_role: roleData.name });
      
      if (error) throw error;
      
      res.json({ success: true, count: count || 0 });
    } catch (error: any) {
      console.error('Get users count error:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message || "Error al contar usuarios" 
      });
    }
  });

  // Get users with specific role
  app.get("/api/roles/:id/users", authenticate, authorize(["super_admin", "admin_institucion"]), async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const { supabaseAdmin } = await import("./services/supabase");
      
      // First get the custom role name
      const { data: roleData, error: roleError } = await supabaseAdmin
        .from('custom_roles')
        .select('name')
        .eq('id', id)
        .single();
      
      if (roleError) throw roleError;
      if (!roleData) {
        return res.json({ success: true, data: [] });
      }
      
      // Then get users with this custom role
      const { data: users, error } = await supabaseAdmin
        .from('users')
        .select('id, first_name, last_name, email')
        .contains('permissions', { custom_role: roleData.name });
      
      if (error) throw error;
      
      res.json({ success: true, data: users || [] });
    } catch (error: any) {
      console.error('Get users with role error:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message || "Error al obtener usuarios con rol" 
      });
    }
  });

  // Update role (mainly for toggling is_active status)
  app.patch("/api/roles/:id", authenticate, authorize(["super_admin", "admin_institucion"]), async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const { supabaseAdmin } = await import("./services/supabase");
      
      // Update role in database
      const { data, error } = await supabaseAdmin
        .from('custom_roles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      res.json({ success: true, data });
    } catch (error: any) {
      console.error('Update role error:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message || "Error al actualizar rol" 
      });
    }
  });

  app.delete("/api/roles/:id", authenticate, authorize(["super_admin", "admin_institucion"]), async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const { supabaseAdmin } = await import("./services/supabase");
      
      const { error } = await supabaseAdmin
        .from('custom_roles')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      res.json({ success: true, message: "Rol eliminado exitosamente" });
    } catch (error: any) {
      console.error('Delete role error:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message || "Error al eliminar rol" 
      });
    }
  });

  // Test endpoint for mock login (fallback when Supabase tables don't exist)
  app.post("/api/auth/mock-login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // Mock users for testing when database is not ready
      const mockUsers = [
        {
          id: "admin-001",
          email: "admin@club.com",
          firstName: "Administrator",
          lastName: "Sistema",
          role: "admin_institucion",
          institutionId: "inst-001",
          venueIds: ["venue-001", "venue-002"],
          groupIds: [],
          permissions: {},
          avatarUrl: null,
          phone: "+1234567890",
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      
      const user = mockUsers.find(u => u.email === email);
      
      if (!user || password !== "password123") {
        return res.status(401).json({
          success: false,
          error: "Credenciales inválidas"
        });
      }

      // Create mock JWT token
      const token = jwt.sign({
        sub: user.id,
        email: user.email,
        user_metadata: {
          role: user.role,
          institution_id: user.institutionId,
          venue_ids: user.venueIds,
          group_ids: user.groupIds
        }
      }, "sports-platform-secret-key", { expiresIn: '24h' });
      
      res.json({
        success: true,
        data: {
          user,
          token,
          session: { access_token: token }
        }
      });
    } catch (error) {
      console.error('Mock login error:', error);
      res.status(500).json({
        success: false,
        error: "Error interno del servidor"
      });
    }
  });

  // Connection check endpoint 
  app.get("/api/connection/check", async (req, res) => {
    try {
      const { fullSupabaseCheck } = await import("./services/connection-check");
      const checkResult = await fullSupabaseCheck();
      
      res.json({
        success: true,
        data: checkResult
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Error verificando conexión"
      });
    }
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const { institutionId, role } = req.user!;
      
      // Super admins can see global stats, others need institution
      let targetInstitutionId = institutionId;
      if (role === 'super_admin' && !institutionId) {
        targetInstitutionId = undefined; // Global stats for super admin
      }

      const stats = await storage.getDashboardStats(targetInstitutionId || '');
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Dashboard stats error:', error);
      res.status(500).json({
        success: false,
        error: "Error al obtener estadísticas"
      });
    }
  });

  // Institutions routes
  app.get("/api/institutions", authenticate, authorizeWithPermissions("institutions", "view"), async (req: AuthenticatedRequest, res) => {
    try {
      const institutions = await storage.getInstitutions();
      res.json({ success: true, data: institutions });
    } catch (error) {
      res.status(500).json({ success: false, error: "Error al obtener instituciones" });
    }
  });

  app.get("/api/institutions/:id", authenticate, authorizeWithPermissions("institutions", "view"), async (req, res) => {
    try {
      const { id } = req.params;
      const institution = await storage.getInstitution(id);
      if (!institution) {
        res.status(404).json({ success: false, error: "Institución no encontrada" });
        return;
      }
      res.json({ success: true, data: institution });
    } catch (error) {
      res.status(500).json({ success: false, error: "Error al obtener institución" });
    }
  });

  app.post("/api/institutions", authenticate, authorizeWithPermissions("institutions", "create"), async (req, res) => {
    try {
      const validatedData = insertInstitutionSchema.parse(req.body);
      const institution = await storage.createInstitution(validatedData);
      res.json({ success: true, data: institution });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ success: false, error: "Datos inválidos", details: error.errors });
      } else {
        res.status(500).json({ success: false, error: "Error al crear institución" });
      }
    }
  });

  app.put("/api/institutions/:id", authenticate, authorizeWithPermissions("institutions", "edit"), async (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = insertInstitutionSchema.partial().parse(req.body);
      const institution = await storage.updateInstitution(id, validatedData);
      res.json({ success: true, data: institution });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ success: false, error: "Datos inválidos", details: error.errors });
      } else {
        res.status(500).json({ success: false, error: "Error al actualizar institución" });
      }
    }
  });

  app.patch("/api/institutions/:id/toggle", authenticate, authorizeWithPermissions("institutions", "edit"), async (req, res) => {
    try {
      const { id } = req.params;
      const institution = await storage.getInstitution(id);
      if (!institution) {
        res.status(404).json({ success: false, error: "Institución no encontrada" });
        return;
      }
      const updatedInstitution = await storage.updateInstitution(id, { 
        isActive: !institution.isActive 
      });
      res.json({ success: true, data: updatedInstitution });
    } catch (error) {
      res.status(500).json({ success: false, error: "Error al cambiar estado de institución" });
    }
  });

  app.delete("/api/institutions/:id", authenticate, authorizeWithPermissions("institutions", "delete"), async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteInstitution(id);
      res.json({ success: true, message: "Institución eliminada exitosamente" });
    } catch (error) {
      res.status(500).json({ success: false, error: "Error al eliminar institución" });
    }
  });

  // Venues routes
  app.get("/api/venues", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const { institutionId, role } = req.user!;
      const { contextInstitutionId } = req.query;
      
      // Determinar qué institución mostrar
      let targetInstitutionId;
      if (contextInstitutionId && role === 'super_admin') {
        // Super admin navegando dentro de una institución específica
        targetInstitutionId = contextInstitutionId as string;
      } else if (role === 'super_admin') {
        // Super admin en vista global
        targetInstitutionId = undefined;
      } else {
        // Otros usuarios solo ven su institución
        targetInstitutionId = institutionId;
      }
      
      // Use direct Supabase call for better performance
      const { supabaseAdmin } = await import("./services/supabase");
      
      let query = supabaseAdmin
        .from('venues')
        .select('*')
        .order('created_at', { ascending: false });
      
      // Filtrar por institución si no es super admin
      if (targetInstitutionId) {
        query = query.eq('institution_id', targetInstitutionId);
      }
      
      const { data, error } = await query;

      if (error && error.code === 'PGRST116') {
        res.json({ success: true, data: [] });
        return;
      }
      
      if (error) throw error;
      
      // Map database fields to frontend expectations
      const mappedData = data?.map(venue => ({
        ...venue,
        institutionId: venue.institution_id,
        logoUrl: venue.logo_url,
        bannerUrl: venue.banner_url,
        isActive: venue.is_active,
        createdAt: venue.created_at,
        updatedAt: venue.updated_at
      }));
      
      res.json({ success: true, data: mappedData || [] });
    } catch (error) {
      console.error('Venues error:', error);
      res.status(500).json({ success: false, error: "Error al obtener sedes" });
    }
  });

  app.post("/api/venues", authenticate, authorize(["super_admin", "admin_institucion"]), async (req: AuthenticatedRequest, res) => {
    try {
      const validatedData = insertVenueSchema.parse(req.body);
      const venue = await storage.createVenue(validatedData);
      res.json({ success: true, data: venue });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ success: false, error: "Datos inválidos", details: error.errors });
      } else {
        res.status(500).json({ success: false, error: "Error al crear sede" });
      }
    }
  });

  // Groups routes
  app.get("/api/groups", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const { institutionId, role } = req.user!;
      const { venueId, contextInstitutionId } = req.query;
      
      // Determinar qué institución mostrar
      let targetInstitutionId;
      if (contextInstitutionId && role === 'super_admin') {
        // Super admin navegando dentro de una institución específica
        targetInstitutionId = contextInstitutionId as string;
      } else if (role === 'super_admin') {
        // Super admin en vista global
        targetInstitutionId = undefined;
      } else {
        // Otros usuarios solo ven su institución
        targetInstitutionId = institutionId;
      }
      
      // Use direct Supabase call for better performance
      const { supabaseAdmin } = await import("./services/supabase");
      
      let query = supabaseAdmin
        .from('groups')
        .select('*')
        .order('created_at', { ascending: false });
      
      // Filtrar por institución si no es super admin
      if (targetInstitutionId) {
        query = query.eq('institution_id', targetInstitutionId);
      }
      
      const { data, error } = await query;

      if (error && error.code === 'PGRST116') {
        res.json({ success: true, data: [] });
        return;
      }
      
      if (error) throw error;
      res.json({ success: true, data: data || [] });
    } catch (error) {
      console.error('Groups error:', error);
      res.status(500).json({ success: false, error: "Error al obtener grupos" });
    }
  });

  app.post("/api/groups", authenticate, authorize(["super_admin", "admin_institucion", "admin_sede"]), async (req: AuthenticatedRequest, res) => {
    try {
      const validatedData = insertGroupSchema.parse(req.body);
      const group = await storage.createGroup(validatedData);
      res.json({ success: true, data: group });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ success: false, error: "Datos inválidos", details: error.errors });
      } else {
        res.status(500).json({ success: false, error: "Error al crear grupo" });
      }
    }
  });

  // Athletes routes
  app.get("/api/athletes", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const { institutionId, role } = req.user!;
      const { groupId, contextInstitutionId } = req.query;
      
      // Determinar qué institución mostrar
      let targetInstitutionId;
      if (contextInstitutionId && role === 'super_admin') {
        // Super admin navegando dentro de una institución específica
        targetInstitutionId = contextInstitutionId as string;
      } else if (role === 'super_admin') {
        // Super admin en vista global
        targetInstitutionId = undefined;
      } else {
        // Otros usuarios solo ven su institución
        targetInstitutionId = institutionId;
      }
      
      // Use direct Supabase call for better performance
      const { supabaseAdmin } = await import("./services/supabase");
      
      let query = supabaseAdmin
        .from('athletes')
        .select('*')
        .order('created_at', { ascending: false });
      
      // Filtrar por institución si no es super admin
      if (targetInstitutionId) {
        query = query.eq('institution_id', targetInstitutionId);
      }
      
      const { data, error } = await query;

      if (error && error.code === 'PGRST116') {
        res.json({ success: true, data: [] });
        return;
      }
      
      if (error) throw error;
      res.json({ success: true, data: data || [] });
    } catch (error) {
      res.status(500).json({ success: false, error: "Error al obtener deportistas" });
    }
  });

  app.post("/api/athletes", authenticate, authorize(["super_admin", "admin_institucion", "admin_sede", "representante"]), async (req: AuthenticatedRequest, res) => {
    try {
      const validatedData = insertAthleteSchema.parse(req.body);
      const athlete = await storage.createAthlete(validatedData);
      res.json({ success: true, data: athlete });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ success: false, error: "Datos inválidos", details: error.errors });
      } else {
        res.status(500).json({ success: false, error: "Error al crear deportista" });
      }
    }
  });

  // Events routes
  app.get("/api/events", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const { institutionId } = req.user!;
      const { venueId, groupId } = req.query;
      // Use direct Supabase call for better performance
      const { supabaseAdmin } = await import("./services/supabase");
      
      const { data, error } = await supabaseAdmin
        .from('events')
        .select('*')
        .order('created_at', { ascending: false });

      if (error && error.code === 'PGRST116') {
        res.json({ success: true, data: [] });
        return;
      }
      
      if (error) throw error;
      res.json({ success: true, data: data || [] });
    } catch (error) {
      res.status(500).json({ success: false, error: "Error al obtener eventos" });
    }
  });

  app.post("/api/events", authenticate, authorize(["super_admin", "admin_institucion", "admin_sede", "entrenador"]), async (req: AuthenticatedRequest, res) => {
    try {
      const validatedData = insertEventSchema.parse(req.body);
      const event = await storage.createEvent(validatedData);
      res.json({ success: true, data: event });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ success: false, error: "Datos inválidos", details: error.errors });
      } else {
        res.status(500).json({ success: false, error: "Error al crear evento" });
      }
    }
  });

  // Publications routes
  app.get("/api/publications", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const { institutionId } = req.user!;
      const { venueId, groupId } = req.query;
      // Use direct Supabase call for better performance
      const { supabaseAdmin } = await import("./services/supabase");
      
      const { data, error } = await supabaseAdmin
        .from('publications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error && error.code === 'PGRST116') {
        res.json({ success: true, data: [] });
        return;
      }
      
      if (error) throw error;
      res.json({ success: true, data: data || [] });
    } catch (error) {
      res.status(500).json({ success: false, error: "Error al obtener publicaciones" });
    }
  });

  app.post("/api/publications", authenticate, authorize(["super_admin", "admin_institucion", "admin_sede", "entrenador"]), async (req: AuthenticatedRequest, res) => {
    try {
      const validatedData = insertPublicationSchema.parse(req.body);
      const publication = await storage.createPublication(validatedData);
      res.json({ success: true, data: publication });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ success: false, error: "Datos inválidos", details: error.errors });
      } else {
        res.status(500).json({ success: false, error: "Error al crear publicación" });
      }
    }
  });

  // Notifications routes
  app.get("/api/notifications", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const { institutionId } = req.user!;
      // Use direct Supabase call for better performance
      const { supabaseAdmin } = await import("./services/supabase");
      
      const { data, error } = await supabaseAdmin
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error && error.code === 'PGRST116') {
        res.json({ success: true, data: [] });
        return;
      }
      
      if (error) throw error;
      res.json({ success: true, data: data || [] });
    } catch (error) {
      res.status(500).json({ success: false, error: "Error al obtener notificaciones" });
    }
  });

  app.post("/api/notifications", authenticate, authorize(["super_admin", "admin_institucion", "admin_sede"]), async (req: AuthenticatedRequest, res) => {
    try {
      const validatedData = insertNotificationSchema.parse(req.body);
      const notification = await storage.createNotification(validatedData);
      res.json({ success: true, data: notification });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ success: false, error: "Datos inválidos", details: error.errors });
      } else {
        res.status(500).json({ success: false, error: "Error al crear notificación" });
      }
    }
  });

  // System statistics endpoint
  app.get("/api/system/stats", authenticate, authorizeWithPermissions("institutions", "view"), async (req: AuthenticatedRequest, res) => {
    try {
      const { supabaseAdmin } = await import("./services/supabase");
      
      // Get institutions with their user counts
      const { data: institutions, error: instError } = await supabaseAdmin
        .from('institutions')
        .select(`
          id, 
          is_active, 
          name,
          created_at,
          users(id, role, created_at, updated_at)
        `);
      
      if (instError) throw instError;
      
      // Get events with attendance data
      const { data: events, error: eventsError } = await supabaseAdmin
        .from('events')
        .select(`
          id,
          start_time,
          attendance(id, status)
        `);
      
      if (eventsError && eventsError.code !== 'PGRST116') throw eventsError;
      
      // Get venues and groups for distribution
      const { data: venues, error: venuesError } = await supabaseAdmin
        .from('venues')
        .select('id, institution_id');
      
      if (venuesError && venuesError.code !== 'PGRST116') throw venuesError;
      
      const { data: groups, error: groupsError } = await supabaseAdmin
        .from('groups')
        .select('id, institution_id');
      
      if (groupsError && groupsError.code !== 'PGRST116') throw groupsError;
      
      // Calculate strategic metrics
      const totalInstitutions = institutions?.length || 0;
      const activeInstitutions = institutions?.filter(i => i.is_active)?.length || 0;
      
      // 1. TASA DE ADOPCIÓN: Instituciones con al menos 1 usuario vs total instituciones
      const institutionsWithUsers = institutions?.filter(inst => 
        inst.users && inst.users.length > 0
      )?.length || 0;
      const adoptionRate = totalInstitutions > 0 ? 
        Math.round((institutionsWithUsers / totalInstitutions) * 100) : 0;
      
      // 2. SATISFACCIÓN: Eventos con asistencia > 80% vs total eventos
      const eventsWithAttendance = events?.filter(event => 
        event.attendance && event.attendance.length > 0
      ) || [];
      
      const successfulEvents = eventsWithAttendance.filter(event => {
        const totalAttendance = event.attendance.length;
        const presentCount = event.attendance.filter(att => att.status === 'presente').length;
        return totalAttendance > 0 && (presentCount / totalAttendance) > 0.8;
      }).length;
      
      const satisfactionRate = eventsWithAttendance.length > 0 ? 
        Math.round((successfulEvents / eventsWithAttendance.length) * 100) : 85;
      
      // 3. RETENCIÓN: Usuarios activos (actualizados en últimos 30 días) vs total usuarios
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const allUsers = institutions?.flatMap(inst => inst.users || []) || [];
      const activeUsers = allUsers.filter(user => {
        const lastUpdate = new Date(user.updated_at);
        return lastUpdate > thirtyDaysAgo;
      }).length;
      
      const retentionRate = allUsers.length > 0 ? 
        Math.round((activeUsers / allUsers.length) * 100) : 0;
      
      // DISTRIBUCIÓN DE INSTITUCIONES (simulada basada en nombre)
      const clubsCount = institutions?.filter(inst => 
        inst.name.toLowerCase().includes('club') || 
        inst.name.toLowerCase().includes('deportivo')
      ).length || 0;
      
      const academiesCount = institutions?.filter(inst => 
        inst.name.toLowerCase().includes('academia') || 
        inst.name.toLowerCase().includes('escuela')
      ).length || 0;
      
      const educationalCount = institutions?.filter(inst => 
        inst.name.toLowerCase().includes('universidad') || 
        inst.name.toLowerCase().includes('colegio') ||
        inst.name.toLowerCase().includes('instituto')
      ).length || 0;
      
      const otherCount = totalInstitutions - clubsCount - academiesCount - educationalCount;
      
      // Calcular porcentajes de distribución
      const distribution = totalInstitutions > 0 ? {
        clubsDeportivos: Math.round((clubsCount / totalInstitutions) * 100),
        academias: Math.round((academiesCount / totalInstitutions) * 100),
        centrosEducativos: Math.round((educationalCount / totalInstitutions) * 100),
        otros: Math.round((otherCount / totalInstitutions) * 100)
      } : { clubsDeportivos: 0, academias: 0, centrosEducativos: 0, otros: 0 };
      
      // ALERTAS DEL SISTEMA (basadas en datos reales)
      const alerts = [];
      
      // Instituciones sin usuarios
      const institutionsWithoutUsers = institutions?.filter(inst => 
        !inst.users || inst.users.length === 0
      ).length || 0;
      
      if (institutionsWithoutUsers > 0) {
        alerts.push({
          type: 'warning',
          title: 'Instituciones sin usuarios',
          message: `${institutionsWithoutUsers} instituciones no tienen usuarios asignados`,
          priority: 'medium'
        });
      }
      
      // Instituciones inactivas
      const inactiveInstitutions = totalInstitutions - activeInstitutions;
      if (inactiveInstitutions > 0) {
        alerts.push({
          type: 'info',
          title: 'Instituciones inactivas',
          message: `${inactiveInstitutions} instituciones están marcadas como inactivas`,
          priority: 'low'
        });
      }
      
      // Eventos sin asistencia registrada
      const eventsWithoutAttendance = events?.filter(event => 
        !event.attendance || event.attendance.length === 0
      ).length || 0;
      
      if (eventsWithoutAttendance > 0) {
        alerts.push({
          type: 'warning',
          title: 'Eventos sin asistencia',
          message: `${eventsWithoutAttendance} eventos no tienen registro de asistencia`,
          priority: 'medium'
        });
      }
      
      const totalUsers = allUsers.length;
      const totalVenues = venues?.length || 0;
      const totalGroups = groups?.length || 0;
      const totalEvents = events?.length || 0;
      
      res.json({
        success: true,
        data: {
          // Métricas básicas
          totalInstitutions,
          activeInstitutions,
          totalUsers,
          totalVenues,
          totalGroups,
          totalEvents,
          
          // Métricas estratégicas reales
          strategicMetrics: {
            adoptionRate,      // Tasa de Adopción 
            satisfactionRate,  // Satisfacción
            retentionRate      // Retención
          },
          
          // Distribución real de instituciones
          institutionDistribution: distribution,
          
          // Alertas del sistema basadas en datos reales
          systemAlerts: alerts,
          
          // Distribución de usuarios por rol
          usersByRole: allUsers.reduce((acc: any, user: any) => {
            acc[user.role] = (acc[user.role] || 0) + 1;
            return acc;
          }, {})
        }
      });
    } catch (error) {
      console.error('System stats error:', error);
      res.status(500).json({ success: false, error: "Error al obtener estadísticas del sistema" });
    }
  });

  // System configuration routes
  app.get("/api/system-config", authenticate, authorize(["super_admin"]), async (req: AuthenticatedRequest, res) => {
    try {
      const { supabaseAdmin } = await import("./services/supabase");
      
      const { data, error } = await supabaseAdmin
        .from('system_config')
        .select('*')
        .order('category', { ascending: true });

      if (error && error.code !== 'PGRST116') throw error;
      
      res.json({ success: true, data: data || [] });
    } catch (error) {
      console.error('System config get error:', error);
      res.status(500).json({ success: false, error: "Error al obtener configuración del sistema" });
    }
  });

  app.post("/api/system-config", authenticate, authorize(["super_admin"]), async (req: AuthenticatedRequest, res) => {
    try {
      const { supabaseAdmin } = await import("./services/supabase");
      const { configs } = req.body; // Array de configuraciones a guardar
      
      if (!Array.isArray(configs)) {
        return res.status(400).json({ success: false, error: "Se esperaba un array de configuraciones" });
      }

      // Actualizar cada configuración
      const updatePromises = configs.map(async (config: any) => {
        const { data, error } = await supabaseAdmin
          .from('system_config')
          .upsert({
            key: config.key,
            value: config.value,
            description: config.description,
            category: config.category,
            is_public: config.is_public || false,
            updated_at: new Date().toISOString()
          }, { 
            onConflict: 'key',
            ignoreDuplicates: false 
          });
        
        if (error) throw error;
        return data;
      });

      await Promise.all(updatePromises);
      
      res.json({ success: true, message: "Configuraciones guardadas correctamente" });
    } catch (error) {
      console.error('System config save error:', error);
      res.status(500).json({ success: false, error: "Error al guardar configuración del sistema" });
    }
  });

  // Provinces routes
  app.get("/api/provinces", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const provinces = await storage.getProvinces();
      res.json({ success: true, data: provinces });
    } catch (error) {
      console.error('Provinces error:', error);
      res.status(500).json({ success: false, error: "Error al obtener provincias" });
    }
  });

  app.post("/api/provinces", authenticate, authorize(["super_admin"]), async (req: AuthenticatedRequest, res) => {
    try {
      const validatedData = insertProvinceSchema.parse(req.body);
      const province = await storage.createProvince(validatedData);
      res.json({ success: true, data: province });
    } catch (error: any) {
      console.error('Create province error:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message || "Error al crear provincia" 
      });
    }
  });

  // Cities routes
  app.get("/api/cities", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const { provinceId } = req.query;
      const cities = await storage.getCities(provinceId as string);
      res.json({ success: true, data: cities });
    } catch (error) {
      console.error('Cities error:', error);
      res.status(500).json({ success: false, error: "Error al obtener ciudades" });
    }
  });

  app.post("/api/cities", authenticate, authorize(["super_admin"]), async (req: AuthenticatedRequest, res) => {
    try {
      const validatedData = insertCitySchema.parse(req.body);
      const city = await storage.createCity(validatedData);
      res.json({ success: true, data: city });
    } catch (error: any) {
      console.error('Create city error:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message || "Error al crear ciudad" 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
