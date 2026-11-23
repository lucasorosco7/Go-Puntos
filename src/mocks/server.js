/**
 * Servidor simulado de GO Puntos (mock del backend).
 *
 * Contiene las operaciones que en producción hará la API: registrar una
 * compra, canjear, validar un canje, cerrar el mes, enviar campañas, generar
 * notificaciones automáticas, etc. Trabajan sobre un objeto "state" con
 * colecciones de datos de prueba (ver src/mocks/seed.js).
 *
 * IMPORTANTE
 * - Sólo lo usan los handlers de src/mocks/api cuando appConfig.useMocks = true.
 *   Ningún componente ni store lo importa: la frontera es la capa services.
 * - No es una base de datos: sus colecciones NO definen los nombres de las
 *   tablas definitivas. Cuando exista el backend, este archivo se elimina.
 * - Las funciones reciben la fecha (date) en lugar de leer el reloj: así el
 *   generador de datos de prueba puede reproducir meses de historia con
 *   exactamente las mismas reglas que usa la app.
 * - Las reglas de negocio NO están acá: se importan de src/domain.
 */
import { appConfig } from '../config/app.config.js';
import { BUSINESS_DEFAULTS } from '../config/catalogs.js';
import { APP_LINKS } from '../config/navigation.js';
import { DEFAULT_PALETTE } from '../theme/palettes.js';
import { dates as D } from '../utils/dates.js';
import { format } from '../utils/format.js';
import { clone, sum, groupBy, randomCode } from '../utils/helpers.js';
import { points as Points } from '../domain/points.js';
import { levels as Levels } from '../domain/levels.js';
import { streaks as Streaks } from '../domain/streaks.js';
import { challenges as Challenges } from '../domain/challenges.js';
import { segments as Segments } from '../domain/segments.js';
import { ranking as Ranking } from '../domain/ranking.js';
import { offers as Offers } from '../domain/offers.js';
import { rewards as Rewards } from '../domain/rewards.js';
import { notificationTypes as NotificationTypes } from '../domain/notifications.js';

const U = { clone, sum, groupBy, code: randomCode };

class ServerError extends Error {
  constructor(message, status = 400, details) { super(message); this.status = status; this.details = details; }
}

const iso = (d) => new Date(d).toISOString();
const S = { ServerError };

/* ======================= Acceso a las colecciones ======================= */
S.nextId = (s, table) => Math.max(0, ...s[table].map((r) => r.id)) + 1;
S.business = (s, id) => {
  const b = s.businesses.find((x) => x.id === Number(id));
  if (!b) throw new ServerError('No encontramos el negocio.', 404);
  return b;
};
S.businessBySlug = (s, slug) => s.businesses.find((b) => b.slug === slug) || null;
S.user = (s, id) => s.users.find((u) => u.id === Number(id)) || null;
S.membership = (s, id) => {
  const m = s.memberships.find((x) => x.id === Number(id));
  if (!m) throw new ServerError('No encontramos a ese cliente en el negocio.', 404);
  return m;
};
S.membershipOf = (s, userId, businessId) =>
  s.memberships.find((m) => m.userId === Number(userId) && m.businessId === Number(businessId)) || null;
S.levelsOf = (s, businessId) => Levels.sorted(s.levels.filter((l) => l.businessId === Number(businessId)));
S.movementsOf = (s, membershipId) => s.movements.filter((m) => m.membershipId === membershipId);
S.purchaseDates = (s, membershipId) => S.movementsOf(s, membershipId).filter((m) => m.type === 'compra').map((m) => m.date);

S.levelStatus = (s, m) => {
  const b = S.business(s, m.businessId);
  return Levels.status(S.levelsOf(s, b.id), m, b.currentPeriod);
};

S.rankingOf = (s, businessId) => Ranking.build(
  s.memberships.filter((m) => m.businessId === Number(businessId) && m.status !== 'bloqueado')
    .map((m) => ({ membership: m, user: S.user(s, m.userId) })),
);

S.positionOf = (s, m) => S.rankingOf(s, m.businessId).find((r) => r.membershipId === m.id)?.position || null;

/** Todo lo que se calcula de un cliente en un negocio (segmentos, racha, nivel) */
S.insights = (s, m, now = new Date()) => {
  const levelInfo = S.levelStatus(s, m);
  const purchases = S.purchaseDates(s, m.id);
  const seg = Segments.compute(m, purchases, levelInfo, now);
  return { levelInfo, ...seg, streak: Streaks.compute(purchases, now) };
};

/* ======================= Notificaciones ======================= */
S.notify = (s, { businessId = null, userId, type, title, body = '', link = '', source = 'auto', campaignId = null, date, dedupeKey = null }) => {
  if (businessId && source === 'auto' && NotificationTypes.configurable.includes(type)) {
    const b = S.business(s, businessId);
    if (b.notifications && b.notifications[type] === false) return null;
  }
  if (dedupeKey && s.notifications.some((n) => n.userId === userId && n.businessId === businessId && n.dedupeKey === dedupeKey)) return null;
  const n = {
    id: S.nextId(s, 'notifications'), businessId, userId, type, title, body, link, source, campaignId,
    createdAt: iso(date), read: false, popupShown: false, dedupeKey,
  };
  s.notifications.push(n);
  return n;
};

/* ======================= Movimientos ======================= */
/**
 * Único punto donde cambia el saldo. Reglas:
 * - balance (saldo disponible) suma y resta. Nunca se reinicia.
 * - periodPoints (puntos del mes) SOLO suma puntos de COMPRAS
 *   (Points.countsForPeriod). Bonificaciones, premios de desafíos,
 *   premios del ranking y ajustes suman únicamente al saldo.
 *   Un canje NUNCA resta puntos del mes.
 * El valor de countsForPeriod lo decide la regla del dominio según el
 * tipo: quien llama no puede forzarlo.
 */
S.addMovement = (s, { membership: m, type, concept, points, amount = null, date, detail = null, createdBy = null, refId = null }) => {
  const b = S.business(s, m.businessId);
  if (m.balance + points < 0) throw new ServerError('El saldo no alcanza para esta operación.', 409);
  m.balance += points;
  const counts = Points.countsForPeriod(type, points);
  if (counts) m.periodPoints += points;
  if (points > 0) m.lifetimePoints += points;
  const mv = {
    id: S.nextId(s, 'movements'), businessId: b.id, membershipId: m.id, userId: m.userId,
    date: iso(date), type, concept, amount, points, balanceAfter: m.balance,
    period: b.currentPeriod, countsForPeriod: counts, detail, createdBy, refId,
  };
  s.movements.push(mv);
  return mv;
};

/* ======================= Clientes y negocios ======================= */
S.joinBusiness = (s, { userId, businessId, date }) => {
  const b = S.business(s, businessId);
  const existing = S.membershipOf(s, userId, b.id);
  if (existing) return { membership: existing, created: false };
  if (b.status !== 'activo') throw new ServerError(`${b.name || 'Este negocio'} todavía no activó su programa de puntos.`, 409);
  const user = S.user(s, userId);
  const m = {
    id: S.nextId(s, 'memberships'), userId: user.id, businessId: b.id,
    code: `${b.codePrefix}-${String(user.id).padStart(6, '0')}`,
    joinedAt: iso(date), balance: 0, periodPoints: 0, lifetimePoints: 0, purchasesCount: 0,
    lastPurchaseAt: null, history: [], status: 'activo',
    // Nivel VIGENTE: un cliente nuevo arranca en el más bajo; cambia sólo en el cierre mensual
    levelId: Levels.base(S.levelsOf(s, b.id))?.id || null,
  };
  s.memberships.push(m);
  const bonus = b.pointsRule.welcomeBonus || 0;
  if (bonus > 0) S.addMovement(s, { membership: m, type: 'bonificacion', concept: 'Bono de bienvenida', points: bonus, date });
  S.notify(s, {
    businessId: b.id, userId: user.id, type: 'sistema', date, dedupeKey: 'bienvenida',
    title: `¡Te sumaste a ${b.name}!`,
    body: bonus ? `Ya tenés ${format.points(bonus)} puntos de bienvenida. Mostrá tu código en cada compra para sumar más.`
      : 'Mostrá tu código en cada compra para empezar a sumar puntos.',
    link: APP_LINKS.home,
  });
  return { membership: m, created: true };
};

S.slugify = (text) => String(text || 'negocio').normalize('NFD').replace(/[̀-ͯ]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'negocio';

S.uniqueSlug = (s, name, ignoreId = null) => {
  const base = S.slugify(name);
  let slug = base; let i = 2;
  while (s.businesses.some((b) => b.slug === slug && b.id !== ignoreId)) slug = `${base}-${i++}`;
  return slug;
};

S.uniquePrefix = (s, name, ignoreId = null) => {
  const words = S.slugify(name).split('-').filter(Boolean);
  let p = (words.length > 1 ? words.map((w) => w[0]).join('') : (words[0] || 'GO')).slice(0, 2).toUpperCase();
  if (p.length < 2) p = `${p}X`;
  let candidate = p; let i = 1;
  while (s.businesses.some((b) => b.codePrefix === candidate && b.id !== ignoreId)) candidate = `${p}${i++}`;
  return candidate;
};

/* ======================= Roles administrativos (business_staff) =======================
   users = identidad global. Los roles NO están en users: una misma cuenta
   puede ser cliente de varios negocios (memberships) y, a la vez, dueño,
   administrador o empleado de otros (businessStaff).
   role: 'owner' (dueño: todo, incluido transferir o cerrar el negocio)
         'admin' (todo el panel)   'empleado' (sólo Caja) */
S.STAFF_ROLES = { owner: 'Dueño', admin: 'Administrador', empleado: 'Empleado' };

S.addStaff = (s, { businessId, userId, role, date }) => {
  const existing = s.businessStaff.find((x) => x.businessId === Number(businessId) && x.userId === Number(userId));
  if (existing) { Object.assign(existing, { role, active: true }); return existing; }
  const row = { id: S.nextId(s, 'businessStaff'), businessId: Number(businessId), userId: Number(userId), role, active: true, createdAt: iso(date) };
  s.businessStaff.push(row);
  return row;
};

/** Roles activos de una persona en todos los negocios */
S.staffRolesOf = (s, userId) => s.businessStaff.filter((x) => x.userId === Number(userId) && x.active);

S.staffRow = (s, userId, businessId) =>
  s.businessStaff.find((x) => x.userId === Number(userId) && x.businessId === Number(businessId) && x.active) || null;

/** Para permisos del panel, el dueño tiene todo lo del administrador */
S.panelRole = (role) => (role === 'owner' ? 'admin' : role);

/** Negocio nuevo con la configuración por defecto (queda en borrador hasta activarlo) */
S.createBusiness = (s, { adminUserId, name, category = 'otro', date }) => {
  const d = BUSINESS_DEFAULTS;
  const id = S.nextId(s, 'businesses');
  const b = {
    id, slug: S.uniqueSlug(s, name), codePrefix: S.uniquePrefix(s, name), name: name || '', logo: null, logoIcon: 'store',
    description: '', category, address: '', city: '', phone: '', email: '', social: { instagram: '', facebook: '', whatsapp: '', website: '' },
    paletteId: DEFAULT_PALETTE.paletteId, paletteVariant: DEFAULT_PALETTE.variantId,
    pointsRule: U.clone(d.pointsRule), ranking: U.clone(d.ranking),
    monthlyPrize: U.clone(d.monthlyPrize), challengesEnabled: d.challengesEnabled, streaks: U.clone(d.streaks),
    notifications: U.clone(d.notifications), redemptionValidityDays: d.redemptionValidityDays,
    status: 'borrador', onboarding: { completed: false, dismissed: false, steps: {} },
    currentPeriod: D.periodOf(date), createdAt: iso(date),
  };
  s.businesses.push(b);
  d.levels.forEach((l, i) => s.levels.push({ id: S.nextId(s, 'levels'), businessId: id, order: i + 1, ...U.clone(l) }));
  // Quien crea el negocio queda como dueño (business_staff), con su misma cuenta
  if (adminUserId) S.addStaff(s, { businessId: id, userId: adminUserId, role: 'owner', date });
  return b;
};

/* ======================= Después de sumar puntos ======================= */
/**
 * Evalúa desafíos del cliente. Puede completar varios a la vez.
 * El premio suma sólo al SALDO (no a los puntos del mes), así que un
 * premio nunca completa otro desafío de puntos: alcanza con una pasada.
 */
S.evaluateChallenges = (s, m, date) => {
  const b = S.business(s, m.businessId);
  if (!b.challengesEnabled) return [];
  const done = [];
  {
    s.challenges.filter((c) => c.businessId === b.id && Challenges.isLive(c, new Date(date))).forEach((c) => {
      if (s.challengeCompletions.some((x) => x.challengeId === c.id && x.membershipId === m.id)) return;
      const p = Challenges.progress(c, S.movementsOf(s, m.id));
      if (p.value >= p.goal) {
        s.challengeCompletions.push({
          id: S.nextId(s, 'challengeCompletions'), challengeId: c.id, businessId: b.id,
          membershipId: m.id, userId: m.userId, completedAt: iso(date),
        });
        if (c.rewardPoints) {
          S.addMovement(s, { membership: m, type: 'desafio', concept: `Desafío completado: ${c.name}`, points: c.rewardPoints, date, refId: c.id });
        }
        S.notify(s, {
          businessId: b.id, userId: m.userId, type: 'desafio', date, dedupeKey: `desafio-ok:${c.id}`,
          title: `🎯 ¡Completaste "${c.name}"!`,
          body: c.rewardPoints ? `Sumaste ${format.points(c.rewardPoints)} puntos a tu saldo para canjear.` : (c.rewardText || 'Pasá por el local a retirar tu premio.'),
          link: APP_LINKS.profile,
        });
        done.push(c);
      } else if (p.missing === 1 && ['compras', 'visitas', 'semanas', 'compra_antes'].includes(c.type)) {
        S.notify(s, {
          businessId: b.id, userId: m.userId, type: 'desafio', date, dedupeKey: `desafio-casi:${c.id}`,
          title: '🎯 Te falta una compra para completar tu desafío',
          body: `"${c.name}": ${Challenges.rewardText(c)} al completarlo.`,
          link: APP_LINKS.profile,
        });
      }
    });
  }
  return done;
};

/** Nivel, cercanía y ranking después de cualquier movimiento que suma puntos del mes */
S.afterEarning = (s, m, before, date) => {
  const b = S.business(s, m.businessId);
  const levels = S.levelsOf(s, b.id);
  S.evaluateChallenges(s, m, date);

  // Los puntos del mes definen el nivel del MES SIGUIENTE: se avisa cuando lo asegura
  const after = S.levelStatus(s, m);
  const beforeEarned = levels.find((l) => l.id === before.earnedId);
  const nextMonth = format.period(D.nextPeriod(b.currentPeriod));
  if (beforeEarned && after.earned.minPoints > beforeEarned.minPoints) {
    S.notify(s, {
      businessId: b.id, userId: m.userId, type: 'nivel', date, dedupeKey: `nivel:${b.currentPeriod}:${after.earned.id}`,
      title: `🥇 ¡Aseguraste el nivel ${after.earned.name} para ${nextMonth}!`,
      body: after.earned.benefits?.length ? `En ${nextMonth} vas a tener: ${after.earned.benefits.join(' · ')}.` : 'Seguí sumando este mes para subir todavía más.',
      link: APP_LINKS.profile,
    });
  } else if (after.next && after.missing > 0 && after.missing <= after.next.minPoints * 0.15) {
    S.notify(s, {
      businessId: b.id, userId: m.userId, type: 'cercania', date, dedupeKey: `cerca:${b.currentPeriod}:${after.next.id}`,
      title: `⭐ Estás cerca del nivel ${after.next.name}`,
      body: `Te faltan ${format.points(after.missing)} puntos este mes para ser ${after.next.name} en ${nextMonth}.`,
      link: APP_LINKS.home,
    });
  }

  if (b.ranking.enabled) {
    const pos = S.positionOf(s, m);
    if (pos && pos <= (b.ranking.showTop || 5) && (!before.position || pos < before.position)) {
      S.notify(s, {
        businessId: b.id, userId: m.userId, type: 'ranking', date, dedupeKey: `rank:${b.currentPeriod}:${pos}`,
        title: `🏆 Subiste al puesto #${pos} del ranking`,
        body: `Llevás ${format.points(m.periodPoints)} puntos en ${format.period(b.currentPeriod)}.`,
        link: APP_LINKS.ranking,
      });
    }
  }
};

const snapshot = (s, m) => ({ earnedId: S.levelStatus(s, m).earned.id, position: S.positionOf(s, m) });

/* ======================= Compra ======================= */
/** Ofertas de puntos que aplican a este cliente hoy */
S.pointOffersFor = (s, m, date) => {
  const level = S.levelStatus(s, m).level;
  return s.offers.filter((o) => o.businessId === m.businessId && Offers.affectsPoints(o)
    && Offers.isLive(o, new Date(date)) && Offers.isEligible(o, level.id));
};

S.quotePurchase = (s, { membershipId, amount, offerIds, date }) => {
  const m = S.membership(s, membershipId);
  const b = S.business(s, m.businessId);
  const level = S.levelStatus(s, m).level;
  const applicable = S.pointOffersFor(s, m, date);
  // Sin selección explícita: sólo las que se aplican solas (las de puntos extra las marca el cajero)
  const offers = offerIds ? applicable.filter((o) => offerIds.includes(o.id)) : applicable.filter((o) => o.autoApply);
  return { ...Points.calculate({ amount: Number(amount), rule: b.pointsRule, level, offers }), applicable, level };
};

S.registerPurchase = (s, { businessId, membershipId, amount, offerIds, staffUserId = null, date, note = '' }) => {
  const m = S.membership(s, membershipId);
  if (m.businessId !== Number(businessId)) throw new ServerError('Ese cliente no pertenece a este negocio.', 403);
  if (!(Number(amount) > 0)) throw new ServerError('Ingresá el importe de la compra.', 422, { field: 'amount' });
  const b = S.business(s, businessId);
  if (b.status !== 'activo') throw new ServerError('Activá el programa del negocio para registrar compras.', 409);

  const before = snapshot(s, m);
  const streakBefore = Streaks.compute(S.purchaseDates(s, m.id), new Date(date));
  const firstNotification = S.nextId(s, 'notifications');
  const quote = S.quotePurchase(s, { membershipId, amount, offerIds, date });

  const staff = staffUserId ? S.user(s, staffUserId) : null;
  const mv = S.addMovement(s, {
    membership: m, type: 'compra', concept: note || 'Compra en el local', amount: Number(amount),
    points: quote.total, date, createdBy: staffUserId,
    detail: { lines: quote.lines, offers: quote.lines.filter((l) => l.offerId).map((l) => l.offerId), staffName: staff ? `${staff.firstName} ${staff.lastName}` : null },
  });
  m.purchasesCount += 1;
  m.lastPurchaseAt = iso(date);

  // Racha: se avisa la primera compra de la semana que la extiende
  const streak = Streaks.compute(S.purchaseDates(s, m.id), new Date(date));
  if (b.streaks.enabled && streak.weeks >= 2 && streak.weeks > streakBefore.weeks) {
    S.notify(s, {
      businessId: b.id, userId: m.userId, type: 'racha', date, dedupeKey: `racha:${Streaks.weekKey(date)}`,
      title: `🔥 ¡Racha de ${streak.weeks} semanas!`,
      body: 'Seguí comprando cada semana para no perderla.',
      link: APP_LINKS.profile,
    });
  }

  S.afterEarning(s, m, before, date);
  const events = s.notifications.filter((n) => n.id >= firstNotification && n.userId === m.userId);
  return { movement: mv, membership: m, quote, events };
};

/* ======================= Canjes ======================= */
S.redeem = (s, { membershipId, rewardId, date }) => {
  const m = S.membership(s, membershipId);
  const b = S.business(s, m.businessId);
  const reward = s.rewards.find((r) => r.id === Number(rewardId) && r.businessId === b.id);
  if (!reward || !Rewards.isVisible(reward, new Date(date))) throw new ServerError('Esta recompensa ya no está disponible.', 409);
  if (!Rewards.hasStock(reward)) throw new ServerError('Esta recompensa se agotó.', 409);
  if (m.balance < reward.points) {
    throw new ServerError(`Te faltan ${format.points(reward.points - m.balance)} puntos para este canje.`, 409);
  }
  let code;
  do { code = Rewards.newCode(b.codePrefix); } while (s.redemptions.some((r) => r.code === code));

  const red = {
    id: S.nextId(s, 'redemptions'), businessId: b.id, membershipId: m.id, userId: m.userId,
    rewardId: reward.id, rewardName: reward.name, points: reward.points, code, status: 'pendiente', source: 'canje',
    createdAt: iso(date), expiresAt: iso(D.addDays(date, b.redemptionValidityDays || appConfig.redemptionDays)),
    validatedAt: null, validatedBy: null, validatedByName: null,
  };
  // El canje resta del SALDO pero no de los puntos del mes (los canjes nunca cuentan para el período)
  const mv = S.addMovement(s, {
    membership: m, type: 'canje', concept: `Canje: ${reward.name}`, points: -reward.points, date, refId: red.id,
  });
  if (typeof reward.stock === 'number') reward.stock -= 1;
  s.redemptions.push(red);
  S.evaluateChallenges(s, m, date);
  return { redemption: red, membership: m, movement: mv };
};

S.expireRedemptions = (s, now) => {
  s.redemptions.forEach((r) => { if (Rewards.redemptionStatus(r, now) === 'vencido') r.status = 'vencido'; });
};

S.findRedemption = (s, businessId, code) => {
  const clean = String(code || '').trim().toUpperCase().replace(/\s+/g, '');
  return s.redemptions.find((r) => r.businessId === Number(businessId) && r.code.replace(/\s+/g, '') === clean) || null;
};

S.validateRedemption = (s, { businessId, code, staffUserId, date }) => {
  S.expireRedemptions(s, new Date(date));
  const red = S.findRedemption(s, businessId, code);
  if (!red) throw new ServerError('No encontramos un canje con ese código en este negocio.', 404);
  if (red.status === 'entregado') {
    throw new ServerError(`Este canje ya se entregó el ${format.dateTime(red.validatedAt)}${red.validatedByName ? ` (${red.validatedByName})` : ''}.`, 409);
  }
  if (red.status === 'vencido') throw new ServerError('Este canje venció y ya no se puede entregar.', 409);
  if (red.status === 'anulado') throw new ServerError('Este canje fue anulado.', 409);
  const staff = S.user(s, staffUserId);
  Object.assign(red, {
    status: 'entregado', validatedAt: iso(date), validatedBy: staff?.id || null,
    validatedByName: staff ? `${staff.firstName} ${staff.lastName}` : null,
  });
  return red;
};

/* ======================= Ajustes manuales ======================= */
/** Un ajuste corrige el SALDO. No cuenta para nivel ni ranking. */
S.adjustPoints = (s, { membershipId, points, reason, staffUserId, date }) => {
  const m = S.membership(s, membershipId);
  const p = Math.trunc(Number(points));
  if (!p) throw new ServerError('Ingresá una cantidad de puntos distinta de cero.', 422, { field: 'points' });
  const mv = S.addMovement(s, {
    membership: m, type: 'ajuste', concept: `Ajuste: ${reason || 'corrección manual'}`, points: p,
    date, createdBy: staffUserId,
  });
  return { movement: mv, membership: m };
};

/* ======================= Cierre mensual ======================= */
/**
 * 1. guarda el ranking final y las posiciones   2. determina el ganador
 * 3. entrega el premio                          4. guarda el nivel ganado con los
 *                                                  puntos del mes y lo aplica como
 *                                                  nivel VIGENTE del mes siguiente
 * 5. cierra las estadísticas del mes            6. empieza el nuevo período
 * 7. reinicia los puntos del mes
 * NO borra historial y NO toca el saldo disponible.
 */
S.closePeriod = (s, { businessId, date, closedBy = null }) => {
  const b = S.business(s, businessId);
  const period = b.currentPeriod;
  const levels = S.levelsOf(s, b.id);
  const members = s.memberships.filter((m) => m.businessId === b.id);
  const ranking = S.rankingOf(s, b.id);

  // Estadísticas del período
  const mv = s.movements.filter((x) => x.businessId === b.id && x.period === period);
  const purchases = mv.filter((x) => x.type === 'compra');
  const stats = {
    purchases: purchases.length,
    revenue: U.sum(purchases, (x) => x.amount || 0),
    pointsIssued: U.sum(mv.filter((x) => x.points > 0), (x) => x.points),
    pointsRedeemed: U.sum(mv.filter((x) => x.type === 'canje'), (x) => -x.points),
    activeCustomers: new Set(purchases.map((x) => x.membershipId)).size,
    newCustomers: members.filter((m) => D.periodOf(m.joinedAt) === period).length,
    challengesCompleted: s.challengeCompletions.filter((c) => c.businessId === b.id && D.periodOf(c.completedAt) === period).length,
  };

  // Nivel: el que tuvo este mes (vigente) y el que ganó para el mes siguiente
  const nextPeriod = D.nextPeriod(period);
  const levelChanges = [];
  members.forEach((m) => {
    const held = Levels.current(levels, m);
    const earned = Levels.forPoints(levels, m.periodPoints);
    m.history = m.history || [];
    m.history.push({
      period, points: m.periodPoints,
      levelId: held.id, levelName: held.name,                 // nivel vigente durante el período
      earnedLevelId: earned.id, earnedLevelName: earned.name, // nivel ganado -> se aplica en el siguiente
      position: ranking.find((r) => r.membershipId === m.id)?.position || null,
    });
    if (earned.id !== held.id) levelChanges.push({ m, held, earned });
  });

  const winnerRow = b.ranking.enabled ? ranking[0] || null : null;
  const close = {
    id: S.nextId(s, 'periodCloses'), businessId: b.id, period, closedAt: iso(date), closedBy,
    rankingEnabled: b.ranking.enabled, participants: ranking.length,
    ranking: ranking.slice(0, 10).map((r) => ({ ...r, levelName: Levels.forPoints(levels, r.points).name })),
    winner: winnerRow, prize: null, stats,
  };

  // Nuevo período: se aplica el nivel ganado y se reinician SOLO los puntos del mes
  members.forEach((m) => {
    m.levelId = Levels.forPoints(levels, m.periodPoints).id;
    m.periodPoints = 0;
  });
  b.currentPeriod = nextPeriod;
  close.levelChanges = levelChanges.length;
  levelChanges.forEach(({ m, held, earned }) => {
    const up = earned.minPoints > held.minPoints;
    S.notify(s, {
      businessId: b.id, userId: m.userId, type: up ? 'nivel' : 'sistema', date, dedupeKey: `nivel-vigente:${nextPeriod}`,
      title: up ? `🥇 ¡En ${format.period(nextPeriod)} sos ${earned.name}!` : `Este mes tu nivel es ${earned.name}`,
      body: up
        ? (earned.benefits?.length ? `Tus beneficios: ${earned.benefits.join(' · ')}.` : 'Lo ganaste con tus compras del mes pasado.')
        : `Con lo que sumaste en ${format.period(period)} quedaste en ${earned.name}. Sumá ${format.points(held.minPoints)} puntos este mes para volver a ${held.name}.`,
      link: APP_LINKS.profile,
    });
  });

  // Premio al ganador (se acredita en el período nuevo y no suma al ranking nuevo)
  const prize = b.monthlyPrize;
  if (winnerRow && prize?.enabled) {
    const wm = S.membership(s, winnerRow.membershipId);
    if (prize.type === 'puntos' && prize.points > 0) {
      S.addMovement(s, {
        membership: wm, type: 'premio', concept: `Premio: #1 del ranking de ${format.period(period)}`,
        points: prize.points, date, refId: close.id,
      });
      close.prize = { type: 'puntos', points: prize.points, description: `${format.points(prize.points)} puntos` };
    } else if (prize.type === 'recompensa' && prize.rewardId) {
      const reward = s.rewards.find((r) => r.id === Number(prize.rewardId));
      let code;
      do { code = Rewards.newCode(b.codePrefix); } while (s.redemptions.some((r) => r.code === code));
      const red = {
        id: S.nextId(s, 'redemptions'), businessId: b.id, membershipId: wm.id, userId: wm.userId,
        rewardId: reward?.id || null, rewardName: reward?.name || 'Premio mensual', points: 0, code, status: 'pendiente',
        source: 'premio', createdAt: iso(date), expiresAt: iso(D.addDays(date, b.redemptionValidityDays || 30)),
        validatedAt: null, validatedBy: null, validatedByName: null,
      };
      s.redemptions.push(red);
      S.addMovement(s, { membership: wm, type: 'premio', concept: `Premio: ${red.rewardName} (#1 de ${format.period(period)})`, points: 0, date, refId: red.id });
      close.prize = { type: 'recompensa', rewardId: reward?.id, description: red.rewardName, code };
    } else {
      close.prize = { type: 'texto', description: prize.description || 'Premio especial' };
    }
    S.notify(s, {
      businessId: b.id, userId: wm.userId, type: 'premio', date, dedupeKey: `ganador:${period}`,
      title: `🎉 ¡Ganaste el ranking de ${format.period(period)}!`,
      body: `Terminaste #1 con ${format.points(winnerRow.points)} puntos. Tu premio: ${close.prize.description}.`,
      link: APP_LINKS.ranking,
    });
  }

  if (b.ranking.enabled) {
    ranking.slice(1, b.ranking.showTop || 5).forEach((r) => S.notify(s, {
      businessId: b.id, userId: r.userId, type: 'ranking', date, dedupeKey: `cierre:${period}`,
      title: `🏆 Terminaste #${r.position} en ${format.period(period)}`,
      body: '¡Muy bien! Ya empezó el ranking del nuevo mes.', link: APP_LINKS.ranking,
    }));
  }

  s.periodCloses.push(close);
  return close;
};

/* ======================= Campañas ======================= */
S.AUDIENCES = {
  todos: 'Todos los clientes',
  nivel: 'Un nivel',
  segmento: 'Un segmento',
  inactivos: 'Clientes inactivos',
  frecuentes: 'Clientes frecuentes',
  vip: 'Clientes VIP',
  manual: 'Selección manual',
};

S.resolveAudience = (s, businessId, audience, now = new Date()) => {
  const members = s.memberships.filter((m) => m.businessId === Number(businessId) && m.status !== 'bloqueado');
  const seg = (key) => members.filter((m) => S.insights(s, m, now).segments.includes(key));
  switch (audience.type) {
    case 'todos': return members;
    case 'nivel': return members.filter((m) => S.levelStatus(s, m).level.id === Number(audience.value));
    case 'segmento': return seg(audience.value);
    case 'inactivos': return seg('inactivo');
    case 'frecuentes': return seg('frecuente');
    case 'vip': return seg('vip');
    case 'manual': return members.filter((m) => (audience.membershipIds || []).includes(m.id));
    default: return [];
  }
};

S.sendCampaign = (s, { businessId, title, message, audience, offerId = null, createdBy = null, date }) => {
  if (!String(title || '').trim()) throw new ServerError('Escribí un título para la campaña.', 422, { field: 'title' });
  if (!String(message || '').trim()) throw new ServerError('Escribí el mensaje.', 422, { field: 'message' });
  const recipients = S.resolveAudience(s, businessId, audience, new Date(date));
  if (!recipients.length) throw new ServerError('No hay clientes en ese público. Elegí otro.', 422);
  const c = {
    id: S.nextId(s, 'campaigns'), businessId: Number(businessId), title, message, audience,
    offerId: offerId ? Number(offerId) : null, recipients: recipients.map((m) => m.membershipId || m.id),
    channels: ['app'], sentAt: iso(date), createdBy, status: 'enviada',
  };
  s.campaigns.push(c);
  recipients.forEach((m) => S.notify(s, {
    businessId: c.businessId, userId: m.userId, type: 'campana', source: 'campaña', campaignId: c.id, date,
    title, body: message, link: c.offerId ? APP_LINKS.offers : '',
  }));
  return c;
};

/* ======================= Publicaciones ======================= */
S.announceOffer = (s, offer, date) => {
  if (!Offers.isLive(offer, new Date(date))) return 0;
  let n = 0;
  s.memberships.filter((m) => m.businessId === offer.businessId).forEach((m) => {
    if (!Offers.isEligible(offer, S.levelStatus(s, m).level.id)) return;
    if (S.notify(s, {
      businessId: offer.businessId, userId: m.userId, type: 'oferta', date, dedupeKey: `oferta:${offer.id}`,
      title: `🔥 Nueva oferta: ${offer.title}`, body: `${Offers.tag(offer)} · ${Offers.when(offer)}`,
      link: APP_LINKS.offers,
    })) n++;
  });
  return n;
};

S.announceReward = (s, reward, date) => {
  if (!Rewards.isAvailable(reward, new Date(date))) return 0;
  let n = 0;
  s.memberships.filter((m) => m.businessId === reward.businessId).forEach((m) => {
    if (S.notify(s, {
      businessId: reward.businessId, userId: m.userId, type: 'recompensa', date, dedupeKey: `recompensa:${reward.id}`,
      title: `🎁 Nueva recompensa: ${reward.name}`, body: `Por ${format.points(reward.points)} puntos.`,
      link: APP_LINKS.rewards,
    })) n++;
  });
  return n;
};

/* ======================= Al abrir la app ======================= */
/** Avisos que dependen del paso del tiempo (racha en riesgo, canjes vencidos) */
S.onClientOpen = (s, membershipId, now = new Date()) => {
  const m = S.membership(s, membershipId);
  const b = S.business(s, m.businessId);
  S.expireRedemptions(s, now);
  if (!b.streaks.enabled || !b.streaks.remindAtRisk) return;
  const streak = Streaks.compute(S.purchaseDates(s, m.id), now);
  const weekday = (now.getDay() + 6) % 7; // 0 = lunes
  if (streak.atRisk && streak.weeks >= 2 && weekday >= 3) {
    S.notify(s, {
      businessId: b.id, userId: m.userId, type: 'racha', date: now, dedupeKey: `racha-riesgo:${Streaks.weekKey(now)}`,
      title: '🔥 Estás por perder tu racha',
      body: `Una compra antes del domingo mantiene tu racha de ${streak.weeks} semanas.`,
      link: APP_LINKS.profile,
    });
  }
};


export const server = S;
export { ServerError };
