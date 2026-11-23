<!--
  Página no encontrada: ofrece volver al inicio del contexto actual.
-->
<script setup>
import EmptyState from '../components/base/EmptyState.vue';
import { useAuthStore } from '../stores/auth.js';

const auth = useAuthStore();
</script>

<template>
  <div class="app">
    <main id="contenido" class="app__main">
      <EmptyState icon="map-pin" title="No encontramos esta página" text="Puede que el enlace esté mal escrito o que la página ya no exista." style="margin-top: var(--sp-7)">
        <template #action><router-link class="btn btn--sm" :to="auth.homeFor()">Ir al inicio</router-link></template>
      </EmptyState>
    </main>
  </div>
</template>
