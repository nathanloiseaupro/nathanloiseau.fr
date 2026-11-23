/* Barème indicatif du cabinet, en euros hors taxes par an. Utilisé par la page Honoraires et par l'accueil. */
(function (g) {
  var BILAN = { ei: 850, uni: 1150, pme: 1300 };
  var JUR = { ei: 0, uni: 320, pme: 420 };
  var TVA = { franchise: 0, simplifie: 240, normal: 540 };
  var CA = { petit: 1, moyen: 1.15, grand: 1.35 };
  function r10(x) { return Math.round(x / 10) * 10; }
  function tenue(ops) { return ops <= 150 ? 480 + 9.5 * ops : 1905 + 6 * (ops - 150); }
  function estimate(o) {
    var lines = [];
    if (o.forme === 'micro') {
      lines.push(['Déclarations et suivi des recettes', 600]);
      if (o.tva !== 'franchise') lines.push(['Déclarations de TVA', 180]);
    } else {
      var t = tenue(o.ops);
      if (o.selfKeep) lines.push(['Révision de votre comptabilité', t * 0.45]);
      else lines.push(['Tenue et révision de la comptabilité', t]);
      lines.push(['Comptes annuels et liasse fiscale', BILAN[o.forme] * CA[o.ca]]);
      if (TVA[o.tva]) lines.push([o.tva === 'normal' ? 'Déclarations de TVA mensuelles' : 'Déclarations de TVA, régime simplifié', TVA[o.tva]]);
      if (JUR[o.forme] && o.juridique) lines.push(['Approbation des comptes et dépôt au greffe', JUR[o.forme]]);
      if (o.sal > 0) lines.push(['Paie et DSN, ' + o.sal + ' salarié' + (o.sal > 1 ? 's' : ''), o.sal * 360 + 180]);
    }
    var total = lines.reduce(function (a, l) { return a + l[1]; }, 0);
    return { lines: lines.map(function (l) { return [l[0], r10(l[1])]; }), low: r10(total * 0.9), high: r10(total * 1.12), month: r10(total / 12) };
  }
  function fmt(n) { return n.toLocaleString('fr-FR').replace(/ /g, ' '); }
  g.FH = { estimate: estimate, fmt: fmt };
  if (typeof module !== 'undefined') module.exports = g.FH;
})(typeof window !== 'undefined' ? window : globalThis);
