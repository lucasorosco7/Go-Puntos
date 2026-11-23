<!--
  Auditoría de la plataforma (auditoria_plataforma).
  Historial de las acciones del equipo de administración de GO Puntos:
  crear y revocar invitaciones, aprobar y rechazar solicitudes, suspender,
  bloquear y reactivar negocios. Cada registro muestra fecha y hora,
  administrador, acción, negocio o solicitud relacionada y el detalle o motivo.
  No incluye la auditoría interna de cada negocio (tabla auditoria), que es
  de los paneles de los negocios.
-->
<script setup>
import { computed, onMounted, reactive } from 'vue';
import PageError from '../../components/admin/PageError.vue';
import PageHead from '../../components/admin/PageHead.vue';
import PageLoading from '../../components/admin/PageLoading.vue';
import BaseField from '../../components/base/BaseField.vue';
import BaseIcon from '../../components/base/BaseIcon.vue';
import EmptyState from '../../components/base/EmptyState.vue';
import StatusPill from '../../components/base/StatusPill.vue';
import { useAsync } from '../../composables/useAsync.js';
import { AUDIT_ACTIONS } from '../../domain/platform.js';
import { platformService } from '../../services/platformService.js';
import { format } from '../../utils/format.js';

const { data: list, error, run } = useAsync(() => platformService.listAudit());
onMounted(run);

const state = reactive({ action: 'todas', q: '', since: 'todo' });
const actionOptions = { todas: 'Todas las acciones', ...Object.fromEntries(Object.entries(AUDIT_ACTIONS).map(([k, v]) => [k, v.short])) };
const sinceOptions = { todo: 'Todo el historial', 7: 'Últimos 7 días', 30: 'Últimos 30 días', 90: 'Últimos 90 días' };
const norm = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const rows = computed(() => {
  const q = norm(state.q.trim());
  const from = state.since === 'todo' ? 0 : Date.now() - Number(state.since) * 86400000;
  return (list.value || []).filter((a) => (state.action === 'todas' || a.action === state.action)
    && new Date(a.date).getTime() >= from
    && (!q || norm([a.business?.name, a.detail, a.adminName, a.requestId ? `solicitud ${a.requestId}` : ''].join(' ')).includes(q)));
});
const clear = () => Object.assign(state, { action: 'todas', q: '', since: 'todo' });
</script>

<template>
  <PageLoading v-if="!list && !error" />
  <PageError v-else-if="error" title="No pudimos cargar la auditoría" :error="error" @retry="run" />

  <template v-else>
    <PageHead title="Auditoría de la plataforma" description="Registro de las acciones del equipo de administración de GO Puntos. No se puede editar ni borrar." />

    <form class="filters" role="search" @submit.prevent>
      <div class="filters__row">
        <div class="field field--search field--compact">
          <label class="field__label" for="f-q">Buscar</label>
          <div class="field__control">
            <BaseIcon name="search" :size="18" class="field__icon" />
            <input id="f-q" v-model="state.q" name="q" type="search" class="field__input has-icon" placeholder="Negocio, detalle o administrador" />
          </div>
        </div>
        <BaseField v-model="state.action" name="action" label="Acción" type="select" field-class="field--compact" :options="actionOptions" />
        <BaseField v-model="state.since" name="since" label="Período" type="select" field-class="field--compact" :options="sinceOptions" />
      </div>
    </form>
    <p class="small muted" style="margin-bottom: var(--sp-2)">{{ format.plural(rows.length, 'registro', 'registros') }}</p>

    <EmptyState v-if="!list.length" icon="scroll-text" title="Todavía no hay acciones registradas" text="Las invitaciones, aprobaciones y cambios de estado van a quedar registrados acá." />
    <EmptyState v-else-if="!rows.length" icon="filter-x" title="Ningún registro cumple estos filtros" text="Probá con otra acción o período.">
      <template #action><button type="button" class="btn btn--outline btn--sm" @click="clear">Quitar filtros</button></template>
    </EmptyState>
    <div v-else class="table-wrap">
      <table class="table table--cards">
        <thead>
          <tr><th>Fecha y hora</th><th>Administrador</th><th>Acción</th><th>Negocio o solicitud</th><th>Detalle o motivo</th></tr>
        </thead>
        <tbody>
          <tr v-for="a in rows" :key="a.id">
            <td><time class="tabular" :datetime="a.date">{{ format.fullDateTime(a.date) }}</time></td>
            <td data-label="Administrador">{{ a.adminName }}</td>
            <td data-label="Acción"><StatusPill :meta="{ label: AUDIT_ACTIONS[a.action].short, tone: AUDIT_ACTIONS[a.action].tone }" :icon="AUDIT_ACTIONS[a.action].icon" /></td>
            <td data-label="Relacionado">
              <router-link v-if="a.business" class="link" :to="{ name: 'platform-business', params: { id: a.business.id } }">{{ a.business.name }}</router-link>
              <span v-else class="muted">—</span>
              <span v-if="a.requestId" class="small muted"> · solicitud #{{ a.requestId }}</span>
            </td>
            <td data-label="Detalle" class="audit-detail">{{ a.detail || '—' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </template>
</template>
