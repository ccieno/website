/* Tropical Sky demo — enquiry form behaviour.
 *
 * Nothing is submitted anywhere. The form exists so a demo can show an agent
 * co-browsing a real-looking form, and so the flow can see how far the customer
 * got before they asked for help.
 *
 * Depends on window.tropicalUpdate() from zcc.js.
 */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    var form = document.getElementById('enquiryForm');
    if (!form) return;

    // ---- enquiry reference, stable for the session ----------------------
    var ref;
    try { ref = sessionStorage.getItem('tropicalRef'); } catch (e) { ref = null; }
    if (!ref) {
      ref = 'TS-' + Math.floor(100000 + Math.random() * 900000);
      try { sessionStorage.setItem('tropicalRef', ref); } catch (e) {}
    }
    ['refDisplay', 'thanksRef'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.textContent = ref;
    });

    // ---- prefill the destination from where they've been browsing -------
    var select = document.getElementById('destination');
    var ctx = window.tropicalContext || { entryParams: {} };
    var suggested = ctx.entryParams.lastDestination;

    if (select && suggested && !select.value) {
      var match = Array.prototype.some.call(select.options, function (o) {
        return o.value === suggested;
      });
      if (match) {
        select.value = suggested;
        var hint = document.getElementById('prefillHint');
        if (hint) {
          hint.textContent = 'Pre-filled because you were looking at ' + suggested + '. Change it if you like.';
          hint.style.display = 'block';
        }
      }
    }

    // ---- push form state into ZCC as the customer fills it in -----------

    // Look fields up by id rather than form.<name> — named access collides with
    // real HTMLFormElement properties (form.children is the DOM child list, not
    // the "children" input).
    function v(id) {
      var el = document.getElementById(id);
      return el ? el.value : '';
    }

    function snapshot() {
      var extras = Array.prototype.slice
        .call(form.querySelectorAll('input[name="extras"]:checked'))
        .map(function (c) { return c.value; });

      var occasion = form.querySelector('input[name="occasion"]:checked');
      var filled = Array.prototype.slice
        .call(form.querySelectorAll('input, select, textarea'))
        .filter(function (el) {
          if (el.type === 'checkbox' || el.type === 'radio') return el.checked;
          return el.value && el.value.trim() !== '';
        }).length;

      return {
        enquiryRef: ref,
        formDestination: v('destination'),
        formTravelMonth: v('travelMonth'),
        formNights: v('nights'),
        formAirport: v('airport'),
        formParty: v('adults') + ' adults, ' + v('children') + ' children',
        formBudget: v('budget'),
        formOccasion: occasion ? occasion.value : '',
        formExtras: extras.join(', '),
        formName: (v('firstName') + ' ' + v('lastName')).trim(),
        formEmail: v('email'),
        formPhone: v('phone'),
        formFieldsCompleted: String(filled),
        formStatus: form.dataset.status || 'in progress'
      };
    }

    function push() {
      if (typeof window.tropicalUpdate === 'function') window.tropicalUpdate(snapshot());
    }

    // 'change' rather than 'input' — we don't need a param update per keystroke.
    form.addEventListener('change', push);
    form.addEventListener('blur', push, true);
    push();

    // ---- submit (no backend) --------------------------------------------
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      form.dataset.status = 'submitted';
      push();

      var thanks = document.getElementById('thanks');
      if (thanks) thanks.style.display = 'block';
      form.style.display = 'none';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // ---- clear -----------------------------------------------------------
    var clear = document.getElementById('resetForm');
    if (clear) {
      clear.addEventListener('click', function () {
        form.reset();
        form.dataset.status = 'in progress';
        push();
      });
    }
  });
})();
