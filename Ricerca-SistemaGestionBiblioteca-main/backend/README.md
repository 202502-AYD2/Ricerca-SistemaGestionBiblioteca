# 🚀 Backend API - Sistema de Gestión de Biblioteca

Backend completo con Node.js + Express + Supabase para el sistema de gestión de biblioteca.

## 📋 Características

✅ **API RESTful** completa con Express.js  
✅ **Autenticación** con JWT y Supabase Auth  
✅ **Autorización** basada en roles (ADMIN/USER)  
✅ **Validación** de datos con express-validator  
✅ **Seguridad** con helmet y CORS configurado  
✅ **Logging** con morgan  
✅ **Conexión** directa a Supabase desde backend  

## 🛠️ Tecnologías

- **Node.js** v18+
- **Express.js** v4.18
- **Supabase** (PostgreSQL + Auth)
- **ES Modules** (import/export)

## 📦 Instalación

### 1. Instalar Dependencias

```bash
npm install
```

### 2. Configurar Variables de Entorno

```bash
cp .env.example .env
```

Edita `.env` con tus credenciales de Supabase:

```env
PORT=3001
NODE_ENV=development

SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key

FRONTEND_URL=http://localhost:3000
JWT_SECRET=tu-jwt-secret-aqui
```

**IMPORTANTE**: Obtén el `SERVICE_ROLE_KEY` desde:
- Supabase Dashboard → Settings → API → Service Role (secret)

### 3. Ejecutar el Servidor

```bash
# Modo desarrollo (con nodemon)
npm run dev

# Modo producción
npm start
```

El servidor estará en: http://localhost:3001

## 📚 API Endpoints

### Autenticación

| Método | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/login` | Login de usuario | No |
| POST | `/api/auth/logout` | Logout de usuario | No |
| GET | `/api/auth/me` | Obtener usuario actual | Sí |
| POST | `/api/auth/refresh` | Refrescar token | No |

### Maestros

| Método | Endpoint | Descripción | Auth | Rol |
|--------|----------|-------------|------|-----|
| GET | `/api/maestros` | Listar maestros | Sí | USER/ADMIN |
| GET | `/api/maestros/:id` | Obtener maestro | Sí | USER/ADMIN |
| POST | `/api/maestros` | Crear maestro | Sí | ADMIN |
| PUT | `/api/maestros/:id` | Actualizar maestro | Sí | ADMIN |
| DELETE | `/api/maestros/:id` | Eliminar maestro | Sí | ADMIN |
| GET | `/api/maestros/:id/stats` | Estadísticas maestro | Sí | USER/ADMIN |

### Movimientos

| Método | Endpoint | Descripción | Auth | Rol |
|--------|----------|-------------|------|-----|
| GET | `/api/movements` | Listar movimientos | Sí | USER/ADMIN |
| GET | `/api/movements/:id` | Obtener movimiento | Sí | USER/ADMIN |
| POST | `/api/movements` | Crear movimiento | Sí | USER/ADMIN |
| DELETE | `/api/movements/:id` | Eliminar movimiento | Sí | USER/ADMIN |
| GET | `/api/movements/recent?limit=10` | Movimientos recientes | Sí | USER/ADMIN |
| GET | `/api/movements/daily-balances/:maestroId` | Saldos diarios | Sí | USER/ADMIN |
| GET | `/api/movements/stats/:maestroId` | Estadísticas | Sí | USER/ADMIN |

### Usuarios

| Método | Endpoint | Descripción | Auth | Rol |
|--------|----------|-------------|------|-----|
| GET | `/api/users` | Listar usuarios | Sí | ADMIN |
| GET | `/api/users/:id` | Obtener usuario | Sí | ADMIN |
| PUT | `/api/users/:id/role` | Actualizar rol | Sí | ADMIN |
| PUT | `/api/users/:id/profile` | Actualizar perfil | Sí | USER/ADMIN |
| DELETE | `/api/users/:id` | Eliminar usuario | Sí | ADMIN |
| GET | `/api/users/stats` | Estadísticas | Sí | ADMIN |

## 🔐 Autenticación

### Login

```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@biblioteca.com",
  "password": "Admin123!"
}
```

**Respuesta:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "...",
    "user": {
      "id": "uuid",
      "email": "admin@biblioteca.com",
      "name": "Carlos Rodríguez",
      "role": "ADMIN",
      "avatarUrl": null
    }
  }
}
```

### Usar el Token

Para endpoints protegidos, incluye el token en el header:

```bash
Authorization: Bearer <token>
```

## 📝 Ejemplos de Uso

### Crear un Maestro

```bash
POST /api/maestros
Authorization: Bearer <token>
Content-Type: application/json

{
  "nombre": "Biblioteca Digital",
  "saldoInicial": 10000
}
```

### Crear un Movimiento

```bash
POST /api/movements
Authorization: Bearer <token>
Content-Type: application/json

{
  "maestroId": "uuid-del-maestro",
  "maestroNombre": "Biblioteca Digital",
  "tipo": "ENTRADA",
  "cantidad": 500
}
```

### Obtener Saldos Diarios

```bash
GET /api/movements/daily-balances/uuid-del-maestro?days=30
Authorization: Bearer <token>
```

## 🏗️ Estructura del Proyecto

```
backend/
├── src/
│   ├── config/
│   │   └── supabase.js          # Configuración de Supabase
│   ├── controllers/
│   │   ├── authController.js    # Lógica de autenticación
│   │   ├── maestrosController.js
│   │   ├── movementsController.js
│   │   └── usersController.js
│   ├── middleware/
│   │   └── auth.js              # Middleware de autenticación
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── maestrosRoutes.js
│   │   ├── movementsRoutes.js
│   │   └── usersRoutes.js
│   └── server.js                # Servidor principal
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## 🔒 Seguridad

- ✅ CORS configurado para solo aceptar requests del frontend
- ✅ Helmet para headers de seguridad
- ✅ Validación de entrada con express-validator
- ✅ Autenticación con JWT via Supabase
- ✅ Variables de entorno para credenciales
- ✅ Service Role Key solo en backend (nunca en frontend)

## 🐛 Debugging

### Ver Logs del Servidor

```bash
npm run dev
```

### Testear Health Check

```bash
curl http://localhost:3001/health
```

### Testear Login

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@biblioteca.com","password":"Admin123!"}'
```

## 🆘 Problemas Comunes

### Error: "SUPABASE_URL no está configurado"
→ Verifica que el archivo `.env` existe y tiene las variables correctas

### Error: "Cannot find module"
→ Ejecuta `npm install` para instalar dependencias

### Error: "EADDRINUSE"
→ El puerto 3001 está ocupado. Cambia el PORT en `.env`

### Error: "Token inválido"
→ El token expiró. Haz login nuevamente o usa refresh token

## 📄 Licencia

MIT

---

**Creado para el Sistema de Gestión de Biblioteca** 🚀
