/* Kervalen : page d'accueil (bon d'intervention, vérification de commune, déroulé, questions). */
(function () {
  'use strict';

  var reduit = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Le bon d'intervention ---------- */
  var SITUATIONS = {
    fuite: {
      motif: 'Une fuite d’eau',
      geste: 'Fermez le robinet d’arrêt de votre logement. En maison, il se trouve souvent près du compteur d’eau ; en appartement, sous l’évier ou dans la gaine technique du palier. Si l’eau touche une prise ou le tableau électrique, coupez aussi le disjoncteur général.',
      nous: 'Nous cherchons l’origine de la fuite, remplaçons le joint, le raccord ou la portion de tuyau abîmée, puis nous remettons l’eau devant vous.',
      delai: 'Le jour même quand nos créneaux le permettent, sinon le lendemain matin.',
      prix: '110 à 180 €', prixNote: 'Pour un raccord sous évier, déplacement, pièces et main-d’œuvre compris.'
    },
    eau: {
      motif: 'Plus d’eau chaude',
      geste: 'Regardez dans votre tableau électrique si le disjoncteur du chauffe-eau est levé, et si le contacteur heures creuses est bien sur « auto ». Avec une chaudière, notez le code d’erreur affiché&nbsp;: il nous permet d’apporter la bonne pièce.',
      nous: 'Nous contrôlons la résistance, le thermostat et le groupe de sécurité. Si le ballon est percé, nous vous chiffrons son remplacement avant de démonter quoi que ce soit.',
      delai: 'Sous 48 heures, souvent le lendemain.',
      prix: '160 à 240 €', prixNote: 'Pour une résistance remplacée. Un chauffe-eau 200 litres posé coûte à partir de 1 150 €.'
    },
    chaudiere: {
      motif: 'La chaudière ne démarre plus',
      geste: 'Vérifiez la pression sur le manomètre&nbsp;: entre 1 et 2 bars, elle est normale. Notez la marque, le modèle et le code affiché. Si vous sentez une odeur de gaz, fermez le robinet de gaz, aérez, sortez et appelez GRDF au 0 800 47 33 33.',
      nous: 'Nous trouvons la cause de la panne, puis nous vous annonçons le prix de la réparation avant de la faire. Si la chaudière ne vaut plus la peine d’être réparée, nous vous le disons.',
      delai: 'Sous 48 heures. Nous apportons les pièces courantes de votre modèle.',
      prix: '45 € puis 62 € de l’heure', prixNote: 'Le déplacement comprend le diagnostic. Les pièces s’ajoutent, avec leur prix inscrit au devis.'
    },
    bouche: {
      motif: 'Un évier ou des WC bouchés',
      geste: 'Essayez une ventouse si le bouchon est récent. Évitez de reverser un déboucheur à la soude s’il n’a rien donné&nbsp;: il abîme les joints et brûle la peau quand nous démontons le siphon.',
      nous: 'Nous débouchons à la main ou au furet électrique, jusqu’à quinze mètres de canalisation, puis nous vérifions que l’eau s’écoule normalement.',
      delai: 'Le jour même ou le lendemain matin.',
      prix: '90 à 160 €', prixNote: 'Selon l’accès à la canalisation et la méthode, déplacement compris.'
    },
    entretien: {
      motif: 'L’entretien annuel de la chaudière',
      geste: 'Rien d’urgent. Retrouvez si possible votre dernière attestation d’entretien&nbsp;: l’entretien est obligatoire chaque année pour une chaudière gaz, et votre assureur peut vous la demander.',
      nous: 'Nettoyage du brûleur et de l’échangeur, contrôle de la combustion et du tirage, réglages. Vous recevez l’attestation d’entretien sous 15 jours.',
      delai: 'Rendez-vous sous deux à trois semaines, plus vite en dehors de septembre à novembre.',
      prix: '140 €', prixNote: 'Pour une chaudière gaz murale, déplacement et attestation compris.'
    },
    projet: {
      motif: 'Remplacer une chaudière, refaire une salle de bains',
      geste: 'Prenez en photo la plaque de votre chaudière ou la pièce à refaire, et notez ce qui vous gêne aujourd’hui. Nous en parlerons lors de la visite.',
      nous: 'Nous passons voir l’installation, nous mesurons, puis nous vous envoyons un devis écrit et détaillé ligne par ligne, avec l’attestation de notre assurance décennale.',
      delai: 'Visite sous une semaine, devis sous cinq jours ouvrés.',
      prix: 'Visite et devis gratuits', prixNote: 'Chaudière gaz à condensation posée à partir de 3 900 €.'
    }
  };

  var diag = document.querySelector('[data-diag]');
  if (diag) {
    var tabs = Array.prototype.slice.call(diag.querySelectorAll('[role="tab"]'));
    var bon = diag.querySelector('[data-bon]');
    var bar = diag.querySelector('[data-progress]');
    var hint = diag.querySelector('[data-hint]');
    var cle = 'fuite';
    var auto = !reduit;
    var visible = false;
    var DUREE = 7000;
    var depart = 0, raf = 0, timer = 0;

    function f(n) { return bon.querySelector('[data-f="' + n + '"]'); }

    function remplir(k) {
      var s = SITUATIONS[k];
      f('motif').textContent = s.motif;
      f('geste').innerHTML = s.geste;
      f('nous').textContent = s.nous;
      f('delai').textContent = s.delai;
      f('prix').innerHTML = '<span class="bon__prix">' + s.prix + '<small>' + s.prixNote + '</small></span>';
      f('lien').setAttribute('href', 'demande.html?motif=' + k);
    }

    function choisir(k, focus) {
      if (k === cle) return;
      cle = k;
      tabs.forEach(function (t) {
        var on = t.dataset.k === k;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        if (on) { bon.setAttribute('aria-labelledby', t.id); if (focus) t.focus(); }
      });
      if (reduit) { remplir(k); return; }
      bon.classList.add('is-swapping');
      setTimeout(function () {
        remplir(k);
        var champs = bon.querySelectorAll('[data-fill]');
        champs.forEach(function (c, i) { c.style.transitionDelay = (i * 70) + 'ms'; });
        bon.classList.remove('is-swapping');
        setTimeout(function () { champs.forEach(function (c) { c.style.transitionDelay = ''; }); }, 900);
      }, 260);
    }

    function arreterAuto() {
      if (!auto) return;
      auto = false;
      cancelAnimationFrame(raf);
      bar.style.transform = 'scaleX(0)';
      bar.parentNode.style.visibility = 'hidden';
      hint.textContent = 'Défilement arrêté. Choisissez une autre situation à tout moment.';
    }

    function boucle(t) {
      if (!auto) return;
      if (!visible || document.hidden) { depart = t - (parseFloat(bar.dataset.p || 0) * DUREE); raf = requestAnimationFrame(boucle); return; }
      if (!depart) depart = t;
      var p = Math.min((t - depart) / DUREE, 1);
      bar.dataset.p = p;
      bar.style.transform = 'scaleX(' + p + ')';
      if (p >= 1) {
        var i = tabs.findIndex(function (x) { return x.dataset.k === cle; });
        choisir(tabs[(i + 1) % tabs.length].dataset.k);
        depart = t; bar.dataset.p = 0;
      }
      raf = requestAnimationFrame(boucle);
    }

    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { arreterAuto(); choisir(t.dataset.k); });
      t.addEventListener('keydown', function (e) {
        var n = null;
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') n = (i + 1) % tabs.length;
        if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') n = (i - 1 + tabs.length) % tabs.length;
        if (e.key === 'Home') n = 0;
        if (e.key === 'End') n = tabs.length - 1;
        if (n !== null) { e.preventDefault(); arreterAuto(); choisir(tabs[n].dataset.k, true); }
      });
    });
    bon.addEventListener('pointerenter', function () { if (auto) { visible = false; } });
    bon.addEventListener('pointerleave', function () { if (auto) { visible = true; } });
    bon.addEventListener('focusin', arreterAuto);

    if (auto && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }, { threshold: 0.45 }).observe(diag);
      raf = requestAnimationFrame(boucle);
    } else {
      auto = false;
      bar.parentNode.style.display = 'none';
      hint.textContent = 'Choisissez une situation pour afficher le bon correspondant.';
    }
  }

  /* ---------- Vérification de la commune ---------- */
  var input = document.querySelector('[data-zone-input]');
  if (input) {
    var out = document.querySelector('[data-zone-out]');
    var items = Array.prototype.slice.call(document.querySelectorAll('[data-communes] li'));
    var dl = document.getElementById('liste-communes');
    function norm(s) {
      return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’'`]/g, ' ').replace(/[^a-z0-9]+/g, ' ').replace(/\bst\b/g, 'saint').trim();
    }
    var noms = items.map(function (li) { return li.textContent; });
    noms.forEach(function (n) { var o = document.createElement('option'); o.value = n; dl.appendChild(o); });
    var base = out.textContent;
    function verifier() {
      var q = norm(input.value);
      items.forEach(function (li) { li.classList.remove('hit'); });
      if (q.length < 2) { out.innerHTML = base; return; }
      var exact = items.filter(function (li) { return norm(li.textContent) === q; });
      var debut = items.filter(function (li) { return norm(li.textContent).indexOf(q) === 0; });
      var trouve = exact.length ? exact : debut;
      trouve.forEach(function (li) { li.classList.add('hit'); });
      if (exact.length || (debut.length === 1 && q.length >= 4)) {
        var nom = (exact[0] || debut[0]).textContent;
        out.innerHTML = '<span class="yes">Oui, nous intervenons à ' + nom + '.</span> Le déplacement coûte 45 €, diagnostic compris.';
      } else if (debut.length) {
        out.textContent = debut.length + (debut.length > 1 ? ' communes commencent ainsi. Continuez à taper.' : ' commune commence ainsi. Continuez à taper.');
      } else if (q.length >= 4) {
        out.innerHTML = '<span class="no">Cette commune est hors de notre zone habituelle.</span> Appelez-nous&nbsp;: selon la distance, nous venons quand même ou nous vous donnons le nom d’un confrère.';
      } else { out.innerHTML = base; }
    }
    input.addEventListener('input', verifier);
  }

  /* ---------- Liste des communes ouverte sur grand écran ---------- */
  var box = document.querySelector('[data-communes-box]');
  if (box) {
    var mq = window.matchMedia('(min-width: 901px)');
    var sync = function () { if (mq.matches) box.open = true; };
    sync(); mq.addEventListener('change', sync);
    if (input) input.addEventListener('input', function () { if (document.querySelector('[data-communes] li.hit')) box.open = true; });
  }

  /* ---------- Le tuyau du déroulé ---------- */
  var steps = document.querySelector('[data-steps]');
  if (steps) {
    var path = steps.querySelector('path');
    if (reduit || !('IntersectionObserver' in window)) { steps.classList.add('is-in'); }
    else {
      new IntersectionObserver(function (es, o) {
        if (es[0].isIntersecting) { steps.classList.add('is-in'); o.disconnect(); }
      }, { threshold: 0.4 }).observe(steps);
    }
  }

  /* ---------- Questions : ouverture douce ---------- */
  if (!reduit) {
    document.querySelectorAll('.qa details').forEach(function (d) {
      d.addEventListener('toggle', function () {
        if (!d.open) return;
        var a = d.querySelector('.ans');
        a.style.gridTemplateRows = '0fr';
        a.getBoundingClientRect();
        requestAnimationFrame(function () { a.style.gridTemplateRows = ''; });
      });
    });
  }
})();
