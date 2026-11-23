<!--
  Editor de desafío (alta y edición) en una hoja.
  El progreso se calcula solo con las compras y canjes del cliente.
  El premio en puntos va al SALDO: no suma al nivel ni al ranking.
-->
<script setup>
import { computed, ref, watch } from 'vue';
import { useForm } from '../../composables/useForm.js';
import { toast } from '../../composables/useToast.js';
import { challenges as Challenges } from '../../domain/challenges.js';
import { challengeService } from '../../services/challengeService.js';
import { fromInput, periodEnd, periodOf, periodStart, toInput } from '../../utils/dates.js';
import BaseAlert from '../base/BaseAlert.vue';
import BaseButton from '../base/BaseButton.vue';
import BaseField from '../base/BaseField.vue';
import BaseSheet from '../base/BaseSheet.vue';

const props = defineProps({ data: { type: Object, default: () => ({}) } });
const emit = defineEmits(['saved', 'close']);
const isNew = computed(() => !props.data.id);
const sheet = ref(null);
const typeOptions = Object.entries(Challenges.TYPES).map(([value, t]) => ({ value, label: `${t.label} — ${t.example}` }));
const statusOptions = Object.entries(Challenges.STATUS).map(([value, s]) => ({ value, label: s.label }));

const d = props.data;
const now = new Date();
const form = useForm({
  type: d.type || 'compras', name: d.name || '', description: d.description || '',
  goal: d.goal ?? Challenges.TYPES[d.type || 'compras'].defaultGoal, rewardPoints: d.rewardPoints ?? 100,
  // Por defecto: el mes en curso
  startDate: toInput(d.startDate || periodStart(periodOf(now))), endDate: toInput(d.endDate || periodEnd(periodOf(now))),
  status: d.status || 'activo', rewardText: d.rewardText || '',
}, {}, { idPrefix: 'des' });
const namePlaceholder = ref('Ej.: Tres compras este mes');

// En un desafío nuevo, al cambiar el tipo se propone su objetivo típico
watch(() => form.values.type, (t) => {
  if (d.id) return;
  form.values.goal = Challenges.TYPES[t].defaultGoal;
  if (!form.values.name) namePlaceholder.value = Challenges.TYPES[t].example;
});

async function save() {
  const saved = await form.submit((values) => challengeService.save({
    ...d, ...values, startDate: fromInput(values.startDate), endDate: fromInput(values.endDate, true),
  }));
  if (!saved) return;
  toast('Desafío guardado.');
  emit('saved', saved);
  sheet.value.close();
}
</script>

<template>
  <BaseSheet
    ref="sheet" :title="isNew ? 'Nuevo desafío' : 'Editar desafío'"
    description="Un objetivo con premio. El progreso se calcula solo con las compras y canjes." size="lg" @close="emit('close')"
  >
    <form class="form-grid" novalidate @submit.prevent="save">
      <!-- Alerta general del formulario (mismo lugar que en la maqueta) -->
      <div><BaseAlert v-if="form.alert.value" v-bind="form.alert.value" /></div>
      <BaseField v-model="form.values.type" id-prefix="des" name="type" label="Tipo" type="select" :options="typeOptions" :error="form.errors.type" />
      <BaseField v-model="form.values.name" id-prefix="des" name="name" label="Nombre" :placeholder="namePlaceholder" :error="form.errors.name" />
      <BaseField v-model="form.values.description" id-prefix="des" name="description" label="Descripción" type="textarea" />
      <div class="form-grid form-grid--2">
        <BaseField v-model="form.values.goal" id-prefix="des" name="goal" label="Objetivo" type="number" min="1" :error="form.errors.goal" />
        <BaseField
          v-model="form.values.rewardPoints" id-prefix="des" name="rewardPoints" label="Premio en puntos" type="number" min="0" suffix="pts"
          hint="Se acreditan solos al saldo. No suman al nivel ni al ranking."
        />
        <BaseField v-model="form.values.startDate" id-prefix="des" name="startDate" label="Empieza" type="date" :error="form.errors.startDate" />
        <BaseField v-model="form.values.endDate" id-prefix="des" name="endDate" label="Termina" type="date" :error="form.errors.endDate" />
        <BaseField v-model="form.values.status" id-prefix="des" name="status" label="Estado" type="select" :options="statusOptions" />
        <BaseField v-model="form.values.rewardText" id-prefix="des" name="rewardText" label="Premio adicional (opcional)" placeholder="Ej.: Un café de regalo" />
      </div>
    </form>
    <template #actions="{ close }">
      <button type="button" class="btn btn--ghost" @click="close()">Cancelar</button>
      <BaseButton :loading="form.busy.value" loading-text="Guardando" @click="save">{{ isNew ? 'Crear desafío' : 'Guardar cambios' }}</BaseButton>
    </template>
  </BaseSheet>
</template>
