const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';
const TOKEN_KEY = 'ecorecicla_token';
const USER_KEY = 'ecorecicla_usuario';

export class ApiError extends Error {
  constructor(message, status, detalles) {
    super(message);
    this.status = status;
    this.detalles = detalles;
  }
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function saveSession(token, usuario) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(usuario));
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

async function request(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('No pudimos conectar con el servidor. Revisa tu conexión.', 0);
  }

  if (response.status === 204) return null;

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message = data?.error || 'Ocurrió un error inesperado.';
    throw new ApiError(message, response.status, data?.detalles);
  }
  return data;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body }),
  put: (path, body) => request(path, { method: 'PUT', body }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
  delete: (path) => request(path, { method: 'DELETE' }),
};
