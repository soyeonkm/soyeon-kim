// The music ear: my 30 most-played songs on Spotify (top-tracks.json, written by spotify.mjs),
// one at a time, a new one every few seconds; hovering holds the current song. Each song links
// to it on Spotify. If the list is missing the box is removed.
(async () => {
  const box = document.querySelector(".spotify");
  if (!box) return;
  try {
    const tracks = await (await fetch("top-tracks.json")).json();
    if (!tracks.length) throw new Error("no songs");
    const link = box.querySelector(".track"), art = box.querySelector(".art");
    let i = 0;
    const show = () => {
      const t = tracks[i];
      link.href = t.url;
      art.src = t.art;
      box.querySelector(".rank").textContent = `No. ${i + 1}`;
      box.querySelector(".title").textContent = t.title;
      box.querySelector(".artist").textContent = t.artist;
      new Image().src = tracks[(i + 1) % tracks.length].art; // fetch the next cover ahead of time
    };
    show();
    box.classList.remove("loading");
    fitEars();
    setInterval(() => {
      if (box.matches(":hover")) return;
      link.classList.add("fade");
      setTimeout(() => { i = (i + 1) % tracks.length; show(); link.classList.remove("fade"); }, 400);
    }, 4000);
  } catch {
    box.remove();
  }
})();
