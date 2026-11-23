<!--
  Encabezado de pantalla de la app del cliente.
  - back: ruta para el botón "volver" (pantallas secundarias).
  - title / sub: título y subtítulo (por ejemplo, el negocio activo).
  - slot "end": acciones a la derecha (campana, saldo, "marcar leídas").
-->
<script setup>
import BaseIcon from './BaseIcon.vue';

defineProps({
  title: { type: String, required: true },
  sub: { type: String, default: '' },
  back: { type: [String, Object], default: null },
  backLabel: { type: String, default: 'Volver a mis puntos' },
  /** Título más chico (pantallas secundarias). */
  small: Boolean,
});
</script>

<template>
  <header class="screen-head">
    <router-link v-if="back" :to="back" class="icon-btn" :aria-label="backLabel"><BaseIcon name="arrow-left" :size="19" /></router-link>
    <div>
      <h1 class="screen-head__title" :style="small ? { fontSize: 'var(--fs-xl)' } : undefined">{{ title }}</h1>
      <p v-if="sub || $slots.sub" class="screen-head__sub"><slot name="sub">{{ sub }}</slot></p>
    </div>
    <div v-if="$slots.end" class="screen-head__end"><slot name="end" /></div>
  </header>
</template>
