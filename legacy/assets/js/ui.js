/* =========================================================
   Componentes de interfaz reutilizables.
   Cada función devuelve HTML (texto) que las páginas insertan.
   Es el equivalente, sin framework, a los componentes de React.
   ========================================================= */
(function (GO) {
  const { escape: esc, format } = GO;

  /* ---------- Iconos (Lucide) ----------
     Se escribe <i data-lucide="gift"></i> y la librería lo convierte
     en SVG. Después de insertar HTML nuevo hay que llamar a refreshIcons(). */
  const icon = (name, size = 20, cls = '') =>
    `<i data-lucide="${name}" width="${size}" height="${size}" class="ic ${cls}" aria-hidden="true"></i>`;

  const refreshIcons = () => { if (window.lucide) window.lucide.createIcons(); };

  /* ---------- Marca ---------- */
  function logoMark(size = 36, tone = 'dark') {
    const bg = tone === 'light' ? '#f1efe6' : '#1f4d3a';
    const arc = tone === 'light' ? '#1f4d3a' : '#f1efe6';
    return `<svg width="${size}" height="${size}" viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <rect width="64" height="64" rx="18" fill="${bg}"/>
      <path d="M32 15.5a16.5 16.5 0 1 1-16.5 16.5" fill="none" stroke="${arc}" stroke-width="5.5" stroke-linecap="round"/>
      <circle cx="15.5" cy="32" r="3.6" fill="#e6a73a"/>
      <path d="M32 22c5.6 3.4 6.3 11.2 0 19.4-6.3-8.2-5.6-16 0-19.4z" fill="#e6a73a"/></svg>`;
  }
  const logo = ({ tone = 'dark', tagline = false, size = 38 } = {}) => `
    <span class="logo logo--${tone}">${logoMark(size, tone)}
      <span class="logo__text"><span class="logo__name">GO Puntos</span>
      ${tagline ? '<span class="logo__tagline">CV Dietética</span>' : ''}</span></span>`;

  /* ---------- Piezas básicas ---------- */
  function progressBar(value, label, mod = '') {
    const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
    return `<div class="bar ${mod}" role="progressbar" aria-valuemin="0" aria-valuemax="100"
      aria-valuenow="${pct}" aria-label="${esc(label)}"><i style="width:${pct}%"></i></div>`;
  }
  const avatar = (u, size = 42) =>
    `<span class="avatar" style="width:${size}px;height:${size}px;font-size:${Math.round(size * .34)}px" aria-hidden="true">${esc(format.initials(u.firstName, u.lastName))}</span>`;
  const skeleton = (h, w = '100%', r = '') =>
    `<span class="skeleton" style="height:${h};width:${w};${r ? `border-radius:${r}` : ''}" aria-hidden="true"></span>`;
  const alert = (tone, title, text = '') => {
    const ic = { error: 'circle-alert', success: 'circle-check', info: 'info' }[tone];
    return `<div class="alert alert--${tone}" role="${tone === 'error' ? 'alert' : 'status'}">
      ${icon(ic, 20, 'alert__icon')}<div>
      ${title ? `<p class="alert__title">${esc(title)}</p>` : ''}${text ? `<p>${esc(text)}</p>` : ''}</div></div>`;
  };
  const empty = (iconName, title, text) => `<div class="empty">
    <span class="empty__icon">${icon(iconName, 24)}</span>
    <p style="font-weight:var(--fw-medium)">${esc(title)}</p><p class="muted small">${esc(text)}</p></div>`;

  /* ---------- Tarjeta de puntos (pieza principal del cliente) ---------- */
  function pointsCard({ balance, nextReward, compact = false }) {
    if (compact) {
      return `<section class="points points--compact" aria-label="Tus puntos">
        <span class="points__label">Tus puntos</span>
        <span class="points__value tabular">${format.points(balance)}</span></section>`;
    }
    const { progress, missing } = GO.loyalty.getRewardProgress(balance, nextReward);
    const goal = nextReward
      ? `${progressBar(progress, `Progreso hacia ${nextReward.name}`, 'bar--honey bar--onDark')}
         <p class="points__goal">Te faltan <b class="tabular">${format.points(missing)}</b> para ${esc(nextReward.name)}</p>`
      : `<p class="points__goal">Te alcanza para cualquier recompensa del catálogo.</p>`;
    return `<section class="points" aria-label="Tus puntos">
      <p class="points__label">Tus puntos</p>
      <p class="points__value tabular">${format.points(balance)}</p>
      ${goal}</section>`;
  }

  /* ---------- Ilustración por categoría ----------
     Mientras no haya fotos reales de los productos. */
  const ART_ICON = { descuentos: 'percent', snacks: 'nut', almacen: 'wheat', bebidas: 'coffee' };
  const rewardArt = (category, size = 56, iconSize = 24, radius = '') => {
    const cat = ART_ICON[category] ? category : 'almacen';
    return `<span class="art art--${cat}" style="width:${size === 'auto' ? '100%' : size + 'px'};height:${size === 'auto' ? '76px' : size + 'px'}${radius ? `;border-radius:${radius}` : ''}" aria-hidden="true">${icon(ART_ICON[cat], iconSize)}</span>`;
  };

  /* ---------- Fila de recompensa ----------
     `action` define el botón: la misma fila sirve para canjear o ver detalle. */
  function rewardRow(reward, balance, actionHtml = '') {
    return `<li><div class="row">
      ${rewardArt(reward.category, 60, 26)}
      <div class="row__body">
        <p class="row__title">${esc(reward.name)}</p>
        <p class="tabular small" style="color:var(--forest-2);font-weight:var(--fw-medium)">${format.points(reward.points)} puntos</p>
      </div>${actionHtml}</div></li>`;
  }

  /** Botón o leyenda según si al cliente le alcanza */
  function rewardAction(reward, balance) {
    if (reward.stock <= 0) return `<span class="pill">Agotado</span>`;
    if (reward.points > balance) {
      return `<span class="small muted" style="text-align:right;line-height:1.3">Faltan<br>
        <b class="tabular" style="color:var(--text)">${format.points(reward.points - balance)}</b></span>`;
    }
    return `<button type="button" class="btn btn--sm" data-action="redeem" data-id="${reward.id}">Canjear</button>`;
  }

  /* ---------- Oferta ---------- */
  function offerRow(offer) {
    return `<li><div class="row offer">
      ${rewardArt(offer.category, 64, 26)}
      <div class="row__body">
        <span class="pill pill--${offer.tone}">${esc(offer.tag)}</span>
        <p class="row__title" style="margin-top:5px">${esc(offer.title)}</p>
        <p class="small muted">${esc(offer.description)}</p>
        <p class="offer__meta">${icon('calendar-days', 13)} ${esc(offer.when)}</p>
      </div></div></li>`;
  }

  /* ---------- Movimientos ---------- */
  const MOVEMENT_TYPES = {
    compra: ['Compra', 'shopping-bag'], canje: ['Canje', 'gift'],
    bonificacion: ['Bonificación', 'sparkles'], vencimiento: ['Vencimiento', 'hourglass'],
  };
  function movementList(movements) {
    return `<ul>${movements.map((m) => {
      const [label, ic] = MOVEMENT_TYPES[m.type] || MOVEMENT_TYPES.compra;
      return `<li class="mov">
        <span class="mov__icon mov__icon--${m.type}">${icon(ic, 18)}</span>
        <div class="mov__body">
          <p class="mov__concept">${esc(m.concept)}</p>
          <p class="small subtle"><time datetime="${m.date}">${format.shortDate(m.date)}</time> · ${m.amount ? format.currency(m.amount) : label}</p>
        </div>
        <p class="mov__points tabular ${m.points > 0 ? 'pos' : 'neg'}">${format.signedPoints(m.points)}<span class="sr-only"> puntos</span></p>
      </li>`;
    }).join('')}</ul>`;
  }

  /* ---------- QR ilustrativo (NO escaneable) ----------
     Sirve para diseñar la pantalla. Con el backend se reemplaza por
     una librería real (ej. qrcode.js) sin tocar a quien lo usa. */
  function qr(value, size = 220) {
    const N = 25;
    let seed = [...value].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
    const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);
    const inFinder = (x, y) => (x < 8 && y < 8) || (x > N - 9 && y < 8) || (x < 8 && y > N - 9);
    let cells = '';
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      if (!inFinder(x, y) && rand() > .5) cells += `<rect x="${x}" y="${y}" width="1" height="1"/>`;
    }
    const f = (x, y) => `<rect x="${x}" y="${y}" width="7" height="7" rx="1.5"/><rect x="${x + 1}" y="${y + 1}" width="5" height="5" rx="1" fill="#fff"/><rect x="${x + 2}" y="${y + 2}" width="3" height="3" rx=".6"/>`;
    return `<svg viewBox="-1.5 -1.5 ${N + 3} ${N + 3}" width="${size}" height="${size}" role="img"
      aria-label="Código QR de ${esc(value)}" shape-rendering="crispEdges" style="margin-inline:auto">
      <rect x="-1.5" y="-1.5" width="${N + 3}" height="${N + 3}" rx="3" fill="#fff"/>
      <g fill="#102a1e">${cells}${f(0, 0)}${f(N - 7, 0)}${f(0, N - 7)}</g></svg>`;
  }

  /* ---------- Avisos breves ---------- */
  function toast(message, tone = 'success', duration = 4000) {
    let region = document.querySelector('.toast-region');
    if (!region) {
      region = document.createElement('div');
      region.className = 'toast-region';
      region.setAttribute('aria-live', 'polite');
      document.body.appendChild(region);
    }
    const el = document.createElement('div');
    el.className = `toast toast--${tone}`;
    el.setAttribute('role', 'status');
    el.innerHTML = `${icon(tone === 'error' ? 'circle-alert' : 'circle-check', 18)}<span>${esc(message)}</span>
      <button type="button" class="toast__close" aria-label="Cerrar aviso">${icon('x', 16)}</button>`;
    el.querySelector('button').addEventListener('click', () => el.remove());
    region.appendChild(el);
    refreshIcons();
    setTimeout(() => el.remove(), duration);
  }

  /* ---------- Hoja inferior / modal ----------
     Usa <dialog>: el navegador ya resuelve foco atrapado y Escape. */
  function sheet({ title, description = '', body = '', actions = '', onClose } = {}) {
    const dialog = document.createElement('dialog');
    dialog.className = 'sheet';
    document.body.appendChild(dialog);

    const render = (o) => {
      dialog.innerHTML = `<div class="sheet__box">
        <div class="sheet__grab" aria-hidden="true"></div>
        <h2 class="sheet__title">${esc(o.title)}</h2>
        ${o.description ? `<p class="sheet__desc">${esc(o.description)}</p>` : ''}
        ${o.body}
        <div class="sheet__actions">${o.actions}</div></div>`;
      dialog.setAttribute('aria-label', o.title);
      refreshIcons();
    };
    render({ title, description, body, actions });

    dialog.addEventListener('close', () => { dialog.remove(); onClose && onClose(); });
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog || e.target.closest('[data-close]')) dialog.close();
    });
    dialog.showModal();
    return { el: dialog, close: () => dialog.close(), update: (o) => render({ title, description, body, actions, ...o }) };
  }

  /* ---------- Botón con estado de carga ---------- */
  function setLoading(button, loading, text) {
    if (loading) {
      button.dataset.label = button.innerHTML;
      button.disabled = true;
      button.classList.add('is-loading');
      button.setAttribute('aria-busy', 'true');
      button.innerHTML = `<span class="spinner" aria-hidden="true"></span><span>${esc(text || 'Cargando')}</span>`;
    } else {
      button.disabled = false;
      button.classList.remove('is-loading');
      button.removeAttribute('aria-busy');
      if (button.dataset.label) button.innerHTML = button.dataset.label;
      refreshIcons();
    }
  }

  GO.ui = {
    icon, refreshIcons, logo, logoMark, progressBar, avatar, skeleton, alert, empty,
    pointsCard, rewardArt, rewardRow, rewardAction, offerRow, movementList, qr,
    toast, sheet, setLoading,
  };
})(window.GO);
