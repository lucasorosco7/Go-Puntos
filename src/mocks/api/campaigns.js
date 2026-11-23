/**
 * Handlers simulados de campañas.
 * Equivalen a: GET /admin/campaigns, POST /admin/campaigns/preview y POST /admin/campaigns.
 *
 * Una campaña crea una notificación para cada destinatario y queda
 * registrada con la cantidad de destinatarios y cuántos la leyeron.
 */
import { offers as Offers } from '../../domain/offers.js';
import { ranking as Ranking } from '../../domain/ranking.js';
import { admin } from './common.js';

export const campaignsApi = {
  list: () => (s, S, ctx) => {
    const { business: b } = admin(s, S, ctx);
    return {
      levels: S.levelsOf(s, b.id),
      offers: s.offers.filter((o) => o.businessId === b.id && ['activa', 'borrador'].includes(o.status))
        .map((o) => ({ ...o, effectiveStatus: Offers.effectiveStatus(o) })),
      campaigns: s.campaigns.filter((c) => c.businessId === b.id).sort((a, c) => new Date(c.sentAt) - new Date(a.sentAt)).map((c) => {
        const notes = s.notifications.filter((n) => n.campaignId === c.id);
        return { ...c, recipientsCount: c.recipients.length, readCount: notes.filter((n) => n.read).length };
      }),
      customers: s.memberships.filter((m) => m.businessId === b.id).map((m) => {
        const u = S.user(s, m.userId);
        return { membershipId: m.id, name: `${u.firstName} ${u.lastName}`, email: u.email, level: S.levelStatus(s, m).level.name };
      }).sort((a, c) => a.name.localeCompare(c.name)),
    };
  },

  /** Cuántos clientes recibirían la campaña (con algunos nombres de ejemplo). */
  preview: (audience) => (s, S, ctx) => {
    const { business: b } = admin(s, S, ctx);
    const list = S.resolveAudience(s, b.id, audience, new Date());
    return { count: list.length, sample: list.slice(0, 4).map((m) => Ranking.publicName(S.user(s, m.userId))) };
  },

  send: (data) => (s, S, ctx) => {
    const { user, business: b } = admin(s, S, ctx);
    return S.sendCampaign(s, { businessId: b.id, ...data, createdBy: user.id, date: new Date() });
  },
};
