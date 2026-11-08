// Clips play only while on screen (saves battery/bandwidth) and stay still if the user prefers
// reduced motion. Each clip gets a bar along the bottom: click or drag to seek.
(function () {
  var videos = document.querySelectorAll('.frame video');
  var still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var visible = new WeakMap(), dragging = new WeakSet();

  function play(v) {
    if (still || dragging.has(v) || !visible.get(v)) return;
    var p = v.play(); if (p && p.catch) p.catch(function () {});
  }

  videos.forEach(function (v) {
    var frame = v.parentNode;
    frame.insertAdjacentHTML('beforeend', '<div class="scrub" aria-hidden="true"><div class="track"><div class="bar"></div></div></div>');
    var scrub = frame.querySelector('.scrub'), bar = frame.querySelector('.bar');

    v.addEventListener('timeupdate', function () {
      if (v.duration) bar.style.width = (100 * v.currentTime / v.duration) + '%';
    });

    function seek(e) {
      var r = scrub.getBoundingClientRect();
      var f = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
      if (v.duration) v.currentTime = Math.min(f * v.duration, v.duration - 0.05);
    }
    scrub.addEventListener('pointerdown', function (e) {
      if (v.preload !== 'auto') v.preload = 'auto';
      dragging.add(v); v.pause();
      scrub.setPointerCapture(e.pointerId); frame.classList.add('scrubbing'); seek(e);
    });
    scrub.addEventListener('pointermove', function (e) { if (scrub.hasPointerCapture(e.pointerId)) seek(e); });
    function end(e) {
      if (scrub.hasPointerCapture(e.pointerId)) scrub.releasePointerCapture(e.pointerId);
      frame.classList.remove('scrubbing'); dragging.delete(v); play(v);
    }
    scrub.addEventListener('pointerup', end);
    scrub.addEventListener('pointercancel', end);
  });

  if (!('IntersectionObserver' in window)) return;
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      visible.set(e.target, e.isIntersecting);
      if (e.isIntersecting) { e.target.preload = 'auto'; play(e.target); }
      else e.target.pause();
    });
  }, { rootMargin: '150px' });
  videos.forEach(function (v) { io.observe(v); });
})();
