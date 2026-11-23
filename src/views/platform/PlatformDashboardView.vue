<!--
  Dashboard de la plataforma (Superadmin).
  Indicadores globales calculados en vivo por el servicio (no son números
  fijos): negocios por estado, solicitudes para revisar, invitaciones,
  usuarios, solicitudes en espera y actividad administrativa reciente.
  Se actualiza cada vez que se aprueba, rechaza, suspende o invita.
-->
<script setup>
import { computed, onMounted } from 'vue';
import HBars from '../../components/admin/HBars.vue';
import PageError from '../../components/admin/PageError.vue';
import PageHead from '../../components/admin/PageHead.vue';
import PageLoading from '../../components/admin/PageLoading.vue';
import StatTile from '../../components/admin/StatTile.vue';
import BaseIcon from '../../components/base/BaseIcon.vue';
import EmptyState from '../../components/base/EmptyState.vue';
import StatusPill from '../../components/base/StatusPill.vue';
import AuditList from '../../components/platform/AuditList.vue';
import BusinessCell from '../../components/platform/BusinessCell.vue';
import { BUSINESS_STATUS } from '../../domain/platform.js';
import { useAuthStore } from '../../stores/auth.js';
import { usePlatformStore } from '../../stores/platform.js';
import { format } from '../../utils/format.js';

const auth = useAuthStore();
const store = usePlatformStore();
const d = computed(() => store.summary);
const k = computed(() => d.value?.kpis);

onMounted(() => store.refresh().catch(() => {}));
const retry = () => store.refresh().catch(() => {});
</script>

<template>
  <PageLoading v-if="!d && !store.error" height="420px" />
  <PageError v-else-if="!d" title="No pudimos cargar el estado de la plataforma" :error="store.error" @retry="retry" />

  <template v-else>
    <PageHead :title="`Hola, ${auth.user.firstName}`" description="Así está GO Puntos hoy: negocios, solicitudes, invitaciones y actividad del equipo de administración.">
      <router-link class="btn btn--outline" :to="{ name: 'platform-requests' }"><BaseIcon name="clipboard-list" :size="17" /> Revisar solicitudes</router-link>
      <router-link class="btn" :to="{ name: 'platform-invitations', query: { nueva: '1' } }"><BaseIcon name="mail-plus" :size="17" /> Nueva invitación</router-link>
    </PageHead>

    <!-- Indicadores: negocios (marca), aprobación (acento), alertas (rojo), accesos (info) -->
    <div class="grid grid--stats">
      <StatTile tone="marca" label="Negocios registrados" :value="format.points(k.businesses)" icon="building-2" :hint="format.plural(k.rejected, 'rechazado', 'rechazados')" />
      <StatTile tone="marca" label="Negocios activos" :value="format.points(k.active)" icon="circle-check" :hint="k.businesses ? `${format.percent(k.active / k.businesses)} del total` : ''" />
      <StatTile tone="acento" label="Pendientes de aprobación" :value="format.points(k.pending)" icon="hourglass" :hint="`${format.points(k.requestsInPreparation)} en preparación`" />
      <StatTile tone="acento" label="Solicitudes para revisar" :value="format.points(k.requestsToReview)" icon="clipboard-list" hint="Enviadas por los negocios" />
      <StatTile tone="alerta" label="Suspendidos o bloqueados" :value="format.points(k.suspended + k.blocked)" icon="circle-pause" :hint="`${format.plural(k.suspended, 'suspendido', 'suspendidos')} · ${format.plural(k.blocked, 'bloqueado', 'bloqueados')}`" />
      <StatTile tone="info" label="Invitaciones enviadas" :value="format.points(k.invitationsSent)" icon="mail-plus" :hint="`${format.plural(k.invitationsPending, 'vigente', 'vigentes')} · ${format.plural(k.invitationsUsed, 'utilizada', 'utilizadas')}`" />
      <StatTile tone="info" label="Usuarios de la plataforma" :value="format.points(k.users)" icon="users-round" :hint="`${format.points(k.customers)} participan como clientes`" />
    </div>

    <div class="grid grid--main" style="margin-top: var(--sp-4)">
      <!-- Solicitudes esperando decisión -->
      <section class="panel-card">
        <div class="panel-card__head"><h2>Solicitudes para revisar</h2><router-link class="link" :to="{ name: 'platform-requests' }">Ver todas</router-link></div>
        <EmptyState v-if="!d.toReview.length" icon="clipboard-check" title="No hay solicitudes esperando revisión" text="Cuando un negocio envíe su programa a revisión, aparece acá." />
        <ul v-else class="review-list">
          <li v-for="r in d.toReview" :key="r.id">
            <BusinessCell :business="r.business" />
            <span class="small muted">Enviada {{ format.relative(r.submittedAt).toLowerCase() }} por {{ r.applicant.firstName }} {{ r.applicant.lastName }}</span>
            <router-link class="btn btn--sm" :to="{ name: 'platform-requests', query: { ver: r.id } }">Revisar</router-link>
          </li>
        </ul>
      </section>

      <!-- Negocios por estado -->
      <section class="panel-card">
        <div class="panel-card__head"><h2>Negocios por estado</h2><router-link class="link" :to="{ name: 'platform-businesses' }">Ver negocios</router-link></div>
        <HBars :items="d.byStatus.map((x) => ({ key: x.status, status: x.status, value: x.count }))" :total="k.businesses">
          <template #label="{ item }"><StatusPill :meta="BUSINESS_STATUS[item.status]" /></template>
        </HBars>
      </section>
    </div>

    <!-- Actividad administrativa -->
    <section class="panel-card" style="margin-top: var(--sp-4)">
      <div class="panel-card__head"><h2>Actividad administrativa reciente</h2><router-link class="link" :to="{ name: 'platform-audit' }">Ver auditoría</router-link></div>
      <EmptyState v-if="!d.recent.length" icon="scroll-text" title="Sin actividad todavía" text="Las invitaciones, aprobaciones y cambios de estado quedan registrados acá." />
      <AuditList v-else :items="d.recent" />
    </section>
  </template>
</template>
