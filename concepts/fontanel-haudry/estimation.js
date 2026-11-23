(function () {
  var form = document.getElementById('est-form');
  if (!form || !window.FH) return;
  var ops = document.getElementById('ops'), opsVal = document.getElementById('ops-val');
  var salOut = document.getElementById('sal'), self = document.getElementById('self'), jur = document.getElementById('jur');
  var totalEl = document.querySelector('[data-total]'), monthEl = document.querySelector('[data-month]'), linesEl = document.querySelector('[data-lines]');
  var books = document.querySelectorAll('[data-book]');
  var sal = 0, NB = ' ';

  function val(n) { var c = form.querySelector('input[name="' + n + '"]:checked'); return c ? c.value : null; }

  function update(animate) {
    var forme = val('forme');
    var micro = forme === 'micro';
    form.querySelectorAll('[data-hide-micro]').forEach(function (f) { f.hidden = micro; });
    form.querySelectorAll('[data-hide-ei]').forEach(function (f) { f.hidden = forme === 'ei'; });
    var p = (ops.value - ops.min) / (ops.max - ops.min) * 100;
    ops.style.setProperty('--p', p + '%');
    opsVal.textContent = (ops.value >= 600 ? 'Plus de 600' : ops.value) + ' opérations';
    salOut.textContent = sal;

    var o = { forme: forme, ca: val('ca'), ops: +ops.value, tva: val('tva'), sal: micro ? 0 : sal, selfKeep: self.checked, juridique: jur.checked && forme !== 'ei' };
    var r = FH.estimate(o);
    totalEl.textContent = FH.fmt(r.low) + ' à ' + FH.fmt(r.high) + NB + '€';
    monthEl.textContent = 'soit environ ' + FH.fmt(r.month) + NB + '€ HT par mois';
    var html = r.lines.map(function (l) { return '<li><span>' + l[0] + '</span><span>' + FH.fmt(l[1]) + NB + '€</span></li>'; });
    if (micro) html.push('<li class="off"><span>Comptes annuels</span><span>Non exigés</span></li>');
    if (!micro && !o.sal) html.push('<li class="off"><span>Paie</span><span>Aucun salarié</span></li>');
    linesEl.innerHTML = html.join('');
    if (animate) { totalEl.classList.remove('flash'); void totalEl.offsetWidth; totalEl.classList.add('flash'); }

    var q = 'rendez-vous.html?forme=' + forme + '&sal=' + o.sal + '&est=' + r.low + '-' + r.high;
    books.forEach(function (b) { b.href = q; });
    try { sessionStorage.setItem('fh-est', JSON.stringify({ forme: forme, sal: o.sal, low: r.low, high: r.high })); } catch (e) {}
  }

  form.addEventListener('input', function () { update(true); });
  form.addEventListener('change', function () { update(true); });
  form.querySelectorAll('[data-step]').forEach(function (b) {
    b.addEventListener('click', function () { sal = Math.max(0, Math.min(30, sal + +b.dataset.step)); update(true); });
  });
  update(false);
})();
