(function(){
  "use strict";

  const API_BASE = "https://api.open-meteo.com/v1/forecast";

  const levelLocations = [
    {
      number: 1,
      region: "Athens",
      title: "Level 1 — Athens Hive",
      subtitle: "Apis mellifera Meadow",
      bee: "Apis mellifera",
      lat: 37.9838,
      lon: 23.7275,
      mapLat: 20.7422,
      mapLon: 12.9375,
      url: "levels/level1.html"
    },
    {
      number: 2,
      region: "Himalaya",
      title: "Level 2 — Himalaya Forest",
      subtitle: "Meliponini Forest",
      bee: "Meliponini",
      lat: 27.9881,
      lon: 86.9250,
      mapLat: 16.8750,
      mapLon: 74.5312,
      url: "levels/level2.html"
    },
    {
      number: 3,
      region: "Tanzania",
      title: "Level 3 — Tanzania Carpenter Woods",
      subtitle: "Xylocopa Carpenter Woods",
      bee: "Xylocopa violacea",
      lat: -6.1630,
      lon: 35.7516,
      mapLat: -1.2656,
      mapLon: 26.4375,
      url: "levels/level3.html"
    },
    {
      number: 4,
      region: "Uganda",
      title: "Level 4 — Uganda Aloe Sanctuary",
      subtitle: "Aloe Carpenter Sanctuary",
      bee: "Aloe carpenter bee",
      lat: 0.3476,
      lon: 32.5825,
      mapLat: 5.9766,
      mapLon: 23.2031,
      url: "levels/level4.html"
    },
    {
      number: 5,
      region: "New Zealand",
      title: "Level 5 — New Zealand Native Grove",
      subtitle: "Leioproctus Native Grove",
      bee: "Leioproctus",
      lat: -41.2865,
      lon: 174.7762,
      mapLat: -24.6094,
      mapLon: 178.5938,
      url: "levels/level5.html"
    }
  ];

  const codeDescriptions = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    56: "Light freezing drizzle",
    57: "Dense freezing drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    66: "Light freezing rain",
    67: "Heavy freezing rain",
    71: "Slight snow",
    73: "Moderate snow",
    75: "Heavy snow",
    77: "Snow grains",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    85: "Slight snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm with hail",
    99: "Thunderstorm with heavy hail"
  };

  function getLocationByLevel(levelNumber){
    return levelLocations.find(location => Number(location.number) === Number(levelNumber));
  }

  function buildUrl(location){
    const params = new URLSearchParams({
      latitude: String(location.lat),
      longitude: String(location.lon),
      current: "temperature_2m,relative_humidity_2m,precipitation,rain,showers,snowfall,weather_code,wind_speed_10m",
      timezone: "auto"
    });

    return `${API_BASE}?${params.toString()}`;
  }

  function weatherCodeToCondition(code, current){
    const numericCode = Number(code);
    const precipitation = Number(current && current.precipitation) || 0;
    const rain = Number(current && current.rain) || 0;
    const showers = Number(current && current.showers) || 0;
    const snowfall = Number(current && current.snowfall) || 0;

    if(snowfall > 0 || [71, 73, 75, 77, 85, 86].includes(numericCode)){
      return "snow";
    }

    if([95, 96, 99].includes(numericCode)){
      return "thunder";
    }

    if(rain > 0 || showers > 0 || precipitation > 0 || [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(numericCode)){
      return "rain";
    }

    if([45, 48].includes(numericCode)){
      return "fog";
    }

    if([2, 3].includes(numericCode)){
      return "cloudy";
    }

    return "clear";
  }

  function conditionLabel(condition){
    const labels = {
      clear: "Clear",
      cloudy: "Cloudy",
      fog: "Fog",
      rain: "Rain",
      snow: "Snow",
      thunder: "Thunderstorm"
    };
    return labels[condition] || "Weather";
  }

  async function getCurrentWeather(location){
    if(!location){
      throw new Error("Missing weather location");
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 9000);

    try{
      const response = await fetch(buildUrl(location), {
        signal: controller.signal,
        cache: "no-store"
      });

      if(!response.ok){
        throw new Error(`Weather API error: ${response.status}`);
      }

      const data = await response.json();
      const current = data.current || {};
      const condition = weatherCodeToCondition(current.weather_code, current);

      return {
        location,
        raw: data,
        condition,
        conditionLabel: conditionLabel(condition),
        description: codeDescriptions[Number(current.weather_code)] || conditionLabel(condition),
        weatherCode: Number(current.weather_code),
        temperature: current.temperature_2m,
        humidity: current.relative_humidity_2m,
        precipitation: current.precipitation,
        rain: current.rain,
        showers: current.showers,
        snowfall: current.snowfall,
        windSpeed: current.wind_speed_10m,
        time: current.time
      };
    }
    finally{
      clearTimeout(timeout);
    }
  }

  async function getCurrentWeatherByLevel(levelNumber){
    return getCurrentWeather(getLocationByLevel(levelNumber));
  }

  function formatTemperature(value){
    const numeric = Number(value);
    if(!Number.isFinite(numeric)) return "—";
    return `${Math.round(numeric)}°C`;
  }

  function formatWind(value){
    const numeric = Number(value);
    if(!Number.isFinite(numeric)) return "—";
    return `${Math.round(numeric)} km/h`;
  }

  window.BeeWeather = {
    apiBase: API_BASE,
    levelLocations,
    getLocationByLevel,
    buildUrl,
    getCurrentWeather,
    getCurrentWeatherByLevel,
    weatherCodeToCondition,
    conditionLabel,
    formatTemperature,
    formatWind
  };
})();
