/**
 * Router de GO Puntos (Vue Router, historial del navegador).
 *
 * Además de las guardias, después de cada navegación:
 *   - actualiza el título de la pestaña;
 *   - aplica la identidad visual: en el sitio público y el ingreso la de
 *     GO Puntos; en la app y el panel, la última paleta del negocio (los
 *     layouts la actualizan cuando llegan los datos del negocio).
 */
import { createRouter, createWebHistory } from 'vue-router';
import { resetTheme, restoreTheme } from '../theme/theme.js';
import { installGuards } from './guards.js';
import { routes } from './routes.js';

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, saved) {
    if (saved) return saved;
    if (to.hash) return { el: to.hash, behavior: 'smooth' };
    if (to.name === from.name && to.path === from.path) return false;
    return { top: 0 };
  },
});

installGuards(router);

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} | GO Puntos` : 'GO Puntos';
  if (to.meta.theme === 'default') resetTheme();
  else if (to.name !== 'join') restoreTheme();
});

export default router;
