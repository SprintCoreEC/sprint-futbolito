-- SQL para crear tablas de provincias y ciudades de Ecuador
-- Ejecutar este script paso a paso

-- 1. Crear tabla de provincias
CREATE TABLE provinces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    country TEXT DEFAULT 'Ecuador',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Crear tabla de ciudades con relación a provincias
CREATE TABLE cities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    province_id UUID NOT NULL REFERENCES provinces(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    is_principal BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para optimizar consultas
CREATE UNIQUE INDEX unique_city_per_province_idx ON cities (province_id, name);
CREATE INDEX cities_province_id_idx ON cities (province_id);

-- 3. Crear tabla de colaboradores con referencia a users y cities
CREATE TABLE colaboradores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    custom_role_id UUID,
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

-- Índices únicos para colaboradores
CREATE UNIQUE INDEX unique_cedula_idx ON colaboradores (cedula) WHERE cedula IS NOT NULL;
CREATE UNIQUE INDEX unique_user_colaborador_idx ON colaboradores (user_id);

-- 4. Insertar las 24 provincias de Ecuador
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

-- 5. Insertar las ciudades principales de cada provincia
-- Azuay: Cuenca
INSERT INTO cities (province_id, name, is_principal) 
SELECT id, 'Cuenca', true FROM provinces WHERE name = 'Azuay';

-- Bolívar: Guaranda
INSERT INTO cities (province_id, name, is_principal) 
SELECT id, 'Guaranda', true FROM provinces WHERE name = 'Bolívar';

-- Cañar: Azogues
INSERT INTO cities (province_id, name, is_principal) 
SELECT id, 'Azogues', true FROM provinces WHERE name = 'Cañar';

-- Carchi: Tulcán
INSERT INTO cities (province_id, name, is_principal) 
SELECT id, 'Tulcán', true FROM provinces WHERE name = 'Carchi';

-- Chimborazo: Riobamba
INSERT INTO cities (province_id, name, is_principal) 
SELECT id, 'Riobamba', true FROM provinces WHERE name = 'Chimborazo';

-- Cotopaxi: Latacunga
INSERT INTO cities (province_id, name, is_principal) 
SELECT id, 'Latacunga', true FROM provinces WHERE name = 'Cotopaxi';

-- El Oro: Machala
INSERT INTO cities (province_id, name, is_principal) 
SELECT id, 'Machala', true FROM provinces WHERE name = 'El Oro';

-- Esmeraldas: Esmeraldas
INSERT INTO cities (province_id, name, is_principal) 
SELECT id, 'Esmeraldas', true FROM provinces WHERE name = 'Esmeraldas';

-- Galápagos: Puerto Baquerizo Moreno
INSERT INTO cities (province_id, name, is_principal) 
SELECT id, 'Puerto Baquerizo Moreno', true FROM provinces WHERE name = 'Galápagos';

-- Guayas: Guayaquil
INSERT INTO cities (province_id, name, is_principal) 
SELECT id, 'Guayaquil', true FROM provinces WHERE name = 'Guayas';

-- Imbabura: Ibarra
INSERT INTO cities (province_id, name, is_principal) 
SELECT id, 'Ibarra', true FROM provinces WHERE name = 'Imbabura';

-- Loja: Loja
INSERT INTO cities (province_id, name, is_principal) 
SELECT id, 'Loja', true FROM provinces WHERE name = 'Loja';

-- Los Ríos: Babahoyo
INSERT INTO cities (province_id, name, is_principal) 
SELECT id, 'Babahoyo', true FROM provinces WHERE name = 'Los Ríos';

-- Manabí: Portoviejo
INSERT INTO cities (province_id, name, is_principal) 
SELECT id, 'Portoviejo', true FROM provinces WHERE name = 'Manabí';

-- Morona Santiago: Macas
INSERT INTO cities (province_id, name, is_principal) 
SELECT id, 'Macas', true FROM provinces WHERE name = 'Morona Santiago';

-- Napo: Tena
INSERT INTO cities (province_id, name, is_principal) 
SELECT id, 'Tena', true FROM provinces WHERE name = 'Napo';

-- Orellana: Francisco de Orellana
INSERT INTO cities (province_id, name, is_principal) 
SELECT id, 'Francisco de Orellana', true FROM provinces WHERE name = 'Orellana';

-- Pastaza: Puyo
INSERT INTO cities (province_id, name, is_principal) 
SELECT id, 'Puyo', true FROM provinces WHERE name = 'Pastaza';

-- Pichincha: Quito
INSERT INTO cities (province_id, name, is_principal) 
SELECT id, 'Quito', true FROM provinces WHERE name = 'Pichincha';

-- Santa Elena: Santa Elena
INSERT INTO cities (province_id, name, is_principal) 
SELECT id, 'Santa Elena', true FROM provinces WHERE name = 'Santa Elena';

-- Santo Domingo de los Tsáchilas: Santo Domingo
INSERT INTO cities (province_id, name, is_principal) 
SELECT id, 'Santo Domingo', true FROM provinces WHERE name = 'Santo Domingo de los Tsáchilas';

-- Sucumbíos: Nueva Loja
INSERT INTO cities (province_id, name, is_principal) 
SELECT id, 'Nueva Loja', true FROM provinces WHERE name = 'Sucumbíos';

-- Tungurahua: Ambato
INSERT INTO cities (province_id, name, is_principal) 
SELECT id, 'Ambato', true FROM provinces WHERE name = 'Tungurahua';

-- Zamora Chinchipe: Zamora
INSERT INTO cities (province_id, name, is_principal) 
SELECT id, 'Zamora', true FROM provinces WHERE name = 'Zamora Chinchipe';

-- 6. Verificar los datos insertados
SELECT 
    p.name as provincia,
    c.name as ciudad_principal,
    c.is_principal
FROM provinces p 
JOIN cities c ON p.id = c.province_id 
WHERE c.is_principal = true
ORDER BY p.name;