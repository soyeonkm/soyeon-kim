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
    // The sticky nav's height sets how tall a page can be; the front page also loses the nameplate above it
    document.documentElement.style.setProperty("--bar", document.querySelector(".menu").offsetHeight + "px");
    document.documentElement.style.setProperty("--head", document.querySelector(".bar").offsetHeight + "px");
    const bodies = [...document.querySelectorAll(".page-body")];
    const zoom = Math.min(...bodies.map(bestZoom));
    for (const body of bodies) body.firstElementChild.style.zoom = zoom;
  }

  // The nav carries a paper cap only once it's stuck, so at rest nothing covers the tagline above it
  const menu = document.querySelector(".menu");
  const edge = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--edge"));
  addEventListener("scroll", () => menu.classList.toggle("stuck", menu.getBoundingClientRect().top <= edge * 16 + 1), { passive: true });

  // The ears hide themselves if they would touch the nameplate or tagline text (the words, not the full-width block)
  const masthead = [...document.querySelectorAll(".nameplate, .tagline")];
  const textBox = el => { const r = document.createRange(); r.selectNodeContents(el); return r.getBoundingClientRect(); };
  window.fitEars = () => {
    const weather = document.querySelector(".weather"), music = document.querySelector(".spotify");
    if (weather && music) { music.style.height = weather.offsetHeight + "px"; music.style.width = weather.offsetWidth + "px"; } // the two ears match
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
  fitPages();
  document.fonts.ready.then(fitPages); // text sizes change once the fonts arrive
})();
