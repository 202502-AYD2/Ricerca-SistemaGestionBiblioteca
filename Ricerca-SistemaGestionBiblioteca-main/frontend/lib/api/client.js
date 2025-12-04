const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token')
  }
  return null
}

const fetchAPI = async (endpoint, options = {}) => {
  const token = getAuthToken()
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  }

  const url = `${API_BASE_URL}${endpoint}`

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('API Error:', error)
    throw error
  }
}

export const api = {
  // ==========================================
  // AUTH
  // ==========================================
  
  login: (email, password) =>
    fetchAPI('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }),

  register: (userData) =>
    fetchAPI('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    }),

  getCurrentUser: () => fetchAPI('/api/auth/me'),

  // ==========================================
  // MAESTROS
  // ==========================================

  getMaestros: () => fetchAPI('/api/maestros'),

  getMaestroById: (id) => fetchAPI(`/api/maestros/${id}`),

  createMaestro: (maestro) =>
    fetchAPI('/api/maestros', {
      method: 'POST',
      body: JSON.stringify(maestro)
    }),

  updateMaestro: (id, updates) =>
    fetchAPI(`/api/maestros/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    }),

  deleteMaestro: (id) =>
    fetchAPI(`/api/maestros/${id}`, {
      method: 'DELETE'
    }),

  // ==========================================
  // MOVEMENTS
  // ==========================================

  getMovements: (filters = {}) => {
    const params = new URLSearchParams(filters).toString()
    return fetchAPI(`/api/movements${params ? `?${params}` : ''}`)
  },

  getMovementById: (id) => fetchAPI(`/api/movements/${id}`),

  createMovement: (movement) =>
    fetchAPI('/api/movements', {
      method: 'POST',
      body: JSON.stringify(movement)
    }),

  deleteMovement: (id) =>
    fetchAPI(`/api/movements/${id}`, {
      method: 'DELETE'
    }),

  // ==========================================
  // USERS
  // ==========================================

  getUsers: () => fetchAPI('/api/users'),

  getUserById: (id) => fetchAPI(`/api/users/${id}`),

  updateUserRole: (id, role) =>
    fetchAPI(`/api/users/${id}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role })
    }),

  // ==========================================
  // LIBROS
  // ==========================================

  getLibros: () => fetchAPI('/api/libros'),

  getLibroById: (id) => fetchAPI(`/api/libros/${id}`),

  createLibro: (libro) =>
    fetchAPI('/api/libros', {
      method: 'POST',
      body: JSON.stringify(libro)
    }),

  updateLibro: (id, updates) =>
    fetchAPI(`/api/libros/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    }),

  deleteLibro: (id) =>
    fetchAPI(`/api/libros/${id}`, {
      method: 'DELETE'
    }),

  searchLibros: (query) =>
    fetchAPI(`/api/libros/search?q=${encodeURIComponent(query)}`),

  // ==========================================
  // PRÉSTAMOS
  // ==========================================

  getPrestamos: (devuelto) =>
    fetchAPI(`/api/prestamos${devuelto !== undefined ? `?devuelto=${devuelto}` : ''}`),

  createPrestamo: (prestamo) =>
    fetchAPI('/api/prestamos', {
      method: 'POST',
      body: JSON.stringify(prestamo)
    }),

  devolverPrestamo: (id) =>
    fetchAPI(`/api/prestamos/${id}/devolver`, {
      method: 'PUT'
    }),

  getPrestamosVencidos: () =>
    fetchAPI('/api/prestamos/vencidos'),

  deletePrestamo: (id) =>
    fetchAPI(`/api/prestamos/${id}`, {
      method: 'DELETE'
    }),

  // ==========================================
  // MULTAS
  // ==========================================

  getMultas: (filters = {}) => {
    const params = new URLSearchParams(filters).toString()
    return fetchAPI(`/api/multas${params ? `?${params}` : ''}`)
  },

  createMulta: (multa) =>
    fetchAPI('/api/multas', {
      method: 'POST',
      body: JSON.stringify(multa)
    }),

  pagarMulta: (id) =>
    fetchAPI(`/api/multas/${id}/pagar`, {
      method: 'PUT'
    }),

  getMultasStats: () =>
    fetchAPI('/api/multas/stats'),

  generarMultasAutomaticas: (montoPorDia) =>
    fetchAPI('/api/multas/generar-automaticas', {
      method: 'POST',
      body: JSON.stringify({ monto_por_dia: montoPorDia })
    }),

  deleteMulta: (id) =>
    fetchAPI(`/api/multas/${id}`, {
      method: 'DELETE'
    }),
}