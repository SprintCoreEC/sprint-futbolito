import { supabaseAdmin } from './supabase';

export interface ConnectionStatus {
  isConnected: boolean;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: {
    tablesFound: string[];
    tablesCount: number;
    responseTime: number;
  };
}

export class SupabaseConnectionChecker {
  private static instance: SupabaseConnectionChecker;
  
  private constructor() {}
  
  public static getInstance(): SupabaseConnectionChecker {
    if (!SupabaseConnectionChecker.instance) {
      SupabaseConnectionChecker.instance = new SupabaseConnectionChecker();
    }
    return SupabaseConnectionChecker.instance;
  }

  /**
   * Verifica la conexión básica a Supabase
   */
  async checkConnection(): Promise<ConnectionStatus> {
    const startTime = performance.now();
    
    try {
      // Intenta hacer una consulta simple
      const { data, error } = await supabaseAdmin
        .from('institutions')
        .select('id')
        .limit(1);
      
      const responseTime = Math.round(performance.now() - startTime);
      
      if (error) {
        return {
          isConnected: false,
          status: 'error',
          message: `Error de conexión: ${error.message}`,
          details: {
            tablesFound: [],
            tablesCount: 0,
            responseTime
          }
        };
      }

      return {
        isConnected: true,
        status: 'success',
        message: `Conexión exitosa a Supabase (${responseTime}ms)`,
        details: {
          tablesFound: ['institutions'],
          tablesCount: data ? data.length : 0,
          responseTime
        }
      };
      
    } catch (error) {
      const responseTime = Math.round(performance.now() - startTime);
      
      return {
        isConnected: false,
        status: 'error',
        message: `Error de conexión: ${error.message}`,
        details: {
          tablesFound: [],
          tablesCount: 0,
          responseTime
        }
      };
    }
  }

  /**
   * Verifica todas las tablas requeridas de la aplicación
   */
  async checkAllTables(): Promise<ConnectionStatus> {
    const requiredTables = [
      'institutions',
      'venues', 
      'users',
      'groups',
      'athletes',
      'events',
      'attendance',
      'publications',
      'notifications'
    ];
    
    const startTime = performance.now();
    const tablesFound: string[] = [];
    
    try {
      for (const tableName of requiredTables) {
        try {
          const { error } = await supabaseAdmin
            .from(tableName)
            .select('*')
            .limit(1);
          
          if (!error) {
            tablesFound.push(tableName);
          }
        } catch (tableError) {
          // Tabla no encontrada o sin acceso
          console.log(`Tabla ${tableName} no disponible:`, tableError.message);
        }
      }
      
      const responseTime = Math.round(performance.now() - startTime);
      const allTablesFound = tablesFound.length === requiredTables.length;
      
      if (allTablesFound) {
        return {
          isConnected: true,
          status: 'success',
          message: `Todas las tablas encontradas (${tablesFound.length}/${requiredTables.length})`,
          details: {
            tablesFound,
            tablesCount: tablesFound.length,
            responseTime
          }
        };
      } else {
        return {
          isConnected: tablesFound.length > 0,
          status: 'warning',
          message: `${tablesFound.length}/${requiredTables.length} tablas encontradas. Funcionará con datos limitados.`,
          details: {
            tablesFound,
            tablesCount: tablesFound.length,
            responseTime
          }
        };
      }
      
    } catch (error) {
      const responseTime = Math.round(performance.now() - startTime);
      
      return {
        isConnected: false,
        status: 'error',
        message: `Error verificando tablas: ${error.message}`,
        details: {
          tablesFound,
          tablesCount: tablesFound.length,
          responseTime
        }
      };
    }
  }

  /**
   * Verifica la velocidad de respuesta de la base de datos
   */
  async checkPerformance(): Promise<ConnectionStatus> {
    const startTime = performance.now();
    
    try {
      // Realizar múltiples consultas para medir rendimiento promedio
      const promises = Array.from({ length: 3 }, () => 
        supabaseAdmin.from('institutions').select('id').limit(1)
      );
      
      await Promise.all(promises);
      
      const responseTime = Math.round((performance.now() - startTime) / 3);
      
      let status: 'success' | 'warning' | 'error' = 'success';
      let message = `Rendimiento excelente (${responseTime}ms promedio)`;
      
      if (responseTime > 500) {
        status = 'warning';
        message = `Rendimiento lento (${responseTime}ms promedio)`;
      } else if (responseTime > 1000) {
        status = 'error';  
        message = `Rendimiento muy lento (${responseTime}ms promedio)`;
      }
      
      return {
        isConnected: true,
        status,
        message,
        details: {
          tablesFound: ['institutions'],
          tablesCount: 1,
          responseTime
        }
      };
      
    } catch (error) {
      return {
        isConnected: false,
        status: 'error',
        message: `Error en test de rendimiento: ${error.message}`,
        details: {
          tablesFound: [],
          tablesCount: 0,
          responseTime: -1
        }
      };
    }
  }

  /**
   * Ejecuta un check completo (conexión, tablas y rendimiento)
   */
  async fullCheck(): Promise<{
    overall: ConnectionStatus;
    connection: ConnectionStatus;
    tables: ConnectionStatus;
    performance: ConnectionStatus;
  }> {
    console.log('🔍 Iniciando verificación completa de Supabase...');
    
    const [connection, tables, performance] = await Promise.all([
      this.checkConnection(),
      this.checkAllTables(), 
      this.checkPerformance()
    ]);
    
    // Determinar estado general
    const hasErrors = [connection, tables, performance].some(check => check.status === 'error');
    const hasWarnings = [connection, tables, performance].some(check => check.status === 'warning');
    
    let overallStatus: 'success' | 'warning' | 'error' = 'success';
    let overallMessage = 'Supabase funcionando correctamente';
    
    if (hasErrors) {
      overallStatus = 'error';
      overallMessage = 'Problemas críticos detectados en Supabase';
    } else if (hasWarnings) {
      overallStatus = 'warning';
      overallMessage = 'Supabase funcionando con limitaciones';
    }
    
    const overall: ConnectionStatus = {
      isConnected: connection.isConnected,
      status: overallStatus,
      message: overallMessage,
      details: {
        tablesFound: tables.details?.tablesFound || [],
        tablesCount: tables.details?.tablesCount || 0,
        responseTime: connection.details?.responseTime || 0
      }
    };
    
    console.log(`✅ Verificación completa: ${overall.message}`);
    
    return {
      overall,
      connection,
      tables,
      performance
    };
  }
}

// Función de utilidad para usar en otros archivos
export async function checkSupabaseConnection(): Promise<ConnectionStatus> {
  const checker = SupabaseConnectionChecker.getInstance();
  return await checker.checkConnection();
}

export async function checkSupabaseTables(): Promise<ConnectionStatus> {
  const checker = SupabaseConnectionChecker.getInstance();
  return await checker.checkAllTables();
}

export async function fullSupabaseCheck() {
  const checker = SupabaseConnectionChecker.getInstance();
  return await checker.fullCheck();
}