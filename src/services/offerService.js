/**
 * Servicio de ofertas de GO Puntos.
 *
 * Tipos de oferta (ver src/domain/offers.js): descuento porcentual, descuento
 * fijo, puntos dobles, puntos extra, beneficio exclusivo por nivel y
 * promoción temporal. Las de puntos (dobles / extra) se aplican en la Caja al
 * registrar la compra, en el paso "promociones" del cálculo.
 *
 * Endpoints previstos:
 *   GET    /me/businesses/:id/offers         → { business, level, offers (con eligible y levelNames) }
 *   GET    /admin/offers                     → { levels, offers }
 *   POST   /admin/offers  |  PUT /admin/offers/:id   (?notify=true|false) → { offer, notified }
 *   PATCH  /admin/offers/:id/status { status }                         → { offer, notified }
 *   DELETE /admin/offers/:id
 */
import { http } from './http.js';
import { send } from './request.js';
import { session } from './session.js';

const mocks = () => import('../mocks/api/offers.js').then((m) => m.offersApi);

export const offerService = {
  /** Ofertas vigentes del negocio activo. Las exclusivas de otro nivel llegan con eligible = false. */
  getForCustomer: () => send({
    mock: async () => (await mocks()).forCustomer(),
    api: () => http.get(`/me/businesses/${session.businessId()}/offers`),
  }),

  list: () => send({
    mock: async () => (await mocks()).list(),
    api: () => http.get('/admin/offers'),
  }),

  /** Crea o edita. Al quedar activa avisa a los clientes que pueden usarla (salvo notify = false). */
  save: (data, { notify = true } = {}) => send({
    mock: async () => (await mocks()).save(data, { notify }),
    api: () => (data.id
      ? http.put(`/admin/offers/${data.id}?notify=${notify}`, data)
      : http.post(`/admin/offers?notify=${notify}`, data)),
    write: true,
  }),

  setStatus: (id, status, { notify = true } = {}) => send({
    mock: async () => (await mocks()).setStatus(id, status, { notify }),
    api: () => http.patch(`/admin/offers/${id}/status?notify=${notify}`, { status }),
    write: true,
  }),

  remove: (id) => send({
    mock: async () => (await mocks()).remove(id),
    api: () => http.del(`/admin/offers/${id}`),
    write: true,
  }),
};
