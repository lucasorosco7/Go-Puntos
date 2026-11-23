/**
 * Handlers simulados de recompensas y canjes.
 *
 * Cliente:  GET /me/businesses/:id/rewards, POST /rewards/:id/redeem, GET /me/businesses/:id/redemptions
 * Panel:    CRUD /admin/rewards, PATCH /admin/rewards/:id/status, GET /admin/redemptions
 * Caja:     GET /staff/redemptions/:code, POST /staff/redemptions/:code/validate, GET /staff/redemptions?status=pendiente
 *
 * Un canje descuenta del SALDO y nunca de los puntos del período.
 */
import { rewards as Rewards } from '../../domain/rewards.js';
import { activeMembership, admin, publicUser, staff } from './common.js';

/** Recompensa con sus estadísticas de canje (panel). */
const rewardView = (s, r) => {
  const reds = s.redemptions.filter((x) => x.rewardId === r.id && x.source === 'canje');
  return { ...r, redemptionsCount: reds.length, pendingCount: reds.filter((x) => x.status === 'pendiente').length };
};

/** Canje con los datos del cliente (Caja). */
function redemptionView(s, S, r) {
  const m = S.membership(s, r.membershipId);
  return { ...r, effectiveStatus: Rewards.redemptionStatus(r), customer: publicUser(S.user(s, m.userId)), membershipCode: m.code };
}

export function validateDates(S, start, end) {
  if (start && end && new Date(end) < new Date(start)) {
    throw new S.ServerError('La fecha de fin tiene que ser posterior a la de inicio.', 422, { field: 'endDate' });
  }
}

export const rewardsApi = {
  /* ---------- Cliente ---------- */

  /** Catálogo visible del negocio que el cliente está mirando. */
  catalog: () => (s, S, ctx) => {
    const { business } = activeMembership(s, S, ctx);
    return s.rewards.filter((r) => r.businessId === business.id && Rewards.isVisible(r));
  },

  redeem: (rewardId) => (s, S, ctx) => {
    const { m, business } = activeMembership(s, S, ctx);
    const result = S.redeem(s, { membershipId: m.id, rewardId, date: new Date() });
    return { ...result, businessName: business.name };
  },

  myRedemptions: () => (s, S, ctx) => {
    const { m } = activeMembership(s, S, ctx);
    S.expireRedemptions(s, new Date());
    return s.redemptions.filter((r) => r.membershipId === m.id).sort((a, c) => new Date(c.createdAt) - new Date(a.createdAt));
  },

  /* ---------- Panel (dueño o administrador) ---------- */

  list: () => (s, S, ctx) => {
    const { business: b } = admin(s, S, ctx);
    return s.rewards.filter((r) => r.businessId === b.id).map((r) => rewardView(s, r));
  },

  /** Crea o edita. Si la recompensa pasa a estar disponible, avisa a los clientes (notify). */
  save: (data, { notify = true } = {}) => (s, S, ctx) => {
    const { business: b } = admin(s, S, ctx);
    if (!String(data.name || '').trim()) throw new S.ServerError('Poné un nombre a la recompensa.', 422, { field: 'name' });
    if (!(Number(data.points) > 0)) throw new S.ServerError('El costo en puntos tiene que ser mayor a cero.', 422, { field: 'points' });
    validateDates(S, data.validFrom, data.validTo);
    const clean = {
      name: data.name.trim(), description: (data.description || '').trim(), category: data.category || 'general',
      points: Math.round(Number(data.points)),
      stock: data.stock === '' || data.stock === null || data.stock === undefined ? null : Math.max(0, Math.round(Number(data.stock))),
      image: data.image || null, validFrom: data.validFrom || null, validTo: data.validTo || null,
      status: data.status || 'activa', featured: Boolean(data.featured),
    };
    let r = data.id && s.rewards.find((x) => x.id === Number(data.id) && x.businessId === b.id);
    const wasAvailable = r && Rewards.isAvailable(r);
    if (r) Object.assign(r, clean);
    else { r = { id: S.nextId(s, 'rewards'), businessId: b.id, createdAt: new Date().toISOString(), ...clean }; s.rewards.push(r); }
    const notified = notify && !wasAvailable ? S.announceReward(s, r, new Date()) : 0;
    return { reward: rewardView(s, r), notified };
  },

  setStatus: (id, status) => (s, S, ctx) => {
    const { business: b } = admin(s, S, ctx);
    const r = s.rewards.find((x) => x.id === id && x.businessId === b.id);
    if (!r) throw new S.ServerError('No encontramos la recompensa.', 404);
    r.status = status;
    const notified = status === 'activa' ? S.announceReward(s, r, new Date()) : 0;
    return { reward: rewardView(s, r), notified };
  },

  /** Sólo se elimina si nunca se canjeó; si no, se finaliza para conservar el historial. */
  remove: (id) => (s, S, ctx) => {
    const { business: b } = admin(s, S, ctx);
    if (s.redemptions.some((r) => r.rewardId === id)) throw new S.ServerError('Esta recompensa ya tiene canjes: finalizala para conservar el historial.', 409);
    s.rewards = s.rewards.filter((r) => !(r.id === id && r.businessId === b.id));
    return true;
  },

  /** Historial completo de canjes del negocio. */
  history: () => (s, S, ctx) => {
    const { business: b } = admin(s, S, ctx);
    S.expireRedemptions(s, new Date());
    return s.redemptions.filter((r) => r.businessId === b.id).sort((a, c) => new Date(c.createdAt) - new Date(a.createdAt))
      .map((r) => {
        const m = S.membership(s, r.membershipId);
        const u = S.user(s, m.userId);
        return { ...r, customer: `${u.firstName} ${u.lastName}`, membershipCode: m.code };
      });
  },

  /* ---------- Caja ---------- */

  findByCode: (code) => (s, S, ctx) => {
    const { business: b } = staff(s, S, ctx);
    S.expireRedemptions(s, new Date());
    const r = S.findRedemption(s, b.id, code);
    if (!r) throw new S.ServerError('No encontramos un canje con ese código en este negocio.', 404);
    return redemptionView(s, S, r);
  },

  /** Entrega la recompensa: queda registrado quién la validó y cuándo. */
  validate: (code) => (s, S, ctx) => {
    const { user, business: b } = staff(s, S, ctx);
    return redemptionView(s, S, S.validateRedemption(s, { businessId: b.id, code, staffUserId: user.id, date: new Date() }));
  },

  pending: () => (s, S, ctx) => {
    const { business: b } = staff(s, S, ctx);
    S.expireRedemptions(s, new Date());
    return s.redemptions.filter((r) => r.businessId === b.id && r.status === 'pendiente')
      .sort((a, c) => new Date(c.createdAt) - new Date(a.createdAt)).map((r) => redemptionView(s, S, r));
  },
};
