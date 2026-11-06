// The weather ear: today's forecast for wherever the reader is. Their IP gives a rough city at
// once; the browser's own location (GPS/Wi-Fi, after the permission prompt) then names the
// town precisely and the box updates. The forecast comes from Open-Meteo. Everything is free
// and keyless, and if it all fails the box simply stays hidden.
(async () => {
  const box = document.querySelector(".weather");
  if (!box) return;
  const words = {
    0: "Clear", 1: "Mostly clear", 2: "Partly cloudy", 3: "Overcast", 45: "Fog", 48: "Freezing fog",
    51: "Light drizzle", 53: "Drizzle", 55: "Heavy drizzle", 56: "Freezing drizzle", 57: "Freezing drizzle",
    61: "Light rain", 63: "Rain", 65: "Heavy rain", 66: "Freezing rain", 67: "Freezing rain",
    71: "Light snow", 73: "Snow", 75: "Heavy snow", 77: "Snow grains",
    80: "Showers", 81: "Showers", 82: "Heavy showers", 85: "Snow showers", 86: "Snow showers",
    95: "Thunderstorm", 96: "Thunderstorm, hail", 99: "Thunderstorm, hail",
  };
  const json = async url => (await fetch(url)).json();
  const deg = n => Math.round(n) + "°";

  async function show(where) {
    const w = await json(`https://api.open-meteo.com/v1/forecast?latitude=${where.latitude}&longitude=${where.longitude}` +
      `&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&forecast_days=1&timezone=auto` +
      (where.country_code === "US" ? "&temperature_unit=fahrenheit" : ""));
    box.querySelector(".place").textContent = where.city || where.region || where.country;
    box.querySelector(".sky").textContent = `${words[w.current.weather_code] ?? "—"}, ${deg(w.current.temperature_2m)}`;
    box.querySelector(".temps").textContent = `High ${deg(w.daily.temperature_2m_max[0])} · Low ${deg(w.daily.temperature_2m_min[0])}`;
    box.hidden = false;
  }

  // Rough first, precise after: the IP answer is instant, the browser's can take a while
  const rough = json("https://get.geojs.io/v1/ip/geo.json").then(show).catch(() => {});
  try {
    const { coords } = await new Promise((ok, no) =>
      navigator.geolocation.getCurrentPosition(ok, no, { timeout: 30000, maximumAge: 600000 }));
    const p = await json(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${coords.latitude}&longitude=${coords.longitude}&localityLanguage=en`);
    await rough; // don't let the rough answer land after the precise one
    await show({
      latitude: coords.latitude, longitude: coords.longitude,
      city: (p.city || p.locality || "").replace(/^(City|Town|Village|Township) of /, ""),
      region: p.principalSubdivision, country: p.countryName, country_code: p.countryCode,
    });
  } catch {} // declined, blocked, or timed out: the rough answer stays
})();
