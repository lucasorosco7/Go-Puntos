<!--
  Bloque de carga (esqueleto) mientras llegan los datos.
-->
<script setup>
defineProps({
  height: { type: String, required: true },
  width: { type: String, default: '100%' },
  radius: { type: String, default: '' },
});
</script>

<template>
  <span class="skeleton" :style="{ height, width, ...(radius && { borderRadius: radius }) }" aria-hidden="true"></span>
</template>
