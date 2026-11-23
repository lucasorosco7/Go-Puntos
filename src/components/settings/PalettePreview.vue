<!--
  Vista previa de la app del cliente con una paleta (antes de aplicarla),
  en modo claro u oscuro. Usa paletteStyle(): las variables de color se
  aplican sólo dentro de esta tarjeta, el resto del panel no cambia hasta guardar.
-->
<script setup>
import { computed } from 'vue';
import { paletteStyle } from '../../theme/palettes.js';
import BaseIcon from '../base/BaseIcon.vue';
import ProgressBar from '../base/ProgressBar.vue';
import BusinessLogo from '../brand/BusinessLogo.vue';
import LevelBadge from '../loyalty/LevelBadge.vue';
import RewardArt from '../loyalty/RewardArt.vue';

const props = defineProps({
  business: { type: Object, required: true },
  paletteId: { type: String, required: true },
  variantId: { type: String, required: true },
  levels: { type: Array, default: () => [] },
  /** Colores de la paleta personalizada (si paletteId = 'personalizada'). */
  custom: { type: Object, default: null },
  /** 'claro' | 'oscuro' */
  mode: { type: String, default: 'claro' },
});
const level = computed(() => props.levels[1] || props.levels[0] || { name: 'Plata', icon: 'award', color: 'plata' });
const style = computed(() => paletteStyle(props.paletteId, props.variantId, { custom: props.custom, mode: props.mode }));
</script>

<template>
  <div class="preview" :style="style" aria-label="Vista previa de la app del cliente">
    <div class="preview__screen">
      <div class="preview__top">
        <BusinessLogo :business="business" :size="26" /><b>{{ business.name || 'Tu negocio' }}</b>
        <span class="preview__bell"><BaseIcon name="bell" :size="14" /></span>
      </div>
      <section class="points" style="padding: var(--sp-4)">
        <p class="points__label">Saldo disponible</p>
        <p class="points__value tabular" style="font-size: var(--fs-3xl); margin: var(--sp-1) 0 var(--sp-3)">1.240</p>
        <ProgressBar :value="0.7" label="Ejemplo de progreso" mod="bar--honey bar--onDark" />
        <p class="points__goal">Te faltan <b>260</b> para tu próxima recompensa</p>
      </section>
      <span class="btn btn--honey btn--block" style="margin-top: var(--sp-2); min-height: 40px"><BaseIcon name="qr-code" :size="16" /> Mostrar mi código</span>
      <div class="level-card" style="margin-top: var(--sp-2); padding: var(--sp-3)">
        <div class="level-card__head"><LevelBadge :level="level" /><span class="small muted">1.050 pts este mes</span></div>
        <ProgressBar :value="0.55" label="Ejemplo de nivel" mod="bar--level" />
      </div>
      <div class="row" style="margin-top: var(--sp-2); padding: var(--sp-2)">
        <RewardArt category="general" :size="40" :icon-size="18" />
        <div class="row__body"><p class="row__title small">Recompensa</p><p class="small" style="color: var(--forest-2)">500 puntos</p></div>
        <span class="btn btn--sm" style="min-height: 32px">Canjear</span>
      </div>
      <div class="row" style="margin-top: var(--sp-2); padding: var(--sp-2)">
        <RewardArt category="descuentos" :size="40" :icon-size="18" />
        <div class="row__body"><span class="pill pill--honey">20% off</span><p class="row__title small">Oferta de la semana</p></div>
        <span class="btn btn--outline btn--sm" style="min-height: 32px">Ver</span>
      </div>
    </div>
  </div>
</template>
