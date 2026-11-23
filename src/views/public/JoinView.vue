<!--
  Página del QR público de un negocio (/unirse/:slug).
  - Con cuenta: se suma al negocio (o lo abre si ya es parte). Si estaba
    en un panel, pasa al contexto cliente con la misma cuenta.
  - Sin sesión: crear cuenta o ingresar, y vuelve acá.
  Se ve con la identidad del negocio (vista previa, sin guardarla).
-->
<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import BaseAlert from '../../components/base/BaseAlert.vue';
import BaseButton from '../../components/base/BaseButton.vue';
import BaseIcon from '../../components/base/BaseIcon.vue';
import EmptyState from '../../components/base/EmptyState.vue';
import SkeletonBlock from '../../components/base/SkeletonBlock.vue';
import BusinessLogo from '../../components/brand/BusinessLogo.vue';
import RewardArt from '../../components/loyalty/RewardArt.vue';
import { useAsync } from '../../composables/useAsync.js';
import { toast } from '../../composables/useToast.js';
import { BUSINESS_CATEGORIES } from '../../config/catalogs.js';
import { businessService } from '../../services/businessService.js';
import { useAuthStore } from '../../stores/auth.js';
import { useCustomerStore } from '../../stores/customer.js';
import { applyBusinessTheme, previewTheme } from '../../theme/theme.js';
import { format } from '../../utils/format.js';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const customer = useCustomerStore();
const slug = computed(() => route.params.slug);
const joining = ref(false);

const { data, error, run } = useAsync(async () => {
  const r = await businessService.getPublic(slug.value);
  previewTheme(r.business);
  document.title = `Sumate a ${r.business.name} | GO Puntos`;
  return r;
});
onMounted(run);

const b = computed(() => data.value?.business);
const rule = computed(() => b.value?.pointsRule);

/** Si la cuenta estaba en un panel, pasa a verse como cliente. */
async function asClient() {
  if (!auth.isClient) await auth.switchContext({ type: 'cliente' });
}

async function join() {
  joining.value = true;
  try {
    await asClient();
    const res = await customer.join(slug.value);
    applyBusinessTheme(res.business);
    toast(res.created && rule.value.welcomeBonus
      ? `¡Bienvenida/o a ${b.value.name}! Ya tenés ${format.points(rule.value.welcomeBonus)} puntos de regalo.`
      : `Ya sos parte de ${b.value.name}.`);
    router.push({ name: 'client-points' });
  } catch (err) {
    toast(err.message, 'error');
    joining.value = false;
  }
}

async function open() {
  await asClient();
  auth.setActiveBusiness(b.value.id);
  applyBusinessTheme(b.value);
  customer.clear();
  router.push({ name: 'client-points' });
}
</script>

<template>
  <div class="app">
    <main id="contenido" class="app__main" tabindex="-1">
      <!-- Cargando -->
      <div v-if="!data && !error" aria-busy="true"><SkeletonBlock height="320px" radius="28px" style="margin-top: var(--sp-7)" /></div>

      <!-- El QR no corresponde a un negocio -->
      <EmptyState v-else-if="error" icon="qr-code" title="No encontramos este comercio" :text="error.message">
        <template #action><router-link class="btn btn--sm" :to="{ name: 'landing' }">Ir al inicio</router-link></template>
      </EmptyState>

      <div v-else class="join">
        <!-- Identidad del negocio -->
        <div class="join__hero">
          <BusinessLogo :business="b" :size="84" />
          <p class="small muted" style="margin-top: var(--sp-2)">{{ BUSINESS_CATEGORIES[b.category] || '' }}</p>
          <h1>{{ b.name }}</h1>
          <p v-if="b.description" class="muted" style="max-width: 40ch">{{ b.description }}</p>
          <p v-if="b.address" class="small muted"><BaseIcon name="map-pin" :size="13" /> {{ b.address }}{{ b.city ? `, ${b.city}` : '' }}</p>
        </div>

        <!-- Datos clave del programa -->
        <div class="join__facts">
          <div class="join__fact">
            <b class="tabular">{{ rule.welcomeBonus ? `+${format.points(rule.welcomeBonus)}` : '✓' }}</b>
            <span>{{ rule.welcomeBonus ? 'puntos de regalo' : 'registro gratis' }}</span>
          </div>
          <div class="join__fact"><b class="tabular">{{ format.points(rule.points) }}</b><span>{{ rule.points === 1 ? 'punto' : 'puntos' }} cada {{ format.currency(rule.pesos) }}</span></div>
          <div class="join__fact"><b class="tabular">{{ data.levels.length }}</b><span>niveles con beneficios</span></div>
        </div>

        <!-- Acción según la situación de la persona -->
        <div class="stack">
          <BaseAlert
            v-if="b.status !== 'activo'" tone="info" title="Todavía no está activo"
            :text="`${b.name} está terminando de preparar su programa de puntos. Probá de nuevo en unos días.`"
          />
          <button v-else-if="auth.isAuthenticated && data.isMember" type="button" class="btn btn--lg btn--block" @click="open">Ya sos parte · Ver mis puntos</button>
          <template v-else-if="auth.isAuthenticated">
            <BaseButton size="lg" block :loading="joining" loading-text="Sumándote" @click="join">Sumarme a {{ b.name }}</BaseButton>
            <p class="small muted" style="text-align: center">Usás tu misma cuenta de GO Puntos. Tus puntos de cada comercio quedan separados.</p>
          </template>
          <template v-else>
            <router-link :to="{ name: 'register', query: { join: slug } }" class="btn btn--lg btn--block">Crear mi cuenta gratis</router-link>
            <router-link :to="{ name: 'login', query: { next: route.fullPath } }" class="btn btn--outline btn--block">Ya tengo cuenta de GO Puntos</router-link>
          </template>
        </div>

        <!-- Algunas recompensas del catálogo -->
        <section v-if="data.rewards.length">
          <p class="group-title">Algunas recompensas</p>
          <div class="rail">
            <div v-for="r in data.rewards" :key="r.id" class="mini">
              <RewardArt :category="r.category" size="auto" :icon-size="30" :image="r.image" />
              <p class="mini__name">{{ r.name }}</p>
              <p class="mini__points tabular">{{ format.points(r.points) }} pts</p>
            </div>
          </div>
        </section>

        <p class="small muted" style="text-align: center"><BaseIcon name="leaf" :size="13" /> Programa de puntos con <b>GO Puntos</b></p>
      </div>
    </main>
  </div>
</template>
