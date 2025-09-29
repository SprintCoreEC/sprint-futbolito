import { Request, Response, NextFunction } from "express";
import { supabaseAdmin } from "./supabase";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    institutionId?: string;
    venueIds?: string[];
    groupIds?: string[];
  };
}

export const authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        error: "Token de autenticación requerido"
      });
    }

    const token = authHeader.substring(7);
    
    try {
      // Verify the Supabase JWT token
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
      
      if (error || !user) {
        return res.status(401).json({
          success: false,
          error: "Token de autenticación inválido"
        });
      }

      // Get additional user data from our database
      const { data: userData, error: userError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('email', user.email)
        .single();

      if (userError || !userData) {
        // User not found in our database - create from Supabase Auth user
        let defaultRole = 'deportista';
        
        // Set role based on user_metadata or email
        if (user.user_metadata?.role) {
          defaultRole = user.user_metadata.role;
        } else if (user.email === 'admin@club.com') {
          defaultRole = 'admin_institucion';
        } else if (user.email === 'superadmin@sports.com') {
          defaultRole = 'super_admin';
        }
        
        const newUser = {
          id: user.id,
          email: user.email,
          first_name: user.user_metadata?.first_name || user.email.split('@')[0],
          last_name: user.user_metadata?.last_name || '',
          role: defaultRole,
          institution_id: null,
          venue_ids: [],
          group_ids: [],
          permissions: {},
          avatar_url: user.user_metadata?.avatar_url,
          phone: user.user_metadata?.phone,
          is_active: true
        };

        const { error: insertError } = await supabaseAdmin
          .from('users')
          .insert(newUser);

        if (insertError) {
          console.error('Error creating user in database:', insertError);
        }

        req.user = {
          id: user.id,
          email: user.email,
          role: defaultRole,
          institutionId: undefined,
          venueIds: [],
          groupIds: []
        };
      } else {
        req.user = {
          id: userData.id,
          email: userData.email,
          role: userData.role,
          institutionId: userData.institution_id,
          venueIds: userData.venue_ids || [],
          groupIds: userData.group_ids || []
        };
      }
      
      next();
    } catch (authError) {
      console.error("Supabase auth verification error:", authError);
      return res.status(401).json({
        success: false,
        error: "Token de autenticación inválido"
      });
    }
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(500).json({
      success: false,
      error: "Error en la autenticación"
    });
  }
};

export const authorize = (allowedRoles: string[]) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Usuario no autenticado"
      });
    }

    // Check if user has one of the basic allowed roles
    if (allowedRoles.includes(req.user.role)) {
      next();
      return;
    }

    // For custom roles, check if user has proper permissions
    try {
      const { data: userData, error } = await supabaseAdmin
        .from('users')
        .select('role, permissions')
        .eq('id', req.user.id)
        .single();

      if (error || !userData) {
        return res.status(403).json({
          success: false,
          error: "No tienes permisos para realizar esta acción"
        });
      }

      // If user has basic role that's allowed, grant access
      if (allowedRoles.includes(userData.role)) {
        next();
        return;
      }

      // Check if user has a custom role with proper permissions
      // This allows users with custom roles to access resources if their base role is allowed
      if (allowedRoles.includes(userData.role)) {
        next();
        return;
      }

      return res.status(403).json({
        success: false,
        error: "No tienes permisos para realizar esta acción"
      });
    } catch (error) {
      console.error('Authorization error:', error);
      return res.status(500).json({
        success: false,
        error: "Error de autorización"
      });
    }
  };
};

// Create a new permission-based authorize function for more granular control
export const authorizeWithPermissions = (module: string, action: string) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Usuario no autenticado"
      });
    }

    try {
      // Get user data including custom role permissions
      const { data: userData, error } = await supabaseAdmin
        .from('users')
        .select('role, permissions')
        .eq('id', req.user.id)
        .single();

      if (error || !userData) {
        return res.status(403).json({
          success: false,
          error: "No tienes permisos para realizar esta acción"
        });
      }

      // Super admin and admin_institucion have ALL permissions - NO EXCEPTIONS
      if (['super_admin', 'admin_institucion'].includes(userData.role)) {
        console.log(`✅ Backend: Admin role ${userData.role} granted access to ${module}.${action}`);
        next();
        return;
      }
      
      // Admin sede también tiene permisos completos
      if (userData.role === 'admin_sede') {
        next();
        return;
      }

      // Check if user has a custom role with specific permissions
      if (userData.permissions?.custom_role) {
        // Get custom role permissions from custom_roles table
        const { data: customRoleData } = await supabaseAdmin
          .from('custom_roles')
          .select('permissions')
          .eq('name', userData.permissions.custom_role)
          .single();

        if (customRoleData && customRoleData.permissions[module] && 
            customRoleData.permissions[module][action]) {
          next();
          return;
        }
      }

      // Default permissions based on basic roles
      const defaultPermissions = {
        'admin_sede': ['institutions', 'venues', 'users', 'groups', 'athletes', 'events'],
        'entrenador': ['groups', 'athletes', 'events', 'attendance'],
        'secretario': ['athletes', 'events', 'publications', 'notifications'],
        'representante': ['athletes', 'events'],
        'deportista': ['events', 'publications']
      };

      if (defaultPermissions[userData.role]?.includes(module)) {
        next();
        return;
      }

      return res.status(403).json({
        success: false,
        error: "No tienes permisos para acceder a este módulo"
      });

    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({
        success: false,
        error: "Error verificando permisos"
      });
    }
  };
};