<!--
  Invitaciones para registrar negocios (invitaciones_registro).
  - Generar una invitación (email opcional y vigencia) → enlace único.
    El enlace se muestra UNA sola vez para copiarlo: en la base queda sólo
    el hash del token (token_hash), así que después no se puede recuperar.
  - Listado con estado: pendiente, utilizada, vencida (calculada con la
    fecha de vencimiento) y revocada. Filtro por estado.
  - Revocar las que todavía no se usaron (con confirmación).
  Cada creación y revocación queda en la auditoría de la plataforma.
-->
<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';
import PageError from '../../components/admin/PageError.vue';
import PageHead from '../../components/admin/PageHead.vue';
import PageLoading from '../../components/admin/PageLoading.vue';
import BaseAlert from '../../components/base/BaseAlert.vue';
import BaseButton from '../../components/base/BaseButton.vue';
import BaseField from '../../components/base/BaseField.vue';
import BaseIcon from '../../components/base/BaseIcon.vue';
import BaseSheet from '../../components/base/BaseSheet.vue';
import ChipTabs from '../../components/base/ChipTabs.vue';
import EmptyState from '../../components/base/EmptyState.vue';
import StatusPill from '../../components/base/StatusPill.vue';
import { useAsync } from '../../composables/useAsync.js';
import { confirm } from '../../composables/useConfirm.js';
import { toast } from '../../composables/useToast.js';
import { INVITATION_DAYS, INVITATION_STATUS } from '../../domain/platform.js';
import { platformService } from '../../services/platformService.js';
import { usePlatformStore } from '../../stores/platform.js';
import { format } from '../../utils/format.js';

const route = useRoute();
const platform = usePlatformStore();
const { data: list, error, run } = useAsync(() => platformService.listInvitations());
onMounted(() => {
  run();
  if (route.query.nueva) openForm();
});

/* ---------- Filtro ---------- */
const filter = ref('todas');
const tabs = computed(() => [
  ['todas', `Todas · ${list.value?.length ?? 0}`],
  ...Object.entries(INVITATION_STATUS).map(([k, v]) => [k, `${v.label}s · ${(list.value || []).filter((i) => i.status === k).length}`]),
]);
const rows = computed(() => (list.value || []).filter((i) => filter.value === 'todas' || i.status === filter.value));

/* ---------- Nueva invitación ---------- */
const formOpen = ref(false);
const form = reactive({ email: '', days: 7, busy: false, error: '' });
/** Invitación recién creada: { invitation, link } (el enlace se muestra una sola vez). */
const created = ref(null);
const copied = ref(false);
const dayOptions = Object.fromEntries(INVITATION_DAYS.map((d) => [d, `${d} días`]));

function openForm() {
  Object.assign(form, { email: '', days: 7, busy: false, error: '' });
  created.value = null;
  copied.value = false;
  formOpen.value = true;
}

/** Enlace de registro con el token (misma dirección donde corre la app). */
const linkFor = (token) => `${window.location.origin}/registro-negocio?invitacion=${encodeURIComponent(token)}`;

async function create() {
  form.busy = true;
  form.error = '';
  try {
    const r = await platformService.createInvitation({ email: form.email.trim(), days: Number(form.days) });
    created.value = { invitation: r.invitation, link: linkFor(r.token) };
    toast('Invitación creada. Copiá el enlace y compartilo con el comercio.');
    run();
    platform.refresh().catch(() => {});
  } catch (err) {
    form.error = err.message;
  } finally {
    form.busy = false;
  }
}

async function copy() {
  try {
    await navigator.clipboard.writeText(created.value.link);
    copied.value = true;
    toast('Enlace copiado.');
  } catch {
    // Sin permiso para el portapapeles: se selecciona el texto para copiarlo a mano
    document.getElementById('invite-link')?.select();
    toast('Seleccionamos el enlace: copialo con Ctrl+C.', 'error');
  }
}

/* ---------- Revocar ---------- */
async function revoke(inv) {
  const ok = await confirm({
    title: '¿Revocar esta invitación?',
    description: `${inv.email || 'Invitación sin destinatario'} · creada el ${format.shortDate(inv.createdAt)}`,
    body: 'El enlace deja de funcionar de inmediato y no se puede volver a activar. Si el comercio la necesita, generá una nueva.',
    confirmText: 'Revocar', tone: 'danger',
  });
  if (!ok) return;
  try {
    await platformService.revokeInvitation(inv.id);
    toast('Invitación revocada.');
    run();
    platform.refresh().catch(() => {});
  } catch (err) {
    toast(err.message, 'error');
  }
}
</script>

<template>
  <PageLoading v-if="!list && !error" />
  <PageError v-else-if="error" title="No pudimos cargar las invitaciones" :error="error" @retry="run" />

  <template v-else>
    <PageHead title="Invitaciones" description="Sólo se puede registrar un negocio con una invitación vigente. Cada enlace sirve una vez y vence en la fecha indicada.">
      <button type="button" class="btn" @click="openForm"><BaseIcon name="mail-plus" :size="17" /> Nueva invitación</button>
    </PageHead>

    <ChipTabs v-model="filter" :items="tabs" label="Estado de las invitaciones" />

    <EmptyState v-if="!list.length" icon="mail-plus" title="Todavía no hay invitaciones" text="Generá la primera para que un comercio pueda registrarse.">
      <template #action><button type="button" class="btn btn--sm" @click="openForm">Nueva invitación</button></template>
    </EmptyState>
    <EmptyState v-else-if="!rows.length" icon="filter-x" title="No hay invitaciones en este estado" text="Probá con otro filtro." />
    <div v-else class="table-wrap">
      <table class="table table--cards">
        <thead>
          <tr><th>Invitación</th><th>Creada</th><th>Vence</th><th>Estado</th><th>Negocio registrado</th><th><span class="sr-only">Acciones</span></th></tr>
        </thead>
        <tbody>
          <tr v-for="i in rows" :key="i.id">
            <td>
              <p><b>#{{ i.id }}</b> · {{ i.email || 'Sin destinatario' }}</p>
              <p class="small muted">Creada por {{ i.createdBy }}</p>
            </td>
            <td data-label="Creada"><time :datetime="i.createdAt" :title="format.fullDateTime(i.createdAt)">{{ format.shortDate(i.createdAt) }}</time></td>
            <td data-label="Vence"><time :datetime="i.expiresAt" :title="format.fullDateTime(i.expiresAt)">{{ format.shortDate(i.expiresAt) }}</time></td>
            <td data-label="Estado"><StatusPill :meta="INVITATION_STATUS[i.status]" :icon="INVITATION_STATUS[i.status].icon" /></td>
            <td data-label="Negocio">
              <router-link v-if="i.business" class="link" :to="{ name: 'platform-business', params: { id: i.business.id } }">{{ i.business.name }}</router-link>
              <span v-else class="muted">—</span>
            </td>
            <td class="num">
              <button v-if="i.status === 'pendiente'" type="button" class="btn btn--ghost btn--sm" @click="revoke(i)"><BaseIcon name="ban" :size="15" /> Revocar</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Nueva invitación -->
    <BaseSheet v-if="formOpen" :title="created ? 'Invitación lista' : 'Nueva invitación'" :description="created ? '' : 'El enlace permite registrar un solo negocio y vence en la fecha que elijas.'" @close="formOpen = false">
      <!-- Paso 2: enlace generado (se muestra una sola vez) -->
      <div v-if="created" class="reason-form">
        <BaseAlert tone="success" title="Copiá el enlace ahora" text="Por seguridad sólo guardamos una huella del enlace: después no se puede volver a mostrar. Si lo perdés, revocá esta invitación y generá otra." />
        <label class="field__label" for="invite-link">Enlace de registro</label>
        <div class="invite-link">
          <input id="invite-link" class="field__input" :value="created.link" readonly @focus="$event.target.select()" />
          <button type="button" class="btn" @click="copy"><BaseIcon :name="copied ? 'check' : 'copy'" :size="16" /> {{ copied ? 'Copiado' : 'Copiar' }}</button>
        </div>
        <p class="small muted">
          Invitación #{{ created.invitation.id }}{{ created.invitation.email ? ` para ${created.invitation.email}` : '' }} · vence el {{ format.longDate(created.invitation.expiresAt) }}.
        </p>
        <a class="link small" :href="created.link" target="_blank" rel="noopener"><BaseIcon name="external-link" :size="13" /> Abrir el enlace en otra pestaña</a>
      </div>
      <!-- Paso 1: datos -->
      <form v-else novalidate class="reason-form" @submit.prevent="create">
        <BaseAlert v-if="form.error" tone="error" :text="form.error" />
        <BaseField
          v-model="form.email" name="email" label="Email del comercio (opcional)" type="email" icon="mail" placeholder="hola@comercio.com"
          hint="Si lo completás, el registro sólo se puede hacer con ese email."
        />
        <BaseField v-model="form.days" name="days" label="Vigencia" type="select" :options="dayOptions" />
      </form>
      <template #actions="{ close }">
        <template v-if="created">
          <button type="button" class="btn btn--ghost" @click="openForm">Generar otra</button>
          <button type="button" class="btn" @click="close">Listo</button>
        </template>
        <template v-else>
          <button type="button" class="btn btn--ghost" @click="close">Cancelar</button>
          <BaseButton icon="link" :loading="form.busy" loading-text="Generando" @click="create">Generar enlace</BaseButton>
        </template>
      </template>
    </BaseSheet>
  </template>
</template>
