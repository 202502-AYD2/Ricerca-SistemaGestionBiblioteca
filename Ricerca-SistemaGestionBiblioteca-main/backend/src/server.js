import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'

// Importar rutas
import authRoutes from './routes/authRoutes.js'
import maestrosRoutes from './routes/maestrosRoutes.js'
import movementsRoutes from './routes/movementsRoutes.js'
import usersRoutes from './routes/usersRoutes.js'
import librosRoutes from './routes/librosRoutes.js'
import prestamosRoutes from './routes/prestamosRoutes.js'
import multasRoutes from './routes/multasRoutes.js'

// Cargar variables de entorno
dotenv.config()

// Crear aplicación Express
const app = express()

// Puerto
const PORT = process.env.PORT || 3001

// ========================================
// MIDDLEWARES
// ========================================

// Seguridad
app.use(helmet())

// CORS
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
}
app.use(cors(corsOptions))

// Body parser
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Logger
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'))
} else {
  app.use(morgan('combined'))
}

// ========================================
// RUTAS
// ========================================

// Ruta de health check
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API de Biblioteca funcionando correctamente',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  })
})

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/maestros', maestrosRoutes)
app.use('/api/movements', movementsRoutes)
app.use('/api/users', usersRoutes)
app.use('/api/libros', librosRoutes)
app.use('/api/prestamos', prestamosRoutes)
app.use('/api/multas', multasRoutes)

// Ruta para manejar rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    path: req.originalUrl
  })
})

// ========================================
// MANEJO DE ERRORES GLOBAL
// ========================================

app.use((err, req, res, next) => {
  console.error('Error:', err)

  // Error de validación de express-validator
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Error de validación',
      details: err.errors
    })
  }

  // Error genérico
  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  })
})

// ========================================
// INICIAR SERVIDOR
// ========================================

app.listen(PORT, () => {
  console.log('========================================')
  console.log('🚀 Servidor Backend de Biblioteca')
  console.log('========================================')
  console.log(`📡 Servidor corriendo en puerto: ${PORT}`)
  console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`)
  console.log(`🔗 URL: http://localhost:${PORT}`)
  console.log(`✅ Health check: http://localhost:${PORT}/health`)
  console.log('========================================')
  console.log('')
  console.log('📚 Endpoints disponibles:')
  console.log('  POST   /api/auth/login')
  console.log('  POST   /api/auth/logout')
  console.log('  GET    /api/auth/me')
  console.log('  GET    /api/maestros')
  console.log('  POST   /api/maestros')
  console.log('  GET    /api/movements')
  console.log('  POST   /api/movements')
  console.log('  GET    /api/users')
  console.log('  PUT    /api/users/:id/role')
  console.log('========================================')
})
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://ricerca-sistemagestionbiblioteca-uvdw.onrender.com',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}))

export default app
