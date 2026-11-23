<!--
  Desafíos (crear, participación y completados) y resumen de rachas
  semanales del negocio. Los clientes ven los desafíos en su Perfil y por
  notificación; el premio va al saldo, no al nivel ni al ranking.
-->
<script setup>
import { computed, onMounted, ref } from 'vue';
import ActionsSheet from '../../components/admin/ActionsSheet.vue';
import HBars from '../../components/admin/HBars.vue';
import PageError from '../../components/admin/PageError.vue';
import PageHead from '../../components/admin/PageHead.vue';
import PageLoading from '../../components/admin/PageLoading.vue';
import StatTile from '../../components/admin/StatTile.vue';
import BaseAlert from '../../components/base/BaseAlert.vue';
import BaseIcon from '../../components/base/BaseIcon.vue';
import ChipTabs from '../../components/base/ChipTabs.vue';
import EmptyState from '../../components/base/EmptyState.vue';
import ProgressBar from '../../components/base/ProgressBar.vue';
import StatusPill from '../../components/base/StatusPill.vue';
import ChallengeEditor from '../../components/editors/ChallengeEditor.vue';
import { useAsync } from '../../composables/useAsync.js';
import { confirm } from '../../composables/useConfirm.js';
import { toast } from '../../composables/useToast.js';
import { challenges as Challenges } from '../../domain/challenges.js';
import { challengeService } from '../../services/challengeService.js';
import { nextPeriod, periodEnd, periodOf, periodStart } from '../../utils/dates.js';
import { format } from '../../utils/format.js';

const filter = ref('todos');
const editing = ref(null);
const menuFor = ref(null);
const { data: d, error, run } = useAsync(() => challengeService.list());
onMounted(run);

const TABS = [['todos', 'Todos'], ...Object.entries(Challenges.STATUS).map(([k, s]) => [k, s.label])];
const list = computed(() => d.value.challenges.filter((c) => filter.value === 'todos' || c.effectiveStatus === filter.value));
const st = computed(() => d.value.streakStats);

function setStatus(c, value, msg) {
  return async () => {
    try { await challengeService.setStatus(c.id, value); toast(msg); run(); } catch (err) { toast(err.message, 'error'); }
  };
}
const actions = computed(() => {
  const c = menuFor.value;
  if (!c) return [];
  const a = [{ icon: 'pencil', label: 'Editar', run: () => { editing.value = c; } }];
  if (c.status !== 'activo') a.push({ icon: 'play', label: 'Activar', run: setStatus(c, 'activo', 'Desafío activo.') });
  if (c.status === 'activo') a.push({ icon: 'pause', label: 'Pausar', run: setStatus(c, 'pausado', 'Desafío pausado.') });
  if (c.status !== 'finalizado') a.push({ icon: 'flag', label: 'Finalizar', run: setStatus(c, 'finalizado', 'Desafío finalizado.') });
  a.push({
    icon: 'copy', label: 'Repetir el mes que viene', hint: 'Crea una copia con las fechas del próximo mes.',
    run: () => {
      const p = nextPeriod(periodOf(new Date()));
      editing.value = { ...c, id: null, startDate: periodStart(p).toISOString(), endDate: periodEnd(p).toISOString(), status: 'activo' };
    },
  });
  a.push({
    icon: 'trash-2', label: 'Eliminar', tone: 'danger', hint: 'Sólo si nadie lo completó.',
    run: async () => {
      if (!await confirm({ title: `¿Eliminar "${c.name}"?`, confirmText: 'Eliminar', tone: 'danger' })) return;
      try { await challengeService.remove(c.id); toast('Desafío eliminado.'); run(); } catch (err) { toast(err.message, 'error'); }
    },
  });
  return a;
});
</script>

<template>
  <PageLoading v-if="!d && !error" />
  <PageError v-else-if="error" title="No pudimos cargar los desafíos" :error="error" @retry="run" />

  <template v-else>
    <PageHead title="Desafíos y rachas" description="Objetivos con premio que se completan solos con las compras. Los clientes los ven en su Perfil y por notificación.">
      <router-link class="btn btn--outline" :to="{ name: 'admin-settings', params: { section: 'desafios' } }"><BaseIcon name="settings" :size="16" /> Configurar</router-link>
      <button type="button" class="btn" @click="editing = {}"><BaseIcon name="plus" :size="17" /> Nuevo desafío</button>
    </PageHead>
    <BaseAlert v-if="!d.business.challengesEnabled" tone="info" title="Los desafíos están desactivados" text="Tus clientes no los ven. Activalos en Configuración." />

    <div class="grid grid--main" style="margin-top: var(--sp-4)">
      <!-- Desafíos -->
      <section>
        <ChipTabs v-model="filter" :items="TABS" label="Estado" />
        <EmptyState v-if="!d.challenges.length" icon="target" title="Todavía no hay desafíos" text="Por ejemplo: &quot;3 compras este mes&quot; con 150 puntos de premio.">
          <template #action><button type="button" class="btn btn--sm" @click="editing = {}">Crear desafío</button></template>
        </EmptyState>
        <EmptyState v-else-if="!list.length" icon="target" title="No hay desafíos en este estado" text="Probá con otro filtro." />
        <ul v-else class="stack">
          <li v-for="c in list" :key="c.id" class="panel-card" style="padding: var(--sp-4)">
            <div style="display: flex; gap: var(--sp-3); align-items: flex-start">
              <span class="challenge__icon"><BaseIcon :name="Challenges.TYPES[c.type]?.icon || 'target'" :size="20" /></span>
              <div style="flex: 1; min-width: 0; display: grid; gap: 4px">
                <div class="check-list"><StatusPill :meta="Challenges.STATUS[c.effectiveStatus]" /><span class="pill pill--honey">{{ Challenges.rewardText(c) }}</span></div>
                <p class="row__title">{{ c.name }}</p>
                <p class="small muted">{{ Challenges.TYPES[c.type]?.label }} · objetivo {{ format.points(c.goal) }} · {{ format.shortDate(c.startDate) }} al {{ format.shortDate(c.endDate) }}</p>
                <ProgressBar :value="c.members ? c.completed / c.members : 0" label="Clientes que lo completaron" mod="bar--level" />
                <p class="small muted">
                  <b class="tabular" style="color: var(--text)">{{ c.completed }}</b> lo completaron ·
                  <b class="tabular" style="color: var(--text)">{{ c.participants }}</b> participan · de {{ c.members }} clientes
                </p>
              </div>
              <button type="button" class="btn btn--ghost btn--sm" aria-label="Acciones" @click="menuFor = c"><BaseIcon name="ellipsis" :size="18" /></button>
            </div>
          </li>
        </ul>
      </section>

      <!-- Resumen de rachas -->
      <aside class="panel-card">
        <div class="panel-card__head">
          <h2>Rachas semanales</h2>
          <StatusPill :meta="d.business.streaks.enabled ? { label: 'Activas', tone: 'green' } : { label: 'Apagadas' }" />
        </div>
        <div class="grid grid--2" style="gap: var(--sp-2)">
          <StatTile label="Con racha (2+ sem.)" :value="st.active" icon="flame" />
          <StatTile label="En riesgo esta semana" :value="st.atRisk" icon="triangle-alert" />
        </div>
        <p class="group-title">Distribución</p>
        <HBars :items="st.distribution.map((x) => ({ key: x.label, label: x.label, value: x.count }))" />
        <p class="small muted" style="margin-top: var(--sp-3)">
          Mejor racha histórica: <b>{{ st.best }} semanas</b>.
          {{ d.business.streaks.remindAtRisk ? 'Los clientes con la racha en riesgo reciben un aviso desde el miércoles.' : '' }}
        </p>
        <router-link class="btn btn--outline btn--sm" style="margin-top: var(--sp-3)" :to="{ name: 'admin-campaigns' }"><BaseIcon name="megaphone" :size="15" /> Escribirles a los que están en riesgo</router-link>
      </aside>
    </div>
  </template>

  <ActionsSheet v-if="menuFor" :title="menuFor.name" :actions="actions" @close="menuFor = null" />
  <ChallengeEditor v-if="editing" :data="editing" @saved="run" @close="editing = null" />
</template>
