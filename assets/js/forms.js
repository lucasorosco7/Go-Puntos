/* =========================================================
   Ayudas para formularios: mostrar errores accesibles,
   mostrar/ocultar contraseña y leer valores.
   Estructura esperada de cada campo en el HTML:
     <div class="field" data-field="email">
       <label for="email" class="field__label">…</label>
       <div class="field__control"><input id="email" name="email" …></div>
       <p class="field__error" id="email-error" hidden></p>
     </div>
   ========================================================= */
(function (GO) {
  function setError(form, name, message) {
    const field = form.querySelector(`[data-field="${name}"]`);
    if (!field) return;
    const input = field.querySelector('input');
    const error = field.querySelector('.field__error');
    const hint = field.querySelector('.field__hint');
    field.classList.toggle('has-error', Boolean(message));
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
    error.textContent = message || '';
    error.hidden = !message;
    if (hint) hint.hidden = Boolean(message);
    // El lector de pantalla lee el error al enfocar el campo
    input.setAttribute('aria-describedby', message ? error.id : (hint ? hint.id : ''));
  }

  function showErrors(form, errors) {
    form.querySelectorAll('[data-field]').forEach((f) => setError(form, f.dataset.field, errors[f.dataset.field]));
    const first = Object.keys(errors)[0];
    if (first) form.querySelector(`[name="${first}"]`)?.focus();
  }

  const values = (form) => Object.fromEntries(new FormData(form).entries());

  /** Borra el error de un campo cuando la persona lo corrige */
  function clearOnInput(form) {
    form.addEventListener('input', (e) => {
      if (e.target.name) setError(form, e.target.name, '');
    });
  }

  /** Activa todos los botones de mostrar/ocultar contraseña de la página */
  function initPasswordToggles(root = document) {
    root.querySelectorAll('[data-toggle-password]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const input = btn.closest('.field__control').querySelector('input');
        const show = input.type === 'password';
        input.type = show ? 'text' : 'password';
        btn.setAttribute('aria-pressed', String(show));
        btn.setAttribute('aria-label', show ? 'Ocultar contraseña' : 'Mostrar contraseña');
        btn.querySelector('[data-eye="open"]').hidden = show;
        btn.querySelector('[data-eye="closed"]').hidden = !show;
      });
    });
  }

  function formAlert(form, tone, title, text) {
    const slot = form.querySelector('[data-form-alert]');
    slot.innerHTML = title ? GO.ui.alert(tone, title, text) : '';
    GO.ui.refreshIcons();
  }

  GO.forms = { setError, showErrors, values, clearOnInput, initPasswordToggles, formAlert };
})(window.GO);
