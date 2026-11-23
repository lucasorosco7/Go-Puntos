/**
 * Store del cliente: negocios en los que participa y negocio activo.
 *
 * Una cuenta de cliente puede estar en varios negocios; cada uno guarda
 * por separado saldo, puntos del período, nivel, canjes, desafíos, rachas
 * y ranking. Este store sólo sabe CUÁL negocio se está mirando: los datos
 * de fidelización se piden a los services con ese negocio y nunca se mezclan.
 */
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { customerService } from '../services/customerService.js';
import { applyBusinessTheme } from '../theme/theme.js';
import { useAuthStore } from './auth.js';

export const useCustomerStore = defineStore('customer', () => {
  /** [{ membership, business, levelInfo }] */
  const memberships = ref([]);
  const loaded = ref(false);
  /** Cambia cada vez que se elige otro negocio: las vistas lo observan para recargar. */
  const version = ref(0);

  const auth = useAuthStore();

  /** Membresía del negocio activo (o la primera, si el activo ya no existe). */
  const current = computed(() => memberships.value.find((x) => x.business.id === auth.activeBusinessId) || memberships.value[0] || null);
  const business = computed(() => current.value?.business || null);

  /** Carga los negocios de la cuenta, corrige el negocio activo y aplica su paleta. */
  async function load() {
    memberships.value = await customerService.getMemberships();
    loaded.value = true;
    const cur = current.value;
    if (cur && cur.business.id !== auth.activeBusinessId) auth.setActiveBusiness(cur.business.id);
    if (cur) applyBusinessTheme(cur.business);
    return memberships.value;
  }

  /** Pasa a mirar otro negocio de la cuenta. */
  function switchTo(businessId) {
    auth.setActiveBusiness(businessId);
    if (business.value) applyBusinessTheme(business.value);
    version.value += 1;
  }

  /** Negocios activos a los que todavía no se sumó (para el selector). */
  async function discoverable() {
    const all = await customerService.getDiscoverable();
    return all.filter((b) => !memberships.value.some((x) => x.business.id === b.id));
  }

  /** Se suma a un negocio (QR del local) y lo deja como activo. */
  async function join(slug) {
    const r = await customerService.join(slug);
    await auth.refreshAccess();
    auth.setActiveBusiness(r.business.id);
    await load();
    version.value += 1;
    return r;
  }

  function clear() {
    memberships.value = [];
    loaded.value = false;
  }

  return { memberships, loaded, version, current, business, load, switchTo, discoverable, join, clear };
});
