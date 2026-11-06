// Every page is one screen tall. fitPages() scales the pages' contents (CSS zoom, so
// text reflows rather than shrinking like an image) just enough that the fullest page
// fits, and uses that same scale on every page so they all match.
(() => {
  function bestZoom(body) {
    const fit = body.firstElementChild;
    const fits = z => {
      fit.style.zoom = z;
      return fit.getBoundingClientRect().height <= body.getBoundingClientRect().height + 0.5;
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
    const bodies = [...document.querySelectorAll(".page-body")];
    const zoom = Math.min(...bodies.map(bestZoom));
    for (const body of bodies) body.firstElementChild.style.zoom = zoom;
  }

  // Each roll of film advances slowly on its own and loops: the frames are copied so there's
  // always more film coming. Like real film: it eases to a stop under your hand (hover or tab
  // into it) and starts up again gently; drag it with the mouse, or swipe it on a phone.
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  for (const roll of document.querySelectorAll(".roll")) {
    const frames = [...roll.children];
    frames.forEach((frame, i) => (frame.dataset.shade = i % 6)); // set before copying, so copies match and the loop is seamless
    const addCopy = () => {
      for (const frame of frames) {
        const copy = frame.cloneNode(true);
        copy.setAttribute("aria-hidden", "true");
        copy.inert = true;
        roll.append(copy);
      }
    };
    addCopy();
    // Short rolls need several copies so there's still film on screen at the loop point
    const loopWidth = () => roll.children[frames.length].offsetLeft - frames[0].offsetLeft;
    while (roll.scrollWidth < loopWidth() + screen.width * 1.5) addCopy();
    const wrap = p => { const loop = loopWidth(); return ((p % loop) + loop) % loop; };

    let pos = 0, drag = null;
    roll.addEventListener("pointerdown", e => {
      if (e.pointerType !== "mouse" || e.button !== 0) return; // touch scrolls natively
      drag = { x: e.clientX, from: roll.scrollLeft, moved: false };
      roll.setPointerCapture(e.pointerId);
    });
    roll.addEventListener("pointermove", e => {
      if (!drag) return;
      const dx = e.clientX - drag.x;
      if (!drag.moved && Math.abs(dx) > 4) { drag.moved = true; roll.classList.add("dragging"); }
      if (drag.moved) roll.scrollLeft = pos = wrap(drag.from - dx);
    });
    roll.addEventListener("pointerup", () => { roll.classList.remove("dragging"); setTimeout(() => (drag = null)); });
    roll.addEventListener("click", e => { if (drag?.moved) e.preventDefault(); }, true); // a drag isn't a click
    roll.addEventListener("dragstart", e => e.preventDefault());
    if (still) continue;

    let last = 0, speed = 0, hovering = false, focused = false, swipedUntil = 0;
    roll.addEventListener("pointerenter", () => (hovering = true));
    roll.addEventListener("pointerleave", () => (hovering = false));
    roll.addEventListener("focusin", () => (focused = true));
    roll.addEventListener("focusout", () => (focused = false));
    for (const type of ["wheel", "touchmove"]) roll.addEventListener(type, () => (swipedUntil = performance.now() + 1500), { passive: true });
    const step = now => {
      const dt = Math.min(now - last, 50);
      last = now;
      if (drag || now < swipedUntil) speed = 0; // a hand is moving it: stop at once, don't fight
      else speed += ((hovering || focused ? 0 : 0.03) - speed) * Math.min(1, dt / 300); // ease toward 30px/s or a stop
      if (speed < 0.0005) pos = roll.scrollLeft; // stopped: pick up wherever the hand left it
      else roll.scrollLeft = pos = wrap(pos + speed * dt);
      requestAnimationFrame(step);
    };
    requestAnimationFrame(now => { last = now; step(now); });
  }

  let fitTimer;
  addEventListener("resize", () => {
    clearTimeout(fitTimer);
    fitTimer = setTimeout(fitPages, 100);
  });
  fitPages();
  document.fonts.ready.then(fitPages); // text sizes change once the fonts arrive
})();
