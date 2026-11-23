(function () {
  var head = document.querySelector('.site-head');
  function onScroll() { if (head) head.classList.toggle('scrolled', window.scrollY > 8); }
  onScroll(); window.addEventListener('scroll', onScroll, { passive: true });

  var btn = document.querySelector('.menu-btn'), menu = document.getElementById('menu-mobile');
  if (btn && menu) {
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      menu.classList.toggle('open', open);
    });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) { btn.setAttribute('aria-expanded', 'false'); menu.classList.remove('open'); } });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menu.classList.contains('open')) { btn.click(); btn.focus(); } });
  }

  var els = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    els.forEach(function (el, i) {
      var sib = el.parentNode ? Array.prototype.indexOf.call(el.parentNode.children, el) : 0;
      el.style.transitionDelay = Math.min(sib, 4) * 70 + 'ms';
      io.observe(el);
    });
  } else { els.forEach(function (el) { el.classList.add('in'); }); }

  /* Ouverture fluide des questions */
  document.querySelectorAll('.faq details').forEach(function (d) {
    var s = d.querySelector('summary');
    s.addEventListener('click', function (e) {
      if (!d.open) return;
      e.preventDefault();
      d.classList.add('closing');
      var ans = d.querySelector('.ans');
      ans.style.gridTemplateRows = '0fr';
      setTimeout(function () { d.open = false; ans.style.gridTemplateRows = ''; d.classList.remove('closing'); }, 380);
    });
  });
})();
