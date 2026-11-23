<!--
  Ranking mensual del negocio activo: premio del mes, posición propia,
  Top 5 e historial de meses anteriores.
  Se ordena por los PUNTOS DEL MES (sólo compras): canjear no baja
  posiciones y el saldo no se reinicia al cerrar el mes.
-->
<script setup>
import { computed, onMounted } from 'vue';
import BaseAlert from '../../components/base/BaseAlert.vue';
import BaseIcon from '../../components/base/BaseIcon.vue';
import EmptyState from '../../components/base/EmptyState.vue';
import ScreenHead from '../../components/base/ScreenHead.vue';
import SkeletonBlock from '../../components/base/SkeletonBlock.vue';
import RankingList from '../../components/loyalty/RankingList.vue';
import { useAsync } from '../../composables/useAsync.js';
import { APP_LINKS } from '../../config/navigation.js';
import { rankingService } from '../../services/rankingService.js';
import { useCustomerStore } from '../../stores/customer.js';
import { format } from '../../utils/format.js';

const customer = useCustomerStore();
const { data: d, error, run } = useAsync(() => rankingService.getForCustomer());
onMounted(run);

const title = computed(() => (d.value ? `Ranking de ${format.period(d.value.period)}` : 'Ranking del mes'));
/** Qué premio se lleva el #1 este mes. */
const prizeText = computed(() => {
  const p = d.value?.prize;
  if (!p) return '';
  if (p.type === 'puntos') return `${format.points(p.points)} puntos extra`;
  if (p.type === 'recompensa') return p.rewardName || 'Una recompensa especial';
  return p.description || 'Un premio especial';
});
/** Cuánto le falta para subir un puesto (o para entrar al Top). */
const gap = computed(() => {
  const x = d.value;
  if (!x?.me || x.me.position <= 1 || !x.top.length) return null;
  const inTop = x.me.position <= x.top.length + 1;
  const target = inTop ? x.top[x.me.position - 2] : x.top[x.top.length - 1];
  return { points: target.points - x.me.points + 1, text: inTop ? 'para subir' : `para el Top ${x.top.length}` };
});
</script>

<template>
  <ScreenHead :title="title" :sub="customer.business?.name || ''" :back="APP_LINKS.home" small />

  <div :aria-busy="!d && !error ? 'true' : 'false'">
    <SkeletonBlock v-if="!d && !error" height="300px" radius="22px" />
    <BaseAlert v-else-if="error" tone="error" title="No pudimos cargar el ranking" :text="error.message" />

    <!-- El negocio no usa ranking -->
    <EmptyState v-else-if="!d.enabled" icon="trophy" title="Este comercio no tiene ranking" :text="`${d.business.name} no activó el ranking mensual. Tus puntos y tu nivel siguen funcionando igual.`">
      <template #action><router-link class="btn btn--sm" :to="APP_LINKS.home">Volver a mis puntos</router-link></template>
    </EmptyState>

    <template v-else>
      <!-- Premio del mes -->
      <section v-if="d.prize" class="prize" aria-label="Premio del mes">
        <span class="prize__icon"><BaseIcon name="trophy" :size="26" /></span>
        <div><p>Premio para el #1 de {{ format.period(d.period) }}</p><b>{{ prizeText }}</b></div>
      </section>

      <!-- Posición propia -->
      <div v-if="d.me" class="me-row">
        <span class="me-row__pos tabular">#{{ d.me.position }}</span>
        <div style="flex: 1">
          <p style="font-weight: var(--fw-medium)">Tu posición</p>
          <p class="small muted">{{ format.points(d.me.points) }} pts en {{ format.period(d.period) }} · de {{ format.plural(d.total, 'participante', 'participantes') }}</p>
        </div>
        <span v-if="gap" class="small muted" style="text-align: right">Te faltan<br /><b class="tabular" style="color: var(--text)">{{ format.points(gap.points) }}</b> {{ gap.text }}</span>
      </div>
      <div v-else class="me-row">
        <span class="me-row__pos"><BaseIcon name="sprout" :size="24" /></span>
        <p class="small" style="flex: 1">Todavía no sumaste puntos este mes. Tu primera compra te mete en el ranking.</p>
      </div>

      <!-- Top del mes -->
      <section class="card" style="margin-top: var(--sp-4)" aria-labelledby="top-title">
        <h2 id="top-title" style="margin-bottom: var(--sp-2)">Top {{ d.top.length || 5 }}</h2>
        <RankingList v-if="d.top.length" :rows="d.top" :me-id="d.membershipId" />
        <EmptyState v-else icon="trophy" title="Todavía no comenzó el ranking" text="El ranking de este mes arranca con la primera compra. ¡Podés ser el primero!" />
      </section>
      <p class="small muted" style="margin-top: var(--sp-3); display: flex; gap: 6px">
        <BaseIcon name="info" :size="14" />
        Se ordena por los puntos que sumás en el mes. Canjear recompensas no te baja posiciones. El ranking se reinicia el 1° de cada mes; tu saldo no.
      </p>

      <!-- Meses anteriores -->
      <template v-if="d.history.length">
        <div class="section-head"><h2>Meses anteriores</h2></div>
        <ul class="stack">
          <li v-for="h in d.history" :key="h.period" class="row">
            <span class="art art--descuentos" style="width: 46px; height: 46px" aria-hidden="true"><BaseIcon name="crown" :size="20" /></span>
            <div class="row__body">
              <p class="row__title">{{ format.periodTitle(h.period) }}</p>
              <p class="small muted">{{ h.winner ? `Ganó ${h.winner.name} con ${format.points(h.winner.points)} pts` : 'Sin participantes' }}</p>
            </div>
            <span v-if="h.mine?.position" class="pill" :class="{ 'pill--honey': h.mine.position <= 5 }">Vos: #{{ h.mine.position }}</span>
          </li>
        </ul>
      </template>
    </template>
  </div>
</template>
