/**
 * Handlers simulados del ranking mensual y del cierre del mes.
 *
 * Cliente: GET /me/businesses/:id/ranking (Top N, posición propia, premio e historial)
 * Panel:   GET /admin/ranking y POST /admin/periods/close
 *
 * En producción el cierre lo ejecuta el servidor el día 1 a las 00:05;
 * el botón del panel queda para cierres manuales y pruebas.
 */
import { ranking as Ranking } from '../../domain/ranking.js';
import { periodOf } from '../../utils/dates.js';
import { activeMembership, admin } from './common.js';

export const rankingApi = {
  forCustomer: () => (s, S, ctx) => {
    const { m, business } = activeMembership(s, S, ctx);
    const list = S.rankingOf(s, business.id);
    const prizeReward = business.monthlyPrize.rewardId && s.rewards.find((r) => r.id === business.monthlyPrize.rewardId);
    const history = s.periodCloses.filter((c) => c.businessId === business.id && c.rankingEnabled)
      .sort((a, c) => (a.period < c.period ? 1 : -1)).slice(0, 4)
      .map((c) => ({
        period: c.period, winner: c.winner, prize: c.prize, participants: c.participants,
        mine: m.history.find((h) => h.period === c.period) || null,
      }));
    return {
      enabled: business.ranking.enabled, period: business.currentPeriod, business,
      ...Ranking.topAndMe(list, m.id, business.ranking.showTop || 5),
      prize: business.monthlyPrize.enabled ? { ...business.monthlyPrize, rewardName: prizeReward?.name || null } : null,
      history, membershipId: m.id,
    };
  },

  forBusiness: () => (s, S, ctx) => {
    const now = new Date();
    const { business: b } = admin(s, S, ctx);
    const list = S.rankingOf(s, b.id).map((r) => {
      const m = S.membership(s, r.membershipId);
      return {
        ...r, level: S.levelStatus(s, m).level,
        purchases: S.movementsOf(s, m.id).filter((x) => x.type === 'compra' && x.period === b.currentPeriod).length,
      };
    });
    return {
      business: b, period: b.currentPeriod, list, levels: S.levelsOf(s, b.id),
      rewards: s.rewards.filter((r) => r.businessId === b.id && r.status !== 'finalizada'),
      closes: s.periodCloses.filter((c) => c.businessId === b.id).sort((a, c) => (a.period < c.period ? 1 : -1)),
      members: s.memberships.filter((m) => m.businessId === b.id).length,
      periodEnded: periodOf(now) > b.currentPeriod,
    };
  },

  /** Cierre mensual: ver la descripción completa en mocks/server.js → closePeriod. */
  closePeriod: () => (s, S, ctx) => {
    const { user, business: b } = admin(s, S, ctx);
    return S.closePeriod(s, { businessId: b.id, date: new Date(), closedBy: user.id });
  },
};
