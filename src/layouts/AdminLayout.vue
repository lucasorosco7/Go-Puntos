<!--
  Layout del panel del negocio (dueño, administrador o empleado).
  - Menú lateral filtrado por el rol que la persona tiene en ESTE negocio
    (el empleado sólo ve Caja).
  - Identidad del negocio (logo, nombre) y su paleta aplicada.
  - Accesos de la misma cuenta: otros paneles y la app de cliente.
  - En el celular el menú se abre como cajón con fondo oscuro.
-->
<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import BaseIcon from '../components/base/BaseIcon.vue';
import UserAvatar from '../components/base/UserAvatar.vue';
import BusinessLogo from '../components/brand/BusinessLogo.vue';
import GoLogo from '../components/brand/GoLogo.vue';
import { useSessionActions } from '../composables/useSessionActions.js';
import { STAFF_ROLES } from '../config/catalogs.js';
import { ADMIN_MENU } from '../config/navigation.js';
import { useAuthStore } from '../stores/auth.js';
import { useBusinessStore } from '../stores/business.js';

const route = useRoute();
const auth = useAuthStore();
const store = useBusinessStore();
const { logout, switchContext } = useSessionActions();
const open = ref(false);

/** Opciones visibles para el rol actual, sin grupos vacíos. */
const visible = computed(() => {
  const items = ADMIN_MENU.filter((i) => i.group || i.roles.includes(auth.staffRole));
  return items.filter((i, idx) => !i.group || (items[idx + 1] && !items[idx + 1].group));
});

/** Clave de la opción activa (Personalización y Empleados son secciones de Configuración). */
const activeKey = computed(() => {
  const nav = route.meta.nav || route.name;
  if (nav === 'admin-settings' && ['identidad', 'empleados'].includes(route.params.section)) return `admin-settings:${route.params.section}`;
  return nav;
});
const keyOf = (i) => i.match || i.to.name;
const currentLabel = computed(() => ADMIN_MENU.find((i) => !i.group && keyOf(i) === activeKey.value)?.label || route.meta.title || '');

/** Otros paneles de la misma cuenta. */
const otherPanels = computed(() => auth.access.staff.filter((x) => x.businessId !== auth.panelBusinessId));

onMounted(() => { store.load().catch(() => { /* la vista muestra su propio error */ }); });
// Al cambiar de ruta se cierra el menú del celular
watch(() => route.fullPath, () => { open.value = false; });

function onKey(e) {
  if (e.key === 'Escape') open.value = false;
}
</script>

<template>
  <div class="admin-shell" @keydown="onKey">
    <a href="#contenido" class="skip-link">Saltar al contenido</a>
    <div class="admin-scrim" :class="{ 'is-visible': open }" aria-hidden="true" @click="open = false"></div>

    <!-- Menú lateral -->
    <aside id="admin-sidebar" class="admin-side" :class="{ 'is-open': open }">
      <div class="admin-side__brand">
        <!-- Identidad del negocio (mientras carga, la marca de GO Puntos) -->
        <div v-if="store.business" class="admin-brand">
          <BusinessLogo :business="store.business" :size="40" />
          <div>
            <p class="admin-brand__name">{{ store.business.name || 'Mi negocio' }}</p>
            <p class="admin-brand__by">con GO Puntos</p>
          </div>
        </div>
        <GoLogo v-else tone="light" tagline />
      </div>

      <nav aria-label="Secciones">
        <ul>
          <template v-for="(i, n) in visible" :key="n">
            <li v-if="i.group" class="admin-side__label">{{ i.group }}</li>
            <li v-else>
              <router-link :to="i.to" :class="{ 'is-on': keyOf(i) === activeKey }" :aria-current="keyOf(i) === activeKey ? 'page' : undefined">
                <BaseIcon :name="i.icon" :size="19" /><span>{{ i.label }}</span>
              </router-link>
            </li>
          </template>
        </ul>
      </nav>

      <!-- Persona, cambio de contexto y salida -->
      <div class="admin-side__foot">
        <div class="admin-side__user">
          <UserAvatar :user="auth.user" :size="36" />
          <div>
            <p>{{ auth.user.firstName }} {{ auth.user.lastName }}</p>
            <small>{{ STAFF_ROLES[auth.staffRole] || '' }}</small>
          </div>
        </div>
        <button
          v-for="x in otherPanels" :key="x.businessId" type="button" class="admin-side__logout"
          @click="switchContext({ type: 'staff', businessId: x.businessId })"
        >
          <BaseIcon name="store" :size="18" /> Ir a {{ x.businessName }}
        </button>
        <button v-if="auth.access.memberships" type="button" class="admin-side__logout" @click="switchContext({ type: 'cliente' })">
          <BaseIcon name="leaf" :size="18" /> Ver mis puntos como cliente
        </button>
        <button type="button" class="admin-side__logout" @click="logout"><BaseIcon name="log-out" :size="18" /> Cerrar sesión</button>
      </div>
    </aside>

    <div class="admin-main">
      <header class="admin-top">
        <button
          type="button" class="icon-btn admin-top__menu" aria-label="Abrir menú" :aria-expanded="String(open)"
          aria-controls="admin-sidebar" @click="open = true"
        >
          <BaseIcon name="menu" :size="21" />
        </button>
        <span class="muted">{{ currentLabel }}</span>
        <div class="admin-top__end">
          <!-- Aviso de programa en borrador (sólo dueño o administrador) -->
          <router-link
            v-if="store.business && store.business.status !== 'activo' && auth.isAdmin"
            :to="{ name: 'admin-onboarding' }" class="pill pill--honey"
          >
            <BaseIcon name="rocket" :size="13" /> Programa en borrador · Completar y activar
          </router-link>
        </div>
      </header>
      <main id="contenido" tabindex="-1">
        <!-- Las secciones de Configuración comparten la vista (no se recarga al cambiar de pestaña) -->
        <div id="page"><router-view :key="`${String(route.name)}:${route.params.id ?? ''}`" /></div>
      </main>
    </div>
  </div>
</template>
