# weship — Weather Widget PRD

## What it is
A 400×400px weather widget that shows the current temperature, time, and location for any city, layered over a Lofoten landscape photo. Animated rain when it's actually raining.

## Who it's for
Designers and tinkerers who want a beautiful, glanceable weather card — not a forecast app.

## What it does
- Search box to pick any city worldwide
- Fetches current temperature + weather condition from Open-Meteo (no API key)
- Shows: "Today" + current local time (top-left), temperature (top-right, big), city + country (bottom-left)
- Lofoten photo background (v1 — same image for every city), darkened for text legibility
- Animated rain (60 CSS drops) overlays the scene only when it's currently raining at that location
- Loading and error states handled gracefully

## What it does not do (v1)
- No hourly or multi-day forecast
- No wind, humidity, UV, sunrise/sunset
- No user accounts, no saved cities, no settings
- No unit toggle (Celsius only)
- No per-city backgrounds (one image for all)

## Design
- 400×400px card, 16px corners, 32px padding
- Inter font, all white text. Temp 72px / -2px tracking. Labels 18px semibold.
- Palette: `#3A3D35` `#2D3028` `#1E211A` `#1C1F17`, page bg `#18181B`
- Background: `public/lofoten-bg.jpeg` with dark overlay

## Data
- Open-Meteo geocoding API → city → lat/lon
- Open-Meteo forecast API → current temp + weather code + timezone
