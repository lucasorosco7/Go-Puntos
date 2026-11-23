<!--
  Campana: historial de notificaciones del negocio activo.
  Tocar una la marca como leída y abre la pantalla relacionada.
  También ofrece activar las notificaciones push en el teléfono.
-->
<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import BaseAlert from '../../components/base/BaseAlert.vue';
import BaseIcon from '../../components/base/BaseIcon.vue';
import BaseSheet from '../../components/base/BaseSheet.vue';
import EmptyState from '../../components/base/EmptyState.vue';
import ScreenHead from '../../components/base/ScreenHead.vue';
import SkeletonBlock from '../../components/base/SkeletonBlock.vue';
import NotificationItem from '../../components/loyalty/NotificationItem.vue';
import { useAsync } from '../../composables/useAsync.js';
import { toast } from '../../composables/useToast.js';
import { APP_LINKS } from '../../config/navigation.js';
import { notificationService } from '../../services/notificationService.js';
import { pushService } from '../../services/pushService.js';
import { useCustomerStore } from '../../stores/customer.js';
import { useNotificationStore } from '../../stores/notification.js';
import { daysBetween, startOfDay } from '../../utils/dates.js';
import { groupBy } from '../../utils/helpers.js';

const router = useRouter();
const customer = useCustomerStore();
const bell = useNotificationStore();
const filter = ref('todas');
const shown = ref(null);

const { data: items, error, run } = useAsync(() => notificationService.getAll());
onMounted(run);

const unread = computed(() => (items.value || []).filter((n) => !n.read).length);
const visible = computed(() => (items.value || []).filter((n) => (filter.value === 'no-leidas' ? !n.read : filter.value === 'negocio' ? n.source === 'campaña' : true)));

/** Agrupa por antigüedad: Hoy, Esta semana, Anteriores. */
const GROUPS = ['Hoy', 'Esta semana', 'Anteriores'];
function groupOf(n) {
  const days = daysBetween(startOfDay(n.createdAt), startOfDay(new Date()));
  if (days <= 0) return 'Hoy';
  if (days < 7) return 'Esta semana';
  return 'Anteriores';
}
const groups = computed(() => groupBy(visible.value, groupOf));

async function openItem(n) {
  if (!n.read) {
    n.read = true;
    items.value = [...items.value];
    await notificationService.markRead(n.id);
    bell.refresh();
  }
  if (n.link) router.push(n.link);
  else shown.value = n;
}

async function readAll() {
  await notificationService.markAllRead();
  items.value = items.value.map((n) => ({ ...n, read: true }));
  bell.set(0);
  toast('Marcaste todas como leídas.');
}

/* ---------- Banner de notificaciones push ---------- */
const pushTick = ref(0);
const showPush = computed(() => {
  pushTick.value; // se recalcula después de activar
  return pushService.supported() && !pushService.enabled() && pushService.permission() !== 'denied';
});
async function enablePush() {
  try { await pushService.enable(); toast('¡Listo! Vas a recibir notificaciones.'); } catch (err) { toast(err.message, 'error'); }
  pushTick.value += 1;
}
</script>

<template>
  <ScreenHead title="Notificaciones" :sub="customer.business?.name || ''" :back="APP_LINKS.home" small>
    <template #end><button v-if="unread" type="button" class="link" @click="readAll">Marcar todas como leídas</button></template>
  </ScreenHead>

  <!-- Filtro -->
  <div class="chips" role="group" aria-label="Filtrar notificaciones">
    <button type="button" class="chip" :class="{ 'is-on': filter === 'todas' }" @click="filter = 'todas'">Todas</button>
    <button type="button" class="chip" :class="{ 'is-on': filter === 'no-leidas' }" @click="filter = 'no-leidas'">
      No leídas<span v-if="unread" class="count"> · {{ unread }}</span>
    </button>
    <button type="button" class="chip" :class="{ 'is-on': filter === 'negocio' }" @click="filter = 'negocio'">Del negocio</button>
  </div>

  <!-- Invitación a activar las push -->
  <div v-if="showPush" class="nudge nudge--sky" style="margin-top: var(--sp-4)">
    <BaseIcon name="bell-ring" :size="18" />
    <span>Recibí estos avisos en tu teléfono</span>
    <button type="button" class="btn btn--sm" @click="enablePush">Activar</button>
  </div>

  <div style="margin-top: var(--sp-4)" :aria-busy="!items && !error ? 'true' : 'false'">
    <template v-if="!items && !error">
      <template v-for="n in 4" :key="n">
        <SkeletonBlock height="74px" radius="var(--radius-lg)" /><div v-if="n < 4" style="height: 8px"></div>
      </template>
    </template>
    <BaseAlert v-else-if="error" tone="error" title="No pudimos cargar tus notificaciones" :text="error.message" />
    <EmptyState
      v-else-if="!visible.length" icon="bell-off"
      :title="filter === 'no-leidas' ? 'Estás al día' : 'No hay notificaciones'"
      :text="filter === 'no-leidas' ? 'Leíste todas tus notificaciones.' : 'Te vamos a avisar de tus rachas, desafíos, cambios de nivel y ofertas nuevas.'"
    />
    <template v-else>
      <template v-for="g in GROUPS" :key="g">
        <template v-if="groups[g]">
          <p class="group-title">{{ g }}</p>
          <ul class="stack"><NotificationItem v-for="n in groups[g]" :key="n.id" :notification="n" @open="openItem" /></ul>
        </template>
      </template>
    </template>
  </div>

  <!-- Notificación sin enlace: se muestra completa -->
  <BaseSheet v-if="shown" :title="shown.title" @close="shown = null">
    <p class="muted" style="text-align: center">{{ shown.body }}</p>
    <template #actions="{ close }"><button type="button" class="btn btn--block" @click="close()">Listo</button></template>
  </BaseSheet>
</template>
