/**
 * Configuración general de la aplicación GO Puntos.
 *
 * Acá sólo hay valores GLOBALES de la plataforma. Todo lo que cada
 * negocio personaliza (nombre, paleta, regla de puntos, niveles,
 * ranking, premio, etc.) llega desde los servicios como datos del negocio.
 *
 * Los valores pueden sobrescribirse con variables de entorno de Vite
 * (archivo .env), por ejemplo:
 *   VITE_USE_MOCKS=false
 *   VITE_API_URL=https://api.gopuntos.com.ar
 */

const env = import.meta.env || {};

export const appConfig = {
  // true  = la app funciona con el servidor simulado (src/mocks) y datos de prueba.
  // false = los services llaman a la API REST real (src/services/http.js).
  // Los componentes Vue no cambian en ninguno de los dos casos.
  useMocks: env.VITE_USE_MOCKS !== 'false',

  // Dirección base de la futura API REST.
  apiUrl: env.VITE_API_URL || 'http://localhost:5000/api',

  // Versión de los datos de prueba. Si cambia su estructura, se sube el número
  // y el navegador vuelve a generarlos (sólo afecta al modo mock).
  mockDataVersion: 1,

  // Demora simulada de la "red" en modo mock, para ver los estados de carga.
  mockLatencyMs: 350,

  // Negocio que muestra la página pública y al que se suma quien se registra
  // sin venir desde el QR de un comercio.
  defaultBusinessSlug: 'cv-dietetica',

  // Días que tiene un cliente para retirar una recompensa canjeada
  // (si el negocio no definió otro valor).
  redemptionDays: 30,
};
