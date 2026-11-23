/**
 * Servicio de la plataforma (Superadmin) de GO Puntos.
 *
 * Responsabilidad: administración global de GO Puntos. Invitaciones para
 * registrar negocios, revisión de solicitudes, estado de los negocios
 * (suspender, bloquear, reactivar) y auditoría de la plataforma.
 * No da acceso a los paneles de los negocios.
 *
 * Tablas de go_puntos_v2 que usará el backend:
 *   administradores_plataforma · invitaciones_registro · solicitudes_negocio · auditoria_plataforma
 *   (más negocios, usuarios y usuarios_negocios para los listados)
 *
 * Endpoints previstos (todos exigen una fila activa en administradores_plataforma,
 * salvo la validación pública del enlace):
 *   GET  /platform/dashboard                         → { kpis, byStatus, toReview, recent }
 *   GET  /platform/invitations                       → [invitación]
 *   POST /platform/invitations     { email?, days }  → { invitation, token }  (el token se muestra una sola vez)
 *   POST /platform/invitations/:id/revoke            → invitación
 *   GET  /public/invitations/:token                  → { valid, email?, expiresAt? } | { valid:false, reason }
 *   GET  /platform/requests                          → [solicitud]
 *   POST /platform/requests/:id/approve  { reason? } → solicitud
 *   POST /platform/requests/:id/reject   { reason }  → solicitud
 *   GET  /platform/businesses                        → [negocio]
 *   GET  /platform/businesses/:id                    → negocio con solicitud, equipo, estadísticas e historial
 *   POST /platform/businesses/:id/status { action, reason } → negocio  (action: suspender | bloquear | reactivar)
 *   GET  /platform/audit                             → [registro]
 */
import { http } from './http.js';
import { send } from './request.js';

const mocks = () => import('../mocks/api/platform.js').then((m) => m.platformApi);

export const platformService = {
  getDashboard: () => send({
    mock: async () => (await mocks()).dashboard(),
    api: () => http.get('/platform/dashboard'),
  }),

  /* ---------- Invitaciones ---------- */
  listInvitations: () => send({
    mock: async () => (await mocks()).invitations(),
    api: () => http.get('/platform/invitations'),
  }),
  /** data: { email (opcional), days }. Devuelve { invitation, token }. */
  createInvitation: (data) => send({
    mock: async () => (await mocks()).createInvitation(data),
    api: () => http.post('/platform/invitations', data),
    write: true,
  }),
  revokeInvitation: (id) => send({
    mock: async () => (await mocks()).revokeInvitation(id),
    api: () => http.post(`/platform/invitations/${id}/revoke`),
    write: true,
  }),
  /** Pública: valida el enlace antes de mostrar el formulario de registro. */
  validateInvitation: (token) => send({
    mock: async () => (await mocks()).validateInvitation(token),
    api: () => http.get(`/public/invitations/${encodeURIComponent(token)}`),
    ms: 250,
  }),

  /* ---------- Solicitudes ---------- */
  listRequests: () => send({
    mock: async () => (await mocks()).requests(),
    api: () => http.get('/platform/requests'),
  }),
  approveRequest: (id, data = {}) => send({
    mock: async () => (await mocks()).approveRequest(id, data),
    api: () => http.post(`/platform/requests/${id}/approve`, data),
    write: true,
  }),
  rejectRequest: (id, data) => send({
    mock: async () => (await mocks()).rejectRequest(id, data),
    api: () => http.post(`/platform/requests/${id}/reject`, data),
    write: true,
  }),

  /* ---------- Negocios ---------- */
  listBusinesses: () => send({
    mock: async () => (await mocks()).businesses(),
    api: () => http.get('/platform/businesses'),
  }),
  getBusiness: (id) => send({
    mock: async () => (await mocks()).business(id),
    api: () => http.get(`/platform/businesses/${id}`),
  }),
  /** action: 'suspender' | 'bloquear' | 'reactivar' · reason obligatorio para suspender y bloquear. */
  changeBusinessStatus: (id, data) => send({
    mock: async () => (await mocks()).changeStatus(id, data),
    api: () => http.post(`/platform/businesses/${id}/status`, data),
    write: true,
  }),

  /* ---------- Auditoría ---------- */
  listAudit: () => send({
    mock: async () => (await mocks()).audit(),
    api: () => http.get('/platform/audit'),
  }),
};
