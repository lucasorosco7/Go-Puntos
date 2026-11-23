<!--
  Solicitudes de alta de negocios (solicitudes_negocio).
  Etapas (se calculan, no son estados nuevos):
    En revisión     pendiente + enviada por el dueño → se puede aprobar o rechazar
    En preparación  pendiente + todavía no enviada  → el dueño está configurando
    Aprobadas / Rechazadas
  Aprobar: el negocio pasa a 'activo' y el solicitante queda como su
  administrador (ya lo es desde el registro). Rechazar: motivo obligatorio,
  el negocio pasa a 'rechazado' y el dueño ve el motivo en su panel.
  Todo queda en la auditoría de la plataforma.
-->
<script setup>
import { computed, nextTick, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import PageError from '../../components/admin/PageError.vue';
import PageHead from '../../components/admin/PageHead.vue';
import PageLoading from '../../components/admin/PageLoading.vue';
import BaseAlert from '../../components/base/BaseAlert.vue';
import BaseIcon from '../../components/base/BaseIcon.vue';
import ChipTabs from '../../components/base/ChipTabs.vue';
import EmptyState from '../../components/base/EmptyState.vue';
import StatusPill from '../../components/base/StatusPill.vue';
import BusinessCell from '../../components/platform/BusinessCell.vue';
import ReasonSheet from '../../components/platform/ReasonSheet.vue';
import { useAsync } from '../../composables/useAsync.js';
import { toast } from '../../composables/useToast.js';
import { REQUEST_PHASES } from '../../domain/platform.js';
import { platformService } from '../../services/platformService.js';
import { usePlatformStore } from '../../stores/platform.js';
import { format } from '../../utils/format.js';

const route = useRoute();
const platform = usePlatformStore();
const { data: list, error, run } = useAsync(() => platformService.listRequests());

const tab = ref('revision');
/** Pestañas en el orden de trabajo: primero lo que espera una decisión. */
const TAB_LABELS = { revision: 'En revisión', preparacion: 'En preparación', aprobada: 'Aprobadas', rechazada: 'Rechazadas' };
const tabs = computed(() => [
  ...Object.entries(TAB_LABELS).map(([k, label]) => [k, `${label} · ${(list.value || []).filter((r) => r.phase === k).length}`]),
  ['todas', `Todas · ${list.value?.length ?? 0}`],
]);
const rows = computed(() => (list.value || []).filter((r) => tab.value === 'todas' || r.phase === tab.value));

onMounted(async () => {
  await run();
  // Viene del dashboard con ?ver=<id>: abre la pestaña de esa solicitud y la resalta
  const id = Number(route.query.ver);
  const target = id && list.value?.find((r) => r.id === id);
  if (target) {
    tab.value = target.phase;
    await nextTick();
    document.getElementById(`solicitud-${id}`)?.scrollIntoView({ block: 'center' });
  }
});

/* ---------- Aprobar o rechazar ---------- */
/** Acción en curso: { request, approve } */
const pending = ref(null);
const busy = ref(false);
const serverError = ref('');

function ask(request, approve) {
  serverError.value = '';
  pending.value = { request, approve };
}

async function decide(reason) {
  const { request, approve } = pending.value;
  busy.value = true;
  serverError.value = '';
  try {
    if (approve) await platformService.approveRequest(request.id, { reason });
    else await platformService.rejectRequest(request.id, { reason });
    toast(approve ? `${request.business.name} fue aprobado y ya puede operar.` : `Rechazaste la solicitud de ${request.business.name}. El dueño verá el motivo en su panel.`);
    pending.value = null;
    await run();
    platform.refresh().catch(() => {});
  } catch (err) {
    serverError.value = err.message;
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <PageLoading v-if="!list && !error" />
  <PageError v-else-if="error" title="No pudimos cargar las solicitudes" :error="error" @retry="run" />

  <template v-else>
    <PageHead title="Solicitudes de alta" description="Cada negocio se registra con una invitación, configura su programa y lo envía a revisión. Un negocio no opera con clientes hasta que lo aprobás." />

    <ChipTabs v-model="tab" :items="tabs" label="Etapa de las solicitudes" />

    <EmptyState
      v-if="!rows.length" icon="clipboard-check"
      :title="tab === 'revision' ? 'No hay solicitudes esperando revisión' : 'No hay solicitudes en esta etapa'"
      :text="tab === 'revision' ? 'Cuando un negocio envíe su programa a revisión, aparece acá.' : 'Probá con otra pestaña.'"
    />
    <div v-else class="request-grid">
      <article v-for="r in rows" :id="`solicitud-${r.id}`" :key="r.id" class="panel-card request-card" :class="{ 'is-target': Number(route.query.ver) === r.id }">
        <header class="request-card__head">
          <BusinessCell :business="r.business" :size="44" />
          <StatusPill :meta="REQUEST_PHASES[r.phase]" :icon="REQUEST_PHASES[r.phase].icon" />
        </header>

        <dl class="facts">
          <div><dt>Solicitante</dt><dd>{{ r.applicant.firstName }} {{ r.applicant.lastName }}<br /><span class="small muted">{{ r.applicant.email }} · {{ r.applicant.phone || 'sin teléfono' }}</span></dd></div>
          <div><dt>Registrado</dt><dd>{{ format.fullDateTime(r.createdAt) }}</dd></div>
          <div><dt>Enviada a revisión</dt><dd>{{ r.submittedAt ? format.fullDateTime(r.submittedAt) : 'Todavía no' }}</dd></div>
          <div v-if="r.reviewedAt"><dt>{{ r.status === 'aprobada' ? 'Aprobada' : 'Rechazada' }}</dt><dd>{{ format.fullDateTime(r.reviewedAt) }} · {{ r.reviewerName }}</dd></div>
          <div><dt>Contacto del negocio</dt><dd>{{ [r.business.address, r.business.phone, r.business.email].filter(Boolean).join(' · ') || 'Sin datos de contacto' }}</dd></div>
        </dl>

        <!-- Configuración del programa -->
        <p class="group-title" style="margin-top: var(--sp-3)">Configuración del programa</p>
        <ul class="check-list">
          <li v-for="x in r.checklist" :key="x.key"><span class="check-chip" :class="{ 'is-missing': !x.ok }"><span><BaseIcon :name="x.ok ? 'circle-check' : 'circle-alert'" :size="14" /> {{ x.label }}</span></span></li>
        </ul>
        <p class="small muted">{{ format.plural(r.counts.levels, 'nivel', 'niveles') }} · {{ format.plural(r.counts.rewards, 'recompensa activa', 'recompensas activas') }} · {{ format.plural(r.counts.offers, 'oferta', 'ofertas') }}</p>

        <BaseAlert v-if="r.status === 'rechazada'" tone="error" title="Motivo del rechazo" :text="r.reason" />
        <BaseAlert v-else-if="r.status === 'aprobada' && r.reason" tone="success" :text="`Comentario: ${r.reason}`" />
        <BaseAlert v-else-if="r.phase === 'preparacion'" tone="info" text="El negocio todavía está configurando su programa. Vas a poder revisarla cuando la envíe." />

        <footer class="request-card__actions">
          <router-link class="btn btn--ghost btn--sm" :to="{ name: 'platform-business', params: { id: r.business.id } }"><BaseIcon name="eye" :size="15" /> Ver negocio</router-link>
          <template v-if="r.phase === 'revision'">
            <button type="button" class="btn btn--outline btn--sm" @click="ask(r, false)"><BaseIcon name="circle-x" :size="15" /> Rechazar</button>
            <button type="button" class="btn btn--sm" @click="ask(r, true)"><BaseIcon name="circle-check" :size="15" /> Aprobar</button>
          </template>
        </footer>
      </article>
    </div>

    <!-- Confirmación con motivo -->
    <ReasonSheet
      v-if="pending" :busy="busy" :server-error="serverError"
      :title="pending.approve ? `¿Aprobar ${pending.request.business.name}?` : `Rechazar la solicitud de ${pending.request.business.name}`"
      :description="pending.approve ? 'El negocio pasa a estado activo y empieza a operar con clientes.' : 'El negocio pasa a estado rechazado. El dueño verá el motivo y podrá corregir y reenviar.'"
      :help="pending.approve ? `${pending.request.applicant.firstName} ${pending.request.applicant.lastName} queda como administrador del negocio y ya puede registrar compras, canjes y sumar clientes con su QR.` : ''"
      :required="!pending.approve" :label="pending.approve ? 'Comentario' : 'Motivo del rechazo'"
      :placeholder="pending.approve ? 'Ej.: Configuración completa.' : 'Ej.: Falta la dirección del local y un teléfono de contacto.'"
      :confirm-text="pending.approve ? 'Aprobar negocio' : 'Rechazar solicitud'" :tone="pending.approve ? '' : 'danger'"
      @submit="decide" @close="pending = null"
    />
  </template>
</template>
