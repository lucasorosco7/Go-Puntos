<!--
  Layout del panel de la plataforma (Superadmin).
  - Mismo diseño que el panel del negocio (PanelShell), con la identidad
    de GO Puntos en el modo claro/oscuro/automático de la persona.
  - Menú propio: Dashboard, Solicitudes (con contador de pendientes de
    revisión), Negocios, Invitaciones y Auditoría.
  - El Superadmin no es personal de los negocios: no tiene accesos a sus paneles.
-->
<script setup>
import { computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import PanelShell from '../components/admin/PanelShell.vue';
import BaseIcon from '../components/base/BaseIcon.vue';
import GoLogo from '../components/brand/GoLogo.vue';
import { useSessionActions } from '../composables/useSessionActions.js';
import { PLATFORM_MENU } from '../config/navigation.js';
import { useAuthStore } from '../stores/auth.js';
import { usePlatformStore } from '../stores/platform.js';
import { applyBusinessTheme } from '../theme/theme.js';

const route = useRoute();
const auth = useAuthStore();
const store = usePlatformStore();
const { switchContext } = useSessionActions();

const activeKey = computed(() => route.meta.nav || route.name);
/** Opciones con su clave y el contador correspondiente (solicitudes en revisión). */
const menu = computed(() => PLATFORM_MENU.map((i) => (i.group ? i : {
  ...i, key: i.to.name, badge: i.badge ? store.summary?.kpis?.[i.badge] || 0 : 0,
})));
const currentLabel = computed(() => PLATFORM_MENU.find((i) => !i.group && i.to.name === activeKey.value)?.label || route.meta.title || '');

onMounted(() => {
  // Identidad de GO Puntos (sin paleta de negocio), respetando el modo de la persona
  applyBusinessTheme(null);
  store.refresh().catch(() => { /* cada vista muestra su propio error */ });
});
</script>

<template>
  <PanelShell :menu="menu" :active-key="activeKey" :current-label="currentLabel" role-label="Superadmin">
    <template #brand>
      <GoLogo tone="light" tagline />
    </template>
    <template #foot>
      <!-- La misma cuenta puede ser también cliente o personal de un negocio -->
      <button v-for="x in auth.access.staff" :key="x.businessId" type="button" class="admin-side__logout" @click="switchContext({ type: 'staff', businessId: x.businessId })">
        <BaseIcon name="store" :size="18" /> Ir a {{ x.businessName }}
      </button>
      <button v-if="auth.access.memberships" type="button" class="admin-side__logout" @click="switchContext({ type: 'cliente' })">
        <BaseIcon name="leaf" :size="18" /> Ver mis puntos como cliente
      </button>
    </template>
    <template #top-end>
      <span class="pill pill--sky"><BaseIcon name="shield-check" :size="13" /> Superadmin</span>
    </template>
    <router-view :key="`${String(route.name)}:${route.params.id ?? ''}`" />
  </PanelShell>
</template>
