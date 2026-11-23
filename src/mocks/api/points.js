/**
 * Handlers simulados de puntos (Caja).
 * Equivalen a: POST /staff/purchases/quote (cálculo sin guardar) y POST /staff/purchases.
 *
 * El cálculo lo hace siempre el servidor con la regla de domain/points.js
 * (el frontend nunca decide cuántos puntos se acreditan).
 */
import { customersApi } from './customers.js';
import { staff } from './common.js';

export const pointsApi = {
  quote: ({ membershipId, amount, offerIds }) => (s, S, ctx) => {
    staff(s, S, ctx);
    return S.quotePurchase(s, { membershipId, amount, offerIds, date: new Date() });
  },

  /**
   * Registra una compra: suma al saldo disponible y a los puntos del período,
   * actualiza racha, desafíos, nivel asegurado y ranking, y devuelve los avisos
   * que recibió el cliente más su tarjeta actualizada.
   */
  register: ({ membershipId, amount, offerIds, note }) => (s, S, ctx) => {
    const { user, business: b } = staff(s, S, ctx);
    const result = S.registerPurchase(s, { businessId: b.id, membershipId, amount, offerIds, staffUserId: user.id, date: new Date(), note });
    return { movement: result.movement, quote: result.quote, events: result.events, card: customersApi.cashierCard(membershipId)(s, S, ctx) };
  },
};
