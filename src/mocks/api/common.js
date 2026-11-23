/**
 * Utilidades compartidas por los handlers del servidor simulado.
 *
 * Reproducen lo que hará la API con cada pedido: identificar a la persona
 * por su token, validar su rol en el negocio (personal del negocio) o su
 * membresía como cliente, y no devolver nunca datos sensibles.
 */
import { ServerError } from '../server.js';

/** Datos públicos de una cuenta: nunca se devuelve la contraseña. */
export const publicUser = (u) => {
  if (!u) return null;
  const { password, ...rest } = u;
  return rest;
};

/** Persona que hace el pedido (en la API: la del token). */
export function me(s, ctx) {
  const user = ctx.userId && s.users.find((u) => u.id === ctx.userId);
  if (!user) throw new ServerError('Tu sesión expiró. Ingresá de nuevo.', 401);
  return user;
}

/**
 * Personal del negocio del contexto activo.
 * Busca la fila de personal (persona + negocio) y valida su rol.
 * roles: roles permitidos en términos de panel ('admin' | 'empleado');
 * el dueño (owner) tiene todos los permisos del administrador.
 */
export function staff(s, S, ctx, roles = ['admin', 'empleado']) {
  const user = me(s, ctx);
  if (!ctx.businessId) throw new ServerError('Elegí el negocio con el que querés trabajar.', 409);
  const row = S.staffRow(s, user.id, ctx.businessId);
  if (!row || !roles.includes(S.panelRole(row.role))) throw new ServerError('No tenés permiso para esta acción en este negocio.', 403);
  const business = S.business(s, ctx.businessId);
  // Un negocio bloqueado por la plataforma pierde el acceso al panel (los datos se conservan)
  if (business.status === 'bloqueado') {
    throw new ServerError(`${business.name} fue bloqueado por la administración de GO Puntos y no puede usar el panel.`, 403, { code: 'BUSINESS_BLOCKED', reason: S.statusReasonOf(s, business)?.detail || '' });
  }
  return { user, business, role: row.role };
}

/** Sólo dueño o administrador (configuración y datos sensibles del negocio). */
export const admin = (s, S, ctx) => staff(s, S, ctx, ['admin']);

/**
 * Membresía del cliente en el negocio que está mirando.
 * Si ese negocio ya no corresponde, usa la primera membresía que tenga
 * (la respuesta incluye el negocio, y el frontend actualiza su selección).
 */
export function activeMembership(s, S, ctx) {
  const user = me(s, ctx);
  let m = ctx.businessId ? S.membershipOf(s, user.id, ctx.businessId) : null;
  if (!m) m = s.memberships.find((x) => x.userId === user.id) || null;
  if (!m) throw new ServerError('Todavía no te sumaste a ningún negocio.', 404, { code: 'NO_MEMBERSHIP' });
  return { user, m, business: S.business(s, m.businessId) };
}

/**
 * Accesos de una cuenta:
 *   staff        paneles por negocio (con su rol y el estado del negocio)
 *   memberships  cantidad de membresías como cliente
 *   platform     true si es Superadmin (fila activa en administradores_plataforma)
 */
export function accessOf(s, S, user) {
  const order = ['owner', 'admin', 'empleado'];
  return {
    staff: S.staffRolesOf(s, user.id)
      .map((r) => {
        const b = S.business(s, r.businessId);
        return { businessId: r.businessId, role: r.role, businessName: b.name || 'Mi negocio', businessStatus: b.status };
      })
      .sort((a, b) => order.indexOf(a.role) - order.indexOf(b.role)),
    memberships: s.memberships.filter((m) => m.userId === user.id).length,
    platform: Boolean(S.platformAdminOf(s, user.id)),
  };
}
