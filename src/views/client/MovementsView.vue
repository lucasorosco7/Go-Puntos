<!--
  Historial de movimientos: compras, canjes, bonificaciones, desafíos,
  premios y ajustes. Por defecto el negocio activo; también se pueden ver
  todos los negocios juntos (cada movimiento dice de qué negocio es: los
  puntos nunca se mezclan).
-->
<script setup>
import { computed, onMounted, ref } from 'vue';
import BaseAlert from '../../components/base/BaseAlert.vue';
import EmptyState from '../../components/base/EmptyState.vue';
import ScreenHead from '../../components/base/ScreenHead.vue';
import SkeletonBlock from '../../components/base/SkeletonBlock.vue';
import MovementList from '../../components/loyalty/MovementList.vue';
import { useAsync } from '../../composables/useAsync.js';
import { APP_LINKS } from '../../config/navigation.js';
import { customerService } from '../../services/customerService.js';
import { useCustomerStore } from '../../stores/customer.js';
import { format } from '../../utils/format.js';

const customer = useCustomerStore();
/** 'active' = negocio activo · 'all' = todos los negocios de la cuenta */
const scope = ref('active');
const filter = ref('todos');
const FILTERS = [['todos', 'Todos'], ['compra', 'Compras'], ['canje', 'Canjes'], ['bonificacion', 'Bonificaciones'], ['desafio', 'Desafíos'], ['premio', 'Premios'], ['ajuste', 'Ajustes']];

const { data: movements, error, loading, run } = useAsync(() => customerService.getMovements(scope.value), { keepData: false });
onMounted(run);

function setScope(value) {
  if (value === scope.value) return;
  scope.value = value;
  run();
}

const total = (fn) => (movements.value || []).filter(fn).reduce((a, m) => a + Math.abs(m.points), 0);
const earned = computed(() => total((m) => m.points > 0));
const redeemed = computed(() => total((m) => m.type === 'canje'));
const visible = computed(() => (filter.value === 'todos' ? movements.value || [] : (movements.value || []).filter((m) => m.type === filter.value)));
</script>

<template>
  <ScreenHead title="Movimientos" :back="APP_LINKS.home" small />

  <!-- Qué negocios ver -->
  <div class="seg" role="group" aria-label="Qué negocios ver" style="margin-bottom: var(--sp-4)">
    <button type="button" :class="{ 'is-on': scope === 'active' }" :aria-pressed="scope === 'active'" @click="setScope('active')">
      <span>{{ customer.business?.name || 'Este negocio' }}</span>
    </button>
    <button type="button" :class="{ 'is-on': scope === 'all' }" :aria-pressed="scope === 'all'" @click="setScope('all')">Todos mis negocios</button>
  </div>

  <!-- Totales -->
  <div class="stack" style="grid-template-columns: 1fr 1fr; grid-auto-flow: column">
    <template v-if="movements">
      <div class="card card--flat"><p class="small muted">Ganados</p><p class="tabular pos" style="font-size: var(--fs-xl)">{{ format.points(earned) }}</p></div>
      <div class="card card--flat"><p class="small muted">Canjeados</p><p class="tabular neg" style="font-size: var(--fs-xl)">{{ format.points(redeemed) }}</p></div>
    </template>
  </div>

  <!-- Filtro por tipo -->
  <div class="chips" style="margin: var(--sp-5) 0 var(--sp-4)" role="group" aria-label="Filtrar movimientos">
    <button v-for="[key, label] in FILTERS" :key="key" type="button" class="chip" :class="{ 'is-on': filter === key }" @click="filter = key">{{ label }}</button>
  </div>

  <div class="card" :aria-busy="loading || !movements ? 'true' : 'false'">
    <SkeletonBlock v-if="loading || (!movements && !error)" height="220px" radius="var(--radius-lg)" />
    <BaseAlert v-else-if="error" tone="error" title="No pudimos cargar tus movimientos" :text="error.message" />
    <EmptyState v-else-if="!movements.length" icon="receipt" title="Todavía no realizaste compras" text="Mostrá tu código en caja en tu próxima compra para empezar a sumar." />
    <MovementList v-else-if="visible.length" :movements="visible" :show-business="scope === 'all'" :show-balance="scope === 'active'" />
    <EmptyState v-else icon="receipt" title="Sin movimientos de este tipo" text="Probá con otro filtro para ver el resto de tu historial." />
  </div>
</template>
