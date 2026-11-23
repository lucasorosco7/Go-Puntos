/**
 * Handlers simulados de clientes.
 *
 * Lado cliente (app):    GET /me/memberships, POST /me/memberships, GET /me/businesses/:id/dashboard,
 *                        GET /me/businesses/:id/movements, GET /me/movements, GET /me/businesses/:id/profile
 * Lado negocio (panel):  GET /admin/customers, GET /admin/customers/:id, POST /admin/customers/:id/adjust
 * Caja:                  GET /staff/customers?q=, GET /staff/customers/by-code/:code, GET /staff/customers/:id
 *
 * Todos devuelven datos ya listos para mostrar (nivel vigente, racha,
 * progreso de desafíos), igual que deberá hacerlo la API.
 */
import { challenges as Challenges } from '../../domain/challenges.js';
import { notificationTypes as NotificationTypes } from '../../domain/notifications.js';
import { offers as Offers } from '../../domain/offers.js';
import { ranking as Ranking } from '../../domain/ranking.js';
import { rewards as Rewards } from '../../domain/rewards.js';
import { streaks as Streaks } from '../../domain/streaks.js';
import { normalize, sum } from '../../utils/helpers.js';
import { activeMembership, admin, me, publicUser, staff } from './common.js';

/** Desafíos vigentes del negocio con el progreso del cliente (primero los pendientes). */
export function challengesFor(s, S, m, now = new Date()) {
  const b = S.business(s, m.businessId);
  if (!b.challengesEnabled) return [];
  const mv = S.movementsOf(s, m.id);
  return s.challenges
    .filter((c) => c.businessId === b.id && Challenges.isLive(c, now))
    .map((c) => {
      const completion = s.challengeCompletions.find((x) => x.challengeId === c.id && x.membershipId === m.id) || null;
      return { ...c, progress: Challenges.progress(c, mv, completion), completedAt: completion?.completedAt || null };
    })
    .sort((a, c) => Number(a.progress.done) - Number(c.progress.done) || c.progress.pct - a.progress.pct);
}

const byDateDesc = (a, b) => new Date(b.date) - new Date(a.date) || b.id - a.id;

/** Fila del listado de clientes del panel. */
function customerRow(s, S, m, rankingList, now) {
  const u = S.user(s, m.userId);
  const ins = S.insights(s, m, now);
  return {
    membershipId: m.id, userId: u.id, name: `${u.firstName} ${u.lastName}`, firstName: u.firstName, lastName: u.lastName,
    email: u.email, phone: u.phone, code: m.code, joinedAt: m.joinedAt,
    level: ins.levelInfo.level, balance: m.balance, periodPoints: m.periodPoints, lifetimePoints: m.lifetimePoints,
    purchasesCount: m.purchasesCount, lastPurchaseAt: m.lastPurchaseAt,
    position: rankingList.find((r) => r.membershipId === m.id)?.position || null,
    status: ins.status, segments: ins.segments, streak: ins.streak.weeks, purchases30: ins.purchases30,
  };
}

/** Tarjeta del cliente para la Caja. */
function cashierCard(s, S, m, now = new Date()) {
  return {
    membership: m, user: publicUser(S.user(s, m.userId)), levelInfo: S.levelStatus(s, m),
    offers: S.pointOffersFor(s, m, now),
    pendingRedemptions: s.redemptions.filter((r) => r.membershipId === m.id && Rewards.redemptionStatus(r, now) === 'pendiente'),
    streak: Streaks.compute(S.purchaseDates(s, m.id), now),
    rule: S.business(s, m.businessId).pointsRule,
  };
}

export const customersApi = {
  /* ===================== App del cliente ===================== */

  /** Negocios en los que participa la cuenta. */
  memberships: () => (s, S, ctx) => {
    const user = me(s, ctx);
    return s.memberships.filter((m) => m.userId === user.id).map((m) => ({
      membership: m, business: S.business(s, m.businessId), levelInfo: S.levelStatus(s, m),
    }));
  },

  /** Negocios activos para sumarse (en producción se llega por el QR del local). */
  discoverable: () => (s) => s.businesses.filter((b) => b.status === 'activo'),

  /** Sumarse a un negocio con la misma cuenta. */
  join: (slug) => (s, S, ctx) => {
    const user = me(s, ctx);
    const b = S.businessBySlug(s, slug);
    if (!b) throw new S.ServerError('Ese código QR no corresponde a ningún negocio.', 404);
    const result = S.joinBusiness(s, { userId: user.id, businessId: b.id, date: new Date() });
    return { ...result, business: b };
  },

  /** Resumen de "Mis puntos" del negocio activo. También dispara los avisos que dependen del tiempo. */
  dashboard: () => (s, S, ctx) => {
    const now = new Date();
    const { user, m, business } = activeMembership(s, S, ctx);
    S.onClientOpen(s, m.id, now); // racha en riesgo, canjes vencidos
    const levelInfo = S.levelStatus(s, m);
    const movements = S.movementsOf(s, m.id).sort(byDateDesc);
    const notifications = s.notifications.filter((n) => n.userId === user.id && (n.businessId === business.id || n.businessId === null));
    const popup = notifications
      .filter((n) => !n.popupShown && NotificationTypes.celebrate.includes(n.type))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0] || null;
    const rankingInfo = business.ranking.enabled
      ? { enabled: true, me: Ranking.topAndMe(S.rankingOf(s, business.id), m.id).me }
      : { enabled: false, me: null };
    return {
      user: publicUser(user), business, membership: m, levels: S.levelsOf(s, business.id), levelInfo,
      movements: movements.slice(0, 4), movementsCount: movements.length,
      rewards: s.rewards.filter((r) => r.businessId === business.id && Rewards.isVisible(r, now)),
      offers: s.offers.filter((o) => o.businessId === business.id && Offers.isLive(o, now) && Offers.isEligible(o, levelInfo.level.id)),
      streak: Streaks.compute(S.purchaseDates(s, m.id), now),
      challenges: challengesFor(s, S, m, now),
      ranking: { ...rankingInfo, period: business.currentPeriod },
      unread: notifications.filter((n) => !n.read).length,
      popup,
    };
  },

  /** Historial. scope 'active' = negocio activo, 'all' = todos los negocios de la cuenta. */
  movements: (scope = 'active') => (s, S, ctx) => {
    const { user, m } = activeMembership(s, S, ctx);
    const names = Object.fromEntries(s.businesses.map((b) => [b.id, b.name]));
    return s.movements
      .filter((x) => (scope === 'all' ? x.userId === user.id : x.membershipId === m.id))
      .map((x) => ({ ...x, businessName: names[x.businessId] }))
      .sort(byDateDesc);
  },

  /** Perfil: nivel, racha, desafíos y negocios de la cuenta. */
  profile: () => (s, S, ctx) => {
    const now = new Date();
    const { user, m, business } = activeMembership(s, S, ctx);
    return {
      user: publicUser(user), business, membership: m,
      levels: S.levelsOf(s, business.id), levelInfo: S.levelStatus(s, m),
      streak: Streaks.compute(S.purchaseDates(s, m.id), now),
      challenges: challengesFor(s, S, m, now),
      completedCount: s.challengeCompletions.filter((c) => c.membershipId === m.id).length,
      memberships: s.memberships.filter((x) => x.userId === user.id).map((x) => ({
        membership: x, business: S.business(s, x.businessId), levelInfo: S.levelStatus(s, x),
      })),
    };
  },

  /* ===================== Caja (dueño, administrador o empleado) ===================== */

  search: (query) => (s, S, ctx) => {
    const { business: b } = staff(s, S, ctx);
    const q = normalize(query).trim();
    return s.memberships.filter((m) => m.businessId === b.id).map((m) => ({ m, u: S.user(s, m.userId) }))
      .filter(({ m, u }) => !q || normalize(`${u.firstName} ${u.lastName} ${u.email} ${u.phone} ${m.code}`).includes(q))
      .sort((a, c) => new Date(c.m.lastPurchaseAt || 0) - new Date(a.m.lastPurchaseAt || 0))
      .slice(0, 8)
      .map(({ m, u }) => ({ membership: m, user: publicUser(u), level: S.levelStatus(s, m).level }));
  },

  /** Lectura del QR personal: el QR contiene el código del cliente en ESE negocio. */
  findByCode: (code) => (s, S, ctx) => {
    const { business: b } = staff(s, S, ctx);
    const clean = String(code || '').trim().toUpperCase().replace(/^GOPUNTOS:/, '');
    const m = s.memberships.find((x) => x.code === clean);
    if (!m) throw new S.ServerError('No encontramos ningún cliente con ese código.', 404);
    if (m.businessId !== b.id) throw new S.ServerError('Ese QR es de otro negocio. Pedile al cliente que abra el código de este local.', 409);
    return cashierCard(s, S, m);
  },

  cashierCard: (membershipId) => (s, S, ctx) => {
    const { business: b } = staff(s, S, ctx);
    const m = S.membership(s, membershipId);
    if (m.businessId !== b.id) throw new S.ServerError('Ese cliente no pertenece a este negocio.', 403);
    return cashierCard(s, S, m);
  },

  /* ===================== Panel (dueño o administrador) ===================== */

  list: () => (s, S, ctx) => {
    const now = new Date();
    const { business: b } = admin(s, S, ctx);
    const rankingList = S.rankingOf(s, b.id);
    return {
      levels: S.levelsOf(s, b.id), period: b.currentPeriod,
      rows: s.memberships.filter((m) => m.businessId === b.id).map((m) => customerRow(s, S, m, rankingList, now)),
    };
  },

  detail: (membershipId) => (s, S, ctx) => {
    const now = new Date();
    const { business: b } = admin(s, S, ctx);
    const m = S.membership(s, membershipId);
    if (m.businessId !== b.id) throw new S.ServerError('Ese cliente no pertenece a tu negocio.', 403);
    const rankingList = S.rankingOf(s, b.id);
    const movements = S.movementsOf(s, m.id).sort(byDateDesc);
    const purchases = movements.filter((x) => x.type === 'compra');
    const spent = sum(purchases, (x) => x.amount || 0);
    return {
      business: b, levels: S.levelsOf(s, b.id),
      row: customerRow(s, S, m, rankingList, now), membership: m, user: publicUser(S.user(s, m.userId)),
      levelInfo: S.levelStatus(s, m), streak: Streaks.compute(S.purchaseDates(s, m.id), now),
      movements,
      redemptions: s.redemptions.filter((r) => r.membershipId === m.id).sort((a, c) => new Date(c.createdAt) - new Date(a.createdAt)),
      challenges: s.challenges.filter((c) => c.businessId === b.id && (Challenges.isLive(c, now)
        || s.challengeCompletions.some((x) => x.challengeId === c.id && x.membershipId === m.id)))
        .map((c) => {
          const completion = s.challengeCompletions.find((x) => x.challengeId === c.id && x.membershipId === m.id);
          return { ...c, progress: Challenges.progress(c, movements, completion), completedAt: completion?.completedAt || null };
        }),
      stats: { spent, avgTicket: purchases.length ? Math.round(spent / purchases.length) : 0, rankingTotal: rankingList.length },
      otherBusinesses: s.memberships.filter((x) => x.userId === m.userId && x.businessId !== b.id).length,
    };
  },

  /** Ajuste manual: corrige el SALDO; no cuenta para nivel ni ranking. */
  adjust: (membershipId, { points, reason }) => (s, S, ctx) => {
    const { user, business: b } = admin(s, S, ctx);
    const m = S.membership(s, membershipId);
    if (m.businessId !== b.id) throw new S.ServerError('Ese cliente no pertenece a tu negocio.', 403);
    return S.adjustPoints(s, { membershipId, points, reason, staffUserId: user.id, date: new Date() });
  },
};
