# Keep-Alive Service für Render Backend

Dieses Skript verhindert, dass Render deinen Backend-Service nach 15 Minuten Inaktivität in den Schlafmodus versetzt.

## Optionen

### Option 1: Mit GitHub Actions (Empfohlen für Render)

Erstelle eine GitHub Action, die regelmäßig deinen Backend pingt.

1. Erstelle `.github/workflows/keep-alive.yml`:

```yaml
name: Keep Alive Backend

on:
  schedule:
    # Alle 10 Minuten ausführen (vor der 15-min Render-Grenze)
    - cron: '*/10 * * * *'
  workflow_dispatch:

jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - name: Keep backend alive
        run: |
          curl -f ${{ secrets.BACKEND_URL }}/keep-alive || exit 1
        env:
          BACKEND_URL: ${{ secrets.BACKEND_URL }}
```

2. Gehe zu GitHub Repository Settings → Secrets und füge hinzu:
   - `BACKEND_URL`: deine Render-Backend URL (z.B. `https://voxai-backend.onrender.com`)

### Option 2: Lokales Node.js Skript

Starte das Skript lokal oder auf einem anderen Server:

#### TypeScript Version:
```bash
cd backend
npm install
tsx scripts/keep-alive.ts
```

#### JavaScript Version:
```bash
cd backend
node scripts/keep-alive.js
```

**Umgebungsvariablen:**
```bash
# Standardmäßig auf localhost, setze auf deine Render URL:
BACKEND_URL=https://voxai-backend.onrender.com node scripts/keep-alive.js

# Intervall ändern (Standard: 600000ms = 10 Minuten):
PING_INTERVAL=300000 node scripts/keep-alive.js
```

### Option 3: Mit PM2 (für 24/7 Betrieb)

Wenn du einen eigenen Server hast:

1. Installiere PM2:
```bash
npm install -g pm2
```

2. Starte das Skript:
```bash
BACKEND_URL=https://voxai-backend.onrender.com pm2 start backend/scripts/keep-alive.js --name "voxai-keep-alive"
```

3. PM2 konfigurieren, um nach Neustart automatisch zu starten:
```bash
pm2 startup
pm2 save
```

### Option 4: Docker Container

Erstelle einen einfachen Container, der das Ping-Skript ausführt:

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY backend/scripts/keep-alive.js .
ENV BACKEND_URL=https://voxai-backend.onrender.com
CMD ["node", "keep-alive.js"]
```

## Häufig gestellte Fragen

**F: Wie oft sollte ich pingen?**
A: Alle 10 Minuten ist ideal (Standard). Render schläft nach 15 Minuten ein, also pingen wir alle 10 Minuten, um sicherzugehen.

**F: Verursacht das zusätzliche Kosten?**
A: Nein, die Pings sind sehr leicht und verursachen praktisch keine zusätzlichen Ressourcen.

**F: Kann ich GitHub Actions kostenlos nutzen?**
A: Ja, GitHub Actions sind für Public Repositories kostenlos und auch Private Repositories bekommen 2000 Minuten/Monat kostenlos.

**F: Muss ich etwas im Code ändern?**
A: Nein, das Skript nutzt den dedizierten `/keep-alive` Endpoint deines Backends.

## Debugging

Logs anschauen:
```bash
# TypeScript
BACKEND_URL=https://deine-url.onrender.com tsx scripts/keep-alive.ts

# JavaScript
BACKEND_URL=https://deine-url.onrender.com node scripts/keep-alive.js
```

Im Debug-Modus sehen Sie:
- ✓ Erfolgreiche Pings
- ✗ Fehler oder Timeouts
- Zeitstempel jedes Pings

## Empfohlene Lösung

Nutze **Option 1 (GitHub Actions)** - es ist:
- ✅ Kostenlos
- ✅ Ohne externe Abhängigkeiten
- ✅ Zuverlässig
- ✅ Keine Infrastruktur-Wartung nötig
