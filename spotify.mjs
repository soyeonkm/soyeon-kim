// Logs in to Spotify once and saves the login in .env as SPOTIFY_REFRESH_TOKEN, for the
// now-playing function (api/now-playing.mjs). Run `node spotify.mjs`, open the link it prints.
//
// Needs a Spotify app (developer.spotify.com/dashboard) with redirect URI
// http://127.0.0.1:8888/callback, and its keys in .env as SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET.
import { readFileSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";

process.chdir(new URL(".", import.meta.url).pathname);
const lines = readFileSync(".env", "utf8").split("\n");
const env = Object.fromEntries(lines.filter(l => l.includes("="))
  .map(l => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "")]));
const { SPOTIFY_CLIENT_ID: id, SPOTIFY_CLIENT_SECRET: secret } = env;
if (!id || !secret) throw new Error("Put SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in .env first");
const redirect = "http://127.0.0.1:8888/callback";

// Log in in the browser; Spotify sends the browser back here with a code
const code = await new Promise(done => {
  const server = createServer((req, res) => {
    const url = new URL(req.url, redirect);
    if (url.pathname !== "/callback") return res.end();
    res.end("Logged in. You can close this tab.");
    server.close();
    done(url.searchParams.get("code"));
  }).listen(8888, "127.0.0.1");
  console.log("Open this link and log in to Spotify:\n\nhttps://accounts.spotify.com/authorize?" + new URLSearchParams({
    client_id: id, response_type: "code", redirect_uri: redirect, show_dialog: "true",
    scope: "user-read-currently-playing user-read-recently-played",
  }) + "\n");
});

const r = await fetch("https://accounts.spotify.com/api/token", {
  method: "POST",
  headers: { Authorization: "Basic " + Buffer.from(`${id}:${secret}`).toString("base64"), "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: redirect }),
});
const j = await r.json();
if (!r.ok) throw new Error(`Spotify login failed: ${j.error_description || j.error}`);
writeFileSync(".env", lines.filter(l => !l.startsWith("SPOTIFY_REFRESH_TOKEN=")).join("\n").trimEnd() + `\nSPOTIFY_REFRESH_TOKEN=${j.refresh_token}\n`);
console.log("Saved SPOTIFY_REFRESH_TOKEN in .env");
