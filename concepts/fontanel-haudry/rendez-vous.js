(function () {
  var form = document.getElementById('rdv');
  if (!form) return;
  var NB = ' ';
  var panels = form.querySelectorAll('.panel');
  var marks = document.querySelectorAll('.track-steps li');
  var step = 1, day = null, slot = null;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var SIT = {
    creation: { label: 'Création d’entreprise', host: 'b', bring: ['Votre projet en quelques lignes\u00a0: activité, clients visés, premiers mois', 'Le montant que vous pensez apporter au capital', 'Vos questions sur votre future rémunération'] },
    changement: { label: 'Changement de cabinet', host: 'c', bring: ['Vos deux derniers comptes annuels et liasses fiscales', 'Votre lettre de mission actuelle, pour vérifier le préavis', 'Un relevé bancaire récent'] },
    premier: { label: 'Premier expert-comptable', host: 'b', bring: ['Vos dernières déclarations de chiffre d’affaires ou de TVA', 'Un relevé bancaire récent', 'Les statuts de la société, si elle est créée'] },
    ponctuel: { label: 'Mission ponctuelle', host: 'c', bring: ['Les derniers comptes annuels de la société', 'Le courrier ou la demande à l’origine de la mission', 'Les échéances que vous devez respecter'] }
  };
  var HOST = { c: { name: 'Claire Fontanel', img: 'img/visage-claire-fontanel.jpg', pos: '50% 50%' }, b: { name: 'Bertrand Haudry', img: 'img/visage-bertrand-haudry.jpg', pos: '50% 50%' } };
  var FORME = { micro: 'Micro-entreprise', ei: 'Entreprise individuelle', uni: 'EURL ou SASU', pme: 'SARL ou SAS', nsp: 'Forme à choisir' };
  var FORMAT = { cabinet: 'Au cabinet, à Vincennes', visio: 'En visio', telephone: 'Par téléphone' };
  var JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  var MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  var ABR = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
  var SLOTS = ['9:00', '10:00', '11:30', '14:00', '15:30', '17:00'];

  function v(n) { var c = form.querySelector('[name="' + n + '"]:checked'); return c ? c.value : null; }
  function $(s) { return document.querySelector(s); }
  function hour(s) { var p = s.split(':'); return p[0] + NB + 'h' + (p[1] !== '00' ? NB + p[1] : ''); }
  function longDate(d) { return JOURS[d.getDay()] + ' ' + d.getDate() + (d.getDate() === 1 ? 'er' : '') + ' ' + MOIS[d.getMonth()]; }

  /* Paramètres venant de l'estimation ou d'un lien */
  var params = new URLSearchParams(location.search);
  if (params.get('situation') && SIT[params.get('situation')]) form.querySelector('[name="situation"][value="' + params.get('situation') + '"]').checked = true;
  var est = null;
  if (params.get('est')) { var e = params.get('est').split('-'); est = { low: +e[0], high: +e[1] }; }
  if (params.get('forme')) { var f = form.querySelector('[name="forme"][value="' + params.get('forme') + '"]'); if (f) f.checked = true; }
  if (params.get('sal')) { var s = +params.get('sal'), sel = form.salaries; sel.value = s === 0 ? '0' : s <= 2 ? '1' : s <= 5 ? '3' : s <= 10 ? '6' : s <= 20 ? '11' : '21'; }
  if (est) { var n = $('[data-est-note]'); n.hidden = false; n.textContent = 'Votre estimation\u00a0: ' + est.low.toLocaleString('fr-FR').replace(/\u202f/g, NB) + ' à ' + est.high.toLocaleString('fr-FR').replace(/\u202f/g, NB) + NB + '€ HT par an. Nous la vérifions avec vous pendant le rendez-vous.'; }

  /* Jours ouvrés à venir */
  var days = [], d = new Date(); d.setHours(12, 0, 0, 0);
  while (days.length < 10) { d.setDate(d.getDate() + 1); if (d.getDay() > 0 && d.getDay() < 6) days.push(new Date(d)); }
  function seed(dt, k) { var x = Math.sin(dt.getDate() * 12.9898 + dt.getMonth() * 78.233 + k * 4.1) * 43758.5453; return x - Math.floor(x); }
  function freeSlots(dt) { return SLOTS.map(function (s, k) { return { s: s, free: seed(dt, k) > 0.38 }; }); }
  var dayWrap = $('[data-days]'), slotWrap = $('[data-slots]');
  days.forEach(function (dt, i) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'day'; b.setAttribute('aria-pressed', 'false');
    var full = freeSlots(dt).every(function (x) { return !x.free; });
    if (full) { b.classList.add('full'); b.disabled = true; }
    b.innerHTML = '<span class="dw">' + JOURS[dt.getDay()].slice(0, 3) + '.</span><span class="dn">' + dt.getDate() + '</span><span class="dm">' + ABR[dt.getMonth()] + '</span>';
    b.setAttribute('aria-label', longDate(dt) + (full ? ', complet' : ''));
    b.addEventListener('click', function () { pickDay(i); });
    dayWrap.appendChild(b);
  });
  function pickDay(i) {
    day = i; slot = null;
    dayWrap.querySelectorAll('.day').forEach(function (b, k) { b.setAttribute('aria-pressed', k === i ? 'true' : 'false'); });
    $('[data-slot-day]').textContent = '· ' + longDate(days[i]);
    slotWrap.innerHTML = '';
    freeSlots(days[i]).forEach(function (x) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'slot num'; b.textContent = hour(x.s); b.setAttribute('aria-pressed', 'false');
      if (!x.free) { b.disabled = true; b.setAttribute('aria-label', hour(x.s) + ', déjà pris'); }
      b.addEventListener('click', function () { slot = x.s; slotWrap.querySelectorAll('.slot').forEach(function (o) { o.setAttribute('aria-pressed', o === b ? 'true' : 'false'); }); $('[data-err="3"]').style.display = 'none'; recap(); });
      slotWrap.appendChild(b);
    });
    recap();
  }
  var first = days.findIndex(function (dt) { return freeSlots(dt).some(function (x) { return x.free; }); });
  pickDay(first < 0 ? 0 : first);

  /* Récapitulatif */
  function setR(k, text, empty) { var el = $('[data-r="' + k + '"]'); el.textContent = text; el.classList.toggle('empty', !!empty); }
  function hostKey() { var s = v('situation'); return s ? SIT[s].host : null; }
  function recap() {
    var s = v('situation');
    setR('situation', s ? SIT[s].label : 'À choisir', !s);
    var sal = form.salaries.options[form.salaries.selectedIndex].text;
    setR('entreprise', step > 1 || params.get('forme') ? FORME[v('forme')] + ', ' + (sal === 'Aucun' ? 'sans salarié' : sal.toLowerCase() + ' salariés') : 'À préciser', !(step > 1 || params.get('forme')));
    setR('format', FORMAT[v('format')]);
    setR('date', day !== null && slot ? longDate(days[day]) + ' à ' + hour(slot) : (day !== null ? longDate(days[day]) + ', heure à choisir' : 'À choisir'), !slot);
    var h = hostKey();
    $('[data-host-name]').textContent = h ? HOST[h].name : 'l’un des deux associés';
    document.querySelectorAll('.host-faces img').forEach(function (im) { im.classList.toggle('off', !!h && im.dataset.k !== h); });
    document.querySelectorAll('[data-only]').forEach(function (el) { el.hidden = el.dataset.only !== s; });
    var phone = v('format') === 'telephone';
    $('[data-tel-opt]').textContent = phone ? '(pour vous appeler)' : '(facultatif)';
    form.tel.required = phone;
  }
  form.addEventListener('change', recap);

  /* Validation */
  function check(input) {
    var f = input.closest('.field'), ok = true, val = input.value.trim();
    if (input.required && !val) ok = false;
    if (ok && input.type === 'email' && val) ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val);
    if (ok && input.type === 'tel' && val) ok = val.replace(/[\s.\-]/g, '').replace(/^\+33/, '0').length === 10;
    if (input.type === 'email') f.querySelector('.err').textContent = val ? 'Vérifiez l’adresse, par exemple prenom@societe.fr.' : 'Indiquez votre adresse de courriel.';
    f.classList.toggle('bad', !ok);
    input.setAttribute('aria-invalid', ok ? 'false' : 'true');
    return ok;
  }
  form.querySelectorAll('[data-step="4"] input').forEach(function (i) {
    i.addEventListener('blur', function () { if (i.value || i.closest('.field').classList.contains('bad')) check(i); });
    i.addEventListener('input', function () { if (i.closest('.field').classList.contains('bad')) check(i); });
  });

  function valid(n) {
    if (n === 1) { var ok = !!v('situation'); $('[data-err="1"]').style.display = ok ? 'none' : 'block'; return ok; }
    if (n === 3) { var ok3 = day !== null && !!slot; $('[data-err="3"]').style.display = ok3 ? 'none' : 'block'; return ok3; }
    if (n === 4) { var all = true, firstBad = null; form.querySelectorAll('[data-step="4"] input').forEach(function (i) { if (!check(i)) { all = false; firstBad = firstBad || i; } }); if (firstBad) firstBad.focus(); return all; }
    return true;
  }

  function go(n) {
    step = n;
    panels.forEach(function (p) { p.classList.toggle('active', +p.dataset.step === n); });
    marks.forEach(function (m, k) { m.classList.toggle('on', k + 1 === n); m.classList.toggle('done', k + 1 < n); });
    recap();
    var top = document.querySelector('.track-steps').getBoundingClientRect().top + window.scrollY - 96;
    if (window.scrollY > top) window.scrollTo({ top: top, behavior: reduce ? 'auto' : 'smooth' });
    var h = form.querySelector('.panel.active h2');
    if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
  }
  form.addEventListener('click', function (e) {
    if (e.target.closest('[data-next]')) { if (valid(step)) go(step + 1); }
    if (e.target.closest('[data-prev]')) go(step - 1);
  });
  form.querySelectorAll('[name="situation"]').forEach(function (r) { r.addEventListener('change', function () { $('[data-err="1"]').style.display = 'none'; }); });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!valid(4)) return;
    var s = v('situation'), h = HOST[SIT[s].host], dt = days[day];
    var where = { cabinet: 'au cabinet, 22 rue de Montreuil à Vincennes', visio: 'en visio\u00a0; le lien vous parviendra avec la confirmation', telephone: 'par téléphone\u00a0; ' + h.name.split(' ')[0] + ' vous appellera au ' + form.tel.value.trim() }[v('format')];
    $('[data-done-title]').textContent = 'Merci, ' + form.prenom.value.trim() + '. Votre demande est enregistrée.';
    $('[data-done-text]').textContent = 'Rendez-vous demandé le ' + longDate(dt) + ' à ' + hour(slot) + ', ' + where + '. ' + h.name + ' vous le confirme par courriel à ' + form.email.value.trim() + ' avant la fin de la journée ouvrée.';
    $('[data-bring]').innerHTML = SIT[s].bring.map(function (b) { return '<li>' + b + '</li>'; }).join('');
    marks.forEach(function (m) { m.classList.remove('on'); m.classList.add('done'); });
    panels.forEach(function (p) { p.classList.toggle('active', p.dataset.step === '5'); });
    form.querySelector('[data-step="5"]').focus({ preventScroll: true });
    var top = document.querySelector('.track-steps').getBoundingClientRect().top + window.scrollY - 96;
    window.scrollTo({ top: Math.max(0, top), behavior: reduce ? 'auto' : 'smooth' });

    $('[data-ics]').onclick = function () {
      var p = slot.split(':'), st = new Date(dt); st.setHours(+p[0], +p[1], 0, 0);
      var en = new Date(st.getTime() + 45 * 60000);
      function z(x) { return x.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, ''); }
      var ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Fontanel Haudry//RDV//FR', 'BEGIN:VEVENT', 'UID:' + Date.now() + '@fontanel-haudry.fr', 'DTSTAMP:' + z(new Date()), 'DTSTART:' + z(st), 'DTEND:' + z(en), 'SUMMARY:Premier rendez-vous avec ' + h.name, 'LOCATION:' + (v('format') === 'cabinet' ? '22 rue de Montreuil\\, 94300 Vincennes' : FORMAT[v('format')]), 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
      var a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
      a.download = 'rendez-vous-fontanel-haudry.ics';
      document.body.appendChild(a); a.click(); a.remove();
    };
  });

  recap();
})();
