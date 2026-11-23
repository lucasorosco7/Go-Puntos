<!--
  Interruptor accesible (checkbox con role="switch").
  Se usa en la configuración del negocio y en los editores.
-->
<script setup>
const model = defineModel({ type: Boolean, default: false });
defineProps({
  name: { type: String, default: '' },
  label: { type: String, required: true },
  hint: { type: String, default: '' },
});
</script>

<template>
  <label class="switch-row">
    <span class="switch-row__text">
      <span class="switch-row__label">{{ label }}</span>
      <span v-if="hint" class="switch-row__hint">{{ hint }}</span>
    </span>
    <input v-model="model" type="checkbox" role="switch" :name="name" class="switch" />
  </label>
</template>
