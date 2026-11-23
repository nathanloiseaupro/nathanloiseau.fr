/* Kervalen : parcours de demande d'intervention en cinq étapes. */
(function () {
  'use strict';
  var form = document.querySelector('[data-form]');
  if (!form) return;

  var COMMUNES = ['Acigné', 'Bécherel', 'Betton', 'Bourgbarré', 'Brécé', 'Bruz', 'Cesson-Sévigné', 'Chantepie', 'Chartres-de-Bretagne', 'Chavagne', 'Chevaigné', 'Cintré', 'Clayes', 'Corps-Nuds', 'Gévezé', 'La Chapelle-Chaussée', 'La Chapelle-des-Fougeretz', 'La Chapelle-Thouarault', 'Laillé', 'Langan', 'Le Rheu', 'Le Verger', 'L’Hermitage', 'Miniac-sous-Bécherel', 'Montgermont', 'Mordelles', 'Nouvoitou', 'Noyal-Châtillon-sur-Seiche', 'Orgères', 'Pacé', 'Parthenay-de-Bretagne', 'Pont-Péan', 'Rennes', 'Romillé', 'Saint-Armel', 'Saint-Erblon', 'Saint-Gilles', 'Saint-Grégoire', 'Saint-Jacques-de-la-Lande', 'Saint-Sulpice-la-Forêt', 'Thorigné-Fouillard', 'Vern-sur-Seiche', 'Vezin-le-Coquet'];
  var MOTIFS = {
    fuite: 'Une fuite d’eau', eau: 'Plus d’eau chaude', chaudiere: 'La chaudière ne démarre plus',
    bouche: 'Un évier ou des WC bouchés', entretien: 'L’entretien annuel de la chaudière', projet: 'Un projet', autre: 'Autre chose'
  };
  var PRIX = {
    fuite: 'Déplacement 45 €. En général 110 à 180 € pour un raccord sous évier.',
    eau: 'Déplacement 45 €. Résistance remplacée : 160 à 240 €.',
    chaudiere: 'Déplacement 45 € avec diagnostic, puis 62 € de l’heure et les pièces.',
    bouche: '90 à 160 €, déplacement compris.',
    entretien: '140 €, déplacement et attestation compris.',
    projet: 'Visite et devis gratuits.',
    autre: 'Déplacement 45 €, diagnostic compris.'
  };
  var JOURS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  var MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  var reduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var steps = Array.prototype.slice.call(form.querySelectorAll('[data-step]'));
  var stepItems = Array.prototype.slice.call(document.querySelectorAll('[data-steplist] li'));
  var nav = form.querySelector('[data-navsteps]');
  var prev = form.querySelector('[data-prev]');
  var next = form.querySelector('[data-next]');
  var submit = form.querySelector('[data-submit]');
  var courant = 1, atteint = 1;

  function norm(s) { return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’'`]/g, ' ').replace(/[^a-z0-9]+/g, ' ').replace(/\bst\b/g, 'saint').trim(); }
  function val(n) { var el = form.elements[n]; if (!el) return ''; return (el.value || '').trim(); }
  function radio(n) { var el = form.querySelector('input[name="' + n + '"]:checked'); return el ? el.value : ''; }

  /* ---------- Navigation ---------- */
  function afficher(n, recul) {
    courant = n; atteint = Math.max(atteint, n);
    steps.forEach(function (s) {
      var on = +s.dataset.step === n;
      s.classList.toggle('is-current', on);
      s.classList.toggle('is-back', on && !!recul);
    });
    stepItems.forEach(function (li, i) {
      var k = i + 1;
      li.classList.toggle('is-current', k === n);
      li.classList.toggle('is-done', k < atteint && k !== n || (k < n));
      var b = li.querySelector('button');
      b.setAttribute('aria-current', k === n ? 'step' : 'false');
      b.disabled = k > atteint;
    });
    nav.classList.toggle('is-first', n === 1);
    nav.classList.toggle('is-last', n === steps.length);
    var lg = steps[n - 1].querySelector('legend');
    if (lg && document.activeElement !== document.body) {
      lg.setAttribute('tabindex', '-1');
      lg.focus({ preventScroll: true });
    }
    var y = form.getBoundingClientRect().top + window.scrollY - 140;
    if (window.scrollY > y) window.scrollTo({ top: Math.max(0, y), behavior: reduit ? 'auto' : 'smooth' });
  }

  function erreur(nom, montre, champ) {
    var e = form.querySelector('[data-err="' + nom + '"]');
    if (e) e.hidden = !montre;
    if (champ) champ.setAttribute('aria-invalid', montre ? 'true' : 'false');
    return !montre;
  }

  function telOk(v) { var d = v.replace(/[^\d+]/g, '').replace(/^\+33/, '0').replace(/^0033/, '0'); return /^0\d{9}$/.test(d); }
  function mailOk(v) { return !v || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v); }

  function valider(n) {
    if (n === 1) return erreur('motif', !radio('motif'));
    if (n === 3) return erreur('commune', !val('commune'), form.elements.commune);
    if (n === 4) {
      if (radio('quand') !== 'choix') return erreur('slots', false);
      return erreur('slots', !form.querySelector('[data-slots-grid] input:checked'));
    }
    if (n === 5) {
      var a = erreur('nom', !val('nom'), form.elements.nom);
      var b = erreur('tel', !telOk(val('tel')), form.elements.tel);
      var c = erreur('email', !mailOk(val('email')), form.elements.email);
      return a && b && c;
    }
    return true;
  }

  function premierInvalide(n) {
    var s = steps[n - 1];
    var el = s.querySelector('[aria-invalid="true"]') || s.querySelector('.err:not([hidden])');
    if (el && el.classList.contains('err')) {
      var i = s.querySelector('input'); if (i) i.focus();
    } else if (el) el.focus();
  }

  next.addEventListener('click', function () {
    if (!valider(courant)) { premierInvalide(courant); return; }
    afficher(courant + 1);
  });
  prev.addEventListener('click', function () { if (courant > 1) afficher(courant - 1, true); });
  stepItems.forEach(function (li, i) {
    li.querySelector('button').addEventListener('click', function () {
      var k = i + 1;
      if (k === courant || k > atteint) return;
      if (k > courant && !valider(courant)) { premierInvalide(courant); return; }
      afficher(k, k < courant);
    });
  });
  form.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && e.target.tagName === 'INPUT' && e.target.type !== 'file' && courant < steps.length) {
      e.preventDefault(); next.click();
    }
  });

  /* Validation au départ du champ, sans effacer la saisie */
  ['nom', 'tel', 'email', 'commune'].forEach(function (n) {
    var el = form.elements[n];
    el.addEventListener('blur', function () {
      if (!el.value.trim() && n !== 'email' && el.getAttribute('aria-invalid') !== 'true') return;
      if (n === 'tel') erreur('tel', !telOk(el.value), el);
      if (n === 'email') erreur('email', !mailOk(el.value.trim()), el);
      if (n === 'nom') erreur('nom', !el.value.trim(), el);
    });
    el.addEventListener('input', function () { if (el.getAttribute('aria-invalid') === 'true') { var ok = n === 'tel' ? telOk(el.value) : n === 'email' ? mailOk(el.value.trim()) : !!el.value.trim(); if (ok) erreur(n, false, el); } });
  });

  /* ---------- Étape 1 et 2 : situation et précisions ---------- */
  function majConditions() {
    var m = radio('motif');
    form.querySelectorAll('[data-if]').forEach(function (c) { c.classList.toggle('is-on', c.dataset.if === m); });
    form.querySelector('[data-urgent]').hidden = !(m === 'fuite' && radio('coule') === 'oui');
    form.querySelector('[data-colonne]').hidden = radio('ou') !== 'plusieurs appareils';
  }
  form.addEventListener('change', function (e) {
    if (e.target.name === 'motif') { erreur('motif', false); }
    if (e.target.name === 'motif' && courant === 1) { setTimeout(function () { afficher(2); }, reduit ? 0 : 260); }
    if (e.target.name === 'quand') { form.querySelector('[data-slots]').hidden = radio('quand') !== 'choix'; erreur('slots', false); }
    majConditions(); recap();
  });
  form.addEventListener('input', recap);

  /* Photo */
  var photo = form.querySelector('[data-photo]');
  var prevBox = form.querySelector('[data-preview]');
  var url = null;
  photo.addEventListener('change', function () {
    var f = photo.files && photo.files[0];
    if (url) URL.revokeObjectURL(url);
    if (!f) { prevBox.hidden = true; return; }
    url = URL.createObjectURL(f);
    form.querySelector('[data-preview-img]').src = url;
    form.querySelector('[data-preview-img]').alt = 'Aperçu de votre photo';
    form.querySelector('[data-preview-name]').textContent = f.name;
    prevBox.hidden = false; recap();
  });
  form.querySelector('[data-preview-del]').addEventListener('click', function () {
    photo.value = ''; prevBox.hidden = true; if (url) URL.revokeObjectURL(url); photo.focus(); recap();
  });

  /* ---------- Étape 3 : commune ---------- */
  var dl = document.querySelector('[data-communes-list]');
  COMMUNES.forEach(function (c) { var o = document.createElement('option'); o.value = c; dl.appendChild(o); });
  var zoneOut = form.querySelector('[data-zone-out]');
  function zone() {
    var q = norm(val('commune'));
    if (q.length < 2) { zoneOut.textContent = ''; return null; }
    var exact = COMMUNES.filter(function (c) { return norm(c) === q; });
    var debut = COMMUNES.filter(function (c) { return norm(c).indexOf(q) === 0; });
    if (exact.length || (debut.length === 1 && q.length >= 4)) {
      var nom = exact[0] || debut[0];
      zoneOut.innerHTML = '<span class="yes">Nous intervenons à ' + nom + '.</span> Déplacement 45 €.';
      return nom;
    }
    if (!debut.length && q.length >= 4) {
      zoneOut.innerHTML = '<span class="no">Hors de notre zone habituelle.</span> Envoyez quand même votre demande&nbsp;: nous vous dirons au téléphone si nous pouvons venir.';
      return false;
    }
    zoneOut.textContent = '';
    return null;
  }
  form.elements.commune.addEventListener('input', function () { zone(); erreur('commune', false, form.elements.commune); });

  /* ---------- Étape 4 : créneaux sur les six prochains jours ouverts ---------- */
  var grid = form.querySelector('[data-slots-grid]');
  (function () {
    var d = new Date(); var n = 0; var html = '';
    d.setHours(12, 0, 0, 0);
    while (n < 6) {
      d.setDate(d.getDate() + 1);
      var j = d.getDay();
      if (j === 0) continue;
      var id = 'j' + n;
      var lib = JOURS[j] + ' ' + d.getDate();
      var parts = j === 6 ? [['matin', 'Matin, 9 h à 12 h']] : [['matin', 'Matin, 8 h à 12 h'], ['après-midi', 'Après-midi, 14 h à 18 h']];
      html += '<div class="day"><b>' + lib + '</b><small>' + MOIS[d.getMonth()] + '</small>' +
        parts.map(function (p) { return '<label><input type="checkbox" name="creneau" value="' + lib + ' ' + p[0] + '" data-lib="' + lib + ', ' + p[0] + '">' + p[1] + '</label>'; }).join('') + '</div>';
      n++;
    }
    grid.innerHTML = html;
  })();

  /* ---------- Récapitulatif ---------- */
  var R = {};
  document.querySelectorAll('[data-r]').forEach(function (el) { R[el.dataset.r] = el; });
  var memo = {};
  function poser(k, texte, vide) {
    var el = R[k];
    var t = texte || vide;
    if (memo[k] === t) return;
    var avant = memo[k];
    memo[k] = t;
    el.textContent = t;
    el.classList.toggle('empty', !texte);
    if (avant !== undefined && texte && !reduit) { el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); }
  }
  function recap() {
    var m = radio('motif');
    poser('motif', MOTIFS[m], 'À choisir');
    var p = [];
    if (m === 'fuite' && radio('coule')) p.push(radio('coule') === 'oui' ? 'L’eau coule en ce moment' : 'Eau coupée ou goutte-à-goutte');
    if (m === 'eau' && radio('source')) p.push('Eau chaude fournie par ' + radio('source'));
    if (m === 'chaudiere') { if (val('marque')) p.push(val('marque')); if (val('code')) p.push('code ' + val('code')); }
    if (m === 'bouche' && radio('ou')) p.push('Bouché : ' + radio('ou'));
    if (m === 'entretien' && val('dernier')) p.push('Dernier entretien ' + val('dernier').charAt(0).toLowerCase() + val('dernier').slice(1));
    if (m === 'projet' && radio('projet')) p.push('Pour ' + radio('projet'));
    if (val('details')) p.push('« ' + (val('details').length > 70 ? val('details').slice(0, 70) + '…' : val('details')) + ' »');
    if (photo.files && photo.files[0]) p.push('Photo jointe');
    poser('precisions', p.join('. '), 'Aucune pour l’instant');
    var c = val('commune');
    var lieu = [val('adresse'), c].filter(Boolean).join(', ');
    if (radio('logement')) lieu += (lieu ? ' (' + radio('logement') + ')' : radio('logement').charAt(0).toUpperCase() + radio('logement').slice(1));
    poser('lieu', lieu, 'À indiquer');
    if (radio('quand') === 'choix') {
      var cs = Array.prototype.map.call(grid.querySelectorAll('input:checked'), function (i) { return i.dataset.lib; });
      poser('quand', cs.length ? cs.join(' · ') : 'Créneaux à cocher', 'Créneaux à cocher');
    } else poser('quand', 'Dès que possible', 'Dès que possible');
    var contact = [val('nom'), val('tel')].filter(Boolean).join(', ');
    poser('contact', contact, 'À indiquer');
    poser('prix', PRIX[m] || 'Déplacement 45 €, diagnostic compris.', '');
  }

  /* ---------- Rappel annoncé ---------- */
  var r = window.Kervalen ? window.Kervalen.rappel() : null;
  var rec = document.querySelector('[data-callback-recap]');
  if (r && rec) rec.textContent = 'Nous vous rappelons ' + r.texte + ', puis nous fixons ensemble un créneau de deux heures.';

  /* ---------- Envoi ---------- */
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    for (var k = 1; k <= steps.length; k++) {
      if (!valider(k)) { afficher(k); premierInvalide(k); return; }
    }
    submit.classList.add('is-busy');
    submit.firstChild.textContent = 'Envoi en cours';
    setTimeout(function () {
      form.hidden = true;
      document.querySelector('[data-steplist]').hidden = true;
      var done = document.querySelector('[data-done]');
      var tel = val('tel');
      done.querySelector('[data-done-text]').textContent = 'Nous vous rappelons ' + (r ? r.texte : 'dans l’heure pendant nos horaires') + ' au ' + tel + '. Si c’est urgent entre-temps, appelez-nous directement.';
      done.hidden = false;
      done.focus();
      window.scrollTo({ top: Math.max(0, done.getBoundingClientRect().top + window.scrollY - 120), behavior: reduit ? 'auto' : 'smooth' });
    }, reduit ? 0 : 700);
  });

  /* ---------- Démarrage, avec la situation transmise par l'accueil ---------- */
  var q = new URLSearchParams(location.search).get('motif');
  if (q && MOTIFS[q]) {
    var el = form.querySelector('input[name="motif"][value="' + q + '"]');
    if (el) { el.checked = true; atteint = 2; }
  }
  majConditions(); recap();
  // Pas de focus au chargement : on ne déplace pas la page.
  courant = q && MOTIFS[q] ? 2 : 1;
  steps.forEach(function (s) { s.classList.toggle('is-current', +s.dataset.step === courant); });
  stepItems.forEach(function (li, i) {
    var k = i + 1;
    li.classList.toggle('is-current', k === courant);
    li.classList.toggle('is-done', k < courant);
    var b = li.querySelector('button'); b.disabled = k > atteint; b.setAttribute('aria-current', k === courant ? 'step' : 'false');
  });
  nav.classList.toggle('is-first', courant === 1);
})();
