const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

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
    })
}