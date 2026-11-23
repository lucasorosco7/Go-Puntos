<!--
  Layout del panel del negocio (dueño, administrador o empleado).
  - Menú lateral filtrado por el rol que la persona tiene en ESTE negocio
    (el empleado sólo ve Caja).
  - Identidad del negocio (logo, nombre) y su paleta aplicada.
  - Accesos de la misma cuenta: otros paneles y la app de cliente.
  - Estado del negocio frente a la plataforma:
      pendiente (en preparación o en revisión), rechazado (con el motivo),
      suspendido (con el motivo) → aviso arriba del contenido;
      bloqueado → no se muestra el panel (el servidor también lo impide).
  La estructura visual (menú, cajón del celular, Apariencia) es la de PanelShell.
-->
<script setup>
import { computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import PanelShell from '../components/admin/PanelShell.vue';
import BaseAlert from '../components/base/BaseAlert.vue';
import BaseIcon from '../components/base/BaseIcon.vue';
import EmptyState from '../components/base/EmptyState.vue';
import BusinessLogo from '../components/brand/BusinessLogo.vue';
import GoLogo from '../components/brand/GoLogo.vue';
import { useSessionActions } from '../composables/useSessionActions.js';
import { STAFF_ROLES } from '../config/catalogs.js';
import { ADMIN_MENU } from '../config/navigation.js';
import { platform as Platform } from '../domain/platform.js';
import { format } from '../utils/format.js';
import { useAuthStore } from '../stores/auth.js';
import { useBusinessStore } from '../stores/business.js';

const route = useRoute();
const auth = useAuthStore();
const store = useBusinessStore();
const { switchContext } = useSessionActions();

const keyOf = (i) => i.match || i.to.name;

/** Opciones visibles para el rol actual, sin grupos vacíos. */
const visible = computed(() => {
  const items = ADMIN_MENU.filter((i) => i.group || i.roles.includes(auth.staffRole));
  return items.filter((i, idx) => !i.group || (items[idx + 1] && !items[idx + 1].group))
    .map((i) => (i.group ? i : { ...i, key: keyOf(i) }));
});

/** Clave de la opción activa (Personalización y Empleados son secciones de Configuración). */
const activeKey = computed(() => {
  const nav = route.meta.nav || route.name;
  if (nav === 'admin-settings' && ['identidad', 'empleados'].includes(route.params.section)) return `admin-settings:${route.params.section}`;
  return nav;
});
const currentLabel = computed(() => ADMIN_MENU.find((i) => !i.group && keyOf(i) === activeKey.value)?.label || route.meta.title || '');

/** Otros paneles de la misma cuenta. */
const otherPanels = computed(() => auth.access.staff.filter((x) => x.businessId !== auth.panelBusinessId));

/** El negocio fue bloqueado por la plataforma: el panel no está disponible. */
const blocked = computed(() => store.error?.details?.code === 'BUSINESS_BLOCKED');

/** Etapa de la solicitud de alta (preparacion | revision | aprobada | rechazada). */
const phase = computed(() => store.platform?.request?.phase || null);
const status = computed(() => store.business?.status || null);

/** Aviso de la barra superior según el estado del negocio. */
const topPill = computed(() => {
  if (!store.business || status.value === 'activo') return null;
  if (status.value === 'suspendido') return { tone: 'sky', icon: 'circle-pause', text: 'Negocio suspendido', short: 'Suspendido' };
  if (!auth.isAdmin) return { tone: 'honey', icon: 'hourglass', text: 'Programa todavía no aprobado', short: 'Sin aprobar' };
  if (status.value === 'rechazado') return { tone: 'danger', icon: 'circle-x', text: 'Solicitud rechazada · Ver motivo', short: 'Ver motivo del rechazo', to: { name: 'admin-onboarding' } };
  if (phase.value === 'revision') return { tone: 'honey', icon: 'hourglass', text: 'Solicitud en revisión', short: 'En revisión' };
  return { tone: 'honey', icon: 'rocket', text: 'Programa en preparación · Completar y enviar a revisión', short: 'Completar y enviar', to: { name: 'admin-onboarding' } };
});

/** Aviso sobre el contenido para estados que limitan la operación. */
const banner = computed(() => {
  const p = store.platform;
  if (!store.business || !p || route.name === 'admin-onboarding') return null;
  if (status.value === 'suspendido') {
    return {
      tone: 'info', title: `${store.business.name} está suspendido por la administración de GO Puntos`,
      text: `${p.statusReason?.detail ? `Motivo: ${Platform.sentence(p.statusReason.detail)}. ` : ''}Mientras tanto no se pueden registrar compras, canjes ni campañas. Los puntos de tus clientes se conservan.`,
    };
  }
  if (status.value === 'rechazado') {
    return { tone: 'error', title: 'GO Puntos rechazó la solicitud de alta', text: `Motivo: ${Platform.sentence(p.request?.reason) || 'sin detalle'}. Corregí lo indicado y volvé a enviarla desde la configuración inicial.` };
  }
  if (phase.value === 'revision') {
    return { tone: 'info', title: 'Tu solicitud está en revisión', text: `La enviaste el ${format.longDate(p.request.submittedAt)}. Cuando GO Puntos la apruebe vas a poder registrar compras y sumar clientes. Mientras tanto podés seguir ajustando tu programa.` };
  }
  return null;
});

onMounted(() => { store.load().catch(() => { /* la vista muestra su propio error */ }); });
</script>

<template>
  <PanelShell :menu="visible" :active-key="activeKey" :current-label="currentLabel" :role-label="STAFF_ROLES[auth.staffRole] || ''">
    <template #brand>
      <!-- Identidad del negocio (mientras carga, la marca de GO Puntos) -->
      <div v-if="store.business" class="admin-brand">
        <BusinessLogo :business="store.business" :size="40" />
        <div>
          <p class="admin-brand__name">{{ store.business.name || 'Mi negocio' }}</p>
          <p class="admin-brand__by">con GO Puntos</p>
        </div>
      </div>
      <GoLogo v-else tone="light" tagline />
    </template>

    <template #foot>
      <button
        v-for="x in otherPanels" :key="x.businessId" type="button" class="admin-side__logout"
        @click="switchContext({ type: 'staff', businessId: x.businessId })"
      >
        <BaseIcon name="store" :size="18" /> Ir a {{ x.businessName }}
      </button>
      <button v-if="auth.access.memberships" type="button" class="admin-side__logout" @click="switchContext({ type: 'cliente' })">
        <BaseIcon name="leaf" :size="18" /> Ver mis puntos como cliente
      </button>
    </template>

    <template #top-end>
      <!-- Estado del negocio frente a la plataforma -->
      <component :is="topPill.to ? 'router-link' : 'span'" v-if="topPill" :to="topPill.to" class="pill" :class="`pill--${topPill.tone}`">
        <BaseIcon :name="topPill.icon" :size="13" /> <span class="pill__long">{{ topPill.text }}</span><span class="pill__short">{{ topPill.short }}</span>
      </component>
    </template>

    <!-- Negocio bloqueado: el panel no está disponible -->
    <EmptyState
      v-if="blocked" icon="ban" title="Este negocio fue bloqueado"
      :text="`La administración de GO Puntos bloqueó el acceso al panel.${store.error.details.reason ? ` Motivo: ${store.error.details.reason}` : ''} Los datos y los puntos de los clientes se conservan.`"
    >
      <template #action>
        <button v-if="auth.access.memberships" type="button" class="btn btn--outline btn--sm" @click="switchContext({ type: 'cliente' })">Ver mis puntos como cliente</button>
      </template>
    </EmptyState>
    <template v-else>
      <div v-if="banner" style="margin-bottom: var(--sp-4)"><BaseAlert :tone="banner.tone" :title="banner.title" :text="banner.text" /></div>
      <!-- Las secciones de Configuración comparten la vista (no se recarga al cambiar de pestaña) -->
      <router-view :key="`${String(route.name)}:${route.params.id ?? ''}`" />
    </template>
  </PanelShell>
</template>
