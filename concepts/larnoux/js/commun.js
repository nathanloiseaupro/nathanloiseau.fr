/* Larnoux : comportements communs à toutes les pages. */
(function () {
  "use strict";

  /* Horaires : 0 = dimanche. Heures en minutes depuis minuit. */
  var SERVICES = {
    midi: { debut: 12 * 60, fin: 14 * 60, derniere: 13 * 60 + 45, nom: "midi" },
    soir: { debut: 19 * 60 + 30, fin: 22 * 60 + 30, derniere: 21 * 60 + 45, nom: "soir" }
  };
  var JOURS_OUVERTS = [2, 3, 4, 5, 6];
  var JOURS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
  var MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
  var NBSP = " ";

  function heure(min) {
    var h = Math.floor(min / 60), m = min % 60;
    return h + NBSP + "h" + (m ? NBSP + (m < 10 ? "0" + m : m) : "");
  }
  function estOuvert(date) { return JOURS_OUVERTS.indexOf(date.getDay()) !== -1; }
  function iso(d) {
    var m = d.getMonth() + 1, j = d.getDate();
    return d.getFullYear() + "-" + (m < 10 ? "0" + m : m) + "-" + (j < 10 ? "0" + j : j);
  }
  function majuscule(t) { return t.charAt(0).toUpperCase() + t.slice(1); }
  function jourLong(d) { return JOURS[d.getDay()] + " " + d.getDate() + (d.getDate() === 1 ? "er" : "") + " " + MOIS[d.getMonth()]; }

  /* Calcule l'état d'ouverture à l'instant donné. */
  function etat(maintenant) {
    var min = maintenant.getHours() * 60 + maintenant.getMinutes();
    if (estOuvert(maintenant)) {
      if (min < SERVICES.midi.debut) {
        return { etat: SERVICES.midi.debut - min <= 60 ? "bientot" : "ferme", titre: "Ouvert aujourd’hui", texte: "Ouvre à " + heure(SERVICES.midi.debut) + " pour le midi", court: "ouvre à 12 h" };
      }
      if (min < SERVICES.midi.fin) {
        return { etat: "ouvert", titre: "Ouvert ce midi", texte: "Ouvert, commandes jusqu’à " + heure(SERVICES.midi.derniere), court: "ouvert" };
      }
      if (min < SERVICES.soir.debut) {
        return { etat: SERVICES.soir.debut - min <= 60 ? "bientot" : "ferme", titre: "Ouvert ce soir", texte: "Réouverture ce soir à " + heure(SERVICES.soir.debut), court: "ce soir à 19 h 30" };
      }
      if (min < SERVICES.soir.fin) {
        return { etat: "ouvert", titre: "Ouvert ce soir", texte: "Ouvert, commandes jusqu’à " + heure(SERVICES.soir.derniere), court: "ouvert" };
      }
    }
    var d = new Date(maintenant);
    for (var i = 1; i < 8; i++) {
      d.setDate(d.getDate() + 1);
      if (estOuvert(d)) {
        var quand = i === 1 ? "demain, " + JOURS[d.getDay()] : JOURS[d.getDay()];
        var aujourdhuiFerme = !estOuvert(maintenant);
        return {
          etat: "ferme",
          titre: aujourdhuiFerme ? "Fermé aujourd’hui" : "Fermé pour ce soir",
          texte: (aujourdhuiFerme ? "Fermé aujourd’hui, " : "Fermé, ") + "réouverture " + quand + " à " + heure(SERVICES.midi.debut),
          court: "réouvre " + JOURS[d.getDay()]
        };
      }
    }
    return { etat: "ferme", titre: "Fermé", texte: "Fermé", court: "fermé" };
  }

  /* Prochains jours d'ouverture. */
  function prochainsJours(n, depuis) {
    var liste = [], d = new Date(depuis || new Date());
    d.setHours(0, 0, 0, 0);
    var garde = 0;
    while (liste.length < n && garde < 60) {
      if (estOuvert(d)) liste.push(new Date(d));
      d.setDate(d.getDate() + 1);
      garde++;
    }
    return liste;
  }

  window.Larnoux = { SERVICES: SERVICES, JOURS: JOURS, MOIS: MOIS, heure: heure, iso: iso, estOuvert: estOuvert, etat: etat, prochainsJours: prochainsJours, jourLong: jourLong, majuscule: majuscule };

  document.documentElement.classList.remove("js-off");
  var maintenant = new Date();
  var e = etat(maintenant);

  /* Statut sur la page. */
  document.querySelectorAll("[data-statut]").forEach(function (el) {
    el.setAttribute("data-etat", e.etat);
    var t = el.querySelector("[data-statut-texte]");
    if (t) t.textContent = e.texte;
  });
  document.querySelectorAll("[data-statut-court]").forEach(function (el) { el.textContent = e.court; });
  var bonTitre = document.querySelector("[data-bon-titre]");
  if (bonTitre) bonTitre.textContent = e.titre;
  var bonDate = document.querySelector("[data-bon-date]");
  if (bonDate) bonDate.textContent = majuscule(jourLong(maintenant));

  /* Ligne du jour dans le tableau des horaires. */
  var ligne = document.querySelector('[data-horaires] tr[data-jour="' + maintenant.getDay() + '"]');
  if (ligne) {
    ligne.classList.add("aujourdhui");
    var th = ligne.querySelector("th");
    var marque = document.createElement("span");
    marque.className = "etiquette-jour";
    marque.textContent = "aujourd’hui";
    th.appendChild(marque);
  }

  /* En-tête : filet au défilement. */
  var entete = document.getElementById("entete");
  if (entete) {
    var surveille = function () { entete.classList.toggle("defile", window.scrollY > 8); };
    surveille();
    window.addEventListener("scroll", surveille, { passive: true });
  }

  /* Menu téléphone. */
  var boutonMenu = document.querySelector(".menu-bouton");
  if (boutonMenu && entete) {
    boutonMenu.addEventListener("click", function () {
      var ouvert = entete.classList.toggle("menu-ouvert");
      boutonMenu.setAttribute("aria-expanded", ouvert ? "true" : "false");
    });
    entete.querySelectorAll(".panneau-menu a").forEach(function (a) {
      a.addEventListener("click", function () { entete.classList.remove("menu-ouvert"); boutonMenu.setAttribute("aria-expanded", "false"); });
    });
    document.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape" && entete.classList.contains("menu-ouvert")) { entete.classList.remove("menu-ouvert"); boutonMenu.setAttribute("aria-expanded", "false"); boutonMenu.focus(); }
    });
  }

  /* Copier l'adresse. */
  document.querySelectorAll("[data-copier]").forEach(function (b) {
    b.addEventListener("click", function () {
      var texte = b.getAttribute("data-copier");
      var fini = function () {
        b.textContent = "Adresse copiée";
        b.classList.add("fait");
        setTimeout(function () { b.textContent = "Copier"; b.classList.remove("fait"); }, 2200);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(texte).then(fini, function () { b.textContent = texte; });
      } else { b.textContent = texte; }
    });
  });

  /* Réservation rapide de l'accueil. */
  var rapide = document.querySelector("[data-rapide]");
  if (rapide) {
    var n = 2;
    var sortie = rapide.querySelector("[data-couverts]");
    var champ = rapide.querySelector("[data-couverts-champ]");
    var maj = function () {
      sortie.textContent = n + (n > 1 ? " personnes" : " personne");
      champ.value = n;
      rapide.querySelector("[data-moins]").disabled = n <= 1;
      rapide.querySelector("[data-plus]").disabled = n >= 8;
    };
    rapide.querySelector("[data-moins]").addEventListener("click", function () { if (n > 1) { n--; maj(); } });
    rapide.querySelector("[data-plus]").addEventListener("click", function () { if (n < 8) { n++; maj(); } });
    maj();
    var select = rapide.querySelector("[data-jours-rapides]");
    var demain = new Date(maintenant); demain.setDate(demain.getDate() + 1); demain.setHours(0, 0, 0, 0);
    var aujourdhui = new Date(maintenant); aujourdhui.setHours(0, 0, 0, 0);
    var finSoir = maintenant.getHours() * 60 + maintenant.getMinutes() >= SERVICES.soir.derniere - 15;
    prochainsJours(14, finSoir ? demain : aujourdhui).forEach(function (d, i) {
      var o = document.createElement("option");
      o.value = iso(d);
      var etiquette = majuscule(jourLong(d));
      if (+d === +aujourdhui) etiquette = "Aujourd’hui, " + jourLong(d);
      else if (+d === +demain) etiquette = "Demain, " + jourLong(d);
      o.textContent = etiquette;
      if (i === 0) o.selected = true;
      select.appendChild(o);
    });
    select.querySelector('option[value=""]').remove();
  }

  /* Rail de la journée. */
  var rail = document.querySelector("[data-rail-liste]");
  if (rail) {
    var prec = document.querySelector('[data-rail="precedent"]');
    var suiv = document.querySelector('[data-rail="suivant"]');
    var pas = function () { var li = rail.querySelector("li"); return li ? li.getBoundingClientRect().width + 24 : 300; };
    var bornes = function () {
      prec.disabled = rail.scrollLeft < 8;
      suiv.disabled = rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 8;
    };
    prec.addEventListener("click", function () { rail.scrollBy({ left: -pas(), behavior: "smooth" }); });
    suiv.addEventListener("click", function () { rail.scrollBy({ left: pas(), behavior: "smooth" }); });
    rail.addEventListener("scroll", bornes, { passive: true });
    window.addEventListener("resize", bornes);
    bornes();
  }

  /* Apparitions au défilement. */
  var reveles = document.querySelectorAll(".revele");
  var reduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!("IntersectionObserver" in window) || reduit) {
    reveles.forEach(function (el) { el.classList.add("vu"); });
  } else {
    var obs = new IntersectionObserver(function (entrees) {
      entrees.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("vu"); obs.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    reveles.forEach(function (el) { obs.observe(el); });
  }
})();
