/**
 * Cliente HTTP para la futura API REST de GO Puntos.
 *
 * Sólo se usa cuando appConfig.useMocks = false. Agrega a cada pedido:
 *   Authorization: Bearer <token>   identifica a la persona
 *   X-Business-Id: <id>             negocio sobre el que se opera (contexto activo)
 * La API valida con esos datos el rol de la persona en ese negocio
 * (personal del negocio) o su membresía como cliente.
 *
 * Convierte cualquier error en ApiError para que la interfaz los muestre igual.
 */
import { appConfig } from '../config/app.config.js';
import { ApiError } from './errors.js';
import { session } from './session.js';

async function request(path, { method = 'GET', body } = {}) {
  const token = session.token();
  const businessId = session.businessId();
  let res;
  try {
    res = await fetch(appConfig.apiUrl + path, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(businessId && { 'X-Business-Id': String(businessId) }),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('No pudimos conectar con el servidor. Revisá tu conexión.', 0);
  }
  if (res.status === 204) return null;
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(data?.message || `Error ${res.status}`, res.status, data?.details || data);
  return data;
}

export const http = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body }),
  put: (path, body) => request(path, { method: 'PUT', body }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
  del: (path) => request(path, { method: 'DELETE' }),
};

/** Arma un query string ignorando valores vacíos: qs({ q: 'ana', page: 2 }) → "?q=ana&page=2" */
export function qs(params = {}) {
  const p = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') p.set(k, v); });
  const s = p.toString();
  return s ? `?${s}` : '';
}
