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

  // =======================================================
  // NEGOCIO ACTIVO
  // Esta información será configurable desde el panel
  // administrativo cuando exista el backend.
  // =======================================================
  business: {
    id: 'negocio-demo',
    name: 'CV Dietética',
    logo: 'assets/img/logo.png',
    description: 'Programa de beneficios y puntos',

    theme: {
      primary: '#285943',
      secondary: '#8fae9b',
      accent: '#d6a84f',
      background: '#f7f4ed',
      text: '#24332a',
    },
  },

  // Reglas del programa
  PESOS_PER_POINT: 100,

  TIERS: [
    {
      id: 'bronce',
      name: 'Bronce',
      minPoints: 0,
      multiplier: 1,
      color: '#a8743f',
    },
    {
      id: 'plata',
      name: 'Plata',
      minPoints: 1500,
      multiplier: 1.25,
      color: '#9aa7a0',
    },
    {
      id: 'oro',
      name: 'Oro',
      minPoints: 4000,
      multiplier: 1.5,
      color: '#c48a1a',
    },
  ],
};

// Todas las URLs en un solo lugar
GO.paths = {
  home: 'index.html',
  login: 'login.html',
  register: 'registro.html',
  forgot: 'recuperar.html',

  client: {
    home: 'puntos.html',
    rewards: 'recompensas.html',
    offers: 'ofertas.html',
    qr: 'codigo.html',
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

// Navegación por rol
GO.nav = {
  client: [
    {
      href: GO.paths.client.home,
      label: 'Mis puntos',
      icon: 'leaf',
    },
    {
      href: GO.paths.client.rewards,
      label: 'Recompensas',
      icon: 'gift',
    },
    {
      href: GO.paths.client.offers,
      label: 'Ofertas',
      icon: 'tag',
    },
  ],

  admin: [
    {
      href: GO.paths.admin.home,
      label: 'Métricas',
      icon: 'chart-column',
    },
    {
      href: GO.paths.admin.purchase,
      label: 'Registrar compra',
      icon: 'scan-line',
    },
    {
      href: GO.paths.admin.customers,
      label: 'Clientes',
      icon: 'users',
    },
    {
      href: GO.paths.admin.rewards,
      label: 'Recompensas',
      icon: 'package',
    },
  ],
};

// Obtener la configuración del negocio activo
GO.getBusiness = function () {
  return GO.config.business;
};