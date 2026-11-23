/**
 * Utilidades de fechas y períodos de GO Puntos.
 *
 * Un PERÍODO es un mes con formato "AAAA-MM" (por ejemplo "2026-09").
 * Es la unidad del ranking mensual, de los niveles y del cierre mensual.
 * Todas las funciones son puras: reciben fechas y devuelven valores nuevos.
 */

/** Período ("AAAA-MM") al que pertenece una fecha. */
export function periodOf(date = new Date()) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** Período siguiente: "2026-12" → "2027-01". */
export function nextPeriod(period) {
  const [y, m] = period.split('-').map(Number);
  return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`;
}

/** Período anterior: "2026-01" → "2025-12". */
export function prevPeriod(period) {
  const [y, m] = period.split('-').map(Number);
  return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`;
}

/** Primer instante del período (día 1 a las 00:00, hora local). */
export const periodStart = (period) => new Date(`${period}-01T00:00:00`);

/** Último instante del período. */
export function periodEnd(period) {
  const d = periodStart(nextPeriod(period));
  d.setMilliseconds(-1);
  return d;
}

/** Días completos entre dos fechas (b - a). */
export const daysBetween = (a, b) => Math.floor((new Date(b) - new Date(a)) / 86400000);

export function startOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

/** Lunes de la semana de una fecha. Se usa como "clave de semana" en las rachas. */
export function weekStart(date = new Date()) {
  const d = startOfDay(date);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}

/** "AAAA-MM-DD" en hora local (claves de días y valores de <input type="date">). */
export function dayKey(date = new Date()) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Fecha ISO → valor de un <input type="date">. */
export const toInput = (date) => (date ? dayKey(date) : '');

/** Valor de un <input type="date"> → ISO (inicio o fin de ese día). */
export function fromInput(value, end = false) {
  if (!value) return null;
  return new Date(`${value}T${end ? '23:59:59' : '00:00:00'}`).toISOString();
}

/** Agrupación de todas las funciones, cómoda para importar como objeto. */
export const dates = {
  periodOf, nextPeriod, prevPeriod, periodStart, periodEnd, daysBetween,
  startOfDay, endOfDay, addDays, weekStart, key: dayKey, toInput, fromInput,
};
