/* Login: valida, llama al servicio y redirige según el rol */
(function (GO) {
  const { forms, ui, validators: v } = GO;
  const form = document.getElementById('login-form');
  const submit = form.querySelector('[type="submit"]');

  const schema = {
    email: [v.required('email'), v.email],
    password: [v.required('contraseña')],
  };

  const DEMO = {
    cliente: { email: 'martina@demo.com', password: 'demo1234' },
    admin: { email: 'admin@cvdietetica.com', password: 'admin1234' },
  };
  document.querySelectorAll('[data-demo]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const acc = DEMO[btn.dataset.demo];
      form.email.value = acc.email;
      form.password.value = acc.password;
      forms.showErrors(form, {});
      forms.formAlert(form);
    });
  });

  forms.clearOnInput(form);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const values = forms.values(form);
    const errors = v.validate(values, schema);
    forms.showErrors(form, errors);
    forms.formAlert(form);
    if (Object.keys(errors).length) return;

    ui.setLoading(submit, true, 'Ingresando');
    try {
      const { token, user } = await GO.authService.login(values);
      GO.session.save({ token, user }, form.remember.checked);
      // Si venía de una página privada, vuelve ahí; si no, a su inicio
      const next = new URLSearchParams(location.search).get('next');
      const safeNext = next && /^[\w-]+\.html$/.test(next) ? next : null; // sólo páginas propias
      location.href = safeNext || GO.homeFor(user);
    } catch (err) {
      forms.formAlert(form, 'error', 'No pudimos ingresar', `${err.message} Revisalos e intentá otra vez.`);
      ui.setLoading(submit, false);
    }
  });
})(window.GO);
