<!--
  Pestañas del panel (reutilizan el estilo .chip).
  items: [[clave, etiqueta], ...] · v-model: clave activa.
-->
<script setup>
const model = defineModel({ type: String, required: true });
defineProps({
  items: { type: Array, required: true },
  label: { type: String, default: '' },
});
</script>

<template>
  <div class="chips tabs" role="tablist" :aria-label="label || undefined">
    <button
      v-for="[key, text] in items" :key="key" type="button" role="tab" class="chip"
      :class="{ 'is-on': key === model }" :aria-selected="key === model" @click="model = key"
    >{{ text }}</button>
  </div>
</template>
