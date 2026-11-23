/**
 * Generador de paletas personalizadas (guiado).
 *
 * Regla del proyecto: el negocio no elige cada color suelto. Elige SÓLO
 * dos colores (principal y de acento) y este generador arma la paleta
 * completa (fondos, superficies, textos, bordes, degradé, sombras y modo
 * oscuro) con la misma forma que las paletas prediseñadas.
 * Si algún color no es legible, se ajusta automáticamente (más oscuro o
 * más claro) y se informa qué se cambió. Así toda paleta guardada cumple
 * los controles de checks.js.
 */
import { lightChecks } from './checks.js';
import { adjustUntil, contrast, isHex, mix, normalizeHex, rgbTriplet } from './color.js';

/** Identificadores reservados de la paleta personalizada. */
export const CUSTOM_PALETTE_ID = 'personalizada';
export const CUSTOM_VARIANT_ID = 'propia';

/**
 * Arma la paleta a partir de los dos colores elegidos.
 * @param {{ primary: string, accent: string, name?: string }} input
 * @returns {{ palette, variant, adjustments: string[], checks, ok: boolean }}
 */
export function buildCustomPalette({ primary, accent, name = 'Mi paleta' }) {
  if (!isHex(primary) || !isHex(accent)) throw new Error('Elegí un color principal y uno de acento válidos.');
  const inPrimary = normalizeHex(primary);
  const inAccent = normalizeHex(accent);
  const adjustments = [];

  // Color principal: el texto blanco de los botones (y del hover) tiene que leerse
  const p = adjustUntil(inPrimary, (c) => contrast('#ffffff', c) >= 4.6 && contrast('#ffffff', mix(c, '#ffffff', 0.1)) >= 4.6
    && contrast(c, mix(c, '#ffffff', 0.9)) >= 4.6, 'darken');
  if (p !== inPrimary) adjustments.push('Oscurecimos el color principal para que el texto blanco de los botones se lea bien.');
  const hover = mix(p, '#ffffff', 0.1);
  const deep = adjustUntil(mix(p, '#000000', 0.55), (c) => contrast('#ffffff', c) >= 7.2, 'darken');

  // Fondos y textos teñidos con el color principal (como las paletas prediseñadas)
  const bg = mix(p, '#ffffff', 0.93);
  const bg2 = mix(p, '#ffffff', 0.975);
  const text = adjustUntil(mix(deep, '#000000', 0.2), (c) => contrast(c, bg) >= 7.5, 'darken');
  const textMuted = adjustUntil(mix(text, bg, 0.5), (c) => contrast(c, bg) >= 4.8 && contrast(c, '#ffffff') >= 4.8, 'darken');
  const textSubtle = adjustUntil(mix(text, '#ffffff', 0.55), (c) => contrast(c, '#ffffff') >= 3.2, 'darken');
  const soft = mix(p, '#ffffff', 0.82);
  const soft2 = mix(p, '#ffffff', 0.9);
  const gradA = mix(p, '#ffffff', 0.12);
  const gradB = mix(p, '#000000', 0.55);
  const onDark = adjustUntil(mix(p, '#ffffff', 0.72), (c) => contrast(c, p) >= 4.8, 'lighten');
  const onDarkSoft = adjustUntil(mix(p, '#ffffff', 0.82), (c) => contrast(c, gradA) >= 3.2, 'lighten');

  // Acento: el texto oscuro sobre el botón de acento tiene que leerse
  const a = adjustUntil(inAccent, (c) => contrast(deep, c) >= 4.8, 'lighten');
  if (a !== inAccent) adjustments.push('Aclaramos el color de acento para que el texto de sus botones se lea bien.');
  const accentSoft = mix(a, '#ffffff', 0.8);
  const accentInk = adjustUntil(mix(a, '#000000', 0.4), (c) => contrast(c, accentSoft) >= 4.8 && contrast(c, '#ffffff') >= 4.8, 'darken');

  const base = {
    deep, primary: p, hover, soft, soft2, bg, bg2, text, textMuted, textSubtle,
    line: mix(text, bg, 0.88), lineSoft: mix(text, bg, 0.93), gradA, gradB, onDark, onDarkSoft,
    neutral: mix(text, bg, 0.92), neutral2: mix(text, bg, 0.89), track: mix(text, bg, 0.91), shadow: rgbTriplet(deep),
  };
  const variant = { id: CUSTOM_VARIANT_ID, name: 'Propia', accent: a, accentHover: mix(a, '#ffffff', 0.15), accentSoft, accentInk };
  const palette = {
    id: CUSTOM_PALETTE_ID, name: String(name || '').trim() || 'Mi paleta', description: 'Creada por el negocio a partir de dos colores.',
    base, variants: [variant], custom: true, input: { primary: inPrimary, accent: inAccent },
  };
  const checks = lightChecks(base, variant);
  return { palette, variant, adjustments, checks, ok: checks.every((c) => c.ok) };
}
