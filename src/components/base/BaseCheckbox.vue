<!--
  Casilla de verificación con el estilo de GO Puntos (ej.: "Recordar sesión").
-->
<script setup>
import BaseIcon from './BaseIcon.vue';

const model = defineModel({ type: Boolean, default: false });
defineProps({
  id: { type: String, required: true },
  label: { type: String, required: true },
});
</script>

<template>
  <label :for="id" class="checkbox">
    <input :id="id" v-model="model" type="checkbox" class="checkbox__input" />
    <span class="checkbox__box" aria-hidden="true"><BaseIcon name="check" :size="14" :stroke-width="3" /></span>
    <span>{{ label }}</span>
  </label>
</template>
