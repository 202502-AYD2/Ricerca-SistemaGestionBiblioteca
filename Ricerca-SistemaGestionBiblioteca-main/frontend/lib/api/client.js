const API_URL = 'https://ricerca-sistemagestionbiblioteca-backend.onrender.com'

// Helper para hacer peticiones autenticadas
async function fetchAPI(endpoint, options = {}) {
  const token = localStorage.getItem('authToken')
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Error en la petición')
  }

  return data
}

export const api = {
  // Auth
  login: (email, password) => 
    fetchAPI('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }),
  
  logout: () => 
    fetchAPI('/auth/logout', { method: 'POST' }),
  
  getCurrentUser: () => 
    fetchAPI('/auth/me'),

  // Maestros
  getMaestros: () => 
    fetchAPI('/maestros'),
  
  createMaestro: (nombre, saldoInicial) => 
    fetchAPI('/maestros', {
      method: 'POST',
      body: JSON.stringify({ nombre, saldoInicial })
    }),

  // Movimientos
  getMovements: (maestroId) => 
    fetchAPI(`/movements${maestroId ? `?maestroId=${maestroId}` : ''}`),
  
  createMovement: (maestroId, maestroNombre, tipo, cantidad) => 
    fetchAPI('/movements', {
      method: 'POST',
      body: JSON.stringify({ maestroId, maestroNombre, tipo, cantidad })
    }),

  getDailyBalances: (maestroId, days = 30) =>
    fetchAPI(`/movements/daily-balances/${maestroId}?days=${days}`),

  // Usuarios
  getUsers: () => 
    fetchAPI('/users'),
  
  updateUserRole: (userId, role) => 
    fetchAPI(`/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role })
    }),
  // ==========================================
  // LIBROS
  // ==========================================

  getLibros: () => fetchAPI('/libros'),

  getLibroById: (id) => fetchAPI(`/libros/${id}`),

  createLibro: (libro) =>
    fetchAPI('/libros', {
      method: 'POST',
      body: JSON.stringify(libro)
    }),

  updateLibro: (id, updates) =>
    fetchAPI(`/libros/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    }),

  deleteLibro: (id) =>
    fetchAPI(`/libros/${id}`, {
      method: 'DELETE'
    }),

  searchLibros: (query) =>
    fetchAPI(`/libros/search?q=${encodeURIComponent(query)}`),

  // ==========================================
  // PRÉSTAMOS
  // ==========================================

  getPrestamos: (devuelto) =>
    fetchAPI(`/prestamos${devuelto !== undefined ? `?devuelto=${devuelto}` : ''}`),

  createPrestamo: (prestamo) =>
    fetchAPI('/prestamos', {
      method: 'POST',
      body: JSON.stringify(prestamo)
    }),

  devolverPrestamo: (id) =>
    fetchAPI(`/prestamos/${id}/devolver`, {
      method: 'PUT'
    }),

  getPrestamosVencidos: () =>
    fetchAPI('/prestamos/vencidos'),

  deletePrestamo: (id) =>
    fetchAPI(`/prestamos/${id}`, {
      method: 'DELETE'
    }),

  // ==========================================
  // MULTAS
  // ==========================================

  getMultas: (filters = {}) => {
    const params = new URLSearchParams(filters).toString()
    return fetchAPI(`/multas${params ? `?${params}` : ''}`)
  },

  createMulta: (multa) =>
    fetchAPI('/multas', {
      method: 'POST',
      body: JSON.stringify(multa)
    }),

  pagarMulta: (id) =>
    fetchAPI(`/multas/${id}/pagar`, {
      method: 'PUT'
    }),

  getMultasStats: () =>
    fetchAPI('/multas/stats'),

  generarMultasAutomaticas: (montoPorDia) =>
    fetchAPI('/multas/generar-automaticas', {
      method: 'POST',
      body: JSON.stringify({ monto_por_dia: montoPorDia })
    }),

  deleteMulta: (id) =>
    fetchAPI(`/multas/${id}`, {
      method: 'DELETE'
    }),
}