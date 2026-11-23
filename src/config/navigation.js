/**
 * Navegación de GO Puntos.
 *
 * - APP_LINKS: rutas de la app que también usan los datos (por ejemplo,
 *   el enlace de una notificación). El backend real deberá guardar estos
 *   mismos caminos relativos en las notificaciones.
 * - CLIENT_TABS: las 4 pestañas del cliente. Ranking, desafíos, rachas y
 *   notificaciones se abren desde estas pantallas para no llenar el menú.
 * - ADMIN_MENU: menú lateral del panel. "roles" indica qué rol del
 *   personal del negocio ve cada opción (el empleado sólo opera la Caja).
 */

export const APP_LINKS = {
  home: '/app/puntos',
  rewards: '/app/recompensas',
  redemptions: '/app/recompensas?vista=canjes',
  offers: '/app/ofertas',
  profile: '/app/perfil',
  qr: '/app/codigo',
  history: '/app/movimientos',
  ranking: '/app/ranking',
  notifications: '/app/notificaciones',
};

export const CLIENT_TABS = [
  { to: { name: 'client-points' }, label: 'Mis puntos', icon: 'leaf' },
  { to: { name: 'client-rewards' }, label: 'Recompensas', icon: 'gift' },
  { to: { name: 'client-offers' }, label: 'Ofertas', icon: 'tag' },
  { to: { name: 'client-profile' }, label: 'Perfil', icon: 'user-round' },
];

const OWNER_ADMIN = ['owner', 'admin'];

export const ADMIN_MENU = [
  { group: 'Operación' },
  { to: { name: 'admin-dashboard' }, label: 'Dashboard', icon: 'chart-column', roles: OWNER_ADMIN },
  { to: { name: 'admin-cashier' }, label: 'Caja', icon: 'scan-line', roles: [...OWNER_ADMIN, 'empleado'] },
  { to: { name: 'admin-customers' }, label: 'Clientes', icon: 'users', roles: OWNER_ADMIN },
  { group: 'Programa' },
  { to: { name: 'admin-rewards' }, label: 'Recompensas', icon: 'package', roles: OWNER_ADMIN },
  { to: { name: 'admin-offers' }, label: 'Ofertas', icon: 'tag', roles: OWNER_ADMIN },
  { to: { name: 'admin-ranking' }, label: 'Ranking', icon: 'trophy', roles: OWNER_ADMIN },
  { to: { name: 'admin-challenges' }, label: 'Desafíos y rachas', icon: 'target', roles: OWNER_ADMIN },
  { to: { name: 'admin-campaigns' }, label: 'Campañas', icon: 'megaphone', roles: OWNER_ADMIN },
  { group: 'Negocio' },
  { to: { name: 'admin-settings', params: { section: 'negocio' } }, label: 'Configuración', icon: 'settings', roles: OWNER_ADMIN, match: 'admin-settings' },
  { to: { name: 'admin-settings', params: { section: 'identidad' } }, label: 'Personalización', icon: 'palette', roles: OWNER_ADMIN, match: 'admin-settings:identidad' },
  { to: { name: 'admin-settings', params: { section: 'empleados' } }, label: 'Empleados', icon: 'id-card', roles: OWNER_ADMIN, match: 'admin-settings:empleados' },
];
