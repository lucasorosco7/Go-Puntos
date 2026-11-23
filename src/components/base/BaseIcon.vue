<!--
  Ícono de GO Puntos (Lucide).
  Recibe el nombre en formato kebab-case, igual que en la maqueta
  (por ejemplo "gift" o "shield-check"), y lo busca en el registro
  explícito de icons.js para que el bundle sólo incluya los que se usan.
  Si el nombre no está registrado muestra un círculo y avisa en desarrollo.
-->
<script setup>
import { computed } from 'vue';
import { icons } from './icons.js';

const props = defineProps({
  /** Nombre del ícono en kebab-case (ej.: "calendar-days"). */
  name: { type: String, required: true },
  /** Tamaño en píxeles. */
  size: { type: [Number, String], default: 20 },
  /** Grosor del trazo (la maqueta usa 2; algunos checks usan 3). */
  strokeWidth: { type: [Number, String], default: 2 },
  /** true = sin la clase "ic" (como los íconos sueltos de la landing de la maqueta). */
  bare: Boolean,
});

const component = computed(() => {
  const found = icons[props.name];
  if (!found && import.meta.env.DEV) console.warn(`[BaseIcon] Ícono no registrado: "${props.name}". Agregalo con: npm run iconos`);
  return found || icons.circle;
});
</script>

<template>
  <component :is="component" :size="size" :stroke-width="strokeWidth" :class="{ ic: !bare }" aria-hidden="true" focusable="false" />
</template>
