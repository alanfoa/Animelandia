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
- **Búsqueda** en tiempo real por nombre de anime
- **Catálogo** con filtros avanzados: género, año, tipo, estado, orden, letra
- **Paginación** profesional con prefetch anticipado al hover
- **Detalles** de anime: sinopsis, rating, géneros, temporadas
- **Reproductor** de video con múltiples servidores
- **Favoritos** con localStorage + tema claro/oscuro persistente

---

## 🛠️ Stack tecnológico

### Backend
- **Node.js** + **Express** — servidor escalable
- **Axios** + **Cheerio** — web scraping eficiente
- **Cache en memoria** con `Map` + timestamps por endpoint
- **Promise caching** — si expira el cache, solo 1 fetch
- **keepAlive agents** — reuso de conexiones TCP (~30% más rápido)
- **axios-retry** — 3 reintentos con exponential backoff
- **Compression gzip** — respuestas ~70% más pequeñas
- **Rate limiting** — 100 requests / 15 minutos

### Frontend
- **HTML5** + **CSS3** + **JavaScript Vanilla** — sin frameworks
- **DNS-prefetch + preconnect** en head del HTML
- **sessionStorage** — carga instantánea al volver a un anime visitado
- **Prefetch** — al pasar mouse sobre paginación, carga en background

### Hosting
- **Render** — backend contenedorizado con Docker (Node.js 20)
- **Netlify** — frontend estático

---

## 📡 API

| Endpoint | Propósito | Cache |
|----------|-----------|-------|
| `/latest` | Últimos episodios | 10 min |
| `/search?q=&genre=&year=...` | Buscar y filtrar anime | 5 min |
| `/anime-info?slug=` | Detalles de anime y episodios | 1 h |
| `/get-video?slug=&cap=` | Servidores de video | 30 min |
| `/health` | Health check | Sin caché |

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
# Backend corriendo en http://localhost:3000
```

### 3. Iniciar frontend (otra terminal)
```bash
cd frontend
npx serve
# Frontend en http://localhost:3000 (o el puerto que asigne serve)
```

---

## 🚀 Deploy

| Servicio | Directorio | Comando |
|----------|-----------|---------|
| **Render** (backend) | `backend/` | `npm start` |
| **Netlify** (frontend) | `frontend/` | publish dir: `frontend/` |

---

## 🔐 Variables de entorno

| Variable | Descripción |
|----------|-------------|
| `SCRAPING_TARGET` | Sitio a scrapear (default: `https://animeav1.com`) |
| `PORT` | Puerto del servidor (default: 3000) |

---

## 📄 Licencia

MIT
