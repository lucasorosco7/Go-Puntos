/**
 * Handlers simulados de notificaciones (campana del cliente).
 * Equivalen a: GET /me/notifications, PATCH /me/notifications/:id y POST /me/notifications/read-all.
 * Se devuelven las del negocio activo más los avisos generales de la cuenta.
 */
import { me } from './common.js';

const mine = (s, ctx) => {
  const user = me(s, ctx);
  return s.notifications.filter((n) => n.userId === user.id && (n.businessId === ctx.businessId || n.businessId === null));
};

export const notificationsApi = {
  list: () => (s, S, ctx) => mine(s, ctx).sort((a, c) => new Date(c.createdAt) - new Date(a.createdAt)),

  unreadCount: () => (s, S, ctx) => ({ count: mine(s, ctx).filter((n) => !n.read).length }),

  /** changes: { read: true } y/o { popupShown: true } */
  update: (id, changes) => (s, S, ctx) => {
    const n = mine(s, ctx).find((x) => x.id === id);
    if (n) Object.assign(n, changes.read ? { read: true } : {}, changes.popupShown ? { popupShown: true } : {});
    return n || null;
  },

  markAllRead: () => (s, S, ctx) => {
    mine(s, ctx).forEach((n) => { n.read = true; });
    return true;
  },
};
