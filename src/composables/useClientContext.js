/**
 * Prepara el contexto del cliente para las pantallas de la app:
 * carga sus negocios, resuelve el negocio activo (y su paleta) y el
 * contador de la campana. Lo usan los layouts del cliente; las vistas se
 * muestran cuando el negocio activo ya está resuelto ("ready").
 */
import { onMounted, ref, watch } from 'vue';
import { useCustomerStore } from '../stores/customer.js';
import { useNotificationStore } from '../stores/notification.js';

export function useClientContext({ enabled = true } = {}) {
  const customer = useCustomerStore();
  const notifications = useNotificationStore();
  const ready = ref(!enabled || customer.loaded);
  if (!enabled) return { ready, customer };

  onMounted(async () => {
    try {
      if (!customer.loaded) await customer.load();
    } catch { /* sin negocios: cada vista muestra su estado vacío */ }
    ready.value = true;
    notifications.refresh();
  });

  // Al cambiar de negocio se actualiza la campana (las notificaciones son por negocio)
  watch(() => customer.version, () => notifications.refresh());

  return { ready, customer };
}
