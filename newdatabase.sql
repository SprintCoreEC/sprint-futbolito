-- SportPlatform Database Setup Script - COMPLETO
-- Ejecuta este script completo en tu Editor SQL de Supabase
-- Script actualizado con todas las tablas y datos iniciales

-- Habilitar extensiones requeridas
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Limpiar tablas existentes si es necesario (opcional)
DROP TABLE IF EXISTS notificaciones CASCADE;
DROP TABLE IF EXISTS publicaciones CASCADE;
DROP TABLE IF EXISTS pagos_ordenes CASCADE;
DROP TABLE IF EXISTS asistencias CASCADE;
DROP TABLE IF EXISTS eventos CASCADE;
DROP TABLE IF EXISTS grupos CASCADE;
DROP TABLE IF EXISTS fichas_medicas CASCADE;
DROP TABLE IF EXISTS deportistas CASCADE;
DROP TABLE IF EXISTS representantes CASCADE;
DROP TABLE IF EXISTS colaboradores CASCADE;
DROP TABLE IF EXISTS posiciones CASCADE;
DROP TABLE IF EXISTS instituciones CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS ciudades CASCADE;

-- Crear tabla ciudades
CREATE TABLE IF NOT EXISTS "ciudades" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "nombre" TEXT NOT NULL,
    "provincia" TEXT,
    "pais" TEXT DEFAULT 'Ecuador',
    "codigo_postal" TEXT,
    "creada_en" TIMESTAMPTZ DEFAULT now()
);

-- Crear tabla roles
CREATE TABLE IF NOT EXISTS "roles" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "nombre" TEXT NOT NULL UNIQUE,
    "descripcion" TEXT,
    "permisos" JSONB DEFAULT '{}',
    "activo" BOOLEAN DEFAULT true,
    "creado_en" TIMESTAMPTZ DEFAULT now()
);

-- Crear tabla instituciones
CREATE TABLE IF NOT EXISTS "instituciones" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "ciudad_id" UUID REFERENCES "ciudades"("id") ON DELETE SET NULL,
    "nombre" TEXT NOT NULL UNIQUE,
    "logo_url" TEXT,
    "icono_url" TEXT,
    "color_primario" TEXT DEFAULT '#3B82F6',
    "color_secundario" TEXT DEFAULT '#1E40AF',
    "descripcion" TEXT,
    "email" TEXT,
    "telefono" TEXT,
    "direccion" TEXT,
    "activo" BOOLEAN DEFAULT true,
    "creada_en" TIMESTAMPTZ DEFAULT now(),
    "actualizada_en" TIMESTAMPTZ DEFAULT now()
);



-- Crear tabla posiciones
CREATE TABLE IF NOT EXISTS "posiciones" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN DEFAULT true,
    "creado_en" TIMESTAMPTZ DEFAULT now()
);

-- Crear tabla colaboradores
CREATE TABLE IF NOT EXISTS "colaboradores" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "auth_user_id" UUID UNIQUE NOT NULL,
    "institucion_id" UUID REFERENCES "instituciones"("id") ON DELETE CASCADE,
    "rol_id" UUID REFERENCES "roles"("id") ON DELETE SET NULL,
    "ciudad_id" UUID REFERENCES "ciudades"("id") ON DELETE SET NULL,
    "nombres" TEXT,
    "apellidos" TEXT,
    "fecha_nacimiento" DATE,
    "direccion" TEXT,
    "cedula" TEXT UNIQUE,
    "telefono" TEXT,
    "inicio_contrato" DATE,
    "fin_contrato" DATE,
    "observaciones" TEXT,
    "activo" BOOLEAN DEFAULT true,
    "creado_en" TIMESTAMPTZ DEFAULT now(),
    "actualizado_en" TIMESTAMPTZ DEFAULT now()
);

-- Crear tabla representantes
CREATE TABLE IF NOT EXISTS "representantes" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "auth_user_id" UUID UNIQUE NOT NULL,
    "institucion_id" UUID REFERENCES "instituciones"("id") ON DELETE CASCADE,
    "ciudad_id" UUID REFERENCES "ciudades"("id") ON DELETE SET NULL,
    "nombres" TEXT,
    "apellidos" TEXT,
    "fecha_nacimiento" DATE,
    "direccion" TEXT,
    "cedula" TEXT UNIQUE,
    "telefono" TEXT,
    "activo" BOOLEAN DEFAULT true,
    "creado_en" TIMESTAMPTZ DEFAULT now(),
    "actualizado_en" TIMESTAMPTZ DEFAULT now()
);

-- Crear tabla deportistas
CREATE TABLE IF NOT EXISTS "deportistas" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "institucion_id" UUID REFERENCES "instituciones"("id") ON DELETE CASCADE,
    "representante_id" UUID REFERENCES "representantes"("id") ON DELETE SET NULL,
    "posicion_id" UUID REFERENCES "posiciones"("id") ON DELETE SET NULL,
    "ciudad_id" UUID REFERENCES "ciudades"("id") ON DELETE SET NULL,
    "nombres" TEXT,
    "apellidos" TEXT,
    "cedula" TEXT UNIQUE,
    "fecha_nacimiento" DATE,
    "direccion" TEXT,
    "telefono" TEXT,
    "genero" TEXT CHECK ("genero" IN ('Masculino', 'Femenino', 'Otro')),
    "foto_url" TEXT,
    "observaciones" TEXT,
    "activo" BOOLEAN DEFAULT true,
    "creado_en" TIMESTAMPTZ DEFAULT now(),
    "actualizado_en" TIMESTAMPTZ DEFAULT now()
);

-- Crear tabla fichas_medicas
CREATE TABLE IF NOT EXISTS "fichas_medicas" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "deportista_id" UUID UNIQUE REFERENCES "deportistas"("id") ON DELETE CASCADE,
    "grupo_sanguineo" TEXT,
    "alergias" TEXT,
    "enfermedades" TEXT,
    "contacto_emergencia" TEXT,
    "telefono_emergencia" TEXT,
    "restricciones" TEXT,
    "peso" DECIMAL(5,2),
    "altura" DECIMAL(3,2),
    "observaciones_medicas" TEXT,
    "creado_en" TIMESTAMPTZ DEFAULT now(),
    "actualizado_en" TIMESTAMPTZ DEFAULT now()
);

-- Crear tabla grupos
CREATE TABLE IF NOT EXISTS "grupos" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "institucion_id" UUID REFERENCES "instituciones"("id") ON DELETE CASCADE,
    "nombre" TEXT NOT NULL,
    "categoria" TEXT,
    "edad_minima" INTEGER,
    "edad_maxima" INTEGER,
    "entrenador_principal_id" UUID REFERENCES "colaboradores"("id") ON DELETE SET NULL,
    "descripcion" TEXT,
    "horarios" JSONB DEFAULT '[]',
    "activo" BOOLEAN DEFAULT true,
    "creado_en" TIMESTAMPTZ DEFAULT now(),
    "actualizado_en" TIMESTAMPTZ DEFAULT now()
);

-- Crear tabla eventos
CREATE TABLE IF NOT EXISTS "eventos" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "institucion_id" UUID REFERENCES "instituciones"("id") ON DELETE CASCADE,
    "grupo_id" UUID REFERENCES "grupos"("id") ON DELETE CASCADE,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "tipo" TEXT CHECK ("tipo" IN ('entrenamiento', 'partido', 'torneo', 'otro')) DEFAULT 'entrenamiento',
    "fecha_inicio" TIMESTAMPTZ NOT NULL,
    "fecha_fin" TIMESTAMPTZ,
    "ubicacion" TEXT,
    "partido_id" UUID,
    "estado" TEXT CHECK ("estado" IN ('programado', 'en_curso', 'finalizado', 'cancelado')) DEFAULT 'programado',
    "observaciones" TEXT,
    "creado_en" TIMESTAMPTZ DEFAULT now(),
    "actualizado_en" TIMESTAMPTZ DEFAULT now()
);

-- Crear tabla asistencias
CREATE TABLE IF NOT EXISTS "asistencias" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "evento_id" UUID REFERENCES "eventos"("id") ON DELETE CASCADE,
    "deportista_id" UUID REFERENCES "deportistas"("id") ON DELETE CASCADE,
    "estado_asistencia" TEXT CHECK ("estado_asistencia" IN ('presente', 'ausente', 'tardanza', 'justificado')) DEFAULT 'ausente',
    "qr_token" TEXT,
    "registrada_por" UUID REFERENCES "colaboradores"("id"),
    "fecha_registro" TIMESTAMPTZ DEFAULT now(),
    "observaciones" TEXT,
    "creado_en" TIMESTAMPTZ DEFAULT now(),
    UNIQUE("evento_id", "deportista_id")
);

-- Crear tabla pagos_ordenes
CREATE TABLE IF NOT EXISTS "pagos_ordenes" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "representante_id" UUID REFERENCES "representantes"("id") ON DELETE CASCADE,
    "deportista_id" UUID REFERENCES "deportistas"("id") ON DELETE CASCADE,
    "concepto" TEXT NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,
    "periodo" TEXT,
    "fecha_vencimiento" DATE,
    "estado" TEXT CHECK ("estado" IN ('pending', 'paid', 'overdue', 'cancelled')) DEFAULT 'pending',
    "tipo_pago" TEXT CHECK ("tipo_pago" IN ('efectivo', 'transferencia', 'tarjeta')) DEFAULT 'efectivo',
    "referencia" TEXT,
    "comprobante_url" TEXT,
    "confirmado_por" UUID REFERENCES "colaboradores"("id"),
    "fecha_confirmacion" TIMESTAMPTZ,
    "creado_en" TIMESTAMPTZ DEFAULT now(),
    "actualizado_en" TIMESTAMPTZ DEFAULT now()
);

-- Crear tabla publicaciones
CREATE TABLE IF NOT EXISTS "publicaciones" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "institucion_id" UUID REFERENCES "instituciones"("id") ON DELETE CASCADE,
    "grupo_id" UUID REFERENCES "grupos"("id") ON DELETE SET NULL,
    "autor_id" UUID NOT NULL,
    "titulo" TEXT NOT NULL,
    "cuerpo" TEXT NOT NULL,
    "media_urls" JSONB DEFAULT '[]',
    "visibilidad" TEXT CHECK ("visibilidad" IN ('global', 'sede', 'grupo')) DEFAULT 'global',
    "publicar_en" TIMESTAMPTZ DEFAULT now(),
    "estado" TEXT CHECK ("estado" IN ('borrador', 'programada', 'publicada', 'oculta')) DEFAULT 'borrador',
    "creado_en" TIMESTAMPTZ DEFAULT now(),
    "actualizado_en" TIMESTAMPTZ DEFAULT now()
);

-- Crear tabla notificaciones
CREATE TABLE IF NOT EXISTS "notificaciones" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "titulo" TEXT NOT NULL,
    "cuerpo" TEXT NOT NULL,
    "tipo" TEXT CHECK ("tipo" IN ('push', 'inapp', 'ambas')) DEFAULT 'push',
    "audiencia" JSONB DEFAULT '{}',
    "institucion_id" UUID REFERENCES "instituciones"("id") ON DELETE CASCADE,
    "grupo_id" UUID REFERENCES "grupos"("id") ON DELETE SET NULL,
    "programada_en" TIMESTAMPTZ,
    "enviada_en" TIMESTAMPTZ,
    "entregadas" INTEGER DEFAULT 0,
    "leidas" INTEGER DEFAULT 0,
    "estado" TEXT CHECK ("estado" IN ('borrador', 'programada', 'enviada', 'fallida')) DEFAULT 'borrador',
    "variables" JSONB DEFAULT '{}',
    "creado_por" UUID NOT NULL,
    "creado_en" TIMESTAMPTZ DEFAULT now()
);

-- Insertar datos iniciales - CIUDADES
INSERT INTO "ciudades" ("nombre", "provincia", "pais") VALUES
('Quito', 'Pichincha', 'Ecuador'),
('Guayaquil', 'Guayas', 'Ecuador'),
('Cuenca', 'Azuay', 'Ecuador'),
('Ambato', 'Tungurahua', 'Ecuador'),
('Machala', 'El Oro', 'Ecuador'),
('Manta', 'Manabí', 'Ecuador'),
('Loja', 'Loja', 'Ecuador'),
('Riobamba', 'Chimborazo', 'Ecuador'),
('Ibarra', 'Imbabura', 'Ecuador')
ON CONFLICT DO NOTHING;

-- Insertar datos iniciales - ROLES
INSERT INTO "roles" ("nombre", "descripcion", "permisos") VALUES
('super_admin', 'Super Administrador del sistema', '{"all": true}'),
('admin_institucion', 'Administrador de Institución', '{"institucion": {"read": true, "write": true}'),
('admin_sede', 'Administrador de Sede', '{"sede": {"read": true, "write": true}, "grupos": {"read": true, "write": true}}'), --borrar porque no existe sede
('colaborador', 'Colaborador/Personal', '{"grupos": {"read": true}, "asistencias": {"write": true}, "eventos": {"read": true}}'),
('entrenador', 'Entrenador', '{"grupos": {"read": true}, "asistencias": {"write": true}, "eventos": {"read": true}}'),
('representante', 'Representante/Padre de familia', '{"deportistas": {"read": true}, "pagos": {"read": true}, "eventos": {"read": true}}'),
('deportista', 'Deportista', '{"eventos": {"read": true}, "estadisticas": {"read": true}}') 
ON CONFLICT ("nombre") DO NOTHING;

-- Insertar datos iniciales - POSICIONES DEPORTIVAS
INSERT INTO "posiciones" ("nombre", "descripcion") VALUES
('Portero', 'Guardameta del equipo'),
('Defensor Central', 'Defensor en el centro del campo'),
('Lateral Derecho', 'Defensor lateral por el costado derecho'),
('Lateral Izquierdo', 'Defensor lateral por el costado izquierdo'),
('Mediocampista Defensivo', 'Volante con funciones defensivas'),
('Mediocampista Central', 'Volante en el centro del campo'),
('Mediocampista Ofensivo', 'Volante con funciones ofensivas'),
('Extremo Derecho', 'Extremo que juega por la banda derecha'),
('Extremo Izquierdo', 'Extremo que juega por la banda izquierda'),
('Delantero Centro', 'Delantero principal del equipo'),
('Segundo Delantero', 'Delantero de apoyo')
ON CONFLICT DO NOTHING;

-- Crear índices para optimizar rendimiento
CREATE INDEX IF NOT EXISTS idx_instituciones_ciudad ON "instituciones"("ciudad_id");
CREATE INDEX IF NOT EXISTS idx_colaboradores_institucion ON "colaboradores"("institucion_id");
CREATE INDEX IF NOT EXISTS idx_colaboradores_auth_user ON "colaboradores"("auth_user_id");
CREATE INDEX IF NOT EXISTS idx_representantes_institucion ON "representantes"("institucion_id");
CREATE INDEX IF NOT EXISTS idx_representantes_auth_user ON "representantes"("auth_user_id");
CREATE INDEX IF NOT EXISTS idx_deportistas_institucion ON "deportistas"("institucion_id");
CREATE INDEX IF NOT EXISTS idx_deportistas_representante ON "deportistas"("representante_id");
CREATE INDEX IF NOT EXISTS idx_deportistas_posicion ON "deportistas"("posicion_id");
CREATE INDEX IF NOT EXISTS idx_grupos_institucion ON "grupos"("institucion_id");
CREATE INDEX IF NOT EXISTS idx_eventos_institucion ON "eventos"("institucion_id");
CREATE INDEX IF NOT EXISTS idx_eventos_grupo ON "eventos"("grupo_id");
CREATE INDEX IF NOT EXISTS idx_asistencias_evento ON "asistencias"("evento_id");
CREATE INDEX IF NOT EXISTS idx_asistencias_deportista ON "asistencias"("deportista_id");
CREATE INDEX IF NOT EXISTS idx_pagos_representante ON "pagos_ordenes"("representante_id");
CREATE INDEX IF NOT EXISTS idx_pagos_deportista ON "pagos_ordenes"("deportista_id");
CREATE INDEX IF NOT EXISTS idx_publicaciones_institucion ON "publicaciones"("institucion_id");
CREATE INDEX IF NOT EXISTS idx_notificaciones_institucion ON "notificaciones"("institucion_id");

-- Crear índices únicos para evitar duplicados
CREATE UNIQUE INDEX IF NOT EXISTS idx_colaboradores_cedula_unique ON "colaboradores"("cedula") WHERE "cedula" IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_representantes_cedula_unique ON "representantes"("cedula") WHERE "cedula" IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_deportistas_cedula_unique ON "deportistas"("cedula") WHERE "cedula" IS NOT NULL;

-- Habilitar Row Level Security (RLS) en tablas principales
ALTER TABLE "instituciones" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "colaboradores" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "representantes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "deportistas" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "grupos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "eventos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "asistencias" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "pagos_ordenes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "publicaciones" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "notificaciones" ENABLE ROW LEVEL SECURITY;

-- Políticas RLS simplificadas (sin dependencia de JWT claims específicos)
-- Estas políticas permiten acceso a usuarios autenticados
-- En producción se pueden refinar según necesidades específicas

CREATE POLICY "Allow authenticated users" ON "instituciones"
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users" ON "colaboradores"
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users" ON "representantes"
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users" ON "deportistas"
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users" ON "grupos"
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users" ON "eventos"
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users" ON "asistencias"
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users" ON "pagos_ordenes"
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users" ON "publicaciones"
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users" ON "notificaciones"
    FOR ALL USING (auth.role() = 'authenticated');

-- Script completado exitosamente
-- Todas las tablas, relaciones, constraints, índices y datos iniciales han sido creados
SELECT 'Base de datos SportPlatform creada exitosamente!' as mensaje;

-- Verificar que las tablas se crearon correctamente
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN (
    'ciudades', 'roles', 'instituciones', , 'posiciones', 
    'colaboradores', 'representantes', 'deportistas', 'fichas_medicas',
    'grupos', 'eventos', 'asistencias', 'pagos_ordenes', 
    'publicaciones', 'notificaciones'
  )
ORDER BY tablename;