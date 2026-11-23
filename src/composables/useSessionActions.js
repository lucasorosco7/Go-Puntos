/**
 * Acciones de sesión que además navegan: cerrar sesión y cambiar de
 * contexto (cliente ↔ panel de un negocio) con la misma cuenta.
 * Las usan los layouts y el perfil.
 */
import { useRouter } from 'vue-router';
import { clearContextStores, useAuthStore } from '../stores/index.js';
import { toast } from './useToast.js';

export function useSessionActions() {
  const router = useRouter();
  const auth = useAuthStore();

  /**
   * Primero navega al ingreso (así las pantallas privadas se desmontan con
   * los datos todavía cargados) y después borra la sesión.
   */
  async function logout() {
    auth.leaving = true;
    try {
      await router.push({ name: 'login' });
      await auth.logout();
      clearContextStores();
    } finally {
      auth.leaving = false;
    }
  }

  /**
   * target: { type: 'cliente' } o { type: 'staff', businessId }
   * Lleva a la pantalla de inicio del nuevo contexto.
   */
  async function switchContext(target) {
    try {
      const ctx = await auth.switchContext(target);
      clearContextStores();
      router.push(auth.homeFor(ctx));
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  return { logout, switchContext };
}
