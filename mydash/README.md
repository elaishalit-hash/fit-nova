# My Apps

**Live:** https://mydash-production-6623.up.railway.app (password-protected — see below)

A tiny private dashboard that shows the live status of both personal apps
(SongMatch and Fit Nova): reachable or not, HTTP status code, and response
time, checked server-side fresh on every page load. Add more entries in the
`APPS` array in `src/app/page.tsx`.

The whole app is gated behind HTTP Basic Auth (`src/proxy.ts`), since it's
meant for personal use only, not public visitors. The password is set via
the `DASHBOARD_PASSWORD` environment variable — the username can be
anything, only the password is checked.

## Setup

```bash
npm install
echo "DASHBOARD_PASSWORD=devpassword" > .env
npm run dev   # http://localhost:3000
```

## Deployment (Railway)

```bash
railway login
railway link                     # or `railway init` for a new project
railway variable set "DASHBOARD_PASSWORD=<a-real-password>"
railway up
railway domain
```

No database or persistent volume needed — this app is fully stateless
(it just checks two URLs on each request).
