<!--
  Ofertas del negocio: descuentos, puntos dobles, puntos extra,
  beneficios por nivel y promociones temporales.
  Estados: borrador, activa (o programada si todavía no empieza), pausada
  y finalizada. Las de puntos se aplican en Caja.
-->
<script setup>
import { computed, onMounted, ref } from 'vue';
import ActionsSheet from '../../components/admin/ActionsSheet.vue';
import PageError from '../../components/admin/PageError.vue';
import PageHead from '../../components/admin/PageHead.vue';
import PageLoading from '../../components/admin/PageLoading.vue';
import BaseIcon from '../../components/base/BaseIcon.vue';
import ChipTabs from '../../components/base/ChipTabs.vue';
import EmptyState from '../../components/base/EmptyState.vue';
import StatusPill from '../../components/base/StatusPill.vue';
import OfferEditor from '../../components/editors/OfferEditor.vue';
import RewardArt from '../../components/loyalty/RewardArt.vue';
import { useAsync } from '../../composables/useAsync.js';
import { confirm } from '../../composables/useConfirm.js';
import { toast } from '../../composables/useToast.js';
import { offers as Offers } from '../../domain/offers.js';
import { offerService } from '../../services/offerService.js';

const filter = ref('todas');
const editing = ref(null);
const menuFor = ref(null);
const { data, error, run } = useAsync(() => offerService.list());
onMounted(run);

const tabs = computed(() => [['todas', `Todas · ${data.value.offers.length}`],
  ...Object.entries(Offers.STATUS).map(([k, s]) => [k, `${s.label} · ${data.value.offers.filter((o) => o.effectiveStatus === k).length}`])]);
const list = computed(() => data.value.offers.filter((o) => filter.value === 'todas' || o.effectiveStatus === filter.value));
const levelNames = (o) => (o.levelIds || []).map((id) => data.value.levels.find((l) => l.id === id)?.name).filter(Boolean);

function setStatus(o, st, msg) {
  return async () => {
    try {
      const res = await offerService.setStatus(o.id, st);
      toast(res.notified ? `${msg} Avisamos a ${res.notified} clientes.` : msg);
      run();
    } catch (err) { toast(err.message, 'error'); }
  };
}
const actions = computed(() => {
  const o = menuFor.value;
  if (!o) return [];
  const a = [{ icon: 'pencil', label: 'Editar', run: () => { editing.value = o; } }];
  if (o.status !== 'activa') a.push({ icon: 'send', label: 'Publicar', hint: 'La ven los clientes (y les avisamos).', run: setStatus(o, 'activa', 'Oferta publicada.') });
  if (o.status === 'activa') a.push({ icon: 'pause', label: 'Pausar', run: setStatus(o, 'pausada', 'Oferta pausada.') });
  if (o.status !== 'finalizada') a.push({ icon: 'flag', label: 'Finalizar', run: setStatus(o, 'finalizada', 'Oferta finalizada.') });
  a.push({ icon: 'copy', label: 'Duplicar', hint: 'Crea una copia en borrador.', run: () => { editing.value = { ...o, id: null, title: `${o.title} (copia)`, status: 'borrador', featured: false }; } });
  a.push({
    icon: 'trash-2', label: 'Eliminar', tone: 'danger',
    run: async () => {
      if (!await confirm({ title: `¿Eliminar "${o.title}"?`, description: 'Si ya se usó, mejor finalizala para conservar el historial.', confirmText: 'Eliminar', tone: 'danger' })) return;
      try { await offerService.remove(o.id); toast('Oferta eliminada.'); run(); } catch (err) { toast(err.message, 'error'); }
    },
  });
  return a;
});
</script>

<template>
  <PageHead title="Ofertas" description="Las promociones activas aparecen en la pestaña Ofertas de tus clientes. Las de puntos se aplican en Caja.">
    <button type="button" class="btn" @click="editing = {}"><BaseIcon name="plus" :size="17" /> Nueva oferta</button>
  </PageHead>

  <PageLoading v-if="!data && !error" />
  <PageError v-else-if="error" title="No pudimos cargar las ofertas" :error="error" @retry="run" />
  <template v-else>
    <ChipTabs v-model="filter" :items="tabs" label="Estado" />
    <EmptyState v-if="!data.offers.length" icon="tag" title="Todavía no hay ofertas" text="Creá una promoción: por ejemplo, puntos dobles los fines de semana.">
      <template #action><button type="button" class="btn btn--sm" @click="editing = {}">Crear oferta</button></template>
    </EmptyState>
    <EmptyState v-else-if="!list.length" icon="tag" title="No hay ofertas en este estado" text="Probá con otro filtro." />
    <ul v-else class="stack">
      <li v-for="o in list" :key="o.id" class="row" style="align-items: flex-start">
        <RewardArt :category="o.category" :size="56" :icon-size="24" :image="o.image" />
        <div class="row__body" style="display: grid; gap: 4px">
          <div class="check-list">
            <span class="pill" :class="`pill--${Offers.tone(o)}`">{{ Offers.tag(o) }}</span>
            <StatusPill :meta="Offers.STATUS[o.effectiveStatus]" />
            <span v-if="o.featured" class="pill"><BaseIcon name="star" :size="12" /> Destacada</span>
          </div>
          <p class="row__title">{{ o.title }}</p>
          <p class="small muted">{{ Offers.TYPES[o.type].label }} · {{ Offers.when(o) }}{{ levelNames(o).length ? ` · Sólo ${levelNames(o).join(', ')}` : '' }}</p>
          <p v-if="o.conditions" class="small subtle">{{ o.conditions }}</p>
        </div>
        <button type="button" class="btn btn--ghost btn--sm" :aria-label="`Acciones de ${o.title}`" @click="menuFor = o"><BaseIcon name="ellipsis" :size="18" /></button>
      </li>
    </ul>
  </template>

  <ActionsSheet v-if="menuFor" :title="menuFor.title" :actions="actions" @close="menuFor = null" />
  <OfferEditor v-if="editing" :data="editing" :levels="data?.levels || []" @saved="run" @close="editing = null" />
</template>
