/**
 * Servicio de clientes de GO Puntos.
 *
 * Reúne las tres miradas sobre un cliente:
 *   - App del cliente: sus negocios, "Mis puntos", movimientos y perfil
 *     (siempre del negocio que está mirando: los datos nunca se mezclan).
 *   - Caja: buscar o identificar al cliente (QR personal) y ver su tarjeta.
 *   - Panel: listado con segmentos, ficha completa y ajustes manuales.
 *
 * Endpoints previstos:
 *   GET  /me/memberships                       → [{ membership, business, levelInfo }]
 *   GET  /businesses?status=activo             → [business]   (negocios para sumarse)
 *   POST /me/memberships          { slug }     → { membership, business, created }
 *   GET  /me/businesses/:id/dashboard          → resumen de "Mis puntos"
 *   GET  /me/businesses/:id/movements          → [movement]
 *   GET  /me/movements                         → [movement] de todos los negocios
 *   GET  /me/businesses/:id/profile            → nivel, racha, desafíos y negocios
 *   GET  /staff/customers?q=                   → [cliente resumido]
 *   GET  /staff/customers/by-code/:code        → tarjeta de caja
 *   GET  /staff/customers/:membershipId        → tarjeta de caja
 *   GET  /admin/customers                      → { levels, period, rows }
 *   GET  /admin/customers/:membershipId        → ficha completa
 *   POST /admin/customers/:membershipId/adjust { points, reason } → movimiento
 */
import { http, qs } from './http.js';
import { send } from './request.js';
import { session } from './session.js';

const mocks = () => import('../mocks/api/customers.js').then((m) => m.customersApi);
const activeId = () => session.businessId();

export const customerService = {
  /* ---------- App del cliente ---------- */

  getMemberships: () => send({
    mock: async () => (await mocks()).memberships(),
    api: () => http.get('/me/memberships'),
    ms: 150,
  }),

  /** Negocios activos a los que la cuenta se puede sumar (en producción se llega por el QR del local). */
  getDiscoverable: () => send({
    mock: async () => (await mocks()).discoverable(),
    api: () => http.get('/businesses?status=activo'),
    ms: 150,
  }),

  /** Suma la cuenta a un negocio. Si ya era miembro, devuelve la membresía existente (created = false). */
  join: (slug) => send({
    mock: async () => (await mocks()).join(slug),
    api: () => http.post('/me/memberships', { slug }),
    write: true,
  }),

  /**
   * Resumen de "Mis puntos" del negocio activo.
   * Escribe porque al abrir la app el servidor genera los avisos que dependen
   * del tiempo (racha en riesgo, canjes por vencer).
   */
  getDashboard: () => send({
    mock: async () => (await mocks()).dashboard(),
    api: () => http.get(`/me/businesses/${activeId()}/dashboard`),
    write: true,
  }),

  /** scope 'active' = negocio activo; 'all' = todos los negocios de la cuenta. */
  getMovements: (scope = 'active') => send({
    mock: async () => (await mocks()).movements(scope),
    api: () => http.get(scope === 'all' ? '/me/movements' : `/me/businesses/${activeId()}/movements`),
  }),

  getProfile: () => send({
    mock: async () => (await mocks()).profile(),
    api: () => http.get(`/me/businesses/${activeId()}/profile`),
  }),

  /* ---------- Caja (dueño, administrador o empleado) ---------- */

  search: (query) => send({
    mock: async () => (await mocks()).search(query),
    api: () => http.get(`/staff/customers${qs({ q: query })}`),
    ms: 200,
  }),

  /** Identifica al cliente por el código de su QR personal en ESTE negocio. */
  findByCode: (code) => send({
    mock: async () => (await mocks()).findByCode(code),
    api: () => http.get(`/staff/customers/by-code/${encodeURIComponent(code)}`),
  }),

  getCashierCard: (membershipId) => send({
    mock: async () => (await mocks()).cashierCard(membershipId),
    api: () => http.get(`/staff/customers/${membershipId}`),
    ms: 200,
  }),

  /* ---------- Panel (dueño o administrador) ---------- */

  list: () => send({
    mock: async () => (await mocks()).list(),
    api: () => http.get('/admin/customers'),
  }),

  getDetail: (membershipId) => send({
    mock: async () => (await mocks()).detail(membershipId),
    api: () => http.get(`/admin/customers/${membershipId}`),
  }),

  /**
   * Ajuste manual de puntos (positivo o negativo). Corrige el SALDO
   * disponible; no suma a los puntos del período (no cambia nivel ni ranking).
   */
  adjustPoints: (membershipId, data) => send({
    mock: async () => (await mocks()).adjust(membershipId, data),
    api: () => http.post(`/admin/customers/${membershipId}/adjust`, data),
    write: true,
  }),
};
