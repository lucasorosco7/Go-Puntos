<!--
  Ilustración de una recompensa u oferta: la imagen que cargó el negocio
  o, si no hay, un ícono sobre el color de su categoría.
  size: número en px o 'auto' (ancho completo, 76 px de alto).
-->
<script setup>
import { computed } from 'vue';
import { REWARD_CATEGORIES } from '../../config/catalogs.js';
import BaseIcon from '../base/BaseIcon.vue';

const props = defineProps({
  category: { type: String, default: 'general' },
  size: { type: [Number, String], default: 56 },
  iconSize: { type: Number, default: 24 },
  radius: { type: String, default: '' },
  image: { type: String, default: null },
});
const cat = computed(() => (REWARD_CATEGORIES[props.category] ? props.category : 'general'));
const style = computed(() => ({
  width: props.size === 'auto' ? '100%' : `${props.size}px`,
  height: props.size === 'auto' ? '76px' : `${props.size}px`,
  ...(props.radius && { borderRadius: props.radius }),
}));
</script>

<template>
  <span v-if="image" class="art art--img" :style="style" aria-hidden="true"><img :src="image" alt="" /></span>
  <span v-else class="art" :class="`art--${cat}`" :style="style" aria-hidden="true"><BaseIcon :name="REWARD_CATEGORIES[cat].icon" :size="iconSize" /></span>
</template>
