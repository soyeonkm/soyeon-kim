// The briefing ear: one New York Times technology story, headline and a one-sentence blurb,
// linking to the story on nytimes.com.
//
// In order of preference:
//   1. the most-read Technology story of the past day (NYT Most Popular API; it only lists the
//      site-wide top 20, so tech is often absent),
//   2. the lead story of the Technology section as its editors rank it (NYT Top Stories API),
//   3. the newest story in the public Technology RSS feed (no key needed).
// The key comes from config.js (generated from .env by make-config.sh; neither is in git) and
// ends up in the served page either way, as any key on a static site does; it's a free,
// read-only key rate-limited to 500 calls a day and 5 a minute, so the chosen story is kept in
// localStorage for an hour and reloads don't call NYT again. Every source allows browser
// requests, and if they all fail the box is removed.
const NYT_KEY = window.NYT_KEY ?? "";

(async () => {
  const box = document.querySelector(".briefing");
  if (!box) return;
  const skip = url => /\/(opinion|newsletters)\//.test(url); // opinion pieces and newsletters live under those paths

  const api = async path => NYT_KEY ? (await (await fetch(`https://api.nytimes.com/svc/${path}?api-key=${NYT_KEY}`)).json()).results : [];
  const pick = (results, ok) => { const hit = results.find(r => r.title && ok(r) && !skip(r.url)); return hit && { url: hit.url, title: hit.title, blurb: hit.abstract }; };

  const mostRead = async () => pick(await api("mostpopular/v2/viewed/1.json"), r => r.section === "Technology");
  const leadStory = async () => pick(await api("topstories/v2/technology.json"), r => r.item_type === "Article");

  async function latest() {
    const xml = await (await fetch("https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml")).text();
    const items = [...new DOMParser().parseFromString(xml, "text/xml").querySelectorAll("item")];
    const text = (item, tag) => item.querySelector(tag)?.textContent.trim() ?? "";
    const item = items.find(i => !skip(text(i, "link")));
    return item && { url: text(item, "link"), title: text(item, "title"), blurb: text(item, "description") };
  }

  const cached = () => { try { const c = JSON.parse(localStorage.briefing); if (Date.now() - c.at < 3600000) return c.story; } catch {} };
  const remember = story => { try { localStorage.briefing = JSON.stringify({ at: Date.now(), story }); } catch {} };

  try {
    let story = cached();
    if (!story) {
      story = (await mostRead().catch(() => null)) || (await leadStory().catch(() => null)) || (await latest());
      if (story?.title) remember(story);
    }
    if (!story?.title) throw new Error("no story");
    const sentences = story.blurb.split(/(?<=[.!?])\s+/);
    box.querySelector(".story").href = story.url;
    box.querySelector(".headline").textContent = story.title;
    box.querySelector(".summary").textContent = sentences[0].length >= 60 ? sentences[0] : sentences.slice(0, 2).join(" "); // one sentence, unless it's a stub
    box.classList.remove("loading");
    fitEars();
  } catch {
    box.remove();
  }
})();
