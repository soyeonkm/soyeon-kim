// The weather ear: today's forecast for wherever the reader is. Location comes from their IP
// (no permission prompt), the forecast from Open-Meteo. Both are free and keyless. If either
// fails, the box simply stays hidden.
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
  try {
    const where = await (await fetch("https://get.geojs.io/v1/ip/geo.json")).json();
    const fahrenheit = where.country_code === "US";
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${where.latitude}&longitude=${where.longitude}` +
      `&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&forecast_days=1&timezone=auto` +
      (fahrenheit ? "&temperature_unit=fahrenheit" : "");
    const w = await (await fetch(url)).json();
    const deg = n => Math.round(n) + "°";
    box.querySelector(".place").textContent = where.city || where.region || where.country;
    box.querySelector(".sky").textContent = `${words[w.current.weather_code] ?? "—"}, ${deg(w.current.temperature_2m)}`;
    box.querySelector(".temps").textContent = `High ${deg(w.daily.temperature_2m_max[0])} · Low ${deg(w.daily.temperature_2m_min[0])}`;
    box.hidden = false;
  } catch {} // no weather is better than a broken box
})();
