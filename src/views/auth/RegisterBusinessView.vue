<!--
  Alta de un comercio CON INVITACIÓN.
  1. Lee el token del enlace (?invitacion=…) y lo valida con la plataforma.
     Una invitación vencida, utilizada o revocada no permite registrarse.
  2. Con una invitación válida: crea (o reutiliza) la cuenta de la persona,
     que queda como DUEÑA, y el negocio en estado 'pendiente' con su
     solicitud de alta todavía sin enviar.
  3. Lleva a la configuración inicial; al final se envía a revisión del
     Superadmin. El negocio no opera con clientes hasta que lo aprueben.
-->
<script setup>
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import BaseAlert from '../../components/base/BaseAlert.vue';
import BaseButton from '../../components/base/BaseButton.vue';
import BaseField from '../../components/base/BaseField.vue';
import BaseIcon from '../../components/base/BaseIcon.vue';
import { useForm } from '../../composables/useForm.js';
import { BUSINESS_CATEGORIES } from '../../config/catalogs.js';
import { platformService } from '../../services/platformService.js';
import { useAuthStore } from '../../stores/auth.js';
import { format } from '../../utils/format.js';
import { validators as v } from '../../utils/validators.js';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

/** Token del enlace de invitación. */
const token = String(route.query.invitacion || '').trim();
/** Resultado de la validación: null (cargando) | { valid, email, expiresAt } | { valid: false, reason } */
const invitation = ref(null);

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

onMounted(async () => {
  if (!token) {
    invitation.value = { valid: false, reason: 'Para registrar un negocio necesitás un enlace de invitación del equipo de GO Puntos.', missing: true };
    return;
  }
  try {
    invitation.value = await platformService.validateInvitation(token);
    if (invitation.value.email) form.values.email = invitation.value.email;
  } catch (err) {
    invitation.value = { valid: false, reason: err.message };
  }
});

async function onSubmit() {
  const r = await form.submit((values) => auth.registerBusiness({ ...values, invitationToken: token }), { title: 'No pudimos crear el negocio' });
  if (r) router.replace({ name: 'admin-onboarding' });
}
</script>

<template>
  <header class="auth-heading">
    <h1>Creá el programa de tu comercio</h1>
    <p>Registrá tu negocio, configurá tus puntos, niveles y recompensas, y envialo a revisión. GO Puntos lo aprueba antes de que empiece a operar.</p>
  </header>

  <!-- Validando el enlace -->
  <p v-if="!invitation" class="muted" role="status"><BaseIcon name="hourglass" :size="16" /> Validando tu invitación…</p>

  <!-- Invitación inexistente, vencida, utilizada o revocada -->
  <div v-else-if="!invitation.valid" class="auth-form">
    <BaseAlert :tone="invitation.missing ? 'info' : 'error'" :title="invitation.missing ? 'Necesitás una invitación' : 'No podés usar este enlace'" :text="invitation.reason" />
    <p class="small muted">Las invitaciones las genera el equipo de GO Puntos y tienen una fecha de vencimiento. Si ya registraste tu negocio, ingresá con tu cuenta para ver el estado de tu solicitud.</p>
    <router-link class="btn btn--lg btn--block" :to="{ name: 'login' }">Ingresar</router-link>
  </div>

  <!-- Invitación válida: formulario -->
  <form v-else class="auth-form" novalidate @submit.prevent="onSubmit">
    <BaseAlert
      tone="success" title="Invitación válida"
      :text="`Podés usarla hasta el ${format.longDate(invitation.expiresAt)}.${invitation.email ? ` Está a nombre de ${invitation.email}.` : ''}`"
    />
    <BaseAlert v-if="auth.isAuthenticated" tone="info" text="Si ya tenés una cuenta de GO Puntos, usá el mismo email y contraseña: tu negocio queda en esa misma cuenta." />
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
    <BaseField
      v-model="form.values.email" name="email" label="Email" type="email" icon="mail" :error="form.errors.email" autocomplete="email"
      :readonly="Boolean(invitation.email)" :hint="invitation.email ? 'Es el email de la invitación.' : ''" @blur="form.validateField"
    />
    <BaseField v-model="form.values.phone" name="phone" label="Teléfono" type="tel" icon="phone" :error="form.errors.phone" autocomplete="tel" @blur="form.validateField" />
    <BaseField
      v-model="form.values.password" name="password" label="Contraseña" type="password" icon="lock" :toggle="false" :error="form.errors.password"
      autocomplete="new-password" hint="Mínimo 8 caracteres, con letras y números." @blur="form.validateField"
    />
    <BaseButton type="submit" size="lg" block :loading="form.busy.value" loading-text="Creando">Crear mi programa</BaseButton>
  </form>

  <p class="auth-switch">¿Ya tenés cuenta? <router-link :to="{ name: 'login' }" class="link">Ingresá</router-link></p>
</template>
