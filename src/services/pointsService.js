/**
 * Servicio de puntos de GO Puntos (registro de compras en la Caja).
 *
 * El cálculo de puntos SIEMPRE lo hace el servidor con las reglas de
 * src/domain/points.js (importe → base → nivel vigente → promociones →
 * redondeo final). La interfaz sólo muestra la cotización que recibe: así el
 * resultado no se puede manipular desde el navegador.
 *
 * Endpoints previstos:
 *   POST /staff/purchases/quote { membershipId, amount, offerIds }        → cotización sin guardar
 *   POST /staff/purchases       { membershipId, amount, offerIds, note }  → { movement, quote, events, card }
 */
import { http } from './http.js';
import { send } from './request.js';

const mocks = () => import('../mocks/api/points.js').then((m) => m.pointsApi);

export const pointsService = {
  /** Calcula cuántos puntos daría la compra, paso por paso, sin registrarla. */
  quote: (data) => send({
    mock: async () => (await mocks()).quote(data),
    api: () => http.post('/staff/purchases/quote', data),
    ms: 0,
  }),

  /**
   * Registra la compra: suma al saldo y a los puntos del período, actualiza
   * racha y desafíos, y devuelve los eventos ocurridos (desafío cumplido,
   * nivel alcanzado para el mes siguiente, etc.) más la tarjeta actualizada.
   */
  registerPurchase: (data) => send({
    mock: async () => (await mocks()).register(data),
    api: () => http.post('/staff/purchases', data),
    write: true, ms: 500,
  }),
};
