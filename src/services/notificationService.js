/**
 * Servicio de notificaciones de GO Puntos (campana del cliente).
 *
 * Devuelve las notificaciones del negocio activo más los avisos generales de
 * la cuenta. Las genera siempre el servidor (compras, canjes, rachas,
 * desafíos, cambios de nivel, ranking, ofertas, recompensas y campañas).
 *
 * Endpoints previstos:
 *   GET   /me/notifications?businessId=        → [notification]
 *   GET   /me/notifications/unread-count       → { count }
 *   PATCH /me/notifications/:id { read, popupShown }
 *   POST  /me/notifications/read-all
 */
import { http, qs } from './http.js';
import { send } from './request.js';
import { session } from './session.js';

const mocks = () => import('../mocks/api/notifications.js').then((m) => m.notificationsApi);

export const notificationService = {
  getAll: () => send({
    mock: async () => (await mocks()).list(),
    api: () => http.get(`/me/notifications${qs({ businessId: session.businessId() })}`),
    ms: 200,
  }),

  unreadCount: () => send({
    mock: async () => (await mocks()).unreadCount(),
    api: () => http.get(`/me/notifications/unread-count${qs({ businessId: session.businessId() })}`),
    ms: 0,
  }),

  markRead: (id) => send({
    mock: async () => (await mocks()).update(id, { read: true }),
    api: () => http.patch(`/me/notifications/${id}`, { read: true }),
    write: true, ms: 0,
  }),

  /** Marca que el aviso de celebración ya se mostró (para no repetirlo). */
  markPopupShown: (id) => send({
    mock: async () => (await mocks()).update(id, { popupShown: true }),
    api: () => http.patch(`/me/notifications/${id}`, { popupShown: true }),
    write: true, ms: 0,
  }),

  markAllRead: () => send({
    mock: async () => (await mocks()).markAllRead(),
    api: () => http.post(`/me/notifications/read-all${qs({ businessId: session.businessId() })}`),
    write: true, ms: 150,
  }),
};
