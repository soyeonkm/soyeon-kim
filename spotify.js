// The music ear: the song I'm playing on Spotify right now, or the last one I played. It comes
// from the site's now-playing function (api/now-playing.mjs, run by Vercel), which keeps the
// Spotify keys, and is checked again every 20 seconds while the tab is in view. The song links
// to Spotify. If the function can't be reached the box is removed.
const NOW_PLAYING = /^(localhost|127\.0\.0\.1)$/.test(location.hostname)
  ? "https://www.soyeonkm.com/api/now-playing" // a local preview has no function of its own; use the live one
  : "/api/now-playing";

(async () => {
  const box = document.querySelector(".spotify");
  if (!box) return;
  const link = box.querySelector(".track");
  let shown;

  async function update() {
    if (document.hidden) return;
    const s = await (await fetch(NOW_PLAYING)).json();
    if (!s?.title) throw new Error("nothing played");
    if (s.url + s.playing === shown) return;
    const first = !shown;
    shown = s.url + s.playing;
    if (!first) { link.classList.add("fade"); await new Promise(done => setTimeout(done, 400)); }
    box.querySelector(".label").textContent = s.playing ? "Now Playing on Spotify" : "Last Played on Spotify";
    link.href = s.url;
    box.querySelector(".art").src = s.art;
    box.querySelector(".title").textContent = s.title;
    box.querySelector(".artist").textContent = s.artist;
    link.classList.remove("fade");
    if (first) { box.classList.remove("loading"); fitEars(); }
  }

  try { await update(); } catch { box.remove(); return; }
  setInterval(() => update().catch(() => {}), 20000);
  document.addEventListener("visibilitychange", () => update().catch(() => {}));
})();
