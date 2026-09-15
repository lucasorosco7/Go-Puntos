/* Perfil: datos personales, contraseña y nivel de fidelización */
(function (GO) {
  const { ui, forms, format, loyalty, validators: v, escape: esc } = GO;
  const user = GO.session.user();
  if (!user) return;

  /* ---------- Encabezado con nivel y código ---------- */
  const tier = loyalty.getTier(user.lifetimePoints);
  document.getElementById('profile-head').innerHTML = `
    <div class="profile-head">
      ${ui.avatar(user, 86)}
      <h2 style="font-size:var(--fs-xl);margin-top:var(--sp-3)">${esc(user.firstName)} ${esc(user.lastName)}</h2>
      <p class="small muted">Socio desde el ${format.longDate(user.memberSince)}</p>
      <span class="pill pill--${tier.id}" style="margin-top:var(--sp-2)">${ui.icon('medal', 14)} Nivel ${tier.name}</span>
      <a href="${GO.paths.client.qr}" class="btn btn--outline" style="margin-top:var(--sp-4)">
        ${ui.icon('qr-code', 18)} Ver mi código</a>
    </div>`;

  /* ---------- Camino de niveles ---------- */
  const PERKS = {
    bronce: 'Sumás 1 punto por cada $100',
    plata: '25% más de puntos por compra',
    oro: '50% más de puntos y canjes anticipados',
  };
  document.getElementById('tiers').innerHTML = GO.config.TIERS.map((t, i, arr) => {
    const done = user.lifetimePoints >= t.minPoints;
    const current = t.id === tier.id;
    const state = current ? 'is-current' : done ? 'is-done' : '';
    return `<div class="tier-step">
      <div class="tier-step__rail">
        <span class="tier-step__dot ${state}">${ui.icon(done && !current ? 'check' : 'medal', 16)}</span>
        ${i < arr.length - 1 ? '<span class="tier-step__line"></span>' : ''}
      </div>
      <div class="tier-step__body">
        <p style="font-weight:var(--fw-medium)">${t.name}
          ${current ? '<span class="pill pill--green" style="margin-left:6px">Tu nivel</span>' : ''}</p>
        <p class="small muted">${t.minPoints === 0 ? 'Desde que te registrás' : `${format.points(t.minPoints)} puntos acumulados`}</p>
        <p class="small">${PERKS[t.id]}</p>
      </div></div>`;
  }).join('');

  /* ---------- Datos personales ----------
     Por ahora sólo se actualiza la sesión local; cuando exista Flask
     esto llamará a PUT /me y el servidor será la fuente de verdad. */
  const profileForm = document.getElementById('profile-form');
  ['firstName', 'lastName', 'email', 'phone'].forEach((f) => { profileForm[f].value = user[f] || ''; });
  forms.clearOnInput(profileForm);

  profileForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const values = forms.values(profileForm);
    const errors = v.validate(values, {
      firstName: [v.required('nombre')],
      lastName: [v.required('apellido')],
      email: [v.required('email'), v.email],
      phone: [v.required('teléfono'), v.phone],
    });
    forms.showErrors(profileForm, errors);
    if (Object.keys(errors).length) return;

    GO.session.update({ user: { ...user, ...values } });
    ui.toast('Datos actualizados.');
  });

  /* ---------- Cambio de contraseña ---------- */
  const passwordForm = document.getElementById('password-form');
  forms.clearOnInput(passwordForm);

  passwordForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const values = forms.values(passwordForm);
    const errors = v.validate(values, {
      current: [v.required('contraseña actual')],
      password: [v.required('nueva contraseña'), v.password],
      confirm: [v.required('confirmación'), (val, all) => (val === all.password ? '' : 'Las contraseñas no coinciden.')],
    });
    forms.showErrors(passwordForm, errors);
    if (Object.keys(errors).length) return;

    passwordForm.reset();
    ui.toast('Contraseña actualizada.');
  });

  document.querySelector('[data-logout]').addEventListener('click', GO.logout);
  ui.refreshIcons();
})(window.GO);
