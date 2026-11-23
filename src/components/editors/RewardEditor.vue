<!--
  Editor de recompensa (alta y edición) en una hoja.
  Lo usan la pantalla Recompensas y la configuración inicial: una sola
  implementación. Emite "saved" con la recompensa guardada.
-->
<script setup>
import { computed, ref } from 'vue';
import { useForm } from '../../composables/useForm.js';
import { toast } from '../../composables/useToast.js';
import { REWARD_CATEGORIES } from '../../config/catalogs.js';
import { rewards as Rewards } from '../../domain/rewards.js';
import { rewardService } from '../../services/rewardService.js';
import { fromInput, toInput } from '../../utils/dates.js';
import { validators as v } from '../../utils/validators.js';
import BaseAlert from '../base/BaseAlert.vue';
import BaseButton from '../base/BaseButton.vue';
import BaseField from '../base/BaseField.vue';
import BaseSheet from '../base/BaseSheet.vue';
import BaseToggle from '../base/BaseToggle.vue';
import ImagePicker from '../base/ImagePicker.vue';

const props = defineProps({
  /** Recompensa a editar, o datos iniciales (plantilla). Sin id = nueva. */
  data: { type: Object, default: () => ({}) },
});
const emit = defineEmits(['saved', 'close']);
const isNew = computed(() => !props.data.id);
const sheet = ref(null);
const categoryOptions = Object.entries(REWARD_CATEGORIES).map(([value, c]) => ({ value, label: c.label }));
const statusOptions = Object.entries(Rewards.STATUS).map(([value, s]) => ({ value, label: s.label }));

const d = props.data;
const form = useForm({
  name: d.name || '', description: d.description || '', points: d.points ?? '', category: d.category || 'general',
  stock: d.stock ?? '', status: d.status || 'activa', validFrom: toInput(d.validFrom), validTo: toInput(d.validTo),
  image: d.image || null, featured: Boolean(d.featured),
}, {
  name: [v.filled('Poné un nombre a la recompensa.')],
  points: [v.positive('un costo en puntos')],
}, { idPrefix: 'rec' });

async function save() {
  const res = await form.submit((values) => rewardService.save({
    ...d, ...values, validFrom: fromInput(values.validFrom), validTo: fromInput(values.validTo, true),
  }));
  if (!res) return;
  toast(res.notified ? `Recompensa guardada. Avisamos a ${res.notified} clientes.` : 'Recompensa guardada.');
  emit('saved', res.reward);
  sheet.value.close();
}
</script>

<template>
  <BaseSheet
    ref="sheet" :title="isNew ? 'Nueva recompensa' : 'Editar recompensa'" description="Lo que tus clientes pueden canjear con su saldo de puntos."
    size="lg" @close="emit('close')"
  >
    <form class="form-grid" novalidate @submit.prevent="save">
      <!-- Alerta general del formulario (mismo lugar que en la maqueta) -->
      <div><BaseAlert v-if="form.alert.value" v-bind="form.alert.value" /></div>
      <BaseField v-model="form.values.name" id-prefix="rec" name="name" label="Nombre" placeholder="Ej.: Café chico de regalo" :error="form.errors.name" />
      <BaseField v-model="form.values.description" id-prefix="rec" name="description" label="Descripción" type="textarea" placeholder="Qué incluye y cualquier condición." />
      <div class="form-grid form-grid--2">
        <BaseField v-model="form.values.points" id-prefix="rec" name="points" label="Costo en puntos" type="number" min="1" inputmode="numeric" suffix="pts" :error="form.errors.points" />
        <BaseField v-model="form.values.category" id-prefix="rec" name="category" label="Categoría" type="select" :options="categoryOptions" />
        <BaseField v-model="form.values.stock" id-prefix="rec" name="stock" label="Stock (opcional)" type="number" min="0" inputmode="numeric" hint="Vacío = sin límite." :error="form.errors.stock" />
        <BaseField v-model="form.values.status" id-prefix="rec" name="status" label="Estado" type="select" :options="statusOptions" />
        <BaseField v-model="form.values.validFrom" id-prefix="rec" name="validFrom" label="Disponible desde (opcional)" type="date" :error="form.errors.validFrom" />
        <BaseField v-model="form.values.validTo" id-prefix="rec" name="validTo" label="Disponible hasta (opcional)" type="date" :error="form.errors.validTo" />
      </div>
      <ImagePicker v-model="form.values.image" label="Imagen (opcional)" hint="Si no cargás una, se usa la ilustración de la categoría." />
      <BaseToggle v-model="form.values.featured" name="featured" label="Destacada" hint="Aparece primero en la landing y en Mis puntos." />
    </form>
    <template #actions="{ close }">
      <button type="button" class="btn btn--ghost" @click="close()">Cancelar</button>
      <BaseButton :loading="form.busy.value" loading-text="Guardando" @click="save">{{ isNew ? 'Crear recompensa' : 'Guardar cambios' }}</BaseButton>
    </template>
  </BaseSheet>
</template>
