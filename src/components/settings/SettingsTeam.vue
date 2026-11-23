<!--
  Configuración · Empleados (opcionales). Pueden buscar clientes, escanear
  QR, registrar compras y validar canjes, pero no ven métricas ni cambian
  la configuración. Si la persona ya tiene cuenta de GO Puntos, se usa esa
  misma cuenta (una sola cuenta por persona) y queda con rol de empleado
  en este negocio.
-->
<script setup>
import { onMounted, ref } from 'vue';
import { confirm } from '../../composables/useConfirm.js';
import { useForm } from '../../composables/useForm.js';
import { toast } from '../../composables/useToast.js';
import { businessService } from '../../services/businessService.js';
import { validators as v } from '../../utils/validators.js';
import CustomerChip from '../admin/CustomerChip.vue';
import PageLoading from '../admin/PageLoading.vue';
import BaseAlert from '../base/BaseAlert.vue';
import BaseButton from '../base/BaseButton.vue';
import BaseField from '../base/BaseField.vue';
import BaseIcon from '../base/BaseIcon.vue';
import EmptyState from '../base/EmptyState.vue';
import StatusPill from '../base/StatusPill.vue';

// Recibe el contexto como las demás secciones, aunque trabaja con sus propios datos
defineProps({ ctx: { type: Object, default: null } });
defineEmits(['reload', 'goto']);

const list = ref(null);
const load = async () => { list.value = await businessService.getEmployees(); };
onMounted(load);

const form = useForm({ firstName: '', lastName: '', email: '', password: '' }, {
  firstName: [v.required('nombre')], lastName: [v.required('apellido')],
  email: [v.required('email'), v.email], password: [v.required('contraseña'), v.password],
}, { idPrefix: 'emp' });

async function create() {
  const emp = await form.submit((values) => businessService.createEmployee(values));
  if (!emp) return;
  toast(emp.reused ? `${emp.firstName} ya tenía cuenta de GO Puntos: ahora también es empleado. Ingresa con su contraseña de siempre.` : 'Empleado creado. Ya puede ingresar con su email.');
  form.reset({ firstName: '', lastName: '', email: '', password: '' });
  load();
}
async function toggle(u) {
  try { await businessService.setEmployeeActive(u.id, !u.active); toast('Empleado actualizado.'); load(); } catch (err) { toast(err.message, 'error'); }
}
async function remove(u) {
  if (!await confirm({ title: '¿Eliminar este empleado?', description: 'Ya no va a poder ingresar. Sus operaciones quedan registradas.', confirmText: 'Eliminar', tone: 'danger' })) return;
  try { await businessService.removeEmployee(u.id); toast('Empleado eliminado.'); load(); } catch (err) { toast(err.message, 'error'); }
}
</script>

<template>
  <PageLoading v-if="!list" height="200px" />
  <div v-else class="settings-split">
    <div>
      <p class="muted" style="margin-bottom: var(--sp-4)">
        Los empleados son opcionales. Pueden buscar clientes, escanear QR, registrar compras y validar canjes, pero no ven métricas ni cambian la configuración.
        Vos podés hacer todo lo mismo desde Caja.
      </p>
      <ul v-if="list.length" class="stack">
        <li v-for="u in list" :key="u.id" class="row">
          <CustomerChip :user="u"><span>{{ u.email }}</span></CustomerChip>
          <span style="margin-left: auto" class="btn-row">
            <StatusPill :meta="u.active ? { label: 'Activo', tone: 'green' } : { label: 'Desactivado' }" />
            <button type="button" class="btn btn--ghost btn--sm" @click="toggle(u)">{{ u.active ? 'Desactivar' : 'Activar' }}</button>
            <button type="button" class="btn btn--ghost btn--sm" aria-label="Eliminar" @click="remove(u)"><BaseIcon name="trash-2" :size="16" /></button>
          </span>
        </li>
      </ul>
      <EmptyState v-else icon="users" title="No tenés empleados cargados" text="No hace falta: podés operar todo vos. Si alguien más atiende la caja, dale su propio usuario." />
    </div>

    <!-- Alta de empleado -->
    <form class="card form-grid" novalidate @submit.prevent="create">
      <!-- Alerta general del formulario (mismo lugar que en la maqueta) -->
      <div><BaseAlert v-if="form.alert.value" v-bind="form.alert.value" /></div>
      <h2>Agregar empleado</h2>
      <div class="form-grid form-grid--2">
        <BaseField v-model="form.values.firstName" id-prefix="emp" name="firstName" label="Nombre" :error="form.errors.firstName" />
        <BaseField v-model="form.values.lastName" id-prefix="emp" name="lastName" label="Apellido" :error="form.errors.lastName" />
      </div>
      <BaseField v-model="form.values.email" id-prefix="emp" name="email" label="Email (para ingresar)" type="email" icon="mail" :error="form.errors.email" />
      <BaseField
        v-model="form.values.password" id-prefix="emp" name="password" label="Contraseña inicial" icon="lock" :error="form.errors.password"
        hint="Mínimo 8 caracteres, con letras y números. Si la persona ya tiene cuenta de GO Puntos, se usa su cuenta y esta contraseña se ignora."
      />
      <BaseButton type="submit" :loading="form.busy.value" loading-text="Creando">Crear usuario</BaseButton>
    </form>
  </div>
</template>
