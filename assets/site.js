// Play clips only while on screen (saves battery/bandwidth); stay still if the user prefers reduced motion.
(function () {
  var videos = document.querySelectorAll('video');
  var still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (still || !('IntersectionObserver' in window)) return;
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.preload = 'auto'; var p = e.target.play(); if (p && p.catch) p.catch(function () {}); }
      else e.target.pause();
    });
  }, { rootMargin: '150px' });
  videos.forEach(function (v) { io.observe(v); });
})();
