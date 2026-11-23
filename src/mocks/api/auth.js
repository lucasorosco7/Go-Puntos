/**
 * Handlers simulados de autenticación.
 * Equivalen a: POST /auth/login, /auth/context, /auth/register, /auth/register-business.
 *
 * La respuesta del login no trae "un rol": trae la identidad de la cuenta y
 * sus accesos (paneles de negocios + membresías). El contexto inicial lo
 * elige el store de autenticación.
 */
import { appConfig } from '../../config/app.config.js';
import { accessOf, me, publicUser } from './common.js';

const emailTaken = (s, email) => s.users.some((u) => u.email.toLowerCase() === email.trim().toLowerCase());

export const authApi = {
  login: ({ email, password }) => (s, S) => {
    const user = s.users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!user || user.password !== password) throw new S.ServerError('El email o la contraseña no coinciden.', 401);
    if (user.active === false) throw new S.ServerError('Tu cuenta está desactivada.', 403);
    return {
      token: `mock-token-${user.id}`,
      user: publicUser(user),
      access: accessOf(s, S, user),
      memberships: s.memberships.filter((m) => m.userId === user.id).map((m) => ({ businessId: m.businessId })),
    };
  },

  /** Valida que la cuenta tenga el contexto pedido y devuelve los accesos actualizados. */
  switchContext: (target) => (s, S, ctx) => {
    const user = me(s, ctx);
    if (target.type === 'staff') {
      const row = S.staffRow(s, user.id, target.businessId);
      if (!row) throw new S.ServerError('No tenés un rol en ese negocio.', 403);
      return { context: { type: 'staff', businessId: row.businessId, role: row.role }, access: accessOf(s, S, user) };
    }
    return { context: { type: 'cliente' }, access: accessOf(s, S, user) };
  },

  /** Crea UNA cuenta y la asocia al negocio del QR (o al negocio por defecto). */
  register: (data) => (s, S) => {
    if (emailTaken(s, data.email)) throw new S.ServerError('Ya existe una cuenta con ese email. Ingresá con tu contraseña.', 409, { field: 'email' });
    const user = {
      id: S.nextId(s, 'users'), firstName: data.firstName.trim(), lastName: data.lastName.trim(),
      email: data.email.trim(), phone: data.phone.trim(), password: data.password, createdAt: new Date().toISOString(), active: true,
    };
    s.users.push(user);
    const business = S.businessBySlug(s, data.joinSlug || appConfig.defaultBusinessSlug);
    let membership = null;
    if (business && business.status === 'activo') membership = S.joinBusiness(s, { userId: user.id, businessId: business.id, date: new Date() }).membership;
    return {
      token: `mock-token-${user.id}`, user: publicUser(user), access: accessOf(s, S, user),
      membership: membership && { businessId: membership.businessId, balance: membership.balance },
      business: business ? { id: business.id, name: business.name } : null,
    };
  },

  /** Alta de un comercio: crea la cuenta y el negocio en borrador; la cuenta queda como dueña. */
  registerBusiness: (data) => (s, S) => {
    if (emailTaken(s, data.email)) throw new S.ServerError('Ya existe una cuenta con ese email.', 409, { field: 'email' });
    const user = {
      id: S.nextId(s, 'users'), firstName: data.firstName.trim(), lastName: data.lastName.trim(),
      email: data.email.trim(), phone: data.phone.trim(), password: data.password, createdAt: new Date().toISOString(), active: true,
    };
    s.users.push(user);
    const b = S.createBusiness(s, { adminUserId: user.id, name: data.businessName.trim(), category: data.category || 'otro', date: new Date() });
    return { token: `mock-token-${user.id}`, user: publicUser(user), access: accessOf(s, S, user), business: { id: b.id, name: b.name } };
  },

  /** Perfil de la cuenta (PUT /me). */
  updateProfile: (values) => (s, S, ctx) => {
    const user = me(s, ctx);
    const email = values.email.trim().toLowerCase();
    if (s.users.some((u) => u.id !== user.id && u.email.toLowerCase() === email)) throw new S.ServerError('Ese email ya lo usa otra cuenta.', 409, { field: 'email' });
    Object.assign(user, { firstName: values.firstName.trim(), lastName: values.lastName.trim(), email: values.email.trim(), phone: values.phone.trim() });
    return publicUser(user);
  },

  /** PUT /me/password */
  changePassword: ({ current, password }) => (s, S, ctx) => {
    const user = me(s, ctx);
    if (user.password !== current) throw new S.ServerError('La contraseña actual no es correcta.', 422, { field: 'current' });
    user.password = password;
    return { ok: true };
  },
};
