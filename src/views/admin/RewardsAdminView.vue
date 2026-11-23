<!--
  Recompensas del negocio: crear, editar, activar, pausar, finalizar y
  eliminar (sólo si nunca se canjeó), más el historial completo de canjes
  (?vista=canjes). Cada canje genera un código que se valida en Caja.
-->
<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import ActionsSheet from '../../components/admin/ActionsSheet.vue';
import PageError from '../../components/admin/PageError.vue';
import PageHead from '../../components/admin/PageHead.vue';
import PageLoading from '../../components/admin/PageLoading.vue';
import BaseIcon from '../../components/base/BaseIcon.vue';
import ChipTabs from '../../components/base/ChipTabs.vue';
import EmptyState from '../../components/base/EmptyState.vue';
import StatusPill from '../../components/base/StatusPill.vue';
import RewardEditor from '../../components/editors/RewardEditor.vue';
import RewardArt from '../../components/loyalty/RewardArt.vue';
import { useAsync } from '../../composables/useAsync.js';
import { confirm } from '../../composables/useConfirm.js';
import { toast } from '../../composables/useToast.js';
import { REWARD_CATEGORIES } from '../../config/catalogs.js';
import { REDEMPTION_STATUS, REWARD_STATUS, rewards as Rewards } from '../../domain/rewards.js';
import { rewardService } from '../../services/rewardService.js';
import { format } from '../../utils/format.js';

const route = useRoute();
const router = useRouter();
const tab = ref(route.query.vista === 'canjes' ? 'canjes' : 'catalogo');
const status = ref('todas');
const redFilter = ref('todos');
const editing = ref(null);
const menuFor = ref(null);

const { data, error, run } = useAsync(async () => {
  const [rewards, redemptions] = await Promise.all([rewardService.list(), rewardService.getHistory()]);
  return { rewards, redemptions };
});
onMounted(run);

// Si la URL cambia (por ejemplo, desde un enlace de una notificación), se actualiza la pestaña
watch(() => route.query.vista, () => { tab.value = route.query.vista === 'canjes' ? 'canjes' : 'catalogo'; });

function setTab(k) {
  tab.value = k;
  router.replace({ query: k === 'canjes' ? { vista: 'canjes' } : {} });
}

/* ---------- Catálogo ---------- */
const statusTabs = computed(() => [['todas', `Todas · ${data.value.rewards.length}`],
  ...Object.entries(REWARD_STATUS).map(([k, s]) => [k, `${s.label} · ${data.value.rewards.filter((r) => r.status === k).length}`])]);
const list = computed(() => data.value.rewards.filter((r) => status.value === 'todas' || r.status === status.value).sort((a, b) => a.points - b.points));
const validity = (r) => (r.validFrom || r.validTo ? `${r.validFrom ? format.shortDate(r.validFrom) : '…'} – ${r.validTo ? format.shortDate(r.validTo) : '…'}` : 'Siempre');

/* ---------- Historial de canjes ---------- */
const redTabs = computed(() => [['todos', `Todos · ${data.value.redemptions.length}`],
  ...Object.entries(REDEMPTION_STATUS).map(([k, s]) => [k, `${s.label} · ${data.value.redemptions.filter((r) => r.status === k).length}`])]);
const redList = computed(() => data.value.redemptions.filter((r) => redFilter.value === 'todos' || r.status === redFilter.value));

/* ---------- Acciones de una recompensa ---------- */
function setStatus(r, st, msg) {
  return async () => {
    try {
      const res = await rewardService.setStatus(r.id, st);
      toast(res.notified ? `${msg} Avisamos a ${res.notified} clientes.` : msg);
      run();
    } catch (err) { toast(err.message, 'error'); }
  };
}
const actions = computed(() => {
  const r = menuFor.value;
  if (!r) return [];
  const list = [{ icon: 'pencil', label: 'Editar', run: () => { editing.value = r; } }];
  if (r.status !== 'activa') list.push({ icon: 'play', label: 'Activar', hint: 'Vuelve a verse en el catálogo del cliente.', run: setStatus(r, 'activa', 'Recompensa activa.') });
  if (r.status === 'activa') list.push({ icon: 'pause', label: 'Pausar', hint: 'Se oculta del catálogo hasta que la actives.', run: setStatus(r, 'pausada', 'Recompensa pausada.') });
  if (r.status !== 'finalizada') list.push({ icon: 'flag', label: 'Finalizar', hint: 'Deja de estar disponible. Se conserva el historial.', run: setStatus(r, 'finalizada', 'Recompensa finalizada.') });
  list.push({
    icon: 'trash-2', label: 'Eliminar', tone: 'danger', hint: 'Sólo si nunca se canjeó.',
    run: async () => {
      if (!await confirm({ title: `¿Eliminar "${r.name}"?`, description: 'No se puede deshacer.', confirmText: 'Eliminar', tone: 'danger' })) return;
      try { await rewardService.remove(r.id); toast('Recompensa eliminada.'); run(); } catch (err) { toast(err.message, 'error'); }
    },
  });
  return list;
});
</script>

<template>
  <PageHead title="Recompensas" description="Lo que tus clientes canjean con su saldo disponible. Cada canje genera un código que se valida en Caja.">
    <button type="button" class="btn" @click="editing = {}"><BaseIcon name="plus" :size="17" /> Nueva recompensa</button>
  </PageHead>
  <ChipTabs :model-value="tab" :items="[['catalogo', 'Catálogo'], ['canjes', 'Historial de canjes']]" @update:model-value="setTab" />

  <div>
    <PageLoading v-if="!data && !error" />
    <PageError v-else-if="error" title="No pudimos cargar las recompensas" :error="error" @retry="run" />

    <!-- Catálogo -->
    <template v-else-if="tab === 'catalogo'">
      <ChipTabs v-model="status" :items="statusTabs" label="Estado" />
      <EmptyState v-if="!data.rewards.length" icon="gift" title="Todavía no hay recompensas" text="Creá la primera: es lo que tus clientes van a querer canjear.">
        <template #action><button type="button" class="btn btn--sm" @click="editing = {}">Crear recompensa</button></template>
      </EmptyState>
      <EmptyState v-else-if="!list.length" icon="gift" title="No hay recompensas en este estado" text="Probá con otro filtro." />
      <div v-else class="table-wrap">
        <table class="table table--cards">
          <thead><tr><th>Recompensa</th><th class="num">Puntos</th><th>Stock</th><th>Vigencia</th><th class="num">Canjes</th><th>Estado</th><th></th></tr></thead>
          <tbody>
            <tr v-for="r in list" :key="r.id">
              <td>
                <span class="cust">
                  <RewardArt :category="r.category" :size="44" :icon-size="20" :image="r.image" />
                  <span class="cust__body">
                    <span class="cust__name">{{ r.name }}<template v-if="r.featured">{{ ' ' }}<BaseIcon name="star" :size="13" /></template></span>
                    <span class="cust__meta">{{ REWARD_CATEGORIES[r.category]?.label || '' }}</span>
                  </span>
                </span>
              </td>
              <td class="num" data-label="Puntos">{{ format.points(r.points) }}</td>
              <td data-label="Stock">{{ Rewards.stockText(r) }}</td>
              <td data-label="Vigencia">{{ validity(r) }}</td>
              <td class="num" data-label="Canjes">{{ format.points(r.redemptionsCount) }}<template v-if="r.pendingCount">{{ ' ' }}<span class="small muted">({{ r.pendingCount }} a entregar)</span></template></td>
              <td data-label="Estado"><StatusPill :meta="REWARD_STATUS[r.status]" /></td>
              <td class="num">
                <button type="button" class="btn btn--ghost btn--sm" :aria-label="`Acciones de ${r.name}`" @click="menuFor = r"><BaseIcon name="ellipsis" :size="18" /></button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <!-- Historial de canjes -->
    <template v-else>
      <ChipTabs v-model="redFilter" :items="redTabs" label="Estado del canje" />
      <EmptyState v-if="!redList.length" icon="ticket" title="No hay canjes" text="Cuando tus clientes canjeen recompensas, se registran acá con su código." />
      <div v-else class="table-wrap">
        <table class="table table--cards">
          <thead><tr><th>Código</th><th>Recompensa</th><th>Cliente</th><th class="num">Puntos</th><th>Fecha</th><th>Validó</th><th>Estado</th></tr></thead>
          <tbody>
            <tr v-for="r in redList" :key="r.id">
              <td class="tabular"><b>{{ r.code }}</b></td>
              <td data-label="Recompensa">{{ r.rewardName }}<template v-if="r.source === 'premio'">{{ ' ' }}<span class="pill pill--honey">Premio</span></template></td>
              <td data-label="Cliente"><router-link class="link" :to="{ name: 'admin-customer', params: { id: r.membershipId } }">{{ r.customer }}</router-link></td>
              <td class="num" data-label="Puntos">{{ format.points(r.points) }}</td>
              <td data-label="Fecha">{{ format.dateTime(r.createdAt) }}</td>
              <td data-label="Validó">{{ r.validatedAt ? `${r.validatedByName || ''} · ${format.shortDate(r.validatedAt)}` : '—' }}</td>
              <td data-label="Estado">
                <router-link v-if="r.status === 'pendiente'" class="btn btn--sm" :to="{ name: 'admin-cashier', query: { vista: 'canjes' } }">Entregar</router-link>
                <StatusPill v-else :meta="REDEMPTION_STATUS[r.status]" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>

  <ActionsSheet v-if="menuFor" :title="menuFor.name" :actions="actions" @close="menuFor = null" />
  <RewardEditor v-if="editing" :data="editing" @saved="run" @close="editing = null" />
</template>
