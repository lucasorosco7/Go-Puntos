/**
 * Store de autenticación y contexto de GO Puntos.
 *
 * Una persona tiene UNA cuenta y puede usarla con distintos "sombreros":
 *   - contexto cliente: ve sus puntos en los negocios donde participa;
 *   - contexto staff:   opera el panel de UN negocio con el rol que tiene
 *                       ahí (owner = dueño, admin = administrador, empleado);
 *   - contexto plataforma: Superadmin, administra GO Puntos (invitaciones,
 *                       solicitudes, negocios y auditoría). NO es personal de
 *                       los negocios ni entra a sus paneles.
 * El rol depende del contexto activo, NUNCA es un dato global del usuario.
 *
 * Este store guarda la sesión (con services/session.js), expone getters
 * de permisos para el router y la interfaz, y resuelve el cambio de
 * contexto. Las vistas no tocan el almacenamiento del navegador.
 */
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { appConfig } from '../config/app.config.js';
import { authService } from '../services/authService.js';
import { session } from '../services/session.js';
import { resetTheme, setThemeMode } from '../theme/theme.js';

/** Orden de preferencia para elegir el contexto inicial al ingresar. */
const ROLE_ORDER = ['owner', 'admin', 'empleado'];

/**
 * Sesión guardada al abrir la app.
 * En modo demostración, una sesión creada con otra versión de los datos de
 * prueba (o anterior a que se registrara la versión) se descarta: sus cuentas
 * pueden no existir o haber cambiado. Así nadie aparece con una sesión
 * "heredada": sólo queda iniciada la que la persona eligió recordar.
 */
function initialSession() {
  const saved = session.get();
  if (saved && appConfig.useMocks && saved.dataVersion !== appConfig.mockDataVersion) {
    session.clear();
    return null;
  }
  return saved;
}

export const useAuthStore = defineStore('auth', () => {
  /** Sesión completa: { token, user, context, access, activeBusinessId, dataVersion } */
  const state = ref(initialSession());
  /** true mientras se cierra la sesión: deja ir al ingreso antes de borrar los datos. */
  const leaving = ref(false);

  /* ---------- Getters ---------- */
  const isAuthenticated = computed(() => Boolean(state.value?.token && state.value?.user));
  const user = computed(() => state.value?.user || null);
  const context = computed(() => state.value?.context || null);
  /** Accesos de la cuenta: paneles por negocio y cantidad de membresías como cliente. */
  const access = computed(() => state.value?.access || { staff: [], memberships: 0 });
  const isClient = computed(() => context.value?.type === 'cliente');
  const isStaff = computed(() => context.value?.type === 'staff');
  /** Superadmin trabajando en el panel de la plataforma. */
  const isPlatform = computed(() => context.value?.type === 'plataforma');
  /** Rol en el negocio del panel: 'owner' | 'admin' | 'empleado' | null */
  const staffRole = computed(() => (isStaff.value ? context.value.role : null));
  /** El dueño tiene todos los permisos del administrador. */
  const isAdmin = computed(() => ['owner', 'admin'].includes(staffRole.value));
  const isOwner = computed(() => staffRole.value === 'owner');
  const isEmployee = computed(() => staffRole.value === 'empleado');
  /** Negocio del panel (contexto staff). */
  const panelBusinessId = computed(() => (isStaff.value ? context.value.businessId : null));
  /** Negocio que el cliente está mirando en la app (contexto cliente). */
  const activeBusinessId = computed(() => state.value?.activeBusinessId || null);

  /* ---------- Persistencia ---------- */
  function persist(data, remember) {
    // dataVersion: versión de los datos de prueba con la que se inició la sesión (ver initialSession)
    const next = { ...data, dataVersion: appConfig.mockDataVersion };
    state.value = next;
    session.save(next, remember);
    applyUserMode(next.user);
  }

  /** El modo claro/oscuro es de la persona: se aplica al ingresar en cualquier dispositivo. */
  function applyUserMode(u) {
    setThemeMode(u?.preferences?.mode || 'claro');
  }
  function patch(partial) {
    state.value = { ...state.value, ...partial };
    session.update(partial);
  }

  /**
   * Pantalla de inicio de un contexto:
   *   cliente → Mis puntos · dueño/administrador → Dashboard · empleado → Caja
   *   plataforma (Superadmin) → Dashboard de la plataforma
   */
  function homeFor(ctx = context.value) {
    if (ctx?.type === 'plataforma') return { name: 'platform-dashboard' };
    if (ctx?.type === 'staff') return ctx.role === 'empleado' ? { name: 'admin-cashier' } : { name: 'admin-dashboard' };
    if (ctx?.type === 'cliente') return { name: 'client-points' };
    return { name: 'landing' };
  }

  /* ---------- Acciones ---------- */

  /**
   * Ingresa con email y contraseña. Si la cuenta es Superadmin entra al
   * panel de la plataforma; si tiene un rol en algún negocio entra a ese
   * panel (dueño primero); si no, como cliente en el primer negocio donde participa.
   * @returns {object} el contexto inicial
   */
  async function login({ email, password, remember = true }) {
    const r = await authService.login({ email, password });
    const first = [...r.access.staff].sort((a, b) => ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role))[0];
    let ctx = first ? { type: 'staff', businessId: first.businessId, role: first.role } : { type: 'cliente' };
    if (r.access.platform) ctx = { type: 'plataforma' };
    persist({ token: r.token, user: r.user, context: ctx, access: r.access, activeBusinessId: r.memberships[0]?.businessId || null }, remember);
    return ctx;
  }

  /** Registro de cliente: queda en contexto cliente, en el negocio al que se sumó. */
  async function register(data) {
    const r = await authService.register(data);
    persist({ token: r.token, user: r.user, context: { type: 'cliente' }, access: r.access, activeBusinessId: r.membership?.businessId || null }, false);
    return r;
  }

  /** Alta de comercio: queda como dueño en el panel del negocio nuevo. */
  async function registerBusiness(data) {
    const r = await authService.registerBusiness(data);
    persist({ token: r.token, user: r.user, context: { type: 'staff', businessId: r.business.id, role: 'owner' }, access: r.access, activeBusinessId: null }, true);
    return r;
  }

  /**
   * Cambia de contexto con la misma cuenta.
   * target: { type: 'cliente' }, { type: 'staff', businessId } o { type: 'plataforma' }
   * El servidor confirma el rol real en ese negocio (o que sea Superadmin).
   */
  async function switchContext(target) {
    const r = await authService.switchContext(target);
    patch({ context: r.context, access: r.access });
    return r.context;
  }

  /** Actualiza los accesos (por ejemplo, después de sumarse a un negocio nuevo). */
  async function refreshAccess() {
    if (!context.value) return;
    const target = isStaff.value ? { type: 'staff', businessId: panelBusinessId.value } : { type: 'cliente' };
    const r = await authService.switchContext(target);
    patch({ access: r.access });
  }

  /** Negocio que mira el cliente (los datos de cada negocio se piden por separado). */
  function setActiveBusiness(id) {
    patch({ activeBusinessId: id ? Number(id) : null });
  }

  /** Datos de la cuenta actualizados (perfil). */
  function setUser(u) {
    patch({ user: u });
  }

  /** Modo elegido por la persona: 'claro' | 'oscuro' | 'auto'. */
  const themeMode = computed(() => user.value?.preferences?.mode || 'claro');

  /**
   * Cambia el modo claro/oscuro: se aplica al instante y se guarda en la
   * cuenta (así se respeta en todos sus dispositivos).
   */
  async function setMode(mode) {
    setThemeMode(mode);
    const saved = await authService.updatePreferences({ mode });
    patch({ user: { ...user.value, ...saved } });
  }

  /** Cierra la sesión y vuelve a la identidad visual de GO Puntos. */
  async function logout() {
    await authService.logout();
    session.clear();
    state.value = null;
    resetTheme({ forget: true });
  }

  /** Relee la sesión guardada (si otra pestaña la cambió). */
  function reload() {
    state.value = session.get();
  }

  return {
    state, leaving, isAuthenticated, user, context, access, isClient, isStaff, isPlatform, staffRole, isAdmin, isOwner, isEmployee,
    panelBusinessId, activeBusinessId, homeFor, login, register, registerBusiness, switchContext, refreshAccess,
    setActiveBusiness, setUser, themeMode, setMode, logout, reload,
  };
});
