/* =========================================================
   Capa de servicios: el ÚNICO lugar que sabe de dónde vienen
   los datos. Hoy responde con datos de prueba; cuando exista
   Flask, se pone GO.config.useMocks = false y las páginas
   siguen funcionando igual.
   ========================================================= */
(function (GO) {
  /* ---------- Sesión ----------
     "Recordar sesión" -> localStorage (sobrevive al cerrar el navegador)
     Sin recordar      -> sessionStorage (se borra al cerrar la pestaña) */
  const SESSION_KEY = 'gopuntos:session';
  GO.session = {
    get() {
      const raw = localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);
      try { return raw ? JSON.parse(raw) : null; } catch { return null; }
    },
    save(data, remember) {
      this.clear();
      (remember ? localStorage : sessionStorage).setItem(SESSION_KEY, JSON.stringify(data));
    },
    update(partial) {
      const current = this.get();
      if (!current) return;
      const store = localStorage.getItem(SESSION_KEY) ? localStorage : sessionStorage;
      store.setItem(SESSION_KEY, JSON.stringify({ ...current, ...partial }));
    },
    clear() { localStorage.removeItem(SESSION_KEY); sessionStorage.removeItem(SESSION_KEY); },
    user() { return this.get()?.user || null; },
  };

  /* ---------- Errores y cliente HTTP ---------- */
  class ApiError extends Error {
    constructor(message, status, details) { super(message); this.status = status; this.details = details; }
  }
  GO.ApiError = ApiError;

  async function request(path, { method = 'GET', body } = {}) {
    const token = GO.session.get()?.token;
    let res;
    try {
      res = await fetch(GO.config.apiUrl + path, {
        method,
        headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch {
      throw new ApiError('No pudimos conectar con el servidor. Revisá tu conexión.', 0);
    }
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new ApiError(data?.message || `Error ${res.status}`, res.status, data);
    return data;
  }
  const api = {
    get: (p) => request(p),
    post: (p, body) => request(p, { method: 'POST', body }),
  };

  /* ---------- Base de datos de prueba (persistida en localStorage) ---------- */
  const DB_KEY = 'gopuntos:mockdb:v1';
  const clone = (o) => JSON.parse(JSON.stringify(o));
  let state = (() => {
    try { return JSON.parse(localStorage.getItem(DB_KEY)) || clone(GO.seed); } catch { return clone(GO.seed); }
  })();
  const db = {
    get: () => state,
    save: () => localStorage.setItem(DB_KEY, JSON.stringify(state)),
    reset() { state = clone(GO.seed); localStorage.removeItem(DB_KEY); },
    nextId: (table) => Math.max(0, ...state[table].map((r) => r.id)) + 1,
  };
  GO.mockDb = db;

  /** Simula la demora de la red para ver los estados de carga */
  const delay = (ms = 450) => new Promise((r) => setTimeout(r, ms));
  /** Quita la contraseña antes de "devolver" un usuario, como haría la API */
  const publicUser = ({ password, ...user }) => user;
  const currentUserId = () => {
    const id = GO.session.user()?.id;
    if (!id) throw new ApiError('Tu sesión expiró. Ingresá de nuevo.', 401);
    return id;
  };

  /* ---------- Autenticación ----------
     POST /auth/login           { email, password }  -> { token, user }
     POST /auth/register        { ...datos }         -> { token, user }
     POST /auth/forgot-password { email }            -> { message } */
  GO.authService = {
    async login({ email, password }) {
      if (!GO.config.useMocks) return api.post('/auth/login', { email, password });
      await delay(600);
      const user = db.get().users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
      if (!user || user.password !== password) throw new ApiError('El email o la contraseña no coinciden.', 401);
      return { token: `mock-token-${user.id}`, user: publicUser(user) };
    },

    async register(data) {
      if (!GO.config.useMocks) return api.post('/auth/register', data);
      await delay(700);
      const s = db.get();
      if (s.users.some((u) => u.email.toLowerCase() === data.email.trim().toLowerCase())) {
        throw new ApiError('Ya existe una cuenta con ese email.', 409, { field: 'email' });
      }
      const id = db.nextId('users');
      const user = {
        id, role: 'cliente', firstName: data.firstName.trim(), lastName: data.lastName.trim(),
        email: data.email.trim(), phone: data.phone.trim(), password: data.password,
        memberSince: new Date().toISOString().slice(0, 10), memberCode: `GO-${String(id).padStart(6, '0')}`,
        balance: 100, lifetimePoints: 100,
      };
      s.users.push(user);
      s.movements.push({ id: db.nextId('movements'), userId: id, date: new Date().toISOString(),
        type: 'bonificacion', concept: 'Bono de bienvenida', points: 100, balanceAfter: 100 });
      db.save();
      return { token: `mock-token-${id}`, user: publicUser(user) };
    },

    async requestPasswordReset(email) {
      if (!GO.config.useMocks) return api.post('/auth/forgot-password', { email });
      await delay(600);
      return { message: 'Si el email está registrado, te enviamos un enlace.' };
    },
  };

  /* ---------- Cliente ----------
     GET /me/dashboard      -> { user, movements, rewards, offers, notifications }
     GET /me/notifications  -> [notification]
     GET /me/movements      -> [movement] */
  GO.customerService = {
    async getDashboard() {
      if (!GO.config.useMocks) return api.get('/me/dashboard');
      await delay();
      const userId = currentUserId();
      const s = db.get();
      return {
        user: publicUser(s.users.find((u) => u.id === userId)),
        movements: s.movements.filter((m) => m.userId === userId)
          .sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 4),
        rewards: s.rewards,
        offers: s.offers,
        notifications: s.notifications.filter((n) => n.userId === userId),
      };
    },
    async getMovements() {
      if (!GO.config.useMocks) return api.get('/me/movements');
      await delay();
      const userId = currentUserId();
      return db.get().movements
        .filter((m) => m.userId === userId)
        .sort((a, b) => new Date(b.date) - new Date(a.date));
    },

    async getNotifications() {
      if (!GO.config.useMocks) return api.get('/me/notifications');
      await delay(250);
      const userId = GO.session.user()?.id;
      return db.get().notifications.filter((n) => n.userId === userId);
    },
  };

  /* ---------- Ofertas ----------
     GET /offers -> [offer] */
  GO.offerService = {
    async getAll() {
      if (!GO.config.useMocks) return api.get('/offers');
      await delay(350);
      return db.get().offers;
    },
  };

  /* ---------- Recompensas ----------
     GET  /rewards              -> [reward]
     POST /rewards/:id/redeem   -> { user, movement, code } */
  GO.rewardService = {
    async getAll() {
      if (!GO.config.useMocks) return api.get('/rewards');
      await delay();
      return db.get().rewards;
    },
    /** Canje simulado: valida saldo y stock, descuenta puntos y registra el movimiento */
    async redeem(rewardId) {
      if (!GO.config.useMocks) return api.post(`/rewards/${rewardId}/redeem`);
      await delay(700);
      const s = db.get();
      const user = s.users.find((u) => u.id === currentUserId());
      const reward = s.rewards.find((r) => r.id === Number(rewardId));
      if (!reward || reward.stock <= 0) throw new ApiError('Esta recompensa se agotó.', 409);
      if (user.balance < reward.points) {
        throw new ApiError(`Te faltan ${GO.format.points(reward.points - user.balance)} puntos para este canje.`, 409);
      }
      const movement = {
        id: db.nextId('movements'), userId: user.id, date: new Date().toISOString(), type: 'canje',
        concept: `Canje: ${reward.name}`, points: -reward.points, balanceAfter: user.balance - reward.points,
      };
      user.balance -= reward.points;
      reward.stock -= 1;
      s.movements.push(movement);
      db.save();
      return { user: publicUser(user), movement, code: `CV-${String(movement.id).padStart(4, '0')}-${reward.id}` };
    },
  };
})(window.GO);
