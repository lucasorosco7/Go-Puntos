/**
 * Handlers simulados del negocio: datos públicos, configuración, niveles,
 * configuración inicial (onboarding), activación y personal del negocio.
 *
 * Equivalen a: GET /businesses/:slug/public, GET|PATCH /business, PUT /business/levels,
 * PATCH /business/onboarding, POST /business/activate y /business/employees.
 */
import { challenges as Challenges } from '../../domain/challenges.js';
import { levels as Levels } from '../../domain/levels.js';
import { offers as Offers } from '../../domain/offers.js';
import { rewards as Rewards } from '../../domain/rewards.js';
import { periodOf } from '../../utils/dates.js';
import { admin, publicUser, staff } from './common.js';

/** Campos que el dueño o administrador puede modificar. */
const EDITABLE = ['name', 'description', 'category', 'address', 'city', 'phone', 'email', 'social', 'logo', 'logoIcon',
  'paletteId', 'paletteVariant', 'pointsRule', 'ranking', 'monthlyPrize', 'challengesEnabled', 'streaks',
  'notifications', 'redemptionValidityDays'];

/** Negocio con sus niveles, recompensas y contadores (para el panel). */
function withExtras(s, S, b) {
  return {
    business: b,
    levels: S.levelsOf(s, b.id),
    rewards: s.rewards.filter((r) => r.businessId === b.id),
    counts: {
      customers: s.memberships.filter((m) => m.businessId === b.id).length,
      rewards: s.rewards.filter((r) => r.businessId === b.id && r.status === 'activa').length,
      offers: s.offers.filter((o) => o.businessId === b.id && Offers.isLive(o)).length,
      challenges: s.challenges.filter((c) => c.businessId === b.id && Challenges.isLive(c)).length,
      employees: s.businessStaff.filter((x) => x.businessId === b.id && x.role === 'empleado' && x.active).length,
    },
  };
}

const employeeView = (S, s, row) => ({ ...publicUser(S.user(s, row.userId)), active: row.active, staffRole: row.role, staffId: row.id });

export const businessesApi = {
  /** Página pública del QR del negocio (no requiere sesión). */
  getPublic: (slug) => (s, S, ctx) => {
    const b = S.businessBySlug(s, slug);
    if (!b) throw new S.ServerError('No encontramos ese negocio. Revisá el código QR.', 404);
    return {
      business: b, levels: S.levelsOf(s, b.id),
      rewards: s.rewards.filter((r) => r.businessId === b.id && Rewards.isVisible(r)).slice(0, 4),
      isMember: Boolean(ctx.userId && S.membershipOf(s, ctx.userId, b.id)),
    };
  },

  /** Catálogo público (landing): recompensas visibles del negocio. */
  publicRewards: (slug) => (s, S) => {
    const b = S.businessBySlug(s, slug);
    return b ? s.rewards.filter((r) => r.businessId === b.id && Rewards.isVisible(r)) : [];
  },

  /** Negocio del panel activo (dueño, administrador o empleado). */
  mine: () => (s, S, ctx) => withExtras(s, S, staff(s, S, ctx).business),

  update: (partial) => (s, S, ctx) => {
    const { business: b } = admin(s, S, ctx);
    const clean = Object.fromEntries(Object.entries(partial).filter(([k]) => EDITABLE.includes(k)));
    if ('name' in clean && !String(clean.name).trim()) throw new S.ServerError('El negocio necesita un nombre.', 422, { field: 'name' });
    if (clean.pointsRule && (!(clean.pointsRule.pesos > 0) || !(clean.pointsRule.points > 0))) {
      throw new S.ServerError('La equivalencia necesita pesos y puntos mayores a cero.', 422, { field: 'pesos' });
    }
    Object.assign(b, clean);
    // Mientras no tenga clientes, el nombre define la dirección pública (QR) y el prefijo de los códigos
    if (clean.name && !s.memberships.some((m) => m.businessId === b.id)) {
      b.slug = S.uniqueSlug(s, b.name, b.id);
      b.codePrefix = S.uniquePrefix(s, b.name, b.id);
    }
    return withExtras(s, S, b);
  },

  /**
   * Reemplaza los niveles del negocio. Reglas:
   * el primero empieza en 0 puntos, no hay dos niveles con los mismos puntos
   * y cada nivel tiene nombre. Si se borra el nivel vigente de un cliente,
   * pasa al nivel más bajo hasta el próximo cierre mensual.
   */
  saveLevels: (list) => (s, S, ctx) => {
    const { business: b } = admin(s, S, ctx);
    if (!list.length) throw new S.ServerError('El programa necesita al menos un nivel.', 422);
    const ordered = list.map((l) => ({ ...l, minPoints: Math.max(0, Math.round(Number(l.minPoints) || 0)) }))
      .sort((a, c) => a.minPoints - c.minPoints);
    if (ordered[0].minPoints !== 0) throw new S.ServerError('El primer nivel tiene que empezar en 0 puntos.', 422);
    ordered.forEach((l, i) => {
      if (!String(l.name || '').trim()) throw new S.ServerError('Cada nivel necesita un nombre.', 422);
      if (i && l.minPoints === ordered[i - 1].minPoints) throw new S.ServerError('Dos niveles no pueden pedir los mismos puntos.', 422);
    });
    const keep = new Set(ordered.filter((l) => l.id).map((l) => l.id));
    s.levels = s.levels.filter((l) => l.businessId !== b.id || keep.has(l.id));
    ordered.forEach((l, i) => {
      const data = {
        name: l.name.trim(), minPoints: l.minPoints, multiplier: Math.max(1, Number(l.multiplier) || 1),
        icon: l.icon || 'medal', color: l.color || 'marca', description: l.description || '',
        benefits: (l.benefits || []).map((x) => String(x).trim()).filter(Boolean), order: i + 1,
      };
      const existing = l.id && s.levels.find((x) => x.id === l.id);
      if (existing) Object.assign(existing, data);
      else s.levels.push({ id: S.nextId(s, 'levels'), businessId: b.id, ...data });
    });
    const ids = new Set(S.levelsOf(s, b.id).map((l) => l.id));
    const base = Levels.base(S.levelsOf(s, b.id));
    s.memberships.forEach((m) => { if (m.businessId === b.id && !ids.has(m.levelId)) m.levelId = base.id; });
    s.offers.forEach((o) => { if (o.businessId === b.id) o.levelIds = (o.levelIds || []).filter((id) => ids.has(id)); });
    return S.levelsOf(s, b.id);
  },

  /** Marca un paso del asistente de configuración inicial ('done' | 'skipped'). */
  setOnboardingStep: (step, status) => (s, S, ctx) => {
    const { business: b } = admin(s, S, ctx);
    b.onboarding.steps[step] = status;
    return b.onboarding;
  },

  /** "Terminar más tarde": el asistente no vuelve a abrirse solo. */
  dismissOnboarding: () => (s, S, ctx) => {
    const { business: b } = admin(s, S, ctx);
    b.onboarding.dismissed = true;
    return b.onboarding;
  },

  /** Activa el programa: desde ahora los clientes pueden sumarse. */
  activate: () => (s, S, ctx) => {
    const { business: b } = admin(s, S, ctx);
    if (!String(b.name || '').trim()) throw new S.ServerError('Poné el nombre del negocio antes de activarlo.', 422);
    b.status = 'activo';
    b.onboarding.completed = true;
    b.onboarding.dismissed = true;
    b.currentPeriod = periodOf(new Date());
    return b;
  },

  /* ---------- Personal del negocio (empleados opcionales) ----------
     Un empleado es una fila de personal (rol 'empleado') que apunta a una
     cuenta. Si la persona ya tiene cuenta de GO Puntos (por ejemplo, es
     clienta), se reutiliza: una sola cuenta, varios roles. */

  employees: () => (s, S, ctx) => {
    const { business: b } = admin(s, S, ctx);
    return s.businessStaff.filter((x) => x.businessId === b.id && x.role === 'empleado').map((row) => employeeView(S, s, row));
  },

  createEmployee: (data) => (s, S, ctx) => {
    const { business: b } = admin(s, S, ctx);
    let u = s.users.find((x) => x.email.toLowerCase() === data.email.trim().toLowerCase());
    const reused = Boolean(u);
    if (u && S.staffRow(s, u.id, b.id)) throw new S.ServerError('Esa persona ya tiene un rol en tu negocio.', 409, { field: 'email' });
    if (!u) {
      u = {
        id: S.nextId(s, 'users'), firstName: data.firstName.trim(), lastName: data.lastName.trim(),
        email: data.email.trim(), phone: '', password: data.password, createdAt: new Date().toISOString(), active: true,
      };
      s.users.push(u);
    }
    const row = S.addStaff(s, { businessId: b.id, userId: u.id, role: 'empleado', date: new Date() });
    return { ...employeeView(S, s, row), reused };
  },

  /** userId = cuenta del empleado. */
  setEmployeeActive: (userId, active) => (s, S, ctx) => {
    const { business: b } = admin(s, S, ctx);
    const row = s.businessStaff.find((x) => x.userId === userId && x.businessId === b.id && x.role === 'empleado');
    if (!row) throw new S.ServerError('No encontramos a ese empleado.', 404);
    row.active = active;
    return employeeView(S, s, row);
  },

  /** Quita el rol en este negocio. La cuenta de la persona sigue existiendo. */
  removeEmployee: (userId) => (s, S, ctx) => {
    const { business: b } = admin(s, S, ctx);
    s.businessStaff = s.businessStaff.filter((x) => !(x.userId === userId && x.businessId === b.id && x.role === 'empleado'));
    return true;
  },
};
