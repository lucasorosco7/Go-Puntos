<!--
  Configuración · Identidad visual (Personalización).
  El negocio no elige cada color suelto. Tiene dos caminos:
    - una paleta prediseñada (Bosque, Océano, Terracota, Violeta, Grafito,
      Frambuesa) con su variante de acento;
    - UNA paleta personalizada: elige sólo el color principal y el de
      acento, y el resto (fondos, textos, bordes, degradé, modo oscuro) se
      genera solo. Si algún color no es legible se ajusta automáticamente
      y se explica qué se cambió (theme/paletteBuilder.js).
  La vista previa se puede ver en claro y en oscuro: el modo lo elige cada
  persona en su perfil o en el panel, por eso la paleta tiene que verse
  bien en los dos.
-->
<script setup>
import { computed, ref, watch } from 'vue';
import { businessService } from '../../services/businessService.js';
import { useBusinessStore } from '../../stores/business.js';
import { darkChecks, lightChecks } from '../../theme/checks.js';
import { isHex, normalizeHex } from '../../theme/color.js';
import { darkTokens } from '../../theme/darkMode.js';
import { buildCustomPalette, CUSTOM_PALETTE_ID, CUSTOM_VARIANT_ID } from '../../theme/paletteBuilder.js';
import { findPalette, PALETTES, resolvePalette } from '../../theme/palettes.js';
import BaseAlert from '../base/BaseAlert.vue';
import BaseField from '../base/BaseField.vue';
import BaseIcon from '../base/BaseIcon.vue';
import PalettePreview from './PalettePreview.vue';
import { useSection } from './useSection.js';

const props = defineProps({ ctx: { type: Object, required: true } });
// Eventos comunes de las secciones (no todas los usan): pedir recarga del contexto o ir a otro paso
defineEmits(['reload', 'goto']);
const store = useBusinessStore();
const b = props.ctx.business;

/* ---------- Estado del formulario ---------- */
const savedCustom = b.customPalette || null;
const isCustomStart = b.paletteId === CUSTOM_PALETTE_ID && savedCustom;
const start = isCustomStart ? null : findPalette(b.paletteId, b.paletteVariant);
const { form, run } = useSection({
  paletteId: isCustomStart ? CUSTOM_PALETTE_ID : start.palette.id,
  paletteVariant: isCustomStart ? CUSTOM_VARIANT_ID : start.variant.id,
  // Colores de la paleta personalizada (con valores iniciales tomados de la paleta actual)
  customName: savedCustom?.name || 'Mi paleta',
  customPrimary: savedCustom?.primary || resolvePalette(b.paletteId, b.paletteVariant, savedCustom).palette.base.primary,
  customAccent: savedCustom?.accent || resolvePalette(b.paletteId, b.paletteVariant, savedCustom).variant.accent,
});
const f = form.values;
const isCustom = computed(() => f.paletteId === CUSTOM_PALETTE_ID);

/* ---------- Paletas prediseñadas ---------- */
const presetPalette = computed(() => (isCustom.value ? null : findPalette(f.paletteId).palette));
// Si la variante elegida no existe en la paleta nueva, se usa la primera
watch(() => f.paletteId, () => {
  if (isCustom.value) { f.paletteVariant = CUSTOM_VARIANT_ID; return; }
  if (!presetPalette.value.variants.some((x) => x.id === f.paletteVariant)) f.paletteVariant = presetPalette.value.variants[0].id;
});
const swatches = (base, accent) => [base.deep, base.primary, base.soft, base.bg, accent];

/* ---------- Paleta personalizada (generada en vivo) ---------- */
const colorsOk = computed(() => isHex(f.customPrimary) && isHex(f.customAccent));
const built = computed(() => (colorsOk.value
  ? buildCustomPalette({ primary: f.customPrimary, accent: f.customAccent, name: f.customName })
  : null));
/** Datos que se guardan (y que usa la vista previa). */
const customData = computed(() => (built.value
  ? { name: built.value.palette.name, primary: built.value.palette.base.primary, accent: built.value.variant.accent }
  : savedCustom));
const lightResult = computed(() => (built.value ? lightChecks(built.value.palette.base, built.value.variant) : []));
const darkResult = computed(() => (built.value ? darkChecks(darkTokens(built.value.palette.base, built.value.variant)) : []));
const passed = (list) => list.filter((c) => c.ok).length;

/** El selector de color nativo necesita siempre "#rrggbb". */
const pickerValue = (v) => (isHex(v) ? normalizeHex(v) : '#000000');
const hexError = (v) => (isHex(v) ? '' : 'Escribí un color como #1f4d3a.');

/* ---------- Vista previa ---------- */
const previewMode = ref('claro');

async function save() {
  const res = await run((x) => businessService.update(isCustom.value
    ? { paletteId: CUSTOM_PALETTE_ID, paletteVariant: CUSTOM_VARIANT_ID, customPalette: customData.value }
    : { paletteId: x.paletteId, paletteVariant: x.paletteVariant }));
  store.setBusiness(res.business); // aplica la paleta a todo el panel
  return res;
}
defineExpose({ save });
</script>

<template>
  <!-- Alerta general del formulario (mismo lugar que en la maqueta) -->
  <div><BaseAlert v-if="form.alert.value" v-bind="form.alert.value" /></div>
  <div class="settings-split">
    <div>
      <!-- Paletas: prediseñadas + la personalizada -->
      <div class="palettes" role="radiogroup" aria-label="Paletas">
        <label v-for="p in PALETTES" :key="p.id" class="palette" :class="{ 'is-on': p.id === f.paletteId }">
          <input v-model="f.paletteId" type="radio" name="paletteId" :value="p.id" class="sr-only" />
          <span class="palette__swatches" aria-hidden="true"><i v-for="(c, i) in swatches(p.base, p.variants[0].accent)" :key="i" :style="{ background: c }"></i></span>
          <span class="palette__name">{{ p.name }}</span>
          <span class="palette__desc">{{ p.description }}</span>
        </label>
        <!-- Paleta personalizada -->
        <label class="palette" :class="{ 'is-on': isCustom, 'palette--new': !built && !savedCustom }">
          <input v-model="f.paletteId" type="radio" name="paletteId" :value="CUSTOM_PALETTE_ID" class="sr-only" />
          <span v-if="built" class="palette__swatches" aria-hidden="true">
            <i v-for="(c, i) in swatches(built.palette.base, built.variant.accent)" :key="i" :style="{ background: c }"></i>
          </span>
          <span class="palette__name"><BaseIcon v-if="!built" name="plus" :size="16" /> {{ isCustom || savedCustom ? (f.customName || 'Mi paleta') : 'Crear mi paleta' }}</span>
          <span class="palette__desc">Elegís dos colores y el resto se arma solo, siempre legible.</span>
        </label>
      </div>

      <!-- Variantes de acento (paletas prediseñadas) -->
      <template v-if="!isCustom">
        <p class="group-title">Variante de acento</p>
        <div class="check-list">
          <label v-for="x in presetPalette.variants" :key="x.id" class="check-chip">
            <input v-model="f.paletteVariant" type="radio" name="paletteVariant" :value="x.id" />
            <span><i class="dot" :style="{ background: x.accent }"></i>{{ x.name }}</span>
          </label>
        </div>
      </template>

      <!-- Creador de la paleta personalizada -->
      <div v-else class="custom-palette">
        <BaseField v-model="f.customName" id-prefix="pal" name="customName" label="Nombre de la paleta" placeholder="Ej.: Colores de mi local" maxlength="30" />
        <div class="form-grid form-grid--2">
          <div class="color-pick">
            <input type="color" :value="pickerValue(f.customPrimary)" aria-label="Elegir el color principal" @input="f.customPrimary = $event.target.value" />
            <BaseField
              v-model="f.customPrimary" id-prefix="pal" name="customPrimary" label="Color principal" :error="hexError(f.customPrimary)"
              hint="Botones, enlaces y tarjeta de puntos." autocomplete="off"
            />
          </div>
          <div class="color-pick">
            <input type="color" :value="pickerValue(f.customAccent)" aria-label="Elegir el color de acento" @input="f.customAccent = $event.target.value" />
            <BaseField
              v-model="f.customAccent" id-prefix="pal" name="customAccent" label="Color de acento" :error="hexError(f.customAccent)"
              hint="Puntos, logros y el botón de mostrar el código." autocomplete="off"
            />
          </div>
        </div>
        <!-- Ajustes automáticos para que todo se lea -->
        <BaseAlert v-for="(a, i) in built?.adjustments || []" :key="i" tone="info" :text="a" />
        <!-- Resultado de los controles de legibilidad -->
        <details v-if="built" class="fold">
          <summary>
            <BaseIcon name="shield-check" :size="18" />
            Legible en claro ({{ passed(lightResult) }} de {{ lightResult.length }}) y en oscuro ({{ passed(darkResult) }} de {{ darkResult.length }})
            <BaseIcon name="chevron-down" :size="16" />
          </summary>
          <div class="fold__body">
            <p class="small muted">Mínimo WCAG AA: 4,5 para texto, 3 para textos grandes o tenues, 7 para el texto principal.</p>
            <ul class="checks-list">
              <li v-for="c in [...lightResult.map((x) => ({ ...x, mode: 'Claro' })), ...darkResult.map((x) => ({ ...x, mode: 'Oscuro' }))]" :key="c.mode + c.label" :class="{ 'is-bad': !c.ok }">
                <span>{{ c.mode }} · {{ c.label }}</span><span class="tabular">{{ String(c.ratio).replace('.', ',') }} : 1</span>
              </li>
            </ul>
          </div>
        </details>
      </div>

      <p class="small muted" style="margin-top: var(--sp-3)"><BaseIcon name="shield-check" :size="13" /> Las combinaciones están validadas para legibilidad (WCAG AA), en modo claro y oscuro.</p>
    </div>

    <!-- Vista previa en vivo (claro u oscuro) -->
    <div class="settings-aside">
      <p class="group-title" style="margin-top: 0">Vista previa en vivo</p>
      <div class="seg preview-mode" role="group" aria-label="Modo de la vista previa">
        <button type="button" :class="{ 'is-on': previewMode === 'claro' }" :aria-pressed="previewMode === 'claro'" @click="previewMode = 'claro'"><BaseIcon name="sun" :size="15" /> Claro</button>
        <button type="button" :class="{ 'is-on': previewMode === 'oscuro' }" :aria-pressed="previewMode === 'oscuro'" @click="previewMode = 'oscuro'"><BaseIcon name="moon" :size="15" /> Oscuro</button>
      </div>
      <div>
        <PalettePreview :business="b" :palette-id="f.paletteId" :variant-id="f.paletteVariant" :custom="customData" :mode="previewMode" :levels="ctx.levels" />
      </div>
      <p class="small muted" style="margin-top: var(--sp-2)">Cada persona elige si usa la app en claro u oscuro desde su perfil.</p>
    </div>
  </div>
</template>
