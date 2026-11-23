/**
 * Servicio de códigos QR de GO Puntos.
 *
 * Separa las cuatro operaciones que hoy están simuladas y mañana usarán
 * librerías y endpoints reales, sin cambiar a quien las usa:
 *
 *   generate(value)         → matriz del QR a dibujar (QrCode.vue la pinta en SVG)
 *   createReader(video)     → lector de la cámara (Caja)
 *   identifyCustomer(text)  → cliente del negocio activo a partir del QR personal
 *   validateRedemption(code)→ entrega de un canje a partir de su código
 *
 * Contenido de los QR:
 *   QR personal del cliente:  "GOPUNTOS:<código de membresía>"  (ej. GOPUNTOS:CV-000124)
 *                             El código es por negocio: así la caja sabe dónde acreditar.
 *   QR público del negocio:   URL de /unirse/<slug>
 */
import { customerService } from './customerService.js';
import { rewardService } from './rewardService.js';

/** Prefijo del QR personal. */
export const QR_PREFIX = 'GOPUNTOS:';

export const qrService = {
  /** Texto que contiene el QR personal de un cliente en un negocio. */
  customerPayload: (membershipCode) => `${QR_PREFIX}${membershipCode}`,

  /** URL que contiene el QR público del negocio (registro o asociación de clientes). */
  businessJoinUrl: (slug) => `${typeof window !== 'undefined' ? window.location.origin : ''}/unirse/${slug}`,

  /**
   * Matriz del QR (true = módulo oscuro).
   * SIMULADO: genera un dibujo ILUSTRATIVO y estable para cada valor, con los
   * tres patrones de posición, pero NO es escaneable. Para producción se
   * reemplaza por una librería real (por ejemplo "qrcode") que devuelva la
   * misma estructura { size, cells, finders }.
   */
  generate(value) {
    const N = 25;
    let seed = [...String(value)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
    const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);
    const inFinder = (x, y) => (x < 8 && y < 8) || (x > N - 9 && y < 8) || (x < 8 && y > N - 9);
    const cells = [];
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (!inFinder(x, y) && rand() > 0.5) cells.push([x, y]);
    return { size: N, cells, finders: [[0, 0], [N - 7, 0], [0, N - 7]], simulated: true };
  },

  /**
   * Lector de QR con la cámara.
   * SIMULADO: no abre la cámara; la Caja ofrece ingresar el código a mano o
   * elegir un cliente de prueba. Para producción: usar BarcodeDetector (donde
   * exista) o una librería como "qr-scanner" y llamar a onResult(texto).
   * @returns {{ supported: boolean, start(onResult): Promise<void>, stop(): void }}
   */
  createReader() {
    return {
      supported: false,
      async start() { /* pendiente: cámara real */ },
      stop() { /* pendiente: cámara real */ },
    };
  },

  /** Normaliza el texto leído: acepta "GOPUNTOS:CV-000124" o "cv-000124". */
  parse: (text) => String(text || '').trim().toUpperCase().replace(new RegExp(`^${QR_PREFIX}`), ''),

  /** Identifica al cliente del negocio activo a partir del QR personal (o el código tipeado). */
  identifyCustomer(text) {
    return customerService.findByCode(this.parse(text));
  },

  /** Busca el canje por su código (QR o tipeado). La entrega se confirma con validateRedemption. */
  findRedemption: (code) => rewardService.findRedemption(String(code || '').trim().toUpperCase()),

  /** Valida (entrega) un canje a partir de su código. */
  validateRedemption: (code) => rewardService.validateRedemption(String(code || '').trim().toUpperCase()),
};
