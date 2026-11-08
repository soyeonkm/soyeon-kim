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
  fitPages();
  document.fonts.ready.then(fitPages); // text sizes change once the fonts arrive

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
    });
  }
  viewer.addEventListener("click", e => { if (e.target === viewer) viewer.close(); }); // click outside to close; the video's own controls still work
  viewer.addEventListener("close", () => viewer.replaceChildren()); // stops a playing video
})();
