<!--
  Layout sin menú para pantallas de foco: Mi código (QR para caja),
  Canje confirmado y la página pública para sumarse a un negocio.
  Con "client" resuelve antes el negocio activo del cliente.
-->
<script setup>
import SkeletonBlock from '../components/base/SkeletonBlock.vue';
import { useClientContext } from '../composables/useClientContext.js';

const props = defineProps({
  /** true en las pantallas privadas del cliente (Mi código, Canje). */
  client: Boolean,
});
const { ready } = useClientContext({ enabled: props.client });
</script>

<template>
  <router-view v-if="ready" />
  <!-- Mientras se resuelve el negocio activo -->
  <div v-else class="app">
    <main class="app__main" aria-busy="true"><SkeletonBlock height="320px" radius="28px" /></main>
  </div>
</template>
