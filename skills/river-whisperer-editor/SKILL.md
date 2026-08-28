---
name: "river-whisperer-editor"
description: "Site editor for The River Whisperer cruise website — edit files, update content, manage auth."
---

# The River Whisperer — Site Editor

You manage a local web app for "The River Whisperer," a private river cruise business on the Kowie River in Port Alfred, South Africa.

## Project Location
`/Users/deonvandenberg/.openclaw/workspace/river-whisperer/`

## Server
- **Backend:** `server.js` — Express.js server on port **8080**
- **Restart:** `pkill -f "node server" && cd /path && node server.js &`
- **Dependencies:** express, jsonwebtoken, bcryptjs, cors, cookie-parser

## File Structure

### Core Pages
| File | Purpose |
|------|---------|
| `index.html` | Main landing page — hero, about, cruises, gallery, CTA |
| `calendar.html` | 14-day weather calendar with wind/cloud/rain data |
| `login.html` | Sign-in page |
| `signup.html` | Registration page |
| `dashboard.html` | Client dashboard (after login) |
| `admin.html` | Admin dashboard — user list, stats |

### Backend
| File | Purpose |
|------|---------|
| `server.js` | Express server — auth, bookings, weather, static files, chat API |
| `private/users.json` | User accounts (created on first run) |
| `private/bookings.json` | Bookings storage |
| `private/weather.json` | Cached weather data (refreshed every 12h) |

### Images
`images/logo.png`, `images/hero.jpg`, `images/sunset1.jpg`, `images/sunset2.jpg`, `images/river1.png`, `images/river2.jpeg`, `images/river3.jpeg`, `images/river4.jpg`

## Auth System
- **Admin login:** `dj.doen@gmail.com` / `admin1234`
- JWT-based auth, cookies, 7-day expiry
- Roles: `admin` and `client`
- Protected routes: `/admin` (admin only), `/dashboard` (any auth)

## API Endpoints
- `POST /api/login` — Sign in
- `POST /api/signup` — Register
- `POST /api/logout` — Sign out
- `GET /api/me` — Check auth status
- `GET /api/weather` — 14-day forecast (GFS model, cached 12h)
- `POST /api/weather/refresh` — Force weather refresh
- `POST /api/ai-chat` — Chat with this agent (admin only)

## Weather Data
- Source: Open-Meteo GFS model
- Port Alfred coordinates: -33.6, 26.9
- 14-day hourly data: wind_speed_10m, precipitation, cloud_cover, temperature_2m, weather_code

## Common Edits

### Change nav links
Edit the `<ul class="nav-links">` section in `index.html` and `calendar.html`

### Update cruise pricing
In `index.html`, find the cruise card `.pricing` section

### Change admin credentials
Edit the `defaultAdmin` object in `server.js` (line ~10)

### Add a new page
1. Create the HTML file in the project root
2. Add the nav link to `index.html` (and `calendar.html` if needed)
3. Restart server

## Publishing (Future)
When the site is ready to go live, it will be deployed from this local folder.
