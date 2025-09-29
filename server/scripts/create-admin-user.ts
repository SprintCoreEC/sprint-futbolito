import { supabaseAdmin } from "../services/supabase";

interface CreateAdminUserOptions {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  institutionId: string | null;
  role?: string; // Rol opcional, por defecto admin_institucion
}

export async function createAdminUser(options: CreateAdminUserOptions) {
  const { email, password, firstName, lastName, institutionId, role = 'admin_institucion' } = options;

  try {
    console.log(`🔐 Creando usuario administrador: ${email}`);

    // 1. Crear usuario en Supabase Auth
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Confirmar email automáticamente
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        role: role
      }
    });

    if (authError) {
      throw new Error(`Error creando usuario en Auth: ${authError.message}`);
    }

    if (!authUser.user) {
      throw new Error('No se pudo crear el usuario en Auth');
    }

    console.log(`✅ Usuario creado en Supabase Auth: ${authUser.user.id}`);

    // 2. Si hay institutionId, verificar si la institución existe
    if (institutionId) {
      const { data: institution, error: instError } = await supabaseAdmin
        .from('institutions')
        .select('id')
        .eq('id', institutionId)
        .single();

      if (instError && instError.code !== 'PGRST116') {
        throw new Error(`Error verificando institución: ${instError.message}`);
      }

      // 3. Crear institución si no existe
      if (!institution) {
        const { error: createInstError } = await supabaseAdmin
          .from('institutions')
          .insert({
            id: institutionId,
            name: 'Club Deportivo Águilas',
            description: 'Club de fútbol juvenil',
            primary_color: '#3B82F6',
            secondary_color: '#1E40AF',
            accent_color: '#EFF6FF',
            is_active: true
          });

        if (createInstError) {
          throw new Error(`Error creando institución: ${createInstError.message}`);
        }
        
        console.log(`✅ Institución creada: ${institutionId}`);
      }
    }

    // 4. Crear usuario en nuestra tabla users
    const { error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authUser.user.id,
        email,
        first_name: firstName,
        last_name: lastName,
        role: role,
        institution_id: institutionId,
        venue_ids: [],
        group_ids: [],
        permissions: {
          manage_institutions: true,
          manage_venues: true,
          manage_users: true,
          manage_groups: true,
          manage_athletes: true,
          manage_events: true,
          manage_publications: true,
          manage_notifications: true
        },
        phone: null,
        is_active: true
      });

    if (userError) {
      throw new Error(`Error creando usuario en tabla users: ${userError.message}`);
    }

    console.log(`✅ Usuario administrador creado exitosamente`);
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   Role: ${role}`);
    console.log(`   Institution: ${institutionId}`);

    return {
      success: true,
      user: authUser.user,
      message: 'Usuario administrador creado exitosamente'
    };

  } catch (error) {
    console.error('❌ Error creando usuario administrador:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Script principal para ejecutar
async function main() {
  const adminConfig = {
    email: 'admin@club.com',
    password: 'Admin123!',
    firstName: 'Administrator',
    lastName: 'Sistema',
    institutionId: 'inst-001'
  };

  const result = await createAdminUser(adminConfig);
  
  if (result.success) {
    console.log('\n🎉 ¡Usuario administrador creado con éxito!');
    console.log('Ahora puedes iniciar sesión con:');
    console.log(`Email: ${adminConfig.email}`);
    console.log(`Password: ${adminConfig.password}`);
  } else {
    console.log('\n💥 Error:', result.error);
  }
  
  process.exit(result.success ? 0 : 1);
}

// Ejecutar si es llamado directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}