(function () {
  'use strict';
  const A = window.AGENCE;
  const { TECHNICIENS, CLIENTS, interventions, UTILISATRICE, TARIF, OBJET, COMPETENCES, FERIES } = A;
  const { cleJour, date, ajouterHeures, dureeTexte, pad } = A.outils;
  const T = Object.fromEntries(TECHNICIENS.map(t => [t.id, t]));
  const CL = Object.fromEntries(CLIENTS.map(c => [c.id, c]));
  const vue = document.getElementById('vue');
  const MAC = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  document.querySelectorAll('.touche-mod').forEach(k => { k.textContent = MAC ? '⌘K' : 'Ctrl K'; });

  // L'horloge de l'agence part de lundi 10 h 40 et avance avec le temps réel.
  const t0 = Date.now();
  const horloge = () => new Date(A.MAINTENANT.getTime() + (Date.now() - t0));
  const AUJ = cleJour(A.MAINTENANT);

  const STATUTS = {
    a_planifier: 'À planifier', planifiee: 'Planifiée', en_cours: 'En cours',
    terminee: 'Terminée', cloturee: 'Clôturée', annulee: 'Annulée'
  };
  const FLUX = ['a_planifier', 'planifiee', 'en_cours', 'terminee', 'cloturee'];
  const PRIO = { urgente: 'Urgente', normale: 'Normale', contrat: 'Contrat' };
  const RANG_PRIO = { urgente: 0, normale: 1, contrat: 2 };
  const TYPES = ['Chauffage', 'Climatisation', 'Plomberie', 'Ventilation'];
  const DEBUT_J = 7, FIN_J = 18;

  /* ---------- Outils ---------- */
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const norm = s => String(s || '').normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
  const fmtEuros = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });
  const euros = n => fmtEuros.format(n).replace(/ /g, ' ');
  const entier = n => new Intl.NumberFormat('fr-FR').format(n).replace(/ /g, ' ');
  const fJourCourt = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
  const fJourLong = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  const fJourMois = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' });
  const fJourNom = new Intl.DateTimeFormat('fr-FR', { weekday: 'long' });
  const majuscule = s => s.charAt(0).toUpperCase() + s.slice(1);
  const heureTexte = d => d.getMinutes() ? `${d.getHours()}\u00a0h\u00a0${pad(d.getMinutes())}` : `${d.getHours()}\u00a0h`;
  const hTexte = hhmm => { const [h, m] = hhmm.split(':').map(Number); return m ? `${h}\u00a0h\u00a0${pad(m)}` : `${h}\u00a0h`; };
  const minutes = hhmm => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };
  const versHHMM = m => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
  const debutDe = it => date(it.jour, it.heure);
  const finDe = it => ajouterHeures(debutDe(it), it.duree);

  function jourRelatif(cle) {
    if (cle === AUJ) return 'Aujourd’hui';
    const d = date(cle), a = date(AUJ);
    const ecart = Math.round((d - a) / 86400000);
    if (ecart === 1) return 'Demain';
    if (ecart === -1) return 'Hier';
    return majuscule(fJourCourt.format(d));
  }
  function quandRelatif(d) {
    const n = horloge();
    const min = Math.round((n - d) / 60000);
    if (min < 1) return 'à l’instant';
    if (min < 60) return `il y a ${min} min`;
    const k = cleJour(d);
    if (k === cleJour(n)) return `aujourd’hui à ${heureTexte(d)}`;
    const hier = new Date(n); hier.setDate(hier.getDate() - 1);
    if (k === cleJour(hier)) return `hier à ${heureTexte(d)}`;
    if ((n - d) < 6 * 86400000) return `${fJourNom.format(d)} à ${heureTexte(d)}`;
    return `le ${fJourMois.format(d)}`;
  }
  const pastille = s => `<span class="statut ${s}">${STATUTS[s]}</span>`;
  const prio = p => `<span class="prio ${p}">${PRIO[p]}</span>`;
  const avatar = (id, petit) => id ? `<span class="avatar${petit ? ' petit' : ''}" aria-hidden="true">${T[id].initiales}</span>` : '';
  const ICONES = {
    poignee: '<svg viewBox="0 0 10 16" aria-hidden="true"><circle cx="3" cy="3" r="1.3"/><circle cx="7" cy="3" r="1.3"/><circle cx="3" cy="8" r="1.3"/><circle cx="7" cy="8" r="1.3"/><circle cx="3" cy="13" r="1.3"/><circle cx="7" cy="13" r="1.3"/></svg>',
    fleche: '<svg class="fleche" viewBox="0 0 10 10" aria-hidden="true"><path d="M5 8V2M2.5 4.5 5 2l2.5 2.5"/></svg>',
    plus: '<svg viewBox="0 0 14 14" aria-hidden="true"><path d="M7 2.5v9M2.5 7h9"/></svg>',
    bas: '<svg viewBox="0 0 14 14" aria-hidden="true"><path d="m3.5 5.5 3.5 3.5 3.5-3.5"/></svg>',
    export: '<svg viewBox="0 0 14 14" aria-hidden="true"><path d="M7 2v7M4 6l3 3 3-3M2.5 11.5h9"/></svg>',
    gauche: '<svg viewBox="0 0 14 14" aria-hidden="true"><path d="M8.5 3.5 5 7l3.5 3.5"/></svg>',
    droite: '<svg viewBox="0 0 14 14" aria-hidden="true"><path d="M5.5 3.5 9 7l-3.5 3.5"/></svg>',
    loupe: '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="7" cy="7" r="4.5"/><path d="m10.5 10.5 3 3"/></svg>',
    coche: '<svg viewBox="0 0 10 10" aria-hidden="true"><path d="M2 5.2 4 7.2 8 3"/></svg>',
    doc: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2.5h5l3 3v8H4z"/><path d="M9 2.5v3h3"/></svg>',
    fleche_d: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4"/></svg>',
    eclair: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M9 2 4 9h4l-1 5 5-7H8z"/></svg>',
    batiment: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 13.5V3.5h6v10M9 6.5h4v7M2 13.5h12M5 6h2M5 8.5h2M5 11h2"/></svg>'
  };
  const competents = type => TECHNICIENS.filter(t => COMPETENCES[t.id].includes(type)).sort((a, b) => COMPETENCES[a.id].length - COMPETENCES[b.id].length);
  const parRef = ref => interventions.find(i => i.ref === ref);

  /* ---------- Planning : créneaux libres et conflits ---------- */
  function occupations(tech, jour, sauf) {
    return interventions.filter(i => i !== sauf && i.tech === tech && i.jour === jour && i.statut !== 'annulee' && i.statut !== 'a_planifier')
      .map(i => ({ de: minutes(i.heure), a: minutes(i.heure) + Math.round(i.duree * 60), it: i }));
  }
  function conflit(tech, jour, heure, duree, sauf) {
    const de = minutes(heure), a = de + Math.round(duree * 60);
    if (a > FIN_J * 60 || de < DEBUT_J * 60) return { horsJournee: true };
    const c = occupations(tech, jour, sauf).find(o => de < o.a && a > o.de);
    return c ? { it: c.it } : null;
  }
  function jourOuvre(d) { const j = d.getDay(); return j !== 0 && j !== 6 && !FERIES.has(cleJour(d)); }
  function proposer(it) {
    const duree = it.duree;
    const n = horloge();
    let jour = new Date(n.getFullYear(), n.getMonth(), n.getDate());
    if (it.priorite !== 'urgente') jour.setDate(jour.getDate() + 1);
    for (let k = 0; k < 15; k++, jour.setDate(jour.getDate() + 1)) {
      if (!jourOuvre(jour)) continue;
      const cle = cleJour(jour);
      // Une urgence part au plus tôt quarante minutes après l'appel, le temps du trajet.
      let min = 7 * 60 + 30;
      if (cle === cleJour(n)) min = Math.max(min, Math.ceil((n.getHours() * 60 + n.getMinutes() + 40) / 30) * 30);
      let meilleur = null;
      for (const t of competents(it.type)) {
        const occ = occupations(t.id, cle, it).sort((a, b) => a.de - b.de);
        let debut = min;
        for (const o of occ) {
          if (debut + duree * 60 <= o.de) break;
          if (o.a > debut) debut = Math.ceil(o.a / 30) * 30;
        }
        if (debut + duree * 60 <= FIN_J * 60 && (!meilleur || debut < meilleur.m)) meilleur = { tech: t.id, jour: cle, m: debut };
      }
      if (meilleur) return { tech: meilleur.tech, jour: meilleur.jour, heure: versHHMM(meilleur.m) };
    }
    return { tech: competents(it.type)[0].id, jour: cleJour(jour), heure: '08:00' };
  }

  /* ---------- Modifications, historique et annulation ---------- */
  function cliche(it) { return { dureeReelle: it.dureeReelle, montant: it.montant, statut: it.statut, tech: it.tech, jour: it.jour, heure: it.heure, rapport: it.rapport, facture: it.facture, annulation: it.annulation, n: it.historique.length }; }
  function restaurer(it, c) { const n = c.n; delete c.n; Object.assign(it, c); it.historique.length = n; }
  function tracer(it, quoi, detail, extra) { it.historique.push(Object.assign({ quand: horloge(), qui: UTILISATRICE.nom, quoi, detail, recent: true }, extra || {})); }

  let dernierChange = null;
  function modifier(it, faire, texte) {
    const avant = cliche(it);
    faire();
    dernierChange = it.ref;
    rafraichir();
    message(texte, () => { restaurer(it, avant); dernierChange = it.ref; rafraichir(); message('Modification annulée.'); });
  }

  function planifier(it, tech, jour, heure, origine) {
    const deja = it.statut !== 'a_planifier';
    modifier(it, () => {
      if (!deja) it.statut = 'planifiee';
      it.tech = tech; it.jour = jour; it.heure = heure;
      tracer(it, deja ? `Déplacée vers ${T[tech].nom}` : `Planifiée pour ${T[tech].nom}`, `${fJourLong.format(date(jour))} à ${hTexte(heure)}${origine ? ' · ' + origine : ''}`);
    }, `${it.ref} ${deja ? 'déplacée' : 'planifiée'} : ${T[tech].nom}, ${jourRelatif(jour).toLowerCase()} à ${hTexte(heure)}.`);
  }

  function changerStatut(it, cible, raison) {
    const de = it.statut;
    if (de === cible) return;
    modifier(it, () => {
      it.statut = cible;
      if (cible === 'a_planifier') { it.tech = null; it.jour = null; it.heure = null; tracer(it, 'Remise à planifier', 'Technicien et créneau retirés'); return; }
      if (cible === 'planifiee') { if (!it.tech) { const p = proposer(it); Object.assign(it, p); } tracer(it, 'Statut changé : planifiée', null); return; }
      if (cible === 'en_cours') { tracer(it, 'Intervention démarrée', `Saisie depuis l’agence pour ${T[it.tech].nom}`); return; }
      if (cible === 'terminee') {
        if (!it.rapport) it.rapport = OBJET[it.cle].rapport;
        const ecoule = (horloge() - debutDe(it)) / 3600000;
        if (ecoule > 0 && ecoule < 10) {
          it.dureeReelle = Math.max(.25, Math.round(ecoule * 4) / 4);
          if (it.montant != null) it.montant = Math.round((TARIF.deplacement + TARIF.heure * it.dureeReelle + it.pieces.reduce((s, x) => s + x.pu * x.qte, 0)) * 100) / 100;
        }
        tracer(it, 'Intervention terminée, rapport déposé', `Rapport de ${T[it.tech].nom}, ${dureeTexte(it.dureeReelle)} sur place`); return;
      }
      if (cible === 'cloturee') {
        if (!it.rapport) it.rapport = OBJET[it.cle].rapport;
        tracer(it, 'Rapport validé', null);
        if (it.montant != null) {
          it.facture = it.facture || `F-2611-${2600 + interventions.filter(i => i.facture).length % 1000}`;
          tracer(it, `Facture ${it.facture} préparée`, null, { qui: 'Facturation', montant: it.montant });
        } else tracer(it, 'Visite comprise au contrat, rien à facturer', null, { qui: 'Facturation' });
        return;
      }
      if (cible === 'annulee') { it.annulation = raison; tracer(it, 'Intervention annulée', raison); }
    }, `${it.ref} : ${STATUTS[de].toLowerCase()} → ${STATUTS[cible].toLowerCase()}.`);
  }
  const PROCHAINE = {
    a_planifier: { l: 'Planifier', a: 'planifier' },
    planifiee: { l: 'Démarrer l’intervention', cible: 'en_cours' },
    en_cours: { l: 'Marquer comme terminée', cible: 'terminee' },
    terminee: { l: 'Valider le rapport', cible: 'cloturee' }
  };

  /* ---------- Messages ---------- */
  const zoneMessages = document.getElementById('messages');
  function message(texte, annuler) {
    zoneMessages.querySelectorAll('.message').forEach(m => fermerMessage(m));
    const m = document.createElement('div');
    m.className = 'message'; m.setAttribute('role', 'status');
    m.innerHTML = `<span class="ic">${ICONES.coche}</span><span class="t">${esc(texte)}</span>${annuler ? `<button type="button" data-annuler>Annuler <kbd>${MAC ? '⌘' : 'Ctrl '}Z</kbd></button>` : ''}<button type="button" class="ms-fermer" aria-label="Fermer">✕</button>`;
    zoneMessages.appendChild(m);
    m._annuler = annuler;
    m.querySelector('[data-annuler]')?.addEventListener('click', () => { fermerMessage(m); annuler(); });
    m.querySelector('.ms-fermer').addEventListener('click', () => fermerMessage(m));
    m._minuteur = setTimeout(() => fermerMessage(m), 7000);
  }
  function fermerMessage(m) { if (!m.isConnected || m.classList.contains('sortie')) return; clearTimeout(m._minuteur); m.classList.add('sortie'); setTimeout(() => m.remove(), 200); }
  function annulerDernier() {
    const m = zoneMessages.querySelector('.message:not(.sortie)');
    if (m && m._annuler) { const f = m._annuler; fermerMessage(m); f(); return true; }
    return false;
  }

  /* ---------- État de l'interface ---------- */
  const etat = {
    route: 'aujourdhui', ref: null,
    liste: { onglet: 'ouvertes', q: '', tech: '', type: '', periode: 'tout', tri: { col: 'date', dir: 'asc' }, limite: 60, actif: -1, nouvelle: false },
    ouvert: null,        // demande dont la proposition est dépliée sur l'écran du jour
    stats: 4,
    jourPlanning: null,
    recents: []
  };

  /* ---------- Routeur ---------- */
  function lireRoute() {
    const h = location.hash.replace(/^#\/?/, '') || 'aujourdhui';
    const [r, ref] = h.split('/');
    etat.route = ['aujourdhui', 'interventions', 'statistiques'].includes(r) ? r : 'aujourdhui';
    etat.ref = r === 'interventions' && ref ? decodeURIComponent(ref) : null;
  }
  function naviguer() {
    lireRoute();
    document.querySelectorAll('[data-route]').forEach(a => {
      if (a.dataset.route === etat.route) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    rendre(true);
    window.scrollTo(0, 0);
  }
  function rendre(entree) {
    let html;
    if (etat.route === 'interventions' && etat.ref) html = vueFiche(parRef(etat.ref));
    else if (etat.route === 'interventions') html = vueListe();
    else if (etat.route === 'statistiques') html = vueStats();
    else html = vueJour();
    vue.innerHTML = html;
    const page = vue.firstElementChild;
    if (entree && page) page.classList.add('entree');
    document.title = titreOnglet();
    apresRendu();
    majCompteurs();
  }
  function rafraichir() {
    const actif = document.activeElement;
    const id = actif && actif.id;
    rendre(false);
    if (id) { const e = document.getElementById(id); if (e) e.focus(); }
  }
  function titreOnglet() {
    if (etat.ref) { const it = parRef(etat.ref); return it ? `${it.ref} · ${CL[it.client].nom} · Calorive` : 'Calorive'; }
    return ({ aujourdhui: 'Aujourd’hui', interventions: 'Interventions', statistiques: 'Statistiques' })[etat.route] + ' · Calorive';
  }
  function majCompteurs() {
    const n = interventions.filter(i => i.statut === 'a_planifier').length;
    document.querySelectorAll('[data-compte="aplacer"]').forEach(e => { e.textContent = n || ''; e.title = `${n} demandes à placer`; });
  }

  /* =========================================================
     Aujourd'hui
     ========================================================= */
  function vueJour() {
    const n = horloge();
    const duJour = interventions.filter(i => i.jour === AUJ && !['a_planifier', 'annulee'].includes(i.statut));
    const enCours = duJour.filter(i => i.statut === 'en_cours').length;
    const aPlacer = interventions.filter(i => i.statut === 'a_planifier').sort((a, b) => RANG_PRIO[a.priorite] - RANG_PRIO[b.priorite] || a.recue - b.recue);
    const urgentes = aPlacer.filter(i => i.priorite === 'urgente').length;
    const aValider = interventions.filter(i => i.statut === 'terminee').sort((a, b) => debutDe(b) - debutDe(a));
    const restantes = duJour.filter(i => i.statut === 'planifiee').length;

    const resume = `<strong>${duJour.length} interventions</strong> au planning, dont ${enCours} en cours et ${restantes} à venir. ` +
      (aPlacer.length ? `<strong>${aPlacer.length} demande${aPlacer.length > 1 ? 's' : ''} à placer</strong>${urgentes ? `, dont ${urgentes} urgente${urgentes > 1 ? 's' : ''}` : ''}.` : 'Toutes les demandes sont placées.');

    return `<div class="page">
      <header class="entete">
        <div>
          <h1>${majuscule(fJourLong.format(n))}</h1>
          <p class="sous">Agence de Villeurbanne · il est ${heureTexte(n)}</p>
        </div>
      </header>
      <p class="resume">${resume}</p>
      <div class="jour-grille">
        <section aria-labelledby="t-placer">
          <div class="bloc-entete">
            <h2 class="titre" id="t-placer">À placer <span class="n">${aPlacer.length}</span></h2>
            <span class="aide">${aPlacer.length ? 'Glissez une demande sur le planning, ou planifiez-la en un clic' : ''}</span>
          </div>
          <div class="panneau">${aPlacer.length ? `<ul class="liste-travail">${aPlacer.map(ligneAPlacer).join('')}</ul>` :
            `<div class="vide"><strong>Toutes les demandes sont placées</strong>Les nouvelles demandes apparaîtront ici dès leur enregistrement.<br><a class="btn" href="#/interventions" data-action="nouvelle">${ICONES.plus}Nouvelle demande</a></div>`}</div>
        </section>
        <div class="col-droite">
          <section aria-labelledby="t-valider">
            <div class="bloc-entete"><h2 class="titre" id="t-valider">Rapports à valider <span class="n">${aValider.length}</span></h2></div>
            <div class="panneau">${aValider.length ? `<ul class="court-liste">${aValider.slice(0, 4).map(it => `<li><a href="#/interventions/${it.ref}">
              <span class="cl-titre">${esc(CL[it.client].nom)}</span><span class="cl-heure">${jourRelatif(it.jour) === 'Aujourd’hui' ? hTexte(versHHMM(minutes(it.heure) + Math.round(it.dureeReelle * 60))) : esc(jourRelatif(it.jour))}</span>
              <span class="cl-meta">${esc(T[it.tech].nom)} · ${esc(it.objet)}</span></a></li>`).join('')}</ul>` +
              (aValider.length > 4 ? `<div class="pied-liste"><a class="btn petit fantome" href="#/interventions" data-onglet="terminee">Voir les ${aValider.length} rapports</a></div>` : '') :
              `<div class="vide"><strong>Aucun rapport en attente</strong>Les rapports déposés par les techniciens arrivent ici.</div>`}</div>
          </section>

        </div>
        <section class="planning-section" aria-labelledby="t-planning">
          <div class="bloc-entete">
            <h2 class="titre" id="t-planning">Planning</h2>
            ${semaine()}
          </div>
          <div class="panneau planning" id="planning">${planning(n)}</div>
          <div class="panneau pl-mobile">${planningMobile()}</div>
          <div class="planning-legende" aria-hidden="true">${['planifiee', 'en_cours', 'terminee', 'cloturee'].map(pastille).join('')}<span>Glissez un créneau planifié pour le déplacer.</span></div>
        </section>
      </div>
    </div>`;
  }

  const jourPl = () => etat.jourPlanning || AUJ;
  function semaine() {
    const lundi = date(AUJ);
    const jours = [0, 1, 2, 3, 4].map(k => { const d = new Date(lundi); d.setDate(d.getDate() + k); const cle = cleJour(d); return { d, cle, ferie: FERIES.has(cle), n: interventions.filter(i => i.jour === cle && !['annulee', 'a_planifier'].includes(i.statut)).length }; });
    return `<div class="jours" role="tablist" aria-label="Jour affiché">${jours.map(j => {
      const nom = majuscule(new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric' }).format(j.d)).replace('.', '');
      return `<button type="button" role="tab" data-jour-planning="${j.cle}" aria-selected="${j.cle === jourPl()}"${j.ferie ? ' disabled title="Jour férié, agence fermée"' : ''}>${nom}<span class="n">${j.ferie ? 'férié' : j.n}</span></button>`;
    }).join('')}</div>`;
  }

  function ligneAPlacer(it) {
    const c = CL[it.client];
    const ouvert = etat.ouvert === it.ref;
    return `<li data-ref="${it.ref}">
      <div class="ligne-travail">
        <span class="poignee" data-glisser="${it.ref}" title="Glisser sur le planning" aria-hidden="true">${ICONES.poignee}</span>
        <span class="lt-ref">${prio(it.priorite)}</span>
        <div class="lt-texte">
          <div class="lt-titre"><a href="#/interventions/${it.ref}">${esc(c.nom)}</a></div>
          <div class="lt-meta">${esc(it.objet)} · ${esc(c.ville.replace(/^\d+ /, ''))}</div>
        </div>
        <span class="lt-quand" title="Reçue ${esc(quandRelatif(it.recue))}">${esc(majuscule(quandRelatif(it.recue)))}</span>
        <span class="lt-action"><button class="btn petit${ouvert ? '' : ''}" type="button" data-action="ouvrir-proposition" data-ref="${it.ref}" aria-expanded="${ouvert}">Planifier</button></span>
      </div>
      ${ouvert ? formPlanif(it, 'jour') : ''}
    </li>`;
  }

  // Formulaire de planification, avec la proposition calculée.
  function joursPossibles(inclure) {
    const r = []; const d = date(AUJ);
    while (r.length < 10) { if (jourOuvre(d)) r.push(cleJour(d)); d.setDate(d.getDate() + 1); }
    if (inclure && !r.includes(inclure)) r.push(inclure);
    return r;
  }
  const libJour = j => { const rel = jourRelatif(j); const court = fJourCourt.format(date(j)); return ['Aujourd’hui', 'Demain'].includes(rel) ? `${rel}, ${fJourMois.format(date(j))}` : majuscule(court); };
  function formPlanif(it, ou) {
    const p = it._choix || (it.statut === 'a_planifier' ? proposer(it) : { tech: it.tech, jour: it.jour, heure: it.heure });
    it._choix = p;
    const c = conflit(p.tech, p.jour, p.heure, it.duree, it);
    const propose = it.statut === 'a_planifier' ? proposer(it) : null;
    const estPropose = propose && propose.tech === p.tech && propose.jour === p.jour && propose.heure === p.heure;
    const heures = [];
    for (let m = DEBUT_J * 60 + 30; m <= FIN_J * 60 - 30; m += 30) heures.push(versHHMM(m));
    const id = `pl-${it.ref}`;
    let explication;
    if (estPropose) explication = `<p>Premier créneau libre d’un technicien qui fait de la ${esc(it.type.toLowerCase())} : <strong>${esc(T[p.tech].nom)}, ${esc(jourRelatif(p.jour).toLowerCase())} à ${hTexte(p.heure)}</strong>. Durée estimée\u00a0: ${dureeTexte(it.duree)}.</p>`;
    else explication = `<p>${esc(T[p.tech].nom)}, ${esc(jourRelatif(p.jour).toLowerCase())} à ${hTexte(p.heure)}. Durée estimée\u00a0: ${dureeTexte(it.duree)}.</p>`;
    let alerte = '';
    if (c && c.horsJournee) alerte = `<p class="conflit">Le créneau dépasse la fin de journée (18 h).</p>`;
    else if (c) alerte = `<p class="conflit">${esc(T[p.tech].nom)} est déjà chez ${esc(CL[c.it.client].nom)} de ${hTexte(c.it.heure)} à ${heureTexte(finDe(c.it))}.</p>`;
    else if (!jourOuvre(date(p.jour))) alerte = `<p class="conflit">Ce jour n’est pas travaillé à l’agence.</p>`;
    const bloque = !!c || !jourOuvre(date(p.jour));
    return `<div class="proposition" data-form-planif="${it.ref}" data-ou="${ou}">
      ${explication}
      <div class="proposition-champs">
        <label class="champ"><span>Technicien</span><select id="${id}-tech" data-champ="tech">${TECHNICIENS.map(t => `<option value="${t.id}"${t.id === p.tech ? ' selected' : ''}>${esc(t.nom)} · ${esc(t.metier.toLowerCase())}</option>`).join('')}</select></label>
        <label class="champ"><span>Jour</span><select id="${id}-jour" data-champ="jour">${joursPossibles(p.jour).map(j => `<option value="${j}"${j === p.jour ? ' selected' : ''}>${esc(libJour(j))}</option>`).join('')}</select></label>
        <label class="champ"><span>Heure</span><select id="${id}-heure" data-champ="heure">${heures.map(h => `<option value="${h}"${h === p.heure ? ' selected' : ''}>${hTexte(h)}</option>`).join('')}</select></label>
        <button class="btn principal" type="button" data-action="valider-planif" data-ref="${it.ref}"${bloque ? ' disabled' : ''}>${it.statut === 'a_planifier' ? 'Planifier' : 'Déplacer'}</button>
      </div>
      ${alerte}
    </div>`;
  }

  function planning(n) {
    const plage = (FIN_J - DEBUT_J) * 60;
    const pos = m => ((m - DEBUT_J * 60) / plage * 100);
    let grad = '';
    const mN = n.getHours() * 60 + n.getMinutes();
    for (let h = DEBUT_J + 1; h < FIN_J; h++) if (jourPl() !== AUJ || Math.abs(h * 60 - mN) > 22) grad += `<span style="left:${pos(h * 60)}%">${h} h</span>`;
    const lignes = TECHNICIENS.map(t => {
      const ses = interventions.filter(i => i.tech === t.id && i.jour === jourPl() && !['annulee', 'a_planifier'].includes(i.statut)).sort((a, b) => minutes(a.heure) - minutes(b.heure));
      const heures = ses.reduce((s, i) => s + i.duree, 0);
      const blocs = ses.map(i => {
        const de = minutes(i.heure), duree = Math.round(i.duree * 60);
        const fin = versHHMM(de + duree);
        return `<a class="creneau ${i.statut}${i.priorite === 'urgente' ? ' urgente' : ''}${dernierChange === i.ref ? ' arrive' : ''}" href="#/interventions/${i.ref}" data-creneau="${i.ref}" style="left:calc(${pos(de)}% + 2px);width:calc(${duree / plage * 100}% - 4px)" title="${esc(CL[i.client].nom)} · ${esc(i.objet)} · ${STATUTS[i.statut]}">
          <span class="c-t">${esc(CL[i.client].nom)}</span><span class="c-h">${hTexte(i.heure)} à ${hTexte(fin)}</span></a>`;
      }).join('');
      let fantome = '';
      const ouv = etat.ouvert && parRef(etat.ouvert);
      if (ouv && ouv._choix && ouv._choix.tech === t.id && ouv._choix.jour === jourPl()) {
        const de = minutes(ouv._choix.heure), du = Math.round(ouv.duree * 60);
        const cf = conflit(t.id, jourPl(), ouv._choix.heure, ouv.duree, ouv);
        fantome = `<div class="creneau fantome-depot${cf ? ' conflit' : ''}" style="left:calc(${pos(de)}% + 2px);width:calc(${du / plage * 100}% - 4px)"><span class="c-t">${esc(CL[ouv.client].nom)}</span><span class="c-h">${hTexte(ouv._choix.heure)} à ${hTexte(versHHMM(de + du))}</span></div>`;
      }
      return `<div class="pl-ligne"><div class="pl-tech">${avatar(t.id)}<div style="min-width:0"><div class="n">${esc(t.nom)}</div><div class="m">${ses.length} interv. · ${dureeTexte(heures)}</div></div></div>
        <div class="pl-piste" data-piste="${t.id}">${blocs}${fantome}</div></div>`;
    }).join('');
    const mNow = n.getHours() * 60 + n.getMinutes();
    const gauche = `calc(var(--pl-tech) + (100% - var(--pl-tech)) * ${pos(mNow) / 100})`;
    const ligneNow = jourPl() === AUJ && mNow > DEBUT_J * 60 && mNow < FIN_J * 60 ? `<div class="maintenant" style="left:${gauche}"></div><span class="maintenant-h" style="left:${gauche}">${heureTexte(n)}</span>` : '';
    return `<div class="pl-heures"><div></div><div class="graduations">${grad}</div></div>${lignes}${ligneNow}`;
  }
  function planningMobile() {
    return TECHNICIENS.map(t => {
      const ses = interventions.filter(i => i.tech === t.id && i.jour === jourPl() && !['annulee', 'a_planifier'].includes(i.statut)).sort((a, b) => minutes(a.heure) - minutes(b.heure));
      return `<div class="pl-mobile-tech">${avatar(t.id, true)}<span class="n">${esc(t.nom)}</span><span class="m">${ses.length} interv.</span></div>
        <ul>${ses.map(i => `<li><a href="#/interventions/${i.ref}"><span class="h">${hTexte(i.heure)}</span><span class="t">${esc(CL[i.client].nom)}</span>${pastille(i.statut)}</a></li>`).join('')}</ul>`;
    }).join('');
  }

  /* ---------- Glisser-déposer sur le planning ---------- */
  let glisse = null;
  function debutGlisse(e, ref, depuisCreneau) {
    if (e.button !== 0 || window.matchMedia('(max-width: 900px)').matches) return;
    const it = parRef(ref);
    glisse = { it, x0: e.clientX, y0: e.clientY, actif: false, depuisCreneau, cible: null, source: e.target.closest('[data-creneau]') };
    window.addEventListener('pointermove', mouvementGlisse);
    window.addEventListener('pointerup', finGlisse, { once: true });
  }
  function mouvementGlisse(e) {
    const g = glisse; if (!g) return;
    if (!g.actif) {
      if (Math.hypot(e.clientX - g.x0, e.clientY - g.y0) < 5) return;
      g.actif = true;
      document.body.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';
      g.porte = document.createElement('div');
      g.porte.className = 'porte-glisse';
      g.porte.innerHTML = `${esc(CL[g.it.client].nom)}<small>${dureeTexte(g.it.duree)} · ${esc(g.it.type)}</small>`;
      document.body.appendChild(g.porte);
      if (g.source) g.source.classList.add('en-glisse');
    }
    g.porte.style.left = (e.clientX + 14) + 'px';
    g.porte.style.top = (e.clientY + 12) + 'px';
    const sous = document.elementFromPoint(e.clientX, e.clientY);
    const piste = sous && sous.closest('[data-piste]');
    document.querySelectorAll('.pl-piste.survol-depot').forEach(p => p !== piste && p.classList.remove('survol-depot'));
    g.fantome?.remove(); g.fantome = null; g.cible = null;
    if (!piste) { g.porte.querySelector('small').textContent = `${dureeTexte(g.it.duree)} · ${g.it.type}`; return; }
    piste.classList.add('survol-depot');
    const r = piste.getBoundingClientRect();
    const plage = (FIN_J - DEBUT_J) * 60, duree = Math.round(g.it.duree * 60);
    let m = DEBUT_J * 60 + (e.clientX - r.left) / r.width * plage - duree / 2;
    m = Math.round(m / 15) * 15;
    m = Math.max(DEBUT_J * 60, Math.min(FIN_J * 60 - duree, m));
    const tech = piste.dataset.piste, heure = versHHMM(m);
    const c = conflit(tech, jourPl(), heure, g.it.duree, g.it);
    const avant = jourPl() === AUJ && minutes(heure) < horloge().getHours() * 60 + horloge().getMinutes();
    g.cible = { tech, heure, ok: !c && !avant };
    const f = document.createElement('div');
    f.className = 'creneau fantome-depot' + (g.cible.ok ? '' : ' conflit');
    f.style.left = `calc(${(m - DEBUT_J * 60) / plage * 100}% + 2px)`;
    f.style.width = `calc(${duree / plage * 100}% - 4px)`;
    f.innerHTML = `<span class="c-t">${c ? 'Créneau occupé' : avant ? 'Heure déjà passée' : esc(T[tech].nom)}</span><span class="c-h">${hTexte(heure)} à ${hTexte(versHHMM(m + duree))}</span>`;
    piste.appendChild(f); g.fantome = f;
    g.porte.querySelector('small').textContent = g.cible.ok ? `${T[tech].nom} · ${hTexte(heure)}` : (c ? 'Créneau occupé' : 'Heure déjà passée');
  }
  function finGlisse() {
    window.removeEventListener('pointermove', mouvementGlisse);
    const g = glisse; glisse = null;
    document.body.style.cursor = ''; document.body.style.userSelect = '';
    if (!g || !g.actif) return;
    g.porte?.remove(); g.fantome?.remove();
    g.source?.classList.remove('en-glisse');
    document.querySelectorAll('.survol-depot').forEach(p => p.classList.remove('survol-depot'));
    // Empêche le clic qui suit le relâchement d'ouvrir la fiche.
    const bloque = ev => { ev.preventDefault(); ev.stopPropagation(); };
    window.addEventListener('click', bloque, { capture: true, once: true });
    setTimeout(() => window.removeEventListener('click', bloque, true), 80);
    if (g.cible && g.cible.ok) {
      delete g.it._choix; etat.ouvert = null;
      planifier(g.it, g.cible.tech, jourPl(), g.cible.heure, 'glissé sur le planning');
    } else if (g.cible) message('Ce créneau n’est pas libre : rien n’a été modifié.');
  }

  /* =========================================================
     Liste des interventions
     ========================================================= */
  const ONGLETS = [
    ['ouvertes', 'Ouvertes', i => !['cloturee', 'annulee'].includes(i.statut)],
    ['a_planifier', 'À planifier', i => i.statut === 'a_planifier'],
    ['planifiee', 'Planifiées', i => i.statut === 'planifiee'],
    ['en_cours', 'En cours', i => i.statut === 'en_cours'],
    ['terminee', 'Rapport à valider', i => i.statut === 'terminee'],
    ['cloturee', 'Clôturées', i => i.statut === 'cloturee'],
    ['annulee', 'Annulées', i => i.statut === 'annulee'],
    ['toutes', 'Toutes', () => true]
  ];
  function filtrerSansOnglet() {
    const L = etat.liste;
    const q = norm(L.q).trim();
    const mots = q ? q.split(/\s+/) : [];
    const lundi = date(AUJ), dimanche = new Date(lundi); dimanche.setDate(dimanche.getDate() + 6);
    return interventions.filter(i => {
      if (L.tech && i.tech !== L.tech) return false;
      if (L.type && i.type !== L.type) return false;
      if (L.periode !== 'tout') {
        const d = i.jour ? date(i.jour) : i.recue;
        if (L.periode === 'semaine' && (d < lundi || d > dimanche) && i.statut !== 'a_planifier') return false;
        if (L.periode === 'mois' && (d.getMonth() !== 10 || d.getFullYear() !== 2026) && i.statut !== 'a_planifier') return false;
      }
      if (mots.length) {
        const c = CL[i.client];
        const foin = i._foin || (i._foin = norm(`${i.ref} ${c.nom} ${c.ville} ${c.adresse} ${i.objet} ${i.type} ${i.tech ? T[i.tech].nom : ''} ${i.facture || ''}`));
        if (!mots.every(m => foin.includes(m))) return false;
      }
      return true;
    });
  }
  function clesTri(i, col) {
    switch (col) {
      case 'ref': return i.ref;
      case 'client': return norm(CL[i.client].nom);
      case 'tech': return i.tech ? T[i.tech].nom : '~';
      case 'prio': return RANG_PRIO[i.priorite];
      case 'statut': return i.statut === 'annulee' ? 9 : FLUX.indexOf(i.statut);
      default: return i.jour ? debutDe(i).getTime() : -1e15 + i.recue.getTime();
    }
  }
  function listeFiltree() {
    const L = etat.liste;
    const base = filtrerSansOnglet();
    const f = ONGLETS.find(o => o[0] === L.onglet)[2];
    const r = base.filter(f);
    const { col, dir } = L.tri; const s = dir === 'asc' ? 1 : -1;
    r.sort((a, b) => { const x = clesTri(a, col), y = clesTri(b, col); return (x < y ? -1 : x > y ? 1 : 0) * s || (debutDe(a.jour ? a : { jour: AUJ, heure: '00:00' }) - debutDe(b.jour ? b : { jour: AUJ, heure: '00:00' })); });
    return { base, r };
  }

  function vueListe() {
    const L = etat.liste;
    const { base, r } = listeFiltree();
    const filtresActifs = L.q || L.tech || L.type || L.periode !== 'tout';
    const visibles = r.slice(0, L.limite);
    const th = (col, l, cls) => {
      const tri = L.tri.col === col ? (L.tri.dir === 'asc' ? 'ascending' : 'descending') : null;
      return `<th${tri ? ` aria-sort="${tri}"` : ''}${cls ? ` class="${cls}"` : ''}><button type="button" data-tri="${col}">${l}${ICONES.fleche}</button></th>`;
    };
    const lignes = visibles.map((i, k) => {
      const c = CL[i.client];
      const quand = i.jour ? `${esc(jourRelatif(i.jour))} <small>${hTexte(i.heure)}</small>` : `<small>Reçue le ${esc(fJourMois.format(i.recue))}</small>`;
      return `<tr data-ref="${i.ref}" data-index="${k}" class="${k === L.actif ? 'actif' : ''}">
        <td class="mono">${i.ref}</td>
        <td class="deux"><div class="t-client">${esc(c.nom)}</div><div class="t-ville">${esc(c.ville.replace(/^\d+ /, ''))}</div></td>
        <td title="${esc(i.objet)}">${esc(i.objet)}</td>
        <td>${i.tech ? `<span class="t-tech">${avatar(i.tech, true)}<span>${esc(T[i.tech].nom)}</span></span>` : '<span class="t-sans">Non affectée</span>'}</td>
        <td class="t-date">${quand}</td>
        <td>${prio(i.priorite)}</td>
        <td>${pastille(i.statut)}</td>
      </tr>`;
    }).join('');
    const mobile = visibles.map(i => {
      const c = CL[i.client];
      return `<li><a href="#/interventions/${i.ref}"><span class="lm-t">${esc(c.nom)}</span>${pastille(i.statut)}<span class="lm-o">${esc(i.objet)}</span>
        <span class="lm-m"><span class="mono">${i.ref}</span>${i.jour ? `<span>${esc(jourRelatif(i.jour))}, ${hTexte(i.heure)}</span>` : '<span>Non planifiée</span>'}${i.tech ? `<span>${esc(T[i.tech].nom)}</span>` : ''}${i.priorite === 'urgente' ? prio('urgente') : ''}</span></a></li>`;
    }).join('');
    const vide = `<div class="vide"><strong>Aucune intervention ne correspond</strong>${filtresActifs ? 'Essayez un autre mot, ou retirez un filtre.' : 'Rien dans cette catégorie pour le moment.'}${filtresActifs ? '<br><button class="btn" type="button" data-action="effacer-filtres">Effacer les filtres</button>' : ''}</div>`;

    return `<div class="page">
      <header class="entete">
        <div><h1>Interventions</h1><p class="sous">${entier(interventions.length)} interventions depuis le 17 août</p></div>
        <div class="entete-actions">
          <button class="btn" type="button" data-action="exporter">${ICONES.export}Exporter</button>
          <button class="btn principal" type="button" data-action="nouvelle">${ICONES.plus}Nouvelle demande <kbd class="kbd-cache">N</kbd></button>
        </div>
      </header>
      ${L.nouvelle ? formNouvelle() : ''}
      <div class="onglets-statut" role="tablist" aria-label="Statut">
        ${ONGLETS.map(([k, l, f]) => `<button type="button" role="tab" aria-selected="${L.onglet === k}" data-onglet="${k}">${l}<span class="n">${base.filter(f).length}</span></button>`).join('')}
      </div>
      <div class="barre-filtres">
        <label class="recherche-liste"><span class="cache-visuel">Rechercher</span>${ICONES.loupe}<input id="q-liste" type="search" placeholder="Client, référence, ville, objet…" value="${esc(L.q)}" autocomplete="off"><kbd>/</kbd></label>
        <label><span class="cache-visuel">Technicien</span><select id="f-tech" data-filtre="tech"><option value="">Tous les techniciens</option>${TECHNICIENS.map(t => `<option value="${t.id}"${L.tech === t.id ? ' selected' : ''}>${esc(t.nom)}</option>`).join('')}</select></label>
        <label><span class="cache-visuel">Type</span><select id="f-type" data-filtre="type"><option value="">Tous les types</option>${TYPES.map(t => `<option${L.type === t ? ' selected' : ''}>${t}</option>`).join('')}</select></label>
        <label><span class="cache-visuel">Période</span><select id="f-periode" data-filtre="periode"><option value="tout"${L.periode === 'tout' ? ' selected' : ''}>Toutes les dates</option><option value="semaine"${L.periode === 'semaine' ? ' selected' : ''}>Cette semaine</option><option value="mois"${L.periode === 'mois' ? ' selected' : ''}>Novembre</option></select></label>
        ${filtresActifs ? '<button class="btn fantome" type="button" data-action="effacer-filtres">Effacer les filtres</button>' : ''}
        <span class="compteur" aria-live="polite">${r.length > visibles.length ? `${visibles.length} affichées sur ${entier(r.length)}` : `${entier(r.length)} intervention${r.length > 1 ? 's' : ''}`}</span>
      </div>
      <div class="tableau-cadre">
        ${r.length ? `<table class="tableau">
          <colgroup><col style="width:128px"><col style="width:21%"><col><col style="width:158px"><col style="width:128px"><col style="width:100px"><col style="width:136px"></colgroup>
          <thead><tr>${th('ref', 'Réf.')}${th('client', 'Client')}<th>Objet</th>${th('tech', 'Technicien')}${th('date', 'Date')}${th('prio', 'Priorité')}${th('statut', 'Statut')}</tr></thead>
          <tbody>${lignes}</tbody></table><ul class="liste-mobile">${mobile}</ul>` : vide}
        ${r.length > visibles.length ? `<div class="pied-liste"><button class="btn" type="button" data-action="plus">Afficher ${Math.min(60, r.length - visibles.length)} de plus</button></div>` : ''}
      </div>
    </div>`;
  }

  function formNouvelle() {
    const n = etat.liste.brouillon || {};
    const e = n.erreurs || {};
    return `<form class="panneau nouvelle" id="form-nouvelle" novalidate>
      <div class="bloc-entete" style="margin:0"><h2 class="titre">Nouvelle demande</h2><span class="aide">Elle rejoint les demandes à placer</span></div>
      <div class="nouvelle-grille">
        <label class="champ${e.client ? ' invalide' : ''}"><span>Client</span><select id="n-client" name="client"><option value="">Choisir un client…</option>${CLIENTS.slice().sort((a, b) => a.nom.localeCompare(b.nom, 'fr')).map(c => `<option value="${c.id}"${n.client === c.id ? ' selected' : ''}>${esc(c.nom)}</option>`).join('')}</select></label>
        <label class="champ${e.objet ? ' invalide' : ''}"><span>Objet</span><input id="n-objet" name="objet" type="text" placeholder="Par exemple : radiateur froid dans la salle d’attente" value="${esc(n.objet || '')}"></label>
        <label class="champ"><span>Type</span><select id="n-type" name="type">${TYPES.map(t => `<option${(n.type || 'Chauffage') === t ? ' selected' : ''}>${t}</option>`).join('')}</select></label>
        <label class="champ"><span>Priorité</span><select id="n-prio" name="prio"><option value="normale"${n.prio !== 'urgente' ? ' selected' : ''}>Normale</option><option value="urgente"${n.prio === 'urgente' ? ' selected' : ''}>Urgente</option></select></label>
      </div>
      <label class="champ"><span>Ce que dit le client</span><textarea id="n-desc" name="desc" rows="2" placeholder="Les mots du client, l’accès, les horaires à éviter">${esc(n.desc || '')}</textarea></label>
      ${e.client || e.objet ? `<p class="erreur" role="alert">${[e.client && 'Choisissez le client', e.objet && 'indiquez l’objet de la demande'].filter(Boolean).join(' et ')}.</p>` : ''}
      <div class="nouvelle-actions"><button class="btn fantome" type="button" data-action="fermer-nouvelle">Fermer</button><button class="btn principal" type="submit" id="n-enregistrer">Enregistrer la demande <kbd class="kbd-cache">${MAC ? '⌘' : 'Ctrl '}↵</kbd></button></div>
    </form>`;
  }

  function enregistrerNouvelle() {
    const f = document.getElementById('form-nouvelle'); if (!f) return;
    const d = { client: f.client.value, objet: f.objet.value.trim(), type: f.type.value, prio: f.prio.value, desc: f.desc.value.trim() };
    const erreurs = { client: !d.client, objet: !d.objet };
    if (erreurs.client || erreurs.objet) { etat.liste.brouillon = { ...d, erreurs }; rafraichir(); (erreurs.client ? document.getElementById('n-client') : document.getElementById('n-objet')).focus(); return; }
    const bouton = document.getElementById('n-enregistrer');
    bouton.disabled = true; bouton.textContent = 'Enregistrement…';
    setTimeout(() => {
      const c = CL[d.client];
      const cleCat = { Chauffage: 'froid', Climatisation: 'clim-err', Plomberie: 'robinet', Ventilation: 'vmcarret' }[d.type];
      const max = Math.max(...interventions.filter(i => i.ref.startsWith('INT-2611')).map(i => +i.ref.slice(-4)));
      const it = {
        ref: `INT-2611-${String(max + 1).padStart(4, '0')}`, client: c.id, objet: d.objet, cle: cleCat, description: d.desc || 'Pas de précision donnée à l’appel.',
        type: d.type, priorite: d.prio, statut: 'a_planifier', tech: null, jour: null, heure: null, duree: 1.5, dureeReelle: 1.5,
        recue: horloge(), canal: 'Téléphone', demandeur: c.contact, rapport: null, pieces: [], montant: TARIF.deplacement + TARIF.heure * 1.5, facture: null, annulation: null,
        historique: [{ quand: horloge(), qui: UTILISATRICE.nom, quoi: 'Demande reçue par téléphone', detail: `Demandeur : ${c.contact}`, recent: true }]
      };
      interventions.unshift(it);
      etat.liste.nouvelle = false; etat.liste.brouillon = null;
      etat.liste.onglet = 'a_planifier'; dernierChange = it.ref;
      rafraichir();
      message(`Demande ${it.ref} enregistrée pour ${c.nom}.`, () => { interventions.splice(interventions.indexOf(it), 1); rafraichir(); message('Demande supprimée.'); });
    }, 380);
  }

  function exporter() {
    const { r } = listeFiltree();
    const lignes = [['Référence', 'Client', 'Ville', 'Objet', 'Type', 'Technicien', 'Date', 'Heure', 'Priorité', 'Statut', 'Montant HT']];
    for (const i of r) lignes.push([i.ref, CL[i.client].nom, CL[i.client].ville, i.objet, i.type, i.tech ? T[i.tech].nom : '', i.jour || '', i.heure || '', PRIO[i.priorite], STATUTS[i.statut], i.montant != null ? String(i.montant).replace('.', ',') : '']);
    const csv = '﻿' + lignes.map(l => l.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\r\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = `interventions-${AUJ}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    message(`${entier(r.length)} interventions exportées au format CSV.`);
  }

  /* =========================================================
     Fiche d'une intervention
     ========================================================= */
  function vueFiche(it) {
    if (!it) return `<div class="page"><div class="fil"><a href="#/interventions">Interventions</a></div><div class="panneau vide"><strong>Cette intervention n’existe pas</strong>La référence ${esc(etat.ref)} ne correspond à aucune intervention de l’agence.<br><a class="btn" href="#/interventions">Revenir à la liste</a></div></div>`;
    etat.recents = [it.ref, ...etat.recents.filter(r => r !== it.ref)].slice(0, 5);
    const c = CL[it.client];
    const suite = PROCHAINE[it.statut];
    const { r } = listeFiltree();
    const pos = r.indexOf(it);
    const prec = pos > 0 ? r[pos - 1] : null, suiv = pos >= 0 && pos < r.length - 1 ? r[pos + 1] : null;
    const boutonSuite = suite ? `<button class="btn principal" type="button" data-action="${suite.a || 'statut'}" data-cible="${suite.cible || ''}" data-ref="${it.ref}">${suite.l}</button>` : '';

    // Étapes du parcours
    const quandEtape = {};
    for (const h of it.historique) {
      if (/^Demande reçue|^Visite programmée/.test(h.quoi)) quandEtape.a_planifier = h.quand;
      if (/^Planifiée/.test(h.quoi)) quandEtape.planifiee = h.quand;
      if (/démarrée/.test(h.quoi)) quandEtape.en_cours = h.quand;
      if (/terminée/.test(h.quoi)) quandEtape.terminee = h.quand;
      if (/^Rapport validé/.test(h.quoi)) quandEtape.cloturee = h.quand;
    }
    const idx = FLUX.indexOf(it.statut);
    const etiquettes = { a_planifier: 'Reçue', planifiee: 'Planifiée', en_cours: 'En cours', terminee: 'Terminée', cloturee: 'Clôturée' };
    const etapes = FLUX.map((s, k) => {
      const cls = it.statut === 'annulee' ? '' : k < idx ? 'faite' : k === idx ? (k === 0 ? 'courante' : (s === 'cloturee' ? 'faite' : 'courante')) : '';
      const d = quandEtape[s];
      let detail = d ? `${jourRelatif(cleJour(d))}, ${heureTexte(d)}` : '';
      if (s === 'planifiee' && it.jour && k >= idx) detail = `Prévue ${jourRelatif(it.jour).toLowerCase()}, ${hTexte(it.heure)}`;
      return `<div class="etape ${cls}"${k === idx ? ' aria-current="step"' : ''}><div class="e-n">${etiquettes[s]}</div><div class="e-d">${esc(detail)}</div></div>`;
    }).join('');

    // Rapport et montants
    let rapport;
    if (it.statut === 'annulee') rapport = `<div class="attente-rapport">Intervention annulée : ${esc(it.annulation || 'motif non précisé')}</div>`;
    else if (it.rapport) {
      const mo = Math.round(TARIF.heure * it.dureeReelle * 100) / 100;
      const depot = it.historique.find(h => /terminée/.test(h.quoi));
      const lignes = it.montant == null ? `<p class="rapport-signe" style="padding-top:0">Visite comprise au ${esc((c.contrat || 'contrat d’entretien').charAt(0).toLowerCase() + (c.contrat || 'contrat d’entretien').slice(1))} : rien à facturer.</p>` :
        `<table class="lignes"><thead><tr><th>Désignation</th><th class="r">Qté</th><th class="r">Prix unitaire HT</th><th class="r">Total HT</th></tr></thead><tbody>
          <tr><td>Déplacement, métropole de Lyon</td><td class="r">1</td><td class="r">${euros(TARIF.deplacement)}</td><td class="r">${euros(TARIF.deplacement)}</td></tr>
          <tr><td>Main-d’œuvre, ${dureeTexte(it.dureeReelle)}</td><td class="r">${String(it.dureeReelle).replace('.', ',')} h</td><td class="r">${euros(TARIF.heure)}</td><td class="r">${euros(mo)}</td></tr>
          ${it.pieces.map(p => `<tr><td>${esc(p.libelle)}</td><td class="r">${p.qte}</td><td class="r">${euros(p.pu)}</td><td class="r">${euros(p.pu * p.qte)}</td></tr>`).join('')}
        </tbody><tfoot><tr><td colspan="3">${it.facture ? `Total HT · facture ${it.facture}` : 'Total HT, facture préparée à la validation'}</td><td class="r">${euros(it.montant)}</td></tr></tfoot></table>`;
      rapport = `<div class="rapport"><p class="rapport-texte">${esc(it.rapport)}</p><p class="rapport-signe">${esc(T[it.tech].nom)}${depot ? `, ${quandRelatif(depot.quand)}` : ''} · ${dureeTexte(it.dureeReelle)} sur place</p>${lignes}</div>`;
    } else if (it.statut === 'a_planifier') rapport = `<div class="attente-rapport">Le rapport sera rempli par le technicien sur place, une fois l’intervention planifiée.</div>`;
    else rapport = `<div class="attente-rapport">${esc(T[it.tech].nom)} remplira son rapport depuis son téléphone à la fin de l’intervention.</div>`;

    const debut = it.jour ? debutDe(it) : null;
    const affectation = it.statut === 'a_planifier' || etat.modifPlanif === it.ref ? formPlanif(it, 'fiche') :
      it.tech ? `<div class="affect">${avatar(it.tech)}<div><div class="n">${esc(T[it.tech].nom)}</div><div class="q">${majuscule(fJourLong.format(debut))}, ${heureTexte(debut)} à ${heureTexte(finDe(it))}</div></div></div>` : '';
    const peutDeplacer = it.statut === 'planifiee';

    const historique = it.historique.slice().sort((a, b) => b.quand - a.quand).map(h => `<li class="${h.quoi === 'Note' ? 'note' : ''}${h.recent ? ' recent' : ''}">
      <span class="pt" aria-hidden="true"></span><div>
      <div class="h-quoi">${h.quoi === 'Note' ? `Note de ${esc(h.qui)}` : esc(h.quoi)}${h.montant != null ? ` · ${euros(h.montant)} HT` : ''}</div>
      ${h.detail ? `<div class="h-detail">${esc(majuscule(h.detail))}</div>` : ''}
      <div class="h-qui">${h.quoi === 'Note' ? '' : esc(h.qui) + ' · '}${esc(quandRelatif(h.quand))}</div></div></li>`).join('');

    return `<div class="page fiche">
      <div class="fil"><a href="#/interventions">Interventions</a><span aria-hidden="true">/</span><span class="mono">${it.ref}</span>
        <span style="margin-left:auto;display:flex;gap:4px;align-items:center">${pos >= 0 ? `<span class="num" style="margin-right:6px">${pos + 1} sur ${entier(r.length)}</span>` : ''}
          <a class="btn petit fantome" ${prec ? `href="#/interventions/${prec.ref}"` : 'aria-disabled="true" style="opacity:.4;pointer-events:none"'} title="Précédente (K)" aria-label="Intervention précédente">${ICONES.gauche}</a>
          <a class="btn petit fantome" ${suiv ? `href="#/interventions/${suiv.ref}"` : 'aria-disabled="true" style="opacity:.4;pointer-events:none"'} title="Suivante (J)" aria-label="Intervention suivante">${ICONES.droite}</a></span></div>
      <header class="fiche-entete">
        <div>
          <h1>${esc(it.objet)}</h1>
          <div class="fiche-meta">${pastille(it.statut).replace('class="statut', `class="statut${dernierChange === it.ref ? ' change' : ''}`)}${prio(it.priorite)}<span class="sep"></span><span>${esc(c.nom)}</span><span class="sep"></span><span>${esc(it.type)}</span></div>
        </div>
        <div class="entete-actions">
          <div class="menu-statut">
            <button class="btn" type="button" data-action="menu-statut" aria-haspopup="menu" aria-expanded="false" id="b-statut">Changer le statut ${ICONES.bas}<kbd>S</kbd></button>
          </div>
          ${boutonSuite}
        </div>
      </header>
      ${etat.confirmerAnnulation === it.ref ? `<div class="confirmation" role="alertdialog" aria-labelledby="t-annul">
        <p id="t-annul"><strong>Annuler l’intervention ${it.ref} ?</strong> ${it.tech && it.statut !== 'a_planifier' ? `Le créneau de ${esc(T[it.tech].nom)} sera libéré.` : ''} Indiquez le motif, il restera dans l’historique.</p>
        <div class="ligne"><select id="motif-annul"><option>Le client a résolu le problème lui-même</option><option>Le client a reporté sa demande</option><option>Doublon d’une demande déjà enregistrée</option><option>Hors de notre domaine d’intervention</option></select>
        <button class="btn danger" type="button" data-action="confirmer-annulation" data-ref="${it.ref}">Annuler l’intervention</button><button class="btn fantome" type="button" data-action="garder">Garder</button></div></div>` : ''}
      <div class="etapes${it.statut === 'annulee' ? ' annulee' : ''}" aria-label="Avancement">${etapes}</div>
      <div class="fiche-grille">
        <div>
          <section class="section"><h2>Demande</h2>
            <p class="texte-demande">${esc(it.description)}</p>
            <dl class="attributs" style="margin-top:14px">
              <dt>Reçue</dt><dd>${esc(majuscule(quandRelatif(it.recue)))}, ${it.canal === 'Contrat' ? 'visite programmée au contrat' : 'par ' + it.canal.toLowerCase()}</dd>
              <dt>Demandeur</dt><dd>${esc(it.demandeur)}</dd>
              <dt>Référence</dt><dd class="mono">${it.ref}</dd>
            </dl>
          </section>
          <section class="section"><h2>Site d’intervention</h2>
            <dl class="attributs">
              <dt>Adresse</dt><dd>${esc(c.adresse)}, ${esc(c.ville)}</dd>
              <dt>Accès</dt><dd>${esc(c.acces)}</dd>
              <dt>Contrat</dt><dd>${c.contrat ? esc(c.contrat) : 'Aucun, intervention facturée au temps passé'}</dd>
            </dl>
          </section>
          <section class="section"><h2>Rapport du technicien</h2>${rapport}</section>
        </div>
        <aside>
          <section class="carte-laterale"><h2>Affectation ${peutDeplacer && etat.modifPlanif !== it.ref ? `<button class="btn petit fantome" type="button" data-action="modifier-planif" data-ref="${it.ref}">Déplacer</button>` : etat.modifPlanif === it.ref ? `<button class="btn petit fantome" type="button" data-action="fermer-planif">Fermer</button>` : ''}</h2>
            <div class="contenu" ${it.statut === 'a_planifier' || etat.modifPlanif === it.ref ? 'style="padding:10px 0 0"' : ''}>${affectation || '<span style="color:var(--encre-3)">Aucun technicien</span>'}</div></section>
          <section class="carte-laterale"><h2>Client</h2><div class="contenu">
            <div style="font-weight:500">${esc(c.nom)}</div><div style="color:var(--encre-3);font-size:13px;margin-bottom:6px">${esc(c.genre)}</div>
            <div class="ligne-info"><span>Contact</span><span>${esc(c.contact)}</span></div>
            <div class="ligne-info"><span>Téléphone</span><a class="tel" href="tel:${c.tel.replace(/\s/g, '')}">${c.tel}</a></div>
            <div class="ligne-info"><span>Interventions</span><a href="#/interventions" data-voir-client="${c.id}" class="tel">${interventions.filter(i => i.client === c.id).length} au total</a></div>
          </div></section>
          <section class="carte-laterale" aria-labelledby="t-histo"><h2 id="t-histo">Historique</h2>
            <form class="note-saisie" id="form-note" style="padding-top:10px"><label class="cache-visuel" for="note">Ajouter une note</label>
              <textarea id="note" rows="2" placeholder="Ajouter une note pour l’équipe…"></textarea>
              <div class="actions"><span>${MAC ? '⌘' : 'Ctrl '}↵ pour enregistrer</span><button class="btn petit" type="submit">Ajouter la note</button></div></form>
            <ol class="historique" reversed>${historique}</ol>
          </section>
        </aside>
      </div>
      ${suite ? `<div class="barre-action-mobile"><button class="btn" type="button" data-action="menu-statut-mobile">Statut</button>${boutonSuite}</div>` : ''}
    </div>`;
  }

  function ouvrirMenuStatut(bouton) {
    fermerMenus();
    const it = parRef(etat.ref); if (!it) return;
    const menu = document.createElement('div');
    menu.className = 'menu'; menu.setAttribute('role', 'menu');
    menu.innerHTML = Object.keys(STATUTS).filter(s => s !== 'annulee').map(s => `<button type="button" role="menuitemradio" aria-checked="${it.statut === s}" data-choix-statut="${s}">${pastille(s)}${it.statut === s ? '<span style="color:var(--encre-3);font-size:12px">actuel</span>' : ''}</button>`).join('') +
      `<hr><button type="button" role="menuitem" class="danger" data-action="annuler-intervention"${it.statut === 'annulee' ? ' disabled' : ''}>Annuler l’intervention…</button>`;
    const parent = bouton.closest('.menu-statut') || document.querySelector('.menu-statut');
    parent.appendChild(menu);
    (document.getElementById('b-statut') || bouton).setAttribute('aria-expanded', 'true');
    menu.querySelector('button').focus();
    menu.addEventListener('keydown', e => {
      const items = [...menu.querySelectorAll('button:not([disabled])')];
      const k = items.indexOf(document.activeElement);
      if (e.key === 'ArrowDown') { e.preventDefault(); items[(k + 1) % items.length].focus(); }
      if (e.key === 'ArrowUp') { e.preventDefault(); items[(k - 1 + items.length) % items.length].focus(); }
      if (e.key === 'Escape') { e.stopPropagation(); fermerMenus(); document.getElementById('b-statut')?.focus(); }
    });
  }
  function fermerMenus() { document.querySelectorAll('.menu').forEach(m => m.remove()); document.getElementById('b-statut')?.setAttribute('aria-expanded', 'false'); }

  /* =========================================================
     Statistiques
     ========================================================= */
  function semainesHisto() {
    const s = [];
    for (let k = 0; k < 12; k++) { const d = new Date(2026, 7, 17 + 7 * k); s.push(d); }
    return s;
  }
  function stats(debut, fin) {
    const dans = i => i.jour && date(i.jour) >= debut && date(i.jour) < fin;
    const faites = interventions.filter(i => dans(i) && ['terminee', 'cloturee'].includes(i.statut));
    const urg = faites.filter(i => i.priorite === 'urgente');
    const delai = urg.length ? urg.reduce((s, i) => s + (debutDe(i) - i.recue) / 3600000, 0) / urg.length : 0;
    let sous24 = 0, valides = 0;
    for (const i of faites) {
      const fin = i.historique.find(h => /terminée/.test(h.quoi)), v = i.historique.find(h => /^Rapport validé/.test(h.quoi));
      if (fin && v) { valides++; if (v.quand - fin.quand <= 24 * 3600000) sous24++; }
    }
    const factu = faites.filter(i => i.facture).reduce((s, i) => s + i.montant, 0);
    return { n: faites.length, faites, delai, sous24, valides, factu, urg: urg.length };
  }
  const delaiTexte = h => { const hh = Math.floor(h), mm = Math.round((h - hh) * 60); return `${hh}\u00a0h\u00a0${pad(mm)}`; };

  function vueStats() {
    const sem = semainesHisto();
    const nb = etat.stats;
    const debutP = sem[12 - nb], finP = new Date(2026, 10, 9);
    const P = stats(debutP, finP);
    const prec = nb === 4 ? stats(sem[4], sem[8]) : null;
    const comp = (v, a, f) => prec ? `<b>${f(a)}</b> sur les quatre semaines d’avant` : '';
    const parSemaine = sem.map((d, k) => { const f = new Date(d); f.setDate(f.getDate() + 7); const s = stats(d, f); return { d, n: s.n, delai: s.delai, dans: k >= 12 - nb }; });

    // Barres verticales : interventions par semaine
    const W = 560, H = 210, g = 34, b = 18;
    const max = Math.ceil(Math.max(...parSemaine.map(s => s.n)) / 20) * 20;
    const larg = (W - g) / 12;
    const y = v => H - b - (v / max) * (H - b - 12);
    let svgB = `<svg class="trace" viewBox="0 0 ${W} ${H}" role="img" aria-label="Interventions réalisées par semaine, de ${parSemaine[0].n} à ${parSemaine[11].n}">`;
    for (let v = 0; v <= max; v += max / 4) svgB += `<line class="${v ? 'grille' : 'base'}" x1="${g}" x2="${W}" y1="${y(v)}" y2="${y(v)}"/><text class="axe" x="${g - 8}" y="${y(v) + 4}" text-anchor="end">${v}</text>`;
    parSemaine.forEach((s, k) => {
      const x = g + k * larg + 5, w = larg - 10;
      const yy = y(s.n);
      svgB += `<path class="barre${s.dans ? '' : ' secondaire'}" d="M${x},${H - b} V${yy + 4} Q${x},${yy} ${x + 4},${yy} H${x + w - 4} Q${x + w},${yy} ${x + w},${yy + 4} V${H - b} Z"/>`;
      if (k % 2 === 0 || window.innerWidth > 1000) svgB += `<text class="axe" x="${x + w / 2}" y="${H}" text-anchor="middle">${fJourMois.format(s.d).replace('.', '')}</text>`;
      svgB += `<rect class="cible-survol" x="${g + k * larg}" y="0" width="${larg}" height="${H - b}" data-info="Semaine du ${fJourMois.format(s.d)}|${s.n} interventions réalisées"/>`;
    });
    svgB += '</svg>';

    // Courbe : délai avant intervention pour une urgence
    const maxD = 6;
    const yd = v => H - b - (v / maxD) * (H - b - 12);
    const xd = k => g + k * larg + larg / 2;
    const moy = parSemaine.reduce((s, x) => s + x.delai, 0) / 12;
    let svgL = `<svg class="trace" viewBox="0 0 ${W} ${H}" role="img" aria-label="Délai moyen avant intervention pour une urgence, par semaine">`;
    for (let v = 0; v <= maxD; v += 2) svgL += `<line class="${v ? 'grille' : 'base'}" x1="${g}" x2="${W}" y1="${yd(v)}" y2="${yd(v)}"/><text class="axe" x="${g - 8}" y="${yd(v) + 4}" text-anchor="end">${v} h</text>`;
    svgL += `<line class="repere" x1="${g}" x2="${W}" y1="${yd(moy)}" y2="${yd(moy)}"/><text class="valeur" x="${W}" y="${yd(moy) - 6}" text-anchor="end">moyenne ${delaiTexte(moy)}</text>`;
    svgL += `<path class="courbe" d="${parSemaine.map((s, k) => `${k ? 'L' : 'M'}${xd(k)},${yd(s.delai)}`).join(' ')}"/>`;
    parSemaine.forEach((s, k) => {
      svgL += `<circle class="point" cx="${xd(k)}" cy="${yd(s.delai)}" r="${s.dans ? 4 : 3}" style="${s.dans ? '' : 'fill:oklch(80% .05 228)'}"/>`;
      if (k % 2 === 0 || window.innerWidth > 1000) svgL += `<text class="axe" x="${xd(k)}" y="${H}" text-anchor="middle">${fJourMois.format(s.d).replace('.', '')}</text>`;
      svgL += `<rect class="cible-survol" x="${g + k * larg}" y="0" width="${larg}" height="${H - b}" data-info="Semaine du ${fJourMois.format(s.d)}|${delaiTexte(s.delai)} en moyenne entre l’appel et l’arrivée"/>`;
    });
    svgL += '</svg>';

    // Répartition par type
    const parType = TYPES.map(t => ({ t, n: P.faites.filter(i => i.type === t).length })).sort((a, b) => b.n - a.n);
    const maxT = parType[0].n || 1;
    const barresType = parType.map(x => `<li><span class="bh-l">${x.t}</span><span class="bh-piste"><span class="bh-val" style="width:${x.n / maxT * 100}%"></span></span><span class="bh-n">${x.n} · ${Math.round(x.n / P.n * 100)}\u00a0%</span></li>`).join('');

    // Charge de la semaine
    const lundi = date(AUJ), vendredi = new Date(lundi); vendredi.setDate(vendredi.getDate() + 5);
    const joursOuvres = [0, 1, 2, 3, 4].filter(k => { const d = new Date(lundi); d.setDate(d.getDate() + k); return jourOuvre(d); }).length;
    const capacite = joursOuvres * 7.5;
    const charges = TECHNICIENS.map(t => ({ t, h: interventions.filter(i => i.tech === t.id && i.jour && date(i.jour) >= lundi && date(i.jour) < vendredi && i.statut !== 'annulee').reduce((s, i) => s + i.duree, 0) }));
    const barresCharge = charges.map(x => `<li><span class="bh-l">${esc(x.t.nom)}</span><span class="bh-piste" title="Capacité ${capacite} h"><span class="bh-val${x.h / capacite > .9 ? ' plein' : ''}" style="width:${Math.min(100, x.h / capacite * 100)}%"></span></span><span class="bh-n">${dureeTexte(x.h)} sur ${capacite}\u00a0h</span></li>`).join('');

    const tableau = (entetes, lignes) => `<details><summary>Voir les données</summary><table><thead><tr>${entetes.map((e, k) => `<th${k ? ' class="r"' : ''}>${e}</th>`).join('')}</tr></thead><tbody>${lignes.map(l => `<tr>${l.map((v, k) => `<td${k ? ' class="r"' : ''}>${v}</td>`).join('')}</tr>`).join('')}</tbody></table></details>`;
    const libP = nb === 4 ? 'Quatre dernières semaines, du 12 octobre au 6 novembre' : 'Douze dernières semaines, du 17 août au 6 novembre';

    return `<div class="page">
      <header class="entete">
        <div><h1>Statistiques</h1><p class="sous">${libP}</p></div>
        <div class="segment" role="group" aria-label="Période"><button type="button" data-periode-stats="4" aria-pressed="${nb === 4}">4 semaines</button><button type="button" data-periode-stats="12" aria-pressed="${nb === 12}">12 semaines</button></div>
      </header>
      <div class="bande-chiffres">
        <div><div class="l">Interventions réalisées</div><div class="v">${entier(P.n)}</div><div class="d">${prec ? comp(P.n, prec.n, entier) : `${Math.round(P.n / nb)} par semaine en moyenne`}</div></div>
        <div><div class="l">Délai moyen pour une urgence</div><div class="v">${delaiTexte(P.delai)}</div><div class="d">${prec ? comp(P.delai, prec.delai, delaiTexte) : `entre l’appel et l’arrivée, sur ${P.urg} urgences`}</div></div>
        <div><div class="l">Rapports validés en moins de 24 h</div><div class="v">${Math.round(P.sous24 / P.valides * 10)} sur 10</div><div class="d">${entier(P.sous24)} rapports sur ${entier(P.valides)}</div></div>
        <div><div class="l">Montant facturé HT</div><div class="v">${euros(Math.round(P.factu)).replace(/,00/, '')}</div><div class="d">${prec ? comp(P.factu, prec.factu, v => euros(Math.round(v)).replace(/,00/, '')) : 'hors visites comprises aux contrats'}</div></div>
      </div>
      <div class="graphes">
        <section class="graphe"><h2>Interventions réalisées par semaine</h2><p class="g-sous">La période choisie est en couleur pleine</p>${svgB}
          ${tableau(['Semaine du', 'Interventions'], parSemaine.map(s => [fJourMois.format(s.d), s.n]))}</section>
        <section class="graphe"><h2>Délai avant intervention pour une urgence</h2><p class="g-sous">Temps moyen entre l’appel du client et l’arrivée du technicien</p>${svgL}
          ${tableau(['Semaine du', 'Délai moyen'], parSemaine.map(s => [fJourMois.format(s.d), delaiTexte(s.delai)]))}</section>
        <section class="graphe"><h2>Répartition par type</h2><p class="g-sous">Interventions réalisées sur la période</p><ul class="barres-h">${barresType}</ul>
          ${tableau(['Type', 'Interventions'], parType.map(x => [x.t, x.n]))}</section>
        <section class="graphe"><h2>Charge de la semaine en cours</h2><p class="g-sous">Heures planifiées sur ${joursOuvres} jours ouvrés, le 11 novembre est férié</p><ul class="barres-h">${barresCharge}</ul>
          ${tableau(['Technicien', 'Heures planifiées'], charges.map(x => [esc(x.t.nom), dureeTexte(x.h)]))}</section>
      </div>
    </div>`;
  }

  /* =========================================================
     Palette de commandes
     ========================================================= */
  const palette = document.getElementById('palette');
  let pal = null;
  function ouvrirPalette(mode) {
    fermerMenus();
    pal = { q: '', sel: 0, mode: mode || 'commandes', avant: document.activeElement };
    palette.hidden = false;
    palette.innerHTML = `<div class="palette-boite" role="dialog" aria-modal="true" aria-label="${pal.mode === 'raccourcis' ? 'Raccourcis clavier' : 'Rechercher ou lancer une commande'}">
      ${pal.mode === 'raccourcis' ? `<div class="palette-saisie"><h2 style="font-size:14px;font-weight:600;margin:0;height:52px;display:flex;align-items:center">Raccourcis clavier</h2></div>${raccourcis()}` :
      `<div class="palette-saisie">${ICONES.loupe}<input id="pal-q" type="text" placeholder="Rechercher une intervention, un client, une page…" autocomplete="off" role="combobox" aria-expanded="true" aria-controls="pal-res" aria-autocomplete="list"><kbd>Échap</kbd></div>
      <div class="palette-resultats" id="pal-res" role="listbox"></div>
      <div class="palette-pied"><span><kbd>↑</kbd><kbd>↓</kbd> parcourir</span><span><kbd>↵</kbd> ouvrir</span><span><kbd>Échap</kbd> fermer</span></div>`}
    </div>`;
    if (pal.mode !== 'raccourcis') {
      const q = document.getElementById('pal-q');
      q.focus();
      q.addEventListener('input', () => { pal.q = q.value; pal.sel = 0; remplirPalette(); });
      remplirPalette();
    } else palette.querySelector('.palette-boite').setAttribute('tabindex', '-1'), palette.querySelector('.palette-boite').focus();
  }
  function fermerPalette() { if (!pal) return; palette.hidden = true; palette.innerHTML = ''; const a = pal.avant; pal = null; if (a && a.focus) a.focus(); }
  function raccourcis() {
    const m = MAC ? '⌘' : 'Ctrl';
    const r = (l, ...k) => `<div><span>${l}</span><span>${k.map(x => `<kbd>${x}</kbd>`).join('')}</span></div>`;
    return `<div class="raccourcis"><h3>Partout</h3>${r('Rechercher, lancer une commande', m, 'K')}${r('Aujourd’hui', 'G', 'A')}${r('Interventions', 'G', 'I')}${r('Statistiques', 'G', 'S')}${r('Nouvelle demande', 'N')}${r('Annuler la dernière modification', m, 'Z')}
      <h3>Liste des interventions</h3>${r('Chercher dans la liste', '/')}${r('Ligne suivante ou précédente', 'J', 'K')}${r('Ouvrir la ligne choisie', '↵')}${r('Changer d’onglet', '[', ']')}
      <h3>Fiche d’une intervention</h3>${r('Changer le statut', 'S')}${r('Écrire une note', 'C')}${r('Intervention suivante ou précédente', 'J', 'K')}${r('Revenir à la liste', 'Échap')}</div>`;
  }
  function commandesPalette() {
    const q = norm(pal.q).trim();
    const groupes = [];
    const it = etat.ref && parRef(etat.ref);
    const actions = [];
    if (it && PROCHAINE[it.statut] && PROCHAINE[it.statut].cible) actions.push({ ic: 'eclair', t: `${PROCHAINE[it.statut].l}`, s: it.ref, faire: () => changerStatut(it, PROCHAINE[it.statut].cible) });
    if (it && it.statut === 'a_planifier') { const p = proposer(it); actions.push({ ic: 'eclair', t: `Planifier pour ${T[p.tech].nom}`, s: `${jourRelatif(p.jour).toLowerCase()} à ${hTexte(p.heure)}`, faire: () => planifier(it, p.tech, p.jour, p.heure, 'proposition acceptée') }); }
    actions.push({ ic: 'doc', t: 'Nouvelle demande', s: 'N', faire: () => ouvrirNouvelle() });
    actions.push({ ic: 'fleche_d', t: 'Voir les demandes à placer', faire: () => { allerOnglet('a_planifier'); } });
    actions.push({ ic: 'fleche_d', t: 'Voir les rapports à valider', faire: () => { allerOnglet('terminee'); } });
    actions.push({ ic: 'doc', t: 'Exporter les interventions affichées', s: 'CSV', faire: () => exporter() });
    const pages = [
      { ic: 'fleche_d', t: 'Aujourd’hui', s: 'G A', faire: () => { location.hash = '#/aujourdhui'; } },
      { ic: 'fleche_d', t: 'Interventions', s: 'G I', faire: () => { location.hash = '#/interventions'; } },
      { ic: 'fleche_d', t: 'Statistiques', s: 'G S', faire: () => { location.hash = '#/statistiques'; } }
    ];
    const filtre = l => q ? l.filter(o => norm(o.t + ' ' + (o.s || '')).includes(q)) : l;
    if (!q && etat.recents.length) groupes.push(['Consultées récemment', etat.recents.map(parRef).filter(Boolean).map(optionIntervention)]);
    const a = filtre(actions); if (a.length) groupes.push(['Actions', a.slice(0, q ? 4 : 6)]);
    const p = filtre(pages); if (p.length) groupes.push(['Aller à', p]);
    if (q) {
      const mots = q.split(/\s+/);
      const res = interventions.filter(i => { const c = CL[i.client]; const f = i._foin || (i._foin = norm(`${i.ref} ${c.nom} ${c.ville} ${c.adresse} ${i.objet} ${i.type} ${i.tech ? T[i.tech].nom : ''} ${i.facture || ''}`)); return mots.every(m => f.includes(m)); })
        .sort((x, y) => (['cloturee', 'annulee'].includes(x.statut) - ['cloturee', 'annulee'].includes(y.statut)) || Math.abs(debutDe(x.jour ? x : { jour: AUJ, heure: '10:00' }) - A.MAINTENANT) - Math.abs(debutDe(y.jour ? y : { jour: AUJ, heure: '10:00' }) - A.MAINTENANT));
      if (res.length) groupes.push([`Interventions · ${res.length}`, res.slice(0, 7).map(optionIntervention)]);
      const cl = CLIENTS.filter(c => mots.every(m => norm(`${c.nom} ${c.ville} ${c.contact}`).includes(m)));
      if (cl.length) groupes.push(['Clients', cl.slice(0, 4).map(c => ({ ic: 'batiment', t: c.nom, s: c.ville, faire: () => voirClient(c.id) }))]);
    }
    return groupes;
  }
  function optionIntervention(i) {
    return { ic: 'doc', t: CL[i.client].nom, s: `${i.ref} · ${i.objet}`, droite: pastille(i.statut), faire: () => { location.hash = `#/interventions/${i.ref}`; } };
  }
  function surligner(t) {
    const q = norm(pal.q).trim(); if (!q) return esc(t);
    const n = norm(t); const k = n.indexOf(q.split(/\s+/)[0]);
    if (k < 0) return esc(t);
    const l = q.split(/\s+/)[0].length;
    return esc(t.slice(0, k)) + '<mark>' + esc(t.slice(k, k + l)) + '</mark>' + esc(t.slice(k + l));
  }
  function remplirPalette() {
    const groupes = commandesPalette();
    pal.options = groupes.flatMap(g => g[1]);
    pal.sel = Math.min(pal.sel, Math.max(0, pal.options.length - 1));
    const res = document.getElementById('pal-res');
    if (!pal.options.length) { res.innerHTML = `<div class="palette-vide">Aucun résultat pour « ${esc(pal.q)} ».<br>Essayez un nom de client, une ville ou une référence.</div>`; return; }
    let k = 0;
    res.innerHTML = groupes.map(([titre, opts]) => `<div class="palette-groupe">${esc(titre)}</div>` + opts.map(o => {
      const i = k++;
      return `<div class="palette-option" role="option" id="po-${i}" data-option="${i}" aria-selected="${i === pal.sel}"><svg class="po-ic" viewBox="0 0 16 16" aria-hidden="true">${(ICONES[o.ic] || '').replace(/^<svg[^>]*>|<\/svg>$/g, '')}</svg><span class="po-t">${surligner(o.t)}${o.s ? `<small>${surligner(o.s)}</small>` : ''}</span>${o.droite || ''}</div>`;
    }).join('')).join('');
    document.getElementById('pal-q').setAttribute('aria-activedescendant', `po-${pal.sel}`);
  }
  function choisirPalette(i) {
    const o = pal.options[i]; if (!o) return;
    fermerPalette(); o.faire();
  }
  palette.addEventListener('mousedown', e => { if (e.target === palette) fermerPalette(); });
  palette.addEventListener('mousemove', e => {
    const o = e.target.closest('[data-option]'); if (!o || !pal) return;
    const i = +o.dataset.option; if (i === pal.sel) return;
    pal.sel = i; palette.querySelectorAll('[data-option]').forEach(x => x.setAttribute('aria-selected', +x.dataset.option === i));
  });
  palette.addEventListener('click', e => { const o = e.target.closest('[data-option]'); if (o) choisirPalette(+o.dataset.option); });
  palette.addEventListener('keydown', e => {
    if (e.key === 'Escape') { e.preventDefault(); fermerPalette(); return; }
    if (!pal || pal.mode === 'raccourcis' || !pal.options) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const n = pal.options.length; pal.sel = (pal.sel + (e.key === 'ArrowDown' ? 1 : -1) + n) % n;
      palette.querySelectorAll('[data-option]').forEach(x => x.setAttribute('aria-selected', +x.dataset.option === pal.sel));
      document.getElementById(`po-${pal.sel}`)?.scrollIntoView({ block: 'nearest' });
      document.getElementById('pal-q').setAttribute('aria-activedescendant', `po-${pal.sel}`);
    }
    if (e.key === 'Enter') { e.preventDefault(); choisirPalette(pal.sel); }
  });

  /* ---------- Petites actions de navigation ---------- */
  function allerOnglet(o) { etat.liste.onglet = o; etat.liste.actif = -1; if (location.hash !== '#/interventions') location.hash = '#/interventions'; else rendre(false); }
  function voirClient(id) { Object.assign(etat.liste, { q: CL[id].nom, onglet: 'toutes', tech: '', type: '', periode: 'tout', actif: -1 }); if (location.hash !== '#/interventions') location.hash = '#/interventions'; else rendre(false); }
  function ouvrirNouvelle() {
    etat.liste.nouvelle = true;
    if (location.hash !== '#/interventions') location.hash = '#/interventions'; else rendre(false);
    setTimeout(() => document.getElementById('n-client')?.focus(), 30);
  }

  /* =========================================================
     Événements
     ========================================================= */
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-action],[data-tri],[data-onglet],[data-periode-stats],[data-jour-planning],[data-choix-statut],[data-voir-client]');
    if (!t) { if (!e.target.closest('.menu')) fermerMenus(); const tr = e.target.closest('tr[data-ref]'); if (tr) location.hash = `#/interventions/${tr.dataset.ref}`; return; }
    if (t.dataset.tri) { const L = etat.liste; L.tri = { col: t.dataset.tri, dir: L.tri.col === t.dataset.tri && L.tri.dir === 'asc' ? 'desc' : 'asc' }; L.actif = -1; rafraichir(); return; }
    if (t.dataset.onglet) { e.preventDefault(); allerOnglet(t.dataset.onglet); return; }
    if (t.dataset.jourPlanning) { etat.jourPlanning = t.dataset.jourPlanning; rafraichir(); return; }
    if (t.dataset.periodeStats) { etat.stats = +t.dataset.periodeStats; rafraichir(); return; }
    if (t.dataset.voirClient) { e.preventDefault(); voirClient(t.dataset.voirClient); return; }
    if (t.dataset.choixStatut) { const it = parRef(etat.ref); fermerMenus(); if (it.statut !== t.dataset.choixStatut && t.dataset.choixStatut === 'cloturee' && !it.tech) { message('Planifiez l’intervention avant de la clôturer.'); return; } if (['en_cours', 'terminee', 'cloturee'].includes(t.dataset.choixStatut) && !it.tech) { message('Affectez d’abord un technicien : planifiez l’intervention.'); return; } changerStatut(it, t.dataset.choixStatut); return; }
    const ref = t.dataset.ref, it = ref && parRef(ref);
    switch (t.dataset.action) {
      case 'palette': ouvrirPalette(); break;
      case 'raccourcis': ouvrirPalette('raccourcis'); break;
      case 'nouvelle': e.preventDefault(); ouvrirNouvelle(); break;
      case 'fermer-nouvelle': etat.liste.nouvelle = false; etat.liste.brouillon = null; rafraichir(); break;
      case 'exporter': exporter(); break;
      case 'plus': etat.liste.limite += 60; rafraichir(); break;
      case 'effacer-filtres': Object.assign(etat.liste, { q: '', tech: '', type: '', periode: 'tout', actif: -1 }); rafraichir(); break;
      case 'ouvrir-proposition': etat.ouvert = etat.ouvert === ref ? null : ref; delete it._choix; if (etat.ouvert) { formPlanif(it, 'jour'); etat.jourPlanning = it._choix.jour; } rafraichir(); if (etat.ouvert) document.querySelector(`[data-form-planif="${ref}"] .btn.principal`)?.focus(); break;
      case 'valider-planif': { const c = it._choix; delete it._choix; etat.ouvert = null; etat.modifPlanif = null; planifier(it, c.tech, c.jour, c.heure, null); break; }
      case 'planifier': etat.modifPlanif = null; rafraichir(); document.querySelector(`[data-form-planif="${ref}"] .btn.principal`)?.focus(); break;
      case 'modifier-planif': etat.modifPlanif = ref; delete it._choix; rafraichir(); break;
      case 'fermer-planif': etat.modifPlanif = null; rafraichir(); break;
      case 'statut': changerStatut(it, t.dataset.cible); break;
      case 'menu-statut': if (document.querySelector('.menu')) fermerMenus(); else ouvrirMenuStatut(t); break;
      case 'menu-statut-mobile': ouvrirMenuStatut(document.getElementById('b-statut')); document.querySelector('.menu')?.scrollIntoView({ block: 'nearest' }); break;
      case 'annuler-intervention': fermerMenus(); etat.confirmerAnnulation = etat.ref; rafraichir(); document.getElementById('motif-annul')?.focus(); break;
      case 'garder': etat.confirmerAnnulation = null; rafraichir(); break;
      case 'confirmer-annulation': { const motif = document.getElementById('motif-annul').value; etat.confirmerAnnulation = null; changerStatut(it, 'annulee', motif); break; }
    }
  });
  document.addEventListener('change', e => {
    const f = e.target.closest('[data-form-planif]');
    if (f) {
      const it = parRef(f.dataset.formPlanif);
      it._choix = { ...it._choix, [e.target.dataset.champ]: e.target.value };
      if (f.dataset.ou === 'jour' && e.target.dataset.champ === 'jour') etat.jourPlanning = e.target.value;
      const id = e.target.id; rafraichir(); document.getElementById(id)?.focus(); return;
    }
    if (e.target.dataset.filtre) { etat.liste[e.target.dataset.filtre] = e.target.value; etat.liste.actif = -1; etat.liste.limite = 60; rafraichir(); }
  });
  document.addEventListener('input', e => {
    if (e.target.id === 'q-liste') { etat.liste.q = e.target.value; etat.liste.actif = -1; etat.liste.limite = 60; const pos = e.target.selectionStart; rafraichir(); const q = document.getElementById('q-liste'); q.focus(); q.setSelectionRange(pos, pos); }
  });
  document.addEventListener('submit', e => {
    e.preventDefault();
    if (e.target.id === 'form-nouvelle') enregistrerNouvelle();
    if (e.target.id === 'form-note') ajouterNote();
  });
  function ajouterNote() {
    const ta = document.getElementById('note'); const txt = ta && ta.value.trim();
    const it = parRef(etat.ref); if (!it) return;
    if (!txt) { ta.focus(); return; }
    modifier(it, () => { it.historique.push({ quand: horloge(), qui: UTILISATRICE.nom, quoi: 'Note', detail: txt, recent: true }); }, 'Note ajoutée à l’historique.');
  }
  document.addEventListener('pointerdown', e => {
    const p = e.target.closest('[data-glisser]');
    if (p) { e.preventDefault(); debutGlisse(e, p.dataset.glisser, false); return; }
    const c = e.target.closest('.creneau.planifiee[data-creneau]');
    if (c) debutGlisse(e, c.dataset.creneau, true);
  });
  document.addEventListener('dragstart', e => { if (e.target.closest && e.target.closest('.creneau')) e.preventDefault(); });

  // Infobulles des graphiques
  const bulle = document.getElementById('infobulle');
  document.addEventListener('pointermove', e => {
    const c = e.target.closest && e.target.closest('[data-info]');
    if (!c) { if (!bulle.hidden) { bulle.hidden = true; document.querySelectorAll('.barre.focus').forEach(b => b.classList.remove('focus')); } return; }
    const [a, b] = c.dataset.info.split('|');
    bulle.innerHTML = `${esc(a)}<br><b>${esc(b)}</b>`;
    bulle.hidden = false;
    const w = bulle.offsetWidth;
    bulle.style.left = Math.min(window.innerWidth - w - 8, e.clientX + 14) + 'px';
    bulle.style.top = (e.clientY - 52) + 'px';
    const barre = c.previousElementSibling && c.previousElementSibling.previousElementSibling;
    document.querySelectorAll('.barre.focus').forEach(x => x.classList.remove('focus'));
    if (barre && barre.classList.contains('barre')) barre.classList.add('focus');
  });

  // Clavier
  let prefixeG = 0;
  document.addEventListener('keydown', e => {
    const mod = e.metaKey || e.ctrlKey;
    if (mod && e.key.toLowerCase() === 'k') { e.preventDefault(); pal ? fermerPalette() : ouvrirPalette(); return; }
    if (pal) return;
    const champ = e.target.closest && e.target.closest('input, textarea, select, [contenteditable]');
    if (mod && e.key === 'Enter') {
      if (e.target.closest('#form-nouvelle')) { e.preventDefault(); enregistrerNouvelle(); return; }
      if (e.target.id === 'note') { e.preventDefault(); ajouterNote(); return; }
    }
    if (mod && e.key.toLowerCase() === 'z' && !champ) { if (annulerDernier()) e.preventDefault(); return; }
    if (e.key === 'Escape') {
      if (document.querySelector('.menu')) { fermerMenus(); return; }
      if (champ) { if (e.target.id === 'q-liste' && e.target.value) { etat.liste.q = ''; rafraichir(); document.getElementById('q-liste').focus(); } else e.target.blur(); return; }
      if (etat.confirmerAnnulation) { etat.confirmerAnnulation = null; rafraichir(); return; }
      if (etat.liste.nouvelle && etat.route === 'interventions' && !etat.ref) { etat.liste.nouvelle = false; rafraichir(); return; }
      if (etat.ouvert) { etat.ouvert = null; rafraichir(); return; }
      if (etat.ref) { location.hash = '#/interventions'; return; }
      return;
    }
    if (champ || mod || e.altKey) return;
    const k = e.key;
    if (prefixeG && Date.now() - prefixeG < 1200) {
      prefixeG = 0;
      const dest = { a: 'aujourdhui', i: 'interventions', s: 'statistiques' }[k.toLowerCase()];
      if (dest) { e.preventDefault(); location.hash = `#/${dest}`; }
      return;
    }
    if (k === 'g' || k === 'G') { prefixeG = Date.now(); return; }
    if (k === '?') { e.preventDefault(); ouvrirPalette('raccourcis'); return; }
    if (k === 'n' || k === 'N') { e.preventDefault(); ouvrirNouvelle(); return; }
    if (etat.route === 'interventions' && !etat.ref) {
      const L = etat.liste;
      if (k === '/') { e.preventDefault(); document.getElementById('q-liste')?.focus(); return; }
      if (k === '[' || k === ']') {
        const i = ONGLETS.findIndex(o => o[0] === L.onglet);
        allerOnglet(ONGLETS[(i + (k === ']' ? 1 : -1) + ONGLETS.length) % ONGLETS.length][0]); return;
      }
      const lignes = vue.querySelectorAll('tbody tr');
      if (['j', 'J', 'ArrowDown', 'k', 'K', 'ArrowUp'].includes(k) && lignes.length) {
        e.preventDefault();
        const bas = ['j', 'J', 'ArrowDown'].includes(k);
        L.actif = Math.max(0, Math.min(lignes.length - 1, L.actif + (bas ? 1 : -1)));
        lignes.forEach((tr, i) => tr.classList.toggle('actif', i === L.actif));
        lignes[L.actif].scrollIntoView({ block: 'nearest' });
        return;
      }
      if (k === 'Enter' && L.actif >= 0 && lignes[L.actif]) { location.hash = `#/interventions/${lignes[L.actif].dataset.ref}`; return; }
    }
    if (etat.ref) {
      if (k === 's' || k === 'S') { e.preventDefault(); const b = document.getElementById('b-statut'); if (b && b.offsetParent) ouvrirMenuStatut(b); else ouvrirMenuStatut(document.querySelector('[data-action="menu-statut-mobile"]')); return; }
      if (k === 'c' || k === 'C') { e.preventDefault(); const n = document.getElementById('note'); n?.focus(); n?.scrollIntoView({ block: 'center', behavior: 'smooth' }); return; }
      if (k === 'j' || k === 'J' || k === 'k' || k === 'K') {
        const { r } = listeFiltree(); const i = r.findIndex(x => x.ref === etat.ref);
        const cible = r[i + (k.toLowerCase() === 'j' ? 1 : -1)];
        if (i >= 0 && cible) location.hash = `#/interventions/${cible.ref}`;
      }
    }
  });

  function apresRendu() {
    // L'onglet « Rapport à valider » de l'écran du jour pointe vers la liste filtrée.
    document.querySelectorAll('a[data-onglet]').forEach(a => a.setAttribute('href', '#/interventions'));
    if (dernierChange) setTimeout(() => { dernierChange = null; }, 0);
    for (const it of interventions) for (const h of it.historique) if (h.recent && h._vu) h.recent = false; else if (h.recent) h._vu = true;
  }

  // L'heure avance : le repère « maintenant » et les durées relatives se mettent à jour.
  setInterval(() => {
    if (glisse || pal || document.activeElement?.closest?.('input, textarea, select')) return;
    if (etat.route === 'aujourdhui') rafraichir();
  }, 60000);

  window.addEventListener('hashchange', naviguer);
  naviguer();
})();
