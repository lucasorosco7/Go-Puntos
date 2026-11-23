/**
 * Servicio de desafíos (y resumen de rachas del panel) de GO Puntos.
 *
 * El progreso de cada cliente se calcula con src/domain/challenges.js a
 * partir de sus movimientos. El premio de un desafío suma al SALDO, nunca a
 * los puntos del período.
 *
 * Endpoints previstos:
 *   GET    /admin/challenges                 → { business, challenges, streakStats }
 *   POST   /admin/challenges  |  PUT /admin/challenges/:id
 *   PATCH  /admin/challenges/:id/status { status }
 *   DELETE /admin/challenges/:id
 * (El cliente recibe sus desafíos dentro de dashboard y perfil: customerService.)
 */
import { http } from './http.js';
import { send } from './request.js';

const mocks = () => import('../mocks/api/challenges.js').then((m) => m.challengesApi);

export const challengeService = {
  list: () => send({
    mock: async () => (await mocks()).list(),
    api: () => http.get('/admin/challenges'),
  }),

  save: (data) => send({
    mock: async () => (await mocks()).save(data),
    api: () => (data.id ? http.put(`/admin/challenges/${data.id}`, data) : http.post('/admin/challenges', data)),
    write: true,
  }),

  setStatus: (id, status) => send({
    mock: async () => (await mocks()).setStatus(id, status),
    api: () => http.patch(`/admin/challenges/${id}/status`, { status }),
    write: true,
  }),

  /** Sólo si nadie lo completó; si no, el servidor pide finalizarlo para conservar el historial. */
  remove: (id) => send({
    mock: async () => (await mocks()).remove(id),
    api: () => http.del(`/admin/challenges/${id}`),
    write: true,
  }),
};
