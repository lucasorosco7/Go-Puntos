<!--
  Estructura común de los paneles de GO Puntos: menú lateral (cajón en el
  celular), barra superior, hoja de Apariencia y área de contenido.
  La usan:
    - AdminLayout     panel de un negocio (dueño, administrador, empleado)
    - PlatformLayout  panel de la plataforma (Superadmin)
  Cada layout decide qué opciones de menú mostrar y qué va en la marca, el
  pie y la barra superior (slots). Así el diseño es el mismo en los dos y
  no se duplica el código.

  Props:
    menu         opciones ya filtradas: { group } o { to, label, icon, key }
    activeKey    clave de la opción activa
    currentLabel texto de la barra superior
    roleLabel    rol que se muestra debajo del nombre de la persona
  Slots:
    brand        identidad (logo y nombre)
    foot         botones extra del pie (antes de Apariencia y Cerrar sesión)
    top-end      avisos a la derecha de la barra superior
    default      contenido de la página
-->
<script setup>
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useSessionActions } from '../../composables/useSessionActions.js';
import { useAuthStore } from '../../stores/auth.js';
import { THEME_MODES } from '../../theme/theme.js';
import BaseIcon from '../base/BaseIcon.vue';
import BaseSheet from '../base/BaseSheet.vue';
import ThemeModePicker from '../base/ThemeModePicker.vue';
import UserAvatar from '../base/UserAvatar.vue';

defineProps({
  menu: { type: Array, required: true },
  activeKey: { type: String, default: '' },
  currentLabel: { type: String, default: '' },
  roleLabel: { type: String, default: '' },
});

const route = useRoute();
const auth = useAuthStore();
const { logout } = useSessionActions();
const open = ref(false);
/** Hoja de Apariencia abierta. */
const appearance = ref(false);

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
      <div class="admin-side__brand"><slot name="brand" /></div>

      <nav aria-label="Secciones">
        <ul>
          <template v-for="(i, n) in menu" :key="n">
            <li v-if="i.group" class="admin-side__label">{{ i.group }}</li>
            <li v-else>
              <router-link :to="i.to" :class="{ 'is-on': i.key === activeKey }" :aria-current="i.key === activeKey ? 'page' : undefined">
                <BaseIcon :name="i.icon" :size="19" /><span>{{ i.label }}</span>
                <span v-if="i.badge" class="admin-side__badge" :aria-label="`${i.badge} pendientes`">{{ i.badge }}</span>
              </router-link>
            </li>
          </template>
        </ul>
      </nav>

      <!-- Persona, accesos de la misma cuenta y salida -->
      <div class="admin-side__foot">
        <div class="admin-side__user">
          <UserAvatar :user="auth.user" :size="36" />
          <div>
            <p>{{ auth.user.firstName }} {{ auth.user.lastName }}</p>
            <small>{{ roleLabel }}</small>
          </div>
        </div>
        <slot name="foot" />
        <!-- Apariencia (claro / oscuro / automático): preferencia de cada persona -->
        <button type="button" class="admin-side__logout" @click="appearance = true">
          <BaseIcon :name="auth.themeMode === 'oscuro' ? 'moon' : auth.themeMode === 'auto' ? 'monitor' : 'sun'" :size="18" /> Apariencia: {{ THEME_MODES[auth.themeMode] }}
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
        <div class="admin-top__end"><slot name="top-end" /></div>
      </header>
      <!-- Hoja para elegir el modo de la interfaz -->
      <BaseSheet v-if="appearance" title="Apariencia" description="Elegí cómo ver el panel. Automático sigue la configuración de tu equipo. Se guarda en tu cuenta." @close="appearance = false">
        <ThemeModePicker />
      </BaseSheet>
      <main id="contenido" tabindex="-1">
        <div id="page"><slot /></div>
      </main>
    </div>
  </div>
</template>
