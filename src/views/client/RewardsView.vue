<!--
  Pestaña "Recompensas" del cliente.
  - Arranca en "Me alcanzan": lo primero que el cliente quiere ver.
  - Canje en un solo paso: hoja de confirmación con el saldo que le queda.
    El canje descuenta del SALDO, nunca de los puntos del mes.
  - "Mis canjes" (?vista=canjes) muestra los códigos para retirar en el local.
-->
<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import BaseAlert from '../../components/base/BaseAlert.vue';
import BaseButton from '../../components/base/BaseButton.vue';
import BaseIcon from '../../components/base/BaseIcon.vue';
import BaseSheet from '../../components/base/BaseSheet.vue';
import EmptyState from '../../components/base/EmptyState.vue';
import ScreenHead from '../../components/base/ScreenHead.vue';
import SkeletonBlock from '../../components/base/SkeletonBlock.vue';
import StatusPill from '../../components/base/StatusPill.vue';
import BellButton from '../../components/loyalty/BellButton.vue';
import NoBusinessState from '../../components/loyalty/NoBusinessState.vue';
import QrCode from '../../components/loyalty/QrCode.vue';
import RewardRow from '../../components/loyalty/RewardRow.vue';
import { useAsync } from '../../composables/useAsync.js';
import { rewards as Rewards } from '../../domain/rewards.js';
import { customerService } from '../../services/customerService.js';
import { rewardService } from '../../services/rewardService.js';
import { useCustomerStore } from '../../stores/customer.js';
import { format } from '../../utils/format.js';

const route = useRoute();
const router = useRouter();
const customer = useCustomerStore();

/** Filtro: 'alcanzan' | 'todas' | 'canjes' (este último también por la URL). */
const filter = ref(route.query.vista === 'canjes' ? 'canjes' : 'alcanzan');

const { data, error, run } = useAsync(async () => {
  const [dashboard, redemptions] = await Promise.all([customerService.getDashboard(), rewardService.getMyRedemptions()]);
  return { rewards: dashboard.rewards, balance: dashboard.membership.balance, business: dashboard.business, redemptions };
});
onMounted(run);

const noBusiness = computed(() => error.value?.details?.code === 'NO_MEMBERSHIP');
const balance = computed(() => data.value?.balance ?? 0);
const reachable = computed(() => (data.value?.rewards || []).filter((r) => Rewards.isAvailable(r) && r.points <= balance.value));
/** Primero las que tienen stock, después por costo. */
const visible = computed(() => (filter.value === 'alcanzan' ? reachable.value : data.value?.rewards || []).slice()
  .sort((a, b) => Rewards.hasStock(b) - Rewards.hasStock(a) || a.points - b.points));
const pendingCount = computed(() => (data.value?.redemptions || []).filter((r) => r.status === 'pendiente').length);

// Si la URL cambia (por ejemplo, desde un enlace de una notificación), se actualiza la pestaña
watch(() => route.query.vista, () => { filter.value = route.query.vista === 'canjes' ? 'canjes' : 'alcanzan'; });

function setFilter(value) {
  filter.value = value;
  router.replace({ query: value === 'canjes' ? { vista: 'canjes' } : {} });
}

/* ---------- Canje ---------- */
const toRedeem = ref(null);
const redeeming = ref(false);
const redeemError = ref('');

function askRedeem(reward) {
  toRedeem.value = reward;
  redeemError.value = '';
}

async function confirmRedeem() {
  redeeming.value = true;
  try {
    const r = await rewardService.redeem(toRedeem.value.id);
    customer.load().catch(() => {});
    // El resultado se muestra en su propia pantalla (más clara en el celular)
    router.push({
      name: 'client-redeemed',
      state: { canje: { name: toRedeem.value.name, code: r.redemption.code, balance: r.membership.balance, expiresAt: r.redemption.expiresAt, business: r.businessName } },
    });
  } catch (err) {
    redeemError.value = err.message;
    redeeming.value = false;
  }
}

/* ---------- Detalle de un canje ya hecho ---------- */
const shown = ref(null);
function detail(r) {
  if (r.status === 'pendiente') return `Retiralo antes del ${format.shortDate(r.expiresAt)}`;
  if (r.status === 'entregado') return `Entregado el ${format.shortDate(r.validatedAt)}`;
  return `Canjeado el ${format.shortDate(r.createdAt)}`;
}
</script>

<template>
  <ScreenHead title="Recompensas" :sub="customer.business?.name || ''">
    <template #end>
      <span class="pill pill--green"><BaseIcon name="leaf" :size="13" /> <span class="tabular">{{ data ? `${format.points(balance)} pts` : '—' }}</span></span>
      <BellButton />
    </template>
  </ScreenHead>

  <!-- Filtro -->
  <div class="seg" role="group" aria-label="Filtrar recompensas">
    <button type="button" :class="{ 'is-on': filter === 'alcanzan' }" :aria-pressed="filter === 'alcanzan'" @click="setFilter('alcanzan')">
      {{ data ? `Me alcanzan · ${reachable.length}` : 'Me alcanzan' }}
    </button>
    <button type="button" :class="{ 'is-on': filter === 'todas' }" :aria-pressed="filter === 'todas'" @click="setFilter('todas')">
      {{ data ? `Todas · ${data.rewards.length}` : 'Todas' }}
    </button>
    <button type="button" :class="{ 'is-on': filter === 'canjes' }" :aria-pressed="filter === 'canjes'" @click="setFilter('canjes')">
      {{ pendingCount ? `Mis canjes · ${pendingCount}` : 'Mis canjes' }}
    </button>
  </div>

  <ul class="stack" style="margin-top: var(--sp-4)" :aria-busy="!data && !error ? 'true' : 'false'">
    <!-- Esqueleto mientras cargan los datos -->
    <template v-if="!data && !error">
      <li v-for="n in 4" :key="n"><SkeletonBlock height="86px" radius="var(--radius-lg)" /></li>
    </template>

    <li v-else-if="noBusiness">
      <NoBusinessState>
        <template #action><router-link class="btn btn--sm" :to="{ name: 'client-points' }">Ir a Mis puntos</router-link></template>
      </NoBusinessState>
    </li>
    <li v-else-if="error"><BaseAlert tone="error" title="No pudimos cargar el catálogo" :text="error.message" /></li>

    <!-- Mis canjes -->
    <template v-else-if="filter === 'canjes'">
      <li v-if="!data.redemptions.length">
        <EmptyState icon="ticket" title="Todavía no canjeaste recompensas" text="Cuando canjees, acá vas a ver el código para retirarla en el local.">
          <template #action><button type="button" class="btn btn--outline btn--sm" @click="setFilter('alcanzan')">Ver lo que me alcanza</button></template>
        </EmptyState>
      </li>
      <li v-for="r in data.redemptions" :key="r.id">
        <button type="button" class="row" @click="shown = r">
          <span class="art" :class="r.source === 'premio' ? 'art--experiencias' : 'art--general'" style="width: 52px; height: 52px" aria-hidden="true">
            <BaseIcon :name="r.source === 'premio' ? 'trophy' : 'ticket'" :size="22" />
          </span>
          <span class="row__body">
            <span class="row__title">{{ r.rewardName }}</span>
            <span class="small muted" style="display: block">{{ r.source === 'premio' ? 'Premio del ranking' : `${format.points(r.points)} puntos` }} · {{ detail(r) }}</span>
            <span class="small tabular" style="letter-spacing: 0.06em">{{ r.code }}</span>
          </span>
          <StatusPill :meta="Rewards.REDEMPTION_STATUS[r.status]" />
        </button>
      </li>
    </template>

    <!-- Catálogo -->
    <li v-else-if="!data.rewards.length">
      <EmptyState icon="gift" title="Todavía no hay recompensas" :text="`${data.business.name} todavía no cargó su catálogo. Te avisamos cuando publique la primera.`" />
    </li>
    <li v-else-if="!visible.length">
      <EmptyState icon="gift" title="Todavía no te alcanza para ninguna" text="Seguí sumando puntos con tus compras. Mirá todas para ver qué se viene.">
        <template #action><button type="button" class="btn btn--outline btn--sm" @click="setFilter('todas')">Ver todas</button></template>
      </EmptyState>
    </li>
    <template v-else>
      <RewardRow v-for="r in visible" :key="r.id" :reward="r" :balance="balance" @redeem="askRedeem" />
    </template>
  </ul>

  <!-- Confirmación del canje -->
  <BaseSheet v-if="toRedeem" title="¿Canjeás esta recompensa?" :description="toRedeem.name" @close="toRedeem = null; redeeming = false">
    <p v-if="toRedeem.description" class="small muted" style="text-align: center">{{ toRedeem.description }}</p>
    <div style="display: flex; justify-content: center; gap: var(--sp-7); text-align: center; margin: var(--sp-5) 0">
      <div><p class="small muted">Usás</p><p class="tabular neg" style="font-size: var(--fs-xl)">&minus;{{ format.points(toRedeem.points) }}</p></div>
      <div style="width: 1px; background: var(--line)"></div>
      <div><p class="small muted">Te quedan</p><p class="tabular" style="font-size: var(--fs-xl); font-weight: var(--fw-medium)">{{ format.points(balance - toRedeem.points) }}</p></div>
    </div>
    <p class="small muted" style="text-align: center"><BaseIcon name="info" :size="13" /> Canjear no baja tu nivel ni tu puesto en el ranking.</p>
    <BaseAlert v-if="redeemError" tone="error" :text="redeemError" />
    <template #actions="{ close }">
      <BaseButton size="lg" block :loading="redeeming" loading-text="Canjeando" @click="confirmRedeem">Sí, canjear {{ format.points(toRedeem.points) }} puntos</BaseButton>
      <button type="button" class="btn btn--ghost btn--block" @click="close()">Cancelar</button>
    </template>
  </BaseSheet>

  <!-- Código de un canje ya hecho, para mostrar en caja -->
  <BaseSheet
    v-if="shown" :title="shown.rewardName"
    :description="shown.status === 'pendiente' ? 'Mostrá este código en el local para retirarlo.' : Rewards.REDEMPTION_STATUS[shown.status].label"
    @close="shown = null"
  >
    <div style="display: grid; gap: var(--sp-4); justify-items: center">
      <QrCode v-if="shown.status === 'pendiente'" :value="shown.code" :size="170" />
      <div class="code-box">
        <p class="small muted">Código de canje</p>
        <b class="tabular">{{ shown.code }}</b>
        <StatusPill :meta="Rewards.REDEMPTION_STATUS[shown.status]" :icon="Rewards.REDEMPTION_STATUS[shown.status].icon" />
      </div>
      <p class="small muted">
        <template v-if="shown.status === 'pendiente'">Válido hasta el {{ format.longDate(shown.expiresAt) }}</template>
        <template v-else-if="shown.status === 'entregado'">Entregado el {{ format.dateTime(shown.validatedAt) }}{{ shown.validatedByName ? ` por ${shown.validatedByName}` : '' }}</template>
      </p>
    </div>
    <template #actions="{ close }"><button type="button" class="btn btn--block" @click="close()">Listo</button></template>
  </BaseSheet>
</template>
