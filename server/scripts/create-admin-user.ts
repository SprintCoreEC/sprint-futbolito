import { supabaseAdmin } from "../services/supabase";

interface CreateAdminUserOptions {
  email: string;
  password: string;
  nombres: string;
  apellidos: string;
  institucionId: string | null;
  role?: string; // Rol opcional, por defecto admin_institucion
}

export async function createAdminUser(options: CreateAdminUserOptions) {
  const {
    email,
    password,
    nombres,
    apellidos,
    institucionId,
    role = "admin_institucion",
  } = options;

  try {
    console.log(`🔐 Creando usuario administrador: ${email}`);

    // 1. Crear usuario en Supabase Auth
    const { data: authUser, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Confirmar email automáticamente
        user_metadata: {
          first_name: nombres,
          last_name: apellidos,
          role: role,
        },
      });

    if (authError) {
      throw new Error(`Error creando usuario en Auth: ${authError.message}`);
    }

    if (!authUser.user) {
      throw new Error("No se pudo crear el usuario en Auth");
    }

    console.log(`✅ Usuario creado en Supabase Auth: ${authUser.user.id}`);

    // 2. Si hay institucionId, verificar si la institución existe
    if (institucionId) {
      const { data: institution, error: instError } = await supabaseAdmin
        .from("instituciones")
        .select("id")
        .eq("id", institucionId)
        .single();

      if (instError && instError.code !== "PGRST116") {
        throw new Error(`Error verificando institución: ${instError.message}`);
      }

      // 3. Crear institución si no existe
      if (!institution) {
        const { error: createInstError } = await supabaseAdmin
          .from("instituciones")
          .insert({
            id: institucionId,
            nombre: "Club Deportivo Águilas",
            descripcion: "Club de fútbol juvenil",
            color_primario: "#3B82F6",
            color_secundario: "#1E40AF",
            activo: true,
          });

        if (createInstError) {
          throw new Error(
            `Error creando institución: ${createInstError.message}`
          );
        }

        console.log(`✅ Institución creada: ${institucionId}`);
      }
    }

    // obtener rol de la tabla roles
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from("roles")
      .select("id")
      .eq("nombre", role)
      .single();

    if (roleError) {
      throw new Error(`Error obteniendo rol: ${roleError.message}`);
    }

    // 4. Crear usuario en nuestra tabla users
    const { error: userError } = await supabaseAdmin
      .from("colaboradores")
      .insert({
        auth_user_id: authUser.user.id,
        email,
        nombres: nombres,
        apellidos: apellidos,
        rol_id: roleData.id,
        institucion_id: institucionId,
        telefono: null,
        activo: true,
      });

    if (userError) {
      throw new Error(
        `Error creando usuario en tabla users: ${userError.message}`
      );
    }

    console.log(`✅ Usuario administrador creado exitosamente`);
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   Role: ${role}`);
    console.log(`   Institution: ${institucionId}`);

    return {
      success: true,
      user: authUser.user,
      message: "Usuario administrador creado exitosamente",
    };
  } catch (error) {
    console.error("❌ Error creando usuario administrador:", error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Script principal para ejecutar
async function main() {
  const adminConfig = {
    email: "admin@club.com",
    password: "Admin123!",
    nombres: "Administrator",
    apellidos: "Sistema",
    institucionId: "inst-001",
  };

  const result = await createAdminUser(adminConfig);

  if (result.success) {
    console.log("\n🎉 ¡Usuario administrador creado con éxito!");
    console.log("Ahora puedes iniciar sesión con:");
    console.log(`Email: ${adminConfig.email}`);
    console.log(`Password: ${adminConfig.password}`);
  } else {
    console.log("\n💥 Error:", result.error);
  }

  process.exit(result.success ? 0 : 1);
}

// Ejecutar si es llamado directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
