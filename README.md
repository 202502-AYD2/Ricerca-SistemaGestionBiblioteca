# 🚀 Sistema Completo de Gestión de Biblioteca

Integrantes del equipo:

Sarah Yauripoma Cano - C.C. 1013338862

Valentina Hoyos Castrillón - C.C. 1034917822

Andres Felipe Bernal Molina - C.C. 1023624342

Juan Pablo Herrera Jaramillo - C.C. 1022143677


Sistema completo con Backend (Node.js + Express), Frontend (Next.js), y Base de Datos (Supabase/PostgreSQL).

## 📦 Contenido del Paquete

```
sistema-biblioteca-completo/
├── backend/           # API REST con Node.js + Express
├── frontend/          # Aplicación Next.js + React
├── database/          # Schema SQL para PostgreSQL/Supabase
├── docs/              # Documentación adicional
└── README.md          # Este archivo
```

## ⚡ Inicio Rápido (15 minutos)

### 1. Configurar Supabase (5 min)

1. Crea una cuenta en [supabase.com](https://supabase.com)
2. Crea un nuevo proyecto
3. Ve a SQL Editor y ejecuta `database/schema.sql`
4. Ve a Authentication → Users y crea:
   - `admin@biblioteca.com` / `Admin123!` (marca como confirmado)
   - `user@biblioteca.com` / `User123!` (marca como confirmado)
5. Ve a Settings → API y copia:
   - Project URL
   - anon/public key
   - **service_role key** (en Service Role secret)

### 2. Configurar Backend (5 min)

```bash
cd backend/

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales de Supabase

# Iniciar servidor
npm run dev
```

Verificar: http://localhost:3001/health

### 3. Configurar Frontend (5 min)

```bash
cd frontend/

# Instalar dependencias
pnpm install
# o: npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local (solo necesitas NEXT_PUBLIC_API_URL)

# Iniciar aplicación
pnpm dev
# o: npm run dev
```

Abrir: http://localhost:3000

## 🔐 Credenciales de Prueba

- **Admin**: `admin@biblioteca.com` / `Admin123!`
- **User**: `user@biblioteca.com` / `User123!`

## 📚 Arquitectura

```
┌──────────────┐    HTTP/REST    ┌──────────────┐    SQL    ┌────────────┐
│   FRONTEND   │ ←───────────→   │   BACKEND    │ ←───────→ │  SUPABASE  │
│  (Next.js)   │   JSON + JWT    │  (Express)   │  Queries  │(PostgreSQL)│
└──────────────┘                 └──────────────┘           └────────────┘
```

### Reglas de Oro:
1. ✅ **Backend** se conecta a Supabase
2. ✅ **Frontend** se conecta al Backend
3. ❌ **Frontend NO se conecta** directamente a Supabase

## ✨ Funcionalidades

- 🔐 Autenticación con JWT
- 👥 Dos roles: ADMIN y USER
- 📚 Gestión de Maestros (materiales)
- 📊 Gestión de Movimientos (entrada/salida)
- 👤 Gestión de Usuarios (solo ADMIN)
- 📈 Gráficas de saldos diarios
- ✅ Validaciones automáticas
- 🔒 Seguridad multi-capa

## 📖 Documentación Detallada

- **Backend**: Lee `backend/README.md`
- **Frontend**: Lee `frontend/README.md`
- **Base de Datos**: Revisa `database/schema.sql`
- **Integración**: Lee `docs/INTEGRACION.md`

## 🆘 Problemas Comunes

### Backend no inicia
```bash
# Verificar que .env existe
ls backend/.env

# Verificar variables
cat backend/.env
```

### Frontend no conecta al backend
```bash
# Verificar que .env.local existe
ls frontend/.env.local

# Debe contener:
# NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### Error CORS
Verificar en `backend/.env`:
```
FRONTEND_URL=http://localhost:3000
```

### Error 401 Unauthorized
El token expiró o es inválido. Haz login nuevamente.

## 🚀 Deploy en Producción

### Backend (Railway/Render)
1. Sube el código a GitHub
2. Conecta en Railway/Render
3. Configura variables de entorno
4. Deploy automático

### Frontend (Vercel)
1. Conecta repositorio en Vercel
2. Configura `NEXT_PUBLIC_API_URL` con URL del backend
3. Deploy automático

## 📝 Notas Importantes

- **SERVICE_ROLE_KEY** solo va en el backend
- **ANON_KEY** se puede usar en frontend (pero no lo necesitas)
- El frontend solo guarda el JWT token
- Todas las consultas a BD pasan por el backend

## 🎯 Próximos Pasos

1. ✅ Personaliza el diseño
2. ✅ Agrega más maestros de prueba
3. ✅ Explora todas las funcionalidades
4. ✅ Lee la documentación técnica
5. ✅ Despliega en producción

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs del backend (`npm run dev`)
2. Revisa la consola del navegador (F12)
3. Verifica que ambos servidores están corriendo
4. Confirma que las variables de entorno están bien

---

**¡Disfruta tu sistema!** 🎉

Creado con ❤️ para gestión educativa y administrativa
