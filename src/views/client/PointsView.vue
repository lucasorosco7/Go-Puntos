<!--
  Pestaña "Mis puntos" (inicio del cliente en el negocio activo):
  saldo disponible, botón para mostrar el código, nivel y puntos del mes,
  lo que ya puede canjear, la oferta de la semana y los últimos movimientos.
  Rachas y desafíos NO ocupan lugar fijo: aparecen como una línea
  contextual sólo cuando son relevantes (domain/nudges.js) y como ventana
  de celebración cuando hay algo que festejar.
-->
<script setup>
import { computed, onMounted, ref } from 'vue';
import BaseAlert from '../../components/base/BaseAlert.vue';
import BaseIcon from '../../components/base/BaseIcon.vue';
import EmptyState from '../../components/base/EmptyState.vue';
import SkeletonBlock from '../../components/base/SkeletonBlock.vue';
import UserAvatar from '../../components/base/UserAvatar.vue';
import BellButton from '../../components/loyalty/BellButton.vue';
import BusinessSwitcher from '../../components/loyalty/BusinessSwitcher.vue';
import CelebrateSheet from '../../components/loyalty/CelebrateSheet.vue';
import LevelCard from '../../components/loyalty/LevelCard.vue';
import MovementList from '../../components/loyalty/MovementList.vue';
import NoBusinessState from '../../components/loyalty/NoBusinessState.vue';
import PointsCard from '../../components/loyalty/PointsCard.vue';
import RewardArt from '../../components/loyalty/RewardArt.vue';
import { useAsync } from '../../composables/useAsync.js';
import { APP_LINKS } from '../../config/navigation.js';
import { pickNudge } from '../../domain/nudges.js';
import { offers as Offers } from '../../domain/offers.js';
import { rewards as Rewards } from '../../domain/rewards.js';
import { customerService } from '../../services/customerService.js';
import { notificationService } from '../../services/notificationService.js';
import { useAuthStore } from '../../stores/auth.js';
import { useNotificationStore } from '../../stores/notification.js';
import { format } from '../../utils/format.js';

const auth = useAuthStore();
const bell = useNotificationStore();
const popup = ref(null);

const { data, error, loading, run } = useAsync(async () => {
  const d = await customerService.getDashboard();
  bell.set(d.unread);
  // Ventana de celebración: nivel nuevo, premio o desafío completado (una sola vez)
  if (d.popup) {
    popup.value = d.popup;
    notificationService.markPopupShown(d.popup.id);
    notificationService.markRead(d.popup.id).then(() => bell.refresh());
  }
  return d;
});
onMounted(run);

const noBusiness = computed(() => error.value?.details?.code === 'NO_MEMBERSHIP');
const user = computed(() => data.value?.user || auth.user);
const m = computed(() => data.value?.membership);

/** Próxima recompensa a la que apunta la tarjeta de puntos. */
const nextReward = computed(() => Rewards.nextReward(m.value.balance, data.value.rewards));
/** Recompensas que ya le alcanzan (o las más cercanas si no le alcanza ninguna). */
const available = computed(() => data.value.rewards.filter((r) => Rewards.isAvailable(r)));
const reachable = computed(() => available.value.filter((r) => r.points <= m.value.balance).sort((a, b) => b.points - a.points));
const rail = computed(() => (reachable.value.length ? reachable.value.slice(0, 5) : [...available.value].sort((a, b) => a.points - b.points).slice(0, 5)));
/** Oferta destacada (sólo vigentes y para su nivel). */
const featured = computed(() => data.value.offers.find((o) => o.featured) || data.value.offers[0] || null);
/** Una sola línea de aviso contextual (racha en riesgo, desafío a un paso, cerca de subir). */
const nudge = computed(() => pickNudge({ business: data.value.business, streak: data.value.streak, challenges: data.value.challenges, levelInfo: data.value.levelInfo }));
const ranking = computed(() => data.value.ranking);
</script>

<template>
  <!-- Negocio activo (se puede cambiar), campana y avatar -->
  <div class="topbar">
    <div class="topbar__biz"><BusinessSwitcher /></div>
    <div class="topbar__end">
      <BellButton />
      <router-link :to="APP_LINKS.profile" aria-label="Ir a mi perfil"><UserAvatar :user="user" :size="44" /></router-link>
    </div>
  </div>

  <header class="screen-head" style="margin-bottom: var(--sp-4)">
    <div>
      <p class="muted">Hola,</p>
      <h1 class="screen-head__title">{{ user.firstName }}</h1>
    </div>
  </header>

  <!-- Cargando -->
  <div v-if="loading && !data">
    <SkeletonBlock height="190px" radius="28px" />
    <SkeletonBlock height="58px" radius="22px" style="margin-top: var(--sp-3)" />
    <SkeletonBlock height="120px" radius="22px" style="margin-top: var(--sp-3)" />
  </div>

  <!-- Todavía no participa de ningún negocio -->
  <NoBusinessState
    v-else-if="noBusiness" show-list title="Todavía no sumás puntos en ningún comercio"
    text="En el local, escaneá el QR del negocio para sumarte. Tu cuenta sirve para todos los comercios de GO Puntos."
  />

  <div v-else-if="error">
    <BaseAlert tone="error" title="No pudimos cargar tus puntos" :text="error.message" />
    <button type="button" class="btn btn--outline btn--block" style="margin-top: var(--sp-3)" @click="run">Reintentar</button>
  </div>

  <template v-else-if="data">
    <!-- Saldo disponible para canjear -->
    <PointsCard :balance="m.balance" :next-reward="nextReward" />

    <router-link :to="APP_LINKS.qr" class="btn btn--honey btn--hero" style="margin-top: var(--sp-3)">
      <BaseIcon name="qr-code" :size="22" /> Mostrar mi código para sumar
    </router-link>

    <!-- Aviso contextual (sólo si es relevante) -->
    <router-link v-if="nudge" class="nudge" :class="`nudge--${nudge.tone}`" :to="nudge.to">
      <BaseIcon :name="nudge.icon" :size="18" /><span>{{ nudge.text }}</span><BaseIcon name="chevron-right" :size="16" />
    </router-link>

    <!-- Nivel vigente y puntos del mes (con acceso al ranking) -->
    <div class="home-block">
      <LevelCard :info="data.levelInfo" :period="ranking.period || data.business.currentPeriod">
        <router-link v-if="ranking.enabled" class="level-card__rank" :to="APP_LINKS.ranking">
          <BaseIcon name="trophy" :size="17" />
          <span v-if="ranking.me">Estás <b>#{{ ranking.me.position }}</b> en el ranking de {{ format.period(ranking.period) }}</span>
          <span v-else>Sumá puntos este mes para entrar al ranking</span>
          <BaseIcon name="chevron-right" :size="16" />
        </router-link>
      </LevelCard>
    </div>

    <!-- Recompensas que ya puede canjear -->
    <section aria-labelledby="canjeables-title">
      <div class="section-head">
        <h2 id="canjeables-title">{{ reachable.length ? 'Ya podés canjear' : 'Tus próximas recompensas' }}</h2>
        <router-link :to="APP_LINKS.rewards" class="link">Ver todas <BaseIcon name="chevron-right" :size="15" /></router-link>
      </div>
      <div v-if="rail.length" class="rail">
        <router-link v-for="r in rail" :key="r.id" class="mini" :to="APP_LINKS.rewards">
          <RewardArt :category="r.category" size="auto" :icon-size="30" :image="r.image" />
          <p class="mini__name">{{ r.name }}</p>
          <p class="mini__points tabular">{{ format.points(r.points) }} pts</p>
        </router-link>
      </div>
      <div v-else class="card">
        <EmptyState icon="gift" title="Todavía no hay recompensas" :text="`${data.business.name} está preparando su catálogo. Mientras tanto, seguí sumando.`" />
      </div>
    </section>

    <!-- Oferta de la semana -->
    <section aria-labelledby="oferta-title">
      <div class="section-head">
        <h2 id="oferta-title">Oferta de la semana</h2>
        <router-link :to="APP_LINKS.offers" class="link">Ver ofertas <BaseIcon name="chevron-right" :size="15" /></router-link>
      </div>
      <router-link v-if="featured" :to="APP_LINKS.offers" class="row">
        <RewardArt :category="featured.category" :size="52" :icon-size="24" :image="featured.image" />
        <div class="row__body">
          <span class="pill" :class="`pill--${Offers.tone(featured)}`">{{ Offers.tag(featured) }}</span>
          <p class="row__title" style="margin-top: 4px">{{ featured.title }}</p>
          <p class="small muted">{{ Offers.when(featured) }}</p>
        </div>
        <BaseIcon name="chevron-right" :size="18" />
      </router-link>
      <div v-else class="card"><EmptyState icon="tag" title="Sin ofertas activas" text="Te avisamos con una notificación cuando haya nuevas promociones." /></div>
    </section>

    <!-- Últimos movimientos -->
    <section aria-labelledby="mov-title">
      <div class="section-head">
        <h2 id="mov-title">Últimos movimientos</h2>
        <router-link v-if="data.movements.length" :to="APP_LINKS.history" class="link">Ver todos <BaseIcon name="chevron-right" :size="15" /></router-link>
      </div>
      <div class="card">
        <MovementList v-if="data.movements.length" :movements="data.movements" />
        <EmptyState v-else icon="receipt" title="Todavía no realizaste compras" text="Mostrá tu código en tu próxima compra para empezar a sumar.">
          <template #action><router-link class="btn btn--sm" :to="APP_LINKS.qr"><BaseIcon name="qr-code" :size="16" /> Ver mi código</router-link></template>
        </EmptyState>
      </div>
    </section>
  </template>

  <CelebrateSheet v-if="popup" :notification="popup" @close="popup = null" />
</template>
