/* Kervalen : éléments communs aux pages (heure de rappel, en-tête, barre d'appel). */
(function () {
  'use strict';

  var JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  // Horaires en minutes depuis minuit, par jour de la semaine (0 = dimanche).
  var HORAIRES = { 1: [480, 1110], 2: [480, 1110], 3: [480, 1110], 4: [480, 1110], 5: [480, 1110], 6: [540, 720] };

  function maintenantParis() {
    var parts = new Intl.DateTimeFormat('fr-FR', {
      timeZone: 'Europe/Paris', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
    }).formatToParts(new Date());
    var o = {};
    parts.forEach(function (p) { o[p.type] = p.value; });
    var map = { dim: 0, lun: 1, mar: 2, mer: 3, jeu: 4, ven: 5, sam: 6 };
    var jour = map[(o.weekday || '').replace('.', '').slice(0, 3)];
    if (jour === undefined) jour = new Date().getDay();
    return { jour: jour, min: parseInt(o.hour, 10) * 60 + parseInt(o.minute, 10) };
  }

  function heure(m) {
    var h = Math.floor(m / 60), mn = m % 60;
    return h + ' h' + (mn ? ' ' + (mn < 10 ? '0' : '') + mn : '');
  }

  // Calcule l'heure limite de rappel pour une demande envoyée maintenant.
  function rappel() {
    var t = maintenantParis();
    var h = HORAIRES[t.jour];
    if (h && t.min >= h[0] && t.min < h[1] - 15) {
      var limite = Math.min(Math.ceil((t.min + 60) / 10) * 10, h[1]);
      return { ouvert: true, quand: 'aujourd’hui', heure: limite, texte: 'aujourd’hui avant ' + heure(limite) };
    }
    // Prochaine ouverture.
    for (var i = 0; i < 8; i++) {
      var j = (t.jour + i) % 7, hj = HORAIRES[j];
      if (!hj) continue;
      if (i === 0 && t.min >= hj[0]) continue;
      var quand = i === 0 ? 'aujourd’hui' : (i === 1 ? 'demain' : JOURS[j]);
      var lim = hj[0] + 60;
      return { ouvert: false, quand: quand, heure: lim, ouverture: hj[0], texte: quand + ' avant ' + heure(lim) };
    }
    return { ouvert: false, texte: 'dès notre réouverture' };
  }

  window.Kervalen = { rappel: rappel, heure: heure };

  var r = rappel();
  document.querySelectorAll('[data-status]').forEach(function (el) {
    el.textContent = r.ouvert ? 'Ouvert, rappel avant ' + heure(r.heure) : 'Fermé, rappel ' + r.texte;
  });
  document.querySelectorAll('[data-status-wrap]').forEach(function (el) { el.classList.toggle('is-open', r.ouvert); });
  document.querySelectorAll('[data-callback]').forEach(function (el) {
    el.textContent = 'Si vous écrivez maintenant, nous vous rappelons ' + r.texte + '.';
  });
  document.querySelectorAll('[data-callback-hero]').forEach(function (el) {
    el.textContent = 'Nous vous rappelons ' + r.texte + '.';
  });
  document.querySelectorAll('[data-callback-short]').forEach(function (el) {
    el.textContent = 'Pour une demande envoyée maintenant, rappel ' + r.texte + '.';
  });
  document.querySelectorAll('[data-stamp]').forEach(function (el) { el.textContent = r.texte; });

  // En-tête : filet sous la barre une fois la page défilée.
  var top = document.querySelector('[data-top]');
  var bar = document.querySelector('[data-callbar]');
  function onScroll() {
    var y = window.scrollY;
    if (top) top.classList.toggle('is-scrolled', y > 8);
    if (bar) bar.classList.toggle('is-on', y > 520);
  }
  if (bar) document.body.classList.add('has-callbar');
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  requestAnimationFrame(function () { document.documentElement.classList.add('is-ready'); });
})();
