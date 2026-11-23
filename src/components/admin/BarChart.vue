<!--
  Gráfico de barras de UNA sola serie (HTML + CSS, sin librerías).
  Un solo color (el primario del negocio): nunca depende de distinguir
  colores. Cada barra tiene tooltip al pasar el mouse o enfocarla y hay
  una tabla accesible con los mismos datos ("Ver como tabla").
-->
<script setup>
import { computed } from 'vue';
import { format } from '../../utils/format.js';

const props = defineProps({
  /** Datos: [{ label, ... }] */
  data: { type: Array, required: true },
  /** Función que devuelve el valor de cada dato. */
  value: { type: Function, required: true },
  label: { type: Function, default: (d) => d.label },
  fmt: { type: Function, default: (v) => format.points(v) },
  title: { type: String, default: '' },
  caption: { type: String, default: '' },
});
const max = computed(() => Math.max(1, ...props.data.map(props.value)));
/** Con muchas barras se muestran sólo algunas etiquetas del eje X. */
const step = computed(() => (props.data.length > 16 ? Math.ceil(props.data.length / 10) : 1));
const ticks = computed(() => [1, 0.5, 0].map((t) => ({ t, v: max.value * t })));
</script>

<template>
  <figure class="chart">
    <figcaption v-if="title" class="chart__title">{{ title }}</figcaption>
    <div class="chart__plot" :style="{ '--n': data.length }">
      <!-- Líneas guía con sus valores -->
      <div class="chart__grid" aria-hidden="true">
        <span v-for="k in ticks" :key="k.t" :style="{ bottom: `${k.t * 100}%` }"><i>{{ fmt(Math.round(k.v)) }}</i></span>
      </div>
      <!-- Barras -->
      <div class="chart__bars">
        <div v-for="(d, i) in data" :key="i" class="chart__col" tabindex="0" :aria-label="`${label(d)}: ${fmt(value(d))}`">
          <span class="chart__bar" :class="{ 'is-zero': !value(d) }" :style="{ height: `${(value(d) / max) * 100}%` }"></span>
          <span class="chart__tip" role="tooltip"><b>{{ fmt(value(d)) }}</b>{{ label(d) }}</span>
          <span class="chart__x" :aria-hidden="i % step ? 'true' : undefined" :data-hide="i % step ? '' : undefined">{{ label(d) }}</span>
        </div>
      </div>
    </div>
    <p v-if="caption" class="chart__caption">{{ caption }}</p>
    <!-- Alternativa accesible -->
    <details class="chart__table">
      <summary>Ver como tabla</summary>
      <table class="table table--compact">
        <tbody>
          <tr v-for="(d, i) in data" :key="i"><td>{{ label(d) }}</td><td class="num">{{ fmt(value(d)) }}</td></tr>
        </tbody>
      </table>
    </details>
  </figure>
</template>
