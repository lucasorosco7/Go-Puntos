<!--
  Pestaña "Ofertas": promociones vigentes del negocio activo.
  Las exclusivas de otros niveles se muestran bloqueadas para motivar a
  subir de nivel. Tocar una abre el detalle con sus condiciones.
-->
<script setup>
import { computed, onMounted, ref } from 'vue';
import BaseAlert from '../../components/base/BaseAlert.vue';
import BaseIcon from '../../components/base/BaseIcon.vue';
import BaseSheet from '../../components/base/BaseSheet.vue';
import EmptyState from '../../components/base/EmptyState.vue';
import ScreenHead from '../../components/base/ScreenHead.vue';
import SkeletonBlock from '../../components/base/SkeletonBlock.vue';
import BellButton from '../../components/loyalty/BellButton.vue';
import NoBusinessState from '../../components/loyalty/NoBusinessState.vue';
import OfferRow from '../../components/loyalty/OfferRow.vue';
import { useAsync } from '../../composables/useAsync.js';
import { APP_LINKS } from '../../config/navigation.js';
import { offers as Offers } from '../../domain/offers.js';
import { offerService } from '../../services/offerService.js';
import { useCustomerStore } from '../../stores/customer.js';

const customer = useCustomerStore();
const { data, error, run } = useAsync(() => offerService.getForCustomer());
onMounted(run);

const noBusiness = computed(() => error.value?.details?.code === 'NO_MEMBERSHIP');
/** Destacada: sólo entre las que puede usar. */
const featured = computed(() => (data.value?.offers || []).filter((o) => o.eligible).find((o) => o.featured) || null);
/** El resto: primero las que puede usar. */
const rest = computed(() => (data.value?.offers || []).filter((o) => o !== featured.value).sort((a, b) => Number(b.eligible) - Number(a.eligible)));
const open = ref(null);
</script>

<template>
  <ScreenHead title="Ofertas">
    <template #sub>Esta semana en <span>{{ customer.business?.name || 'tu comercio' }}</span></template>
    <template #end><BellButton /></template>
  </ScreenHead>

  <!-- Oferta destacada -->
  <button
    v-if="featured" type="button" class="offer-hero" style="width: 100%; text-align: left"
    :aria-label="`Oferta destacada: ${featured.title}`" @click="open = featured"
  >
    <span class="pill" style="background: var(--honey); color: var(--deep)"><BaseIcon name="sparkles" :size="13" /> {{ Offers.tag(featured) }}</span>
    <span class="offer-hero__title" style="display: block">{{ featured.title }}</span>
    <span class="offer-hero__date">{{ Offers.when(featured) }}</span>
    <span class="offer-hero__deco" aria-hidden="true"><BaseIcon name="shopping-basket" :size="52" /></span>
  </button>

  <ul class="stack" style="margin-top: var(--sp-4)" :aria-busy="!data && !error ? 'true' : 'false'">
    <template v-if="!data && !error">
      <li v-for="n in 3" :key="n"><SkeletonBlock height="96px" radius="var(--radius-lg)" /></li>
    </template>
    <li v-else-if="noBusiness"><NoBusinessState text="Escaneá el QR del local para ver sus ofertas." /></li>
    <li v-else-if="error"><BaseAlert tone="error" title="No pudimos cargar las ofertas" :text="error.message" /></li>
    <template v-else-if="rest.length">
      <OfferRow v-for="o in rest" :key="o.id" :offer="o" @open="open = $event" />
    </template>
    <li v-else-if="!featured">
      <EmptyState icon="tag" title="Todavía no hay ofertas" :text="`${data.business.name} no tiene promociones activas. Te avisamos con una notificación cuando publique una.`">
        <template #action><router-link class="btn btn--outline btn--sm" :to="APP_LINKS.notifications"><BaseIcon name="bell" :size="16" /> Ver notificaciones</router-link></template>
      </EmptyState>
    </li>
  </ul>

  <!-- Detalle de la oferta -->
  <BaseSheet v-if="open" :title="open.title" :description="open.description" @close="open = null">
    <div class="offer-detail">
      <img v-if="open.image" :src="open.image" alt="" style="width: 100%; border-radius: var(--radius-lg); max-height: 200px; object-fit: cover" />
      <dl>
        <div><dt>Beneficio</dt><dd>{{ Offers.tag(open) }}</dd></div>
        <div><dt>Tipo</dt><dd>{{ Offers.TYPES[open.type]?.label || '' }}</dd></div>
        <div><dt>Vigencia</dt><dd>{{ Offers.when(open) }}</dd></div>
        <div v-if="open.levelNames?.length"><dt>Para</dt><dd>Nivel {{ open.levelNames.join(' / ') }}</dd></div>
        <div v-if="open.conditions"><dt>Condiciones</dt><dd>{{ open.conditions }}</dd></div>
      </dl>
      <BaseAlert v-if="open.eligible === false" tone="info" title="Todavía no es para tu nivel" :text="`Llegá a ${open.levelNames.join(' o ')} sumando puntos este mes y la desbloqueás.`" />
      <BaseAlert v-else-if="Offers.affectsPoints(open)" tone="success" title="Se aplica al sumar" text="Mostrá tu código en caja y los puntos extra se suman solos." />
    </div>
    <template #actions>
      <router-link v-if="open.eligible === false" :to="APP_LINKS.profile" class="btn btn--block">Ver cómo subir de nivel</router-link>
      <router-link v-else :to="APP_LINKS.qr" class="btn btn--honey btn--block"><BaseIcon name="qr-code" :size="18" /> Mostrar mi código</router-link>
    </template>
  </BaseSheet>
</template>
