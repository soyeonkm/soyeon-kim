// Vercel function (served at /api/now-playing): the song I'm playing on Spotify right now, or the last one I played.
// It holds the Spotify keys (Vercel env vars SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET and
// SPOTIFY_REFRESH_TOKEN, the last from `node spotify.mjs`) so the page never sees them.
// Answers are shared at Vercel's edge for 3 seconds, so visitors don't each call Spotify, and
// browsers never keep them.
const skip = /^(童話|Tong ?hua)$/i; // songs never to show, by title
let access, expires = 0;

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
  const r = await fetch(`https://api.spotify.com/v1/me/${path}`, { headers: { Authorization: `Bearer ${await token()}` } });
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

export async function GET() {
  const headers = { "Access-Control-Allow-Origin": "*", "Cache-Control": "no-store", "Vercel-CDN-Cache-Control": "max-age=3" };
  try {
    const now = await spotify("player/currently-playing");
    if (now?.is_playing && now.item?.type === "track" && !skip.test(now.item.name)) return Response.json(song(now.item, true), { headers });
    const recent = await spotify("player/recently-played?limit=20");
    const last = recent?.items.map(i => i.track).find(t => !skip.test(t.name));
    return Response.json(last ? song(last, false) : null, { headers });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 502, headers });
  }
}
