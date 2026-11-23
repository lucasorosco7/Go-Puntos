<!--
  Código QR. Dibuja en SVG la matriz que devuelve qrService.generate().
  Hoy el dibujo es ILUSTRATIVO (no escaneable); al reemplazar el
  generador por una librería real este componente no cambia.
-->
<script setup>
import { computed } from 'vue';
import { qrService } from '../../services/qrService.js';

const props = defineProps({
  /** Texto que contiene el QR (ej.: "GOPUNTOS:CV-000124" o una URL). */
  value: { type: String, required: true },
  size: { type: Number, default: 220 },
});
const m = computed(() => qrService.generate(props.value));
</script>

<template>
  <svg
    :viewBox="`-1.5 -1.5 ${m.size + 3} ${m.size + 3}`" :width="size" :height="size" role="img"
    :aria-label="`Código QR de ${value}`" shape-rendering="crispEdges" style="margin-inline: auto"
  >
    <rect x="-1.5" y="-1.5" :width="m.size + 3" :height="m.size + 3" rx="3" fill="#fff" />
    <g fill="#102a1e">
      <!-- Módulos de datos -->
      <rect v-for="([x, y], i) in m.cells" :key="i" :x="x" :y="y" width="1" height="1" />
      <!-- Patrones de posición (las tres esquinas) -->
      <g v-for="([x, y], i) in m.finders" :key="`f${i}`">
        <rect :x="x" :y="y" width="7" height="7" rx="1.5" />
        <rect :x="x + 1" :y="y + 1" width="5" height="5" rx="1" fill="#fff" />
        <rect :x="x + 2" :y="y + 2" width="3" height="3" rx=".6" />
      </g>
    </g>
  </svg>
</template>
