/**
 * Punto de entrada de GO Puntos (Vue 3 + Vue Router + Pinia).
 *
 * Arma la aplicación, registra Pinia y el router, carga los estilos
 * globales y la monta en #app. Si otra pestaña cierra o cambia la sesión,
 * esta pestaña se entera (evento "storage") y vuelve a validar la ruta.
 */
import { createPinia } from 'pinia';
import { createApp } from 'vue';
import App from './App.vue';
import './assets/styles/index.css';
import { router } from './router/index.js';
import { useAuthStore } from './stores/auth.js';

const app = createApp(App);
app.use(createPinia());
app.use(router);

// Sesión compartida entre pestañas: si cambia en otra, se relee y se revalida la ruta actual
window.addEventListener('storage', async (e) => {
  if (e.key !== 'gopuntos:sesion') return;
  const auth = useAuthStore();
  if (!e.newValue) {
    // Se cerró la sesión en otra pestaña: primero se va al ingreso y después se borran los datos
    auth.leaving = true;
    await router.replace({ name: 'login' }).catch(() => {});
    auth.reload();
    auth.leaving = false;
    return;
  }
  auth.reload();
  router.replace(router.currentRoute.value.fullPath).catch(() => {});
});

router.isReady().then(() => app.mount('#app'));
app.config.errorHandler = (err) => {
  // Errores no controlados: se registran para depurar (la interfaz muestra sus propios mensajes)
  console.error('[GO Puntos]', err);
};
