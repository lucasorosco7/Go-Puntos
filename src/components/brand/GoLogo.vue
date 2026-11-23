<!--
  Marca de GO Puntos (la plataforma, no el negocio).
  tone: 'dark' (fondo claro) o 'light' (fondo oscuro, ej. menú del panel).
  tagline: true = "Programa de puntos", o un texto propio.
-->
<script setup>
import { computed } from 'vue';

const props = defineProps({
  tone: { type: String, default: 'dark' },
  tagline: { type: [Boolean, String], default: false },
  size: { type: Number, default: 38 },
  /** Sólo el isotipo, sin el nombre. */
  markOnly: Boolean,
});
const bg = computed(() => (props.tone === 'light' ? '#f1efe6' : '#1f4d3a'));
const arc = computed(() => (props.tone === 'light' ? '#1f4d3a' : '#f1efe6'));
</script>

<template>
  <!-- Isotipo: hoja dentro de un arco (colores fijos de la marca GO Puntos) -->
  <svg v-if="markOnly" :width="size" :height="size" viewBox="0 0 64 64" aria-hidden="true" focusable="false">
    <rect width="64" height="64" rx="18" :fill="bg" />
    <path d="M32 15.5a16.5 16.5 0 1 1-16.5 16.5" fill="none" :stroke="arc" stroke-width="5.5" stroke-linecap="round" />
    <circle cx="15.5" cy="32" r="3.6" fill="#e6a73a" />
    <path d="M32 22c5.6 3.4 6.3 11.2 0 19.4-6.3-8.2-5.6-16 0-19.4z" fill="#e6a73a" />
  </svg>
  <span v-else class="logo" :class="`logo--${tone}`">
    <svg :width="size" :height="size" viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <rect width="64" height="64" rx="18" :fill="bg" />
      <path d="M32 15.5a16.5 16.5 0 1 1-16.5 16.5" fill="none" :stroke="arc" stroke-width="5.5" stroke-linecap="round" />
      <circle cx="15.5" cy="32" r="3.6" fill="#e6a73a" />
      <path d="M32 22c5.6 3.4 6.3 11.2 0 19.4-6.3-8.2-5.6-16 0-19.4z" fill="#e6a73a" />
    </svg>
    <span class="logo__text">
      <span class="logo__name">GO Puntos</span>
      <span v-if="tagline" class="logo__tagline">{{ tagline === true ? 'Programa de puntos' : tagline }}</span>
    </span>
  </span>
</template>
