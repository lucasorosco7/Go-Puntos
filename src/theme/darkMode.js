/**
 * Modo oscuro de GO Puntos.
 *
 * No hay una segunda paleta escrita a mano: los colores oscuros se derivan
 * de la paleta del negocio (prediseñada o personalizada) para conservar su
 * identidad. Después se ajustan solos hasta cumplir los controles de
 * legibilidad de checks.js → darkChecks().
 */
import { adjustUntil, contrast, mix, rgbTriplet } from './color.js';

/**
 * Tokens del modo oscuro.
 * @param {object} b  tokens base (modo claro) de la paleta
 * @param {object} v  variante de acento
 * @returns {object} tokens con los mismos nombres que usa paletteVars()
 */
export function darkTokens(b, v) {
  const bg = mix(b.deep, '#000000', 0.45);
  const surface = mix(b.deep, '#000000', 0.12);
  const text = adjustUntil(mix(b.bg, '#ffffff', 0.4), (c) => contrast(c, surface) >= 7.5, 'lighten');
  const textMuted = adjustUntil(mix(text, surface, 0.32), (c) => contrast(c, surface) >= 4.8, 'lighten');
  const textSubtle = adjustUntil(mix(text, surface, 0.5), (c) => contrast(c, surface) >= 3.2, 'lighten');

  // El color de marca se aclara: en oscuro se usa como texto, ícono y fondo de botón
  const primary = adjustUntil(b.primary, (c) => contrast(c, surface) >= 5 && contrast(c, mix(surface, c, 0.2)) >= 4.6, 'lighten');
  const hover = mix(primary, '#ffffff', 0.14);
  // Texto sobre el botón principal: un tono muy oscuro de la misma paleta
  const onPrimary = adjustUntil(mix(b.deep, '#000000', 0.35), (c) => contrast(c, primary) >= 5 && contrast(c, hover) >= 4.6, 'darken');

  const accent = adjustUntil(v.accent, (c) => contrast(b.deep, c) >= 4.6, 'lighten');
  const accentSoft = mix(surface, accent, 0.2);
  const accentInk = adjustUntil(accent, (c) => contrast(c, accentSoft) >= 4.6 && contrast(c, surface) >= 4.6, 'lighten');

  const danger = adjustUntil('#e0715b', (c) => contrast(c, surface) >= 4.6, 'lighten');
  const success = adjustUntil('#5fbf8b', (c) => contrast(c, surface) >= 4.6, 'lighten');
  const skyInk = adjustUntil('#8fc9d6', (c) => contrast(c, mix(surface, '#5aa7b8', 0.22)) >= 4.6, 'lighten');

  return {
    deep: mix(b.deep, '#000000', 0.2), brand: b.primary, primary, hover,
    soft: mix(surface, primary, 0.3), soft2: mix(surface, primary, 0.16),
    bg, bg2: mix(surface, text, 0.04), surface,
    text, textMuted, textSubtle,
    line: mix(surface, text, 0.14), lineSoft: mix(surface, text, 0.08),
    gradA: b.gradA, gradB: b.gradB, onDark: b.onDark, onDarkSoft: b.onDarkSoft,
    neutral: mix(surface, text, 0.1), neutral2: mix(bg, text, 0.12), track: mix(surface, text, 0.14),
    shadow: rgbTriplet(mix(b.deep, '#000000', 0.6)),
    accent, accentHover: mix(accent, '#ffffff', 0.15), accentSoft, accentInk,
    onPrimary, onDanger: onPrimary,
    danger, dangerSoft: mix(surface, danger, 0.18), errorBg: mix(surface, danger, 0.1),
    success, successSoft: mix(surface, success, 0.18),
    sky: mix(surface, '#5aa7b8', 0.22), skyInk,
    textInverse: text,
    artGlow: 'rgba(255, 255, 255, .06)', snacksBg: mix(surface, '#c98a4b', 0.22), snacksInk: '#e8b98a',
  };
}
