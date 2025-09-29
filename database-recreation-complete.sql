-- ========================================================================
-- SCRIPT COMPLETO PARA RECREACIÓN DE BASE DE DATOS - PLATAFORMA DEPORTIVA
-- ========================================================================
-- Este script recrea completamente la base de datos del sistema deportivo
-- incluyendo todas las tablas, enums, índices y datos iniciales.

-- PASO 1: Crear extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- PASO 2: Crear ENUMs
CREATE TYPE user_role AS ENUM (
  'super_admin',
  'admin_institucion',
  'admin_sede',
  'entrenador',
  'secretario',
  'representante',
  'deportista'
);

CREATE TYPE visibility AS ENUM ('global', 'sede', 'grupo');
CREATE TYPE publication_status AS ENUM ('borrador', 'programada', 'publicada', 'oculta');
CREATE TYPE notification_type AS ENUM ('push', 'inapp', 'ambas');
CREATE TYPE attendance_status AS ENUM ('presente', 'ausente', 'tardanza', 'justificado');

-- PASO 3: Crear tablas principales

-- Tabla de configuración del sistema
CREATE TABLE system_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    category VARCHAR(50) DEFAULT 'general',
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla de instituciones
CREATE TABLE institutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    logo_url TEXT,
    primary_color VARCHAR(7) DEFAULT '#3B82F6',
    secondary_color VARCHAR(7) DEFAULT '#1E40AF',
    accent_color VARCHAR(7) DEFAULT '#EFF6FF',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla de provincias (Ecuador)
CREATE TABLE provinces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    country TEXT DEFAULT 'Ecuador',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla de ciudades
CREATE TABLE cities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    province_id UUID NOT NULL REFERENCES provinces(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    is_principal BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla de sedes/venues
CREATE TABLE venues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID REFERENCES institutions(id),
    name TEXT NOT NULL,
    address TEXT,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    logo_url TEXT,
    banner_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla de usuarios
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    role TEXT NOT NULL, -- Soporte para roles personalizados
    institution_id UUID REFERENCES institutions(id),
    venue_ids JSONB DEFAULT '[]',
    group_ids JSONB DEFAULT '[]',
    permissions JSONB DEFAULT '{}',
    avatar_url TEXT,
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla de colaboradores (extensión de usuarios para staff)
CREATE TABLE colaboradores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    custom_role_id UUID, -- Para roles personalizados
    city_id UUID REFERENCES cities(id) ON DELETE SET NULL,
    cedula VARCHAR(20),
    birth_date DATE,
    address TEXT,
    start_contract DATE,
    end_contract DATE,
    observations TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla de grupos
CREATE TABLE groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID REFERENCES institutions(id),
    venue_id UUID REFERENCES venues(id),
    name TEXT NOT NULL,
    description TEXT,
    main_trainer_id UUID REFERENCES users(id),
    additional_trainer_ids JSONB DEFAULT '[]',
    schedule JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla de atletas
CREATE TABLE athletes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID REFERENCES institutions(id),
    venue_id UUID REFERENCES venues(id),
    group_id UUID REFERENCES groups(id),
    representative_id UUID REFERENCES users(id),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    birth_date TIMESTAMPTZ,
    document_number VARCHAR(20),
    avatar_url TEXT,
    medical_info JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla de eventos
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID REFERENCES institutions(id),
    venue_id UUID REFERENCES venues(id),
    group_id UUID REFERENCES groups(id),
    title TEXT NOT NULL,
    description TEXT,
    event_type VARCHAR(50) DEFAULT 'entrenamiento',
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    location TEXT,
    is_match BOOLEAN DEFAULT false,
    match_id UUID,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla de asistencia
CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id),
    athlete_id UUID REFERENCES athletes(id),
    status attendance_status NOT NULL,
    notes TEXT,
    marked_by UUID REFERENCES users(id),
    marked_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla de publicaciones
CREATE TABLE publications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID REFERENCES institutions(id),
    venue_id UUID REFERENCES venues(id),
    group_id UUID REFERENCES groups(id),
    author_id UUID REFERENCES users(id),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    media_urls JSONB DEFAULT '[]',
    visibility visibility NOT NULL,
    status publication_status DEFAULT 'borrador',
    publish_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabla de notificaciones
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID REFERENCES institutions(id),
    venue_id UUID REFERENCES venues(id),
    group_id UUID REFERENCES groups(id),
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    type notification_type NOT NULL,
    audience JSONB DEFAULT '{}',
    scheduled_for TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    delivered INTEGER DEFAULT 0,
    read INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- PASO 4: Crear índices únicos y optimizaciones
CREATE UNIQUE INDEX unique_city_per_province_idx ON cities (province_id, name);
CREATE INDEX cities_province_id_idx ON cities (province_id);
CREATE UNIQUE INDEX unique_cedula_idx ON colaboradores (cedula) WHERE cedula IS NOT NULL;
CREATE UNIQUE INDEX unique_user_colaborador_idx ON colaboradores (user_id);
CREATE INDEX users_institution_id_idx ON users (institution_id);
CREATE INDEX venues_institution_id_idx ON venues (institution_id);
CREATE INDEX groups_institution_id_idx ON groups (institution_id);
CREATE INDEX athletes_institution_id_idx ON athletes (institution_id);

-- PASO 5: Insertar datos iniciales

-- Configuración del sistema
INSERT INTO system_config (key, value, description, category, is_public) VALUES
('app_name', '"Plataforma Deportiva"', 'Nombre de la aplicación', 'general', true),
('app_version', '"1.0.0"', 'Versión de la aplicación', 'general', true),
('maintenance_mode', 'false', 'Modo mantenimiento activado/desactivado', 'system', false),
('max_file_upload_size', '10485760', 'Tamaño máximo de archivos (bytes)', 'system', false),
('supported_file_types', '["jpg", "jpeg", "png", "pdf", "doc", "docx"]', 'Tipos de archivos soportados', 'system', false),
('default_theme', '"light"', 'Tema por defecto', 'ui', true),
('enable_notifications', 'true', 'Notificaciones habilitadas', 'features', true);

-- Provincias de Ecuador
INSERT INTO provinces (name, country) VALUES
('Azuay', 'Ecuador'),
('Bolívar', 'Ecuador'),
('Cañar', 'Ecuador'),
('Carchi', 'Ecuador'),
('Chimborazo', 'Ecuador'),
('Cotopaxi', 'Ecuador'),
('El Oro', 'Ecuador'),
('Esmeraldas', 'Ecuador'),
('Galápagos', 'Ecuador'),
('Guayas', 'Ecuador'),
('Imbabura', 'Ecuador'),
('Loja', 'Ecuador'),
('Los Ríos', 'Ecuador'),
('Manabí', 'Ecuador'),
('Morona Santiago', 'Ecuador'),
('Napo', 'Ecuador'),
('Orellana', 'Ecuador'),
('Pastaza', 'Ecuador'),
('Pichincha', 'Ecuador'),
('Santa Elena', 'Ecuador'),
('Santo Domingo de los Tsáchilas', 'Ecuador'),
('Sucumbíos', 'Ecuador'),
('Tungurahua', 'Ecuador'),
('Zamora Chinchipe', 'Ecuador');

-- Ciudades principales de cada provincia
INSERT INTO cities (province_id, name, is_principal) 
SELECT id, 'Cuenca', true FROM provinces WHERE name = 'Azuay';

INSERT INTO cities (province_id, name, is_principal) 
SELECT id, 'Guaranda', true FROM provinces WHERE name = 'Bolívar';

INSERT INTO cities (province_id, name, is_principal) 
SELECT id, 'Azogues', true FROM provinces WHERE name = 'Cañar';

INSERT INTO cities (province_id, name, is_principal) 
SELECT id, 'Tulcán', true FROM provinces WHERE name = 'Carchi';

INSERT INTO cities (province_id, name, is_principal) 
SELECT id, 'Riobamba', true FROM provinces WHERE name = 'Chimborazo';

INSERT INTO cities (province_id, name, is_principal) 
SELECT id, 'Latacunga', true FROM provinces WHERE name = 'Cotopaxi';

INSERT INTO cities (province_id, name, is_principal) 
SELECT id, 'Machala', true FROM provinces WHERE name = 'El Oro';

INSERT INTO cities (province_id, name, is_principal) 
SELECT id, 'Esmeraldas', true FROM provinces WHERE name = 'Esmeraldas';

INSERT INTO cities (province_id, name, is_principal) 
SELECT id, 'Puerto Baquerizo Moreno', true FROM provinces WHERE name = 'Galápagos';

INSERT INTO cities (province_id, name, is_principal) 
SELECT id, 'Guayaquil', true FROM provinces WHERE name = 'Guayas';

INSERT INTO cities (province_id, name, is_principal) 
SELECT id, 'Ibarra', true FROM provinces WHERE name = 'Imbabura';

INSERT INTO cities (province_id, name, is_principal) 
SELECT id, 'Loja', true FROM provinces WHERE name = 'Loja';

INSERT INTO cities (province_id, name, is_principal) 
SELECT id, 'Babahoyo', true FROM provinces WHERE name = 'Los Ríos';

INSERT INTO cities (province_id, name, is_principal) 
SELECT id, 'Portoviejo', true FROM provinces WHERE name = 'Manabí';

INSERT INTO cities (province_id, name, is_principal) 
SELECT id, 'Macas', true FROM provinces WHERE name = 'Morona Santiago';

INSERT INTO cities (province_id, name, is_principal) 
SELECT id, 'Tena', true FROM provinces WHERE name = 'Napo';

INSERT INTO cities (province_id, name, is_principal) 
SELECT id, 'Francisco de Orellana', true FROM provinces WHERE name = 'Orellana';

INSERT INTO cities (province_id, name, is_principal) 
SELECT id, 'Puyo', true FROM provinces WHERE name = 'Pastaza';

INSERT INTO cities (province_id, name, is_principal) 
SELECT id, 'Quito', true FROM provinces WHERE name = 'Pichincha';

INSERT INTO cities (province_id, name, is_principal) 
SELECT id, 'Santa Elena', true FROM provinces WHERE name = 'Santa Elena';

INSERT INTO cities (province_id, name, is_principal) 
SELECT id, 'Santo Domingo', true FROM provinces WHERE name = 'Santo Domingo de los Tsáchilas';

INSERT INTO cities (province_id, name, is_principal) 
SELECT id, 'Nueva Loja', true FROM provinces WHERE name = 'Sucumbíos';

INSERT INTO cities (province_id, name, is_principal) 
SELECT id, 'Ambato', true FROM provinces WHERE name = 'Tungurahua';

INSERT INTO cities (province_id, name, is_principal) 
SELECT id, 'Zamora', true FROM provinces WHERE name = 'Zamora Chinchipe';

-- Institución de ejemplo
INSERT INTO institutions (name, description, primary_color, secondary_color, accent_color) VALUES
('Club Deportivo Demo', 'Institución deportiva de ejemplo para demostración del sistema', '#3B82F6', '#1E40AF', '#EFF6FF');

-- PASO 6: Verificar instalación
SELECT 'Sistema de base de datos creado exitosamente' as status;

-- Verificar provincias y ciudades
SELECT COUNT(*) as total_provinces FROM provinces;
SELECT COUNT(*) as total_cities FROM cities;

-- Verificar tablas principales
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- ========================================================================
-- FIN DEL SCRIPT - BASE DE DATOS LISTA PARA USO
-- ========================================================================

-- INSTRUCCIONES DE USO:
-- 1. Conectarse a PostgreSQL como superuser o owner de la base de datos
-- 2. Ejecutar este script completo
-- 3. Verificar que todas las tablas se crearon correctamente
-- 4. Configurar las credenciales de conexión en la aplicación
-- 5. Iniciar la aplicación que creará automáticamente los usuarios administradores

-- USUARIOS ADMINISTRADORES QUE SE CREAN AUTOMÁTICAMENTE:
-- - superadmin@sports.com (Super Administrador)
-- - admin@club.com (Administrador de Institución)
-- Las contraseñas se mostrarán en la consola al iniciar la aplicación por primera vez.