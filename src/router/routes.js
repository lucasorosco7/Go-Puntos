/**
 * Rutas de GO Puntos.
 *
 * Cada grupo usa un layout distinto (componente padre):
 *   PublicLayout  sitio público (landing)
 *   AuthLayout    ingreso, registro, alta de comercio y recuperación
 *   ClientLayout  app del cliente con 4 pestañas
 *   BareLayout    pantallas sin menú (Mi código, Canje, Sumarse a un negocio)
 *   AdminLayout   panel del negocio
 *
 * meta:
 *   title      título de la pestaña del navegador
 *   auth       requiere sesión
 *   guestOnly  sólo sin sesión (login, registro)
 *   context    'cliente' | 'staff'  contexto activo requerido
 *   roles      roles del personal permitidos en ESTE negocio (owner, admin, empleado)
 *   theme      'default' = identidad de GO Puntos (sin paleta del negocio)
 *   tab / nav  qué pestaña o qué opción del menú se resalta
 *
 * Las vistas se cargan bajo demanda (import dinámico) para que el
 * celular descargue sólo lo que usa.
 */
import AdminLayout from '../layouts/AdminLayout.vue';
import AuthLayout from '../layouts/AuthLayout.vue';
import BareLayout from '../layouts/BareLayout.vue';
import ClientLayout from '../layouts/ClientLayout.vue';
import PublicLayout from '../layouts/PublicLayout.vue';

const OWNER_ADMIN = ['owner', 'admin'];
const ALL_STAFF = ['owner', 'admin', 'empleado'];

/** Secciones de Configuración (la URL usa el nombre en castellano). */
export const SETTINGS_SECTIONS = ['negocio', 'identidad', 'puntos', 'niveles', 'ranking', 'premio', 'desafios', 'notificaciones', 'empleados', 'qr'];

export const routes = [
  /* ---------- Sitio público ---------- */
  {
    path: '/',
    component: PublicLayout,
    children: [
      { path: '', name: 'landing', component: () => import('../views/public/LandingView.vue'), meta: { title: 'CV Dietética', theme: 'default' } },
    ],
  },

  /* ---------- Ingreso y registro ---------- */
  {
    path: '/',
    component: AuthLayout,
    meta: { guestOnly: true, theme: 'default' },
    children: [
      { path: 'ingresar', name: 'login', component: () => import('../views/auth/LoginView.vue'), meta: { title: 'Ingresar' } },
      { path: 'registro', name: 'register', component: () => import('../views/auth/RegisterView.vue'), meta: { title: 'Crear cuenta' } },
      { path: 'registro-negocio', name: 'register-business', component: () => import('../views/auth/RegisterBusinessView.vue'), meta: { title: 'Crear el programa de tu comercio' } },
      { path: 'recuperar', name: 'forgot', component: () => import('../views/auth/ForgotPasswordView.vue'), meta: { title: 'Recuperar contraseña' } },
    ],
  },

  /* ---------- Página del QR público de un negocio (con o sin sesión) ---------- */
  {
    path: '/unirse',
    component: BareLayout,
    children: [
      { path: ':slug', name: 'join', component: () => import('../views/public/JoinView.vue'), meta: { title: 'Sumate' } },
    ],
  },

  /* ---------- App del cliente: pantallas de foco sin menú ---------- */
  {
    path: '/app',
    component: BareLayout,
    props: { client: true },
    meta: { auth: true, context: 'cliente' },
    children: [
      { path: 'codigo', name: 'client-qr', component: () => import('../views/client/QrView.vue'), meta: { title: 'Mi código' } },
      { path: 'canje', name: 'client-redeemed', component: () => import('../views/client/RedemptionDoneView.vue'), meta: { title: 'Canje' } },
    ],
  },

  /* ---------- App del cliente: 4 pestañas ---------- */
  {
    path: '/app',
    component: ClientLayout,
    meta: { auth: true, context: 'cliente' },
    children: [
      { path: '', redirect: { name: 'client-points' } },
      { path: 'puntos', name: 'client-points', component: () => import('../views/client/PointsView.vue'), meta: { title: 'Mis puntos' } },
      { path: 'recompensas', name: 'client-rewards', component: () => import('../views/client/RewardsView.vue'), meta: { title: 'Recompensas' } },
      { path: 'ofertas', name: 'client-offers', component: () => import('../views/client/OffersView.vue'), meta: { title: 'Ofertas' } },
      { path: 'perfil', name: 'client-profile', component: () => import('../views/client/ProfileView.vue'), meta: { title: 'Perfil' } },
      { path: 'movimientos', name: 'client-movements', component: () => import('../views/client/MovementsView.vue'), meta: { title: 'Movimientos', tab: 'client-points' } },
      { path: 'ranking', name: 'client-ranking', component: () => import('../views/client/RankingView.vue'), meta: { title: 'Ranking', tab: 'client-points' } },
      { path: 'notificaciones', name: 'client-notifications', component: () => import('../views/client/NotificationsView.vue'), meta: { title: 'Notificaciones', tab: 'client-points' } },
    ],
  },

  /* ---------- Panel del negocio ---------- */
  {
    path: '/panel',
    component: AdminLayout,
    meta: { auth: true, context: 'staff' },
    children: [
      { path: '', name: 'admin-dashboard', component: () => import('../views/admin/DashboardView.vue'), meta: { title: 'Panel', roles: OWNER_ADMIN } },
      { path: 'caja', name: 'admin-cashier', component: () => import('../views/admin/CashierView.vue'), meta: { title: 'Caja', roles: ALL_STAFF } },
      { path: 'clientes', name: 'admin-customers', component: () => import('../views/admin/CustomersView.vue'), meta: { title: 'Clientes', roles: OWNER_ADMIN } },
      { path: 'clientes/:id(\\d+)', name: 'admin-customer', component: () => import('../views/admin/CustomerDetailView.vue'), meta: { title: 'Ficha del cliente', roles: OWNER_ADMIN, nav: 'admin-customers' } },
      { path: 'recompensas', name: 'admin-rewards', component: () => import('../views/admin/RewardsAdminView.vue'), meta: { title: 'Recompensas', roles: OWNER_ADMIN } },
      { path: 'ofertas', name: 'admin-offers', component: () => import('../views/admin/OffersAdminView.vue'), meta: { title: 'Ofertas', roles: OWNER_ADMIN } },
      { path: 'ranking', name: 'admin-ranking', component: () => import('../views/admin/RankingAdminView.vue'), meta: { title: 'Ranking', roles: OWNER_ADMIN } },
      { path: 'desafios', name: 'admin-challenges', component: () => import('../views/admin/ChallengesAdminView.vue'), meta: { title: 'Desafíos y rachas', roles: OWNER_ADMIN } },
      { path: 'campanas', name: 'admin-campaigns', component: () => import('../views/admin/CampaignsView.vue'), meta: { title: 'Campañas', roles: OWNER_ADMIN } },
      { path: 'configuracion', redirect: { name: 'admin-settings', params: { section: 'negocio' } } },
      {
        path: `configuracion/:section(${SETTINGS_SECTIONS.join('|')})`, name: 'admin-settings',
        component: () => import('../views/admin/SettingsView.vue'), meta: { title: 'Configuración', roles: OWNER_ADMIN },
      },
      { path: 'configuracion-inicial', name: 'admin-onboarding', component: () => import('../views/admin/OnboardingView.vue'), meta: { title: 'Configuración inicial', roles: OWNER_ADMIN, nav: 'admin-settings' } },
    ],
  },

  /* ---------- Compatibilidad con los enlaces de la maqueta HTML ---------- */
  { path: '/inicio.html', redirect: { name: 'client-points' } },
  { path: '/puntos.html', redirect: { name: 'client-points' } },
  { path: '/login.html', redirect: { name: 'login' } },
  { path: '/admin.html', redirect: { name: 'admin-dashboard' } },

  /* ---------- No encontrada ---------- */
  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('../views/NotFoundView.vue'), meta: { title: 'Página no encontrada', theme: 'default' } },
];
