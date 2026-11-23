<!--
  Canje confirmado: el código para retirar la recompensa en el local.
  Los datos llegan desde Recompensas en el estado de la navegación
  (history.state), así no se guardan en el navegador.
-->
<script setup>
import BaseIcon from '../../components/base/BaseIcon.vue';
import EmptyState from '../../components/base/EmptyState.vue';
import QrCode from '../../components/loyalty/QrCode.vue';
import { toast } from '../../composables/useToast.js';
import { APP_LINKS } from '../../config/navigation.js';
import { useAuthStore } from '../../stores/auth.js';
import { format } from '../../utils/format.js';

const auth = useAuthStore();
/** { name, code, balance, expiresAt, business } o null si se entró directo. */
const info = window.history.state?.canje || null;

async function copy() {
  try {
    await navigator.clipboard.writeText(info.code);
    toast('Código copiado.');
  } catch {
    toast('No pudimos copiar. Anotá el código.', 'error');
  }
}
</script>

<template>
  <div class="app">
    <main id="contenido" class="app__main" tabindex="-1">
      <!-- Sin canje reciente (se entró directo a la dirección) -->
      <template v-if="!info">
        <EmptyState icon="gift" title="No hay ningún canje reciente" text="Elegí una recompensa del catálogo para canjear tus puntos." />
        <router-link :to="APP_LINKS.rewards" class="btn btn--block" style="margin-top: var(--sp-4)">Ver recompensas</router-link>
        <router-link :to="APP_LINKS.redemptions" class="btn btn--ghost btn--block">Ver mis canjes</router-link>
      </template>

      <div v-else class="done">
        <span class="done__icon" aria-hidden="true"><BaseIcon name="check" :size="40" /></span>
        <h1>¡Listo, {{ auth.user.firstName }}!</h1>
        <p class="muted" style="max-width: 34ch">
          Canjeaste <b style="color: var(--text); font-weight: var(--fw-medium)">{{ info.name }}</b>.
          Retiralo en {{ info.business || 'el local' }} mostrando este código.
        </p>

        <!-- Código del canje -->
        <div class="done__code">
          <QrCode :value="info.code" :size="150" />
          <p class="small muted" style="margin-top: var(--sp-3)">Código de canje</p>
          <b class="tabular">{{ info.code }}</b>
          <button type="button" class="link" @click="copy"><BaseIcon name="copy" :size="14" /> Copiar código</button>
        </div>
        <p class="small muted" style="margin-top: var(--sp-3); display: flex; align-items: center; gap: 6px">
          <BaseIcon name="clock" :size="14" /> Válido hasta el {{ info.expiresAt ? format.longDate(info.expiresAt) : 'plazo indicado por el local' }}
        </p>

        <!-- Nuevo saldo: el nivel y el ranking no cambian -->
        <section class="points points--compact" style="width: 100%; margin-top: var(--sp-6)" aria-label="Tu nuevo saldo">
          <span class="points__label">Tu nuevo saldo</span>
          <span class="points__value tabular">{{ format.points(info.balance) }} pts</span>
        </section>
        <p class="small muted" style="margin-top: var(--sp-2)">Tu nivel y tu puesto en el ranking no cambian por canjear.</p>

        <router-link :to="APP_LINKS.home" class="btn btn--block" style="margin-top: var(--sp-5)">Volver a mis puntos</router-link>
        <router-link :to="APP_LINKS.redemptions" class="btn btn--ghost btn--block">Ver mis canjes</router-link>
      </div>
    </main>
  </div>
</template>
