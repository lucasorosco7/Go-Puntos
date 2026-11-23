/* =========================================================
   Layouts compartidos. En vez de repetir el mismo menú y
   encabezado en cada archivo HTML, este script los genera
   según el atributo data-layout del <body>:
     public -> header y footer del sitio
     auth   -> panel de marca de login y registro
     app    -> área del cliente (barra de 3 pestañas)
     admin  -> área del administrador (menú lateral)
     bare   -> pantalla sin menú (código QR, canje confirmado)
   ========================================================= */
(function (GO) {
  const { ui, paths, escape: esc } = GO;
  const body = document.body;
  const layout = body.dataset.layout;
  const user = GO.session.user();

  GO.homeFor = (u) => (u?.role === 'admin' ? paths.admin.home : paths.client.home);
  GO.logout = () => { GO.session.clear(); location.href = paths.login; };

  /* ---------- Guardias ----------
     OJO: esto es sólo experiencia de usuario. La seguridad real
     la hará Flask validando el token en cada pedido. */
  const needsAuth = ['app', 'admin', 'bare'].includes(layout) && body.dataset.area;
  if (needsAuth) {
    if (!user) {
      location.replace(`${paths.login}?next=${encodeURIComponent(location.pathname.split('/').pop())}`);
      return;
    }
    if (user.role !== body.dataset.area) { location.replace(GO.homeFor(user)); return; }
  }
  if (body.dataset.guest === 'true' && user) { location.replace(GO.homeFor(user)); return; }

  /* ---------- Sitio público ---------- */
  function renderPublic() {
    const header = document.querySelector('[data-slot="header"]');
    const footer = document.querySelector('[data-slot="footer"]');
    const links = [['#como-funciona', 'Cómo funciona'], ['#beneficios', 'Beneficios'], ['#recompensas', 'Recompensas']];

    header.outerHTML = `
      <header class="pheader"><div class="container pheader__inner">
        <a href="${paths.home}" aria-label="GO Puntos, inicio">${ui.logo({ tagline: true })}</a>
        <nav class="pheader__nav" id="public-nav" aria-label="Principal">
          <ul>${links.map(([h, l]) => `<li><a href="${h}">${l}</a></li>`).join('')}</ul>
          <div class="pheader__actions">
            ${user
              ? `<a class="btn" href="${GO.homeFor(user)}">Ir a mi cuenta</a>`
              : `<a class="btn btn--ghost" href="${paths.login}">Ingresar</a>
                 <a class="btn" href="${paths.register}">Sumarme gratis</a>`}
          </div>
        </nav>
        <button type="button" class="pheader__toggle" aria-expanded="false" aria-controls="public-nav" aria-label="Abrir menú">
          <span data-icon-open>${ui.icon('menu', 22)}</span><span data-icon-close hidden>${ui.icon('x', 22)}</span>
        </button>
      </div></header>`;

    footer.outerHTML = `
      <footer class="pfooter">
        <div class="container pfooter__grid">
          <div class="pfooter__brand">${ui.logo({ tone: 'light', tagline: true })}
            <p>El programa de beneficios para quienes compran seguido en CV Dietética.</p></div>
          <div><h2 class="pfooter__title">El local</h2><ul class="pfooter__list">
            <li>${ui.icon('map-pin', 16)} San Miguel de Tucumán</li>
            <li>${ui.icon('clock', 16)} Lunes a sábado, 9 a 21 h</li>
            <li>${ui.icon('phone', 16)} 381 555-0100</li></ul></div>
          <div><h2 class="pfooter__title">Tu cuenta</h2><ul class="pfooter__list">
            <li><a href="${paths.login}">Ingresar</a></li>
            <li><a href="${paths.register}">Crear cuenta</a></li>
            <li><a href="${paths.forgot}">Recuperar contraseña</a></li></ul></div>
        </div>
        <div class="container pfooter__legal">
          <p>© ${new Date().getFullYear()} CV Dietética. Los puntos no tienen valor monetario y no se canjean por efectivo.</p>
          <p>Proyecto final TUP, UTN FRT</p></div>
      </footer>`;

    const toggle = document.querySelector('.pheader__toggle');
    const nav = document.getElementById('public-nav');
    const setOpen = (open) => {
      nav.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
      toggle.querySelector('[data-icon-open]').hidden = open;
      toggle.querySelector('[data-icon-close]').hidden = !open;
    };
    toggle.addEventListener('click', () => setOpen(!nav.classList.contains('is-open')));
    nav.querySelectorAll('ul a').forEach((a) => a.addEventListener('click', () => setOpen(false)));
  }

  /* ---------- Login y registro ---------- */
  function renderAuth() {
    const aside = document.querySelector('[data-slot="auth-brand"]');
    aside.innerHTML = `
      <a href="${paths.home}" tabindex="-1">${ui.logo({ tagline: true })}</a>
      <div class="auth__showcase">
        ${ui.pointsCard({ balance: 1240, nextReward: { name: 'Mantequilla de maní 380 g', points: 1500 } })}
        <p class="auth__caption">Sumá puntos con cada compra y canjealos por productos del local.</p>
      </div>
      <p class="auth__foot">CV Dietética, San Miguel de Tucumán</p>`;
    document.querySelector('[data-slot="auth-logo"]').innerHTML = ui.logo();
    GO.forms.initPasswordToggles();
  }

  /* ---------- Área del cliente: barra de 3 pestañas ---------- */
  function renderTabbar() {
    const active = body.dataset.nav || location.pathname.split('/').pop();
    const nav = document.createElement('nav');
    nav.className = 'tabbar';
    nav.setAttribute('aria-label', 'Secciones');
    nav.innerHTML = GO.nav.client.map((i) => {
      const on = i.href === active;
      return `<a href="${i.href}" class="${on ? 'is-on' : ''}" ${on ? 'aria-current="page"' : ''}>
        ${ui.icon(i.icon, 21)}<span>${i.label}</span></a>`;
    }).join('');
    document.querySelector('.app').appendChild(nav);
  }

  /* ---------- Área del administrador: menú lateral ---------- */
  function renderAdmin() {
    const active = body.dataset.nav || location.pathname.split('/').pop();
    const main = document.getElementById('contenido');
    const shell = document.createElement('div');
    shell.className = 'admin-shell';
    shell.innerHTML = `
      <a href="#contenido" class="skip-link">Saltar al contenido</a>
      <div class="admin-scrim" aria-hidden="true"></div>
      <aside id="admin-sidebar" class="admin-side">
        <div class="admin-side__brand">${ui.logo({ tone: 'light', tagline: true })}</div>
        <p class="admin-side__label">Administración</p>
        <nav aria-label="Secciones"><ul>
          ${GO.nav.admin.map((i) => `<li><a href="${i.href}" class="${i.href === active ? 'is-on' : ''}"
            ${i.href === active ? 'aria-current="page"' : ''}>${ui.icon(i.icon, 19)}<span>${i.label}</span></a></li>`).join('')}
        </ul></nav>
        <div class="admin-side__foot">
          <div class="admin-side__user">${ui.avatar(user, 36)}
            <div><p>${esc(user.firstName)} ${esc(user.lastName)}</p><small>Administrador</small></div></div>
          <button type="button" class="admin-side__logout" data-logout>${ui.icon('log-out', 18)} Cerrar sesión</button>
        </div>
      </aside>
      <div class="admin-main">
        <header class="admin-top">
          <button type="button" class="icon-btn admin-top__menu" aria-label="Abrir menú"
            aria-expanded="false" aria-controls="admin-sidebar">${ui.icon('menu', 21)}</button>
          <span class="muted">${esc(GO.nav.admin.find((i) => i.href === active)?.label || '')}</span>
        </header>
      </div>`;
    main.replaceWith(shell);
    shell.querySelector('.admin-main').appendChild(main);
    main.setAttribute('tabindex', '-1');

    const side = shell.querySelector('.admin-side');
    const scrim = shell.querySelector('.admin-scrim');
    const btn = shell.querySelector('.admin-top__menu');
    const setOpen = (open) => {
      side.classList.toggle('is-open', open);
      scrim.classList.toggle('is-visible', open);
      btn.setAttribute('aria-expanded', String(open));
    };
    btn.addEventListener('click', () => setOpen(true));
    scrim.addEventListener('click', () => setOpen(false));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
    shell.querySelectorAll('[data-logout]').forEach((b) => b.addEventListener('click', GO.logout));
  }

  if (layout === 'public') renderPublic();
  if (layout === 'auth') renderAuth();
  if (layout === 'app') renderTabbar();
  if (layout === 'admin') renderAdmin();

  // Mensaje que dejó la página anterior (ej.: al crear la cuenta)
  const flash = sessionStorage.getItem('gopuntos:flash');
  if (flash) { sessionStorage.removeItem('gopuntos:flash'); ui.toast(flash); }

  ui.refreshIcons();
})(window.GO);
