<!--
  Configuración · Identidad visual. El negocio NO elige colores libres:
  elige una paleta profesional (Bosque, Océano, Terracota, Violeta,
  Grafito, Frambuesa) y una variante de acento. Todos los colores de la
  app se derivan de ella con contraste validado (WCAG AA).
  La vista previa cambia en vivo; al guardar se aplica a toda la app.
-->
<script setup>
import { computed, watch } from 'vue';
import { businessService } from '../../services/businessService.js';
import { useBusinessStore } from '../../stores/business.js';
import { findPalette, PALETTES } from '../../theme/palettes.js';
import BaseAlert from '../base/BaseAlert.vue';
import BaseIcon from '../base/BaseIcon.vue';
import PalettePreview from './PalettePreview.vue';
import { useSection } from './useSection.js';

const props = defineProps({ ctx: { type: Object, required: true } });
// Eventos comunes de las secciones (no todas los usan): pedir recarga del contexto o ir a otro paso
defineEmits(['reload', 'goto']);
const store = useBusinessStore();
const b = props.ctx.business;
const start = findPalette(b.paletteId, b.paletteVariant);
const { form, run } = useSection({ paletteId: start.palette.id, paletteVariant: start.variant.id });
const f = form.values;

const palette = computed(() => findPalette(f.paletteId).palette);
// Si la variante elegida no existe en la paleta nueva, se usa la primera
watch(() => f.paletteId, () => {
  if (!palette.value.variants.some((x) => x.id === f.paletteVariant)) f.paletteVariant = palette.value.variants[0].id;
});
const swatches = (p) => [p.base.deep, p.base.primary, p.base.soft, p.base.bg, p.variants[0].accent];

async function save() {
  const res = await run((x) => businessService.update({ paletteId: x.paletteId, paletteVariant: x.paletteVariant }));
  store.setBusiness(res); // aplica la paleta a todo el panel
  return res;
}
defineExpose({ save });
</script>

<template>
  <!-- Alerta general del formulario (mismo lugar que en la maqueta) -->
  <div><BaseAlert v-if="form.alert.value" v-bind="form.alert.value" /></div>
  <div class="settings-split">
    <div>
      <!-- Paletas -->
      <div class="palettes" role="radiogroup" aria-label="Paletas">
        <label v-for="p in PALETTES" :key="p.id" class="palette" :class="{ 'is-on': p.id === f.paletteId }">
          <input v-model="f.paletteId" type="radio" name="paletteId" :value="p.id" class="sr-only" />
          <span class="palette__swatches" aria-hidden="true"><i v-for="(c, i) in swatches(p)" :key="i" :style="{ background: c }"></i></span>
          <span class="palette__name">{{ p.name }}</span>
          <span class="palette__desc">{{ p.description }}</span>
        </label>
      </div>
      <!-- Variantes de acento -->
      <p class="group-title">Variante de acento</p>
      <div class="check-list">
        <label v-for="x in palette.variants" :key="x.id" class="check-chip">
          <input v-model="f.paletteVariant" type="radio" name="paletteVariant" :value="x.id" />
          <span><i class="dot" :style="{ background: x.accent }"></i>{{ x.name }}</span>
        </label>
      </div>
      <p class="small muted" style="margin-top: var(--sp-3)"><BaseIcon name="shield-check" :size="13" /> Las combinaciones están validadas para legibilidad (WCAG AA).</p>
    </div>
    <!-- Vista previa en vivo -->
    <div class="settings-aside">
      <p class="group-title" style="margin-top: 0">Vista previa en vivo</p>
      <div><PalettePreview :business="b" :palette-id="f.paletteId" :variant-id="f.paletteVariant" :levels="ctx.levels" /></div>
    </div>
  </div>
</template>
