<!--
  Dashboard del negocio (dueño o administrador): métricas por período
  (hoy, semana, mes, histórico), gráfico de facturación, clientes por
  nivel y segmentos, ranking del mes, actividad reciente y lista de
  configuración pendiente.
  Si el negocio todavía no terminó la configuración inicial (y no la
  pospuso), lleva al asistente.
-->
<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import BarChart from '../../components/admin/BarChart.vue';
import HBars from '../../components/admin/HBars.vue';
import PageError from '../../components/admin/PageError.vue';
import PageHead from '../../components/admin/PageHead.vue';
import PageLoading from '../../components/admin/PageLoading.vue';
import StatTile from '../../components/admin/StatTile.vue';
import BaseIcon from '../../components/base/BaseIcon.vue';
import ChipTabs from '../../components/base/ChipTabs.vue';
import EmptyState from '../../components/base/EmptyState.vue';
import ProgressBar from '../../components/base/ProgressBar.vue';
import LevelBadge from '../../components/loyalty/LevelBadge.vue';
import MovementList from '../../components/loyalty/MovementList.vue';
import RankingList from '../../components/loyalty/RankingList.vue';
import { useAsync } from '../../composables/useAsync.js';
import { SEGMENTS } from '../../domain/segments.js';
import { METRIC_RANGES, metricsService } from '../../services/metricsService.js';
import { useAuthStore } from '../../stores/auth.js';
import { format } from '../../utils/format.js';

const router = useRouter();
const auth = useAuthStore();
const range = ref('mes');

const { data: d, error, loading, run } = useAsync(async () => {
  const r = await metricsService.getDashboard(range.value);
  if (r.business.status !== 'activo' && !r.business.onboarding.dismissed) {
    router.replace({ name: 'admin-onboarding' });
    return null;
  }
  return r;
});
onMounted(run);
function setRange(value) { range.value = value; run(); }

const k = computed(() => d.value?.kpis);
const b = computed(() => d.value?.business);
const periodName = computed(() => format.period(b.value.currentPeriod));
const moneySeries = computed(() => d.value.series.some((x) => x.revenue > 0));

/** Lista de configuración pendiente (desaparece cuando todo está listo). */
const setup = computed(() => {
  const x = d.value;
  if (!x || (x.business.status === 'activo' && x.business.onboarding.completed && x.counts.rewards)) return null;
  const items = [
    [Boolean(x.business.name), 'Información del negocio', { name: 'admin-settings', params: { section: 'negocio' } }],
    [x.levels.length > 0, 'Niveles del programa', { name: 'admin-settings', params: { section: 'niveles' } }],
    [x.counts.rewards > 0, 'Al menos una recompensa', { name: 'admin-rewards' }],
    [x.business.status === 'activo', 'Programa activado', { name: 'admin-onboarding' }],
  ];
  return { items, done: items.filter((i) => i[0]).length };
});
</script>

<template>
  <PageLoading v-if="!d && !error" height="420px" />
  <PageError v-else-if="error" title="No pudimos cargar las métricas" :error="error" @retry="run" />

  <template v-else>
    <PageHead :title="`Hola, ${auth.user.firstName}`" :description="`Así viene ${b.name}. ${d.rangeLabel}${range === 'mes' ? ` (${periodName})` : ''}.`">
      <router-link class="btn" :to="{ name: 'admin-cashier' }"><BaseIcon name="scan-line" :size="18" /> Registrar compra</router-link>
    </PageHead>

    <!-- Configuración pendiente -->
    <section v-if="setup" class="setup" aria-label="Configuración pendiente">
      <div style="display: flex; justify-content: space-between; gap: var(--sp-3); flex-wrap: wrap; align-items: center">
        <h2><BaseIcon name="rocket" :size="18" /> Terminá de configurar tu programa · {{ setup.done }} de {{ setup.items.length }}</h2>
        <router-link class="btn btn--sm" :to="{ name: 'admin-onboarding' }">Continuar configuración</router-link>
      </div>
      <ProgressBar :value="setup.done / setup.items.length" label="Configuración completada" mod="bar--level" />
      <ul class="check-list">
        <li v-for="[ok, label, to] in setup.items" :key="label">
          <router-link class="check-chip" :to="to"><span><BaseIcon :name="ok ? 'circle-check' : 'circle'" :size="14" /> {{ label }}</span></router-link>
        </li>
      </ul>
    </section>

    <ChipTabs :model-value="range" :items="Object.entries(METRIC_RANGES)" label="Período" @update:model-value="setRange" />

    <!-- Indicadores -->
    <div class="grid grid--stats" :style="loading ? { opacity: 0.6 } : undefined">
      <StatTile label="Clientes activos" :value="format.points(k.activeCustomers)" icon="users" :hint="`de ${format.points(k.totalCustomers)} clientes`" />
      <StatTile label="Nuevos clientes" :value="format.points(k.newCustomers)" icon="user-plus" />
      <StatTile label="Compras registradas" :value="format.points(k.purchases)" icon="shopping-bag" :hint="k.purchases ? `Ticket promedio ${format.currency(k.avgTicket)}` : ''" />
      <StatTile label="Facturación registrada" :value="format.currency(k.revenue)" icon="banknote" />
      <StatTile label="Puntos otorgados" :value="format.points(k.pointsIssued)" icon="leaf" />
      <StatTile label="Puntos canjeados" :value="format.points(k.pointsRedeemed)" icon="gift" :hint="`Tasa de canje ${format.percent(k.redemptionRate)}`" />
      <StatTile label="Recompensas canjeadas" :value="format.points(k.redemptions)" icon="package" :hint="d.pendingRedemptions ? `${d.pendingRedemptions} para entregar` : ''" />
      <StatTile label="Clientes que regresaron" :value="format.points(k.returning)" icon="repeat" :hint="k.activeCustomers ? `${format.percent(k.returningRate)} de los activos` : ''" />
      <StatTile label="Nivel más frecuente" :value="d.topLevel ? d.topLevel.name : '—'" icon="medal" />
      <StatTile label="Desafíos completados" :value="format.points(k.challengesCompleted)" icon="target" :hint="`${d.liveChallenges} activos`" />
    </div>

    <div class="grid grid--main" style="margin-top: var(--sp-4)">
      <!-- Facturación -->
      <section class="panel-card">
        <div class="panel-card__head"><h2>Facturación registrada</h2><span class="small muted">{{ d.rangeLabel }}</span></div>
        <BarChart
          v-if="moneySeries" :data="d.series" :value="(x) => x.revenue" :fmt="(v) => format.currency(v)"
          caption="Importe de las compras cargadas en caja. Pasá el mouse por cada barra para ver el detalle."
        />
        <EmptyState v-else icon="chart-column" title="Todavía no hay compras en este período" text="Registrá la primera compra desde Caja y vas a ver la evolución acá.">
          <template #action><router-link class="btn btn--sm" :to="{ name: 'admin-cashier' }">Ir a Caja</router-link></template>
        </EmptyState>
      </section>

      <!-- Clientes por nivel y segmentos -->
      <section class="panel-card">
        <div class="panel-card__head"><h2>Clientes por nivel</h2><router-link class="link" :to="{ name: 'admin-customers' }">Ver clientes</router-link></div>
        <HBars v-if="k.totalCustomers" :items="d.byLevel.map((x) => ({ key: x.level.id, level: x.level, value: x.count }))">
          <template #label="{ item }"><LevelBadge :level="item.level" size="sm" /></template>
        </HBars>
        <EmptyState v-else icon="users" title="Todavía no hay clientes" text="Compartí el QR de tu negocio para que tus clientes se sumen.">
          <template #action><router-link class="btn btn--sm" :to="{ name: 'admin-settings', params: { section: 'qr' } }">Ver mi QR</router-link></template>
        </EmptyState>
        <p class="group-title">Segmentos</p>
        <div class="check-list">
          <router-link v-for="(n, key) in d.segments" :key="key" class="check-chip" :to="{ name: 'admin-customers', query: { segmento: key } }">
            <span>{{ SEGMENTS[key].label }} · <b class="tabular">{{ n }}</b></span>
          </router-link>
        </div>
      </section>
    </div>

    <div class="grid grid--2" style="margin-top: var(--sp-4)">
      <!-- Ranking del mes -->
      <section class="panel-card">
        <div class="panel-card__head"><h2>Ranking de {{ periodName }}</h2><router-link class="link" :to="{ name: 'admin-ranking' }">Ver ranking</router-link></div>
        <EmptyState v-if="!d.rankingEnabled" icon="trophy" title="El ranking está desactivado" text="Activalo en Configuración para que tus clientes compitan por el premio del mes." />
        <RankingList v-else-if="d.ranking.length" :rows="d.ranking" />
        <EmptyState v-else icon="trophy" title="Todavía no comenzó el ranking" text="Se arma con los puntos que suman tus clientes este mes." />
      </section>

      <!-- Actividad reciente -->
      <section class="panel-card">
        <div class="panel-card__head"><h2>Actividad reciente</h2></div>
        <MovementList v-if="d.recent.length" :movements="d.recent" show-customer />
        <EmptyState v-else icon="activity" title="Sin actividad todavía" text="Acá vas a ver las compras y canjes a medida que ocurran." />
        <template v-if="d.topRewards.length">
          <p class="group-title">Más canjeadas ({{ d.rangeLabel.toLowerCase() }})</p>
          <HBars :items="d.topRewards.map((r) => ({ key: r.name, label: r.name, value: r.count }))" :total="0" />
        </template>
      </section>
    </div>
  </template>
</template>
