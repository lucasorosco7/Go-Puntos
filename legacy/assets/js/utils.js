/* =========================================================
   Utilidades puras: formato, seguridad, validación y reglas
   de puntos. No tocan la pantalla, sólo reciben y devuelven datos.
   ========================================================= */
(function (GO) {
  const numberFmt = new Intl.NumberFormat('es-AR');
  const currencyFmt = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });
  const shortDateFmt = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short' });

  GO.format = {
    points: (n) => numberFmt.format(n),                       // 1240 -> "1.240"
    signedPoints: (n) => (n > 0 ? '+' : '\u2212') + numberFmt.format(Math.abs(n)),
    currency: (n) => currencyFmt.format(n),                   // 12600 -> "$ 12.600"
    shortDate: (iso) => shortDateFmt.format(new Date(iso)).replace('.', ''),
    longDate: (iso) => new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso)),
    greeting(date = new Date()) {
      const h = date.getHours();
      if (h < 6) return 'Buenas noches';
      if (h < 13) return 'Buen día';
      if (h < 20) return 'Buenas tardes';
      return 'Buenas noches';
    },
    initials: (first = '', last = '') => (first.charAt(0) + last.charAt(0)).toUpperCase(),
  };

  /**
   * Escapa texto antes de insertarlo con innerHTML.
   * Evita que un dato (ej. un nombre cargado por un usuario)
   * se interprete como HTML: protección básica contra XSS.
   */
  GO.escape = (value) =>
    String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // Cada validador devuelve un mensaje de error o "" si está bien.
  GO.validators = {
    required: (label) => (v) => (String(v ?? '').trim() ? '' : `Ingresá tu ${label}.`),
    email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v).trim()) ? '' : 'Revisá el email: debería verse como nombre@dominio.com.'),
    phone: (v) => (String(v).replace(/\D/g, '').length >= 10 ? '' : 'Ingresá el teléfono con código de área (10 dígitos).'),
    password(v) {
      if (String(v).length < 8) return 'La contraseña necesita al menos 8 caracteres.';
      if (!/[A-Za-z]/.test(v) || !/\d/.test(v)) return 'Combiná letras y números.';
      return '';
    },
    /** Corre un esquema { campo: [reglas] } y devuelve el primer error de cada campo */
    validate(values, schema) {
      const errors = {};
      Object.entries(schema).forEach(([field, rules]) => {
        for (const rule of rules) {
          const msg = rule(values[field], values);
          if (msg) { errors[field] = msg; break; }
        }
      });
      return errors;
    },
  };

  // Reglas del programa de puntos
  GO.loyalty = {
    getTier(lifetime) {
      return [...GO.config.TIERS].reverse().find((t) => lifetime >= t.minPoints) || GO.config.TIERS[0];
    },
    getNextTier(lifetime) {
      const next = GO.config.TIERS.find((t) => t.minPoints > lifetime);
      if (!next) return null;
      const current = this.getTier(lifetime);
      return {
        tier: next,
        missing: next.minPoints - lifetime,
        progress: (lifetime - current.minPoints) / (next.minPoints - current.minPoints),
      };
    },
    isAvailable: (reward) => reward.stock > 0,
    /** La recompensa más barata que todavía no le alcanza (y tiene stock) */
    getNextReward(balance, rewards) {
      return rewards.filter((r) => r.stock > 0 && r.points > balance).sort((a, b) => a.points - b.points)[0] || null;
    },
    getRewardProgress(balance, reward) {
      if (!reward) return { progress: 1, missing: 0 };
      return { progress: Math.min(1, balance / reward.points), missing: Math.max(0, reward.points - balance) };
    },
  };
})(window.GO);
