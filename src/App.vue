<!--
  Componente raíz de GO Puntos.
  Sólo monta la ruta actual (cada ruta trae su layout) y los dos
  servicios globales de interfaz: avisos breves y confirmaciones.
-->
<script setup>
import ConfirmHost from './components/base/ConfirmHost.vue';
import ToastHost from './components/base/ToastHost.vue';
</script>

<template>
  <router-view />
  <ToastHost />
  <ConfirmHost />
</template>
