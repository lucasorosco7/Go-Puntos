<!--
  Configuración · QR público del negocio: cartel para imprimir y enlace
  para compartir. Al escanearlo, quien ya usa GO Puntos se suma con su
  misma cuenta; quien no, la crea en un minuto.
-->
<script setup>
import { computed } from 'vue';
import { toast } from '../../composables/useToast.js';
import { qrService } from '../../services/qrService.js';
import { format } from '../../utils/format.js';
import BaseAlert from '../base/BaseAlert.vue';
import BaseIcon from '../base/BaseIcon.vue';
import BusinessLogo from '../brand/BusinessLogo.vue';
import QrCode from '../loyalty/QrCode.vue';

const props = defineProps({ ctx: { type: Object, required: true } });
// Eventos comunes de las secciones (no todas los usan): pedir recarga del contexto o ir a otro paso
defineEmits(['reload', 'goto']);
const b = computed(() => props.ctx.business);
const url = computed(() => qrService.businessJoinUrl(b.value.slug));

async function copy() {
  try { await navigator.clipboard.writeText(url.value); toast('Enlace copiado.'); } catch { toast('No pudimos copiar el enlace.', 'error'); }
}
const print = () => window.print();
</script>

<template>
  <div class="settings-split">
    <!-- Cartel imprimible -->
    <div class="qr-poster">
      <BusinessLogo :business="b" :size="56" />
      <p style="font-size: var(--fs-xl); font-weight: var(--fw-medium)">{{ b.name }}</p>
      <p class="muted">Escaneá y sumá puntos en cada compra</p>
      <QrCode :value="url" :size="220" />
      <p class="qr-poster__url">{{ url }}</p>
      <p class="small muted"><BaseIcon name="leaf" :size="12" /> GO Puntos</p>
    </div>
    <div class="stack no-print">
      <p class="muted">Poné este QR en el mostrador. Al escanearlo:</p>
      <ul class="small" style="display: grid; gap: 6px; list-style: disc; padding-left: 18px">
        <li>Si la persona ya usa GO Puntos, se suma a tu negocio con la misma cuenta.</li>
        <li>Si no tiene cuenta, la crea en un minuto{{ b.pointsRule.welcomeBonus ? ` y recibe ${format.points(b.pointsRule.welcomeBonus)} puntos de bienvenida` : '' }}.</li>
      </ul>
      <BaseAlert v-if="b.status !== 'activo'" tone="info" title="Tu programa todavía no está activo" text="Los clientes van a poder sumarse con este QR cuando GO Puntos apruebe tu solicitud." />
      <div class="btn-row">
        <button type="button" class="btn" @click="print"><BaseIcon name="printer" :size="17" /> Imprimir cartel</button>
        <a class="btn btn--outline" :href="url" target="_blank" rel="noopener"><BaseIcon name="external-link" :size="16" /> Abrir la página</a>
        <button type="button" class="btn btn--ghost" @click="copy"><BaseIcon name="copy" :size="16" /> Copiar enlace</button>
      </div>
      <p class="small muted"><BaseIcon name="info" :size="13" /> En esta maqueta el QR es ilustrativo. Con el backend se genera uno real con este enlace.</p>
    </div>
  </div>
</template>
