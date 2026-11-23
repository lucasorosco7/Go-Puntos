<!--
  Mi código: el QR personal que el cliente muestra en caja.
  Cada negocio tiene su propio código de cliente (ej.: CV-000124), así la
  caja sabe en qué negocio acreditar los puntos.
-->
<script setup>
import { computed, onMounted } from 'vue';
import BaseAlert from '../../components/base/BaseAlert.vue';
import BaseIcon from '../../components/base/BaseIcon.vue';
import BusinessLogo from '../../components/brand/BusinessLogo.vue';
import LevelBadge from '../../components/loyalty/LevelBadge.vue';
import NoBusinessState from '../../components/loyalty/NoBusinessState.vue';
import QrCode from '../../components/loyalty/QrCode.vue';
import { useAsync } from '../../composables/useAsync.js';
import { APP_LINKS } from '../../config/navigation.js';
import { customerService } from '../../services/customerService.js';
import { qrService } from '../../services/qrService.js';
import { format } from '../../utils/format.js';

const { data, error, run } = useAsync(() => customerService.getDashboard());
onMounted(run);
const noBusiness = computed(() => error.value?.details?.code === 'NO_MEMBERSHIP');
</script>

<template>
  <main id="contenido" class="qr-screen">
    <div class="qr-screen__head">
      <router-link :to="APP_LINKS.home" class="icon-btn" aria-label="Cerrar"><BaseIcon name="x" :size="19" /></router-link>
      <span style="font-weight: var(--fw-medium)">Mi código</span>
      <span style="width: 44px"></span>
    </div>

    <div>
      <div v-if="noBusiness" class="qr-card"><NoBusinessState text="Escaneá el QR del local para tener tu código." /></div>
      <div v-else-if="error" class="qr-card"><BaseAlert tone="error" title="No pudimos mostrar tu código" :text="error.message" /></div>
      <template v-else-if="data">
        <!-- Tarjeta con el QR personal en este negocio -->
        <div class="qr-card">
          <div style="display: flex; align-items: center; justify-content: center; gap: var(--sp-2); margin-bottom: var(--sp-3)">
            <BusinessLogo :business="data.business" :size="28" /><span class="small" style="font-weight: var(--fw-medium)">{{ data.business.name }}</span>
          </div>
          <p style="font-weight: var(--fw-medium); font-size: var(--fs-lg)">{{ data.user.firstName }} {{ data.user.lastName }}</p>
          <p class="small muted" style="margin-bottom: var(--sp-5)">Mostralo en caja antes de pagar</p>
          <QrCode :value="qrService.customerPayload(data.membership.code)" :size="240" />
          <p class="qr-card__code tabular">{{ data.membership.code }}</p>
          <div style="margin-top: var(--sp-3)"><LevelBadge :level="data.levelInfo.level" /></div>
        </div>
        <!-- Saldo disponible -->
        <div class="qr-screen__balance">
          <span style="color: var(--on-dark)">Saldo disponible</span>
          <span class="tabular" style="font-size: var(--fs-xl); font-weight: var(--fw-medium)">{{ format.points(data.membership.balance) }}</span>
        </div>
      </template>
    </div>
    <p class="qr-screen__tip"><BaseIcon name="sun" :size="15" /> Subí el brillo para que se lea mejor</p>
  </main>
</template>
