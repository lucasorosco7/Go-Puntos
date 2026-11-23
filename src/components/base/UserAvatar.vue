<!--
  Avatar con las iniciales de la persona.
-->
<script setup>
import { computed } from 'vue';
import { format } from '../../utils/format.js';

const props = defineProps({
  user: { type: Object, required: true },
  size: { type: Number, default: 42 },
});
const initials = computed(() => format.initials(props.user.firstName, props.user.lastName));
</script>

<template>
  <span class="avatar" :style="{ width: `${size}px`, height: `${size}px`, fontSize: `${Math.round(size * 0.34)}px` }" aria-hidden="true">{{ initials }}</span>
</template>
