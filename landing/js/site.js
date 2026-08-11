/* Aluminium World — landing interactions.
   No dependencies. Everything degrades to a readable static page without JS. */

(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------ business-area switcher */

  var items = Array.prototype.slice.call(document.querySelectorAll('.switcher__item'));
  var art = Array.prototype.slice.call(document.querySelectorAll('.areas__art img'));
  var ticks = Array.prototype.slice.call(document.querySelectorAll('.railtext__ticks i'));
  var section = document.getElementById('whatwedo');

  if (items.length) {
    var index = 0;
    var timer = null;
    var userTook = false;
    var DWELL = 5200;

    function show(next) {
      index = (next + items.length) % items.length;
      items.forEach(function (el, i) {
        var on = i === index;
        el.classList.toggle('is-active', on);
        el.setAttribute('aria-selected', on ? 'true' : 'false');
        el.tabIndex = on ? 0 : -1;
      });
      art.forEach(function (el, i) { el.classList.toggle('is-active', i === index); });
      ticks.forEach(function (el, i) { el.classList.toggle('is-active', i === index); });
    }

    function stop() {
      userTook = true;
      if (timer) { clearInterval(timer); timer = null; }
    }

    function start() {
      if (reduced || userTook || timer) return;
      timer = setInterval(function () { show(index + 1); }, DWELL);
    }

    items.forEach(function (el, i) {
      el.addEventListener('click', function () { stop(); show(i); });
      el.addEventListener('mouseenter', function () { if (!userTook) show(i); });
      el.addEventListener('keydown', function (e) {
        var delta = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1
                  : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 0;
        if (!delta) return;
        e.preventDefault();
        stop();
        show(index + delta);
        items[index].focus();
      });
    });

    show(0);

    /* only cycle while the section is actually on screen */
    if ('IntersectionObserver' in window && section) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) { start(); }
          else if (timer) { clearInterval(timer); timer = null; }
        });
      }, { threshold: 0.4 }).observe(section);
    } else {
      start();
    }
  }

  /* -------------------------------------------------------- stub guardrail */
  /* Sections beyond "What we do" are not built yet; keep those links inert
     rather than sending a reviewer to a 404. */

  document.querySelectorAll('[data-stub]').forEach(function (el) {
    el.addEventListener('click', function (e) { e.preventDefault(); });
    el.setAttribute('aria-disabled', 'true');
    el.title = 'Section not built yet';
  });
})();
