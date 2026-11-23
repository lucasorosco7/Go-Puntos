<!--
  Clientes del negocio: listado con segmentos automáticos (nuevos,
  frecuentes, VIP, en riesgo, inactivos) y filtros por nivel, actividad,
  compras, puntos del mes y última compra. Cada fila abre la ficha.
  ?segmento=<clave> abre el listado filtrado (enlaces del dashboard).
  Con la API, el filtrado y la paginación los hará el servidor:
  GET /admin/customers?segment=&level=&status=&minPurchases=&q=&sort=&page=
-->
<script setup>
import { computed, onMounted, reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import CustomerChip from '../../components/admin/CustomerChip.vue';
import PageError from '../../components/admin/PageError.vue';
import PageHead from '../../components/admin/PageHead.vue';
import PageLoading from '../../components/admin/PageLoading.vue';
import BaseField from '../../components/base/BaseField.vue';
import BaseIcon from '../../components/base/BaseIcon.vue';
import ChipTabs from '../../components/base/ChipTabs.vue';
import EmptyState from '../../components/base/EmptyState.vue';
import StatusPill from '../../components/base/StatusPill.vue';
import LevelBadge from '../../components/loyalty/LevelBadge.vue';
import { useAsync } from '../../composables/useAsync.js';
import { CUSTOMER_STATUS, SEGMENTS } from '../../domain/segments.js';
import { customerService } from '../../services/customerService.js';
import { daysBetween } from '../../utils/dates.js';
import { format } from '../../utils/format.js';

const route = useRoute();
const router = useRouter();
const SORTS = { periodPoints: 'Puntos del mes', balance: 'Saldo', purchasesCount: 'Compras', lastPurchaseAt: 'Última compra', name: 'Nombre', joinedAt: 'Más nuevos' };
const EMPTY = { q: '', level: '', status: '', minPurchases: '', minPoints: '', lastPurchase: '' };
const state = reactive({ segment: SEGMENTS[route.query.segmento] ? route.query.segmento : 'todos', sort: 'periodPoints', ...EMPTY });

const { data, error, run } = useAsync(() => customerService.list());
onMounted(run);

const counts = computed(() => Object.fromEntries(Object.keys(SEGMENTS).map((k) => [k, data.value.rows.filter((r) => r.segments.includes(k)).length])));
const tabs = computed(() => [['todos', `Todos · ${data.value.rows.length}`], ...Object.entries(SEGMENTS).map(([k, s]) => [k, `${s.label} · ${counts.value[k]}`])]);
const levelOptions = computed(() => [{ value: '', label: 'Todos' }, ...data.value.levels.map((l) => ({ value: l.id, label: l.name }))]);
const statusOptions = [{ value: '', label: 'Todas' }, ...Object.entries(CUSTOMER_STATUS).map(([value, s]) => ({ value, label: s.label }))];
const lastOptions = [{ value: '', label: 'Cualquiera' }, { value: 7, label: 'Últimos 7 días' }, { value: 30, label: 'Últimos 30 días' }, { value: 90, label: 'Últimos 90 días' }];

/** Filas que cumplen el segmento y los filtros, ordenadas. */
const rows = computed(() => {
  const now = new Date();
  const q = state.q.trim().toLowerCase();
  return data.value.rows.filter((r) => (state.segment === 'todos' || r.segments.includes(state.segment))
    && (!q || `${r.name} ${r.email} ${r.phone} ${r.code}`.toLowerCase().includes(q))
    && (!state.level || r.level.id === Number(state.level))
    && (!state.status || r.status === state.status)
    && (!state.minPurchases || r.purchasesCount >= Number(state.minPurchases))
    && (!state.minPoints || r.periodPoints >= Number(state.minPoints))
    && (!state.lastPurchase || (r.lastPurchaseAt && daysBetween(r.lastPurchaseAt, now) <= Number(state.lastPurchase))))
    .sort((a, b) => {
      const k = state.sort;
      if (k === 'name') return a.name.localeCompare(b.name);
      if (k === 'lastPurchaseAt' || k === 'joinedAt') return new Date(b[k] || 0) - new Date(a[k] || 0);
      return b[k] - a[k];
    });
});

function setSegment(key) {
  state.segment = key;
  router.replace({ query: key === 'todos' ? {} : { segmento: key } });
}
function clearFilters() {
  Object.assign(state, EMPTY);
  setSegment('todos');
}
const open = (r) => router.push({ name: 'admin-customer', params: { id: r.membershipId } });
</script>

<template>
  <PageLoading v-if="!data && !error" />
  <PageError v-else-if="error" title="No pudimos cargar los clientes" :error="error" @retry="run" />

  <template v-else>
    <PageHead title="Clientes" description="Segmentos automáticos según la actividad de cada cliente en tu negocio.">
      <router-link class="btn btn--outline" :to="{ name: 'admin-campaigns' }"><BaseIcon name="megaphone" :size="17" /> Enviar campaña</router-link>
      <router-link class="btn" :to="{ name: 'admin-cashier' }"><BaseIcon name="scan-line" :size="17" /> Registrar compra</router-link>
    </PageHead>

    <!-- Segmentos -->
    <ChipTabs :model-value="state.segment" :items="tabs" label="Segmentos" @update:model-value="setSegment" />
    <p class="small muted" style="margin: -8px 0 var(--sp-4)">{{ state.segment !== 'todos' ? SEGMENTS[state.segment].rule : '' }}</p>

    <!-- Filtros -->
    <form class="filters" @submit.prevent>
      <div class="filters__row">
        <div class="field field--search field--compact">
          <label class="field__label" for="f-q">Buscar</label>
          <div class="field__control">
            <BaseIcon name="search" :size="18" class="field__icon" />
            <input id="f-q" v-model="state.q" name="q" type="search" class="field__input has-icon" placeholder="Nombre, email, teléfono o código" />
          </div>
        </div>
        <BaseField v-model="state.level" name="level" label="Nivel" type="select" field-class="field--compact" :options="levelOptions" />
        <BaseField v-model="state.status" name="status" label="Actividad" type="select" field-class="field--compact" :options="statusOptions" />
        <BaseField v-model="state.lastPurchase" name="lastPurchase" label="Última compra" type="select" field-class="field--compact" :options="lastOptions" />
        <BaseField v-model="state.minPurchases" name="minPurchases" label="Compras (mín.)" type="number" field-class="field--compact" min="0" />
        <BaseField v-model="state.minPoints" name="minPoints" label="Puntos del mes (mín.)" type="number" field-class="field--compact" min="0" />
        <BaseField v-model="state.sort" name="sort" label="Ordenar por" type="select" field-class="field--compact" :options="SORTS" />
      </div>
    </form>
    <p class="small muted" style="margin-bottom: var(--sp-2)">{{ format.plural(rows.length, 'cliente', 'clientes') }}</p>

    <!-- Listado -->
    <EmptyState v-if="!data.rows.length" icon="users" title="Todavía no hay clientes" text="Compartí el QR de tu negocio: al escanearlo se crean su cuenta y se suman a tu programa.">
      <template #action><router-link class="btn btn--sm" :to="{ name: 'admin-settings', params: { section: 'qr' } }">Ver el QR del negocio</router-link></template>
    </EmptyState>
    <EmptyState v-else-if="!rows.length" icon="filter-x" title="Ningún cliente cumple estos filtros" text="Probá quitar algún filtro.">
      <template #action><button type="button" class="btn btn--outline btn--sm" @click="clearFilters">Quitar filtros</button></template>
    </EmptyState>
    <div v-else class="table-wrap">
      <table class="table table--cards">
        <thead>
          <tr><th>Cliente</th><th>Nivel</th><th class="num">Saldo</th><th class="num">Puntos del mes</th><th class="num">Compras</th><th>Última compra</th><th class="num">Ranking</th><th>Estado</th></tr>
        </thead>
        <tbody>
          <tr v-for="r in rows" :key="r.membershipId" :data-href="`/panel/clientes/${r.membershipId}`" tabindex="0" @click="open(r)" @keydown.enter="open(r)">
            <td>
              <CustomerChip :user="r">
                <span class="tabular">{{ r.code }}</span>
                <StatusPill v-for="s in r.segments.filter((x) => ['vip', 'frecuente', 'nuevo'].includes(x))" :key="s" :meta="SEGMENTS[s]" />
              </CustomerChip>
            </td>
            <td data-label="Nivel"><LevelBadge :level="r.level" size="sm" /></td>
            <td class="num" data-label="Saldo">{{ format.points(r.balance) }}</td>
            <td class="num" data-label="Puntos del mes">{{ format.points(r.periodPoints) }}</td>
            <td class="num" data-label="Compras">{{ format.points(r.purchasesCount) }}</td>
            <td data-label="Última compra">{{ r.lastPurchaseAt ? format.relative(r.lastPurchaseAt) : 'Nunca' }}</td>
            <td class="num" data-label="Ranking">{{ r.position ? `#${r.position}` : '—' }}</td>
            <td data-label="Estado"><StatusPill :meta="CUSTOMER_STATUS[r.status]" /></td>
          </tr>
        </tbody>
      </table>
    </div>
  </template>
</template>
