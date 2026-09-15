/* Registro: validación al salir de cada campo y al enviar */
(function (GO) {
  const { forms, ui, validators: v } = GO;
  const form = document.getElementById('register-form');
  const submit = form.querySelector('[type="submit"]');

  const matches = (value, all) => (value === all.password ? '' : 'Las contraseñas no coinciden.');
  const schema = {
    firstName: [v.required('nombre')],
    lastName: [v.required('apellido')],
    email: [v.required('email'), v.email],
    phone: [v.required('teléfono'), v.phone],
    password: [v.required('contraseña'), v.password],
    confirm: [v.required('confirmación de contraseña'), matches],
  };

  forms.clearOnInput(form);

  // Al salir del campo: avisa temprano sin molestar mientras se escribe
  form.addEventListener('focusout', (e) => {
    const name = e.target.name;
    if (!schema[name] || !e.target.value) return;
    const error = v.validate(forms.values(form), { [name]: schema[name] })[name];
    forms.setError(form, name, error);
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const values = forms.values(form);
    const errors = v.validate(values, schema);
    forms.showErrors(form, errors);
    forms.formAlert(form);
    if (Object.keys(errors).length) return;

    ui.setLoading(submit, true, 'Creando cuenta');
    try {
      const { token, user } = await GO.authService.register(values);
      GO.session.save({ token, user }, false);
      sessionStorage.setItem('gopuntos:flash', 'Cuenta creada. Te regalamos 100 puntos de bienvenida.');
      location.href = GO.paths.client.home;
    } catch (err) {
      if (err.details?.field) forms.showErrors(form, { [err.details.field]: err.message });
      else forms.formAlert(form, 'error', 'No pudimos crear la cuenta', err.message);
      ui.setLoading(submit, false);
    }
  });
})(window.GO);
