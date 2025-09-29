import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { 
  Settings, 
  Save, 
  Palette, 
  Mail, 
  Shield, 
  Database,
  Bell,
  Server
} from "lucide-react";
import { useState, useEffect } from "react";

interface ConfigItem {
  key: string;
  label: string;
  value: string | boolean;
  type: 'text' | 'textarea' | 'email' | 'color' | 'number' | 'boolean';
  category: string;
  description?: string;
}

export default function SystemConfig() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Cargar configuraciones desde el backend
  const { data: backendConfigs, isLoading, dataUpdatedAt } = useQuery({
    queryKey: ["/api/system-config"],
    enabled: !!user,
  });

  // Configuraciones del sistema (datos por defecto)
  const [configs, setConfigs] = useState<ConfigItem[]>([
    // Configuración General
    {
      key: 'platform_name',
      label: 'Nombre de la Plataforma',
      value: 'SportsPlatform',
      type: 'text',
      category: 'general',
      description: 'Nombre que aparece en el sistema'
    },
    {
      key: 'platform_description',
      label: 'Descripción',
      value: 'Gestión Deportiva Integral',
      type: 'textarea',
      category: 'general',
      description: 'Descripción que aparece en el login'
    },
    {
      key: 'support_email',
      label: 'Email de Soporte',
      value: 'soporte@sportsplatform.com',
      type: 'email',
      category: 'general',
      description: 'Email de contacto para soporte técnico'
    },
    
    // Configuración de Apariencia
    {
      key: 'primary_color',
      label: 'Color Primario',
      value: '#3B82F6',
      type: 'color',
      category: 'appearance',
      description: 'Color principal del sistema'
    },
    {
      key: 'secondary_color',
      label: 'Color Secundario',
      value: '#1E40AF',
      type: 'color',
      category: 'appearance',
      description: 'Color secundario del sistema'
    },
    
    // Configuración de Seguridad
    {
      key: 'session_duration',
      label: 'Duración de Sesión (horas)',
      value: '24',
      type: 'number',
      category: 'security',
      description: 'Tiempo antes de expirar sesiones automáticamente'
    },
    {
      key: 'password_min_length',
      label: 'Longitud Mínima de Contraseña',
      value: '8',
      type: 'number',
      category: 'security',
      description: 'Mínimo de caracteres para contraseñas'
    },
    {
      key: 'require_password_special_chars',
      label: 'Requerir Caracteres Especiales',
      value: true,
      type: 'boolean',
      category: 'security',
      description: 'Obligar uso de caracteres especiales en contraseñas'
    },
    
    // Configuración de Email
    {
      key: 'smtp_host',
      label: 'Servidor SMTP',
      value: 'smtp.gmail.com',
      type: 'text',
      category: 'email',
      description: 'Servidor para envío de emails'
    },
    {
      key: 'smtp_port',
      label: 'Puerto SMTP',
      value: '587',
      type: 'number',
      category: 'email',
      description: 'Puerto del servidor SMTP'
    },
    
    // Configuración de Notificaciones
    {
      key: 'notifications_enabled',
      label: 'Notificaciones Habilitadas',
      value: true,
      type: 'boolean',
      category: 'notifications',
      description: 'Permitir envío de notificaciones push'
    },
    {
      key: 'max_notifications_per_day',
      label: 'Máximo Notificaciones por Día',
      value: '10',
      type: 'number',
      category: 'notifications',
      description: 'Límite diario de notificaciones por usuario'
    },
    
    // Configuración de Límites
    {
      key: 'max_users_per_institution',
      label: 'Máximo Usuarios por Institución',
      value: '500',
      type: 'number',
      category: 'limits',
      description: 'Límite de usuarios que puede tener una institución'
    },
    {
      key: 'max_venues_per_institution',
      label: 'Máximo Sedes por Institución',
      value: '20',
      type: 'number',
      category: 'limits',
      description: 'Límite de sedes que puede tener una institución'
    }
  ]);

  // Actualizar configs cuando se carguen datos del backend
  useEffect(() => {
    if (backendConfigs?.data?.length > 0) {
      const defaultConfigs = [
        // Configuración General
        {
          key: 'platform_name',
          label: 'Nombre de la Plataforma',
          value: 'SportsPlatform',
          type: 'text',
          category: 'general',
          description: 'Nombre que aparece en el sistema'
        },
        {
          key: 'platform_description',
          label: 'Descripción',
          value: 'Gestión Deportiva Integral',
          type: 'textarea',
          category: 'general',
          description: 'Descripción que aparece en el login'
        },
        {
          key: 'support_email',
          label: 'Email de Soporte',
          value: 'soporte@sportsplatform.com',
          type: 'email',
          category: 'general',
          description: 'Email de contacto para soporte técnico'
        },
        
        // Configuración de Apariencia
        {
          key: 'primary_color',
          label: 'Color Primario',
          value: '#3B82F6',
          type: 'color',
          category: 'appearance',
          description: 'Color principal del sistema'
        },
        {
          key: 'secondary_color',
          label: 'Color Secundario',
          value: '#1E40AF',
          type: 'color',
          category: 'appearance',
          description: 'Color secundario del sistema'
        },
        
        // Configuración de Seguridad
        {
          key: 'session_duration',
          label: 'Duración de Sesión (horas)',
          value: '24',
          type: 'number',
          category: 'security',
          description: 'Tiempo antes de expirar sesiones automáticamente'
        },
        {
          key: 'password_min_length',
          label: 'Longitud Mínima de Contraseña',
          value: '8',
          type: 'number',
          category: 'security',
          description: 'Mínimo de caracteres para contraseñas'
        },
        {
          key: 'require_password_special_chars',
          label: 'Requerir Caracteres Especiales',
          value: true,
          type: 'boolean',
          category: 'security',
          description: 'Obligar uso de caracteres especiales en contraseñas'
        },
        
        // Configuración de Email
        {
          key: 'smtp_host',
          label: 'Servidor SMTP',
          value: 'smtp.gmail.com',
          type: 'text',
          category: 'email',
          description: 'Servidor para envío de emails'
        },
        {
          key: 'smtp_port',
          label: 'Puerto SMTP',
          value: '587',
          type: 'number',
          category: 'email',
          description: 'Puerto del servidor SMTP'
        },
        
        // Configuración de Notificaciones
        {
          key: 'notifications_enabled',
          label: 'Notificaciones Habilitadas',
          value: true,
          type: 'boolean',
          category: 'notifications',
          description: 'Permitir envío de notificaciones push'
        },
        {
          key: 'max_notifications_per_day',
          label: 'Máximo Notificaciones por Día',
          value: '10',
          type: 'number',
          category: 'notifications',
          description: 'Límite diario de notificaciones por usuario'
        },
        
        // Configuración de Límites
        {
          key: 'max_users_per_institution',
          label: 'Máximo Usuarios por Institución',
          value: '500',
          type: 'number',
          category: 'limits',
          description: 'Límite de usuarios que puede tener una institución'
        },
        {
          key: 'max_venues_per_institution',
          label: 'Máximo Sedes por Institución',
          value: '20',
          type: 'number',
          category: 'limits',
          description: 'Límite de sedes que puede tener una institución'
        }
      ];

      const updatedConfigs = defaultConfigs.map(config => {
        const backendConfig = backendConfigs.data.find((bc: any) => bc.key === config.key);
        if (backendConfig) {
          let processedValue = backendConfig.value;
          
          // Si es un string que viene con comillas dobles, quitarlas
          if (typeof processedValue === 'string' && processedValue.startsWith('"') && processedValue.endsWith('"')) {
            processedValue = processedValue.slice(1, -1);
          }
          
          return {
            ...config,
            value: processedValue
          };
        }
        return config;
      });
      setConfigs(updatedConfigs);
    }
  }, [backendConfigs]);


  // Mutación para guardar configuraciones
  const saveConfigMutation = useMutation({
    mutationFn: async ({ category, configsToSave }: { category: string, configsToSave: ConfigItem[] }) => {
      const formattedConfigs = configsToSave.map(config => ({
        key: config.key,
        value: config.type === 'boolean' 
          ? config.value 
          : config.type === 'number'
          ? Number(config.value)
          : `"${config.value}"`, // Envolver strings en comillas para JSON
        description: config.description,
        category: config.category,
        is_public: false
      }));
      
      return apiRequest('POST', '/api/system-config', { configs: formattedConfigs });
    },
    onSuccess: (data, variables) => {
      toast({
        title: "Configuración guardada",
        description: `Configuraciones de ${categories.find(c => c.key === variables.category)?.label} actualizadas correctamente.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/system-config"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error al guardar",
        description: error.message || "No se pudieron guardar las configuraciones",
        variant: "destructive",
      });
    }
  });

  const categories = [
    { key: 'general', label: 'General', icon: Settings, color: 'blue' },
    { key: 'appearance', label: 'Apariencia', icon: Palette, color: 'purple' },
    { key: 'security', label: 'Seguridad', icon: Shield, color: 'red' },
    { key: 'email', label: 'Email', icon: Mail, color: 'green' },
    { key: 'notifications', label: 'Notificaciones', icon: Bell, color: 'yellow' },
    { key: 'limits', label: 'Límites', icon: Database, color: 'gray' }
  ];

  const updateConfig = (key: string, value: string | boolean) => {
    setConfigs(prev => prev.map(config => 
      config.key === key ? { ...config, value } : config
    ));
  };

  const handleSaveCategory = (category: string) => {
    const categoryConfigs = configs.filter(c => c.category === category);
    saveConfigMutation.mutate({ category, configsToSave: categoryConfigs });
  };

  const renderConfigInput = (config: ConfigItem) => {
    switch (config.type) {
      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Switch 
              checked={config.value as boolean}
              onCheckedChange={(checked) => updateConfig(config.key, checked)}
              data-testid={`switch-${config.key}`}
            />
            <Label className="text-sm text-muted-foreground">
              {config.value ? 'Habilitado' : 'Deshabilitado'}
            </Label>
          </div>
        );
      case 'textarea':
        return (
          <Textarea
            value={config.value as string}
            onChange={(e) => updateConfig(config.key, e.target.value)}
            className="min-h-[80px]"
            data-testid={`textarea-${config.key}`}
          />
        );
      case 'color':
        return (
          <div className="flex items-center space-x-3">
            <Input
              type="color"
              value={config.value as string}
              onChange={(e) => updateConfig(config.key, e.target.value)}
              className="w-16 h-10 p-1 border-2"
              data-testid={`color-${config.key}`}
            />
            <Input
              type="text"
              value={config.value as string}
              onChange={(e) => updateConfig(config.key, e.target.value)}
              className="font-mono text-sm"
              data-testid={`text-${config.key}`}
            />
          </div>
        );
      default:
        return (
          <Input
            type={config.type}
            value={config.value as string}
            onChange={(e) => updateConfig(config.key, e.target.value)}
            data-testid={`input-${config.key}`}
          />
        );
    }
  };

  return (
    <MainLayout 
      title="Configuración Global del Sistema" 
      subtitle="Administrar configuraciones y parámetros del sistema"
    >
      <div className="space-y-8">
        {/* Navegación por categorías */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((category) => {
            const Icon = category.icon;
            const configCount = configs.filter(c => c.category === category.key).length;
            return (
              <Card key={category.key} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4 text-center">
                  <Icon className={`w-8 h-8 mx-auto mb-2 text-${category.color}-600`} />
                  <h3 className="font-medium text-sm">{category.label}</h3>
                  <Badge variant="outline" className="mt-1 text-xs">
                    {configCount} configs
                  </Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Configuraciones por categoría */}
        {categories.map((category) => {
          const Icon = category.icon;
          const categoryConfigs = configs.filter(c => c.category === category.key);
          
          if (categoryConfigs.length === 0) return null;

          return (
            <Card key={category.key} data-testid={`card-category-${category.key}`}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Icon className={`w-5 h-5 text-${category.color}-600`} />
                    <span>{category.label}</span>
                  </div>
                  <Button 
                    onClick={() => handleSaveCategory(category.key)}
                    size="sm"
                    disabled={saveConfigMutation.isPending}
                    data-testid={`button-save-${category.key}`}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saveConfigMutation.isPending ? 'Guardando...' : 'Guardar'}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {categoryConfigs.map((config) => (
                    <div key={config.key} className="space-y-2">
                      <Label className="text-sm font-medium">
                        {config.label}
                      </Label>
                      <div key={`${config.key}-${dataUpdatedAt || 0}`}>
                        {renderConfigInput(config)}
                      </div>
                      {config.description && (
                        <p className="text-xs text-muted-foreground">
                          {config.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {/* Acciones Globales */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Server className="w-5 h-5" />
              <span>Acciones del Sistema</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button variant="outline" data-testid="button-backup">
                <Database className="w-4 h-4 mr-2" />
                Crear Backup
              </Button>
              <Button variant="outline" data-testid="button-clear-cache">
                <Server className="w-4 h-4 mr-2" />
                Limpiar Caché
              </Button>
              <Button variant="outline" data-testid="button-export-config">
                <Settings className="w-4 h-4 mr-2" />
                Exportar Configuración
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}