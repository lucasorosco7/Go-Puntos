<!--
  Negocios registrados en GO Puntos (vista global del Superadmin).
  - Búsqueda por nombre, rubro, ciudad o administrador; filtro por estado.
  - Por negocio: nombre y rubro, administrador responsable, fecha de
    registro, cantidad de clientes, estado (con la etapa de la solicitud si
    está pendiente) y acciones disponibles según su estado:
      activo → suspender / bloquear · suspendido → reactivar / bloquear · bloqueado → reactivar
  - El motivo de una suspensión o bloqueo se ve debajo del estado.
-->
<script setup>
import { computed, onMounted, reactive } from 'vue';
import { useRouter } from 'vue-router';
import PageError from '../../components/admin/PageError.vue';
import PageHead from '../../components/admin/PageHead.vue';
import PageLoading from '../../components/admin/PageLoading.vue';
import BaseIcon from '../../components/base/BaseIcon.vue';
import ChipTabs from '../../components/base/ChipTabs.vue';
import EmptyState from '../../components/base/EmptyState.vue';
import StatusPill from '../../components/base/StatusPill.vue';
import BusinessCell from '../../components/platform/BusinessCell.vue';
import ReasonSheet from '../../components/platform/ReasonSheet.vue';
import { useAsync } from '../../composables/useAsync.js';
import { useBusinessStatusAction } from '../../composables/useBusinessStatusAction.js';
import { BUSINESS_CATEGORIES } from '../../config/catalogs.js';
import { BUSINESS_STATUS, REQUEST_PHASES, STATUS_ACTIONS } from '../../domain/platform.js';
import { platformService } from '../../services/platformService.js';
import { format } from '../../utils/format.js';

const router = useRouter();
const { data: list, error, run } = useAsync(() => platformService.listBusinesses());
onMounted(run);
const action = useBusinessStatusAction(() => run());

const state = reactive({ q: '', status: 'todos' });
const tabs = computed(() => [
  ['todos', `Todos · ${list.value?.length ?? 0}`],
  ...Object.entries(BUSINESS_STATUS).map(([k, v]) => [k, `${v.label} · ${(list.value || []).filter((b) => b.status === k).length}`]),
]);
const norm = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const rows = computed(() => {
  const q = norm(state.q.trim());
  return (list.value || []).filter((b) => (state.status === 'todos' || b.status === state.status)
    && (!q || norm([b.name, BUSINESS_CATEGORIES[b.category], b.city, b.owner?.name, b.owner?.email].join(' ')).includes(q)));
});

const open = (b) => router.push({ name: 'platform-business', params: { id: b.id } });
const clear = () => Object.assign(state, { q: '', status: 'todos' });
</script>

<template>
  <PageLoading v-if="!list && !error" />
  <PageError v-else-if="error" title="No pudimos cargar los negocios" :error="error" @retry="run" />

  <template v-else>
    <PageHead title="Negocios" description="Todos los comercios registrados en GO Puntos. Un negocio que no está activo no puede registrar compras, canjes ni sumar clientes.">
      <router-link class="btn" :to="{ name: 'platform-invitations', query: { nueva: '1' } }"><BaseIcon name="mail-plus" :size="17" /> Invitar un negocio</router-link>
    </PageHead>

    <ChipTabs v-model="state.status" :items="tabs" label="Estado" />
    <form class="filters" role="search" @submit.prevent>
      <div class="filters__row">
        <div class="field field--search field--compact">
          <label class="field__label" for="f-q">Buscar</label>
          <div class="field__control">
            <BaseIcon name="search" :size="18" class="field__icon" />
            <input id="f-q" v-model="state.q" name="q" type="search" class="field__input has-icon" placeholder="Negocio, rubro, ciudad o administrador" />
          </div>
        </div>
      </div>
    </form>
    <p class="small muted" style="margin-bottom: var(--sp-2)">{{ format.plural(rows.length, 'negocio', 'negocios') }}</p>

    <EmptyState v-if="!list.length" icon="building-2" title="Todavía no hay negocios" text="Invitá al primer comercio para que se registre." />
    <EmptyState v-else-if="!rows.length" icon="filter-x" title="Ningún negocio cumple estos filtros" text="Probá con otra búsqueda o estado.">
      <template #action><button type="button" class="btn btn--outline btn--sm" @click="clear">Quitar filtros</button></template>
    </EmptyState>
    <div v-else class="table-wrap">
      <table class="table table--cards">
        <thead>
          <tr><th>Negocio</th><th>Administrador responsable</th><th>Registro</th><th class="num">Clientes</th><th>Estado</th><th><span class="sr-only">Acciones</span></th></tr>
        </thead>
        <tbody>
          <tr v-for="b in rows" :key="b.id" tabindex="0" @click="open(b)" @keydown.enter.self="open(b)">
            <td><BusinessCell :business="b" /></td>
            <td data-label="Administrador">
              <span v-if="b.owner" class="cell-stack">{{ b.owner.name }}<span class="small muted">{{ b.owner.email }}</span></span>
              <span v-else class="muted">—</span>
            </td>
            <td data-label="Registro"><time :datetime="b.createdAt" :title="format.fullDateTime(b.createdAt)">{{ format.shortDate(b.createdAt) }}</time></td>
            <td class="num" data-label="Clientes">{{ format.points(b.customers) }}</td>
            <td data-label="Estado">
              <span class="cell-stack">
                <StatusPill :meta="BUSINESS_STATUS[b.status]" :icon="BUSINESS_STATUS[b.status].icon" />
                <span v-if="b.status === 'pendiente' && b.phase" class="small muted">{{ REQUEST_PHASES[b.phase].label }}</span>
                <span v-if="b.statusReason" class="small muted status-reason" :title="b.statusReason.detail">{{ b.statusReason.detail }}</span>
              </span>
            </td>
            <td class="num" @click.stop>
              <div class="row-actions">
                <button v-for="a in b.actions" :key="a" type="button" class="btn btn--ghost btn--sm" @click="action.start(b, a)">
                  <BaseIcon :name="STATUS_ACTIONS[a].icon" :size="15" /> {{ STATUS_ACTIONS[a].label }}
                </button>
                <router-link class="btn btn--ghost btn--sm" :to="{ name: 'platform-business', params: { id: b.id } }" :aria-label="`Ver ${b.name}`"><BaseIcon name="eye" :size="15" /> Ver</router-link>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <ReasonSheet
      v-if="action.pending.value" :busy="action.busy.value" :server-error="action.serverError.value"
      :title="`${action.pending.value.def.label} ${action.pending.value.business.name}`" :help="action.pending.value.def.help"
      :label="action.pending.value.action === 'bloquear' ? 'Motivo del bloqueo' : 'Motivo de la suspensión'"
      placeholder="Ej.: Reclamos de clientes por canjes no entregados."
      :confirm-text="action.pending.value.def.label" tone="danger" @submit="action.submit" @close="action.cancel"
    />
  </template>
</template>
