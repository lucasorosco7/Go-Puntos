<!--
  Layout de la app del cliente: contenido + barra inferior de 4 pestañas
  (Mis puntos, Recompensas, Ofertas, Perfil). Ranking, movimientos y
  notificaciones se abren desde esas pantallas para no llenar el menú.
-->
<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import BaseIcon from '../components/base/BaseIcon.vue';
import SkeletonBlock from '../components/base/SkeletonBlock.vue';
import { useClientContext } from '../composables/useClientContext.js';
import { CLIENT_TABS } from '../config/navigation.js';

const route = useRoute();
const { ready, customer } = useClientContext();
/** Pestaña resaltada: la de la ruta o la que indica meta.tab (ej.: Ranking → Mis puntos). */
const activeTab = computed(() => route.meta.tab || route.name);
</script>

<template>
  <a href="#contenido" class="skip-link">Saltar al contenido</a>
  <div class="app">
    <main id="contenido" class="app__main" tabindex="-1">
      <!-- La clave incluye la versión del negocio activo: al cambiar de negocio la vista se vuelve a cargar -->
      <router-view v-if="ready" :key="`${route.path}#${customer.version}`" />
      <!-- Mientras se resuelve el negocio activo -->
      <div v-else class="stack" aria-busy="true">
        <SkeletonBlock height="190px" radius="28px" />
        <SkeletonBlock height="120px" radius="22px" />
      </div>
    </main>

    <!-- Barra de pestañas (abajo en el celular, arriba en escritorio) -->
    <nav class="tabbar" aria-label="Secciones">
      <router-link
        v-for="t in CLIENT_TABS" :key="t.to.name" :to="t.to"
        :class="{ 'is-on': activeTab === t.to.name }" :aria-current="activeTab === t.to.name ? 'page' : undefined"
      >
        <BaseIcon :name="t.icon" :size="21" /><span>{{ t.label }}</span>
      </router-link>
    </nav>
  </div>
</template>
