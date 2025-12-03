-- Script de Seeding para Supabase
-- Ejecutar después de crear las tablas principales
-- Este script es opcional y agrega datos de prueba adicionales

-- Verificar que las tablas existen
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        RAISE EXCEPTION 'La tabla users no existe. Ejecuta primero el script de creación de tablas.';
    END IF;
END $$;

-- Insertar usuarios adicionales (solo si no existen)
INSERT INTO users (email, name, role, avatar_url)
VALUES 
    ('coordinador@biblioteca.com', 'Ana Martínez', 'USER', NULL),
    ('gestor@biblioteca.com', 'Pedro López', 'USER', NULL)
ON CONFLICT (email) DO NOTHING;

-- Insertar maestros adicionales
INSERT INTO maestros (nombre, saldo, creado_por)
VALUES 
    ('Biblioteca Universitaria', 25000, 'Carlos Rodríguez'),
    ('Hemeroteca', 12000, 'María González'),
    ('Sala de Lectura', 8000, 'Carlos Rodríguez'),
    ('Archivo Histórico', 15500, 'Carlos Rodríguez')
ON CONFLICT DO NOTHING;

-- Insertar movimientos de ejemplo
-- Nota: Reemplaza los maestro_id con los IDs reales de tu base de datos
-- Puedes obtenerlos con: SELECT id, nombre FROM maestros;

-- Para Biblioteca Central (asume que es el primer maestro)
INSERT INTO movements (maestro_id, maestro_nombre, tipo, cantidad, responsable, fecha)
SELECT 
    m.id,
    'Biblioteca Central',
    'ENTRADA',
    3500,
    'Carlos Rodríguez',
    NOW() - INTERVAL '15 days'
FROM maestros m
WHERE m.nombre = 'Biblioteca Central'
LIMIT 1;

INSERT INTO movements (maestro_id, maestro_nombre, tipo, cantidad, responsable, fecha)
SELECT 
    m.id,
    'Biblioteca Central',
    'SALIDA',
    800,
    'María González',
    NOW() - INTERVAL '12 days'
FROM maestros m
WHERE m.nombre = 'Biblioteca Central'
LIMIT 1;

INSERT INTO movements (maestro_id, maestro_nombre, tipo, cantidad, responsable, fecha)
SELECT 
    m.id,
    'Biblioteca Central',
    'ENTRADA',
    5000,
    'Carlos Rodríguez',
    NOW() - INTERVAL '8 days'
FROM maestros m
WHERE m.nombre = 'Biblioteca Central'
LIMIT 1;

-- Para Sucursal Norte
INSERT INTO movements (maestro_id, maestro_nombre, tipo, cantidad, responsable, fecha)
SELECT 
    m.id,
    'Sucursal Norte',
    'ENTRADA',
    2500,
    'Juan Pérez',
    NOW() - INTERVAL '10 days'
FROM maestros m
WHERE m.nombre = 'Sucursal Norte'
LIMIT 1;

INSERT INTO movements (maestro_id, maestro_nombre, tipo, cantidad, responsable, fecha)
SELECT 
    m.id,
    'Sucursal Norte',
    'SALIDA',
    1200,
    'Ana Martínez',
    NOW() - INTERVAL '5 days'
FROM maestros m
WHERE m.nombre = 'Sucursal Norte'
LIMIT 1;

-- Verificar la inserción
SELECT 'Usuarios insertados:' as info, COUNT(*) as cantidad FROM users
UNION ALL
SELECT 'Maestros insertados:', COUNT(*) FROM maestros
UNION ALL
SELECT 'Movimientos insertados:', COUNT(*) FROM movements;

-- Mostrar resumen por maestro
SELECT 
    m.nombre,
    m.saldo as saldo_inicial,
    COUNT(mv.id) as total_movimientos,
    SUM(CASE WHEN mv.tipo = 'ENTRADA' THEN mv.cantidad ELSE 0 END) as total_entradas,
    SUM(CASE WHEN mv.tipo = 'SALIDA' THEN mv.cantidad ELSE 0 END) as total_salidas
FROM maestros m
LEFT JOIN movements mv ON m.id = mv.maestro_id
GROUP BY m.id, m.nombre, m.saldo
ORDER BY m.nombre;
