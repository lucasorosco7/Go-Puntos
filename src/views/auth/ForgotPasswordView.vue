<!--
  Recuperación de contraseña. La respuesta es la misma exista o no la
  cuenta (por seguridad no se revela qué emails están registrados).
-->
<script setup>
import { ref } from 'vue';
import BaseAlert from '../../components/base/BaseAlert.vue';
import BaseButton from '../../components/base/BaseButton.vue';
import BaseField from '../../components/base/BaseField.vue';
import BaseIcon from '../../components/base/BaseIcon.vue';
import { useForm } from '../../composables/useForm.js';
import { authService } from '../../services/authService.js';
import { validators as v } from '../../utils/validators.js';

const form = useForm({ email: '' }, { email: [v.required('email'), v.email] });
const sentTo = ref('');

async function onSubmit() {
  const r = await form.submit((values) => authService.requestPasswordReset(values.email));
  if (r) sentTo.value = form.values.email;
}
</script>

<template>
  <header class="auth-heading">
    <h1>Recuperá tu contraseña</h1>
    <p>Te mandamos un enlace para crear una nueva.</p>
  </header>

  <form v-if="!sentTo" class="auth-form" novalidate @submit.prevent="onSubmit">
    <BaseAlert v-if="form.alert.value" v-bind="form.alert.value" />
    <BaseField v-model="form.values.email" name="email" label="Email de tu cuenta" type="email" icon="mail" :error="form.errors.email" autocomplete="email" />
    <BaseButton type="submit" size="lg" block :loading="form.busy.value" loading-text="Enviando">Enviar enlace</BaseButton>
    <router-link :to="{ name: 'login' }" class="link" style="justify-self: center">Volver a ingresar</router-link>
  </form>

  <!-- Confirmación del envío -->
  <div v-else class="auth-form">
    <BaseAlert tone="success" title="Revisá tu correo" :text="`Si ${sentTo} está registrado, vas a recibir el enlace en unos minutos. Mirá también la carpeta de spam.`" />
    <router-link :to="{ name: 'login' }" class="btn btn--outline btn--block"><BaseIcon name="arrow-left" :size="18" />Volver a ingresar</router-link>
  </div>
</template>
