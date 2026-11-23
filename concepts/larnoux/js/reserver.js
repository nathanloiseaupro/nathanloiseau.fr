/* Larnoux : réservation en quatre étapes. */
(function () {
  "use strict";
  var L = window.Larnoux;
  var form = document.querySelector("[data-resa]");
  if (!form || !L) return;

  var NBSP = " ";
  var CRENEAUX = {
    midi: [720, 735, 750, 765, 780, 795, 810],
    soir: [1170, 1185, 1200, 1215, 1230, 1245, 1260, 1275, 1290]
  };
  var LIBELLES_SUIVANT = { 1: "Choisir le jour", 2: "Choisir l’heure", 3: "Vos coordonnées", 4: "Confirmer la réservation" };

  var etat = { etape: 1, couverts: 2, jour: null, heure: null, service: null };
  var maintenant = new Date();
  var aujourdhui = new Date(maintenant); aujourdhui.setHours(0, 0, 0, 0);
  var reduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- Disponibilités : calculées de façon stable pour un jour, une heure et un nombre de couverts. ---- */
  function hasard(texte) {
    var h = 2166136261;
    for (var i = 0; i < texte.length; i++) { h ^= texte.charCodeAt(i); h = Math.imul(h, 16777619); }
    h ^= h >>> 13; h = Math.imul(h, 1274126177); h ^= h >>> 16;
    return (h >>> 0) / 4294967295;
  }
  function libre(date, minute, couverts) {
    if (!L.estOuvert(date)) return false;
    if (+date === +aujourdhui && minute <= maintenant.getHours() * 60 + maintenant.getMinutes() + 30) return false;
    var jour = date.getDay();
    var soir = minute >= 1170;
    var p = soir ? 0.3 : 0.2;
    if (soir && (jour === 5 || jour === 6)) p = 0.55;
    if (!soir && jour === 6) p = 0.3;
    if (soir && (minute === 1200 || minute === 1215)) p += 0.12;
    if (couverts >= 5) p += 0.22; else if (couverts >= 3) p += 0.07;
    var ecart = Math.round((date - aujourdhui) / 864e5);
    if (ecart <= 2) p += 0.12;
    if (ecart > 14) p -= 0.15;
    var seuil = couverts >= 5 ? 5 : couverts >= 3 ? 3 : 1;
    return hasard(L.iso(date) + "-" + minute + "-" + seuil) > p;
  }
  function servicesLibres(date, couverts) {
    return ["midi", "soir"].filter(function (s) {
      return CRENEAUX[s].some(function (m) { return libre(date, m, couverts); });
    });
  }

  /* ---- Textes ---- */
  function personnes(n) { return n + NBSP + (n > 1 ? "personnes" : "personne"); }
  function texteJour(d) {
    var base = L.jourLong(d);
    var demain = new Date(aujourdhui); demain.setDate(demain.getDate() + 1);
    if (+d === +aujourdhui) return "Aujourd’hui, " + base;
    if (+d === +demain) return "Demain, " + base;
    return L.majuscule(base);
  }

  /* ---- Récapitulatif ---- */
  function majRecap(cle, valeur) {
    var dd = document.querySelector('[data-recap="' + cle + '"]');
    if (!dd) return;
    var vide = !valeur;
    var texte = vide ? "à choisir" : valeur;
    if (dd.textContent !== texte) {
      dd.textContent = texte;
      dd.classList.toggle("vide", vide);
      if (!vide && !reduit) { dd.classList.remove("change"); void dd.offsetWidth; dd.classList.add("change"); }
    }
  }
  function toutRecap() {
    majRecap("couverts", personnes(etat.couverts));
    majRecap("jour", etat.jour ? texteJour(etat.jour) : "");
    majRecap("heure", etat.heure != null ? L.heure(etat.heure) + " (" + etat.service + ")" : "");
    var resume = document.querySelector("[data-resume]");
    if (resume) {
      var morceaux = ["<b>" + personnes(etat.couverts) + "</b>"];
      morceaux.push(etat.jour ? "<b>" + L.majuscule(L.jourLong(etat.jour)) + "</b>" : "jour à choisir");
      morceaux.push(etat.heure != null ? "<b>" + L.heure(etat.heure) + "</b>" : "heure à choisir");
      resume.innerHTML = morceaux.join(" · ");
    }
    var rappel = document.querySelector("[data-rappel-couverts]");
    if (rappel) rappel.textContent = personnes(etat.couverts);
  }

  /* ---- Étape 1 : couverts ---- */
  var zoneCouverts = form.querySelector("[data-choix-couverts]");
  for (var n = 1; n <= 8; n++) {
    (function (n) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "pastille-choix"; b.setAttribute("role", "radio");
      b.textContent = n;
      b.setAttribute("aria-label", personnes(n));
      b.addEventListener("click", function () { choisirCouverts(n, true); });
      zoneCouverts.appendChild(b);
    })(n);
  }
  function choisirCouverts(n, avance) {
    var change = n !== etat.couverts;
    etat.couverts = n;
    zoneCouverts.querySelectorAll("button").forEach(function (b, i) { b.setAttribute("aria-checked", i + 1 === n ? "true" : "false"); });
    if (change) {
      if (etat.jour && servicesLibres(etat.jour, n).length === 0) etat.jour = null;
      if (etat.jour && etat.heure != null && !libre(etat.jour, etat.heure, n)) { etat.heure = null; etat.service = null; }
    }
    toutRecap();
    if (avance) setTimeout(function () { aller(2); }, reduit ? 0 : 220);
  }

  /* ---- Étape 2 : jours ---- */
  var zoneJours = form.querySelector("[data-choix-jours]");
  function dessinerJours() {
    zoneJours.innerHTML = "";
    var debut = new Date(aujourdhui);
    var decalage = (debut.getDay() + 6) % 7;
    debut.setDate(debut.getDate() - decalage);
    var moisVu = null;
    for (var i = 0; i < 28; i++) {
      var d = new Date(debut); d.setDate(debut.getDate() + i);
      if (i % 7 === 0 && d.getMonth() !== moisVu) {
        var lib = document.createElement("span");
        lib.className = "semaine-libelle"; lib.setAttribute("aria-hidden", "true");
        lib.textContent = L.majuscule(L.MOIS[d.getMonth()]) + " " + d.getFullYear();
        zoneJours.appendChild(lib);
        moisVu = d.getMonth();
      } else if (d.getMonth() !== moisVu && i % 7 !== 0) {
        moisVu = d.getMonth();
      }
      var b = document.createElement("button");
      b.type = "button"; b.className = "jour"; b.setAttribute("role", "radio");
      var passe = d < aujourdhui;
      var ouvert = L.estOuvert(d);
      var services = (!passe && ouvert) ? servicesLibres(d, etat.couverts) : [];
      var dispo;
      if (passe) dispo = "";
      else if (!ouvert) dispo = "fermé";
      else if (!services.length) dispo = "complet";
      else dispo = services.join(", ");
      var dispoHtml = services.length && ouvert && !passe ? services.map(function (s) { return "<span>" + s + "</span>"; }).join('<span class="virgule">, </span>') : dispo;
      b.innerHTML = '<span class="n">' + d.getDate() + (d.getDate() === 1 ? '<sup style="font-size:0.6em">er</sup>' : "") + '</span><span class="dispo">' + dispoHtml + "</span>";
      b.setAttribute("aria-label", texteJour(d) + (dispo ? ", " + dispo : ""));
      if (+d === +aujourdhui) b.classList.add("aujourdhui");
      if (passe || !ouvert || !services.length) b.disabled = true;
      if (etat.jour && +etat.jour === +d) b.setAttribute("aria-checked", "true"); else b.setAttribute("aria-checked", "false");
      (function (d) { b.addEventListener("click", function () { choisirJour(d, true); }); })(d);
      zoneJours.appendChild(b);
    }
  }
  function choisirJour(d, avance) {
    if (!etat.jour || +etat.jour !== +d) { etat.heure = null; etat.service = null; }
    etat.jour = d;
    zoneJours.querySelectorAll(".jour").forEach(function (b) { b.setAttribute("aria-checked", "false"); });
    var cible = Array.prototype.find.call(zoneJours.querySelectorAll(".jour"), function (b) { return b.getAttribute("aria-label").indexOf(L.jourLong(d)) !== -1; });
    if (cible) cible.setAttribute("aria-checked", "true");
    toutRecap();
    if (avance) setTimeout(function () { aller(3); }, reduit ? 0 : 220);
  }

  /* ---- Étape 3 : heures ---- */
  var zoneHeures = form.querySelector("[data-choix-heures]");
  function dessinerHeures() {
    zoneHeures.innerHTML = "";
    var aideHeure = form.querySelector("[data-aide-heure]");
    aideHeure.textContent = texteJour(etat.jour) + ", pour " + personnes(etat.couverts) + ". Les horaires barrés sont déjà complets.";
    ["midi", "soir"].forEach(function (s) {
      var bloc = document.createElement("div");
      bloc.className = "service";
      var info = s === "midi" ? "de 12" + NBSP + "h à 14" + NBSP + "h" : "de 19" + NBSP + "h" + NBSP + "30 à 22" + NBSP + "h" + NBSP + "30";
      bloc.innerHTML = "<h3>" + (s === "midi" ? "Midi" : "Soir") + " <small>" + info + "</small></h3>";
      var grille = document.createElement("div");
      grille.className = "creneaux"; grille.setAttribute("role", "radiogroup"); grille.setAttribute("aria-label", "Horaires du " + s);
      var dispo = 0;
      CRENEAUX[s].forEach(function (m) {
        var b = document.createElement("button");
        b.type = "button"; b.className = "pastille-choix"; b.setAttribute("role", "radio");
        var ok = libre(etat.jour, m, etat.couverts);
        b.innerHTML = L.heure(m).replace(/ h /, NBSP + "h" + NBSP) + (ok ? "" : "<small>complet</small>");
        if (!ok) { b.disabled = true; b.style.textDecoration = "line-through"; b.style.textDecorationThickness = "1px"; }
        else dispo++;
        b.setAttribute("aria-label", L.heure(m) + (ok ? "" : ", complet"));
        b.setAttribute("aria-checked", etat.heure === m ? "true" : "false");
        b.addEventListener("click", function () { choisirHeure(m, s, true); });
        grille.appendChild(b);
      });
      if (dispo === 0) {
        var vide = document.createElement("p");
        vide.className = "service-vide";
        vide.innerHTML = "Le " + s + " est complet ce jour-là. Les six places du comptoir restent ouvertes sans réservation, ou essayez un autre jour.";
        bloc.appendChild(vide);
      } else {
        bloc.appendChild(grille);
      }
      zoneHeures.appendChild(bloc);
    });
  }
  function choisirHeure(m, s, avance) {
    etat.heure = m; etat.service = s;
    zoneHeures.querySelectorAll(".pastille-choix").forEach(function (b) {
      b.setAttribute("aria-checked", b.getAttribute("aria-label") === L.heure(m) && b.closest(".creneaux").getAttribute("aria-label") === "Horaires du " + s ? "true" : "false");
    });
    toutRecap();
    if (avance) setTimeout(function () { aller(4); }, reduit ? 0 : 220);
  }

  /* ---- Navigation entre étapes ---- */
  var boutonSuivant = form.querySelector("[data-suivant]");
  var boutonRetour = form.querySelector("[data-retour]");
  var progression = document.querySelectorAll("[data-progression] li");

  function peutAller(n) {
    if (n >= 3 && !etat.jour) return 2;
    if (n >= 4 && etat.heure == null) return 3;
    return n;
  }
  function aller(n, sansHistorique) {
    n = peutAller(n);
    var ancien = etat.etape;
    etat.etape = n;
    if (n === 2) dessinerJours();
    if (n === 3) dessinerHeures();
    form.querySelectorAll("[data-etape]").forEach(function (f) {
      var actif = +f.getAttribute("data-etape") === n;
      f.hidden = !actif;
      f.classList.remove("entre", "entre-retour");
      if (actif && ancien !== n && !reduit) { void f.offsetWidth; f.classList.add(n > ancien ? "entre" : "entre-retour"); }
    });
    progression.forEach(function (li) {
      var p = +li.getAttribute("data-pas");
      li.classList.toggle("fait", p < n);
      li.classList.toggle("courant", p === n);
      if (p === n) li.setAttribute("aria-current", "step"); else li.removeAttribute("aria-current");
    });
    boutonSuivant.innerHTML = LIBELLES_SUIVANT[n] + ' <span class="fleche" aria-hidden="true">→</span>';
    boutonRetour.hidden = n === 1;
    majEtatSuivant();
    if (ancien !== n && ancien !== 0) {
      var legende = form.querySelector('[data-etape="' + n + '"] legend');
      if (legende) legende.focus({ preventScroll: true });
      var repere = document.querySelector("[data-progression]");
      var haut = repere.getBoundingClientRect().top + window.scrollY - (window.innerWidth < 861 ? 84 : 100);
      if (window.scrollY > haut + 10 || window.innerWidth < 1000) window.scrollTo({ top: Math.max(0, haut), behavior: reduit ? "auto" : "smooth" });
      if (!sansHistorique) history.pushState({ etape: n }, "", "#etape-" + n);
    }
  }
  function majEtatSuivant() {
    var ok = etat.etape === 1 || (etat.etape === 2 && etat.jour) || (etat.etape === 3 && etat.heure != null) || etat.etape === 4;
    boutonSuivant.setAttribute("aria-disabled", ok ? "false" : "true");
  }
  boutonRetour.addEventListener("click", function () { history.back(); });
  window.addEventListener("popstate", function (e) {
    var n = e.state && e.state.etape ? e.state.etape : 1;
    if (!document.querySelector("[data-confirmation]").hidden) return;
    aller(n, true);
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (boutonSuivant.getAttribute("aria-disabled") === "true") {
      var legende = form.querySelector('[data-etape="' + etat.etape + '"] .aide');
      if (legende) { legende.style.color = "var(--rouge)"; setTimeout(function () { legende.style.color = ""; }, 1600); }
      return;
    }
    if (etat.etape < 4) { aller(etat.etape + 1); return; }
    if (valider()) confirmer();
  });

  /* ---- Étape 4 : validation ---- */
  var REGLES = {
    prenom: function (v) { return v.trim() ? "" : "Indiquez votre prénom."; },
    nom: function (v) { return v.trim() ? "" : "Indiquez le nom de la réservation."; },
    telephone: function (v) {
      var t = v.replace(/[\s.\-()]/g, "");
      if (!t) return "Indiquez un numéro pour recevoir la confirmation.";
      return /^(\+33|0033|0)[1-9]\d{8}$/.test(t) ? "" : "Ce numéro ne semble pas complet : il faut dix chiffres, par exemple 06 12 34 56 78.";
    },
    email: function (v) { return !v.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? "" : "Cette adresse e-mail semble incomplète."; }
  };
  function verifier(nom) {
    var champ = form.querySelector('[data-champ="' + nom + '"]');
    var input = champ.querySelector("input");
    var msg = REGLES[nom](input.value).replace(/ :/g, NBSP + ":");
    champ.classList.toggle("erreur", !!msg);
    input.setAttribute("aria-invalid", msg ? "true" : "false");
    champ.querySelector(".message-erreur").textContent = msg;
    return !msg;
  }
  Object.keys(REGLES).forEach(function (nom) {
    var input = form.querySelector('[data-champ="' + nom + '"] input');
    input.addEventListener("blur", function () { if (input.value) verifier(nom); });
    input.addEventListener("input", function () { if (input.getAttribute("aria-invalid") === "true") verifier(nom); });
  });
  function valider() {
    var premier = null;
    Object.keys(REGLES).forEach(function (nom) { if (!verifier(nom) && !premier) premier = form.querySelector('[data-champ="' + nom + '"] input'); });
    if (premier) { premier.focus(); return false; }
    return true;
  }

  /* ---- Confirmation ---- */
  var confirmation = document.querySelector("[data-confirmation]");
  var recap = document.querySelector("[data-recap]");
  function telLisible(v) {
    var t = v.replace(/[\s.\-()]/g, "").replace(/^(\+33|0033)/, "0");
    return t.replace(/(\d{2})(?=\d)/g, "$1" + NBSP);
  }
  function confirmer() {
    var prenom = form.prenom.value.trim(), nom = form.nom.value.trim();
    var besoins = Array.prototype.map.call(form.querySelectorAll('input[name="besoins"]:checked'), function (c) { return c.value; });
    var ref = "LX-" + L.iso(etat.jour).slice(5).replace("-", "") + "-" + String(Math.floor(hasard(prenom + nom + etat.heure) * 9000) + 1000);
    confirmation.querySelector("[data-conf-ref]").textContent = ref;
    confirmation.querySelector("[data-conf-quand]").textContent = L.majuscule(L.jourLong(etat.jour)) + ", " + L.heure(etat.heure);
    confirmation.querySelector("[data-conf-couverts]").textContent = personnes(etat.couverts);
    confirmation.querySelector("[data-conf-nom]").textContent = prenom + " " + nom;
    confirmation.querySelector("[data-conf-tel]").textContent = telLisible(form.telephone.value);
    var ligneBesoins = confirmation.querySelector("[data-conf-besoins-ligne]");
    var notes = besoins.slice();
    if (form.message.value.trim()) notes.push("remarque transmise en cuisine");
    ligneBesoins.hidden = !notes.length;
    confirmation.querySelector("[data-conf-besoins]").textContent = notes.join(", ");
    form.hidden = true;
    document.querySelector("[data-progression]").hidden = true;
    document.querySelector(".resa-tete").hidden = true;
    recap.hidden = true;
    document.querySelector("[data-photo-confirmation]").hidden = false;
    confirmation.hidden = false;
    confirmation.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: reduit ? "auto" : "smooth" });
    history.replaceState({ etape: "confirmation" }, "", "#confirmation");
  }
  document.querySelector("[data-modifier]").addEventListener("click", function () {
    confirmation.hidden = true;
    form.hidden = false;
    document.querySelector("[data-progression]").hidden = false;
    document.querySelector(".resa-tete").hidden = false;
    recap.hidden = false;
    document.querySelector("[data-photo-confirmation]").hidden = true;
    aller(3);
  });
  document.querySelector("[data-agenda]").addEventListener("click", function () {
    var d = etat.jour, debut = etat.heure, fin = etat.heure + 120;
    function pad(x) { return (x < 10 ? "0" : "") + x; }
    function stamp(min) { return d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + "T" + pad(Math.floor(min / 60)) + pad(min % 60) + "00"; }
    var ics = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Larnoux//Reservation//FR", "BEGIN:VEVENT",
      "UID:" + Date.now() + "@bistrot-larnoux.fr",
      "DTSTAMP:" + new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z",
      "DTSTART;TZID=Europe/Paris:" + stamp(debut), "DTEND;TZID=Europe/Paris:" + stamp(fin),
      "SUMMARY:Larnoux\\, table pour " + etat.couverts,
      "LOCATION:9 rue des Fileuses\\, 69004 Lyon",
      "DESCRIPTION:Table gardée 15 minutes. Téléphone : 06 39 98 41 27",
      "END:VEVENT", "END:VCALENDAR"
    ].join("\r\n");
    var lien = document.createElement("a");
    lien.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
    lien.download = "larnoux-reservation.ics";
    document.body.appendChild(lien); lien.click(); lien.remove();
  });

  /* ---- Démarrage, avec les choix venus de l'accueil ---- */
  var params = new URLSearchParams(location.search);
  var c = parseInt(params.get("c"), 10);
  choisirCouverts(c >= 1 && c <= 8 ? c : 2, false);
  var depart = 1;
  var dParam = params.get("d");
  if (dParam && /^\d{4}-\d{2}-\d{2}$/.test(dParam)) {
    var morceaux = dParam.split("-");
    var dj = new Date(+morceaux[0], +morceaux[1] - 1, +morceaux[2]);
    if (dj >= aujourdhui && L.estOuvert(dj) && servicesLibres(dj, etat.couverts).length) { etat.jour = dj; depart = 3; }
    else if (c) depart = 2;
  } else if (c) depart = 2;
  history.replaceState({ etape: depart }, "", location.pathname + location.search + (depart > 1 ? "#etape-" + depart : ""));
  etat.etape = 0;
  aller(depart, true);
  etat.etape = depart;
  toutRecap();
})();
