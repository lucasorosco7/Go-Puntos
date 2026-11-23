/**
 * Datos que necesitan las secciones de configuración del negocio:
 * negocio, niveles, recompensas, ofertas, desafíos y el estado de su
 * solicitud de alta ante la plataforma.
 * Al recargar también actualiza el store del negocio (nombre, logo y
 * paleta del menú lateral).
 */
import { shallowRef } from 'vue';
import { businessService } from '../services/businessService.js';
import { challengeService } from '../services/challengeService.js';
import { offerService } from '../services/offerService.js';
import { useBusinessStore } from '../stores/business.js';

export function useSettingsContext() {
  const ctx = shallowRef(null);
  const store = useBusinessStore();

  async function load() {
    const [mine, off, ch] = await Promise.all([businessService.getMine(), offerService.list(), challengeService.list()]);
    ctx.value = { business: mine.business, levels: mine.levels, rewards: mine.rewards, offers: off.offers, challenges: ch.challenges, platform: mine.platform };
    store.setFull(mine);
    return ctx.value;
  }

  return { ctx, load };
}
