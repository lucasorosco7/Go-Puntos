/**
 * Servicio de notificaciones push de GO Puntos (preparado, todavía simulado).
 *
 * Hoy: pide permiso al navegador y muestra una notificación local de prueba.
 * Las notificaciones "reales" se ven en la campana (notificationService).
 *
 * Con backend (pasos previstos):
 *   1. registrar un service worker (public/sw.js);
 *   2. registration.pushManager.subscribe({ userVisibleOnly: true,
 *        applicationServerKey: VITE_VAPID_PUBLIC_KEY });
 *   3. POST /me/push-subscriptions { endpoint, keys }  (tabla suscripciones_push);
 *   4. el backend envía el push cuando crea una notificación y el negocio
 *      tiene activado notifications.push.
 *
 * La preferencia "activadas en este dispositivo" es un dato del navegador,
 * por eso se guarda localmente (no es información de fidelización).
 */
import { appConfig } from '../config/app.config.js';
import { ApiError } from './errors.js';
import { http } from './http.js';

const KEY = 'gopuntos:push';
const hasApi = () => typeof window !== 'undefined' && 'Notification' in window;

export const pushService = {
  /** ¿El navegador soporta notificaciones? */
  supported: hasApi,

  /** 'granted' | 'denied' | 'default' | 'unsupported' */
  permission: () => (hasApi() ? Notification.permission : 'unsupported'),

  /** Activadas en este dispositivo (preferencia + permiso concedido). */
  enabled() {
    try { return localStorage.getItem(KEY) === 'on' && this.permission() === 'granted'; } catch { return false; }
  },

  /** Pide permiso y, con backend, registra la suscripción del dispositivo. */
  async enable() {
    if (!hasApi()) throw new ApiError('Este navegador no permite notificaciones.', 0);
    const result = await Notification.requestPermission();
    if (result !== 'granted') {
      throw new ApiError('No diste permiso para mostrar notificaciones. Podés cambiarlo en la configuración del navegador.', 0);
    }
    try { localStorage.setItem(KEY, 'on'); } catch { /* sin almacenamiento */ }
    if (!appConfig.useMocks) {
      // Pendiente del backend: reemplazar por la suscripción real del service worker (pasos 1 a 3).
      await http.post('/me/push-subscriptions', { endpoint: 'pendiente' });
    }
    try { new Notification('GO Puntos', { body: 'Listo: te vamos a avisar de tus puntos, rachas y ofertas.' }); } catch { /* algunos móviles exigen service worker */ }
    return true;
  },

  /** Desactiva los avisos en este dispositivo. Con backend: DELETE /me/push-subscriptions/:id */
  disable() {
    try { localStorage.setItem(KEY, 'off'); } catch { /* sin almacenamiento */ }
  },
};
