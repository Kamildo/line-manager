# Manager

Factory assembly line management tool. Runs online (hosted) or offline (local).

---

## Quick Start — Offline (Release)

**Requirements:** Node.js 18+, Angular CLI

1. Download and unzip the release
2. Run `setup.bat` — starts backend and opens browser automatically
3. Log in with your credentials (currently has buttons for easy credentials input for selected role)
---

## Online Demo

Visit: [https://kamildo.github.io/line-manager](https://kamildo.github.io/line-manager)

**Limitations of online version:**
- Data resets on every backend restart (in-memory database)
- Backend hosted on Render free tier and may take 30–60 seconds to wake up on first visit
- Ad blockers may block the backend URL. Disable for the site if data does not load
- No changing settings
---

## Setup from Source

### Prerequisites
- Node.js 18+
- Angular CLI (`npm install -g @angular/cli`)

### Install

Run setup.bat

### Pre-seeded database

A pre-seeded `app.db` is included in the repo under `backend/data/`.
If you want to recreate database remove the file from there or set a new path in settings. Then u can make one with or without starting data.

---

## User Roles

| Role | Permissions |
|------|------------|
| guest | View only |
| user | View + create + edit, can initialize database if one not exist |
| admin | Full access |

---

## Project Structure

```
/frontend    Angular 19 app → deployed to GitHub Pages
/backend     Express/TypeScript API → deployed to Render
/backend/data/app.db    Pre-seeded SQLite database (offline use)
```
---
## Build & Deploy

### Frontend (GitHub Pages)
```bash
cd frontend
npm run build:gh
npm run deploy:gh
```

### Backend (Render)
Push to main — Render auto-deploys on push.  
Build command: `npm run build`  
Start command: `npm start`
