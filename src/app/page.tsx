"use client";

import { useEffect, useMemo, useState } from "react";

type Place = {
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string;
};

type Weather = {
  temperature: number;
  isRaining: boolean;
  localTime: string;
};

const DEFAULT_PLACE: Place = {
  name: "Lofoten",
  country: "Norway",
  latitude: 68.2,
  longitude: 14.4,
  timezone: "Europe/Oslo",
};

// Open-Meteo WMO weather codes that mean "raining"
// 51-67 drizzle/rain, 80-82 rain showers, 95-99 thunderstorm
function isRainCode(code: number): boolean {
  return (
    (code >= 51 && code <= 67) ||
    (code >= 80 && code <= 82) ||
    (code >= 95 && code <= 99)
  );
}

function formatLocalTime(timezone: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: timezone,
    }).format(new Date());
  } catch {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date());
  }
}

async function geocode(query: string): Promise<Place | null> {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
    query
  )}&count=1&language=en&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Could not look up that city.");
  const data = await res.json();
  const r = data?.results?.[0];
  if (!r) return null;
  return {
    name: r.name,
    country: r.country ?? "",
    latitude: r.latitude,
    longitude: r.longitude,
    timezone: r.timezone ?? "auto",
  };
}

async function fetchWeather(place: Place): Promise<Weather> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,weather_code&timezone=${encodeURIComponent(
    place.timezone
  )}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Could not fetch weather.");
  const data = await res.json();
  const temp = Math.round(data?.current?.temperature_2m);
  const code = data?.current?.weather_code ?? 0;
  return {
    temperature: temp,
    isRaining: isRainCode(code),
    localTime: formatLocalTime(place.timezone),
  };
}

export default function Home() {
  const [place, setPlace] = useState<Place>(DEFAULT_PLACE);
  const [weather, setWeather] = useState<Weather | null>(null);
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [query, setQuery] = useState<string>("");

  // Fetch weather whenever the place changes
  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    fetchWeather(place)
      .then((w) => {
        if (cancelled) return;
        setWeather(w);
        setStatus("ok");
      })
      .catch((e: Error) => {
        if (cancelled) return;
        setErrorMsg(e.message);
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [place]);

  // Tick the local time once a minute
  useEffect(() => {
    const id = setInterval(() => {
      setWeather((w) =>
        w ? { ...w, localTime: formatLocalTime(place.timezone) } : w
      );
    }, 60_000);
    return () => clearInterval(id);
  }, [place.timezone]);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setStatus("loading");
    try {
      const found = await geocode(q);
      if (!found) {
        setStatus("error");
        setErrorMsg(`Couldn't find "${q}".`);
        return;
      }
      setPlace(found);
      setQuery("");
    } catch (e) {
      setStatus("error");
      setErrorMsg((e as Error).message);
    }
  }

  const drops = useMemo(
    () =>
      Array.from({ length: 60 }, (_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 1.2,
        duration: 0.6 + Math.random() * 0.6,
        key: i,
      })),
    []
  );

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-6">
      {/* Widget */}
      <div
        className="relative overflow-hidden rounded-2xl"
        style={{
          width: 400,
          height: 400,
          backgroundImage: "url('/lofoten-bg.jpeg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Dark overlay for legibility */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.25) 50%, rgba(0,0,0,0.55) 100%)",
          }}
        />

        {/* Rain */}
        {status === "ok" && weather?.isRaining && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {drops.map((d) => (
              <span
                key={d.key}
                className="rain-drop"
                style={{
                  left: `${d.left}%`,
                  animationDelay: `${d.delay}s`,
                  animationDuration: `${d.duration}s`,
                }}
              />
            ))}
          </div>
        )}

        {/* Content */}
        <div className="relative flex h-full w-full flex-col justify-between p-8 text-white">
          {/* Top row */}
          <div className="flex items-start justify-between">
            <div className="text-[18px] font-semibold leading-tight">
              <div>Today</div>
              <div>{weather?.localTime ?? "--:--"}</div>
            </div>
            <div
              className="font-semibold"
              style={{
                fontSize: 72,
                letterSpacing: "-2px",
                lineHeight: 1,
              }}
            >
              {status === "loading" && "…"}
              {status === "error" && "—"}
              {status === "ok" && weather && `${weather.temperature}°`}
            </div>
          </div>

          {/* Bottom row */}
          <div className="text-[18px] font-semibold leading-tight">
            <div>{place.name}</div>
            <div>{place.country}</div>
          </div>
        </div>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex w-[400px] gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search a city…"
          className="flex-1 rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-[14px] text-white placeholder:text-white/40 focus:border-white/30 focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-lg bg-white px-4 py-2 text-[14px] font-semibold text-black hover:bg-white/90"
        >
          Search
        </button>
      </form>

      {status === "error" && (
        <p className="text-[13px] text-red-300">{errorMsg}</p>
      )}
    </div>
  );
}
