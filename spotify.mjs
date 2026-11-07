// Writes top-tracks.json: my 30 most-played songs on Spotify over the last ~6 months, for the
// music box in the header. Run it with `node spotify.mjs` whenever the list should refresh.
//
// Needs a Spotify app (developer.spotify.com/dashboard) with redirect URI
// http://127.0.0.1:8888/callback, and its keys in .env as SPOTIFY_CLIENT_ID and
// SPOTIFY_CLIENT_SECRET. The first run prints a link to log in with; after that the login is
// remembered in .env as SPOTIFY_REFRESH_TOKEN and later runs need no browser.
import { readFileSync, writeFileSync, appendFileSync } from "node:fs";
import { createServer } from "node:http";

process.chdir(new URL(".", import.meta.url).pathname);
const env = Object.fromEntries(readFileSync(".env", "utf8").split("\n").filter(l => l.includes("="))
  .map(l => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "")]));
const { SPOTIFY_CLIENT_ID: id, SPOTIFY_CLIENT_SECRET: secret } = env;
if (!id || !secret) throw new Error("Put SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in .env first");
const redirect = "http://127.0.0.1:8888/callback";

async function token(params) {
  const r = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { Authorization: "Basic " + Buffer.from(`${id}:${secret}`).toString("base64"), "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(`Spotify login failed: ${j.error_description || j.error}`);
  return j;
}

let access;
if (env.SPOTIFY_REFRESH_TOKEN) {
  access = (await token({ grant_type: "refresh_token", refresh_token: env.SPOTIFY_REFRESH_TOKEN })).access_token;
} else {
  // First run: log in once in the browser; Spotify sends the browser back here with a code
  const code = await new Promise(done => {
    const server = createServer((req, res) => {
      const url = new URL(req.url, redirect);
      if (url.pathname !== "/callback") return res.end();
      res.end("Logged in. You can close this tab.");
      server.close();
      done(url.searchParams.get("code"));
    }).listen(8888, "127.0.0.1");
    console.log("Open this link and log in to Spotify:\n\nhttps://accounts.spotify.com/authorize?" +
      new URLSearchParams({ client_id: id, response_type: "code", redirect_uri: redirect, scope: "user-top-read" }) + "\n");
  });
  const t = await token({ grant_type: "authorization_code", code, redirect_uri: redirect });
  access = t.access_token;
  appendFileSync(".env", `\nSPOTIFY_REFRESH_TOKEN=${t.refresh_token}\n`);
}

const skip = /^(童話|Tong ?hua)$/i; // songs never to show, by title
const r = await fetch("https://api.spotify.com/v1/me/top/tracks?limit=50&time_range=medium_term", { headers: { Authorization: `Bearer ${access}` } });
const j = await r.json();
if (!r.ok) throw new Error(`Spotify: ${j.error?.message ?? r.status}`);
const tracks = j.items.filter(t => !skip.test(t.name)).slice(0, 30).map(t => ({
  title: t.name,
  artist: t.artists.map(a => a.name).join(", "),
  art: (t.album.images[1] ?? t.album.images[0])?.url, // the 300px cover
  url: t.external_urls.spotify,
}));
writeFileSync("top-tracks.json", JSON.stringify(tracks, null, 1) + "\n");
console.log(`top-tracks.json written: ${tracks.length} songs, No. 1 is ${tracks[0]?.title} by ${tracks[0]?.artist}`);
