/* =========================================================
   Datos de prueba. Imitan las tablas del modelo E/R de MySQL:
   usuarios, recompensas, transacciones de puntos y avisos.
   Las contraseñas en texto plano existen SÓLO porque es un mock.
   ========================================================= */
GO.seed = {
  users: [
    {
      id: 124, role: 'cliente', firstName: 'Martina', lastName: 'López',
      email: 'martina@demo.com', password: 'demo1234', phone: '381 555-0142',
      memberSince: '2026-06-02', memberCode: 'GO-000124',
      balance: 1240,        // saldo disponible para canjear
      lifetimePoints: 1740, // puntos acumulados en total (define el nivel)
    },
    {
      id: 1, role: 'admin', firstName: 'Equipo', lastName: 'CV Dietética',
      email: 'admin@cvdietetica.com', password: 'admin1234', phone: '381 555-0100',
      memberSince: '2026-05-01', memberCode: 'ADM-001', balance: 0, lifetimePoints: 0,
    },
  ],

  categories: {
    descuentos: 'Descuentos',
    almacen: 'Almacén natural',
    snacks: 'Snacks',
    bebidas: 'Infusiones',
  },

  rewards: [
    { id: 1, name: 'Descuento del 10%', category: 'descuentos', points: 500, stock: 999, featured: true,
      description: 'Un 10% menos en tu próxima compra en el local, sin monto mínimo.' },
    { id: 2, name: 'Mix de frutos secos 250 g', category: 'snacks', points: 900, stock: 14, featured: true,
      description: 'Almendras, nueces, castañas de cajú y pasas de uva, fraccionado en el día.' },
    { id: 3, name: 'Mantequilla de maní 380 g', category: 'almacen', points: 1500, stock: 8, featured: true,
      description: 'Cremosa, sin azúcar agregada, 100% maní tostado.' },
    { id: 4, name: 'Granola artesanal 500 g', category: 'almacen', points: 1200, stock: 20, featured: false,
      description: 'Avena, miel, coco y semillas de girasol horneadas en pequeñas tandas.' },
    { id: 5, name: 'Té verde en hebras 100 g', category: 'bebidas', points: 700, stock: 0, featured: false,
      description: 'Sencha de hoja entera, suave y fresco.' },
    { id: 6, name: 'Yerba orgánica 1 kg', category: 'bebidas', points: 2200, stock: 6, featured: true,
      description: 'Yerba mate con palo, estacionada naturalmente, certificada orgánica.' },
    { id: 7, name: 'Aceite de coco 500 ml', category: 'almacen', points: 2600, stock: 5, featured: false,
      description: 'Neutro, prensado en frío. Ideal para cocinar a altas temperaturas.' },
    { id: 8, name: 'Barritas de cereal x6', category: 'snacks', points: 600, stock: 30, featured: false,
      description: 'Avena y chips de chocolate amargo, sin conservantes.' },
  ],

  // Tipos: compra | canje | bonificacion | vencimiento. "amount" = importe en pesos.
  movements: [
    { id: 1,  userId: 124, date: '2026-06-02T10:12:00', type: 'bonificacion', concept: 'Bono de bienvenida', points: 100, balanceAfter: 100 },
    { id: 2,  userId: 124, date: '2026-06-14T18:40:00', type: 'compra', concept: 'Compra en el local', amount: 12600, points: 126, balanceAfter: 226 },
    { id: 3,  userId: 124, date: '2026-06-29T11:05:00', type: 'compra', concept: 'Compra en el local', amount: 9800,  points: 98,  balanceAfter: 324 },
    { id: 4,  userId: 124, date: '2026-07-08T17:22:00', type: 'compra', concept: 'Compra en el local', amount: 21300, points: 213, balanceAfter: 537 },
    { id: 5,  userId: 124, date: '2026-07-20T12:30:00', type: 'canje',  concept: 'Canje: Descuento del 10%', points: -500, balanceAfter: 37 },
    { id: 6,  userId: 124, date: '2026-07-27T19:10:00', type: 'compra', concept: 'Compra en el local', amount: 15500, points: 155, balanceAfter: 192 },
    { id: 7,  userId: 124, date: '2026-08-05T10:48:00', type: 'compra', concept: 'Compra en el local', amount: 31200, points: 312, balanceAfter: 504 },
    { id: 8,  userId: 124, date: '2026-08-16T09:00:00', type: 'bonificacion', concept: 'Semana del granel: puntos dobles', points: 150, balanceAfter: 654 },
    { id: 9,  userId: 124, date: '2026-08-24T18:15:00', type: 'compra', concept: 'Compra en el local', amount: 18900, points: 189, balanceAfter: 843 },
    { id: 10, userId: 124, date: '2026-08-30T11:37:00', type: 'compra', concept: 'Compra en el local', amount: 14700, points: 147, balanceAfter: 990 },
    { id: 11, userId: 124, date: '2026-09-03T17:02:00', type: 'compra', concept: 'Compra en el local', amount: 11000, points: 110, balanceAfter: 1100 },
    { id: 12, userId: 124, date: '2026-09-08T12:20:00', type: 'compra', concept: 'Compra en el local', amount: 14000, points: 140, balanceAfter: 1240 },
  ],

  // Ofertas y promociones del negocio.
  // status permite controlar si una oferta está activa o pausada.
  offers: [
    { id: 1, featured: true, category: 'almacen', tag: 'Suma x2', tone: 'honey', status: 'activa',
      title: 'Puntos dobles en productos a granel',
      description: 'Cada compra a granel suma el doble de puntos.',
      when: 'Del 15 al 20 de septiembre' },

    { id: 2, category: 'snacks', tag: '20% off', tone: 'honey', status: 'activa',
      title: 'Miércoles de frutos secos',
      description: '20% menos en frutos secos a granel.',
      when: 'Todos los miércoles' },

    { id: 3, category: 'bebidas', tag: '+100 pts', tone: 'green', status: 'activa',
      title: 'Combo yerba orgánica',
      description: 'Llevando 2 sumás 100 puntos extra.',
      when: 'Hasta el 30 de septiembre' },

    { id: 4, category: 'almacen', tag: 'Nuevo', tone: 'sky', status: 'pausada',
      title: 'Granola recién horneada',
      description: 'Nueva receta con almendras y miel.',
      when: 'Desde el lunes' },

    { id: 5, category: 'almacen', tag: '15% off', tone: 'honey', status: 'activa',
      title: 'Aceite de coco 1 L',
      description: 'Precio especial para socios de GO Puntos.',
      when: 'Hasta agotar stock' },
  ],

  notifications: [
    { id: 1, userId: 124, tone: 'accent', title: 'Puntos dobles en productos a granel',
      body: 'Del 15 al 20 de septiembre, cada compra a granel suma el doble.', date: '2026-09-09T09:00:00' },
    { id: 2, userId: 124, tone: 'info', title: 'Tus puntos no vencen mientras compres',
      body: 'Si pasan 90 días sin compras, el saldo vence. Tu última compra fue el 8 de septiembre.', date: '2026-09-08T12:20:00' },
  ],
};
