/**
 * Handlers simulados del panel de plataforma (Superadmin).
 *
 * Equivalen a los endpoints previstos (ver services/platformService.js):
 *   GET  /platform/dashboard
 *   GET  /platform/invitations             POST /platform/invitations
 *   POST /platform/invitations/:id/revoke
 *   GET  /public/invitations/:token        (sin sesión: valida el enlace)
 *   GET  /platform/requests                POST /platform/requests/:id/approve · /reject
 *   GET  /platform/businesses              GET  /platform/businesses/:id
 *   POST /platform/businesses/:id/status   { action: suspender | bloquear | reactivar, reason }
 *   GET  /platform/audit
 *
 * Todos (salvo la validación pública del enlace) exigen que la persona del
 * token tenga una fila ACTIVA en administradores_plataforma. Ser
 * Superadmin no da acceso a los paneles de los negocios.
 */
import { platform as Platform } from '../../domain/platform.js';
import { me, publicUser } from './common.js';

/** Superadmin que hace el pedido (403 si la cuenta no lo es). */
function superadmin(s, S, ctx) {
  const user = me(s, ctx);
  const row = S.platformAdminOf(s, user.id);
  if (!row) throw new S.ServerError('Esta sección es sólo para el equipo de administración de GO Puntos.', 403);
  return { user, admin: row };
}

/** Nombre visible de un administrador de plataforma. */
const adminName = (s, S, adminId) => {
  const row = s.platformAdmins.find((a) => a.id === adminId);
  const u = row && S.user(s, row.userId);
  return u ? `${u.firstName} ${u.lastName}` : 'Administración de GO Puntos';
};

/** Invitación tal como se muestra (sin el hash del token). */
function invitationView(s, S, inv, now) {
  const req = s.businessRequests.find((r) => r.invitationId === inv.id);
  const b = req && s.businesses.find((x) => x.id === req.businessId);
  return {
    id: inv.id, email: inv.email, createdAt: inv.createdAt, expiresAt: inv.expiresAt, usedAt: inv.usedAt,
    status: Platform.invitationStatus(inv, now), storedStatus: inv.status, createdBy: adminName(s, S, inv.adminId),
    business: b ? { id: b.id, name: b.name } : null,
  };
}

/** Dueño (solicitante) y administradores de un negocio. */
function ownerOf(s, S, b) {
  const req = S.requestOf(s, b.id);
  const row = s.businessStaff.find((x) => x.businessId === b.id && x.role === 'owner')
    || s.businessStaff.find((x) => x.businessId === b.id && x.role === 'admin');
  const user = S.user(s, req?.userId || row?.userId);
  return user ? { id: user.id, name: `${user.firstName} ${user.lastName}`, email: user.email, phone: user.phone } : null;
}

/** Fila del listado global de negocios. */
function businessRow(s, S, b) {
  const req = S.requestOf(s, b.id);
  return {
    id: b.id, name: b.name || 'Sin nombre', category: b.category, city: b.city, slug: b.slug, logo: b.logo, logoIcon: b.logoIcon,
    paletteId: b.paletteId, paletteVariant: b.paletteVariant, customPalette: b.customPalette || null,
    status: b.status, createdAt: b.createdAt, owner: ownerOf(s, S, b),
    customers: s.memberships.filter((m) => m.businessId === b.id).length,
    phase: Platform.requestPhase(req), statusReason: S.statusReasonOf(s, b),
    actions: Platform.actionsFor(b.status),
  };
}

/** Solicitud con su negocio, solicitante y requisitos. */
function requestView(s, S, req) {
  const b = S.business(s, req.businessId);
  const reviewer = req.reviewerId ? adminName(s, S, req.reviewerId) : null;
  return {
    ...req, phase: Platform.requestPhase(req), reviewerName: reviewer,
    business: { id: b.id, name: b.name, category: b.category, city: b.city, address: b.address, phone: b.phone, email: b.email, status: b.status, logo: b.logo, logoIcon: b.logoIcon },
    applicant: publicUser(S.user(s, req.userId)),
    checklist: Platform.setupChecklist(b, S.setupCounts(s, b.id)),
    counts: { ...S.setupCounts(s, b.id), offers: s.offers.filter((o) => o.businessId === b.id).length },
  };
}

/** Registro de auditoría listo para mostrar. */
function auditView(s, S, a) {
  const b = a.businessId && s.businesses.find((x) => x.id === a.businessId);
  return { ...a, adminName: adminName(s, S, a.adminId), business: b ? { id: b.id, name: b.name } : null };
}

export const platformApi = {
  /** Indicadores globales y actividad reciente. */
  dashboard: () => (s, S, ctx) => {
    superadmin(s, S, ctx);
    const now = new Date();
    const by = (st) => s.businesses.filter((b) => b.status === st).length;
    const reqs = s.businessRequests;
    const invs = s.invitations.map((i) => Platform.invitationStatus(i, now));
    return {
      kpis: {
        businesses: s.businesses.length,
        active: by('activo'),
        pending: by('pendiente'),
        suspended: by('suspendido'),
        blocked: by('bloqueado'),
        rejected: by('rechazado'),
        requestsToReview: reqs.filter((r) => Platform.requestPhase(r) === 'revision').length,
        requestsInPreparation: reqs.filter((r) => Platform.requestPhase(r) === 'preparacion').length,
        invitationsSent: s.invitations.length,
        invitationsPending: invs.filter((x) => x === 'pendiente').length,
        invitationsUsed: invs.filter((x) => x === 'utilizada').length,
        users: s.users.length,
        customers: new Set(s.memberships.map((m) => m.userId)).size,
      },
      byStatus: ['activo', 'pendiente', 'suspendido', 'bloqueado', 'rechazado'].map((st) => ({ status: st, count: by(st) })),
      toReview: reqs.filter((r) => Platform.requestPhase(r) === 'revision').map((r) => requestView(s, S, r))
        .sort((a, b) => new Date(a.submittedAt) - new Date(b.submittedAt)),
      recent: [...s.platformAudit].reverse().slice(0, 8).map((a) => auditView(s, S, a)),
    };
  },

  /* ---------- Invitaciones ---------- */
  invitations: () => (s, S, ctx) => {
    superadmin(s, S, ctx);
    const now = new Date();
    return [...s.invitations].reverse().map((i) => invitationView(s, S, i, now));
  },

  /** Crea una invitación: devuelve la fila y el token (que no se vuelve a mostrar). */
  createInvitation: ({ email, days }) => (s, S, ctx) => {
    const { admin } = superadmin(s, S, ctx);
    const r = S.createInvitation(s, { adminId: admin.id, email, days, date: new Date() });
    return { invitation: invitationView(s, S, r.invitation, new Date()), token: r.token };
  },

  revokeInvitation: (id) => (s, S, ctx) => {
    const { admin } = superadmin(s, S, ctx);
    return invitationView(s, S, S.revokeInvitation(s, { adminId: admin.id, invitationId: id, date: new Date() }), new Date());
  },

  /** Validación pública del enlace (pantalla de registro del negocio). */
  validateInvitation: (token) => (s, S) => {
    const inv = S.invitationByToken(s, token);
    const problem = Platform.invitationProblem(inv);
    return problem
      ? { valid: false, reason: problem, status: inv ? Platform.invitationStatus(inv) : 'invalida' }
      : { valid: true, email: inv.email, expiresAt: inv.expiresAt };
  },

  /* ---------- Solicitudes ---------- */
  requests: () => (s, S, ctx) => {
    superadmin(s, S, ctx);
    return [...s.businessRequests].map((r) => requestView(s, S, r))
      .sort((a, b) => new Date(b.submittedAt || b.createdAt) - new Date(a.submittedAt || a.createdAt));
  },

  approveRequest: (id, { reason = '' } = {}) => (s, S, ctx) => {
    const { admin } = superadmin(s, S, ctx);
    const r = S.reviewRequest(s, { adminId: admin.id, requestId: id, approve: true, reason, date: new Date() });
    return requestView(s, S, r.request);
  },

  rejectRequest: (id, { reason }) => (s, S, ctx) => {
    const { admin } = superadmin(s, S, ctx);
    const r = S.reviewRequest(s, { adminId: admin.id, requestId: id, approve: false, reason, date: new Date() });
    return requestView(s, S, r.request);
  },

  /* ---------- Negocios ---------- */
  businesses: () => (s, S, ctx) => {
    superadmin(s, S, ctx);
    return [...s.businesses].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map((b) => businessRow(s, S, b));
  },

  business: (id) => (s, S, ctx) => {
    superadmin(s, S, ctx);
    const b = S.business(s, id);
    const req = S.requestOf(s, b.id);
    return {
      ...businessRow(s, S, b),
      description: b.description, address: b.address, phone: b.phone, email: b.email,
      request: req ? requestView(s, S, req) : null,
      team: s.businessStaff.filter((x) => x.businessId === b.id && x.active).map((x) => ({ ...publicUser(S.user(s, x.userId)), role: x.role })),
      stats: {
        customers: s.memberships.filter((m) => m.businessId === b.id).length,
        purchases: s.movements.filter((m) => m.businessId === b.id && m.type === 'compra').length,
        rewards: s.rewards.filter((r) => r.businessId === b.id).length,
        redemptions: s.redemptions.filter((r) => r.businessId === b.id).length,
      },
      history: [...s.platformAudit].reverse().filter((a) => a.businessId === b.id).map((a) => auditView(s, S, a)),
    };
  },

  changeStatus: (id, { action, reason }) => (s, S, ctx) => {
    const { admin } = superadmin(s, S, ctx);
    const b = S.changeBusinessStatus(s, { adminId: admin.id, businessId: id, action, reason, date: new Date() });
    return businessRow(s, S, b);
  },

  /* ---------- Auditoría ---------- */
  audit: () => (s, S, ctx) => {
    superadmin(s, S, ctx);
    return [...s.platformAudit].reverse().map((a) => auditView(s, S, a));
  },
};
