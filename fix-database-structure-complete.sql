-- =====================================================
-- SCRIPT COMPLETO PARA CORREGIR BASE DE DATOS
-- =====================================================
-- Este script corrige todos los problemas identificados:
-- 1. Elimina campo email de tabla users (no debe estar ahí)
-- 2. Agrega auth_user_id para conectar con Supabase Auth
-- 3. Crea trigger para sincronización automática
-- 4. Restaura TODAS las políticas RLS
-- =====================================================

-- PASO 1: AJUSTES DE ESQUEMA
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Eliminar el campo email de users (no debe estar ahí)
ALTER TABLE public.users DROP COLUMN IF EXISTS email;

-- Agregar conexión con Supabase Auth
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS auth_user_id uuid UNIQUE;

-- Crear foreign key constraint
ALTER TABLE public.users ADD CONSTRAINT users_auth_user_fk 
  FOREIGN KEY (auth_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Crear índice para mejor rendimiento
CREATE INDEX IF NOT EXISTS users_auth_user_id_idx ON public.users(auth_user_id);

-- PASO 2: TRIGGER PARA SINCRONIZACIÓN AUTOMÁTICA
-- =====================================================
-- Función que se ejecuta cuando se crea usuario en Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_auth_user() 
RETURNS TRIGGER LANGUAGE PLPGSQL SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.users (auth_user_id, first_name, last_name, role, is_active)
  VALUES (
    NEW.id, 
    COALESCE((NEW.raw_user_meta_data->>'first_name')::text, ''), 
    COALESCE((NEW.raw_user_meta_data->>'last_name')::text, ''), 
    'representante', 
    true
  )
  ON CONFLICT (auth_user_id) DO NOTHING;
  RETURN NEW;
END; $$;

-- Eliminar trigger anterior si existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Crear el trigger
CREATE TRIGGER on_auth_user_created 
  AFTER INSERT ON auth.users 
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- PASO 3: ACTIVAR RLS Y CREAR POLÍTICAS
-- =====================================================

-- Activar RLS en tabla users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios pueden ver/editar su propio perfil
CREATE POLICY users_select_self ON public.users 
  FOR SELECT USING (auth.uid() = auth_user_id);

CREATE POLICY users_update_self ON public.users 
  FOR UPDATE USING (auth.uid() = auth_user_id) 
  WITH CHECK (auth.uid() = auth_user_id);

-- Política: Super admin y admin institución pueden gestionar usuarios
CREATE POLICY users_admin_manage ON public.users 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.auth_user_id = auth.uid() 
      AND u.role IN ('super_admin', 'admin_institucion')
    )
  ) 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.auth_user_id = auth.uid() 
      AND u.role IN ('super_admin', 'admin_institucion')
    )
  );

-- Función helper para verificar misma institución
CREATE OR REPLACE FUNCTION public.same_institution(institution_uuid uuid) 
RETURNS BOOLEAN LANGUAGE SQL STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users u 
    WHERE u.auth_user_id = auth.uid() 
    AND (u.role = 'super_admin' OR u.institution_id = institution_uuid)
  );
$$;

-- POLÍTICAS PARA INSTITUCIONES
ALTER TABLE public.institutions ENABLE ROW LEVEL SECURITY;

CREATE POLICY institutions_select ON public.institutions 
  FOR SELECT USING (public.same_institution(id));

CREATE POLICY institutions_admin_all ON public.institutions 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.auth_user_id = auth.uid() 
      AND u.role = 'super_admin'
    )
  ) 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.auth_user_id = auth.uid() 
      AND u.role = 'super_admin'
    )
  );

-- POLÍTICAS PARA SEDES
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
CREATE POLICY venues_rw ON public.venues 
  FOR ALL USING (public.same_institution(institution_id)) 
  WITH CHECK (public.same_institution(institution_id));

-- POLÍTICAS PARA GRUPOS
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY groups_rw ON public.groups 
  FOR ALL USING (public.same_institution(institution_id)) 
  WITH CHECK (public.same_institution(institution_id));

-- POLÍTICAS PARA DEPORTISTAS
ALTER TABLE public.athletes ENABLE ROW LEVEL SECURITY;
CREATE POLICY athletes_rw ON public.athletes 
  FOR ALL USING (public.same_institution(institution_id)) 
  WITH CHECK (public.same_institution(institution_id));

-- POLÍTICAS PARA EVENTOS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY events_rw ON public.events 
  FOR ALL USING (public.same_institution(institution_id)) 
  WITH CHECK (public.same_institution(institution_id));

-- POLÍTICAS PARA PUBLICACIONES
ALTER TABLE public.publications ENABLE ROW LEVEL SECURITY;
CREATE POLICY publications_rw ON public.publications 
  FOR ALL USING (public.same_institution(institution_id)) 
  WITH CHECK (public.same_institution(institution_id));

-- POLÍTICAS PARA NOTIFICACIONES
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY notifications_rw ON public.notifications 
  FOR ALL USING (public.same_institution(institution_id)) 
  WITH CHECK (public.same_institution(institution_id));

-- POLÍTICAS PARA ASISTENCIAS
ALTER TABLE public.attendances ENABLE ROW LEVEL SECURITY;
CREATE POLICY attendances_rw ON public.attendances 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.events e 
      WHERE e.id = event_id 
      AND public.same_institution(e.institution_id)
    )
  ) 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.events e 
      WHERE e.id = event_id 
      AND public.same_institution(e.institution_id)
    )
  );

-- PASO 4: SINCRONIZAR USUARIOS EXISTENTES
-- =====================================================
-- Vincular usuarios existentes en auth.users con public.users
INSERT INTO public.users (auth_user_id, first_name, last_name, role, is_active)
SELECT 
  au.id, 
  COALESCE(au.raw_user_meta_data->>'first_name', ''), 
  COALESCE(au.raw_user_meta_data->>'last_name', ''), 
  'representante', 
  true
FROM auth.users au 
LEFT JOIN public.users u ON u.auth_user_id = au.id 
WHERE u.id IS NULL;

-- PASO 5: CREAR USUARIO SUPER ADMINISTRADOR
-- =====================================================
-- Primero, verificar si ya existe
DO $$
DECLARE
  auth_user_uuid uuid;
  existing_user_id uuid;
BEGIN
  -- Buscar si ya existe usuario con email superadmin@sports.com
  SELECT id INTO auth_user_uuid 
  FROM auth.users 
  WHERE email = 'superadmin@sports.com';
  
  IF auth_user_uuid IS NOT NULL THEN
    -- Ya existe en auth, verificar si existe en public.users
    SELECT id INTO existing_user_id 
    FROM public.users 
    WHERE auth_user_id = auth_user_uuid;
    
    IF existing_user_id IS NULL THEN
      -- Existe en auth pero no en public.users, crear el vínculo
      INSERT INTO public.users (auth_user_id, first_name, last_name, role, is_active)
      VALUES (auth_user_uuid, 'Super', 'Administrator', 'super_admin', true);
      RAISE NOTICE 'Usuario super admin vinculado correctamente';
    ELSE
      -- Ya existe en ambas tablas, actualizar rol si es necesario
      UPDATE public.users 
      SET role = 'super_admin', is_active = true 
      WHERE id = existing_user_id;
      RAISE NOTICE 'Usuario super admin actualizado';
    END IF;
  ELSE
    RAISE NOTICE 'Usuario super admin no encontrado en auth.users - debe crearse manualmente';
  END IF;
END $$;

-- =====================================================
-- SCRIPT MANUAL PARA INSERTAR USUARIO ESPECÍFICO
-- =====================================================
-- Usar este template después de crear usuario en Supabase Auth Dashboard:
/*
-- 1. Primero crear usuario en Supabase Auth Dashboard
-- 2. Obtener el UUID del usuario creado
-- 3. Ejecutar este INSERT reemplazando los valores:

INSERT INTO public.users (auth_user_id, first_name, last_name, role, institution_id, phone, cedula, is_active)
VALUES (
  '<UUID_DEL_AUTH_USER>',  -- UUID obtenido de auth.users
  'Nombre',                -- Nombre del usuario
  'Apellido',              -- Apellido del usuario
  'admin_institucion',     -- Rol: super_admin, admin_institucion, admin_sede, entrenador, secretario, representante, deportista
  '<UUID_INSTITUCION>',    -- UUID de la institución (opcional para super_admin)
  '0999999999',            -- Teléfono
  '1234567890',            -- Cédula
  true                     -- Activo
);
*/

-- =====================================================
-- VERIFICACIÓN FINAL
-- =====================================================
-- Verificar que RLS está activo en todas las tablas
SELECT 
  schemaname, 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = true;

-- Ver políticas creadas
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

RAISE NOTICE 'Script completado exitosamente!';
RAISE NOTICE 'Credenciales Super Admin: superadmin@sports.com / SuperAdmin123!';