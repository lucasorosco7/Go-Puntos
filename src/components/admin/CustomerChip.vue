<!--
  Identificación compacta de un cliente o empleado: avatar, nombre,
  nivel y datos extra (slot). Se usa en Caja, listados y empleados.
-->
<script setup>
import UserAvatar from '../base/UserAvatar.vue';
import LevelBadge from '../loyalty/LevelBadge.vue';

defineProps({
  user: { type: Object, required: true },
  level: { type: Object, default: null },
});
</script>

<template>
  <span class="cust">
    <UserAvatar :user="user" :size="40" />
    <span class="cust__body">
      <span class="cust__name">{{ user.firstName }} {{ user.lastName }}</span>
      <span class="cust__meta"><LevelBadge v-if="level" :level="level" size="sm" /><slot /></span>
    </span>
  </span>
</template>
