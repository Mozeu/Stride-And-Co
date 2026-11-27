// Mejora progresiva: pide confirmación antes de enviar formularios con data-confirm.
// Sin JavaScript el formulario se envía igual.
document.addEventListener('submit', function (event) {
  var message = event.target.getAttribute && event.target.getAttribute('data-confirm');
  if (message && !window.confirm(message)) event.preventDefault();
});
