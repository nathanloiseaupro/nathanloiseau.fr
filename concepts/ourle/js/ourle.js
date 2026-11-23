/* Ourlé : panier, fiche produit, commande. Aucune dépendance. */
(function () {
  "use strict";
  var D = window.OURLE || { catalogue: {} };
  var CAT = D.catalogue;
  var KEY = "ourle-panier-v1";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- argent ---------- */
  function euro(v) {
    var r = Math.round(v * 100) / 100;
    if (Math.abs(r - Math.round(r)) < 0.001) return Math.round(r) + " €";
    return r.toFixed(2).replace(".", ",") + " €";
  }

  /* ---------- stockage ---------- */
  var memory = [];
  function load() {
    try {
      var raw = window.localStorage.getItem(KEY);
      var v = raw ? JSON.parse(raw) : [];
      return Array.isArray(v) ? v.filter(function (l) { return CAT[l.slug] && l.qty > 0; }) : [];
    } catch (e) { return memory.slice(); }
  }
  function save(lines) {
    memory = lines.slice();
    try { window.localStorage.setItem(KEY, JSON.stringify(lines)); } catch (e) { /* navigation privée : panier gardé en mémoire */ }
  }

  function unitPrice(l) {
    var p = CAT[l.slug];
    var v = l.variant && p.variants[l.variant];
    return p.price + (v ? v.add : 0);
  }
  function subtotal(lines) { return lines.reduce(function (s, l) { return s + unitPrice(l) * l.qty; }, 0); }
  function countOf(lines) { return lines.reduce(function (s, l) { return s + l.qty; }, 0); }
  function shipping(sub, mode) {
    if (mode === "atelier") return 0;
    if (sub >= D.freeFrom) return 0;
    return mode === "relais" ? D.shipRelay : D.shipHome;
  }

  function add(slug, variant, qty) {
    var lines = load();
    var p = CAT[slug];
    if (!p) return;
    if (!variant) { var keys = Object.keys(p.variants); variant = keys.length ? keys[0] : ""; }
    var found = lines.filter(function (l) { return l.slug === slug && (l.variant || "") === variant; })[0];
    if (found) found.qty = Math.min(12, found.qty + qty);
    else lines.push({ slug: slug, variant: variant, qty: qty });
    save(lines);
    refresh(true);
  }

  /* ---------- rendu des lignes ---------- */
  var lastRemoved = null;

  function lineHTML(l, i) {
    var p = CAT[l.slug];
    var v = l.variant && p.variants[l.variant];
    return '<div class="line" data-i="' + i + '">' +
      '<img src="img/' + p.img + '-700.webp" alt="" width="76" height="92" loading="lazy">' +
      '<a class="line-name" href="' + p.url + '">' + p.name + "</a>" +
      '<span class="line-var">' + (v ? (p.kind === "Vase modelé" ? "Hauteur " : "Émail ") + v.label : p.kind) + " · " + euro(unitPrice(l)) + " pièce</span>" +
      '<span class="line-price">' + euro(unitPrice(l) * l.qty) + "</span>" +
      '<div class="line-ctrl"><div class="qty">' +
      '<button type="button" data-line-step="-1" aria-label="Retirer une pièce de ' + p.name + '">−</button>' +
      '<input type="number" value="' + l.qty + '" min="1" max="12" inputmode="numeric" aria-label="Quantité de ' + p.name + '" data-line-qty>' +
      '<button type="button" data-line-step="1" aria-label="Ajouter une pièce de ' + p.name + '">+</button></div>' +
      '<button type="button" class="line-rm" data-line-rm>Retirer</button></div></div>';
  }

  function undoHTML() {
    if (!lastRemoved) return "";
    return '<div class="undo"><span>' + CAT[lastRemoved.line.slug].name + " retiré du panier.</span>" +
      '<button type="button" data-undo>Annuler</button></div>';
  }

  function freeHTML(sub) {
    var left = D.freeFrom - sub;
    var p = Math.min(1, sub / D.freeFrom);
    var msg = left > 0
      ? "Plus que <strong>" + euro(left) + "</strong> pour la livraison offerte à domicile ou en point relais."
      : "La livraison est <strong>offerte</strong> à domicile et en point relais.";
    return '<div class="free"><p>' + msg + '</p><div class="free-bar" aria-hidden="true"><i style="--p:' + p.toFixed(3) + '"></i></div></div>';
  }

  function totalsHTML(sub, mode) {
    var ship = shipping(sub, mode || "domicile");
    var label = mode === "relais" ? "Livraison en point relais" : mode === "atelier" ? "Retrait à l’atelier" : "Livraison à domicile";
    return '<dl class="totals"><div><dt>Sous-total</dt><dd>' + euro(sub) + "</dd></div>" +
      "<div><dt>" + label + "</dt><dd>" + (ship ? euro(ship) : "Offerte") + "</dd></div>" +
      '<div class="grand"><dt>Total TTC</dt><dd>' + euro(sub + ship) + "</dd></div></dl>";
  }

  function emptyHTML() {
    return '<div class="empty"><p>Votre panier est vide.</p><ul>' +
      '<li><a href="la-table.html">La table</a></li><li><a href="bols-et-tasses.html">Bols et tasses</a></li><li><a href="vases.html">Vases</a></li></ul></div>';
  }

  function renderDrawer() {
    var lines = load();
    var body = $("[data-cart-lines]");
    var foot = $("[data-cart-foot]");
    if (!body) return;
    if (!lines.length) {
      body.innerHTML = undoHTML() + emptyHTML();
      foot.hidden = true;
      return;
    }
    foot.hidden = false;
    var sub = subtotal(lines);
    body.innerHTML = undoHTML() + lines.map(lineHTML).join("");
    foot.innerHTML = freeHTML(sub) + totalsHTML(sub, "domicile") +
      '<a class="btn btn-main" href="livraison.html">Commander</a>' +
      '<p class="foot-note">Retrait gratuit à l’atelier possible à l’étape suivante.</p>';
  }

  function renderCartPage() {
    var host = $("[data-cart-page]");
    if (!host) return;
    var lines = load();
    if (!lines.length) { host.innerHTML = '<div>' + undoHTML() + emptyHTML() + "</div>"; return; }
    var sub = subtotal(lines);
    host.innerHTML = '<div class="co-lines">' + undoHTML() + lines.map(lineHTML).join("") + "</div>" +
      '<aside class="co-sum"><h2>Récapitulatif</h2>' + freeHTML(sub) + totalsHTML(sub, "domicile") +
      '<a class="btn btn-main" href="livraison.html">Commander</a>' +
      '<ul class="reassure"><li>Expédition depuis l’atelier sous 3 jours ouvrés.</li><li>Pièce arrivée cassée : remplacée ou remboursée.</li><li>14 jours pour changer d’avis après réception.</li></ul></aside>';
  }

  function summaryHTML(mode) {
    var lines = load();
    if (!lines.length) return '<h2>Récapitulatif</h2>' + emptyHTML();
    var sub = subtotal(lines);
    var items = lines.map(function (l) {
      var p = CAT[l.slug];
      var v = l.variant && p.variants[l.variant];
      return '<li><img src="img/' + p.img + '-700.webp" alt="" width="44" height="52" loading="lazy"><span>' + p.name +
        (v ? " · " + v.label : "") + (l.qty > 1 ? " × " + l.qty : "") + "</span><span>" + euro(unitPrice(l) * l.qty) + "</span></li>";
    }).join("");
    return '<h2>Récapitulatif <a href="panier.html" class="opt-lbl">modifier</a></h2><ul class="sum-lines">' + items + "</ul>" + totalsHTML(sub, mode);
  }

  function renderCount(bump) {
    var n = countOf(load());
    $$("[data-cart-count]").forEach(function (el) {
      el.textContent = n;
      el.parentNode.setAttribute("aria-label", "Panier, " + n + (n > 1 ? " pièces" : " pièce"));
      if (bump && !reduce) {
        el.classList.remove("bump"); void el.offsetWidth; el.classList.add("bump");
        setTimeout(function () { el.classList.remove("bump"); }, 400);
      }
    });
  }

  function refresh(bump) {
    renderCount(bump);
    renderDrawer();
    renderCartPage();
    renderCheckout();
  }

  /* ---------- tiroir ---------- */
  var drawer = $(".drawer"), veil = $(".drawer-veil"), opener = null;
  function openCart() {
    if (!drawer) return;
    if (document.body.dataset.page === "cart") return;
    opener = document.activeElement;
    lastRemoved = null;
    renderDrawer();
    drawer.hidden = false; veil.hidden = false;
    requestAnimationFrame(function () { requestAnimationFrame(function () { drawer.classList.add("is-open"); veil.classList.add("is-open"); }); });
    document.documentElement.style.overflow = "hidden";
    setTimeout(function () { var b = $(".drawer-close", drawer); if (b) b.focus(); }, 60);
  }
  function closeCart() {
    if (!drawer || drawer.hidden) return;
    drawer.classList.remove("is-open"); veil.classList.remove("is-open");
    document.documentElement.style.overflow = "";
    setTimeout(function () { drawer.hidden = true; veil.hidden = true; }, reduce ? 0 : 420);
    if (opener && opener.focus) opener.focus();
  }
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { closeCart(); closeMenu(); }
    if (e.key === "Tab" && drawer && !drawer.hidden) {
      var f = $$('a[href], button, input', drawer).filter(function (x) { return x.offsetParent !== null; });
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    }
  });

  /* ---------- toast ---------- */
  var toastT;
  function toast(msg) {
    var t = $("[data-toast]");
    if (!t) return;
    t.textContent = msg; t.classList.add("is-on");
    clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove("is-on"); }, 2600);
  }

  /* ---------- délégation des clics ---------- */
  document.addEventListener("click", function (e) {
    var t = e.target.closest ? e.target : e.target.parentNode;
    var b;
    if ((b = t.closest("[data-open-cart]"))) {
      if (document.body.dataset.page === "cart") return;
      e.preventDefault(); openCart(); return;
    }
    if (t.closest("[data-close-cart]")) { closeCart(); return; }
    if ((b = t.closest("[data-add]"))) {
      add(b.getAttribute("data-add"), "", 1);
      var old = b.textContent;
      b.textContent = "Ajouté au panier"; b.classList.add("is-done");
      setTimeout(function () { b.textContent = old; b.classList.remove("is-done"); }, 1800);
      openCart();
      return;
    }
    var line = t.closest(".line");
    if (line) {
      var lines = load(), i = +line.getAttribute("data-i");
      if (!lines[i]) return;
      if ((b = t.closest("[data-line-step]"))) {
        lines[i].qty = Math.max(1, Math.min(12, lines[i].qty + (+b.getAttribute("data-line-step"))));
        save(lines); lastRemoved = null; refresh(false); refocus(i, b.getAttribute("data-line-step"));
        return;
      }
      if (t.closest("[data-line-rm]")) {
        lastRemoved = { line: lines[i], index: i };
        lines.splice(i, 1); save(lines); refresh(false);
        var u = $("[data-undo]", drawer && !drawer.hidden ? drawer : document); if (u) u.focus();
        return;
      }
    }
    if (t.closest("[data-undo]") && lastRemoved) {
      var ls = load(); ls.splice(Math.min(lastRemoved.index, ls.length), 0, lastRemoved.line);
      lastRemoved = null; save(ls); refresh(false);
    }
  });
  function refocus(i, dir) {
    var scope = drawer && !drawer.hidden ? drawer : document;
    var el = $('.line[data-i="' + i + '"] [data-line-step="' + dir + '"]', scope);
    if (el) el.focus();
  }
  document.addEventListener("change", function (e) {
    var inp = e.target;
    if (inp.matches && inp.matches("[data-line-qty]")) {
      var lines = load(), i = +inp.closest(".line").getAttribute("data-i");
      var v = parseInt(inp.value, 10);
      if (!lines[i]) return;
      lines[i].qty = isNaN(v) ? 1 : Math.max(1, Math.min(12, v));
      save(lines); refresh(false);
    }
  });

  /* ---------- menu téléphone ---------- */
  var menuBtn = $(".menu-btn"), nav = $("#nav");
  function closeMenu() { if (menuBtn && nav) { nav.classList.remove("is-open"); menuBtn.setAttribute("aria-expanded", "false"); } }
  if (menuBtn && nav) {
    menuBtn.addEventListener("click", function () {
      var open = !nav.classList.contains("is-open");
      nav.classList.toggle("is-open", open);
      menuBtn.setAttribute("aria-expanded", String(open));
    });
    $$("a", nav).forEach(function (a) { a.addEventListener("click", closeMenu); });
  }

  /* ---------- tri des collections ---------- */
  var sortSel = $("[data-sort]"), grid = $("[data-grid]");
  if (sortSel && grid) {
    sortSel.addEventListener("change", function () {
      var cards = $$(".card", grid), tile = $(".card-note-tile", grid);
      var m = sortSel.value;
      cards.sort(function (a, b) {
        if (m === "asc") return a.dataset.price - b.dataset.price;
        if (m === "desc") return b.dataset.price - a.dataset.price;
        return a.dataset.order - b.dataset.order;
      });
      cards.forEach(function (c) { grid.appendChild(c); });
      if (tile) grid.insertBefore(tile, grid.children[Math.min(4, grid.children.length)] || null);
    });
  }

  /* ---------- date d'expédition ---------- */
  var HOLI = ["2026-11-11", "2026-12-25", "2027-01-01", "2027-03-29", "2027-05-01", "2027-05-06", "2027-05-08", "2027-05-17", "2027-07-14", "2027-08-15", "2027-11-01", "2027-11-11", "2027-12-25"];
  function iso(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function workdays(n) {
    var d = new Date(); d.setHours(12);
    while (n > 0) {
      d.setDate(d.getDate() + 1);
      var w = d.getDay();
      if (w !== 0 && w !== 6 && HOLI.indexOf(iso(d)) < 0) n--;
    }
    return d;
  }

  /* ---------- fiche produit ---------- */
  var pdp = $(".pdp");
  if (pdp) {
    var slug = pdp.getAttribute("data-product");
    var p = CAT[slug];
    var form = $("[data-add-form]");
    var qtyIn = $("[data-qty] input");
    var shipLine = $("[data-ship-line]");
    if (shipLine) {
      try {
        var day = workdays(+pdp.getAttribute("data-ship"));
        var txt = day.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
        shipLine.textContent = "Commandé aujourd’hui, expédié au plus tard le " + txt + ".";
      } catch (e) { /* le texte par défaut reste */ }
    }
    $$("[data-step]").forEach(function (b) {
      b.addEventListener("click", function () {
        var v = Math.max(1, Math.min(12, (parseInt(qtyIn.value, 10) || 1) + (+b.getAttribute("data-step"))));
        qtyIn.value = v;
      });
    });
    function variant() { var r = $('input[name="variante"]:checked', form); return r ? r.value : ""; }
    function updateVariant() {
      var v = variant();
      var add = v && p.variants[v] ? p.variants[v].add : 0;
      $$("[data-price]").forEach(function (el) { el.textContent = euro(p.price + add); });
      var profs = $$(".profile[data-variant]");
      profs.forEach(function (s) {
        var on = s.getAttribute("data-variant") === v;
        if (on) s.removeAttribute("hidden"); else s.setAttribute("hidden", "");
        if (on) draw(s);
      });
    }
    $$('input[name="variante"]', form).forEach(function (r) { r.addEventListener("change", updateVariant); });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var q = Math.max(1, Math.min(12, parseInt(qtyIn.value, 10) || 1));
      add(slug, variant(), q);
      var b = $("[data-add-main]");
      b.textContent = "Ajouté au panier"; b.classList.add("is-done");
      setTimeout(function () { b.textContent = "Ajouter au panier"; b.classList.remove("is-done"); }, 1800);
      openCart();
    });
    var sticky = $("[data-sticky-buy]"), mainBtn = $("[data-add-main]");
    if (sticky && mainBtn && "IntersectionObserver" in window) {
      sticky.hidden = false;
      new IntersectionObserver(function (en) {
        var below = !en[0].isIntersecting && en[0].boundingClientRect.top < 0;
        if (below) sticky.setAttribute("data-show", ""); else sticky.removeAttribute("data-show");
      }).observe(mainBtn);
      $("[data-sticky-add]").addEventListener("click", function () { form.requestSubmit ? form.requestSubmit() : form.dispatchEvent(new Event("submit")); });
    }
    var track = $("[data-gallery]"), count = $("[data-gcount]");
    if (track && count) {
      var n = track.children.length;
      track.addEventListener("scroll", function () {
        var i = Math.round(track.scrollLeft / track.clientWidth) + 1;
        count.textContent = Math.min(n, i) + " / " + n;
      }, { passive: true });
    }
    // dessin du profil quand il arrive à l'écran
    function draw(svg) {
      if (reduce) return;
      $$(".pf-body, .pf-line", svg).forEach(function (path) {
        try { path.style.setProperty("--len", Math.ceil(path.getTotalLength())); } catch (e) { /* rien */ }
      });
      svg.classList.remove("is-drawn"); void svg.getBoundingClientRect(); svg.classList.add("is-drawn");
    }
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (en) {
        en.forEach(function (x) { if (x.isIntersecting) { $$(".profile:not([hidden])", x.target).forEach(draw); io.unobserve(x.target); } });
      }, { threshold: 0.4 });
      var fig = $(".g-profile"); if (fig) io.observe(fig);
    }
  }

  /* ---------- commande ---------- */
  var checkout = $("[data-checkout]");
  function mode() { var r = checkout && $('input[name="mode"]:checked', checkout); return r ? r.value : "domicile"; }
  function renderCheckout() {
    if (!checkout) return;
    var sum = $("[data-checkout-summary]");
    sum.innerHTML = summaryHTML(mode());
    var sub = subtotal(load());
    $$("[data-ship-price]").forEach(function (el) {
      var m = el.getAttribute("data-ship-price");
      var s = shipping(sub, m);
      el.textContent = s ? euro(s) : "Offerte";
    });
  }
  if (checkout) {
    var addr = $("[data-address]", checkout);
    $$('input[name="mode"]', checkout).forEach(function (r) {
      r.addEventListener("change", function () {
        addr.hidden = mode() === "atelier";
        $$("input[required]", addr).forEach(function (i) { i.disabled = mode() === "atelier"; });
        renderCheckout();
      });
    });
    var rules = {
      email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? "" : "Indiquez une adresse e-mail complète, par exemple prenom@exemple.fr."; },
      prenom: function (v) { return v ? "" : "Indiquez votre prénom."; },
      nom: function (v) { return v ? "" : "Indiquez votre nom."; },
      adresse: function (v) { return v ? "" : "Indiquez le numéro et la rue."; },
      cp: function (v) { return /^\d{5}$/.test(v) ? "" : "Le code postal compte 5 chiffres."; },
      ville: function (v) { return v ? "" : "Indiquez la ville."; }
    };
    function check(input) {
      var rule = rules[input.name];
      if (!rule || input.disabled) return true;
      var msg = rule(input.value.trim());
      var id = input.id + "-err";
      var old = document.getElementById(id);
      if (msg) {
        input.setAttribute("aria-invalid", "true");
        if (!old) { old = document.createElement("p"); old.className = "err"; old.id = id; input.insertAdjacentElement("afterend", old); }
        old.textContent = msg;
        input.setAttribute("aria-describedby", (input.getAttribute("aria-describedby") || "").replace(id, "").trim() + " " + id);
      } else {
        input.removeAttribute("aria-invalid");
        if (old) old.remove();
      }
      return !msg;
    }
    $$("input", checkout).forEach(function (i) {
      i.addEventListener("blur", function () { if (i.value) check(i); });
      i.addEventListener("input", function () { if (i.getAttribute("aria-invalid")) check(i); });
    });
    checkout.addEventListener("submit", function (e) {
      e.preventDefault();
      var lines = load();
      var bad = $$("input", checkout).filter(function (i) { return !check(i); });
      if (bad.length) { bad[0].focus(); return; }
      var done = $("[data-checkout-done]");
      if (!lines.length) {
        done.innerHTML = "<h2>Votre panier est vide.</h2><p><a href=\"boutique.html\">Retourner à la boutique</a></p>";
      } else {
        var sub = subtotal(lines), ship = shipping(sub, mode());
        var where = mode() === "atelier" ? "Retrait à l’atelier, le samedi de 10 h à 18 h, après notre e-mail." :
          ($("#adresse").value + ", " + $("#cp").value + " " + $("#ville").value + (mode() === "relais" ? " (point relais choisi à l’étape suivante)" : ""));
        done.innerHTML = "<h2>Vos informations sont enregistrées.</h2>" +
          "<p>" + where.replace(/</g, "&lt;") + "</p>" +
          "<p>Montant à régler : <strong>" + euro(sub + ship) + "</strong>, livraison comprise. À l’étape suivante, vous payez par carte bancaire sur la page sécurisée de notre banque.</p>";
      }
      done.hidden = false; done.focus();
    });
  }

  document.body.dataset.page = $("[data-cart-page]") ? "cart" : "";
  refresh(false);
})();
