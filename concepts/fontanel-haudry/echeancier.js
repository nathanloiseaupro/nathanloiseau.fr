/* Échéancier type : société à l'IS, exercice clos le 31 décembre, TVA mensuelle, salariés. */
(function () {
  var root = document.getElementById('echeancier');
  if (!root) return;

  var TVA = { d: 'Entre le 15 et le 24', t: 'Déclaration de TVA du mois précédent', s: 'Nous la préparons, vous la validez avant l’envoi', w: 'nous' };
  var DSN = { d: 'Le 15', t: 'DSN des salaires du mois précédent', s: 'Bulletins établis à partir des absences et primes reçues avant le 20', w: 'nous' };
  var PIECES = { d: 'Avant le 10', t: 'Dépôt de vos factures du mois', s: 'Depuis votre téléphone, dans votre espace', w: 'vous' };

  var M = [
    { n: 'Janvier', tag: 'Ouverture de la clôture', rows: [PIECES, { d: 'Début janvier', t: 'Inventaire des stocks au 31 décembre', s: 'Comptage et valorisation, nous vous envoyons le modèle', w: 'vous' }, DSN, TVA], foot: 'L’exercice est clos. Les pièces de décembre arrivent jusqu’au 10.' },
    { n: 'Février', tag: 'Révision', rows: [PIECES, { d: 'Tout le mois', t: 'Révision des comptes de l’exercice', s: 'Rapprochements, factures à recevoir, charges constatées d’avance', w: 'nous' }, DSN, TVA], foot: 'Vous recevez une seule liste des questions en suspens, pas dix messages.' },
    { n: 'Mars', tag: 'Bilan présenté', rows: [PIECES, { d: 'Le 15', t: 'Acompte d’impôt sur les sociétés', s: 'Nous le calculons, vous le payez sur votre espace professionnel', w: 'ens' }, { d: 'Fin mars', t: 'Rendez-vous de présentation du bilan', s: 'Une heure pour lire vos comptes et parler de l’année qui vient', w: 'ens' }, DSN, TVA], foot: 'Le bilan vous est expliqué avant d’être déposé.' },
    { n: 'Avril', tag: 'Comptes annuels', rows: [PIECES, { d: 'Mi-avril', t: 'Comptes annuels et attestation de présentation', s: 'Bilan, compte de résultat et annexe, signés par l’associé', w: 'nous' }, DSN, TVA], foot: 'Les comptes sont prêts pour la banque si elle les demande.' },
    { n: 'Mai', tag: 'Liasse fiscale', rows: [PIECES, { d: 'Le 15', t: 'Solde de l’impôt sur les sociétés', s: 'Relevé de solde préparé par nos soins', w: 'ens' }, { d: 'Vers le 20', t: 'Liasse fiscale et déclaration de résultat', s: 'Télétransmise par le cabinet, avec la déclaration des honoraires versés', w: 'nous' }, DSN, TVA], foot: 'Date limite de dépôt en ligne pour un exercice clos le 31 décembre.' },
    { n: 'Juin', tag: 'Approbation', rows: [PIECES, { d: 'Avant le 30', t: 'Approbation des comptes par les associés', s: 'Nous rédigeons le procès-verbal, vous le signez', w: 'ens' }, { d: 'Le 15', t: 'Acompte d’impôt sur les sociétés', s: 'Calculé par le cabinet', w: 'ens' }, DSN, TVA], foot: 'Six mois après la clôture, au plus tard.' },
    { n: 'Juillet', tag: 'Dépôt au greffe', rows: [PIECES, { d: 'Dans le mois', t: 'Dépôt des comptes au greffe', s: 'Avec la demande de confidentialité si votre société y a droit', w: 'nous' }, DSN, TVA], foot: 'Un mois après l’approbation, deux mois en dépôt électronique.' },
    { n: 'Août', tag: 'Mois calme', rows: [PIECES, DSN, TVA], foot: 'Rien d’autre ce mois-ci. Le cabinet reste joignable tout l’été.' },
    { n: 'Septembre', tag: 'Rentrée', rows: [PIECES, { d: 'Le 15', t: 'Acompte d’impôt sur les sociétés', s: 'Calculé par le cabinet', w: 'ens' }, { d: 'Sur demande', t: 'Situation intermédiaire à six mois', s: 'Utile avant de parler à votre banque', w: 'ens' }, DSN, TVA], foot: 'Le bon moment pour vérifier que l’année suit la trajectoire prévue.' },
    { n: 'Octobre', tag: 'Rémunération', rows: [PIECES, { d: 'Courant octobre', t: 'Point sur votre rémunération de dirigeant', s: 'Salaire, dividendes, investissements à décider avant la clôture', w: 'ens' }, DSN, TVA], foot: 'Après le 31 décembre, il sera trop tard pour choisir.' },
    { n: 'Novembre', tag: 'Préparer la clôture', rows: [PIECES, { d: 'Fin novembre', t: 'Liste de préparation de la clôture', s: 'Stocks, factures non reçues, travaux en cours', w: 'nous' }, DSN, TVA], foot: 'Une clôture préparée en novembre se passe sans relance en janvier.' },
    { n: 'Décembre', tag: 'Fin d’exercice', rows: [PIECES, { d: 'Le 15', t: 'Cotisation foncière des entreprises', s: 'Nous vérifions l’avis, vous la payez en ligne', w: 'vous' }, { d: 'Le 15', t: 'Acompte d’impôt sur les sociétés', s: 'Calculé par le cabinet', w: 'ens' }, DSN, TVA], foot: 'Le 31 décembre, l’exercice se termine et le cycle recommence.' }
  ];
  var WHO = { nous: 'Le cabinet', vous: 'Vous', ens: 'Ensemble' };

  var list = root.querySelector('.months');
  var rows = root.querySelector('[data-rows]');
  var title = root.querySelector('[data-month-title]');
  var tag = root.querySelector('[data-month-tag]');
  var foot = root.querySelector('[data-month-foot]');
  var playBtn = root.querySelector('[data-play]');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var DUR = 5200;
  var cur = 0, playing = !reduce, visible = false, raf = 0, start = 0, elapsed = 0;

  M.forEach(function (m, i) {
    var li = document.createElement('li');
    li.setAttribute('role', 'presentation');
    li.innerHTML = '<button type="button" role="tab" id="m' + i + '" aria-selected="false"><span>' + m.n + '</span><span class="n">' + String(i + 1).padStart(2, '0') + '</span><span class="prog"><i></i></span></button>';
    list.appendChild(li);
  });
  var btns = list.querySelectorAll('button');

  function key(d) {
    var n = (d.match(/\d+/) || [0])[0] * 1;
    if (/^Début|^Tout le mois/.test(d)) return 1;
    if (/^Mi-/.test(d)) return 15;
    if (/^Courant/.test(d)) return 14;
    if (/^Dans le mois/.test(d)) return 20;
    if (/^Fin/.test(d)) return 28;
    if (/^Sur demande/.test(d)) return 29;
    if (/^Entre/.test(d)) return n + 0.5;
    return n;
  }
  function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  function show(i, fromUser) {
    cur = (i + 12) % 12;
    var m = M[cur];
    btns.forEach(function (b, k) {
      b.setAttribute('aria-selected', k === cur ? 'true' : 'false');
      b.tabIndex = k === cur ? 0 : -1;
      b.querySelector('.prog i').style.transform = 'scaleX(0)';
    });
    title.textContent = m.n;
    tag.textContent = m.tag;
    var c = { nous: 0, vous: 0, ens: 0 }; m.rows.forEach(function (r) { c[r.w]++; });
    var parts = [];
    if (c.nous) parts.push(c.nous + (c.nous > 1 ? ' tâches' : ' tâche') + ' pour le cabinet');
    if (c.ens) parts.push(c.ens + ' ensemble');
    if (c.vous) parts.push(c.vous + ' pour vous');
    foot.innerHTML = '<span>' + esc(m.foot) + '</span><span class="count">' + parts.join(', ') + '</span>';
    rows.classList.remove('show');
    var sorted = m.rows.slice().sort(function (x, y) { return key(x.d) - key(y.d); });
    rows.innerHTML = sorted.map(function (r, k) {
      return '<li style="--i:' + k + '"><span class="date">' + esc(r.d) + '</span><span class="what">' + esc(r.t) + '<small>' + esc(r.s) + '</small></span><span class="who ' + r.w + '">' + WHO[r.w] + '</span></li>';
    }).join('');
    void rows.offsetWidth;
    rows.classList.add('show');
    var b = btns[cur];
    if (window.innerWidth <= 760 && list.scrollWidth > list.clientWidth) {
      list.scrollTo({ left: b.parentNode.offsetLeft - 16, behavior: reduce ? 'auto' : 'smooth' });
    }
    elapsed = 0; start = performance.now();
    if (fromUser) b.focus({ preventScroll: true });
  }

  function setPlaying(p) {
    playing = p;
    playBtn.setAttribute('aria-pressed', p ? 'true' : 'false');
    playBtn.querySelector('span').textContent = p ? 'Pause' : 'Lecture';
    playBtn.querySelector('.i-pause').style.display = p ? '' : 'none';
    playBtn.querySelector('.i-play').style.display = p ? 'none' : '';
    start = performance.now() - elapsed;
    loop();
  }

  function loop() {
    cancelAnimationFrame(raf);
    if (!playing || !visible) return;
    raf = requestAnimationFrame(function tick(now) {
      elapsed = now - start;
      var p = Math.min(elapsed / DUR, 1);
      btns[cur].querySelector('.prog i').style.transform = 'scaleX(' + p + ')';
      if (p >= 1) show(cur + 1);
      if (playing && visible) raf = requestAnimationFrame(tick);
    });
  }

  list.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    var i = Array.prototype.indexOf.call(btns, b);
    show(i, true);
    if (playing) setPlaying(false);
  });
  list.addEventListener('keydown', function (e) {
    var k = e.key, d = 0;
    if (k === 'ArrowDown' || k === 'ArrowRight') d = 1;
    if (k === 'ArrowUp' || k === 'ArrowLeft') d = -1;
    if (!d) return;
    e.preventDefault(); show(cur + d, true); if (playing) setPlaying(false);
  });
  playBtn.addEventListener('click', function () { setPlaying(!playing); });

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) {
      visible = en[0].isIntersecting;
      if (visible) { start = performance.now() - elapsed; loop(); } else cancelAnimationFrame(raf);
    }, { threshold: 0.35 }).observe(root);
  } else { visible = true; }

  show(new Date().getMonth());
  setPlaying(playing);
})();
