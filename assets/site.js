(function () {
  "use strict";
  document.documentElement.classList.add("js");
  var reduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Filet sous l'en-tête une fois la page défilée
  var entete = document.querySelector(".entete");
  if (entete) {
    var surveiller = function () { entete.classList.toggle("defile", window.scrollY > 8); };
    window.addEventListener("scroll", surveiller, { passive: true });
    surveiller();
  }

  // Vidéos : lecture au clic, pause hors de l'écran
  var lecteurs = Array.prototype.slice.call(document.querySelectorAll("[data-video]"));
  var observateur = "IntersectionObserver" in window ? new IntersectionObserver(function (entrees) {
    entrees.forEach(function (e) {
      var v = e.target.querySelector("video");
      if (!v) return;
      if (!e.isIntersecting && !v.paused) { v.pause(); e.target.dataset.reprendre = "1"; }
      else if (e.isIntersecting && e.target.dataset.reprendre === "1" && !reduit) { e.target.dataset.reprendre = ""; v.play().catch(function () {}); }
    });
  }, { threshold: 0.25 }) : null;

  lecteurs.forEach(function (bloc) {
    var v = bloc.querySelector("video");
    var b = bloc.querySelector(".lire");
    if (!v || !b) return;
    b.addEventListener("click", function () {
      lecteurs.forEach(function (autre) {
        var av = autre.querySelector("video");
        if (autre !== bloc && av && !av.paused) av.pause();
      });
      v.controls = true;
      v.play().then(function () { bloc.classList.add("joue"); }).catch(function () { bloc.classList.add("joue"); });
    });
    v.addEventListener("click", function () { if (!v.controls) b.click(); });
    v.addEventListener("ended", function () { v.controls = false; bloc.classList.remove("joue"); v.load(); });
    if (observateur) observateur.observe(bloc);
  });

  // Vidéo de l'ouverture : muette, lancée seulement quand elle est visible
  var auto = document.querySelector(".lecteur-auto video");
  if (auto && !reduit && "IntersectionObserver" in window) {
    new IntersectionObserver(function (entrees) {
      entrees.forEach(function (e) {
        if (e.isIntersecting) {
          if (!auto.getAttribute("src")) auto.src = auto.dataset.src;
          auto.play().catch(function () {});
        } else if (!auto.paused) auto.pause();
      });
    }, { threshold: 0.35 }).observe(auto);
  }

  // Apparition douce des réalisations
  if (!reduit && "IntersectionObserver" in window) {
    var cibles = document.querySelectorAll(".projet, .tarvis-visuel, .tarvis-ecrans figure, .brenac, .etapes li, .grille-prix li, .auto-liste div");
    var vue = new IntersectionObserver(function (entrees) {
      entrees.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("vu"); vue.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    Array.prototype.forEach.call(cibles, function (c, i) {
      c.classList.add("apparait");
      c.style.transitionDelay = (c.matches(".etapes li, .grille-prix li, .tarvis-ecrans figure") ? (i % 5) * 70 : 0) + "ms";
      vue.observe(c);
    });
  }

  // Formulaire : vérification, puis message préparé dans la messagerie
  var form = document.getElementById("formulaire");
  if (form) {
    var champs = {
      nom: function (v) { return v.trim().length > 1; },
      email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); },
      message: function (v) { return v.trim().length > 4; }
    };
    var verifier = function (nom) {
      var el = form.elements[nom];
      var ok = champs[nom](el.value);
      el.setAttribute("aria-invalid", ok ? "false" : "true");
      var err = document.getElementById(nom + "-erreur");
      err.hidden = ok;
      if (ok) el.removeAttribute("aria-describedby"); else el.setAttribute("aria-describedby", nom + "-erreur");
      return ok;
    };
    Object.keys(champs).forEach(function (nom) {
      form.elements[nom].addEventListener("blur", function () { if (this.value) verifier(nom); });
      form.elements[nom].addEventListener("input", function () { if (this.getAttribute("aria-invalid") === "true") verifier(nom); });
    });
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var premier = null;
      Object.keys(champs).forEach(function (nom) { if (!verifier(nom) && !premier) premier = form.elements[nom]; });
      if (premier) { premier.focus(); return; }
      var budget = form.elements.budget.value;
      var corps = form.elements.message.value.trim() + "\n\n" +
        (budget ? "Budget : " + budget + "\n" : "") +
        form.elements.nom.value.trim() + "\n" + form.elements.email.value.trim();
      var sujet = "Projet de " + form.elements.nom.value.trim();
      window.location.href = "mailto:contact@nathanloiseau.fr?subject=" + encodeURIComponent(sujet) + "&body=" + encodeURIComponent(corps);
    });
  }
})();
