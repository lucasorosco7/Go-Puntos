/**
 * Store de autenticación y contexto de GO Puntos.
 *
 * Una persona tiene UNA cuenta y puede usarla con distintos "sombreros":
 *   - contexto cliente: ve sus puntos en los negocios donde participa;
 *   - contexto staff:   opera el panel de UN negocio con el rol que tiene
 *                       ahí (owner = dueño, admin = administrador, empleado).
 * El rol depende del contexto activo, NUNCA es un dato global del usuario.
 *
 * Este store guarda la sesión (con services/session.js), expone getters
 * de permisos para el router y la interfaz, y resuelve el cambio de
 * contexto. Las vistas no tocan el almacenamiento del navegador.
 */
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { authService } from '../services/authService.js';
import { session } from '../services/session.js';
import { resetTheme } from '../theme/theme.js';

/** Orden de preferencia para elegir el contexto inicial al ingresar. */
const ROLE_ORDER = ['owner', 'admin', 'empleado'];

export const useAuthStore = defineStore('auth', () => {
  /** Sesión completa: { token, user, context, access, activeBusinessId } */
  const state = ref(session.get());
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
  function persist(next, remember) {
    state.value = next;
    session.save(next, remember);
  }
  function patch(partial) {
    state.value = { ...state.value, ...partial };
    session.update(partial);
  }

  /**
   * Pantalla de inicio de un contexto:
   *   cliente → Mis puntos · dueño/administrador → Dashboard · empleado → Caja
   */
  function homeFor(ctx = context.value) {
    if (ctx?.type === 'staff') return ctx.role === 'empleado' ? { name: 'admin-cashier' } : { name: 'admin-dashboard' };
    if (ctx?.type === 'cliente') return { name: 'client-points' };
    return { name: 'landing' };
  }

  /* ---------- Acciones ---------- */

  /**
   * Ingresa con email y contraseña. Si la cuenta tiene un rol en algún
   * negocio entra a ese panel (dueño primero); si no, como cliente en el
   * primer negocio donde participa.
   * @returns {object} el contexto inicial
   */
  async function login({ email, password, remember = true }) {
    const r = await authService.login({ email, password });
    const first = [...r.access.staff].sort((a, b) => ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role))[0];
    const ctx = first ? { type: 'staff', businessId: first.businessId, role: first.role } : { type: 'cliente' };
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
   * target: { type: 'cliente' } o { type: 'staff', businessId }
   * El servidor confirma el rol real en ese negocio.
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
    state, leaving, isAuthenticated, user, context, access, isClient, isStaff, staffRole, isAdmin, isOwner, isEmployee,
    panelBusinessId, activeBusinessId, homeFor, login, register, registerBusiness, switchContext, refreshAccess,
    setActiveBusiness, setUser, logout, reload,
  };
});
