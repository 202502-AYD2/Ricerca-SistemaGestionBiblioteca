// Mock API utilities for simulating backend operations
// INTEGRATION NOTE: Replace these functions with actual API calls or Server Actions

import maestrosData from "@/mock/maestros.json"
import movementsData from "@/mock/movements.json"
import usersData from "@/mock/users.json"

// Expected Supabase Database Schema:
/*
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('ADMIN', 'USER')),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE maestros (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  saldo DECIMAL(10, 2) NOT NULL DEFAULT 0,
  creado_por TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  maestro_id UUID REFERENCES maestros(id) ON DELETE CASCADE,
  maestro_nombre TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('ENTRADA', 'SALIDA')),
  cantidad DECIMAL(10, 2) NOT NULL,
  responsable TEXT NOT NULL,
  fecha TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security (RLS) policies:
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE maestros ENABLE ROW LEVEL SECURITY;
ALTER TABLE movements ENABLE ROW LEVEL SECURITY;

-- Users table: Users can read their own data, admins can read all
CREATE POLICY "Users can read own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can read all users" ON users FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN')
);
CREATE POLICY "Admins can update users" ON users FOR UPDATE USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN')
);

-- Maestros table: All authenticated users can read, only admins can insert
CREATE POLICY "Authenticated users can read maestros" ON maestros FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can insert maestros" ON maestros FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN')
);

-- Movements table: All authenticated users can read and insert
CREATE POLICY "Authenticated users can read movements" ON movements FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert movements" ON movements FOR INSERT WITH CHECK (auth.role() = 'authenticated');
*/

// Expected API endpoints to implement:
// GET /api/maestros - Get all maestros
// POST /api/maestros - Create new maestro (ADMIN only)
// GET /api/movements?maestroId={id} - Get movements by maestro
// POST /api/movements - Create new movement
// GET /api/users - Get all users (ADMIN only)
// PUT /api/users/:id - Update user role (ADMIN only)

export const mockApi = {
  maestros: {
    getAll: async () => {
      await new Promise((resolve) => setTimeout(resolve, 500))
      return maestrosData
    },
    create: async (data: { nombre: string; saldo: number; creadoPor: string }) => {
      await new Promise((resolve) => setTimeout(resolve, 800))
      const newMaestro = {
        id: String(Date.now()),
        ...data,
        createdAt: new Date().toISOString(),
      }
      return newMaestro
    },
  },

  movements: {
    getByMaestro: async (maestroId: string) => {
      await new Promise((resolve) => setTimeout(resolve, 500))
      return movementsData.filter((m) => m.maestroId === maestroId)
    },
    getAll: async () => {
      await new Promise((resolve) => setTimeout(resolve, 500))
      return movementsData
    },
    create: async (data: {
      maestroId: string
      maestroNombre: string
      tipo: "ENTRADA" | "SALIDA"
      cantidad: number
      responsable: string
    }) => {
      await new Promise((resolve) => setTimeout(resolve, 800))
      const newMovement = {
        id: String(Date.now()),
        ...data,
        fecha: new Date().toISOString(),
      }
      return newMovement
    },
  },

  users: {
    getAll: async () => {
      await new Promise((resolve) => setTimeout(resolve, 500))
      return usersData.map(({ password, ...user }) => user)
    },
    updateRole: async (userId: string, role: "ADMIN" | "USER") => {
      await new Promise((resolve) => setTimeout(resolve, 800))
      return { success: true, userId, role }
    },
  },
}
