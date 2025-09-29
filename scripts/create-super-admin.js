import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.DATABASE_URL?.replace('postgresql://', 'https://').split('@')[1]?.replace(':', '.') || '';
const supabaseKey = process.env.SUPABASE_KEY || '';

// Crear cliente de Supabase para operaciones de auth
const supabaseAuth = createClient(supabaseUrl, supabaseKey);

async function createSuperAdmin() {
  try {
    console.log('🚀 Creando usuario super admin...');
    
    // Datos del super admin
    const superAdminData = {
      email: 'superadmin@sports.com',
      password: 'SuperAdmin123!',
      options: {
        data: {
          first_name: 'Super',
          last_name: 'Admin',
          role: 'super_admin',
          email_verified: true
        }
      }
    };

    // Crear usuario en Supabase Auth
    const { data: authUser, error: authError } = await supabaseAuth.auth.admin.createUser(superAdminData);
    
    if (authError) {
      console.error('❌ Error creando usuario de autenticación:', authError.message);
      return;
    }

    console.log('✅ Usuario super admin creado exitosamente!');
    console.log('📧 Email:', superAdminData.email);
    console.log('🔑 Contraseña:', superAdminData.password);
    console.log('👤 ID:', authUser.user?.id);
    console.log('🎯 Rol:', 'super_admin');
    
    console.log('\n🎉 ¡Super admin creado! Usa estas credenciales para iniciar sesión:');
    console.log(`Email: ${superAdminData.email}`);
    console.log(`Password: ${superAdminData.password}`);
    
  } catch (error) {
    console.error('💥 Error inesperado:', error);
  }
}

// Ejecutar solo si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  createSuperAdmin();
}

export { createSuperAdmin };