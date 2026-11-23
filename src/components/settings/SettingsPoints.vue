<!--
  Configuración · Sistema de puntos: equivalencia dinero/puntos, redondeo,
  compra mínima, bienvenida, días para retirar un canje y bonificación por
  nivel. El simulador usa la MISMA regla de domain/points.js que la Caja.
-->
<script setup>
import { computed } from 'vue';
import { levels as Levels } from '../../domain/levels.js';
import { points as Points, ROUNDING } from '../../domain/points.js';
import { businessService } from '../../services/businessService.js';
import { format } from '../../utils/format.js';
import BaseAlert from '../base/BaseAlert.vue';
import BaseField from '../base/BaseField.vue';
import BaseIcon from '../base/BaseIcon.vue';
import BaseToggle from '../base/BaseToggle.vue';
import { useSection } from './useSection.js';

const props = defineProps({ ctx: { type: Object, required: true } });
// Eventos comunes de las secciones (no todas los usan): pedir recarga del contexto o ir a otro paso
defineEmits(['reload', 'goto']);
const r = props.ctx.business.pointsRule;
const { form, run } = useSection({
  pesos: r.pesos, points: r.points, rounding: r.rounding, minPurchase: r.minPurchase, welcomeBonus: r.welcomeBonus,
  redemptionValidityDays: props.ctx.business.redemptionValidityDays, applyLevelMultiplier: r.applyLevelMultiplier, simAmount: 12500,
}, {
  pesos: [(x) => (Number(x) > 0 ? '' : 'Ingresá cuántos pesos equivalen a los puntos.')],
  points: [(x) => (Number(x) > 0 ? '' : 'Ingresá cuántos puntos se suman.')],
});
const f = form.values;
const roundingOptions = Object.entries(ROUNDING).map(([value, x]) => ({ value, label: `${x.label} (${x.hint})` }));

/** Simulación en vivo con la regla que se está editando. */
const sim = computed(() => {
  const rule = { pesos: Number(f.pesos) || 1, points: Number(f.points) || 1, rounding: f.rounding, minPurchase: Number(f.minPurchase) || 0, applyLevelMultiplier: f.applyLevelMultiplier };
  const amount = Number(f.simAmount) || 0;
  const top = Levels.sorted(props.ctx.levels).slice(-1)[0];
  return { rule, base: Points.calculate({ amount, rule }), top, withLevel: top ? Points.calculate({ amount, rule, level: top }) : null };
});

function save() {
  return run((x) => businessService.update({
    pointsRule: {
      pesos: Number(x.pesos), points: Number(x.points), rounding: x.rounding, minPurchase: Number(x.minPurchase) || 0,
      welcomeBonus: Number(x.welcomeBonus) || 0, applyLevelMultiplier: x.applyLevelMultiplier,
    },
    redemptionValidityDays: Math.max(1, Number(x.redemptionValidityDays) || 30),
  }));
}
defineExpose({ save });
</script>

<template>
  <!-- Alerta general del formulario (mismo lugar que en la maqueta) -->
  <div><BaseAlert v-if="form.alert.value" v-bind="form.alert.value" /></div>
  <div class="settings-split">
    <div class="form-grid">
      <!-- Equivalencia -->
      <div class="rule">
        <span>Por cada</span>
        <BaseField v-model="f.pesos" id-prefix="cfg" name="pesos" label="Pesos gastados" type="number" min="1" icon="dollar-sign" field-class="field--compact" :error="form.errors.pesos" />
        <span>el cliente suma</span>
        <BaseField v-model="f.points" id-prefix="cfg" name="points" label="Puntos" type="number" min="1" suffix="pts" field-class="field--compact" :error="form.errors.points" />
      </div>
      <div class="form-grid form-grid--2">
        <BaseField v-model="f.rounding" id-prefix="cfg" name="rounding" label="Redondeo" type="select" :options="roundingOptions" />
        <BaseField v-model="f.minPurchase" id-prefix="cfg" name="minPurchase" label="Compra mínima para sumar" type="number" min="0" icon="dollar-sign" hint="0 = cualquier importe." />
        <BaseField v-model="f.welcomeBonus" id-prefix="cfg" name="welcomeBonus" label="Puntos de bienvenida" type="number" min="0" suffix="pts" hint="Bonificación al sumarse." />
        <BaseField v-model="f.redemptionValidityDays" id-prefix="cfg" name="redemptionValidityDays" label="Días para retirar un canje" type="number" min="1" suffix="días" />
      </div>
      <BaseToggle v-model="f.applyLevelMultiplier" name="applyLevelMultiplier" label="Bonificación por nivel" hint="Cada nivel puede sumar un % extra de puntos (se configura en Niveles)." />
      <p class="small muted"><BaseIcon name="sparkles" :size="13" /> Los <b>puntos dobles</b> y <b>puntos extra</b> se configuran como ofertas, con fechas.</p>
    </div>
    <!-- Simulador -->
    <div class="settings-aside">
      <div class="card simulator">
        <p class="group-title" style="margin-top: 0">Probá la regla</p>
        <BaseField v-model="f.simAmount" id-prefix="cfg" name="simAmount" label="Importe de una compra" type="number" icon="receipt" />
        <div>
          <p class="simulator__rule">{{ Points.describeRule(sim.rule) }}</p>
          <p class="simulator__result"><b class="tabular">{{ format.points(sim.base.total) }}</b> puntos</p>
          <p v-if="sim.base.belowMinimum" class="small muted">No llega a la compra mínima: no suma puntos.</p>
          <p v-if="sim.withLevel && sim.rule.applyLevelMultiplier && sim.top.multiplier > 1" class="small muted">
            Un cliente {{ sim.top.name }} sumaría <b class="tabular">{{ format.points(sim.withLevel.total) }}</b>.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
