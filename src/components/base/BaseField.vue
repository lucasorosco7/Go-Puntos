<!--
  Campo de formulario de GO Puntos.
  Misma estructura y accesibilidad que la maqueta:
    .field > label + .field__control (ícono, control, sufijo) + ayuda + error
  - type: text | email | tel | number | password | date | textarea | select
  - El error reemplaza a la ayuda y se anuncia con aria-describedby.
  - Atributos extra (min, step, inputmode, autocomplete, rows…) pasan al control.
  - Con type="password" agrega el botón de mostrar/ocultar.
-->
<script setup>
import { computed, ref } from 'vue';
import BaseIcon from './BaseIcon.vue';

defineOptions({ inheritAttrs: false });

const model = defineModel({ type: [String, Number, null], default: '' });
const props = defineProps({
  name: { type: String, required: true },
  label: { type: String, required: true },
  type: { type: String, default: 'text' },
  icon: { type: String, default: '' },
  hint: { type: String, default: '' },
  error: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  /** Opciones del select: { valor: etiqueta } o [{ value, label }] */
  options: { type: [Object, Array], default: null },
  suffix: { type: String, default: '' },
  /** Clase extra del contenedor (ej.: field--compact, span-2). */
  fieldClass: { type: [String, Array, Object], default: '' },
  /** Prefijo del id (para no repetir ids entre un formulario y una hoja). */
  idPrefix: { type: String, default: 'f' },
  /** Muestra el botón de ver la contraseña (sólo type="password"). */
  toggle: { type: Boolean, default: true },
});
const emit = defineEmits(['blur']);

const id = computed(() => `${props.idPrefix}-${props.name}`);
const visible = ref(false);
const inputType = computed(() => (props.type === 'password' && visible.value ? 'text' : props.type));
const describedBy = computed(() => (props.error ? `${id.value}-error` : props.hint ? `${id.value}-hint` : undefined));
const list = computed(() => (Array.isArray(props.options)
  ? props.options
  : Object.entries(props.options || {}).map(([value, label]) => ({ value, label }))));

/** Los number vuelven como número (o '' si está vacío), igual que forms.read() de la maqueta. */
function onInput(e) {
  const v = e.target.value;
  model.value = props.type === 'number' ? (v === '' ? '' : Number(v)) : v;
}
</script>

<template>
  <div class="field" :class="[fieldClass, { 'has-error': error }]" :data-field="name">
    <label :for="id" class="field__label">{{ label }}</label>
    <div class="field__control">
      <BaseIcon v-if="icon" :name="icon" :size="18" class="field__icon" />

      <!-- Área de texto -->
      <textarea
        v-if="type === 'textarea'"
        :id="id" :name="name" class="field__input field__input--area" :placeholder="placeholder"
        :value="model ?? ''" :aria-invalid="error ? 'true' : 'false'" :aria-describedby="describedBy"
        v-bind="$attrs" @input="onInput" @blur="emit('blur', name)"
      ></textarea>

      <!-- Lista desplegable -->
      <select
        v-else-if="type === 'select'"
        :id="id" :name="name" class="field__input field__input--select" :class="{ 'has-icon': icon }"
        :value="model ?? ''" :aria-invalid="error ? 'true' : 'false'" :aria-describedby="describedBy"
        v-bind="$attrs" @change="onInput" @blur="emit('blur', name)"
      >
        <option v-for="o in list" :key="o.value" :value="o.value">{{ o.label }}</option>
      </select>

      <!-- Texto, email, teléfono, número, fecha o contraseña -->
      <input
        v-else
        :id="id" :name="name" :type="inputType" :placeholder="placeholder"
        class="field__input" :class="{ 'has-icon': icon, 'has-suffix': suffix, 'has-action': type === 'password' && toggle }"
        :value="model ?? ''" :aria-invalid="error ? 'true' : 'false'" :aria-describedby="describedBy"
        v-bind="$attrs" @input="onInput" @blur="emit('blur', name)"
      />

      <span v-if="suffix" class="field__suffix">{{ suffix }}</span>

      <!-- Mostrar u ocultar la contraseña -->
      <button
        v-if="type === 'password' && toggle" type="button" class="field__action"
        :aria-label="visible ? 'Ocultar contraseña' : 'Mostrar contraseña'" :aria-pressed="String(visible)"
        @click="visible = !visible"
      >
        <BaseIcon :name="visible ? 'eye-off' : 'eye'" :size="18" />
      </button>
    </div>
    <p v-if="hint && !error" :id="`${id}-hint`" class="field__hint">{{ hint }}</p>
    <p v-show="error" :id="`${id}-error`" class="field__error">{{ error }}</p>
  </div>
</template>
