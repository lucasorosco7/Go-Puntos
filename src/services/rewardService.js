/**
 * Servicio de recompensas y canjes de GO Puntos.
 *
 * Centraliza las operaciones relacionadas con recompensas:
 *   - Cliente: catálogo del negocio activo, canjear y ver sus canjes.
 *   - Panel:   alta, edición, estado, baja e historial de canjes.
 *   - Caja:    buscar un canje por su código, validarlo (entregar) y ver pendientes.
 *
 * Un canje descuenta puntos del SALDO disponible y NUNCA de los puntos del
 * período: canjear no baja el nivel ni la posición en el ranking.
 *
 * Actualmente utiliza el servidor simulado; cuando exista el backend se
 * reemplazará por llamadas HTTP sin modificar los componentes.
 *
 * Endpoints previstos:
 *   GET    /me/businesses/:id/rewards            → [reward] visibles
 *   POST   /rewards/:id/redeem                   → { redemption, movement, membership, businessName }
 *   GET    /me/businesses/:id/redemptions        → [redemption]
 *   GET    /admin/rewards                        → [reward + estadísticas]
 *   POST   /admin/rewards  |  PUT /admin/rewards/:id   (?notify=true|false)
 *   PATCH  /admin/rewards/:id/status { status }
 *   DELETE /admin/rewards/:id
 *   GET    /admin/redemptions                    → historial
 *   GET    /staff/redemptions/:code              → canje
 *   POST   /staff/redemptions/:code/validate     → canje entregado
 *   GET    /staff/redemptions?status=pendiente   → [canje]
 */
import { http } from './http.js';
import { send } from './request.js';
import { session } from './session.js';

const mocks = () => import('../mocks/api/rewards.js').then((m) => m.rewardsApi);

export const rewardService = {
  /* ---------- Cliente ---------- */

  getCatalog: () => send({
    mock: async () => (await mocks()).catalog(),
    api: () => http.get(`/me/businesses/${session.businessId()}/rewards`),
  }),

  /** Canjea una recompensa: genera el código que valida el local. */
  redeem: (rewardId) => send({
    mock: async () => (await mocks()).redeem(rewardId),
    api: () => http.post(`/rewards/${rewardId}/redeem`),
    write: true, ms: 600,
  }),

  /** Canjes del cliente en el negocio activo (marca como vencidos los que pasaron su plazo). */
  getMyRedemptions: () => send({
    mock: async () => (await mocks()).myRedemptions(),
    api: () => http.get(`/me/businesses/${session.businessId()}/redemptions`),
    write: true,
  }),

  /* ---------- Panel ---------- */

  list: () => send({
    mock: async () => (await mocks()).list(),
    api: () => http.get('/admin/rewards'),
  }),

  /** Crea (sin id) o edita (con id). notify = avisar a los clientes si queda disponible. */
  save: (data, { notify = true } = {}) => send({
    mock: async () => (await mocks()).save(data, { notify }),
    api: () => (data.id
      ? http.put(`/admin/rewards/${data.id}?notify=${notify}`, data)
      : http.post(`/admin/rewards?notify=${notify}`, data)),
    write: true,
  }),

  setStatus: (id, status) => send({
    mock: async () => (await mocks()).setStatus(id, status),
    api: () => http.patch(`/admin/rewards/${id}/status`, { status }),
    write: true,
  }),

  /** Baja definitiva. Si ya tiene canjes, el servidor pide finalizarla para conservar el historial. */
  remove: (id) => send({
    mock: async () => (await mocks()).remove(id),
    api: () => http.del(`/admin/rewards/${id}`),
    write: true,
  }),

  getHistory: () => send({
    mock: async () => (await mocks()).history(),
    api: () => http.get('/admin/redemptions'),
    write: true,
  }),

  /* ---------- Caja ---------- */

  findRedemption: (code) => send({
    mock: async () => (await mocks()).findByCode(code),
    api: () => http.get(`/staff/redemptions/${encodeURIComponent(code)}`),
    write: true,
  }),

  /** Marca el canje como entregado y registra quién lo validó. */
  validateRedemption: (code) => send({
    mock: async () => (await mocks()).validate(code),
    api: () => http.post(`/staff/redemptions/${encodeURIComponent(code)}/validate`),
    write: true,
  }),

  getPending: () => send({
    mock: async () => (await mocks()).pending(),
    api: () => http.get('/staff/redemptions?status=pendiente'),
    write: true, ms: 200,
  }),
};
