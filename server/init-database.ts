import { supabaseAdmin } from "./services/supabase";
import { fullSupabaseCheck } from "./services/connection-check";
import { createAdminUser } from "./scripts/create-admin-user";

export async function initializeDatabase() {
  try {
    console.log("Inicializando base de datos...");

    // Realizar verificación completa
    const checkResult = await fullSupabaseCheck();

    // Mostrar resultados
    console.log(`📊 Estado general: ${checkResult.overall.message}`);
    console.log(`🔌 Conexión: ${checkResult.connection.message}`);
    console.log(`📋 Tablas: ${checkResult.tables.message}`);
    console.log(`⚡ Rendimiento: ${checkResult.performance.message}`);
    console.log(`📦 Connection: ${checkResult.overall.isConnected}`);

    if (checkResult.overall.isConnected) {
      // Insert sample data if needed
      // await insertSampleData();

      // Crear usuarios administradores si no existen
      await createAdminIfNotExists();
      await createSuperAdminIfNotExists();

      console.log("✅ Base de datos inicializada correctamente");
    } else {
      console.log("⚠️ Funcionará con datos de ejemplo (mock data)");
    }
  } catch (error) {
    console.log("❌ Error inicializando base de datos:", error.message);
    console.log("ℹ️ Funcionará con datos de ejemplo (mock data)");
  }
}

async function createAdminIfNotExists() {
  try {
    // Verificar si ya existe un usuario administrador
    const { data: existingAdmin } = await supabaseAdmin
      .from("colaboradores")
      .select("email")
      .eq("email", "admin@club.com")
      .single();

    if (!existingAdmin) {
      console.log("👤 Creando usuario administrador...");

      const result = await createAdminUser({
        email: "admin@club.com",
        password: "Admin123!",
        nombres: "Administrator",
        apellidos: "Sistema",
        institucionId: "16020324-f0ea-4319-905c-5a30618ce9f5",
      });

      if (result.success) {
        console.log("✅ Usuario administrador creado:");
        console.log("   📧 Email: admin@club.com");
        console.log("   🔑 Password: Admin123!");
      }
    } else {
      console.log("ℹ️ Usuario administrador ya existe: admin@club.com");
    }
  } catch (error) {
    console.log("⚠️ Error verificando/creando usuario admin:", error.message);
  }
}

async function createSuperAdminIfNotExists() {
  try {
    // Verificar si ya existe el super administrador
    const { data: existingSuperAdmin } = await supabaseAdmin
      .from("colaboradores")
      .select("email")
      .eq("email", "superadmin@sports.com")
      .single();

    if (!existingSuperAdmin) {
      console.log("🚀 Creando usuario SUPER ADMINISTRADOR...");

      const result = await createAdminUser({
        email: "superadmin@sports.com",
        password: "SuperAdmin123!",
        nombres: "Super",
        apellidos: "Admin",
        institucionId: "16020324-f0ea-4319-905c-5a30618ce9f5",
        role: "super_admin",
      });

      if (result.success) {
        console.log("✅ Usuario SUPER ADMINISTRADOR creado:");
        console.log("   📧 Email: superadmin@sports.com");
        console.log("   🔑 Password: SuperAdmin123!");
        console.log("   👑 Rol: SUPER_ADMIN (Acceso total)");
      }
    } else {
      console.log(
        "ℹ️ Usuario super administrador ya existe: superadmin@sports.com"
      );
    }
  } catch (error) {
    console.log("⚠️ Error verificando/creando super admin:", error.message);
  }
}

async function checkTables() {
  const tables = [
    "instituciones",
    "colaboradores",
    "grupos",
    "deportistas",
    "eventos",
    "asistencias",
    "publicaciones",
    "notificaciones",
  ];

  for (const table of tables) {
    try {
      const { error } = await supabaseAdmin.from(table).select("*").limit(1);

      if (error && error.code === "42P01") {
        console.log(`ℹ️ Tabla ${table} no existe, funcionará con datos mock`);
      } else {
        console.log(`✅ Tabla ${table} disponible`);
      }
    } catch (err) {
      console.log(`ℹ️ Verificando tabla ${table}...`);
    }
  }
}

async function insertSampleData() {
  try {
    // Try to insert sample institution
    const { data: institution, error } = await supabaseAdmin
      .from("instituciones")
      .insert({
        nombre: "Club Deportivo Águilas",
        descripcion: "Club de fútbol juvenil con sede en Madrid",
        color_primario: "#3B82F6",
        color_secundario: "#1E40AF",
        activo: true,
      })
      .select()
      .single();

    console.log("Error:", error);
    console.log("Institution:", institution);

    if (!error && institution) {
      console.log("✅ Datos de ejemplo insertados correctamente");
    }
  } catch (error) {
    console.log("ℹ️ Usando datos mock para demostración");
  }
}
