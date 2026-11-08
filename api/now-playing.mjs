// Vercel function (served at /api/now-playing): the song I'm playing on Spotify right now, or the last one I played.
// It holds the Spotify keys (Vercel env vars SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET and
// SPOTIFY_REFRESH_TOKEN, the last from `node spotify.mjs`) so the page never sees them.
// Spotify limits how often it can be asked, so: answers are shared at Vercel's edge for 30 seconds;
// the song last seen playing is remembered as the "last played" one, so Spotify's recently-played
// list is only read when nothing has been seen yet (a fresh start); and if Spotify says "too many
// requests" the function stops asking that question for as long as it says to, and keeps serving the
// last song it knew.
const skip = /^(童話|Tong ?hua)$/i; // songs never to show, by title
let access, expires = 0;
let lastGood = null; // the last answer that worked, served while Spotify is unavailable
let lastPlayed = null; // the song to show when nothing is playing
const waitUntil = {}; // per question: don't ask Spotify again before this (from its Retry-After)

async function token() {
  if (Date.now() < expires) return access;
  const { SPOTIFY_CLIENT_ID: id, SPOTIFY_CLIENT_SECRET: secret, SPOTIFY_REFRESH_TOKEN: refresh } = process.env;
  const r = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { Authorization: "Basic " + Buffer.from(`${id}:${secret}`).toString("base64"), "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: refresh }),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(`Spotify login: ${j.error_description || j.error}`);
  access = j.access_token;
  expires = Date.now() + (j.expires_in - 60) * 1000;
  return access;
}

async function spotify(path) {
  if (Date.now() < (waitUntil[path] ?? 0)) throw new Error(`Spotify ${path}: waiting`);
  const r = await fetch(`https://api.spotify.com/v1/me/${path}`, { headers: { Authorization: `Bearer ${await token()}` } });
  if (r.status === 429) waitUntil[path] = Date.now() + (Number(r.headers.get("retry-after")) || 60) * 1000;
  if (r.status === 204) return null; // nothing playing
  if (!r.ok) throw new Error(`Spotify ${path}: ${r.status}`);
  return r.json();
}

const song = (t, playing) => ({
  playing,
  title: t.name,
  artist: t.artists.map(a => a.name).join(", "),
  art: (t.album.images[1] ?? t.album.images[0])?.url, // the 300px cover
  url: t.external_urls.spotify,
});

async function current() {
  const now = await spotify("player/currently-playing");
  const track = now?.item?.type === "track" && !skip.test(now.item.name) ? now.item : null;
  if (track) {
    lastPlayed = song(track, false); // playing or paused, it's the last played once it stops
    if (now.is_playing) return song(track, true);
    return lastPlayed;
  }
  if (!lastPlayed) { // a fresh start with nothing playing: ask Spotify once what was played last
    const recent = await spotify("player/recently-played?limit=20");
    const last = recent?.items.map(i => i.track).find(t => !skip.test(t.name));
    lastPlayed = last ? song(last, false) : null;
  }
  return lastPlayed;
}

export async function GET() {
  const headers = { "Access-Control-Allow-Origin": "*", "Cache-Control": "no-store", "Vercel-CDN-Cache-Control": "max-age=30, stale-while-revalidate=60" };
  try {
    lastGood = await current() ?? lastGood;
    return Response.json(lastGood, { headers });
  } catch (e) {
    if (lastGood) return Response.json(lastGood, { headers }); // keep showing the last song rather than nothing
    return Response.json({ error: e.message }, { status: 502, headers: { ...headers, "Vercel-CDN-Cache-Control": "max-age=5" } });
  }
}
