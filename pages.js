// The front page is exactly one screen tall. fitPages() scales its contents (CSS zoom, so
// text reflows rather than shrinking like an image) just enough to fit. The other pages
// are as tall as their content.
(() => {
  const setZoom = (body, z) => { body.firstElementChild.style.zoom = z; };

  function bestZoom(body) {
    const fit = body.firstElementChild;
    const fits = z => {
      setZoom(body, z);
      return fit.getBoundingClientRect().bottom <= body.getBoundingClientRect().bottom + 0.5; // bottoms, not heights: a heading's top margin pushes the content down
    };
    if (fits(1)) return 1;
    let lo = 0.3, hi = 1; // binary search: zoom changes line wrapping, so it isn't proportional
    for (let i = 0; i < 9; i++) {
      const mid = (lo + hi) / 2;
      fits(mid) ? (lo = mid) : (hi = mid);
    }
    return lo;
  }

  function fitPages() {
    // The sticky nav's height sets how tall a page can be; the front page also loses the nameplate above it
    document.documentElement.style.setProperty("--bar", document.querySelector(".menu").offsetHeight + "px");
    document.documentElement.style.setProperty("--head", document.querySelector(".bar").offsetHeight + "px");
    // Only the front page is held to one screen; the other pages are as tall as their content
    for (const own of document.querySelectorAll(".page-body.own-scale")) setZoom(own, bestZoom(own));
  }

  // The nav carries a paper cap only once it's stuck, so at rest nothing covers the tagline above it
  const menu = document.querySelector(".menu");
  const stick = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--stick"));
  addEventListener("scroll", () => menu.classList.toggle("stuck", menu.getBoundingClientRect().top <= stick * 16 + 1), { passive: true });

  // The ears hide themselves if they would touch the nameplate or tagline text (the words, not the full-width block)
  const masthead = [...document.querySelectorAll(".nameplate, .tagline")];
  const textBox = el => { const r = document.createRange(); r.selectNodeContents(el); return r.getBoundingClientRect(); };
  window.fitEars = () => {
    const weather = document.querySelector(".weather"), music = document.querySelector(".spotify");
    if (weather && music && !weather.classList.contains("loading")) { music.style.height = weather.offsetHeight + "px"; music.style.width = weather.offsetWidth + "px"; } // the two ears match
    const texts = masthead.map(textBox);
    for (const ear of document.querySelectorAll(".ear")) {
      const b = ear.getBoundingClientRect();
      ear.classList.toggle("cramped", texts.some(t => b.right + 16 > t.left && b.left - 16 < t.right));
    }
  };
  fitEars();
  addEventListener("resize", fitEars);

  let fitTimer;
  addEventListener("resize", () => {
    clearTimeout(fitTimer);
    fitTimer = setTimeout(fitPages, 100);
  });
  // Scrolling with some weight: Lenis eases the wheel and trackpad so the page drifts to a stop instead
  // of snapping (touch screens keep their own native scrolling). Skipped for readers who ask for less motion.
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const lenis = !calm && window.Lenis ? new Lenis({ lerp: 0.12, wheelMultiplier: 0.9 }) : null;
  if (lenis) requestAnimationFrame(function raf(t) { lenis.raf(t); requestAnimationFrame(raf); });
  // Glide to a spot (a y position or an element), leaving room for the frozen nav above a section
  const navRoom = () => menu.offsetHeight + stick * 16;
  function glide(to) {
    if (lenis) return lenis.scrollTo(to, { offset: typeof to === "number" ? 0 : -navRoom() });
    typeof to === "number" ? scrollTo({ top: to, behavior: calm ? "auto" : "smooth" }) : to.scrollIntoView({ behavior: calm ? "auto" : "smooth" });
  }
  for (const a of document.querySelectorAll('.menu a[href^="#"]')) a.addEventListener("click", e => {
    const el = document.querySelector(a.hash);
    if (!el || !lenis) return; // without Lenis the browser's own smooth anchor scroll does it
    e.preventDefault();
    history.replaceState(null, "", a.hash);
    glide(el);
  });

  // The nameplate glides back to the top of the page (and clears any #section from the address) rather than reloading
  document.querySelector(".nameplate").addEventListener("click", e => {
    e.preventDefault();
    history.replaceState(null, "", location.pathname);
    glide(0);
  });

  // Opened (or reloaded) at a section's link: start at the top and glide down once the layout has
  // settled, rather than jumping there, or landing in the wrong place as fonts and photos arrive
  const target = location.hash && document.querySelector(location.hash);
  if (target) { history.scrollRestoration = "manual"; scrollTo(0, 0); }
  fitPages();
  document.fonts.ready.then(() => {
    fitPages(); // text sizes change once the fonts arrive
    if (target) setTimeout(() => glide(target), 150);
  });

  // Creative work: repeat the photos once so the drifting strip below loops without a seam
  const track = document.querySelector(".clip-track");
  if (track) for (const clip of [...track.children]) {
    const copy = clip.cloneNode(true);
    copy.setAttribute("aria-hidden", "true"); // screen readers hear each photo once
    track.append(copy);
  }
  // The strip drifts on its own and can also be scrolled (trackpad, shift + wheel, touch) or dragged with the
  // mouse. Either way it wraps round by one set of photos, so it never runs out. Hovering eases it down to a
  // quarter speed and leaving eases it back; readers who ask for less motion get no drifting at all.
  const strip = track?.parentElement;
  if (strip) {
    const set = () => track.scrollWidth / 2; // one set of photos
    const speed = calm ? 0 : () => set() / 70; // px per second: once round every 70 seconds
    let pos = 0, written = 0, rate = 1, goal = 1, last = performance.now();
    const wrap = () => { const w = set(); if (w) { pos %= w; if (pos < 0) pos += w; } };
    requestAnimationFrame(function tick(now) {
      const dt = Math.min(now - last, 100) / 1000; last = now;
      if (Math.abs(strip.scrollLeft - written) > 1) pos = strip.scrollLeft; // the reader scrolled it
      rate += (goal - rate) * 0.08;
      if (speed && !strip.classList.contains("dragging")) pos += speed() * rate * dt;
      wrap();
      strip.scrollLeft = pos; written = strip.scrollLeft;
      requestAnimationFrame(tick);
    });
    strip.addEventListener("mouseenter", () => goal = 0.25);
    strip.addEventListener("mouseleave", () => goal = 1);
    // Mouse drag: move the strip with the pointer; a real drag doesn't count as a click on a photo
    let startX, startPos, moved = 0;
    strip.addEventListener("pointerdown", e => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      startX = e.clientX; startPos = pos; moved = 0;
      strip.classList.add("dragging");
      strip.setPointerCapture(e.pointerId);
    });
    strip.addEventListener("pointermove", e => {
      if (!strip.classList.contains("dragging")) return;
      moved = Math.max(moved, Math.abs(e.clientX - startX));
      pos = startPos - (e.clientX - startX);
    });
    const drop = () => strip.classList.remove("dragging");
    strip.addEventListener("pointerup", drop);
    strip.addEventListener("pointercancel", drop);
    strip.addEventListener("click", e => { if (moved > 5) { e.stopPropagation(); e.preventDefault(); } }, true);
  }

  // Experience media: every entry has a photo; some also have a video, which covers the
  // photo and plays only while hovered. A click opens the video (or the photo) larger.
  const viewer = document.querySelector(".viewer");
  for (const media of document.querySelectorAll(".media")) {
    const video = media.querySelector("video");
    if (video) {
      media.addEventListener("mouseenter", () => { media.classList.add("playing"); video.play().catch(() => {}); });
      media.addEventListener("mouseleave", () => { media.classList.remove("playing"); video.pause(); });
    }
    media.addEventListener("click", () => {
      const shown = video || media.querySelector("img");
      if (!shown) return; // still a placeholder
      const big = shown.cloneNode();
      if (big.tagName === "VIDEO") Object.assign(big, { controls: true, autoplay: true, muted: false });
      viewer.replaceChildren(big);
      viewer.showModal();
      lenis?.stop(); // the page stays put behind the enlarged photo
    });
  }
  viewer.addEventListener("click", e => { if (e.target === viewer) viewer.close(); }); // click outside to close; the video's own controls still work
  viewer.addEventListener("close", () => { viewer.replaceChildren(); lenis?.start(); }); // stops a playing video
})();
