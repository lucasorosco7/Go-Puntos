/**
 * Servicio de campañas de GO Puntos.
 *
 * Una campaña envía una notificación (y en el futuro un push) a un grupo de
 * clientes del negocio: todos, un nivel, un segmento (nuevos, frecuentes, VIP,
 * en riesgo, inactivos) o una selección manual. Puede promocionar una oferta.
 *
 * Endpoints previstos:
 *   GET  /admin/campaigns                       → { levels, offers, campaigns, customers }
 *   POST /admin/campaigns/preview { audience }  → { count, sample }
 *   POST /admin/campaigns         { ... }       → campaña enviada
 */
import { http } from './http.js';
import { send } from './request.js';

const mocks = () => import('../mocks/api/campaigns.js').then((m) => m.campaignsApi);

export const campaignService = {
  list: () => send({
    mock: async () => (await mocks()).list(),
    api: () => http.get('/admin/campaigns'),
  }),

  /** Cuántos clientes recibirían la campaña con la audiencia elegida. */
  previewAudience: (audience) => send({
    mock: async () => (await mocks()).preview(audience),
    api: () => http.post('/admin/campaigns/preview', { audience }),
    ms: 150,
  }),

  send: (data) => send({
    mock: async () => (await mocks()).send(data),
    api: () => http.post('/admin/campaigns', data),
    write: true, ms: 600,
  }),
};
