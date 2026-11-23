<!--
  Lista de movimientos de puntos (compras, canjes, bonificaciones,
  premios, desafíos, ajustes y vencimientos).
  Opciones: mostrar el negocio (historial de todos los negocios), el
  cliente (actividad del panel) o el saldo después de cada movimiento.
-->
<script setup>
import { MOVEMENT_TYPES } from '../../config/catalogs.js';
import { format } from '../../utils/format.js';
import BaseIcon from '../base/BaseIcon.vue';

defineProps({
  movements: { type: Array, required: true },
  showBusiness: Boolean,
  showBalance: Boolean,
  showCustomer: Boolean,
});

const typeOf = (m) => MOVEMENT_TYPES[m.type] || MOVEMENT_TYPES.compra;
/** Línea secundaria: fecha · importe o tipo · negocio · cliente */
function meta(m, o) {
  return [
    m.amount ? format.currency(m.amount) : typeOf(m).label,
    o.showBusiness && m.businessName ? m.businessName : '',
    o.showCustomer && m.customer ? m.customer : '',
  ].filter(Boolean).join(' · ');
}
</script>

<template>
  <ul>
    <li v-for="m in movements" :key="m.id" class="mov">
      <span class="mov__icon" :class="`mov__icon--${m.type}`"><BaseIcon :name="typeOf(m).icon" :size="18" /></span>
      <div class="mov__body">
        <p class="mov__concept">{{ m.concept }}</p>
        <p class="small subtle"><time :datetime="m.date">{{ format.shortDate(m.date) }}</time> · {{ meta(m, { showBusiness, showCustomer }) }}</p>
      </div>
      <div class="mov__end">
        <p class="mov__points tabular" :class="m.points > 0 ? 'pos' : m.points < 0 ? 'neg' : ''">
          {{ m.points === 0 ? '—' : format.signedPoints(m.points) }}<span class="sr-only"> puntos</span>
        </p>
        <p v-if="showBalance && typeof m.balanceAfter === 'number'" class="small subtle tabular">Saldo {{ format.points(m.balanceAfter) }}</p>
      </div>
    </li>
  </ul>
</template>
