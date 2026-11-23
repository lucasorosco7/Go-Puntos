/**
 * Servicio del ranking mensual de GO Puntos.
 *
 * El ranking ordena a los clientes por los PUNTOS DEL PERÍODO (sólo compras).
 * Canjear no baja la posición y los premios o ajustes no la suben.
 *
 * Cierre del mes: guarda el ranking y el nivel ganado de cada cliente en el
 * historial, entrega el premio al ganador (al saldo) y empieza un período
 * nuevo con los puntos del período en cero. El SALDO nunca se reinicia.
 *
 * Endpoints previstos:
 *   GET  /me/businesses/:id/ranking   → { enabled, top, me, prize, history, period }
 *   GET  /admin/ranking               → { list, closes, levels, rewards, periodEnded, ... }
 *   POST /admin/periods/close         → resultado del cierre
 *
 * En producción el cierre lo ejecutará el servidor automáticamente el día 1;
 * la acción del panel queda para cierres manuales.
 */
import { http } from './http.js';
import { send } from './request.js';
import { session } from './session.js';

const mocks = () => import('../mocks/api/ranking.js').then((m) => m.rankingApi);

export const rankingService = {
  getForCustomer: () => send({
    mock: async () => (await mocks()).forCustomer(),
    api: () => http.get(`/me/businesses/${session.businessId()}/ranking`),
  }),

  getForBusiness: () => send({
    mock: async () => (await mocks()).forBusiness(),
    api: () => http.get('/admin/ranking'),
  }),

  closePeriod: () => send({
    mock: async () => (await mocks()).closePeriod(),
    api: () => http.post('/admin/periods/close'),
    write: true, ms: 700,
  }),
};
