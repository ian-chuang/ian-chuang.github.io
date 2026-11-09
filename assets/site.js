// Clip handling (approach borrowed from the DexSafe page, which works on phones):
// - nothing downloads until a clip is mostly on screen (data-src is only set then),
// - only a few clips play at once (phones have very few video decoders),
// - clips that stay off screen give their decoder back (src removed, position remembered),
// - tap/click toggles play, so clips still work when autoplay is blocked (Low Power Mode, data saver),
// - the bar along the bottom is a scrubber: click or drag to seek.
(function () {
  var MAX_PLAYING = matchMedia('(max-width: 700px)').matches ? 2 : 3;
  var UNLOAD_AFTER_MS = 15000;
  var NO_AUTOPLAY = matchMedia('(prefers-reduced-motion: reduce)').matches ||
    (navigator.connection && navigator.connection.saveData === true);
  var PLAY_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4.5v15l13-7.5z"/></svg>';

  var clips = [];

  function load(c) {
    var v = c.video;
    if (!v.getAttribute('src') && v.dataset.src) v.src = v.dataset.src;
  }
  function unload(c) {
    var v = c.video;
    if (!v.getAttribute('src')) return;
    c.resumeAt = v.currentTime || 0;
    v.pause(); v.removeAttribute('src'); v.load();
    c.frame.classList.add('idle');
  }
  function play(c, user) {
    clearTimeout(c.unloadTimer);
    load(c);
    var others = clips.filter(function (o) { return o !== c && !o.video.paused; });
    if (others.length >= MAX_PLAYING) {
      others.sort(function (a, b) { return a.ratio - b.ratio; })
        .slice(0, others.length - MAX_PLAYING + 1)
        .forEach(function (o) { o.video.pause(); });
    }
    var p = c.video.play();
    if (p && p.catch) p.catch(function () { if (!user) c.frame.classList.add('paused'); });
  }

  function setup(video) {
    var frame = video.parentNode;
    var c = { video: video, frame: frame, ratio: 0, userPaused: false, resumeAt: 0, unloadTimer: 0 };
    video.muted = true; video.playsInline = true; video.loop = true; video.preload = 'none';
    video.setAttribute('muted', ''); video.setAttribute('playsinline', '');
    frame.insertAdjacentHTML('beforeend',
      '<div class="state">' + PLAY_ICON + '</div>' +
      '<div class="scrub" aria-hidden="true"><div class="track"><div class="bar"></div></div></div>');
    frame.classList.add('idle');
    var scrub = frame.querySelector('.scrub'), bar = frame.querySelector('.bar');

    frame.addEventListener('click', function (e) {
      if (e.target.closest('.scrub')) return;
      if (video.paused) { c.userPaused = false; play(c, true); }
      else { c.userPaused = true; video.pause(); }
    });
    video.addEventListener('play', function () { frame.classList.remove('paused', 'idle'); });
    video.addEventListener('pause', function () { frame.classList.add('paused'); });
    video.addEventListener('loadedmetadata', function () {
      if (c.seekFrac != null) { video.currentTime = c.seekFrac * video.duration; c.seekFrac = null; c.resumeAt = 0; }
      else if (c.resumeAt) { video.currentTime = c.resumeAt; c.resumeAt = 0; }
    });
    video.addEventListener('timeupdate', function () {
      if (video.duration) bar.style.width = (100 * video.currentTime / video.duration) + '%';
    });

    // Seeking works before the clip has loaded (it seeks once metadata arrives).
    function seek(e) {
      var r = scrub.getBoundingClientRect();
      var f = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
      if (video.duration) video.currentTime = Math.min(f * video.duration, video.duration - 0.05);
      else { c.seekFrac = f; load(c); }
      bar.style.width = (100 * f) + '%';
    }
    scrub.addEventListener('pointerdown', function (e) {
      scrub.setPointerCapture(e.pointerId); frame.classList.add('scrubbing'); seek(e);
    });
    scrub.addEventListener('pointermove', function (e) { if (scrub.hasPointerCapture(e.pointerId)) seek(e); });
    function end(e) {
      if (scrub.hasPointerCapture(e.pointerId)) scrub.releasePointerCapture(e.pointerId);
      frame.classList.remove('scrubbing');
    }
    scrub.addEventListener('pointerup', end);
    scrub.addEventListener('pointercancel', end);

    clips.push(c);
    io.observe(frame);
    frame._clip = c;
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      var c = en.target._clip;
      if (!c) return;
      c.ratio = en.intersectionRatio;
      if (en.intersectionRatio >= 0.45) {
        clearTimeout(c.unloadTimer);
        if (!NO_AUTOPLAY && !c.userPaused) play(c); else load(c);
      } else if (en.intersectionRatio < 0.2) {
        if (!c.video.paused) c.video.pause();
        if (!en.isIntersecting) {
          clearTimeout(c.unloadTimer);
          c.unloadTimer = setTimeout(function () { unload(c); }, UNLOAD_AFTER_MS);
        }
      }
    });
  }, { threshold: [0, 0.2, 0.45, 0.7, 1] });

  document.querySelectorAll('.frame video').forEach(setup);
})();
