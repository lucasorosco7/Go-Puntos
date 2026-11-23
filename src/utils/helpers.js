/**
 * Funciones auxiliares genéricas (sin relación con la interfaz).
 */

/** Copia profunda de datos serializables (objetos planos, listas, fechas en ISO). */
export const clone = (o) => JSON.parse(JSON.stringify(o));

/** Suma una lista aplicando una función a cada elemento. */
export const sum = (arr, fn = (x) => x) => arr.reduce((a, x) => a + fn(x), 0);

/** Agrupa una lista: groupBy(movimientos, (m) => m.type) → { compra: [...], canje: [...] } */
export function groupBy(arr, fn) {
  return arr.reduce((acc, x) => {
    const k = fn(x);
    (acc[k] ||= []).push(x);
    return acc;
  }, {});
}

/**
 * Código aleatorio legible, sin caracteres que se confunden al dictarlo
 * (0/O, 1/I/L). Se usa para los códigos de canje.
 */
export function randomCode(len = 4) {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

/** Ejecuta fn recién cuando dejan de llamarla durante "ms" milisegundos (búsquedas, vistas previas). */
export function debounce(fn, ms = 200) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

/** Texto sin tildes y en minúsculas, para búsquedas. */
export const normalize = (text) => String(text || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
