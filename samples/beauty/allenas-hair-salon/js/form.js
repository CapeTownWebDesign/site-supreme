/* ==========================================================================
   FORM
   Appointment request form: validates name, mobile number and service,
   then shows a demo-only confirmation. Nothing is sent anywhere.

   Expects in the page:
     #enquiry          the <form>
     #enquiry-done     the confirmation panel (hidden until success)
     #again            "Start again" button inside the confirmation panel
     #f-name / #f-phone / #f-service with matching #e-name / #e-phone / #e-service
   ========================================================================== */

(function () {
  'use strict';

  var form = document.getElementById('enquiry');
  var done = document.getElementById('enquiry-done');
  var again = document.getElementById('again');
  if (!(form && done)) return;

  var rules = [
    { id: 'f-name', err: 'e-name', ok: function (v) { return v.trim().length > 1; }, msg: 'Enter your name.' },
    { id: 'f-phone', err: 'e-phone', ok: function (v) { return v.replace(/\D/g, '').length >= 9; }, msg: 'Enter a mobile number we can reach you on.' },
    { id: 'f-service', err: 'e-service', ok: function (v) { return v !== ''; }, msg: 'Choose a service.' }
  ];

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var first = null;
    rules.forEach(function (r) {
      var el = document.getElementById(r.id), er = document.getElementById(r.err);
      var ok = r.ok(el.value);
      el.setAttribute('aria-invalid', ok ? 'false' : 'true');
      er.hidden = ok; er.textContent = ok ? '' : r.msg;
      if (!ok && !first) first = el;
    });
    if (first) { first.focus(); return; }
    form.hidden = true; done.hidden = false; done.focus();
  });

  if (again) again.addEventListener('click', function () {
    form.reset(); form.hidden = false; done.hidden = true;
    document.getElementById('f-name').focus();
  });
})();
