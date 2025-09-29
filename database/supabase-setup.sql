-- Script de configuración para Supabase
-- Ejecutar en el SQL Editor de Supabase Dashboard

-- Crear tipos ENUM
CREATE TYPE IF NOT EXISTS user_role AS ENUM (
    'super_admin', 
    'admin_institucion', 
    'admin_sede', 
    'entrenador', 
    'secretario', 
    'representante', 
    'deportista'
);

CREATE TYPE IF NOT EXISTS visibility AS ENUM ('global', 'sede', 'grupo');

CREATE TYPE IF NOT EXISTS publication_status AS ENUM ('borrador', 'programada', 'publicada', 'oculta');

CREATE TYPE IF NOT EXISTS notification_type AS ENUM ('push', 'inapp', 'ambas');

CREATE TYPE IF NOT EXISTS attendance_status AS ENUM ('presente', 'ausente', 'tardanza', 'justificado');

-- Tabla de instituciones
CREATE TABLE IF NOT EXISTS public.institutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    logo_url TEXT,
    primary_color VARCHAR(7) DEFAULT '#3B82F6',
    secondary_color VARCHAR(7) DEFAULT '#1E40AF',
    accent_color VARCHAR(7) DEFAULT '#EFF6FF',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de sedes/venues
CREATE TABLE IF NOT EXISTS public.venues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID REFERENCES public.institutions(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address TEXT,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    logo_url TEXT,
    banner_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    role user_role NOT NULL,
    institution_id UUID REFERENCES public.institutions(id) ON DELETE CASCADE,
    venue_ids JSONB DEFAULT '[]'::jsonb,
    group_ids JSONB DEFAULT '[]'::jsonb,
    permissions JSONB DEFAULT '{}'::jsonb,
    avatar_url TEXT,
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de grupos
CREATE TABLE IF NOT EXISTS public.groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID REFERENCES public.institutions(id) ON DELETE CASCADE,
    venue_id UUID REFERENCES public.venues(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    main_trainer_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    additional_trainer_ids JSONB DEFAULT '[]'::jsonb,
    schedule JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de atletas
CREATE TABLE IF NOT EXISTS public.athletes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID REFERENCES public.institutions(id) ON DELETE CASCADE,
    venue_id UUID REFERENCES public.venues(id) ON DELETE CASCADE,
    group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
    representative_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    birth_date TIMESTAMP WITH TIME ZONE,
    document_number VARCHAR(20),
    avatar_url TEXT,
    medical_info JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de eventos
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID REFERENCES public.institutions(id) ON DELETE CASCADE,
    venue_id UUID REFERENCES public.venues(id) ON DELETE CASCADE,
    group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    event_type VARCHAR(50) DEFAULT 'entrenamiento',
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    location TEXT,
    is_match BOOLEAN DEFAULT false,
    match_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de asistencias
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    athlete_id UUID REFERENCES public.athletes(id) ON DELETE CASCADE,
    status attendance_status NOT NULL,
    notes TEXT,
    marked_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    marked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de publicaciones
CREATE TABLE IF NOT EXISTS public.publications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID REFERENCES public.institutions(id) ON DELETE CASCADE,
    venue_id UUID REFERENCES public.venues(id) ON DELETE CASCADE,
    group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
    author_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    media_urls JSONB DEFAULT '[]'::jsonb,
    visibility visibility NOT NULL,
    status publication_status DEFAULT 'borrador',
    publish_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de notificaciones
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID REFERENCES public.institutions(id) ON DELETE CASCADE,
    venue_id UUID REFERENCES public.venues(id) ON DELETE CASCADE,
    group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    type notification_type NOT NULL,
    audience JSONB DEFAULT '{}'::jsonb,
    scheduled_for TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered INTEGER DEFAULT 0,
    read INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar datos de ejemplo
INSERT INTO public.institutions (id, name, description, primary_color, secondary_color, accent_color) 
VALUES (
    'inst-001',
    'Club Deportivo Águilas',
    'Club de fútbol juvenil con sede en Madrid',
    '#3B82F6',
    '#1E40AF', 
    '#EFF6FF'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.venues (id, institution_id, name, address, latitude, longitude)
VALUES 
    ('venue-001', 'inst-001', 'Sede Central', 'Av. Principal 123, Madrid', 40.416775, -3.703790),
    ('venue-002', 'inst-001', 'Sede Norte', 'Calle Norte 456, Madrid', 40.451775, -3.688790)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.users (id, email, first_name, last_name, role, institution_id, venue_ids, group_ids)
VALUES 
    ('admin-001', 'admin@club.com', 'Administrator', 'Sistema', 'admin_institucion', 'inst-001', '["venue-001", "venue-002"]'::jsonb, '[]'::jsonb),
    ('trainer-001', 'entrenador@club.com', 'Carlos', 'Rodríguez', 'entrenador', 'inst-001', '["venue-001"]'::jsonb, '["group-001"]'::jsonb)
ON CONFLICT (email) DO NOTHING;

INSERT INTO public.groups (id, institution_id, venue_id, name, description, main_trainer_id, schedule)
VALUES 
    ('group-001', 'inst-001', 'venue-001', 'Infantil A', 'Grupo de fútbol infantil 8-10 años', 'trainer-001', '{"monday": "16:00-18:00", "wednesday": "16:00-18:00", "friday": "16:00-18:00"}'::jsonb),
    ('group-002', 'inst-001', 'venue-001', 'Juvenil B', 'Grupo de fútbol juvenil 14-16 años', 'trainer-001', '{"tuesday": "18:00-20:00", "thursday": "18:00-20:00"}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Configurar Row Level Security (RLS) - Opcional pero recomendado
ALTER TABLE public.institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.athletes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Crear políticas básicas (permite acceso a todos por ahora - personalizar según necesidades)
CREATE POLICY IF NOT EXISTS "Enable all access for authenticated users" ON public.institutions FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Enable all access for authenticated users" ON public.venues FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Enable all access for authenticated users" ON public.users FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Enable all access for authenticated users" ON public.groups FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Enable all access for authenticated users" ON public.athletes FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Enable all access for authenticated users" ON public.events FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Enable all access for authenticated users" ON public.attendance FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Enable all access for authenticated users" ON public.publications FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Enable all access for authenticated users" ON public.notifications FOR ALL USING (true);

-- Opcional: Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_venues_institution_id ON public.venues(institution_id);
CREATE INDEX IF NOT EXISTS idx_users_institution_id ON public.users(institution_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_groups_institution_id ON public.groups(institution_id);
CREATE INDEX IF NOT EXISTS idx_groups_venue_id ON public.groups(venue_id);
CREATE INDEX IF NOT EXISTS idx_athletes_group_id ON public.athletes(group_id);
CREATE INDEX IF NOT EXISTS idx_events_group_id ON public.events(group_id);
CREATE INDEX IF NOT EXISTS idx_events_start_time ON public.events(start_time);
CREATE INDEX IF NOT EXISTS idx_attendance_event_id ON public.attendance(event_id);
CREATE INDEX IF NOT EXISTS idx_attendance_athlete_id ON public.attendance(athlete_id);
CREATE INDEX IF NOT EXISTS idx_publications_institution_id ON public.publications(institution_id);
CREATE INDEX IF NOT EXISTS idx_notifications_institution_id ON public.notifications(institution_id);