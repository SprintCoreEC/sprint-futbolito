import { useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { usePermissions } from "@/hooks/use-permissions";
import { useInstitutionContext } from "@/hooks/use-institution-context";
import { useSystemConfig } from "@/hooks/use-system-config";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Building2,
  MapPin,
  Users,
  UserCheck,
  Calendar,
  Megaphone,
  Bell,
  ClipboardCheck,
  UserCog,
  Shield,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

// Navegación para super admin (vista global)
const globalNavigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, module: "dashboard" },
  { name: "Instituciones", href: "/institutions", icon: Building2, module: "institutions" },
];

// Navegación para contexto institucional
const institutionalNavigation = [
  { name: "Dashboard", href: "", icon: LayoutDashboard, module: "dashboard", contextual: true },
  { name: "Sedes", href: "/venues", icon: MapPin, module: "venues" },
  { name: "Grupos", href: "/groups", icon: Users, module: "groups" },
  { name: "Deportistas", href: "/athletes", icon: UserCheck, module: "athletes" },
  { name: "Eventos", href: "/events", icon: Calendar, module: "events" },
  { name: "Publicaciones", href: "/publications", icon: Megaphone, module: "publications" },
  { name: "Notificaciones", href: "/notifications", icon: Bell, module: "notifications" },
  { name: "Asistencias", href: "/attendance", icon: ClipboardCheck, module: "attendance" },
];

const settingsNavigation = [
  { name: "Gestión de Usuarios", href: "/user-management", icon: UserCog, requiresUserManagement: true },
  { name: "Gestión de Roles", href: "/role-management", icon: Shield, requiresRoleManagement: true },
  { name: "Configuración", href: "/system-config", icon: Settings },
];

export function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { hasModuleAccess, canAccessUserManagement, canAccessRoleManagement } = usePermissions();
  const { currentInstitution, isInInstitutionContext } = useInstitutionContext();
  const { platformName, platformDescription } = useSystemConfig();
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Generar iniciales del nombre de la plataforma
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };
  
  // Determinar qué navegación usar según el contexto
  const currentNavigation = isInInstitutionContext ? institutionalNavigation : globalNavigation;
  
  // Filter navigation items based on user permissions
  const filteredNavigation = currentNavigation.filter(item => {
    if (!item.module) return true;
    return hasModuleAccess(item.module);
  }).map(item => {
    // Ajustar hrefs para contexto institucional
    if (item.contextual && currentInstitution) {
      return {
        ...item,
        href: `/institution/${currentInstitution.id}/dashboard`
      };
    }
    return item;
  });

  // Filter settings navigation
  const filteredSettingsNavigation = settingsNavigation.filter(item => {
    if (item.requiresUserManagement) return canAccessUserManagement();
    if (item.requiresRoleManagement) return canAccessRoleManagement();
    return true;
  });

  const handleLogout = async () => {
    await logout();
    window.location.href = "/login";
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <aside className={cn(
      "bg-background border-r transition-all duration-300 flex flex-col h-full",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Header with Toggle */}
      <div className={cn(
        "p-4 border-b flex items-center justify-between",
        isCollapsed && "px-2"
      )}>
        {!isCollapsed ? (
          <Link href="/dashboard">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">{getInitials(platformName)}</span>
              </div>
              <div>
                <h2 className="text-lg font-bold">{platformName}</h2>
                <p className="text-xs text-muted-foreground">{platformDescription}</p>
              </div>
            </div>
          </Link>
        ) : (
          <Link href="/dashboard">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center mx-auto">
              <span className="text-primary-foreground font-bold text-sm">{getInitials(platformName)}</span>
            </div>
          </Link>
        )}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          className="h-8 w-8 p-0"
          data-testid="button-toggle-sidebar"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* User Profile */}
      {user && (
        <div className={cn(
          "p-4 border-b",
          isCollapsed && "px-2"
        )}>
          <div className={cn(
            "flex items-center",
            isCollapsed && "justify-center"
          )}>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-medium text-primary">
                {user.email?.[0]?.toUpperCase()}
              </span>
            </div>
            {!isCollapsed && (
              <div className="ml-3">
                <p className="text-sm font-medium text-foreground truncate">
                  {user.email}
                </p>
                <p className="text-xs text-muted-foreground">Usuario</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        <div className="space-y-1">
          {filteredNavigation.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.name} href={item.href}>
                <div
                  data-testid={`nav-${item.name.toLowerCase()}`}
                  className={cn(
                    "group flex items-center rounded-md cursor-pointer transition-colors",
                    isCollapsed ? "px-2 py-2 justify-center" : "px-3 py-2",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {!isCollapsed && (
                    <span className="ml-3 text-sm font-medium">{item.name}</span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        {/* Settings Section */}
        <div className="pt-4">
          {!isCollapsed && (
            <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Configuración
            </h3>
          )}
          <div className="space-y-1">
            {filteredSettingsNavigation.map((item) => {
              const isActive = location === item.href;
              return (
                <Link key={item.name} href={item.href}>
                  <div
                    data-testid={`nav-${item.name.toLowerCase()}`}
                    className={cn(
                      "group flex items-center rounded-md cursor-pointer transition-colors",
                      isCollapsed ? "px-2 py-2 justify-center" : "px-3 py-2",
                      isActive
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {!isCollapsed && (
                      <span className="ml-3 text-sm font-medium">{item.name}</span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Logout Button */}
      <div className={cn(
        "p-2 border-t",
        isCollapsed && "px-2"
      )}>
        <button
          onClick={handleLogout}
          data-testid="button-logout"
          className={cn(
            "w-full group flex items-center rounded-md cursor-pointer transition-colors text-muted-foreground hover:bg-destructive hover:text-destructive-foreground",
            isCollapsed ? "px-2 py-2 justify-center" : "px-3 py-2"
          )}
        >
          <LogOut className="h-5 w-5" />
          {!isCollapsed && (
            <span className="ml-3 text-sm font-medium">Cerrar Sesión</span>
          )}
        </button>
      </div>
    </aside>
  );
}