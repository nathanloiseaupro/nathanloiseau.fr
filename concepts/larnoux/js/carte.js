/* Larnoux : onglets des saisons et calendrier des produits. */
(function () {
  "use strict";

  /* Onglets accessibles (flèches, Début, Fin). */
  var onglets = Array.prototype.slice.call(document.querySelectorAll('[role="tab"]'));
  function choisir(onglet, focus) {
    onglets.forEach(function (o) {
      var actif = o === onglet;
      o.setAttribute("aria-selected", actif ? "true" : "false");
      o.tabIndex = actif ? 0 : -1;
      document.getElementById(o.getAttribute("aria-controls")).hidden = !actif;
    });
    if (focus) onglet.focus();
    onglet.scrollIntoView({ block: "nearest", inline: "nearest" });
  }
  onglets.forEach(function (o, i) {
    o.addEventListener("click", function () { choisir(o); });
    o.addEventListener("keydown", function (e) {
      var cible = null;
      if (e.key === "ArrowRight") cible = onglets[(i + 1) % onglets.length];
      if (e.key === "ArrowLeft") cible = onglets[(i - 1 + onglets.length) % onglets.length];
      if (e.key === "Home") cible = onglets[0];
      if (e.key === "End") cible = onglets[onglets.length - 1];
      if (cible) { e.preventDefault(); choisir(cible, true); }
    });
  });

  var actifInitial = document.querySelector('[role="tab"][aria-selected="true"]');
  if (actifInitial) { var barre = actifInitial.parentElement; barre.scrollLeft = actifInitial.offsetLeft - barre.offsetLeft - 16; }

  /* Calendrier : mois de 1 à 12, plages éventuellement à cheval sur l'année. */
  var PRODUITS = [
    { cle: "courge", nom: "Courge", de: 10, a: 1 },
    { cle: "poireau", nom: "Poireau", de: 10, a: 3 },
    { cle: "celeri", nom: "Céleri", de: 10, a: 2 },
    { cle: "champignons", nom: "Champignons des bois", de: 9, a: 11 },
    { cle: "pomme", nom: "Pomme", de: 9, a: 3 },
    { cle: "poire", nom: "Poire", de: 9, a: 1 },
    { cle: "coing", nom: "Coing", de: 10, a: 12 },
    { cle: "chou", nom: "Chou", de: 11, a: 3 },
    { cle: "noix", nom: "Noix et noisettes", de: 9, a: 12 },
    { cle: "asperge", nom: "Asperge", de: 4, a: 6, saison: "printemps" },
    { cle: "petitspois", nom: "Petits pois", de: 5, a: 7, saison: "printemps" },
    { cle: "fraise", nom: "Fraise", de: 5, a: 7, saison: "printemps" },
    { cle: "tomate", nom: "Tomate", de: 7, a: 9, saison: "été" },
    { cle: "courgette", nom: "Courgette", de: 6, a: 9, saison: "été" },
    { cle: "cerise", nom: "Cerise", de: 6, a: 7, saison: "été" }
  ];
  var MOIS_COURTS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
  var MOIS_LONGS = window.Larnoux ? window.Larnoux.MOIS : MOIS_COURTS;

  function dansPlage(p, m) { return p.de <= p.a ? (m >= p.de && m <= p.a) : (m >= p.de || m <= p.a); }

  var table = document.querySelector("[data-calendrier]");
  var aide = document.querySelector("[data-calendrier-aide]");
  if (!table) return;

  var maintenant = new Date();
  var moisCourant = maintenant.getMonth() + 1;
  var joursDansMois = new Date(maintenant.getFullYear(), moisCourant, 0).getDate();
  var avance = Math.round(((maintenant.getDate() - 0.5) / joursDansMois) * 100);
  var platsCarte = Array.prototype.slice.call(document.querySelectorAll("#saison-automne .plat"));

  var thead = document.createElement("thead");
  var tr = document.createElement("tr");
  var coin = document.createElement("th");
  coin.innerHTML = '<span class="visuellement-cache">Produit</span>';
  tr.appendChild(coin);
  MOIS_COURTS.forEach(function (m, i) {
    var th = document.createElement("th");
    th.scope = "col";
    th.textContent = m;
    th.title = MOIS_LONGS[i];
    if (i + 1 === moisCourant) th.className = "mois-courant";
    tr.appendChild(th);
  });
  thead.appendChild(tr);
  table.appendChild(thead);

  var tbody = document.createElement("tbody");
  PRODUITS.forEach(function (p) {
    var ligne = document.createElement("tr");
    ligne.dataset.cle = p.cle;
    var nb = platsCarte.filter(function (pl) { return (pl.dataset.produits || "").split(" ").indexOf(p.cle) !== -1; }).length;
    var th = document.createElement("th");
    th.scope = "row";
    var b = document.createElement("button");
    b.type = "button";
    b.setAttribute("aria-pressed", "false");
    b.innerHTML = "<span>" + p.nom + '</span><span class="sur-la-carte">' + (nb ? nb + (nb > 1 ? " plats" : " plat") : (dansPlage(p, moisCourant) ? "bientôt" : "hors saison")) + "</span>";
    th.appendChild(b);
    ligne.appendChild(th);
    for (var m = 1; m <= 12; m++) {
      var td = document.createElement("td");
      if (m === moisCourant) { td.className = "mois-courant"; td.style.setProperty("--avance", avance + "%"); }
      if (dansPlage(p, m)) {
        var barre = document.createElement("span");
        barre.className = "barre";
        var avant = m === 1 ? 12 : m - 1, apres = m === 12 ? 1 : m + 1;
        if (!dansPlage(p, avant) || m === 1) barre.classList.add("debut");
        if (!dansPlage(p, apres) || m === 12) barre.classList.add("fin");
        if (m === 1 && dansPlage(p, 12)) barre.classList.remove("debut");
        if (m === 12 && dansPlage(p, 1)) barre.classList.remove("fin");
        td.appendChild(barre);
        td.setAttribute("aria-label", "en saison");
      }
      ligne.appendChild(td);
    }
    b.addEventListener("click", function () { activer(p, b, ligne, nb); });
    tbody.appendChild(ligne);
  });
  table.appendChild(tbody);

  /* Sur petit écran, amener le mois en cours à l'écran. */
  var defile = table.closest(".calendrier-defile");
  var colonne = thead.querySelector(".mois-courant");
  if (defile && colonne && defile.scrollWidth > defile.clientWidth) {
    var premiere = thead.querySelector("th").getBoundingClientRect().width;
    defile.scrollLeft = colonne.offsetLeft - premiere - colonne.offsetWidth * 3;
  }

  var produitActif = null;
  function nomPlage(p) { var m = MOIS_LONGS[p.de - 1]; return (/^[aeiouéèâ]/i.test(m) ? "d’" : "de ") + m + " à " + MOIS_LONGS[p.a - 1]; }

  function activer(p, bouton, ligne, nb) {
    var dejaActif = produitActif === p.cle;
    tbody.querySelectorAll("tr").forEach(function (l) { l.classList.remove("actif"); l.querySelector("button").setAttribute("aria-pressed", "false"); });
    platsCarte.forEach(function (pl) { pl.classList.remove("mis-en-avant", "estompe"); });
    if (dejaActif) { produitActif = null; aide.textContent = ""; return; }
    produitActif = p.cle;
    ligne.classList.add("actif");
    bouton.setAttribute("aria-pressed", "true");
    if (nb) {
      var noms = [];
      platsCarte.forEach(function (pl) {
        var contient = (pl.dataset.produits || "").split(" ").indexOf(p.cle) !== -1;
        pl.classList.add(contient ? "mis-en-avant" : "estompe");
        if (contient) noms.push(pl.querySelector(".plat-nom").firstChild.textContent.trim());
      });
      aide.textContent = p.nom + ", " + nomPlage(p) + ". En ce moment à la carte : " + noms.join(" ; ") + ". Les plats sont surlignés plus haut.";
    } else if (dansPlage(p, moisCourant)) {
      aide.textContent = p.nom + ", " + nomPlage(p) + ". Il entre à la carte dans les prochaines semaines.";
    } else {
      aide.textContent = p.nom + ", " + nomPlage(p) + ". Vous le retrouverez à la carte " + (p.saison === "été" ? "l’été" : "au printemps") + " prochain.";
    }
    aide.textContent = aide.textContent.replace(/ ([:;?!])/g, " $1");
  }
})();
