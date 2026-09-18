/* =========================================================
   GO Puntos — Configuración general
   Todos los scripts comparten un único objeto global: window.GO.
   Así evitamos variables sueltas que choquen entre archivos.
   ========================================================= */
window.GO = window.GO || {};

GO.config = {
  // true  = datos de prueba guardados en el navegador (etapa actual)
  // false = llamadas reales a la API REST de Flask
  useMocks: true,
  apiUrl: 'http://localhost:5000/api',

  // Reglas del programa (mañana las definirá el backend)
  PESOS_PER_POINT: 200,
  TIERS: [
    { id: 'bronce', name: 'Bronce', minPoints: 0,    multiplier: 1,    color: '#a8743f' },
    { id: 'plata',  name: 'Plata',  minPoints: 1500, multiplier: 1.25, color: '#9aa7a0' },
    { id: 'oro',    name: 'Oro',    minPoints: 4000, multiplier: 1.5,  color: '#c48a1a' },
  ],
};

// Todas las URLs en un solo lugar
GO.paths = {
  home: 'index.html',
  login: 'login.html',
  register: 'registro.html',
  forgot: 'recuperar.html',
  client: {
    home: 'puntos.html',       // pestaña 1: Mis puntos
    rewards: 'recompensas.html', // pestaña 2: Recompensas
    offers: 'ofertas.html',      // pestaña 3: Ofertas
    qr: 'codigo.html',           // pantalla del código QR
    history: 'movimientos.html',
    profile: 'perfil.html',
  },
  admin: {
    home: 'admin.html',
    purchase: 'admin-compras.html',
    customers: 'admin-clientes.html',
    rewards: 'admin-recompensas.html',
  },
};

// Navegación por rol. Los iconos son nombres de Lucide.
// El cliente sólo tiene TRES secciones: cuanto menos tenga que
// decidir en el celular, mejor. El perfil se abre desde el avatar
// y los movimientos desde la pantalla de puntos.
GO.nav = {
  client: [
    { href: GO.paths.client.home,    label: 'Mis puntos',  icon: 'leaf' },
    { href: GO.paths.client.rewards, label: 'Recompensas', icon: 'gift' },
    { href: GO.paths.client.offers,  label: 'Ofertas',     icon: 'tag' },
  ],
  admin: [
    { href: GO.paths.admin.home,      label: 'Métricas',         icon: 'chart-column' },
    { href: GO.paths.admin.purchase,  label: 'Registrar compra', icon: 'scan-line' },
    { href: GO.paths.admin.customers, label: 'Clientes',         icon: 'users' },
    { href: GO.paths.admin.rewards,   label: 'Recompensas',      icon: 'package' },
  ],
};
