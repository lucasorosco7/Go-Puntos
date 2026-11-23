/**
 * Handlers simulados de desafíos y del resumen de rachas (panel).
 * Equivalen a: CRUD /admin/challenges y PATCH /admin/challenges/:id/status.
 */
import { challenges as Challenges } from '../../domain/challenges.js';
import { streaks as Streaks } from '../../domain/streaks.js';
import { admin } from './common.js';
import { validateDates } from './rewards.js';

/** Desafío con su participación: clientes con avance y clientes que lo completaron. */
function challengeView(s, S, c) {
  const members = s.memberships.filter((m) => m.businessId === c.businessId);
  const participants = members.filter((m) => Challenges.progress(c, S.movementsOf(s, m.id)).value > 0).length;
  const completed = s.challengeCompletions.filter((x) => x.challengeId === c.id).length;
  return { ...c, effectiveStatus: Challenges.effectiveStatus(c), participants, completed, members: members.length };
}

export const challengesApi = {
  list: () => (s, S, ctx) => {
    const { business: b } = admin(s, S, ctx);
    const now = new Date();
    const members = s.memberships.filter((m) => m.businessId === b.id);
    const all = members.map((m) => Streaks.compute(S.purchaseDates(s, m.id), now));
    return {
      business: b,
      challenges: s.challenges.filter((c) => c.businessId === b.id).map((c) => challengeView(s, S, c))
        .sort((a, c) => new Date(c.createdAt) - new Date(a.createdAt)),
      streakStats: {
        active: all.filter((x) => x.weeks >= 2).length,
        atRisk: all.filter((x) => x.atRisk && x.weeks >= 2).length,
        best: Math.max(0, ...all.map((x) => x.best)),
        distribution: [[2, 2], [3, 4], [5, 7], [8, Infinity]].map(([a, z]) => ({
          label: z === Infinity ? `${a}+ semanas` : a === z ? `${a} semanas` : `${a} a ${z} semanas`,
          count: all.filter((x) => x.weeks >= a && x.weeks <= z).length,
        })),
      },
    };
  },

  save: (data) => (s, S, ctx) => {
    const { business: b } = admin(s, S, ctx);
    if (!String(data.name || '').trim()) throw new S.ServerError('Poné un nombre al desafío.', 422, { field: 'name' });
    if (!Challenges.TYPES[data.type]) throw new S.ServerError('Elegí el tipo de desafío.', 422, { field: 'type' });
    if (!(Number(data.goal) > 0)) throw new S.ServerError('El objetivo tiene que ser mayor a cero.', 422, { field: 'goal' });
    if (!data.startDate || !data.endDate) throw new S.ServerError('Elegí las fechas de inicio y fin.', 422, { field: 'startDate' });
    validateDates(S, data.startDate, data.endDate);
    const clean = {
      name: data.name.trim(), description: (data.description || '').trim(), type: data.type, goal: Math.round(Number(data.goal)),
      rewardPoints: Math.max(0, Math.round(Number(data.rewardPoints) || 0)), rewardText: (data.rewardText || '').trim(),
      startDate: data.startDate, endDate: data.endDate, status: data.status || 'activo',
    };
    let c = data.id && s.challenges.find((x) => x.id === Number(data.id) && x.businessId === b.id);
    if (c) Object.assign(c, clean);
    else { c = { id: S.nextId(s, 'challenges'), businessId: b.id, createdAt: new Date().toISOString(), ...clean }; s.challenges.push(c); }
    return challengeView(s, S, c);
  },

  setStatus: (id, status) => (s, S, ctx) => {
    const { business: b } = admin(s, S, ctx);
    const c = s.challenges.find((x) => x.id === id && x.businessId === b.id);
    if (!c) throw new S.ServerError('No encontramos el desafío.', 404);
    c.status = status;
    return challengeView(s, S, c);
  },

  /** Sólo si nadie lo completó; si no, se finaliza para conservar el historial. */
  remove: (id) => (s, S, ctx) => {
    const { business: b } = admin(s, S, ctx);
    if (s.challengeCompletions.some((x) => x.challengeId === id)) {
      throw new S.ServerError('Este desafío ya tiene clientes que lo completaron: finalizalo para conservar el historial.', 409);
    }
    s.challenges = s.challenges.filter((c) => !(c.id === id && c.businessId === b.id));
    return true;
  },
};
