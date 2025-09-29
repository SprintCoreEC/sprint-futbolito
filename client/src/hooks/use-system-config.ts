import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";

export function useSystemConfig() {
  const { user } = useAuth();
  
  const { data: configs, isLoading } = useQuery({
    queryKey: ["/api/system-config"],
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: false, // No reintentar en errores
    refetchOnWindowFocus: false, // No recargar al enfocar ventana
    enabled: !!user, // Solo ejecutar si hay usuario autenticado
  });

  // Función helper para obtener un valor específico de configuración
  const getConfigValue = (key: string, defaultValue: any = '') => {
    if (!configs?.data) return defaultValue;
    
    const config = configs.data.find((c: any) => c.key === key);
    if (!config) return defaultValue;
    
    let value = config.value;
    
    // Si es un string que viene con comillas dobles, quitarlas
    if (typeof value === 'string' && value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }
    
    return value;
  };

  return {
    configs: configs?.data || [],
    isLoading,
    getConfigValue,
    // Configuraciones comunes
    platformName: getConfigValue('platform_name', 'SportsPlatform'),
    platformDescription: getConfigValue('platform_description', 'Gestión Deportiva'),
    primaryColor: getConfigValue('primary_color', '#3B82F6'),
    secondaryColor: getConfigValue('secondary_color', '#1E40AF'),
    supportEmail: getConfigValue('support_email', 'soporte@sportsplatform.com'),
  };
}