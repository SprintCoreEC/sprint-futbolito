import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";

interface ModulePermissions {
  [module: string]: {
    view?: boolean;
    create?: boolean;
    edit?: boolean;
    delete?: boolean;
    export?: boolean;
  };
}

// Default permissions based on roles
const defaultPermissions: Record<string, string[]> = {
  'super_admin': ['dashboard', 'institutions', 'venues', 'users', 'groups', 'athletes', 'events', 'publications', 'notifications', 'attendance', 'reports'],
  'admin_institucion': ['dashboard', 'institutions', 'venues', 'users', 'groups', 'athletes', 'events', 'publications', 'notifications', 'attendance', 'reports'],
  'admin_sede': ['dashboard', 'institutions', 'venues', 'users', 'groups', 'athletes', 'events', 'publications', 'notifications', 'attendance'],
  'entrenador': ['dashboard', 'groups', 'athletes', 'events', 'attendance'],
  'secretario': ['dashboard', 'athletes', 'events', 'publications', 'notifications'],
  'representante': ['dashboard', 'athletes', 'events'],
  'deportista': ['dashboard', 'events', 'publications']
};

export function usePermissions() {
  const { user } = useAuth();

  // Get custom role permissions if user has one
  const { data: customRoleData } = useQuery<{ success: boolean; data: any[] }>({
    queryKey: ["/api/roles", user?.id],
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const hasModuleAccess = (module: string): boolean => {
    if (!user || !user.role) return false;
    
    // Super admin and admin_institucion have COMPLETE access to everything
    if (['super_admin', 'admin_institucion'].includes(user.role)) {
      return true;
    }

    // Admin sede también tiene acceso a casi todo
    if (user.role === 'admin_sede') {
      return true;
    }

    // Check if user has custom role permissions
    if (customRoleData?.success && customRoleData.data && Array.isArray(customRoleData.data)) {
      const userCustomRole = customRoleData.data.find((role: any) => role.name === user.role);
      if (userCustomRole && userCustomRole.permissions && userCustomRole.permissions[module]) {
        return userCustomRole.permissions[module].view === true;
      }
    }

    // Fall back to default permissions - más permisivo
    const userModules = defaultPermissions[user.role as keyof typeof defaultPermissions] || [];
    return userModules.includes(module);
  };

  const hasPermission = (module: string, action: string): boolean => {
    if (!user || !user.role) return false;
    
    // Super admin and admin_institucion have ALL permissions - NO EXCEPTIONS
    if (['super_admin', 'admin_institucion'].includes(user.role)) {
      return true;
    }

    // Admin sede también tiene permisos completos
    if (user.role === 'admin_sede') {
      return true;
    }

    // Check custom role permissions first
    if (customRoleData?.success && customRoleData.data && Array.isArray(customRoleData.data)) {
      const userCustomRole = customRoleData.data.find((role: any) => role.name === user.role);
      if (userCustomRole && userCustomRole.permissions && userCustomRole.permissions[module]) {
        return userCustomRole.permissions[module][action] === true;
      }
    }

    // Default permissions for basic actions
    if (action === 'view') {
      return hasModuleAccess(module);
    }

    // More permissive for other roles
    const rolePermissions = {
      'entrenador': ['view', 'create', 'edit'], // Entrenador puede ver, crear y editar
      'secretario': ['view', 'create', 'edit'], // Secretario puede ver, crear y editar
      'representante': ['view'], // Representante solo puede ver
      'deportista': ['view'] // Deportista solo puede ver
    };

    const allowedActions = rolePermissions[user.role as keyof typeof rolePermissions] || ['view'];
    return allowedActions.includes(action);
  };

  const canAccessUserManagement = (): boolean => {
    return !!(user && user.role && ['super_admin', 'admin_institucion'].includes(user.role));
  };

  const canAccessRoleManagement = (): boolean => {
    return !!(user && user.role && ['super_admin', 'admin_institucion'].includes(user.role));
  };

  return {
    hasModuleAccess,
    hasPermission,
    canAccessUserManagement,
    canAccessRoleManagement,
    user
  };
}