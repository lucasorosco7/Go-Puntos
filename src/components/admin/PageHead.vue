<!--
  Encabezado de página del panel: título, descripción y acciones (slot).
-->
<script setup>
defineProps({
  title: { type: String, required: true },
  description: { type: String, default: '' },
});
</script>

<template>
  <header class="page-head">
    <div>
      <h1 class="page-head__title">{{ title }}</h1>
      <p v-if="description" class="page-head__desc">{{ description }}</p>
    </div>
    <div v-if="$slots.default" class="page-head__actions"><slot /></div>
  </header>
</template>
