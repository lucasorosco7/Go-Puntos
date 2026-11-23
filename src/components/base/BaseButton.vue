<!--
  Botón de GO Puntos.
  Genera la misma estructura que la maqueta (.btn y sus variantes) y
  resuelve tres casos con un solo componente:
    - botón común (<button>),
    - enlace interno (to → <router-link>) o externo (href → <a>),
    - estado de carga: deshabilita, muestra el spinner y un texto.
-->
<script setup>
import { computed } from 'vue';
import BaseIcon from './BaseIcon.vue';

const props = defineProps({
  /** '' (principal) | 'outline' | 'ghost' | 'honey' | 'danger' | 'hero' */
  variant: { type: String, default: '' },
  /** '' | 'sm' | 'lg' */
  size: { type: String, default: '' },
  block: Boolean,
  /** Muestra el spinner y deshabilita el botón. */
  loading: Boolean,
  /** Texto mientras carga (ej.: "Guardando"). */
  loadingText: { type: String, default: 'Cargando' },
  /** Ícono a la izquierda del texto. */
  icon: { type: String, default: '' },
  /** Ícono a la derecha del texto. */
  iconRight: { type: String, default: '' },
  iconSize: { type: Number, default: 18 },
  /** Ruta interna (router-link). */
  to: { type: [String, Object], default: null },
  /** Enlace externo o descarga. */
  href: { type: String, default: '' },
  type: { type: String, default: 'button' },
  disabled: Boolean,
});

const classes = computed(() => [
  'btn',
  props.variant && `btn--${props.variant}`,
  props.size && `btn--${props.size}`,
  props.block && 'btn--block',
  props.loading && 'is-loading',
]);
const tag = computed(() => (props.to ? 'router-link' : props.href ? 'a' : 'button'));
</script>

<template>
  <component
    :is="tag"
    :class="classes"
    :to="to || undefined"
    :href="href || undefined"
    :type="tag === 'button' ? type : undefined"
    :disabled="tag === 'button' ? disabled || loading : undefined"
    :aria-busy="loading ? 'true' : undefined"
  >
    <!-- Estado de carga: reemplaza el contenido por el spinner -->
    <template v-if="loading">
      <span class="spinner" aria-hidden="true"></span><span>{{ loadingText }}</span>
    </template>
    <template v-else>
      <BaseIcon v-if="icon" :name="icon" :size="iconSize" />
      <slot />
      <BaseIcon v-if="iconRight" :name="iconRight" :size="iconSize - 2" />
    </template>
  </component>
</template>
