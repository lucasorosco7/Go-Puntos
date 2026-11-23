<!--
  Alta de un comercio: crea la cuenta de la persona (queda como DUEÑA del
  negocio) y el negocio en borrador, y lleva a la configuración inicial.
-->
<script setup>
import { useRouter } from 'vue-router';
import BaseAlert from '../../components/base/BaseAlert.vue';
import BaseButton from '../../components/base/BaseButton.vue';
import BaseField from '../../components/base/BaseField.vue';
import { useForm } from '../../composables/useForm.js';
import { BUSINESS_CATEGORIES } from '../../config/catalogs.js';
import { useAuthStore } from '../../stores/auth.js';
import { validators as v } from '../../utils/validators.js';

const router = useRouter();
const auth = useAuthStore();

const form = useForm(
  { businessName: '', category: 'dietetica', firstName: '', lastName: '', email: '', phone: '', password: '' },
  {
    businessName: [v.filled('Ingresá el nombre del negocio.')],
    firstName: [v.required('nombre')],
    lastName: [v.required('apellido')],
    email: [v.required('email'), v.email],
    phone: [v.required('teléfono'), v.phone],
    password: [v.required('contraseña'), v.password],
  },
);

async function onSubmit() {
  const r = await form.submit((values) => auth.registerBusiness(values), { title: 'No pudimos crear el negocio' });
  if (r) router.replace({ name: 'admin-onboarding' });
}
</script>

<template>
  <header class="auth-heading">
    <h1>Creá el programa de tu comercio</h1>
    <p>En unos minutos tenés tus puntos, niveles y recompensas funcionando. Lo podés completar de a poco.</p>
  </header>

  <form class="auth-form" novalidate @submit.prevent="onSubmit">
    <!-- Alerta general del formulario (mismo lugar que en la maqueta) -->
    <div><BaseAlert v-if="form.alert.value" v-bind="form.alert.value" /></div>
    <!-- Datos del negocio -->
    <p class="group-title" style="margin: 0">Tu negocio</p>
    <BaseField v-model="form.values.businessName" name="businessName" label="Nombre del negocio" icon="store" :error="form.errors.businessName" autocomplete="organization" @blur="form.validateField" />
    <BaseField v-model="form.values.category" name="category" label="Rubro" type="select" :options="BUSINESS_CATEGORIES" :error="form.errors.category" />

    <!-- Datos de la persona (queda como dueña) -->
    <p class="group-title" style="margin-bottom: 0">Tus datos (administrador)</p>
    <div class="auth-form__pair">
      <BaseField v-model="form.values.firstName" name="firstName" label="Nombre" icon="user-round" :error="form.errors.firstName" autocomplete="given-name" @blur="form.validateField" />
      <BaseField v-model="form.values.lastName" name="lastName" label="Apellido" :error="form.errors.lastName" autocomplete="family-name" @blur="form.validateField" />
    </div>
    <BaseField v-model="form.values.email" name="email" label="Email" type="email" icon="mail" :error="form.errors.email" autocomplete="email" @blur="form.validateField" />
    <BaseField v-model="form.values.phone" name="phone" label="Teléfono" type="tel" icon="phone" :error="form.errors.phone" autocomplete="tel" @blur="form.validateField" />
    <BaseField
      v-model="form.values.password" name="password" label="Contraseña" type="password" icon="lock" :toggle="false" :error="form.errors.password"
      autocomplete="new-password" hint="Mínimo 8 caracteres, con letras y números." @blur="form.validateField"
    />
    <BaseButton type="submit" size="lg" block :loading="form.busy.value" loading-text="Creando">Crear mi programa</BaseButton>
  </form>

  <p class="auth-switch">¿Ya tenés cuenta? <router-link :to="{ name: 'login' }" class="link">Ingresá</router-link></p>
</template>
