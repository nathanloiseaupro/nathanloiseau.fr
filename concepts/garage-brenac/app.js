(() => {
  "use strict";

  /* ---------- Données ---------- */
  const NB = " ";
  const NOW = new Date(2026, 10, 9, 10, 5); // lundi 9 novembre 2026, 10 h 05

  const PRESTATIONS = [
    { id: "pneus", name: "Montage des pneus hiver", dur: 45, price: 49, from: false, note: "Pose et équilibrage, pneus déjà en votre possession" },
    { id: "vidange", name: "Vidange et filtre à huile", dur: 45, price: 79, from: false, note: "Huile adaptée à votre moteur" },
    { id: "revision", name: "Révision constructeur", dur: 120, price: 189, from: true, note: "Selon le carnet d'entretien" },
    { id: "freins", name: "Freinage", dur: 90, price: 0, from: false, note: "Contrôle, puis devis avant toute pièce changée" },
    { id: "voyant", name: "Voyant allumé au tableau de bord", dur: 60, price: 59, from: false, note: "Lecture des codes défaut et diagnostic" },
    { id: "clim", name: "Recharge de la climatisation", dur: 60, price: 89, from: false, note: "Contrôle d'étanchéité compris" }
  ];

  const JOURS = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."];
  const JOURS_LONG = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
  const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

  const euros = (n) => n.toFixed(2).replace(".", ",") + NB + "€";
  const heure = (min) => { const h = Math.floor(min / 60), m = min % 60; return h + NB + "h" + (m ? NB + String(m).padStart(2, "0") : ""); };
  const duree = (min) => min < 60 ? min + NB + "min" : heure(min).replace(NB + "h" + NB, NB + "h" + NB);
  const dateLongue = (d) => `${JOURS_LONG[d.getDay()]} ${d.getDate() === 1 ? "1er" : d.getDate()} ${MOIS[d.getMonth()]}`;
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const pricing = (p) => p.price ? (p.from ? "dès " : "") + p.price + NB + "€" : "Sur devis";

  /* Planning de l'atelier : demi-heures occupées, générées une fois pour rester stables */
  const OPEN = { am: [8 * 60, 12 * 60], pm: [14 * 60, 18 * 60] };
  function seeded(seed) { let s = seed; return () => (s = (s * 9301 + 49297) % 233280) / 233280; }
  const DAYS = [];
  (function buildDays() {
    const d = new Date(NOW); d.setHours(0, 0, 0, 0);
    while (DAYS.length < 15) {
      d.setDate(d.getDate() + 1);
      const wd = d.getDay();
      if (wd === 0) continue;
      const day = { date: new Date(d), closed: null, busy: new Set() };
      if (d.getMonth() === 10 && d.getDate() === 11) day.closed = "Fermé, 11 Novembre";
      const rnd = seeded(d.getDate() * 31 + 7);
      const load = d.getDate() === 10 ? 0.86 : d.getDate() === 13 ? 1 : 0.3;
      for (let t = OPEN.am[0]; t < OPEN.pm[1]; t += 30) if (rnd() < load) day.busy.add(t);
      DAYS.push(day);
    }
  })();
  function slotsFor(day, dur) {
    if (day.closed) return [];
    const wd = day.date.getDay();
    const periods = wd === 6 ? [OPEN.am] : [OPEN.am, OPEN.pm];
    const out = [];
    for (const [start, end] of periods) {
      for (let t = start; t + dur <= end; t += 30) {
        let free = true;
        for (let k = t; k < t + dur; k += 30) if (day.busy.has(k)) { free = false; break; }
        out.push({ t, free, period: start < 12 * 60 ? "am" : "pm" });
      }
    }
    return out;
  }

  /* ---------- État ---------- */
  const state = {
    prestation: null,
    dayIndex: null,
    slot: null,
    mode: "depot",
    note: "",
    booking: null,
    calendar: false,
    devis: "attente",       // attente | accepte | refuse
    repair: "attente",      // attente | transmis | encours
    messages: [
      { who: "Thomas", role: "mécanicien", at: 9 * 60 + 40, text: "Diagnostic terminé. Les plaquettes de frein avant sont à changer : le détail et le prix sont dans le suivi." },
      { who: "Sandrine", role: "accueil", at: 8 * 60 + 12, text: "Votre 308 est bien arrivée, j'ai vos clés. Je vous préviens dès qu'elle est prête." }
    ],
    prefs: { sms: true, rappel: true, factures: true }
  };
  let undoTimer = null, stepTimer = null;

  const ETA = () => state.devis === "accepte" ? 18 * 60 + 10 : 17 * 60 + 30;
  function progress() {
    // index de l'étape courante (0 à 4) et nature
    if (state.devis === "attente") return { i: 2, kind: "wait" };
    if (state.repair === "encours") return { i: 3, kind: "work" };
    return { i: 3, kind: "todo" };
  }

  /* ---------- Icônes ---------- */
  const I = {
    chev: '<svg class="chev" viewBox="0 0 9 15" aria-hidden="true"><path d="M1.5 1.5 7.5 7.5l-6 6"/></svg>',
    back: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5 8 12l7 7"/></svg>',
    check: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.5 6.5 11.5 12.5 4.5"/></svg>',
    phone: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.6 3.5h2.6l1.4 4-2 1.4a11 11 0 0 0 5.5 5.5l1.4-2 4 1.4v2.6a2 2 0 0 1-2.1 2A15.5 15.5 0 0 1 4.6 5.6a2 2 0 0 1 2-2.1Z"/></svg>',
    pin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s6.5-5.6 6.5-11.2A6.5 6.5 0 0 0 5.5 9.8C5.5 15.4 12 21 12 21Z"/><circle cx="12" cy="9.8" r="2.3"/></svg>',
    clock: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>',
    doc: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3.5h7l4 4V19a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 19V5a1.5 1.5 0 0 1 1-1.5Z"/><path d="M14 3.5V8h4M9 12.5h6M9 16h4"/></svg>',
    cal: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5.5" width="16" height="14.5" rx="2.5"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4"/></svg>',
    mark: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect width="24" height="24" rx="6.5" fill="var(--brand)"/><path d="M8 6.5h5.2a3 3 0 0 1 .9 5.85A3.2 3.2 0 0 1 13.6 18.5H8Z" fill="none" stroke="var(--on-brand)" stroke-width="2.1" stroke-linejoin="round"/><path d="M8 12.3h5.6" stroke="var(--on-brand)" stroke-width="2.1"/></svg>'
  };

  /* ---------- Rendu ---------- */
  const app = document.getElementById("app");
  const views = {};

  views.accueil = () => {
    const p = progress();
    const segs = [0, 1, 2, 3, 4].map((k) => k < p.i ? '<i class="done"></i>' : k === p.i ? `<i class="now ${p.kind}"></i>` : "<i></i>").join("");
    const stateLine = state.devis === "attente"
      ? `<span class="dot"></span>Une réparation attend votre accord`
      : state.repair === "encours"
        ? `<span class="dot" style="background:var(--on-brand)"></span>Réparation en cours, prête vers ${heure(ETA())}`
        : `<span class="dot" style="background:var(--on-brand-2)"></span>Accord transmis à l'atelier`;
    const b = state.booking;
    const next = b
      ? `<a href="#rendez-vous" class="next ${b.fresh ? "new" : ""}">
          <div class="datetile"><b>${JOURS[b.date.getDay()].replace(".", "")}</b><span>${b.date.getDate()}</span></div>
          <div class="grow"><div class="t">${b.p.name}</div><div class="s">${cap(dateLongue(b.date))} à ${heure(b.t)}</div><div class="s">${b.mode === "depot" ? "Vous laissez la voiture" : "Vous attendez sur place"}</div></div>
          ${I.chev}
        </a>`
      : `<div class="empty">
          <p><strong>Aucun autre rendez-vous prévu.</strong> Une vidange, des pneus à monter, un voyant allumé : vous choisissez l'horaire qui vous convient.</p>
          <a class="btn btn-primary" href="#rendez-vous">Prendre rendez-vous</a>
        </div>`;
    if (b) b.fresh = false;
    const msgs = state.messages.slice(0, 2).map((m) => `
      <li><div class="row msg">
        <span class="who-ava">${m.who[0]}</span>
        <span class="grow"><span class="t">${m.who} <em>${m.role}</em><time>${heure(m.at)}</time></span><span class="s">${m.text}</span></span>
      </div></li>`).join("");
    return `
      <div class="home-head">
        <span class="wordmark">${I.mark}Garage Brenac</span>
        <a class="avatar" href="#vehicule" aria-label="Mon compte">JM</a>
      </div>
      <div class="pad"><h1 class="title">Bonjour Julien</h1><p class="lede">${cap(dateLongue(NOW))}</p></div>
      <a class="status" href="#suivi">
        <div class="kicker">À l'atelier depuis 8${NB}h${NB}12</div>
        <h2>Votre 308 est en révision</h2>
        <div class="segs" aria-hidden="true">${segs}</div>
        <div class="state">${stateLine}</div>
        <div class="go">${state.devis === "attente" ? "Voir le détail et répondre" : "Voir le suivi"}<svg viewBox="0 0 9 15" aria-hidden="true"><path d="M1.5 1.5 7.5 7.5l-6 6"/></svg></div>
      </a>
      <div class="pad">
        <section class="section"><h2 class="h2">Prochain rendez-vous</h2>${next}</section>
        <section class="section"><h2 class="h2">Messages de l'atelier</h2><ul class="list feed">${msgs}</ul></section>
        <section class="section"><h2 class="h2">Le garage</h2>
          <ul class="list">
            <li><a class="row" href="tel:0261910482"><span class="ico">${I.phone}</span><span class="grow"><span class="t">Appeler l'accueil</span><span class="s">02${NB}61${NB}91${NB}04${NB}82</span></span>${I.chev}</a></li>
            <li><a class="row" href="#accueil" data-noop><span class="ico">${I.pin}</span><span class="grow"><span class="t">14 rue des Tanneurs, Angers</span><span class="s">Ouvert aujourd'hui jusqu'à 18${NB}h${NB}30</span></span>${I.chev}</a></li>
          </ul>
        </section>
      </div>`;
  };

  views["rendez-vous"] = () => {
    const b = state.booking;
    const items = PRESTATIONS.map((p) => `
      <li><button class="row" data-prest="${p.id}">
        <span class="grow"><span class="t">${p.name}</span><span class="s">${duree(p.dur)} · ${p.note}</span></span>
        <span class="price">${pricing(p)}</span>${I.chev}
      </button></li>`).join("");
    return `
      <div class="pad">
        <h1 class="title">Rendez-vous</h1>
        <p class="lede">Pour votre Peugeot 308 SW</p>
        ${b ? `<section class="section"><h2 class="h2">Déjà prévu</h2>
          <div class="next"><div class="datetile"><b>${JOURS[b.date.getDay()].replace(".", "")}</b><span>${b.date.getDate()}</span></div>
          <div class="grow"><div class="t">${b.p.name}</div><div class="s">${cap(dateLongue(b.date))} à ${heure(b.t)}</div></div></div></section>` : ""}
        <section class="section"><h2 class="h2">${b ? "Autre intervention" : "De quoi votre voiture a-t-elle besoin ?"}</h2>
          <ul class="list">${items}</ul>
          <p class="fine" style="text-align:left">Vous ne savez pas quoi choisir ? Appelez l'accueil au 02${NB}61${NB}91${NB}04${NB}82, nous vous orientons.</p>
        </section>
      </div>`;
  };

  views.creneau = () => {
    const p = state.prestation;
    if (state.dayIndex == null) state.dayIndex = DAYS.findIndex((d) => slotsFor(d, p.dur).some((s) => s.free));
    const day = DAYS[state.dayIndex];
    const days = DAYS.map((d, i) => {
      const n = slotsFor(d, p.dur).filter((s) => s.free).length;
      const label = d.closed ? "fermé" : n === 0 ? "complet" : `${n} horaire${n > 1 ? "s" : ""} libre${n > 1 ? "s" : ""}`;
      return `<button class="day ${n === 0 ? "full" : ""}" data-day="${i}" aria-pressed="${i === state.dayIndex}" aria-label="${cap(dateLongue(d.date))}, ${label}">
        <small>${JOURS[d.date.getDay()]}</small><b>${d.date.getDate()}</b><em class="avail">${d.closed ? "fermé" : n === 0 ? "complet" : n}</em></button>`;
    }).join("");
    return `
      <div class="navbar"><button class="back" data-back>${I.back}Prestations</button><span class="stepno">Étape 1 sur 2</span></div>
      <div class="pad">
        <h1 class="title">Choisir un horaire</h1>
        <div class="chosen"><div><div class="t">${p.name}</div><div class="s">${duree(p.dur)} à l'atelier · ${pricing(p)}</div></div><button class="btn btn-quiet" data-back>Changer</button></div>
      </div>
      <div class="month"><h2 class="h2">Novembre 2026</h2><span class="small muted">Horaires libres par jour</span></div>
      <div class="days" id="days">${days}</div>
      <div id="slots">${slotsHTML(day, p)}</div>
      <div class="bottom-bar">
        <div class="recap" id="recap">${recapText()}</div>
        <button class="btn btn-primary" id="next" ${state.slot == null ? "disabled" : ""}>${state.slot == null ? "Choisissez un horaire" : "Continuer"}</button>
      </div>`;
  };

  function slotsHTML(day, p) {
    const usable = !day.closed && slotsFor(day, p.dur).some((s) => s.free);
    const head = `<div class="slots-head"><b>${cap(dateLongue(day.date))}</b><span class="muted small">${usable ? (state.slot != null ? "Fin estimée à " + heure(state.slot + p.dur) : "Durée " + duree(p.dur)) : ""}</span></div>`;
    if (day.closed) return head + `<div class="day-empty"><p><strong>Le garage est fermé ce jour-là</strong>, c'est le 11${NB}Novembre.</p><button class="btn btn-secondary" data-nextfree>Voir le prochain jour libre</button></div>`;
    const all = slotsFor(day, p.dur);
    if (!all.some((s) => s.free)) return head + `<div class="day-empty"><p><strong>Plus aucun horaire libre</strong> pour une intervention de ${duree(p.dur)} ce jour-là.</p><button class="btn btn-secondary" data-nextfree>Voir le prochain jour libre</button></div>`;
    const group = (per, label) => {
      const s = all.filter((x) => x.period === per);
      if (!s.length) return "";
      return `<div class="per">${label}</div><div class="slots">${s.map((x) => `<button class="slot" data-slot="${x.t}" ${x.free ? "" : "disabled"} aria-pressed="${state.slot === x.t}" aria-label="${heure(x.t)}${x.free ? "" : ", pris"}">${heure(x.t)}</button>`).join("")}</div>`;
    };
    return head + group("am", "Matin") + group("pm", "Après-midi") + `<p class="legend">Les horaires barrés sont déjà pris. Ils tiennent compte de la durée de l'intervention.</p>`;
  }
  function recapText() {
    if (state.slot == null) return `<span>${duree(state.prestation.dur)} d'intervention</span><span></span>`;
    const d = DAYS[state.dayIndex].date;
    return `<span><strong>${cap(JOURS[d.getDay()])} ${d.getDate()} nov. à ${heure(state.slot)}</strong></span><span>${pricing(state.prestation)}</span>`;
  }

  views.confirmation = () => {
    const p = state.prestation, d = DAYS[state.dayIndex].date;
    const choice = (v, t, s) => `<li><button class="row choice" role="radio" data-mode="${v}" aria-checked="${state.mode === v}"><span class="radio"></span><span class="grow"><span class="t">${t}</span><span class="s">${s}</span></span></button></li>`;
    return `
      <div class="navbar"><button class="back" data-back>${I.back}Horaires</button><span class="stepno">Étape 2 sur 2</span></div>
      <div class="pad">
        <h1 class="title">Vérifier et confirmer</h1>
        <div class="recap-block">
          <div class="recap-top"><div class="when">${cap(dateLongue(d))} à ${heure(state.slot)}</div><div class="what">${p.name}, jusqu'à ${heure(state.slot + p.dur)} environ</div></div>
          <dl class="kv">
            <div><dt>Véhicule</dt><dd>Peugeot 308 SW · GK-418-RT</dd></div>
            <div><dt>Garage</dt><dd>14 rue des Tanneurs, Angers</dd></div>
            <div><dt>Prix</dt><dd>${p.price ? (p.from ? "À partir de " : "") + euros(p.price) + " TTC" : "Devis avant travaux"}</dd></div>
          </dl>
        </div>
        <section class="section"><h2 class="h2">Pendant l'intervention</h2>
          <ul class="list" role="radiogroup" aria-label="Pendant l'intervention">
            ${choice("depot", "Je laisse la voiture", "Je la récupère quand vous me prévenez")}
            ${choice("attente", "J'attends sur place", `Salle d'attente avec wifi, environ ${duree(p.dur)}`)}
          </ul>
        </section>
        <section class="section"><h2 class="h2">Une précision pour l'atelier ?</h2>
          <label class="sr" for="note">Précision pour l'atelier, facultatif</label>
          <textarea id="note" placeholder="Facultatif. Par exemple : les pneus sont dans le coffre.">${state.note}</textarea>
        </section>
      </div>
      <div class="bottom-bar">
        <button class="btn btn-primary" id="confirm">Confirmer le rendez-vous</button>
        <p class="fine">Modifiable ou annulable sans frais jusqu'à la veille, 18${NB}h.</p>
      </div>`;
  };

  views.confirme = () => {
    const b = state.booking;
    return `
      <div class="done-view">
        <div class="done-main">
          <div class="check"><svg viewBox="0 0 40 40" aria-hidden="true"><path d="M11 21 17.5 27.5 29.5 13.5"/></svg></div>
          <h1>C'est noté, Julien</h1>
          <div class="when">${cap(dateLongue(b.date))} à ${heure(b.t)}</div>
          <p>${b.p.name}. Nous vous enverrons un rappel par SMS la veille au soir.</p>
          <ul class="list mini">
            <li><div class="row"><span class="ico">${I.pin}</span><span class="grow"><span class="t">14 rue des Tanneurs, Angers</span><span class="s">Parking client devant l'atelier</span></span></div></li>
            <li><div class="row"><span class="ico">${I.clock}</span><span class="grow"><span class="t">${b.mode === "depot" ? "Vous laissez la voiture" : "Vous attendez sur place"}</span><span class="s">Fin prévue vers ${heure(b.t + b.p.dur)}</span></span></div></li>
          </ul>
        </div>
        <div class="done-actions">
          <button class="btn btn-secondary" id="cal" aria-pressed="${state.calendar}">${state.calendar ? `<span class="okmark">${I.check}</span>Ajouté à votre calendrier` : "Ajouter à mon calendrier"}</button>
          <a class="btn btn-primary" href="#accueil">Revenir à l'accueil</a>
        </div>
      </div>`;
  };

  views.suivi = () => {
    const accepted = state.devis === "accepte", refused = state.devis === "refuse";
    const steps = [];
    steps.push({ c: "done", t: "Voiture déposée", time: "8" + NB + "h" + NB + "12", d: "Sandrine a reçu vos clés à l'accueil." });
    steps.push({ c: "done", t: "Contrôle terminé", time: "9" + NB + "h" + NB + "40", d: "32 points vérifiés par Thomas." });
    if (state.devis === "attente") {
      steps.push({ c: "wait", t: "Votre accord", time: "en attente", d: "", ask: true });
    } else {
      steps.push({ c: "done", t: accepted ? "Réparation acceptée" : "Réparation refusée", time: state.answeredAt, d: accepted ? "Remplacement des plaquettes avant, 142,00" + NB + "€." : "Nous la notons sur la facture pour une prochaine fois." });
    }
    const repairLine = accepted ? "Révision et plaquettes avant" : "Révision des 60" + NB + "000" + NB + "km";
    if (state.devis === "attente") steps.push({ c: "todo", t: "Réparation", d: "Commence dès votre réponse." });
    else if (state.repair === "encours") steps.push({ c: "work", t: "Réparation en cours", time: "depuis 10" + NB + "h" + NB + "06", d: repairLine + ", par Thomas." });
    else steps.push({ c: "todo pending-work", t: "Transmis à l'atelier", time: "à l'instant", d: "Thomas va reprendre votre voiture." });
    steps.push({ c: "todo", t: "Prête à récupérer", d: "Vous recevez une notification et un SMS." });

    const stepHTML = steps.map((s) => `
      <li class="step ${s.c}">
        <span class="marker">${s.c === "done" ? I.check : ""}</span>
        <div>
          <div class="st"><span>${s.t}</span>${s.time ? `<time>${s.time}</time>` : ""}</div>
          ${s.d ? `<div class="sd">${s.d}</div>` : ""}
          ${s.ask ? askHTML() : ""}
        </div>
      </li>`).join("");

    const billRows = [
      `<li><div class="row"><span class="grow t">Révision des 60${NB}000${NB}km</span><span class="end">${euros(214)}</span></div></li>`,
      `<li class="${accepted ? "" : "pending"}"><div class="row"><span class="grow t">Plaquettes de frein avant${accepted ? "" : refused ? ", refusé" : ", si accord"}</span><span class="end">${euros(142)}</span></div></li>`,
      `<li class="total"><div class="row"><span class="grow t">Total prévu</span><span class="end">${euros(accepted ? 356 : 214)}</span></div></li>`
    ].join("");

    return `
      <div class="pad">
        <h1 class="title">Suivi</h1>
        <p class="lede">Révision des 60${NB}000${NB}km · Peugeot 308 SW</p>
        <div class="eta">
          <div><div class="lbl">Prête vers</div><div class="val" id="eta">${heure(ETA())}</div></div>
          <div class="who"><b>Thomas</b>votre mécanicien</div>
        </div>
        ${inspectionHTML()}
        <ol class="timeline">${stepHTML}</ol>
        <section class="section" style="margin-top:12px"><h2 class="h2">Montant</h2><ul class="list bill">${billRows}</ul>
          <p class="fine" style="text-align:left">Réglé sur place au retrait de la voiture. Aucun travail n'est ajouté sans votre accord.</p></section>
      </div>`;
  };

  function askHTML() {
    return `
      <div class="ask">
        <h3>Changer les plaquettes de frein avant ?</h3>
        <p>Il reste 2${NB}mm de garniture sur 12 à l'origine. En dessous de 3${NB}mm, le freinage s'allonge et les disques s'abîment.</p>
        <div class="cost"><b>${euros(142)}</b><span>Pièces et main-d'œuvre, 40${NB}min de travail en plus</span></div>
        <div class="btns">
          <button class="btn btn-secondary" id="refuse">Pas cette fois</button>
          <button class="btn btn-primary" id="accept">Accepter</button>
        </div>
      </div>`;
  }

  function inspectionHTML() {
    const front = state.devis === "accepte" ? "fixed" : state.devis === "refuse" ? "warn" : "bad";
    return `
      <section class="inspect" aria-label="Contrôle des 32 points">
        <svg class="carplan ${front}" viewBox="0 0 120 214" aria-hidden="true">
          <rect class="wheel front" x="11" y="38" width="13" height="32" rx="4.5"/>
          <rect class="wheel front" x="96" y="38" width="13" height="32" rx="4.5"/>
          <rect class="wheel rear" x="11" y="146" width="13" height="32" rx="4.5"/>
          <rect class="wheel rear" x="96" y="146" width="13" height="32" rx="4.5"/>
          <path class="body" d="M60 6c22 0 35 7 37 22l3 30v106l-2 22c-2 15-17 22-38 22s-36-7-38-22l-2-22V58l3-30C25 13 38 6 60 6Z"/>
          <path class="glass" d="M33 72c6-8 48-8 54 0l-5 26c-8-4-36-4-44 0Z"/>
          <path class="glass" d="M37 168c5 5 41 5 46 0l3 16c-8 7-44 7-52 0Z"/>
          <path class="line" d="M38 98v68M82 98v68"/>
          <circle class="ping front" cx="17.5" cy="54" r="12"/><circle class="ping front" cx="102.5" cy="54" r="12"/>
        </svg>
        <div class="inspect-body">
          <h2 class="h3">Contrôle des 32 points</h2>
          <ul class="legendlist">
            <li><i class="lg ok"></i><span><b>30 conformes</b>Niveaux, éclairage, batterie…</span></li>
            <li><i class="lg mid"></i><span><b>Pneus arrière</b>4${NB}mm, à revoir cet été</span></li>
            <li><i class="lg ${front === "fixed" ? "ok" : "bad"}"></i><span><b>Plaquettes avant</b>${front === "fixed" ? "Remplacement accepté" : front === "warn" ? "Usées, non remplacées" : "Usées, à remplacer"}</span></li>
          </ul>
        </div>
      </section>`;
  }

  views.vehicule = () => {
    const hist = [
      { y: 2026, d: "12 mai", t: "Vidange et filtre à huile", k: "52 310 km", a: 79 },
      { y: 2025, d: "3 nov.", t: "Montage des pneus hiver", k: "47 880 km", a: 49 },
      { y: 2025, d: "18 avr.", t: "Révision des 45 000 km", k: "44 960 km", a: 236.4 },
      { y: 2025, d: "21 févr.", t: "Remplacement de la batterie", k: "43 120 km", a: 164.9 }
    ];
    let html = "", year = null;
    hist.forEach((h, i) => {
      if (h.y !== year) { if (year !== null) html += "</ul>"; year = h.y; html += `<div class="year">${h.y}</div><ul class="list">`; }
      html += `<li><div class="row"><span class="grow"><span class="t">${h.t}</span><span class="s">${h.d} · ${h.k.replace(" ", NB).replace(" km", NB + "km")}</span></span><span class="end">${euros(h.a)}</span><button class="doc" aria-label="Facture du ${h.d} ${h.y}" data-doc="${i}">${I.doc}</button></div></li>`;
    });
    html += "</ul>";
    const sw = (k, t, s) => `<li><div class="row"><span class="grow"><span class="t">${t}</span>${s ? `<span class="s">${s}</span>` : ""}</span><button class="switch" role="switch" data-pref="${k}" aria-checked="${state.prefs[k]}" aria-label="${t}"></button></div></li>`;
    return `
      <div class="pad">
        <h1 class="title">Mon véhicule</h1>
        <div class="car">
          <div class="model">Peugeot 308 SW</div>
          <div class="ver">1.2 PureTech 130 · Allure · 2019</div>
          <div class="plate" aria-label="Immatriculation GK-418-RT"><i>F</i><span>GK-418-RT</span><i>49</i></div>
          <div class="facts">
            <div><small>Kilométrage</small><b>58${NB}940${NB}km</b></div>
            <div><small>Contrôle technique avant</small><b>14 mars 2027</b></div>
          </div>
        </div>
        <section class="section"><h2 class="h2">Historique</h2>
          <div class="year">Aujourd'hui</div>
          <ul class="list"><li><a class="row" href="#suivi"><span class="grow"><span class="t">Révision des 60${NB}000${NB}km</span><span class="s">En cours à l'atelier</span></span><span class="tag">En cours</span>${I.chev}</a></li></ul>
          ${html}
        </section>
        <section class="section"><h2 class="h2">Notifications</h2>
          <ul class="list">
            ${sw("sms", "Voiture prête", "Notification et SMS")}
            ${sw("rappel", "Rappel la veille", "D'un rendez-vous au garage, par SMS")}
            ${sw("factures", "Nouvelle facture", "Disponible ici dès le retrait")}
          </ul>
        </section>
        <section class="section"><h2 class="h2">Mon compte</h2>
          <ul class="list">
            <li><div class="row"><span class="grow"><span class="t">Julien Marchand</span><span class="s">06${NB}39${NB}98${NB}12${NB}47</span></span></div></li>
          </ul>
        </section>
      </div>`;
  };

  /* ---------- Routeur ---------- */
  const TAB_OF = { accueil: "accueil", "rendez-vous": "rendez-vous", creneau: "rendez-vous", confirmation: "rendez-vous", confirme: "rendez-vous", suivi: "suivi", vehicule: "vehicule" };
  const DEPTH = { creneau: 1, confirmation: 2, confirme: 3 };
  let current = null;

  function route() {
    let name = location.hash.slice(1) || "accueil";
    if (!views[name]) name = "accueil";
    if ((name === "creneau" || name === "confirmation") && !state.prestation) name = "rendez-vous";
    if (name === "confirmation" && state.slot == null) name = "creneau";
    if (name === "confirme" && !state.booking) name = "rendez-vous";
    const push = (DEPTH[name] || 0) > (DEPTH[current] || 0);
    current = name;
    render(push);
  }
  function render(push) {
    app.innerHTML = `<div class="view ${push ? "push" : ""}">${views[current]()}</div>`;
    typo(app);
    document.body.classList.toggle("no-tabbar", ["creneau", "confirmation", "confirme"].includes(current));
    document.querySelectorAll(".tabbar a").forEach((a) => { if (a.dataset.tab === TAB_OF[current]) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
    document.getElementById("tab-badge").hidden = state.devis !== "attente";
    if (current === "creneau") requestAnimationFrame(() => { const sel = document.querySelector('.day[aria-pressed="true"]'); if (sel) sel.scrollIntoView({ inline: "nearest", block: "nearest" }); });
    window.scrollTo(0, 0);
  }
  window.addEventListener("hashchange", route);

  function typo(root) {
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let n; (n = w.nextNode());) if (n.nodeValue.includes("'")) n.nodeValue = n.nodeValue.replace(/'/g, "\u2019");
    root.querySelectorAll("[placeholder]").forEach((e) => { e.placeholder = e.placeholder.replace(/'/g, "\u2019"); });
  }
  const go = (h) => { location.hash = h; };
  function haptic(el) { el.classList.remove("tick"); void el.offsetWidth; el.classList.add("tick"); if (navigator.vibrate) navigator.vibrate(8); }

  /* ---------- Interactions ---------- */
  app.addEventListener("click", (e) => {
    const t = e.target.closest("button, a");
    if (!t) return;
    if (t.hasAttribute("data-noop")) { e.preventDefault(); return; }
    if (t.hasAttribute("data-back")) { history.back(); return; }

    if (t.dataset.prest) {
      state.prestation = PRESTATIONS.find((p) => p.id === t.dataset.prest);
      state.dayIndex = null; state.slot = null;
      haptic(t); go("creneau"); return;
    }
    if (t.dataset.day != null) {
      const i = +t.dataset.day;
      if (i === state.dayIndex) return;
      state.dayIndex = i; state.slot = null; haptic(t);
      document.querySelectorAll(".day").forEach((d) => d.setAttribute("aria-pressed", d === t));
      t.scrollIntoView({ inline: "nearest", block: "nearest", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
      loadSlots(); updateBar(); return;
    }
    if (t.hasAttribute("data-nextfree")) {
      const p = state.prestation;
      const i = DAYS.findIndex((d, k) => k > state.dayIndex && slotsFor(d, p.dur).some((s) => s.free));
      if (i >= 0) document.querySelector(`.day[data-day="${i}"]`).click();
      return;
    }
    if (t.dataset.slot) {
      state.slot = +t.dataset.slot; haptic(t);
      document.querySelectorAll(".slot").forEach((s) => s.setAttribute("aria-pressed", s === t));
      const fin = document.querySelector(".slots-head .muted"); if (fin) fin.textContent = "Fin estimée à " + heure(state.slot + state.prestation.dur);
      updateBar(); return;
    }
    if (t.id === "next") { go("confirmation"); return; }
    if (t.dataset.mode) {
      state.mode = t.dataset.mode; haptic(t);
      document.querySelectorAll(".choice").forEach((c) => c.setAttribute("aria-checked", c === t)); return;
    }
    if (t.id === "confirm") {
      state.note = document.getElementById("note").value;
      t.disabled = true; t.classList.add("is-loading"); t.innerHTML = '<span class="spin" aria-hidden="true"></span>Réservation en cours…';
      setTimeout(() => {
        state.booking = { p: state.prestation, date: DAYS[state.dayIndex].date, t: state.slot, mode: state.mode, fresh: true };
        DAYS[state.dayIndex].busy.add(state.slot);
        state.calendar = false;
        history.replaceState(null, "", "#rendez-vous");
        go("confirme");
      }, 750);
      return;
    }
    if (t.id === "cal") {
      if (state.calendar) return;
      state.calendar = true; haptic(t);
      t.innerHTML = `<span class="okmark">${I.check}</span>Ajouté à votre calendrier`; t.setAttribute("aria-pressed", "true"); return;
    }
    if (t.id === "accept" || t.id === "refuse") { answer(t.id === "accept"); return; }
    if (t.dataset.pref) {
      const k = t.dataset.pref; state.prefs[k] = !state.prefs[k]; haptic(t); t.setAttribute("aria-checked", state.prefs[k]); return;
    }
    if (t.dataset.doc != null) { toast("Facture enregistrée dans Fichiers."); return; }
  });

  app.addEventListener("input", (e) => { if (e.target.id === "note") state.note = e.target.value; });

  function updateBar() {
    const r = document.getElementById("recap"), n = document.getElementById("next");
    if (!r) return;
    r.innerHTML = recapText(); typo(r);
    n.disabled = state.slot == null;
    n.textContent = state.slot == null ? "Choisissez un horaire" : "Continuer";
  }
  function loadSlots() {
    const box = document.getElementById("slots");
    const d = DAYS[state.dayIndex];
    box.innerHTML = `<div class="slots-head"><b>${cap(dateLongue(d.date))}</b><span class="muted small">Recherche des horaires…</span></div><div class="slots skel">${"<span></span>".repeat(8)}</div>`;
    clearTimeout(loadSlots.t);
    loadSlots.t = setTimeout(() => { box.innerHTML = slotsHTML(d, state.prestation); typo(box); }, 280);
  }

  /* Réponse au devis, avec annulation possible pendant 5 secondes */
  function answer(ok) {
    const prev = { devis: state.devis, repair: state.repair };
    state.devis = ok ? "accepte" : "refuse";
    state.answeredAt = "10" + NB + "h" + NB + "05";
    state.repair = "transmis";
    render(false);
    toast(ok ? "Accord enregistré." : "Refus enregistré.", () => { Object.assign(state, prev); clearTimeout(stepTimer); render(false); });
    clearTimeout(stepTimer);
    stepTimer = setTimeout(() => {
      state.repair = "encours";
      state.messages.unshift({ who: "Thomas", role: "mécanicien", at: 10 * 60 + 6, text: ok ? "Merci, je commence les plaquettes. Votre 308 sera prête vers 18 h 10." : "C'est noté, je termine la révision. Votre 308 sera prête vers 17 h 30." });
      if (current === "suivi" || current === "accueil") render(false);
      const eta = document.getElementById("eta"); if (eta) eta.classList.add("changed");
      banner("Thomas, Garage Brenac", ok ? `Je commence le remplacement des plaquettes. Prête vers ${heure(ETA())}.` : `Je termine la révision. Prête vers ${heure(ETA())}.`);
    }, 5600);
  }

  /* ---------- Toast et notification ---------- */
  const toastEl = document.getElementById("toast");
  function toast(text, undo) {
    clearTimeout(undoTimer);
    toastEl.innerHTML = `<span>${text.replace(/'/g, "\u2019")}</span>${undo ? '<button type="button">Annuler</button>' : ""}`;
    toastEl.hidden = false;
    if (undo) toastEl.querySelector("button").onclick = () => { toastEl.hidden = true; clearTimeout(undoTimer); undo(); };
    undoTimer = setTimeout(() => { toastEl.hidden = true; }, undo ? 5000 : 2600);
  }
  function banner(title, text) {
    const el = document.createElement("a");
    el.className = "banner"; el.href = "#suivi"; el.setAttribute("role", "status");
    el.innerHTML = `<span class="b-ico">${I.mark}</span><span class="grow"><span class="b-top"><b>${title}</b><time>maintenant</time></span><span class="b-text">${text.replace(/'/g, "\u2019")}</span></span>`;
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add("in"));
    const close = () => { el.classList.remove("in"); setTimeout(() => el.remove(), 400); };
    el.addEventListener("click", close);
    let y0 = null;
    el.addEventListener("touchstart", (e) => { y0 = e.touches[0].clientY; }, { passive: true });
    el.addEventListener("touchmove", (e) => { if (y0 != null && e.touches[0].clientY - y0 < -20) close(); }, { passive: true });
    setTimeout(close, 6500);
  }

  /* Retour par glissement depuis le bord gauche, comme sur iPhone */
  let sx = null;
  document.addEventListener("touchstart", (e) => { sx = e.touches[0].clientX < 24 && DEPTH[current] ? e.touches[0].clientX : null; }, { passive: true });
  document.addEventListener("touchend", (e) => { if (sx != null && e.changedTouches[0].clientX - sx > 90) history.back(); sx = null; }, { passive: true });

  // Accès direct utilisé pour les captures : #creneau, #confirmation…
  window.__brenac = { state, PRESTATIONS, DAYS, go, answer };
  route();
})();
