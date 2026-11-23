/**
 * Servicio de autenticación de GO Puntos.
 *
 * Responsabilidad: ingreso, registro de clientes y de comercios (con invitación),
 * cambio de contexto (cliente ↔ panel de un negocio ↔ plataforma), perfil de la
 * cuenta y contraseña.
 *
 * NO guarda la sesión: eso lo hace el store de autenticación (stores/auth.js)
 * con el resultado de estos métodos. Así el service queda igual cuando se
 * conecte la API real.
 *
 * Endpoints previstos:
 *   POST /auth/login             { email, password }          → { token, user, access, memberships }
 *                                (access.platform = true si la cuenta es Superadmin)
 *   POST /auth/context           { type, businessId }         → { context, access }   (type: cliente | staff | plataforma)
 *   POST /auth/register          { ...datos, joinSlug }       → { token, user, access, membership, business }
 *   POST /auth/register-business { ...datos, businessName, invitationToken } → { token, user, access, business }
 *   POST /auth/forgot-password   { email }                    → { message }
 *   POST /auth/logout                                         → 204
 *   PUT  /me                     { firstName, lastName, email, phone } → user
 *   PUT  /me/password            { current, password }        → { ok }
 *   PUT  /me/preferences         { mode }                     → user (mode: 'claro' | 'oscuro' | 'auto')
 */
import { appConfig } from '../config/app.config.js';
import { http } from './http.js';
import { send, wait } from './request.js';

const mocks = () => import('../mocks/api/auth.js').then((m) => m.authApi);

export const authService = {
  /** Valida credenciales. Devuelve identidad y accesos; el contexto inicial lo decide el store. */
  login: (credentials) => send({
    mock: async () => (await mocks()).login(credentials),
    api: () => http.post('/auth/login', credentials),
    ms: 600,
  }),

  /**
   * Cambia el contexto activo con la MISMA cuenta.
   * target: { type: 'cliente' }, { type: 'staff', businessId } o { type: 'plataforma' }
   * El servidor confirma que la persona tenga un rol en ese negocio y devuelve
   * el contexto con su rol real (owner, admin o empleado).
   */
  switchContext: (target) => send({
    mock: async () => (await mocks()).switchContext(target),
    api: () => http.post('/auth/context', target),
    ms: 150,
  }),

  /** Crea UNA cuenta de GO Puntos y la asocia al negocio del QR (joinSlug). */
  register: (data) => send({
    mock: async () => (await mocks()).register(data),
    api: () => http.post('/auth/register', data),
    write: true, ms: 700,
  }),

  /**
   * Alta de un comercio con una invitación válida: crea (o reutiliza) la cuenta,
   * el negocio en estado 'pendiente' y su solicitud, todavía sin enviar a revisión.
   */
  registerBusiness: (data) => send({
    mock: async () => (await mocks()).registerBusiness(data),
    api: () => http.post('/auth/register-business', data),
    write: true, ms: 700,
  }),

  /**
   * Pide el enlace de recuperación. La respuesta es siempre la misma exista o
   * no la cuenta, para no revelar qué emails están registrados.
   * En modo simulado no se envía ningún correo.
   */
  async requestPasswordReset(email) {
    if (!appConfig.useMocks) return http.post('/auth/forgot-password', { email });
    await wait(600);
    return { message: 'Si el email está registrado, te enviamos un enlace.' };
  },

  /** Cierra la sesión en el servidor (si existe). La sesión local la borra el store. */
  async logout() {
    if (appConfig.useMocks) return;
    try { await http.post('/auth/logout'); } catch { /* la sesión local se cierra igual */ }
  },

  updateProfile: (values) => send({
    mock: async () => (await mocks()).updateProfile(values),
    api: () => http.put('/me', values),
    write: true,
  }),

  /** Preferencias de la persona (modo claro, oscuro o automático). Viajan con su cuenta. */
  updatePreferences: (values) => send({
    mock: async () => (await mocks()).updatePreferences(values),
    api: () => http.put('/me/preferences', values),
    write: true, ms: 120,
  }),

  changePassword: (data) => send({
    mock: async () => (await mocks()).changePassword(data),
    api: () => http.put('/me/password', data),
    write: true,
  }),

  /**
   * SÓLO DEMO: borra los datos simulados para volver a generarlos.
   * Con la API real no hace nada (no existe en producción).
   */
  async resetDemo() {
    if (!appConfig.useMocks) return;
    const { mockDb } = await import('../mocks/db.js');
    mockDb.reset();
  },
};
