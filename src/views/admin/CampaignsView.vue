<!--
  Campañas: enviar una promoción o aviso a un grupo de clientes (todos, un
  nivel, un segmento, VIP, frecuentes, inactivos o selección manual).
  Muestra a cuántos les llega antes de enviar, una vista previa de la
  notificación y el historial con cuántos la leyeron.
-->
<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import PageError from '../../components/admin/PageError.vue';
import PageHead from '../../components/admin/PageHead.vue';
import PageLoading from '../../components/admin/PageLoading.vue';
import BaseAlert from '../../components/base/BaseAlert.vue';
import BaseButton from '../../components/base/BaseButton.vue';
import BaseField from '../../components/base/BaseField.vue';
import BaseIcon from '../../components/base/BaseIcon.vue';
import EmptyState from '../../components/base/EmptyState.vue';
import ProgressBar from '../../components/base/ProgressBar.vue';
import NotificationItem from '../../components/loyalty/NotificationItem.vue';
import { useAsync } from '../../composables/useAsync.js';
import { useForm } from '../../composables/useForm.js';
import { toast } from '../../composables/useToast.js';
import { offers as Offers } from '../../domain/offers.js';
import { SEGMENTS } from '../../domain/segments.js';
import { campaignService } from '../../services/campaignService.js';
import { format } from '../../utils/format.js';
import { debounce } from '../../utils/helpers.js';
import { validators as v } from '../../utils/validators.js';

const AUDIENCES = { todos: 'Todos los clientes', nivel: 'Un nivel', segmento: 'Un segmento', vip: 'Clientes VIP', frecuentes: 'Clientes frecuentes', inactivos: 'Clientes inactivos', manual: 'Selección manual' };
const segmentOptions = Object.entries(SEGMENTS).map(([value, s]) => ({ value, label: s.label }));

const { data: d, error, run } = useAsync(() => campaignService.list());
const form = useForm(
  { audience: 'todos', levelId: '', segment: segmentOptions[0].value, manual: [], title: '', message: '', offerId: '' },
  { title: [v.filled('Escribí un título.')], message: [v.filled('Escribí el mensaje.')] },
);
onMounted(async () => {
  await run();
  if (d.value) form.values.levelId = d.value.levels[0]?.id ?? '';
});

const levelOptions = computed(() => (d.value?.levels || []).map((l) => ({ value: l.id, label: l.name })));
const offerOptions = computed(() => [{ value: '', label: 'Ninguna' }, ...(d.value?.offers || []).map((o) => ({ value: o.id, label: `${o.title} (${Offers.STATUS[o.effectiveStatus].label})` }))]);

/** Filtro de la selección manual. */
const manualQuery = ref('');
const manualList = computed(() => (d.value?.customers || []).filter((c) => !manualQuery.value || c.name.toLowerCase().includes(manualQuery.value.toLowerCase())));

/** Audiencia en el formato que espera la API. */
const audience = computed(() => {
  const f = form.values;
  const a = { type: f.audience };
  if (f.audience === 'nivel') a.value = Number(f.levelId);
  if (f.audience === 'segmento') a.value = f.segment;
  if (f.audience === 'manual') a.membershipIds = f.manual.map(Number);
  return a;
});

/** Cuántos clientes recibirían la campaña (lo calcula el servidor). */
const reach = ref(null);
const refreshReach = debounce(async () => {
  try { reach.value = await campaignService.previewAudience(audience.value); } catch { reach.value = null; }
}, 120);
watch(audience, refreshReach, { deep: true, immediate: true });
const reachText = computed(() => {
  const r = reach.value;
  if (!r) return 'Calculando…';
  if (!r.count) return 'Nadie cumple este criterio todavía.';
  return `Le llega a ${format.plural(r.count, 'cliente', 'clientes')}${r.sample.length ? ` (${r.sample.join(', ')}${r.count > r.sample.length ? '…' : ''})` : ''}`;
});

/** Vista previa de la notificación como la verá el cliente. */
const preview = computed(() => ({
  id: 0, type: 'campana', source: 'campaña', read: false, createdAt: new Date().toISOString(),
  title: form.values.title || 'Título de la campaña', body: form.values.message || 'El mensaje aparece acá.',
}));

/** Texto de la audiencia de una campaña enviada. */
function audienceLabel(a) {
  if (a.type === 'nivel') return `Nivel ${d.value.levels.find((l) => l.id === Number(a.value))?.name || ''}`;
  if (a.type === 'segmento') return `Segmento ${SEGMENTS[a.value]?.label || ''}`;
  if (a.type === 'manual') return `${(a.membershipIds || []).length} clientes elegidos`;
  return ({ todos: 'Todos los clientes', vip: 'Clientes VIP', frecuentes: 'Clientes frecuentes', inactivos: 'Clientes inactivos' })[a.type] || a.type;
}

async function send() {
  const c = await form.submit((values) => campaignService.send({
    title: values.title, message: values.message, offerId: values.offerId ? Number(values.offerId) : null, audience: audience.value,
  }), { title: 'No pudimos enviar' });
  if (!c) return;
  toast(`Campaña enviada a ${format.plural(c.recipients.length, 'cliente', 'clientes')}.`);
  form.reset({ ...form.values, manual: [], title: '', message: '', offerId: '' });
  run();
}
</script>

<template>
  <PageLoading v-if="!d && !error" />
  <PageError v-else-if="error" title="No pudimos cargar las campañas" :error="error" @retry="run" />

  <template v-else>
    <PageHead title="Campañas" description="Mandá promociones o avisos a un grupo de clientes. Les llega a la campana de la app (y como push cuando esté disponible)." />
    <div class="grid grid--main">
      <!-- Nueva campaña -->
      <form class="panel-card form-grid" novalidate @submit.prevent="send">
        <!-- Alerta general del formulario (mismo lugar que en la maqueta) -->
        <div><BaseAlert v-if="form.alert.value" v-bind="form.alert.value" /></div>
        <h2>Nueva campaña</h2>
        <div class="form-grid form-grid--2">
          <BaseField v-model="form.values.audience" name="audience" label="Destinatarios" type="select" :options="AUDIENCES" />
          <div v-show="form.values.audience === 'nivel'"><BaseField v-model="form.values.levelId" name="levelId" label="Nivel" type="select" :options="levelOptions" /></div>
          <div v-show="form.values.audience === 'segmento'"><BaseField v-model="form.values.segment" name="segment" label="Segmento" type="select" :options="segmentOptions" /></div>
        </div>
        <!-- Selección manual de clientes -->
        <fieldset v-show="form.values.audience === 'manual'" class="fieldset">
          <legend>Elegí los clientes</legend>
          <input v-model="manualQuery" type="search" class="field__input" placeholder="Filtrar por nombre" style="min-height: 42px" />
          <div class="check-list" style="max-height: 190px; overflow: auto; padding: 4px">
            <label v-for="c in manualList" :key="c.membershipId" class="check-chip">
              <input v-model="form.values.manual" type="checkbox" name="manual" :value="c.membershipId" /><span>{{ c.name }}</span>
            </label>
          </div>
        </fieldset>
        <div class="nudge nudge--sky"><BaseIcon name="users" :size="18" /><span>{{ reachText }}</span></div>
        <BaseField v-model="form.values.title" name="title" label="Título" placeholder="Ej.: 20% OFF este fin de semana para clientes Oro" :error="form.errors.title" />
        <BaseField v-model="form.values.message" name="message" label="Mensaje" type="textarea" placeholder="Contá la promo en una o dos frases." :error="form.errors.message" />
        <BaseField
          v-model="form.values.offerId" name="offerId" label="Vincular a una oferta (opcional)" type="select" :options="offerOptions"
          hint="Al tocar la notificación, el cliente va a la pestaña Ofertas."
        />
        <BaseButton type="submit" size="lg" icon="send" :loading="form.busy.value" loading-text="Enviando">Enviar campaña</BaseButton>
      </form>

      <aside class="stack">
        <!-- Vista previa -->
        <section class="panel-card">
          <p class="group-title" style="margin-top: 0">Vista previa</p>
          <ul><NotificationItem :notification="preview" /></ul>
        </section>
        <!-- Enviadas -->
        <section class="panel-card">
          <div class="panel-card__head"><h2>Enviadas</h2></div>
          <ul v-if="d.campaigns.length" class="stack">
            <li v-for="c in d.campaigns" :key="c.id" class="row" style="align-items: flex-start">
              <span class="notif__icon notif__icon--sky"><BaseIcon name="megaphone" :size="18" /></span>
              <div class="row__body">
                <p class="row__title">{{ c.title }}</p>
                <p class="small muted">{{ audienceLabel(c.audience) }} · {{ format.shortDate(c.sentAt) }}</p>
                <ProgressBar :value="c.recipientsCount ? c.readCount / c.recipientsCount : 0" label="Leída por" mod="bar--level" />
                <p class="small muted tabular">{{ c.readCount }} de {{ c.recipientsCount }} la leyeron</p>
              </div>
            </li>
          </ul>
          <EmptyState v-else icon="megaphone" title="Todavía no enviaste campañas" text="La primera puede ser un &quot;te extrañamos&quot; a los clientes inactivos." />
        </section>
      </aside>
    </div>
  </template>
</template>
