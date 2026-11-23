/**
 * Paletas prediseñadas de GO Puntos.
 *
 * El negocio NO elige colores sueltos: elige una paleta y, opcionalmente,
 * una variante de acento. También puede crear UNA paleta personalizada a
 * partir de dos colores (paletteBuilder.js), que se valida igual. Cada paleta define todos los tokens de la
 * interfaz (marca, superficies, textos, bordes, acento, degradé de la
 * tarjeta de puntos, sombras) y está validada para contraste WCAG AA
 * (ver tests/paletas.test.js).
 *
 * Tokens de cada paleta (base):
 *   deep      fondo profundo (menú del panel, footer)
 *   primary   color de marca, botones          hover     hover de botones / texto positivo
 *   soft/soft2 superficies de apoyo            bg/bg2    fondo general y secundario
 *   text*     textos                           line*     bordes
 *   gradA/B   degradé de la tarjeta de puntos  onDark*   textos sobre fondos oscuros
 *   neutral, neutral2, track: grises tenidos de la paleta
 *   shadow    tinte de las sombras (r g b)
 * Variantes: accent, accentHover, accentSoft, accentInk.
 */

import { darkTokens } from './darkMode.js';
import { buildCustomPalette, CUSTOM_PALETTE_ID } from './paletteBuilder.js';

export const PALETTES = [
  {
    id: 'bosque', name: 'Bosque', description: 'Verde oscuro, salvia, crema y miel. Natural y cálida.',
    base: {
      deep: '#102a1e', primary: '#1f4d3a', hover: '#2a6a4f', soft: '#dcebd2', soft2: '#edf4e7',
      bg: '#f1efe6', bg2: '#faf9f4', text: '#15261d', textMuted: '#5f6e64', textSubtle: '#86928a',
      line: '#e7e3d5', lineSoft: '#efece2', gradA: '#2e7457', gradB: '#123424',
      onDark: '#b7d3c1', onDarkSoft: '#d6e6cc', neutral: '#efede5', neutral2: '#e7e4d8', track: '#ece9de',
      shadow: '16 42 30',
    },
    variants: [
      { id: 'miel', name: 'Miel', accent: '#e6a73a', accentHover: '#efb552', accentSoft: '#fcefd3', accentInk: '#855609' },
      { id: 'coral', name: 'Coral', accent: '#ec8b62', accentHover: '#f29b76', accentSoft: '#fde5da', accentInk: '#9a3d17' },
    ],
  },
  {
    id: 'oceano', name: 'Océano', description: 'Azul profundo, celeste, blanco y turquesa. Fresca y confiable.',
    base: {
      deep: '#0b2540', primary: '#1d4e89', hover: '#255da0', soft: '#d6e6f5', soft2: '#eaf2fa',
      bg: '#eef3f7', bg2: '#f8fafc', text: '#0f1d2b', textMuted: '#546576', textSubtle: '#7f8d9b',
      line: '#dbe4ec', lineSoft: '#e7edf3', gradA: '#2f6fb5', gradB: '#0f2d52',
      onDark: '#b9d3ee', onDarkSoft: '#d6e5f5', neutral: '#e6ecf2', neutral2: '#dde5ee', track: '#e2e8ef',
      shadow: '11 37 64',
    },
    variants: [
      { id: 'turquesa', name: 'Turquesa', accent: '#2fb8aa', accentHover: '#45c6b9', accentSoft: '#d5f2ee', accentInk: '#0c645b' },
      { id: 'arena', name: 'Arena', accent: '#e9b872', accentHover: '#f0c688', accentSoft: '#fbeed9', accentInk: '#80520f' },
    ],
  },
  {
    id: 'terracota', name: 'Terracota', description: 'Terracota, beige, marrón y crema. Artesanal y acogedora.',
    base: {
      deep: '#3a1d12', primary: '#9c4529', hover: '#b0543a', soft: '#f1dccf', soft2: '#f8ece4',
      bg: '#f5ede3', bg2: '#fbf7f2', text: '#2b1a12', textMuted: '#6e5947', textSubtle: '#998472',
      line: '#e8dccd', lineSoft: '#f0e7dc', gradA: '#bd6645', gradB: '#5a2816',
      onDark: '#f7dccc', onDarkSoft: '#f9e6db', neutral: '#efe6da', neutral2: '#e8ddcf', track: '#ebe2d6',
      shadow: '58 29 18',
    },
    variants: [
      { id: 'mostaza', name: 'Mostaza', accent: '#dcaa5c', accentHover: '#e5b970', accentSoft: '#f7e8cd', accentInk: '#7a4f12' },
      { id: 'oliva', name: 'Oliva', accent: '#a9b25a', accentHover: '#b8c06d', accentSoft: '#eef0d6', accentInk: '#555b1c' },
    ],
  },
  {
    id: 'violeta', name: 'Violeta', description: 'Violeta profundo, lavanda, blanco y un acento cálido.',
    base: {
      deep: '#1f1236', primary: '#5b3a9b', hover: '#6a48ad', soft: '#e4dcf4', soft2: '#f1ecfa',
      bg: '#f3f0f8', bg2: '#faf8fd', text: '#1c1429', textMuted: '#645a78', textSubtle: '#9087a0',
      line: '#e3ddee', lineSoft: '#ece8f3', gradA: '#7650bd', gradB: '#2b1a4f',
      onDark: '#d3c7ee', onDarkSoft: '#e3dbf4', neutral: '#ebe7f2', neutral2: '#e3deed', track: '#e7e3ef',
      shadow: '31 18 54',
    },
    variants: [
      { id: 'durazno', name: 'Durazno', accent: '#f2a65a', accentHover: '#f5b574', accentSoft: '#fde9d4', accentInk: '#8a4a0b' },
      { id: 'rosa', name: 'Rosa', accent: '#f08cb0', accentHover: '#f4a1bf', accentSoft: '#fce3ec', accentInk: '#9c2656' },
    ],
  },
  {
    id: 'grafito', name: 'Grafito', description: 'Negro, grises y blanco con un acento vibrante. Moderna y sobria.',
    base: {
      deep: '#111315', primary: '#2a2e33', hover: '#3b4148', soft: '#e3e5e8', soft2: '#f0f1f3',
      bg: '#f2f2f0', bg2: '#fafaf9', text: '#16181b', textMuted: '#5c6168', textSubtle: '#878c93',
      line: '#e2e3e4', lineSoft: '#ebeced', gradA: '#4a515a', gradB: '#121416',
      onDark: '#c8ccd1', onDarkSoft: '#dde0e3', neutral: '#eaeaea', neutral2: '#e2e2e1', track: '#e6e6e5',
      shadow: '17 19 21',
    },
    variants: [
      { id: 'amarillo', name: 'Amarillo', accent: '#f2c14e', accentHover: '#f5cc6a', accentSoft: '#fbefcc', accentInk: '#735400' },
      { id: 'lima', name: 'Lima', accent: '#b5d64a', accentHover: '#c2df66', accentSoft: '#eef6d4', accentInk: '#4f6310' },
      { id: 'coral', name: 'Coral', accent: '#ff8a6b', accentHover: '#ff9d83', accentSoft: '#ffe4dc', accentInk: '#a1381b' },
    ],
  },
  {
    id: 'frambuesa', name: 'Frambuesa', description: 'Frambuesa, rosa suave, blanco y dorado. Dulce y enérgica.',
    base: {
      deep: '#3a0d1f', primary: '#a3264f', hover: '#b3305c', soft: '#f5d9e2', soft2: '#fbecf1',
      bg: '#f8f0f2', bg2: '#fdf8f9', text: '#2a1119', textMuted: '#735863', textSubtle: '#a08893',
      line: '#eedde3', lineSoft: '#f4e8ec', gradA: '#c23d69', gradB: '#5c1230',
      onDark: '#f5cbd9', onDarkSoft: '#f9dde6', neutral: '#f1e6ea', neutral2: '#eadde2', track: '#eee3e7',
      shadow: '58 13 31',
    },
    variants: [
      { id: 'dorado', name: 'Dorado', accent: '#f0bb5a', accentHover: '#f3c774', accentSoft: '#fcedd0', accentInk: '#7d5006' },
      { id: 'menta', name: 'Menta', accent: '#6fcf9f', accentHover: '#86d8af', accentSoft: '#dcf4e7', accentInk: '#1d6743' },
    ],
  },
];

/** Paleta con la que nace todo negocio (identidad de GO Puntos). */
export const DEFAULT_PALETTE = { paletteId: 'bosque', variantId: 'miel' };

/** Busca una paleta prediseñada y su variante (con valores por defecto si no existen). */
export function findPalette(paletteId, variantId) {
  const palette = PALETTES.find((p) => p.id === paletteId) || PALETTES[0];
  const variant = palette.variants.find((v) => v.id === variantId) || palette.variants[0];
  return { palette, variant };
}

/**
 * Paleta efectiva de un negocio: la personalizada (generada a partir de sus
 * dos colores) o una prediseñada.
 * @param {string} paletteId
 * @param {string} variantId
 * @param {{ primary, accent, name }|null} custom  paleta personalizada guardada en el negocio
 */
export function resolvePalette(paletteId, variantId, custom = null) {
  if (paletteId === CUSTOM_PALETTE_ID && custom?.primary && custom?.accent) {
    const built = buildCustomPalette(custom);
    return { palette: built.palette, variant: built.variant };
  }
  return findPalette(paletteId, variantId);
}

/**
 * Convierte paleta + variante en variables CSS para el modo pedido.
 * Son las mismas variables de src/assets/styles/tokens.css: por eso cambiar
 * de paleta o de modo no requiere tocar ningún componente.
 * @param {object} [o]
 * @param {object|null} [o.custom]  colores de la paleta personalizada
 * @param {'claro'|'oscuro'} [o.mode='claro']
 */
export function paletteVars(paletteId, variantId, { custom = null, mode = 'claro' } = {}) {
  const { palette: { base }, variant } = resolvePalette(paletteId, variantId, custom);
  const t = mode === 'oscuro' ? darkTokens(base, variant) : lightTokens(base, variant);
  return {
    '--deep': t.deep, '--brand': t.brand, '--forest': t.primary, '--forest-2': t.hover,
    '--sage': t.soft, '--sage-2': t.soft2, '--cream': t.bg, '--cream-2': t.bg2,
    '--honey': t.accent, '--honey-hover': t.accentHover, '--honey-2': t.accentSoft, '--honey-ink': t.accentInk,
    '--grad-a': t.gradA, '--grad-b': t.gradB, '--on-dark': t.onDark, '--on-dark-soft': t.onDarkSoft,
    '--neutral': t.neutral, '--neutral-2': t.neutral2, '--track': t.track, '--shadow-rgb': t.shadow,
    '--tomato': t.danger, '--tomato-2': t.dangerSoft, '--sky': t.sky, '--sky-ink': t.skyInk,
    // Roles semánticos: se repiten porque las variables CSS se resuelven donde se declaran
    '--bg': t.bg, '--surface': t.surface, '--surface-muted': t.bg2, '--text': t.text, '--text-muted': t.textMuted,
    '--text-subtle': t.textSubtle, '--text-inverse': t.textInverse, '--line': t.line, '--line-soft': t.lineSoft,
    '--primary': t.primary, '--primary-hover': t.hover, '--on-primary': t.onPrimary, '--on-danger': t.onDanger,
    '--danger': t.danger, '--error-bg': t.errorBg, '--success': t.success, '--success-2': t.successSoft,
    '--focus-ring': `0 0 0 2px ${t.bg}, 0 0 0 4px ${t.accent}`,
    '--art-glow': t.artGlow, '--art-snacks-bg': t.snacksBg, '--art-snacks-ink': t.snacksInk,
    'color-scheme': mode === 'oscuro' ? 'dark' : 'light',
  };
}

/** Tokens del modo claro: los de la paleta más los colores de estado fijos. */
function lightTokens(b, v) {
  return {
    ...b, brand: b.primary, surface: '#ffffff', textInverse: b.bg,
    accent: v.accent, accentHover: v.accentHover, accentSoft: v.accentSoft, accentInk: v.accentInk,
    onPrimary: '#ffffff', onDanger: '#ffffff',
    danger: '#c2533d', dangerSoft: '#f9e4de', errorBg: '#fffaf9', success: '#2f7a4f', successSoft: '#e3f1e7',
    sky: '#e3eef0', skyInk: '#2c5b66',
    artGlow: 'rgba(255, 255, 255, .55)', snacksBg: '#f3e4d2', snacksInk: '#8a5a2b',
  };
}

/** Variables como texto para un atributo style (vista previa acotada a un contenedor). */
export function paletteStyle(paletteId, variantId, options = {}) {
  return Object.entries(paletteVars(paletteId, variantId, options)).map(([k, val]) => `${k}:${val}`).join(';');
}
