<!--
  Ficha de un negocio para el Superadmin: datos, estado (con el motivo de
  suspensión o bloqueo), administrador responsable y equipo, estadísticas
  básicas, solicitud de alta e historial de acciones de la plataforma.
  Desde acá se puede suspender, bloquear o reactivar (con confirmación).
  El Superadmin NO entra al panel del negocio: sólo ve esta ficha.
-->
<script setup>
import { computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import PageError from '../../components/admin/PageError.vue';
import PageHead from '../../components/admin/PageHead.vue';
import PageLoading from '../../components/admin/PageLoading.vue';
import StatTile from '../../components/admin/StatTile.vue';
import BaseAlert from '../../components/base/BaseAlert.vue';
import BaseIcon from '../../components/base/BaseIcon.vue';
import EmptyState from '../../components/base/EmptyState.vue';
import StatusPill from '../../components/base/StatusPill.vue';
import AuditList from '../../components/platform/AuditList.vue';
import BusinessCell from '../../components/platform/BusinessCell.vue';
import ReasonSheet from '../../components/platform/ReasonSheet.vue';
import { useAsync } from '../../composables/useAsync.js';
import { useBusinessStatusAction } from '../../composables/useBusinessStatusAction.js';
import { STAFF_ROLES } from '../../config/catalogs.js';
import { BUSINESS_STATUS, REQUEST_PHASES, STATUS_ACTIONS } from '../../domain/platform.js';
import { platformService } from '../../services/platformService.js';
import { format } from '../../utils/format.js';

const route = useRoute();
const { data: b, error, run } = useAsync(() => platformService.getBusiness(Number(route.params.id)));
onMounted(run);
const action = useBusinessStatusAction(() => run());

const statusInfo = computed(() => BUSINESS_STATUS[b.value?.status] || {});
</script>

<template>
  <PageLoading v-if="!b && !error" />
  <PageError v-else-if="error" title="No pudimos cargar el negocio" :error="error" @retry="run" />

  <template v-else>
    <p style="margin-bottom: var(--sp-3)"><router-link class="link" :to="{ name: 'platform-businesses' }"><BaseIcon name="arrow-left" :size="15" /> Negocios</router-link></p>
    <PageHead :title="b.name || 'Negocio sin nombre'" :description="b.description || 'Sin descripción.'">
      <button v-for="a in b.actions" :key="a" type="button" class="btn" :class="a === 'reactivar' ? '' : 'btn--outline'" @click="action.start(b, a)">
        <BaseIcon :name="STATUS_ACTIONS[a].icon" :size="17" /> {{ STATUS_ACTIONS[a].label }}
      </button>
    </PageHead>

    <div class="detail-status">
      <BusinessCell :business="b" :size="48" />
      <StatusPill :meta="statusInfo" :icon="statusInfo.icon" />
      <StatusPill v-if="b.status === 'pendiente' && b.phase" :meta="REQUEST_PHASES[b.phase]" />
    </div>

    <!-- Motivo de la suspensión o el bloqueo -->
    <BaseAlert
      v-if="b.statusReason" :tone="b.status === 'bloqueado' ? 'error' : 'info'"
      :title="`${b.status === 'bloqueado' ? 'Bloqueado' : 'Suspendido'} el ${format.longDate(b.statusReason.date)}`" :text="`Motivo: ${b.statusReason.detail}`"
      style="margin-bottom: var(--sp-4)"
    />
    <BaseAlert v-else-if="b.status !== 'activo'" tone="info" text="Este negocio no está activo: no puede registrar compras, canjes ni sumar clientes." style="margin-bottom: var(--sp-4)" />

    <div class="grid grid--stats">
      <StatTile tone="info" label="Clientes" :value="format.points(b.stats.customers)" icon="users" />
      <StatTile tone="marca" label="Compras registradas" :value="format.points(b.stats.purchases)" icon="shopping-bag" />
      <StatTile tone="acento" label="Recompensas" :value="format.points(b.stats.rewards)" icon="gift" />
      <StatTile tone="acento" label="Canjes" :value="format.points(b.stats.redemptions)" icon="package" />
    </div>

    <div class="grid grid--2" style="margin-top: var(--sp-4)">
      <!-- Datos y equipo -->
      <section class="panel-card">
        <div class="panel-card__head"><h2>Datos del negocio</h2></div>
        <dl class="facts">
          <div><dt>Registrado</dt><dd>{{ format.fullDateTime(b.createdAt) }}</dd></div>
          <div><dt>Dirección</dt><dd>{{ [b.address, b.city].filter(Boolean).join(', ') || 'Sin dirección' }}</dd></div>
          <div><dt>Contacto</dt><dd>{{ [b.phone, b.email].filter(Boolean).join(' · ') || 'Sin datos de contacto' }}</dd></div>
          <div><dt>QR público</dt><dd class="tabular">/unirse/{{ b.slug }}</dd></div>
        </dl>
        <p class="group-title">Administrador responsable y equipo</p>
        <ul class="team-list">
          <li v-for="p in b.team" :key="p.id">
            <span>{{ p.firstName }} {{ p.lastName }}<br /><span class="small muted">{{ p.email }}</span></span>
            <span class="pill">{{ STAFF_ROLES[p.role] }}</span>
          </li>
        </ul>
      </section>

      <!-- Solicitud de alta -->
      <section class="panel-card">
        <div class="panel-card__head"><h2>Solicitud de alta</h2><router-link v-if="b.request" class="link" :to="{ name: 'platform-requests', query: { ver: b.request.id } }">Ver en solicitudes</router-link></div>
        <EmptyState v-if="!b.request" icon="clipboard-list" title="Sin solicitud registrada" text="Este negocio no tiene solicitud de alta asociada." />
        <template v-else>
          <p style="margin-bottom: var(--sp-3)"><StatusPill :meta="REQUEST_PHASES[b.request.phase]" :icon="REQUEST_PHASES[b.request.phase].icon" /></p>
          <dl class="facts">
            <div><dt>Invitación</dt><dd>#{{ b.request.invitationId }}</dd></div>
            <div><dt>Solicitante</dt><dd>{{ b.request.applicant.firstName }} {{ b.request.applicant.lastName }} · {{ b.request.applicant.email }}</dd></div>
            <div><dt>Enviada a revisión</dt><dd>{{ b.request.submittedAt ? format.fullDateTime(b.request.submittedAt) : 'Todavía no' }}</dd></div>
            <div v-if="b.request.reviewedAt"><dt>Revisada</dt><dd>{{ format.fullDateTime(b.request.reviewedAt) }} · {{ b.request.reviewerName }}</dd></div>
            <div v-if="b.request.reason"><dt>{{ b.request.status === 'rechazada' ? 'Motivo del rechazo' : 'Comentario' }}</dt><dd>{{ b.request.reason }}</dd></div>
          </dl>
        </template>
      </section>
    </div>

    <!-- Historial de la plataforma para este negocio -->
    <section class="panel-card" style="margin-top: var(--sp-4)">
      <div class="panel-card__head"><h2>Historial en la plataforma</h2></div>
      <EmptyState v-if="!b.history.length" icon="scroll-text" title="Sin acciones registradas" text="Las aprobaciones y cambios de estado de este negocio aparecen acá." />
      <AuditList v-else :items="b.history" hide-business />
    </section>

    <ReasonSheet
      v-if="action.pending.value" :busy="action.busy.value" :server-error="action.serverError.value"
      :title="`${action.pending.value.def.label} ${b.name}`" :help="action.pending.value.def.help"
      :label="action.pending.value.action === 'bloquear' ? 'Motivo del bloqueo' : 'Motivo de la suspensión'"
      placeholder="Ej.: Reclamos de clientes por canjes no entregados."
      :confirm-text="action.pending.value.def.label" tone="danger" @submit="action.submit" @close="action.cancel"
    />
  </template>
</template>
