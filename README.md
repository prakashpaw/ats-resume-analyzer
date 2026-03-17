# ATS Resume Analyzer

> Browser-based ATS keyword scorer & resume tailor — powered by Claude AI.  
> Runs 100% client-side. No data leaves your machine.

![screenshot](https://img.shields.io/badge/status-production--ready-brightgreen)

---

## Features

- **Instant ATS scoring** — keyword coverage (6 categories) + structure check
- **Tailored summary** — auto-generated to mirror JD language
- **Bullet suggestions** — context-aware additions based on missing JD keywords
- **Claude integration** — one-click prompts to rewrite summary or generate bullets
- **Export** — JSON report + tailored resume TXT
- **Dark mode** — follows system preference

---

## Quick Start

### Option 1 — Raw files (no install needed)

```bash
# Just open in browser
open public/index.html
# or on WSL:
explorer.exe public/index.html
```

---

### Option 2 — Docker (recommended, matches production)

**Prerequisites:** Docker Desktop (Windows/Mac) or Docker Engine (Linux/WSL2)

```bash
# Clone repo
git clone https://github.com/YOUR_USERNAME/ats-resume-analyzer.git
cd ats-resume-analyzer

# Build and run
docker compose up --build

# Open in browser
# http://localhost:3000 -- everything here
```

**Stop:**
```bash
docker compose down
```

**Rebuild after editing files:**
```bash
docker compose up --build
```

> **WSL2 tip:** Files auto-reload because `docker-compose.yml` mounts `./public` as a volume.  
> Edit `public/index.html` or `public/app.js` → refresh browser → see changes instantly.

---

### Option 3 — Python simple server (zero dependencies)

```bash
cd public
python3 -m http.server 3000
# Open http://localhost:3000
```

---

### Option 4 — Node http-server

```bash
npx http-server public -p 3000 -c-1
# Open http://localhost:3000
```

---

## Deploy to Vercel (free)

### One-click (GUI)

1. Push this repo to GitHub (see Git Setup below)
2. Go to [vercel.com](https://vercel.com) → **Add New Project**
3. Import your GitHub repo
4. Vercel auto-detects `vercel.json` → click **Deploy**
5. Your app is live at `https://ats-resume-analyzer-YOUR_NAME.vercel.app`

### CLI deploy

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy (first time — follow prompts)
vercel

# Deploy to production
vercel --prod
```

---

## Git & GitHub Setup

```bash
# 1. Init git
git init
git add .
git commit -m "feat: initial ATS Resume Analyzer"

# 2. Create repo on GitHub (go to github.com → New repository)
#    Name: ats-resume-analyzer   Visibility: Public or Private

# 3. Connect and push
git remote add origin https://github.com/YOUR_USERNAME/ats-resume-analyzer.git
git branch -M main
git push -u origin main
```

**Daily workflow:**
```bash
# After editing files
git add .
git commit -m "fix: improve keyword matching"
git push
# If connected to Vercel → auto-deploys in ~30 seconds
```

---

## Project Structure

```
ats-resume-analyzer/
├── public/
│   ├── index.html       # Full app (HTML + CSS)
│   └── app.js           # Scoring logic + Claude prompts
├── Dockerfile           # nginx:alpine image
├── docker-compose.yml   # Local dev with volume mount
├── nginx.conf           # nginx config (gzip, caching, SPA fallback)
├── vercel.json          # Vercel static deploy config
├── .gitignore
└── README.md
```

---

## Customising

| What | Where |
|------|-------|
| Change resume default | `app.js` → `DEFAULT_RESUME` constant |
| Add keyword categories | `app.js` → `VOCAB` object |
| Change score weights | `app.js` → `analyze()` function (0.65 / 0.35 split) |
| Change port | `docker-compose.yml` → `"3000:80"` |

---

## WSL2 Tips

- Run all commands in **WSL terminal**, not PowerShell
- Access the app at `http://localhost:3000` from Windows browser
- If Docker isn't available in WSL, use Option 2 (Python server)
- To open files from WSL in Windows Explorer: `explorer.exe .`

---

## Tech Stack

- Vanilla HTML / CSS / JS — zero build step, zero dependencies
- nginx:alpine — production-grade static file server
- Docker + docker-compose — containerised local dev
- Vercel — free static hosting with global CDN
- Claude AI (via `sendPrompt`) — summary rewriting and bullet suggestions

---

*Generated with Claude · ATS Analyzer v1.0*
