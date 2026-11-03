// Turns the site's pages like a newspaper bound along its left edge, scrubbed by scroll.
//
// Each page is grabbed by its bottom-right corner, which lifts first and then sweeps
// left. The fold always lies halfway between where the corner started and where it is
// now. The part of the page past the fold is cut away (clip-path) and drawn again,
// mirrored across the fold, as the page's underside. The corner is held within reach of
// the binding, so the paper never pulls away from the left edge.
//
// Every page is one screen tall. fitPages() scales each page's contents (CSS zoom, so
// text reflows rather than shrinking like an image) just enough to fit the screen.
(() => {
  const book = document.querySelector(".pages");
  const sheets = [...book.querySelectorAll(":scope > .sheet")];

  function fitPages() {
    for (const body of book.querySelectorAll(".page-body")) {
      const fit = body.firstElementChild;
      const fits = z => {
        fit.style.zoom = z;
        return fit.getBoundingClientRect().height <= body.getBoundingClientRect().height + 0.5;
      };
      if (fits(1)) continue;
      let lo = 0.3, hi = 1; // binary search: zoom changes line wrapping, so it isn't proportional
      for (let i = 0; i < 9; i++) {
        const mid = (lo + hi) / 2;
        fits(mid) ? (lo = mid) : (hi = mid);
      }
      fit.style.zoom = lo;
    }
  }

  let fitTimer;
  addEventListener("resize", () => {
    clearTimeout(fitTimer);
    fitTimer = setTimeout(fitPages, 100);
  });
  fitPages();
  document.fonts.ready.then(fitPages); // text sizes change once the fonts arrive

  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  document.documentElement.classList.add("turning");

  const spacer = div("scroll-space"); // gives the fixed pages a scroll range
  document.body.append(spacer);

  const pages = sheets.map((sheet, k) => {
    const slot = div("slot");
    slot.style.zIndex = sheets.length - k; // earlier pages on top
    const shadow = div("turn-shadow"); // cast on the page underneath
    const flap = div("flap"); // the underside of the turning part
    const flapShade = div("flap-shade");
    const wrap = div("flap-wrap");
    const shade = div("fold-shade"); // the page darkening where it bends
    flap.append(flapShade);
    wrap.append(flap);
    sheet.before(slot);
    slot.append(shadow, sheet, wrap);
    sheet.append(shade);
    return { sheet, slot, shadow, flap, flapShade, shade };
  });

  let w, vh, hold, turn, small;

  function layout() {
    w = book.clientWidth;
    vh = innerHeight;
    small = w < 720;
    hold = vh * 0.5; // scroll that does nothing, so each page stays put a while
    turn = vh * 1.3; // scroll needed to turn one page
    pages.forEach((pg, k) => {
      pg.h = pg.sheet.offsetHeight;
      pg.start = k * (hold + turn);
      for (const el of [pg.slot, pg.shadow, pg.flap]) Object.assign(el.style, { width: w + "px", height: pg.h + "px" });
    });
    spacer.style.height = (pages.length - 1) * (hold + turn) + vh + "px";
    update();
  }

  function update() {
    pages.forEach((pg, k) => {
      const t = k < pages.length - 1 ? clamp((scrollY - pg.start - hold) / turn) : 0;
      pg.slot.style.visibility = t >= 1 ? "hidden" : "";
      bend(pg, t);
    });
  }

  function bend(pg, t) {
    const W = w, H = pg.h;
    // The hand lifts the corner first, then sweeps it across to the left.
    const lift = Math.min(vh, W) * (small ? 0.22 : 0.32);
    let px = W - 2 * W * Math.pow(smooth(t), 1.15);
    let py = H - lift * Math.sin(Math.PI * Math.min(1, t * 1.1));
    // Bound at the left edge: the corner can't get further from the binding than the paper reaches.
    [px, py] = within(px, py, 0, H, W);
    [px, py] = within(px, py, 0, 0, Math.hypot(W, H));

    let nx = W - px, ny = H - py;
    const len = Math.hypot(nx, ny);
    if (t <= 0 || len < 1) return flat(pg);
    nx /= len;
    ny /= len;
    const mx = (W + px) / 2, my = (H + py) / 2; // a point on the fold
    const rect = [[0, 0], [W, 0], [W, H], [0, H]];
    const lifted = polygon(clip(rect, nx, ny, mx, my, 1));

    pg.sheet.style.clipPath = polygon(clip(rect, nx, ny, mx, my, -1));
    pg.flap.style.clipPath = lifted;
    pg.shadow.style.clipPath = lifted;
    // Reflection across the fold line: x' = x - 2((x - m)·n)n
    const d = mx * nx + my * ny;
    pg.flap.style.transform = `matrix(${1 - 2 * nx * nx}, ${-2 * nx * ny}, ${-2 * nx * ny}, ${1 - 2 * ny * ny}, ${2 * d * nx}, ${2 * d * ny})`;
    pg.flap.style.visibility = "visible";

    const s = Math.min(1, len / 120); // shading builds as the corner leaves the page
    pg.shade.style.background = band(W, H, -nx, -ny, mx, my, [[0, `rgb(0 0 0 / ${0.14 * s})`], [50, "rgb(0 0 0 / 0)"]]);
    pg.shadow.style.background = band(W, H, nx, ny, mx, my, [[0, `rgb(0 0 0 / ${0.38 * s})`], [Math.min(140, len / 2), "rgb(0 0 0 / 0)"]]);
    pg.flapShade.style.background = band(W, H, nx, ny, mx, my, [
      [0, "rgb(0 0 0 / 0.08)"], [6, "rgb(255 255 255 / 0.5)"], [40, "rgb(255 255 255 / 0)"], [len / 2, "rgb(0 0 0 / 0.1)"],
    ]);
  }

  function flat(pg) {
    pg.sheet.style.clipPath = "";
    pg.flap.style.visibility = "hidden";
    pg.shadow.style.background = pg.shade.style.background = "none";
  }

  // The part of polygon `pts` on one side (1 = the corner's side) of the line through m with normal n.
  function clip(pts, nx, ny, mx, my, side) {
    const out = [], f = ([x, y]) => side * ((x - mx) * nx + (y - my) * ny);
    pts.forEach((a, i) => {
      const b = pts[(i + 1) % pts.length], fa = f(a), fb = f(b);
      if (fa >= 0) out.push(a);
      if (fa * fb < 0) {
        const r = fa / (fa - fb);
        out.push([a[0] + (b[0] - a[0]) * r, a[1] + (b[1] - a[1]) * r]);
      }
    });
    return out;
  }

  function polygon(pts) {
    return pts.length < 3 ? "polygon(0 0, 0 0, 0 0)" : `polygon(${pts.map(([x, y]) => `${x}px ${y}px`).join(", ")})`;
  }

  // A linear gradient on a W×H box running along direction g, with stop offsets measured
  // from the fold point m.
  function band(W, H, gx, gy, mx, my, stops) {
    const length = Math.abs(W * gx) + Math.abs(H * gy); // CSS gradient line length
    const at = (mx - W / 2) * gx + (my - H / 2) * gy + length / 2;
    return `linear-gradient(${Math.atan2(gx, -gy)}rad, ${stops.map(([o, c]) => `${c} ${at + o}px`).join(", ")})`;
  }

  function within(x, y, cx, cy, r) {
    const dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy);
    return d <= r ? [x, y] : [cx + (dx * r) / d, cy + (dy * r) / d];
  }

  function clamp(v) { return Math.min(1, Math.max(0, v)); }
  function smooth(t) { return t * t * (3 - 2 * t); }
  function div(cls) { const el = document.createElement("div"); el.className = cls; return el; }

  // In-page links go to where that page lies open.
  addEventListener("click", e => {
    const a = e.target.closest('a[href^="#"]');
    const pg = a && pages.find(p => "#" + p.sheet.id === a.getAttribute("href"));
    if (!pg) return;
    e.preventDefault();
    scrollTo({ top: pg.start, behavior: "smooth" });
  });

  let frame, resizeTimer;
  addEventListener("scroll", () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(update);
  }, { passive: true });
  addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(layout, 150);
  });
  layout();
})();
