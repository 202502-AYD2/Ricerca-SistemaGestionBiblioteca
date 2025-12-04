-- ========================================
-- SCHEMA COMPLETO PARA SISTEMA DE BIBLIOTECA
-- ========================================
-- Este script crea todas las tablas, políticas RLS, índices y datos de prueba

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ========================================
-- 1. TABLAS PRINCIPALES
-- ========================================

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('ADMIN', 'USER')),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de maestros (materiales/recursos de biblioteca)
CREATE TABLE IF NOT EXISTS maestros (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL UNIQUE,
  saldo DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (saldo >= 0),
  creado_por TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de movimientos/transacciones
CREATE TABLE IF NOT EXISTS movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  maestro_id UUID NOT NULL REFERENCES maestros(id) ON DELETE CASCADE,
  maestro_nombre TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('ENTRADA', 'SALIDA')),
  cantidad DECIMAL(12, 2) NOT NULL CHECK (cantidad > 0),
  responsable TEXT NOT NULL,
  fecha TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- 2. ÍNDICES PARA PERFORMANCE
-- ========================================

CREATE INDEX IF NOT EXISTS idx_movements_maestro_id ON movements(maestro_id);
CREATE INDEX IF NOT EXISTS idx_movements_fecha ON movements(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_movements_tipo ON movements(tipo);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_maestros_nombre ON maestros(nombre);

-- ========================================
-- 3. FUNCIONES Y TRIGGERS
-- ========================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_maestros_updated_at ON maestros;
CREATE TRIGGER update_maestros_updated_at
  BEFORE UPDATE ON maestros
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Función para actualizar el saldo del maestro automáticamente
CREATE OR REPLACE FUNCTION update_maestro_saldo()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Actualizar saldo cuando se inserta un movimiento
    IF NEW.tipo = 'ENTRADA' THEN
      UPDATE maestros 
      SET saldo = saldo + NEW.cantidad 
      WHERE id = NEW.maestro_id;
    ELSIF NEW.tipo = 'SALIDA' THEN
      -- Verificar que hay suficiente saldo
      IF (SELECT saldo FROM maestros WHERE id = NEW.maestro_id) < NEW.cantidad THEN
        RAISE EXCEPTION 'Saldo insuficiente para realizar la salida';
      END IF;
      UPDATE maestros 
      SET saldo = saldo - NEW.cantidad 
      WHERE id = NEW.maestro_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar saldo
DROP TRIGGER IF EXISTS trigger_update_maestro_saldo ON movements;
CREATE TRIGGER trigger_update_maestro_saldo
  AFTER INSERT ON movements
  FOR EACH ROW
  EXECUTE FUNCTION update_maestro_saldo();

-- ========================================
-- 4. FUNCIONES AUXILIARES
-- ========================================

-- Función para obtener saldos diarios de un maestro (para gráficas)
CREATE OR REPLACE FUNCTION get_daily_balances(maestro_uuid UUID, days_back INTEGER DEFAULT 30)
RETURNS TABLE (
  fecha DATE,
  saldo_del_dia DECIMAL(12, 2)
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE date_series AS (
    SELECT 
      CURRENT_DATE - (days_back - 1) AS fecha
    UNION ALL
    SELECT fecha + 1
    FROM date_series
    WHERE fecha < CURRENT_DATE
  ),
  movements_by_day AS (
    SELECT 
      DATE(m.fecha) as dia,
      SUM(CASE WHEN m.tipo = 'ENTRADA' THEN m.cantidad ELSE -m.cantidad END) as cambio_neto
    FROM movements m
    WHERE m.maestro_id = maestro_uuid
      AND m.fecha >= (CURRENT_DATE - days_back)
    GROUP BY DATE(m.fecha)
  ),
  saldo_inicial AS (
    SELECT 
      ma.saldo - COALESCE(SUM(
        CASE WHEN m.tipo = 'ENTRADA' THEN m.cantidad ELSE -m.cantidad END
      ), 0) as saldo
    FROM maestros ma
    LEFT JOIN movements m ON m.maestro_id = ma.id 
      AND m.fecha >= (CURRENT_DATE - days_back)
    WHERE ma.id = maestro_uuid
    GROUP BY ma.saldo
  )
  SELECT 
    ds.fecha,
    (SELECT saldo FROM saldo_inicial) + COALESCE(SUM(mbd.cambio_neto), 0) as saldo_del_dia
  FROM date_series ds
  LEFT JOIN movements_by_day mbd ON mbd.dia <= ds.fecha
  GROUP BY ds.fecha
  ORDER BY ds.fecha;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ========================================

-- Habilitar RLS en todas las tablas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE maestros ENABLE ROW LEVEL SECURITY;
ALTER TABLE movements ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Admins can read all users" ON users;
DROP POLICY IF EXISTS "Admins can update users" ON users;
DROP POLICY IF EXISTS "Users can insert themselves" ON users;
DROP POLICY IF EXISTS "Authenticated users can read maestros" ON maestros;
DROP POLICY IF EXISTS "Admins can create maestros" ON maestros;
DROP POLICY IF EXISTS "Admins can update maestros" ON maestros;
DROP POLICY IF EXISTS "Authenticated users can read movements" ON movements;
DROP POLICY IF EXISTS "Authenticated users can create movements" ON movements;

-- ========================================
-- POLÍTICAS PARA USERS
-- ========================================

-- Los usuarios pueden leer sus propios datos
CREATE POLICY "Users can read own data" 
  ON users FOR SELECT 
  USING (true); -- Permitir lectura de todos los usuarios autenticados

-- Los admins pueden leer todos los usuarios
CREATE POLICY "Admins can read all users" 
  ON users FOR SELECT 
  USING (
    role = 'ADMIN' OR 
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.email = auth.jwt() ->> 'email' AND users.role = 'ADMIN'
    )
  );

-- Los admins pueden actualizar cualquier usuario
CREATE POLICY "Admins can update users" 
  ON users FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.email = auth.jwt() ->> 'email' AND users.role = 'ADMIN'
    )
  );

-- Permitir inserción de nuevos usuarios (para registro)
CREATE POLICY "Users can insert themselves" 
  ON users FOR INSERT 
  WITH CHECK (true);

-- ========================================
-- POLÍTICAS PARA MAESTROS
-- ========================================

-- Usuarios autenticados pueden leer maestros
CREATE POLICY "Authenticated users can read maestros" 
  ON maestros FOR SELECT 
  USING (true);

-- Solo admins pueden crear maestros
CREATE POLICY "Admins can create maestros" 
  ON maestros FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.email = auth.jwt() ->> 'email' AND users.role = 'ADMIN'
    )
  );

-- Solo admins pueden actualizar maestros
CREATE POLICY "Admins can update maestros" 
  ON maestros FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.email = auth.jwt() ->> 'email' AND users.role = 'ADMIN'
    )
  );

-- ========================================
-- POLÍTICAS PARA MOVEMENTS
-- ========================================

-- Usuarios autenticados pueden leer movimientos
CREATE POLICY "Authenticated users can read movements" 
  ON movements FOR SELECT 
  USING (true);

-- Usuarios autenticados pueden crear movimientos
CREATE POLICY "Authenticated users can create movements" 
  ON movements FOR INSERT 
  WITH CHECK (true);

-- ========================================
-- 6. DATOS DE PRUEBA
-- ========================================

-- Insertar usuarios de prueba
-- IMPORTANTE: Después de crear estos usuarios en la tabla, debes crear
-- las cuentas correspondientes en Supabase Auth con las mismas direcciones de email
INSERT INTO users (email, name, role, avatar_url) VALUES
  ('admin@biblioteca.com', 'Carlos Rodríguez', 'ADMIN', NULL),
  ('user@biblioteca.com', 'María González', 'USER', NULL),
  ('coordinador@biblioteca.com', 'Ana Martínez', 'USER', NULL)
ON CONFLICT (email) DO NOTHING;

-- Insertar maestros de prueba
INSERT INTO maestros (nombre, saldo, creado_por) VALUES
  ('Biblioteca Central', 15000, 'Carlos Rodríguez'),
  ('Sucursal Norte', 8500, 'Carlos Rodríguez'),
  ('Biblioteca Universitaria', 25000, 'Carlos Rodríguez'),
  ('Hemeroteca', 12000, 'María González'),
  ('Sala de Lectura', 8000, 'Carlos Rodríguez')
ON CONFLICT (nombre) DO NOTHING;

-- Insertar movimientos de prueba
DO $$
DECLARE
  maestro_central_id UUID;
  maestro_norte_id UUID;
BEGIN
  -- Obtener IDs de maestros
  SELECT id INTO maestro_central_id FROM maestros WHERE nombre = 'Biblioteca Central';
  SELECT id INTO maestro_norte_id FROM maestros WHERE nombre = 'Sucursal Norte';

  -- Insertar movimientos para Biblioteca Central
  IF maestro_central_id IS NOT NULL THEN
    INSERT INTO movements (maestro_id, maestro_nombre, tipo, cantidad, responsable, fecha) VALUES
      (maestro_central_id, 'Biblioteca Central', 'ENTRADA', 3500, 'Carlos Rodríguez', NOW() - INTERVAL '15 days'),
      (maestro_central_id, 'Biblioteca Central', 'SALIDA', 800, 'María González', NOW() - INTERVAL '12 days'),
      (maestro_central_id, 'Biblioteca Central', 'ENTRADA', 5000, 'Carlos Rodríguez', NOW() - INTERVAL '8 days'),
      (maestro_central_id, 'Biblioteca Central', 'SALIDA', 1200, 'Ana Martínez', NOW() - INTERVAL '5 days'),
      (maestro_central_id, 'Biblioteca Central', 'ENTRADA', 2500, 'Carlos Rodríguez', NOW() - INTERVAL '2 days');
  END IF;

  -- Insertar movimientos para Sucursal Norte
  IF maestro_norte_id IS NOT NULL THEN
    INSERT INTO movements (maestro_id, maestro_nombre, tipo, cantidad, responsable, fecha) VALUES
      (maestro_norte_id, 'Sucursal Norte', 'ENTRADA', 2500, 'María González', NOW() - INTERVAL '10 days'),
      (maestro_norte_id, 'Sucursal Norte', 'SALIDA', 1200, 'Ana Martínez', NOW() - INTERVAL '5 days'),
      (maestro_norte_id, 'Sucursal Norte', 'ENTRADA', 3000, 'Carlos Rodríguez', NOW() - INTERVAL '3 days');
  END IF;
END $$;

-- ========================================
-- 7. VISTAS ÚTILES
-- ========================================

-- Vista para resumen de maestros con estadísticas
CREATE OR REPLACE VIEW v_maestros_summary AS
SELECT 
  m.id,
  m.nombre,
  m.saldo,
  m.creado_por,
  m.created_at,
  COUNT(mv.id) as total_movimientos,
  COALESCE(SUM(CASE WHEN mv.tipo = 'ENTRADA' THEN mv.cantidad ELSE 0 END), 0) as total_entradas,
  COALESCE(SUM(CASE WHEN mv.tipo = 'SALIDA' THEN mv.cantidad ELSE 0 END), 0) as total_salidas,
  MAX(mv.fecha) as ultimo_movimiento
FROM maestros m
LEFT JOIN movements mv ON m.id = mv.maestro_id
GROUP BY m.id, m.nombre, m.saldo, m.creado_por, m.created_at;

-- ========================================
-- 8. VERIFICACIÓN
-- ========================================

-- Mostrar resumen de la base de datos
SELECT 'Tablas creadas correctamente' AS status;

SELECT 'Usuarios:' as tipo, COUNT(*) as cantidad FROM users
UNION ALL
SELECT 'Maestros:', COUNT(*) FROM maestros
UNION ALL
SELECT 'Movimientos:', COUNT(*) FROM movements;

-- Mostrar resumen de maestros
SELECT * FROM v_maestros_summary ORDER BY nombre;
