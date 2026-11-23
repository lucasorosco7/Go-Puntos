/**
 * Datos de prueba de GO Puntos (sólo modo mock).
 *
 * Se dividen en:
 * 1. Catálogo fijo: negocios, niveles, recompensas, ofertas, desafíos,
 *    personas y personal de cada negocio.
 * 2. Historia simulada: ~5 meses de compras y canjes que se "reproducen"
 *    con las MISMAS reglas del servidor simulado (mocks/server.js). Así
 *    saldos, niveles, ranking, rachas y cierres mensuales siempre son
 *    coherentes entre sí.
 *
 * Las fechas son relativas a HOY para que la demo siempre tenga actividad
 * reciente. Las contraseñas en texto plano existen SÓLO porque es un mock:
 * el backend real guardará únicamente un hash.
 */
import { appConfig } from '../config/app.config.js';
import { BUSINESS_DEFAULTS } from '../config/catalogs.js';
import { dates as D } from '../utils/dates.js';
import { clone } from '../utils/helpers.js';
import { server as S } from './server.js';

const DAY = 86400000;

/** Generador pseudoaleatorio con semilla: los datos salen iguales en cada carga */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function buildSeed(now = new Date()) {
  const rand = rng(20260930);
  const pick = (arr) => arr[Math.floor(rand() * arr.length)];
  const between = (a, b) => a + rand() * (b - a);
  /** Fecha "hace N días" a una hora del horario comercial */
  const ago = (days, hour = 9 + Math.floor(rand() * 11), min = Math.floor(rand() * 60)) => {
    const d = new Date(now.getTime() - days * DAY);
    d.setHours(hour, min, 0, 0);
    return d;
  };
  const monthStart = D.periodStart(D.periodOf(now));
  const monthEnd = D.periodEnd(D.periodOf(now));
  const prevStart = D.periodStart(D.prevPeriod(D.periodOf(now)));
  const prevEnd = D.periodEnd(D.prevPeriod(D.periodOf(now)));
  const weekStart = D.weekStart(now);
  const friday = D.endOfDay(D.addDays(weekStart, 4));
  const iso = (d) => (d ? new Date(d).toISOString() : null);

  const defaults = BUSINESS_DEFAULTS;

  /* ===================== 1. Negocios ===================== */
  const businesses = [
    {
      id: 1, slug: 'cv-dietetica', codePrefix: 'CV', name: 'CV Dietética', logo: null, logoIcon: 'leaf',
      description: 'Almacén natural, productos a granel y alimentación saludable en el centro de Tucumán.',
      category: 'dietetica', address: 'Av. Mate de Luna 1850', city: 'San Miguel de Tucumán',
      phone: '381 555-0100', email: 'hola@cvdietetica.com',
      social: { instagram: '@cvdietetica', facebook: 'CV Dietética', whatsapp: '3815550100', website: '' },
      paletteId: 'bosque', paletteVariant: 'miel',
      pointsRule: { pesos: 100, points: 1, rounding: 'abajo', minPurchase: 0, welcomeBonus: 100, applyLevelMultiplier: true },
      ranking: { enabled: true, showTop: 5, showPosition: true },
      monthlyPrize: { enabled: true, type: 'puntos', points: 500, rewardId: null, description: '500 puntos extra para el #1 del mes' },
      challengesEnabled: true,
      streaks: { enabled: true, unit: 'semana', remindAtRisk: true },
      notifications: clone(defaults.notifications),
      redemptionValidityDays: 30,
      status: 'activo', onboarding: { completed: true, dismissed: true, steps: {} },
      currentPeriod: null, createdAt: iso(ago(150, 9, 0)),
    },
    {
      id: 2, slug: 'cafe-aroma', codePrefix: 'CA', name: 'Café Aroma', logo: null, logoIcon: 'coffee',
      description: 'Café de especialidad, medialunas de manteca y desayunos todo el día.',
      category: 'cafeteria', address: '25 de Mayo 480', city: 'San Miguel de Tucumán',
      phone: '381 555-0200', email: 'hola@cafearoma.com',
      social: { instagram: '@cafearoma.tuc', facebook: '', whatsapp: '3815550200', website: '' },
      paletteId: 'terracota', paletteVariant: 'mostaza',
      pointsRule: { pesos: 150, points: 1, rounding: 'normal', minPurchase: 1000, welcomeBonus: 50, applyLevelMultiplier: true },
      ranking: { enabled: true, showTop: 5, showPosition: true },
      monthlyPrize: { enabled: true, type: 'recompensa', points: 0, rewardId: 103, description: 'Desayuno completo para el #1' },
      challengesEnabled: true,
      streaks: { enabled: true, unit: 'semana', remindAtRisk: true },
      notifications: clone(defaults.notifications),
      redemptionValidityDays: 15,
      status: 'activo', onboarding: { completed: true, dismissed: true, steps: {} },
      currentPeriod: null, createdAt: iso(ago(100, 9, 0)),
    },
  ];
  businesses.forEach((b) => { b.currentPeriod = D.periodOf(b.createdAt); });

  /* ===================== 2. Niveles ===================== */
  const levels = [
    { id: 1, businessId: 1, order: 1, name: 'Bronce', minPoints: 0, multiplier: 1, icon: 'medal', color: 'bronce',
      description: 'El nivel con el que empezás.', benefits: ['1 punto por cada $100'] },
    { id: 2, businessId: 1, order: 2, name: 'Plata', minPoints: 1500, multiplier: 1.25, icon: 'award', color: 'plata',
      description: 'Para quienes compran seguido.', benefits: ['25% más de puntos por compra'] },
    { id: 3, businessId: 1, order: 3, name: 'Oro', minPoints: 4000, multiplier: 1.5, icon: 'crown', color: 'oro',
      description: 'Nuestros clientes más fieles.', benefits: ['50% más de puntos por compra', 'Canjes anticipados', 'Ofertas exclusivas'] },
    { id: 4, businessId: 2, order: 1, name: 'Grano', minPoints: 0, multiplier: 1, icon: 'sprout', color: 'bronce',
      description: 'Tu primer café con nosotros.', benefits: ['1 punto cada $150'] },
    { id: 5, businessId: 2, order: 2, name: 'Tostado', minPoints: 250, multiplier: 1.2, icon: 'coffee', color: 'acento',
      description: 'Ya sos habitué.', benefits: ['20% más de puntos'] },
    { id: 6, businessId: 2, order: 3, name: 'Barista', minPoints: 600, multiplier: 1.5, icon: 'crown', color: 'oro',
      description: 'Casi de la casa.', benefits: ['50% más de puntos', 'Medialuna de regalo los viernes'] },
  ];

  /* ===================== 3. Recompensas ===================== */
  const rw = (o) => ({ image: null, validFrom: null, validTo: null, status: 'activa', featured: false, stock: null, createdAt: iso(ago(140, 10, 0)), ...o });
  const rewards = [
    rw({ id: 1, businessId: 1, name: 'Descuento del 10%', category: 'descuentos', points: 500, featured: true,
      description: 'Un 10% menos en tu próxima compra en el local, sin monto mínimo.' }),
    rw({ id: 2, businessId: 1, name: 'Mix de frutos secos 250 g', category: 'snacks', points: 900, stock: 18, featured: true,
      description: 'Almendras, nueces, castañas de cajú y pasas de uva, fraccionado en el día.' }),
    rw({ id: 3, businessId: 1, name: 'Mantequilla de maní 380 g', category: 'almacen', points: 1500, stock: 12, featured: true,
      description: 'Cremosa, sin azúcar agregada, 100% maní tostado.' }),
    rw({ id: 4, businessId: 1, name: 'Granola artesanal 500 g', category: 'almacen', points: 1200, stock: 24,
      description: 'Avena, miel, coco y semillas de girasol horneadas en pequeñas tandas.' }),
    rw({ id: 5, businessId: 1, name: 'Té verde en hebras 100 g', category: 'bebidas', points: 700, stock: 0,
      description: 'Sencha de hoja entera, suave y fresco.' }),
    rw({ id: 6, businessId: 1, name: 'Yerba orgánica 1 kg', category: 'bebidas', points: 2200, stock: 8, featured: true,
      description: 'Yerba mate con palo, estacionada naturalmente, certificada orgánica.' }),
    rw({ id: 7, businessId: 1, name: 'Aceite de coco 500 ml', category: 'almacen', points: 2600, stock: 6,
      description: 'Neutro, prensado en frío. Ideal para cocinar a altas temperaturas.' }),
    rw({ id: 8, businessId: 1, name: 'Barritas de cereal x6', category: 'snacks', points: 600, stock: 40,
      description: 'Avena y chips de chocolate amargo, sin conservantes.' }),
    rw({ id: 9, businessId: 1, name: 'Taller de cocina saludable', category: 'experiencias', points: 3500, stock: 10, status: 'pausada',
      description: 'Un sábado a la mañana en el local, con degustación incluida.' }),
    rw({ id: 10, businessId: 1, name: 'Kit matero de invierno', category: 'bebidas', points: 3000, stock: 0, status: 'finalizada',
      validTo: iso(ago(40, 23, 59)), description: 'Edición limitada del invierno.' }),
    rw({ id: 101, businessId: 2, name: 'Café chico', category: 'cafe', points: 120, featured: true, createdAt: iso(ago(95, 10, 0)),
      description: 'Espresso, cortado o americano.' }),
    rw({ id: 102, businessId: 2, name: '3 medialunas de manteca', category: 'panaderia', points: 160, featured: true, createdAt: iso(ago(95, 10, 0)),
      description: 'Recién horneadas.' }),
    rw({ id: 103, businessId: 2, name: 'Desayuno completo', category: 'cafe', points: 420, createdAt: iso(ago(95, 10, 0)),
      description: 'Café con leche, jugo de naranja y tostado.' }),
    rw({ id: 104, businessId: 2, name: '15% en tu próxima cuenta', category: 'descuentos', points: 250, createdAt: iso(ago(95, 10, 0)),
      description: 'Válido para consumir en el salón.' }),
  ];

  /* ===================== 4. Ofertas ===================== */
  const of = (o) => ({ image: null, featured: false, levelIds: [], conditions: '', schedule: '', value: null, autoApply: false,
    minAmount: 0, createdAt: iso(ago(120, 10, 0)), startDate: null, endDate: null, ...o });
  const offers = [
    of({ id: 1, businessId: 1, featured: true, category: 'almacen', type: 'puntos_dobles', value: 2, autoApply: true, status: 'activa',
      title: 'Puntos dobles en productos a granel', description: 'Cada compra a granel suma el doble de puntos.',
      startDate: iso(D.startOfDay(ago(2))), endDate: iso(D.endOfDay(ago(-4))), createdAt: iso(ago(3, 10, 0)) }),
    of({ id: 2, businessId: 1, category: 'snacks', type: 'porcentaje', value: 20, status: 'activa',
      title: 'Miércoles de frutos secos', description: '20% menos en frutos secos a granel.', schedule: 'Todos los miércoles',
      startDate: iso(ago(60, 0, 0)) }),
    of({ id: 3, businessId: 1, category: 'bebidas', type: 'puntos_extra', value: 100, status: 'activa',
      title: 'Combo yerba orgánica', description: 'Llevando 2 sumás 100 puntos extra.', conditions: 'Llevando 2 paquetes de 1 kg.',
      endDate: iso(D.endOfDay(ago(-7))), createdAt: iso(ago(9, 10, 0)), startDate: iso(ago(9, 0, 0)) }),
    of({ id: 4, businessId: 1, category: 'almacen', type: 'temporal', status: 'pausada',
      title: 'Granola recién horneada', description: 'Nueva receta con almendras y miel.', schedule: 'Desde el lunes' }),
    of({ id: 5, businessId: 1, category: 'almacen', type: 'porcentaje', value: 15, status: 'activa',
      title: 'Aceite de coco 1 L', description: 'Precio especial para socios de GO Puntos.', schedule: 'Hasta agotar stock',
      startDate: iso(ago(20, 0, 0)) }),
    of({ id: 6, businessId: 1, category: 'general', type: 'exclusivo_nivel', status: 'activa', levelIds: [3],
      title: 'Reserva anticipada para nivel Oro', description: 'Separá tus productos por WhatsApp y retiralos sin hacer fila.',
      startDate: iso(ago(30, 0, 0)) }),
    of({ id: 7, businessId: 1, category: 'almacen', type: 'puntos_dobles', value: 2, autoApply: true, status: 'activa',
      title: 'Semana del granel', description: 'Puntos dobles en toda la tienda.',
      startDate: iso(D.startOfDay(ago(47))), endDate: iso(D.endOfDay(ago(43))), createdAt: iso(ago(50, 10, 0)) }),
    of({ id: 8, businessId: 1, category: 'almacen', type: 'puntos_dobles', value: 2, autoApply: true, status: 'activa',
      title: 'Mitad de mes x2', description: 'Puntos dobles de mitad de mes.',
      startDate: iso(D.startOfDay(ago(16))), endDate: iso(D.endOfDay(ago(13))), createdAt: iso(ago(18, 10, 0)) }),
    of({ id: 9, businessId: 1, category: 'general', type: 'porcentaje', value: 10, status: 'borrador',
      title: 'Día de la primavera', description: '10% en toda la tienda para socios.', schedule: 'Sólo el 21 de septiembre' }),
    of({ id: 101, businessId: 2, featured: true, category: 'cafe', type: 'porcentaje', value: 20, status: 'activa',
      title: 'Café + medialuna', description: '20% menos en el combo antes de las 10.', schedule: 'Lunes a viernes, hasta las 10 h',
      startDate: iso(ago(40, 0, 0)) }),
    of({ id: 102, businessId: 2, category: 'cafe', type: 'puntos_dobles', value: 2, autoApply: true, status: 'activa',
      title: 'Semana del espresso', description: 'Todos los cafés suman el doble.',
      startDate: iso(D.startOfDay(ago(3))), endDate: iso(D.endOfDay(ago(-3))), createdAt: iso(ago(4, 10, 0)) }),
  ];

  /* ===================== 5. Desafíos ===================== */
  const ch = (o) => ({ status: 'activo', rewardText: '', createdAt: iso(ago(140, 10, 0)), ...o });
  const challenges = [
    ch({ id: 1, businessId: 1, name: 'Tres compras este mes', description: 'Realizá 3 compras durante el mes.', type: 'compras', goal: 3,
      rewardPoints: 150, startDate: iso(monthStart), endDate: iso(monthEnd), createdAt: iso(monthStart) }),
    ch({ id: 2, businessId: 1, name: 'Tres semanas seguidas', description: 'Comprá durante 3 semanas consecutivas.', type: 'semanas', goal: 3,
      rewardPoints: 200, startDate: iso(monthStart), endDate: iso(monthEnd), createdAt: iso(monthStart) }),
    ch({ id: 3, businessId: 1, name: 'Conseguí 1.000 puntos', description: 'Sumá 1.000 puntos en el mes.', type: 'puntos', goal: 1000,
      rewardPoints: 100, startDate: iso(monthStart), endDate: iso(monthEnd), createdAt: iso(monthStart) }),
    ch({ id: 4, businessId: 1, name: 'Tu primer canje', description: 'Canjeá tu primera recompensa.', type: 'primer_canje', goal: 1,
      rewardPoints: 50, startDate: businesses[0].createdAt, endDate: iso(ago(-60, 23, 59)) }),
    ch({ id: 5, businessId: 1, name: 'Compra antes del viernes', description: 'Hacé una compra antes del viernes y sumá puntos extra.', type: 'compra_antes', goal: 1,
      rewardPoints: 30, startDate: iso(weekStart), endDate: iso(friday), createdAt: iso(weekStart) }),
    ch({ id: 6, businessId: 1, name: 'Mes activo', description: 'Realizá 4 compras durante el mes pasado.', type: 'compras', goal: 4,
      rewardPoints: 200, startDate: iso(prevStart), endDate: iso(prevEnd), createdAt: iso(prevStart) }),
    ch({ id: 101, businessId: 2, name: 'Tres cafés este mes', description: 'Visitanos 3 días distintos este mes.', type: 'visitas', goal: 3,
      rewardPoints: 40, startDate: iso(monthStart), endDate: iso(monthEnd), createdAt: iso(monthStart) }),
  ];

  /* ===================== 6. Personas y roles =====================
     users = identidad global (sin rol). Los roles administrativos viven en
     businessStaff y la relación cliente-negocio en memberships.
     Lucas (id 2) muestra el modelo: es empleado de CV Dietética y, con la
     MISMA cuenta, cliente de Café Aroma. */
  const users = [
    { id: 1, firstName: 'Equipo', lastName: 'CV Dietética', email: 'admin@cvdietetica.com',
      password: 'admin1234', phone: '381 555-0100', createdAt: businesses[0].createdAt, active: true },
    { id: 2, firstName: 'Lucas', lastName: 'Díaz', email: 'caja@cvdietetica.com',
      password: 'caja1234', phone: '381 555-0111', createdAt: iso(ago(140, 10, 0)), active: true },
    { id: 3, firstName: 'Diego', lastName: 'Ferreyra', email: 'admin@cafearoma.com',
      password: 'admin1234', phone: '381 555-0200', createdAt: businesses[1].createdAt, active: true },
    { id: 4, firstName: 'Sofía', lastName: 'Paz', email: 'nuevo@demo.com',
      password: 'demo1234', phone: '381 555-0300', createdAt: iso(ago(1, 10, 0)), active: true },
    { id: 124, firstName: 'Martina', lastName: 'López', email: 'martina@demo.com', password: 'demo1234',
      phone: '381 555-0142', createdAt: iso(ago(120, 10, 0)), active: true },
  ];

  const NAMES = [
    ['Juan', 'Pérez'], ['Sofía', 'Gómez'], ['Lucas', 'Martínez'], ['Pedro', 'Sánchez'], ['Valentina', 'Romero'],
    ['Mateo', 'Díaz'], ['Camila', 'Fernández'], ['Tomás', 'Álvarez'], ['Lucía', 'Torres'], ['Benjamín', 'Ruiz'],
    ['Julieta', 'Castro'], ['Santiago', 'Molina'], ['Agustina', 'Herrera'], ['Joaquín', 'Medina'], ['Florencia', 'Suárez'],
    ['Nicolás', 'Aguirre'], ['Martina', 'Giménez'], ['Franco', 'Rojas'], ['Paula', 'Benítez'], ['Ignacio', 'Acosta'],
    ['Carolina', 'Vega'], ['Facundo', 'Ríos'], ['Micaela', 'Luna'], ['Gonzalo', 'Paz'], ['Rocío', 'Sosa'],
    ['Emilia', 'Navarro'], ['Bruno', 'Ledesma'], ['Abril', 'Ibáñez'], ['Thiago', 'Correa'], ['Milagros', 'Quiroga'],
  ];
  // Perfil de compra de cada cliente generado
  const PROFILES = {
    vip: { every: [2, 5], amount: [25000, 70000] },
    frecuente: { every: [4, 9], amount: [9000, 28000] },
    regular: { every: [9, 18], amount: [6000, 22000] },
    en_riesgo: { every: [8, 16], amount: [6000, 18000], stopDaysAgo: [35, 55] },
    inactivo: { every: [10, 20], amount: [5000, 15000], stopDaysAgo: [70, 110] },
    nuevo: { every: [4, 8], amount: [5000, 16000], joinDaysAgo: [4, 22] },
  };
  const cvProfiles = ['vip', 'vip', 'vip', 'frecuente', 'frecuente', 'frecuente', 'frecuente', 'frecuente',
    'regular', 'regular', 'regular', 'regular', 'regular', 'regular', 'regular', 'regular',
    'en_riesgo', 'en_riesgo', 'en_riesgo', 'inactivo', 'inactivo', 'inactivo', 'nuevo', 'nuevo', 'nuevo', 'nuevo'];
  const clients = NAMES.map(([firstName, lastName], i) => {
    const id = 200 + i;
    const slug = `${firstName}.${lastName}`.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    return { id, firstName, lastName, email: `${slug}@correo.com`, password: 'demo1234',
      phone: `381 ${String(4000000 + i * 7919).slice(0, 3)}-${String(1000 + i * 37).slice(-4)}`, createdAt: null, active: true };
  });
  users.push(...clients);

  /* ===================== 7. Estado inicial y eventos ===================== */
  const state = {
    version: appConfig.mockDataVersion, seededAt: now.toISOString(),
    businesses, users, levels, rewards, offers, challenges,
    businessStaff: [
      { id: 1, businessId: 1, userId: 1, role: 'owner', active: true, createdAt: businesses[0].createdAt },
      { id: 2, businessId: 1, userId: 2, role: 'empleado', active: true, createdAt: iso(ago(140, 10, 0)) },
      { id: 3, businessId: 2, userId: 3, role: 'owner', active: true, createdAt: businesses[1].createdAt },
    ],
    memberships: [], movements: [], redemptions: [], challengeCompletions: [],
    notifications: [], campaigns: [], periodCloses: [],
  };

  const events = [];
  const add = (date, fn, order = 0) => events.push({ t: new Date(date).getTime() + order, fn });
  const join = (userId, businessId, date) => add(date, () => S.joinBusiness(state, { userId, businessId, date }), -1);
  const mem = (userId, businessId) => S.membershipOf(state, userId, businessId);
  const autoOffers = (m, date) => S.pointOffersFor(state, m, date).filter((o) => o.autoApply).map((o) => o.id);
  const buy = (userId, businessId, date, amount, staff) => add(date, () => {
    const m = mem(userId, businessId);
    S.registerPurchase(state, { businessId, membershipId: m.id, amount, offerIds: autoOffers(m, date), staffUserId: staff, date });
  });
  const redeem = (userId, businessId, date, rewardId) => add(date, () => {
    const m = mem(userId, businessId);
    try { S.redeem(state, { membershipId: m.id, rewardId, date }); } catch { /* sin saldo o stock: se omite */ }
  });

  // --- Martina en CV Dietética (su historia original, en días relativos) ---
  join(124, 1, ago(120, 10, 5));
  [[108, 12600], [93, 9800], [84, 21300], [65, 15500], [56, 31200], [45, 18900], [37, 14700], [31, 11000],
    [27, 11000], [22, 14000], [18, 38500], [15, 22800], [8, 41200]]
    .forEach(([d, amount]) => buy(124, 1, ago(d), amount, pick([1, 2])));
  redeem(124, 1, ago(72, 12, 30), 1);
  redeem(124, 1, ago(6, 18, 10), 2);

  // --- Martina en Café Aroma: la misma cuenta en otro negocio ---
  join(124, 2, ago(40, 8, 30));
  [[35, 4500], [20, 6200], [12, 3800], [5, 7400]].forEach(([d, amount]) => buy(124, 2, ago(d, 8 + Math.floor(rand() * 3)), amount, 3));

  // --- Lucas (empleado de CV) es cliente de Café Aroma con la misma cuenta ---
  join(2, 2, ago(30, 8, 15));
  [[26, 3200], [14, 4100], [4, 2900]].forEach(([d, amount]) => buy(2, 2, ago(d, 8), amount, 3));

  // --- Clientes generados de CV Dietética ---
  const rewardIdsCv = [1, 2, 3, 4, 6, 8];
  clients.slice(0, cvProfiles.length).forEach((u, i) => {
    const p = PROFILES[cvProfiles[i]];
    const joinDays = p.joinDaysAgo ? between(...p.joinDaysAgo) : between(60, 148);
    u.createdAt = iso(ago(joinDays, 10, 0));
    join(u.id, 1, ago(joinDays, 10, 0));
    const stop = p.stopDaysAgo ? between(...p.stopDaysAgo) : 0;
    for (let d = joinDays - 1 - between(0, 2); d > stop; d -= between(...p.every)) {
      buy(u.id, 1, ago(d), Math.round(between(...p.amount) / 100) * 100, pick([1, 2, 2]));
      if (rand() < 0.16) redeem(u.id, 1, ago(Math.max(0.1, d - 0.05)), pick(rewardIdsCv));
    }
  });

  // --- Clientes de Café Aroma (algunos también son de CV: una sola cuenta) ---
  const cafeClients = [...clients.slice(22, 30), clients[0], clients[3], clients[8]];
  cafeClients.forEach((u, i) => {
    const joinDays = between(10, 95);
    if (!u.createdAt) u.createdAt = iso(ago(joinDays, 10, 0));
    join(u.id, 2, ago(joinDays, 8, 0));
    const every = i < 3 ? [2, 5] : [5, 14];
    for (let d = joinDays - 1; d > 0.5; d -= between(...every)) {
      buy(u.id, 2, ago(d, 8 + Math.floor(rand() * 4)), Math.round(between(2500, 9000) / 100) * 100, 3);
      if (rand() < 0.12) redeem(u.id, 2, ago(Math.max(0.1, d - 0.05)), pick([101, 102, 104]));
    }
  });

  // --- Publicaciones y campañas (generan notificaciones) ---
  add(ago(3, 10, 0), () => S.announceOffer(state, state.offers.find((o) => o.id === 1), ago(2, 9, 0)));
  add(ago(9, 10, 0), () => S.announceOffer(state, state.offers.find((o) => o.id === 3), ago(9, 10, 0)));
  add(ago(4, 10, 0), () => S.announceOffer(state, state.offers.find((o) => o.id === 102), ago(3, 9, 0)));
  add(ago(25, 11, 0), () => S.sendCampaign(state, {
    businessId: 1, title: 'Te extrañamos 💚', message: 'Volvé esta semana y sumá 200 puntos extra en tu próxima compra.',
    audience: { type: 'inactivos' }, createdBy: 1, date: ago(25, 11, 0),
  }));
  add(ago(12, 17, 0), () => S.sendCampaign(state, {
    businessId: 1, title: '20% OFF este fin de semana para clientes Oro', message: 'Sábado y domingo, 20% en toda la tienda para el nivel Oro.',
    audience: { type: 'nivel', value: 3 }, createdBy: 1, date: ago(12, 17, 0),
  }));
  add(ago(5, 9, 30), () => S.sendCampaign(state, {
    businessId: 1, title: 'Llegó la granola nueva', message: 'Con almendras y miel. Probala en el local: te regalamos una muestra.',
    audience: { type: 'todos' }, createdBy: 1, date: ago(5, 9, 30),
  }));

  /* ===================== 8. Reproducir la historia ===================== */
  events.sort((a, b) => a.t - b.t);
  const closeUntil = (period, when) => {
    state.businesses.forEach((b) => {
      while (b.status === 'activo' && b.currentPeriod < period) {
        const at = new Date(D.periodStart(D.nextPeriod(b.currentPeriod)).getTime() + 5 * 60000);
        S.closePeriod(state, { businessId: b.id, date: at < when ? at : when, closedBy: null });
      }
    });
  };
  events.forEach((e) => { closeUntil(D.periodOf(e.t), new Date(e.t)); e.fn(); });
  closeUntil(D.periodOf(now), now);

  // Canjes viejos: la mayoría ya se entregaron en el local
  state.redemptions.forEach((r) => {
    const age = D.daysBetween(r.createdAt, now);
    const keepForDemo = r.userId === 124 && age < 10; // el canje reciente de Martina queda para retirar
    if (r.status === 'pendiente' && age > 2 && !keepForDemo && rand() < 0.85) {
      const staff = pick([users[0], users[1]]);
      const businessStaff = r.businessId === 2 ? users[2] : staff;
      Object.assign(r, {
        status: 'entregado', validatedAt: iso(new Date(new Date(r.createdAt).getTime() + between(0.1, 1.5) * DAY)),
        validatedBy: businessStaff.id, validatedByName: `${businessStaff.firstName} ${businessStaff.lastName}`,
      });
    }
  });
  S.expireRedemptions(state, now);

  // Notificaciones viejas: ya leídas y sin pop-up
  state.notifications.forEach((n) => {
    const age = (now - new Date(n.createdAt)) / DAY;
    if (age > 4) n.read = true;
    if (age > 1.5) n.popupShown = true;
  });

  // Para la demo: el último cambio de nivel de Martina se muestra como pop-up al entrar
  const lastLevelUp = state.notifications.filter((n) => n.userId === 124 && n.businessId === 1 && n.type === 'nivel').pop();
  if (lastLevelUp) Object.assign(lastLevelUp, { read: false, popupShown: false });

  // Negocio nuevo para probar el onboarding (se crea al final: no tiene historia).
  // createBusiness registra a Sofía (id 4) como dueña en businessStaff.
  S.createBusiness(state, { adminUserId: 4, name: '', category: 'otro', date: ago(1, 10, 0) });

  return state;
}
