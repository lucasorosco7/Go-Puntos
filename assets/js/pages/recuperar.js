/* Recuperar contraseña: la respuesta es la misma exista o no la cuenta (seguridad) */
(function (GO) {
  const { forms, ui, validators: v } = GO;
  const form = document.getElementById('forgot-form');
  const done = document.getElementById('forgot-done');
  const submit = form.querySelector('[type="submit"]');

  forms.clearOnInput(form);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const { email } = forms.values(form);
    const errors = v.validate({ email }, { email: [v.required('email'), v.email] });
    forms.showErrors(form, errors);
    if (errors.email) return;

    ui.setLoading(submit, true, 'Enviando');
    await GO.authService.requestPasswordReset(email);
    done.querySelector('[data-sent-alert]').innerHTML = ui.alert('success', 'Revisá tu correo',
      `Si ${email} está registrado, vas a recibir el enlace en unos minutos. Mirá también la carpeta de spam.`);
    form.hidden = true;
    done.hidden = false;
    ui.refreshIcons();
  });
})(window.GO);
