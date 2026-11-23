/**
 * Stores de Pinia de GO Puntos.
 *
 * Sólo existen donde hay estado compartido entre pantallas:
 *   auth          sesión, contexto activo y permisos
 *   business      negocio del panel (nombre, paleta, estado)
 *   customer      negocios del cliente y negocio activo
 *   notification  contador de la campana
 * El resto de los datos los carga cada vista con los services.
 */
import { useAuthStore } from './auth.js';
import { useBusinessStore } from './business.js';
import { useCustomerStore } from './customer.js';
import { useNotificationStore } from './notification.js';

export { useAuthStore, useBusinessStore, useCustomerStore, useNotificationStore };

/** Limpia los stores que dependen del contexto (al cambiar de contexto o salir). */
export function clearContextStores() {
  useBusinessStore().clear();
  useCustomerStore().clear();
  useNotificationStore().clear();
}
