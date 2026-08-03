# Animelandia

> Motor de streaming de anime automatizado — Backend con Web Scraping, frontend vanilla y contenedorizado con Docker.

![Node.js](https://img.shields.io/badge/Node.js-339933?logo=nodedotjs&logoColor=fff)
![Express](https://img.shields.io/badge/Express-000000?logo=express&logoColor=fff)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=000)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=fff)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=fff)
![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=fff)
![Render](https://img.shields.io/badge/Render-46E3B7?logo=render&logoColor=000)
![Netlify](https://img.shields.io/badge/Netlify-00C7B7?logo=netlify&logoColor=fff)

---

## ✨ Funcionalidades

- **Últimos episodios** en la homepage con grilla dinámica
- **Búsqueda** en tiempo real por nombre de anime (con autocomplete)
- **Catálogo** con filtros avanzados: género, año, tipo, estado, orden, letra (persistidos en la URL)
- **Paginación** profesional con prefetch anticipado al hover
- **Detalles** de anime: sinopsis, rating, géneros, estado, próximo capítulo y relaciones (precuela/secuela)
- **Reproductor** de video con múltiples servidores + reproducción HLS de zilla por iframe
- **Dos fuentes de scraping**: `animeav1.com` (default) y `tioanime.com` con toggle en la navbar
- **Descargas** por episodio + atajos de teclado (`F` pantalla completa, `←`/`→` episodios, `Ctrl+K` buscar)
- **Favoritos** con localStorage, "continuar viendo" y tema claro/oscuro persistente

---

## 🛠️ Stack tecnológico

### Backend
- **Node.js** + **Express** — servidor escalable
- **Axios** + **Cheerio** — web scraping eficiente (dos fuentes)
- **Cache en memoria** con `Map` + timestamps por endpoint y limpieza periódica
- **Promise caching** — si expira el cache, solo 1 fetch
- **keepAlive agents** — reuso de conexiones TCP (~30% más rápido)
- **axios-retry** — 3 reintentos con exponential backoff
- **Compression gzip** — respuestas ~70% más pequeñas
- **Rate limiting** — 100 requests / 15 minutos
- **Helmet + Morgan** — headers de seguridad y logging

### Frontend
- **HTML5** + **CSS3** + **JavaScript Vanilla** — sin frameworks
- **DNS-prefetch + preconnect** en head del HTML
- **sessionStorage** — carga instantánea al volver a un anime visitado (TTL 1 h)
- **Prefetch** — al pasar mouse sobre paginación, carga en background
- **JSON-LD** — datos estructurados para Google (rich snippets)

### Hosting
- **Render** — backend contenedorizado (Node.js 20)
- **Netlify** — frontend estático

---

## 📡 API

Base URL (prod): `https://animelandia-api-6wp2.onrender.com`

| Endpoint | Propósito | Cache |
|----------|-----------|-------|
| `/health` | Health check | Sin caché |
| `/latest` | Últimos episodios | 10 min |
| `/featured` | Carrusel de la homepage | 10 min |
| `/search?q=&genre=&year=...` | Buscar y filtrar anime (paginado) | 5 min |
| `/anime-info?slug=` | Detalles de anime y episodios | 1 h |
| `/get-video?slug=&cap=` | Servidores y descargas del episodio | 30 min |

Todos los endpoints aceptan `?source=tio` para usar la fuente alternativa.

---

## 📦 Instalación local

### Prerequisitos
- Node.js 20+
- npm

### 1. Clonar repositorio
```bash
git clone https://github.com/alanfoa/Animelandia.git
cd Animelandia
```

### 2. Configurar e iniciar backend
```bash
cd backend
cp .env.example .env  # SCRAPING_TARGET=https://animeav1.com
npm install
npm start
# Backend corriendo en http://localhost:3001
```

### 3. Iniciar frontend (otra terminal)
```bash
cd frontend
npx serve -l 5500
# Frontend en http://localhost:5500 (puerto esperado por CORS)
```

> El backend acepta CORS solo de los orígenes listados en `CORS_ORIGINS` (incluido `http://localhost:5500`).

---

## 🚀 Deploy

| Servicio | Directorio | Comando |
|----------|-----------|---------|
| **Render** (backend) | `backend/` | `npm start` |
| **Netlify** (frontend) | `frontend/` | publish dir: `frontend/` |

- Push a `main` → redeploy automático en Render y Netlify.
- Netlify reescribe `/anime/*` → `anime.html` (ver `_redirects`).
- Render free duerme a los 15 min: un monitor de UptimeRobot pingea `/health` cada 5 min.

---

## 🔐 Variables de entorno

| Variable | Descripción |
|----------|-------------|
| `SCRAPING_TARGET` | Sitio a scrapear por defecto (`https://animeav1.com`) |
| `TIOANIME_URL` | Sitio alternativo (`https://tioanime.com`) |
| `PORT` | Puerto del servidor (default: 3000) |
| `CORS_ORIGINS` | Orígenes permitidos (coma separados) |

---

## 📄 Licencia

ISC
