<!--
  Editor de oferta (alta, edición y duplicado) en una hoja.
  El campo "Valor" cambia según el tipo (porcentaje, monto, multiplicador,
  puntos extra) y "Aplicar automáticamente en caja" sólo aparece en las
  ofertas que afectan los puntos. Emite "saved" con la oferta guardada.
-->
<script setup>
import { computed, ref } from 'vue';
import { useForm } from '../../composables/useForm.js';
import { toast } from '../../composables/useToast.js';
import { REWARD_CATEGORIES } from '../../config/catalogs.js';
import { offers as Offers } from '../../domain/offers.js';
import { offerService } from '../../services/offerService.js';
import { fromInput, toInput } from '../../utils/dates.js';
import BaseAlert from '../base/BaseAlert.vue';
import BaseButton from '../base/BaseButton.vue';
import BaseField from '../base/BaseField.vue';
import BaseSheet from '../base/BaseSheet.vue';
import BaseToggle from '../base/BaseToggle.vue';
import ImagePicker from '../base/ImagePicker.vue';

const props = defineProps({
  data: { type: Object, default: () => ({}) },
  /** Niveles del negocio (para los beneficios exclusivos). */
  levels: { type: Array, default: () => [] },
});
const emit = defineEmits(['saved', 'close']);
const isNew = computed(() => !props.data.id);
const sheet = ref(null);
const categoryOptions = Object.entries(REWARD_CATEGORIES).map(([value, c]) => ({ value, label: c.label }));
const typeOptions = Object.entries(Offers.TYPES).map(([value, t]) => ({ value, label: t.label }));
const statusOptions = ['borrador', 'activa', 'pausada', 'finalizada'].map((value) => ({ value, label: Offers.STATUS[value].label }));
/** "Avisar al publicarla" sólo tiene sentido si todavía no está activa. */
const canNotify = computed(() => isNew.value || props.data.status !== 'activa');

const d = props.data;
const form = useForm({
  title: d.title || '', description: d.description || '', type: d.type || 'porcentaje', value: d.value ?? '',
  startDate: toInput(d.startDate), endDate: toInput(d.endDate), category: d.category || 'general', status: d.status || 'borrador',
  schedule: d.schedule || '', conditions: d.conditions || '', levelIds: [...(d.levelIds || [])],
  autoApply: d.id ? Boolean(d.autoApply) : (d.autoApply ?? true), image: d.image || null, featured: Boolean(d.featured), notify: true,
}, {}, { idPrefix: 'of' });
const type = computed(() => Offers.TYPES[form.values.type]);

async function save() {
  const { notify, ...rest } = form.values;
  const res = await form.submit(() => offerService.save({
    ...d, ...rest, levelIds: rest.levelIds.map(Number), startDate: fromInput(rest.startDate), endDate: fromInput(rest.endDate, true),
  }, { notify: canNotify.value && notify }));
  if (!res) return;
  toast(res.notified ? `Oferta guardada. Avisamos a ${res.notified} clientes.` : 'Oferta guardada.');
  emit('saved', res.offer);
  sheet.value.close();
}
</script>

<template>
  <BaseSheet
    ref="sheet" :title="isNew ? 'Nueva oferta' : 'Editar oferta'" description="Promociones que ven tus clientes en la pestaña Ofertas."
    size="lg" @close="emit('close')"
  >
    <form class="form-grid" novalidate @submit.prevent="save">
      <!-- Alerta general del formulario (mismo lugar que en la maqueta) -->
      <div><BaseAlert v-if="form.alert.value" v-bind="form.alert.value" /></div>
      <BaseField v-model="form.values.title" id-prefix="of" name="title" label="Título" placeholder="Ej.: 20% OFF en frutos secos" :error="form.errors.title" />
      <BaseField v-model="form.values.description" id-prefix="of" name="description" label="Descripción" type="textarea" />
      <div class="form-grid form-grid--2">
        <BaseField v-model="form.values.type" id-prefix="of" name="type" label="Tipo de oferta" type="select" :options="typeOptions" :error="form.errors.type" />
        <!-- El valor depende del tipo (y no existe para algunos) -->
        <BaseField
          v-show="type.valueLabel" v-model="form.values.value" id-prefix="of" name="value" :label="type.valueLabel || 'Valor'" type="number"
          min="0" step="any" :error="form.errors.value"
        />
        <BaseField v-model="form.values.startDate" id-prefix="of" name="startDate" label="Desde" type="date" :error="form.errors.startDate" />
        <BaseField v-model="form.values.endDate" id-prefix="of" name="endDate" label="Hasta" type="date" hint="Vacío = sin fecha de fin." :error="form.errors.endDate" />
        <BaseField v-model="form.values.category" id-prefix="of" name="category" label="Categoría" type="select" :options="categoryOptions" />
        <BaseField v-model="form.values.status" id-prefix="of" name="status" label="Estado" type="select" :options="statusOptions" />
      </div>
      <BaseField
        v-model="form.values.schedule" id-prefix="of" name="schedule" label="Texto de vigencia (opcional)" placeholder="Ej.: Todos los miércoles"
        hint="Si lo completás, reemplaza las fechas en la tarjeta del cliente."
      />
      <BaseField v-model="form.values.conditions" id-prefix="of" name="conditions" label="Condiciones (opcional)" type="textarea" placeholder="Ej.: Llevando 2 paquetes. No acumulable." />
      <!-- Niveles habilitados -->
      <fieldset class="fieldset" data-field="levelIds" :class="{ 'has-error': form.errors.levelIds }">
        <legend>Niveles habilitados <span class="muted">(ninguno = todos)</span></legend>
        <div class="check-list">
          <label v-for="l in levels" :key="l.id" class="check-chip"><input v-model="form.values.levelIds" type="checkbox" name="levelIds" :value="l.id" /><span>{{ l.name }}</span></label>
        </div>
        <p v-show="form.errors.levelIds" id="of-levelIds-error" class="field__error">{{ form.errors.levelIds }}</p>
      </fieldset>
      <div v-show="type.affectsPoints">
        <BaseToggle v-model="form.values.autoApply" name="autoApply" label="Aplicar automáticamente en caja" hint="Si está apagado, el cajero la marca cuando se cumplen las condiciones." />
      </div>
      <ImagePicker v-model="form.values.image" label="Imagen (opcional)" />
      <BaseToggle v-model="form.values.featured" name="featured" label="Oferta destacada" hint="Se muestra grande arriba de todo. Sólo puede haber una." />
      <BaseToggle v-if="canNotify" v-model="form.values.notify" name="notify" label="Avisar a los clientes al publicarla" hint="Les llega una notificación cuando la oferta esté activa." />
    </form>
    <template #actions="{ close }">
      <button type="button" class="btn btn--ghost" @click="close()">Cancelar</button>
      <BaseButton :loading="form.busy.value" loading-text="Guardando" @click="save">{{ isNew ? 'Guardar oferta' : 'Guardar cambios' }}</BaseButton>
    </template>
  </BaseSheet>
</template>
