# Animelandia

Motor de streaming de anime automatizado. Backend escalable en Node.js con Web Scraping (Axios + Cheerio), frontend vanilla HTML/CSS/JS, contenedorizado con Docker y desplegado en Render + Netlify.

## Stack

- **Backend:** Node.js + Express + Axios + Cheerio
- **Frontend:** HTML5 + CSS3 + JavaScript Vanilla (sin frameworks)
- **Hosting:** Render (backend) + Netlify (frontend)
- **Containerización:** Docker (Node.js 20)

## Features

- Ultimos episodios en la homepage con grilla dinamica
- Busqueda en tiempo real por nombre de anime
- Catálogo con filtros avanzados: genero, año, tipo, estado, orden, letra
- Paginacion profesional con prefetch anticipado al hover
- Detalles de anime: sinopsis, rating, generos, temporadas
- Reproductor de video con multiples servidores
- Favoritos con localStorage + tema claro/oscuro persistente

## API

| Endpoint | Proposito | Cache |
|----------|-----------|-------|
| `/latest` | Ultimos episodios | 10 min |
| `/search?q=&genre=&year=...` | Buscar y filtrar anime | 5 min |
| `/anime-info?slug=` | Detalles de anime y episodios | 1 h |
| `/get-video?slug=&cap=` | Servidores de video | 30 min |
| `/health` | Health check | Sin cache |

## Optimizaciones

- **Cache en memoria** con `Map` + timestamps por endpoint
- **Promise caching**: si expira el cache y llegan n requests, solo 1 fetch
- **keepAlive agents**: reuso de conexiones TCP (~30% mas rapido)
- **axios-retry**: 3 reintentos con exponential backoff
- **Compression gzip**: respuestas ~70% mas pequeñas
- **Rate limiting**: 100 requests / 15 minutos
- **Prefetch**: al pasar mouse sobre paginacion, carga en background
- **DNS-prefetch + preconnect** en head del HTML
- **sessionStorage**: carga instantanea al volver a un anime visitado

## Setup local

```bash
git clone https://github.com/alanfoa/Animelandia.git
cd Animelandia

# Backend
cd backend
cp .env.example .env  # SCRAPING_TARGET=https://animeav1.com
npm install
npm start

# Frontend (terminal 2)
cd frontend
npx serve
```

## Deploy

- **Backend:** Render — `npm start`
- **Frontend:** Netlify — publish dir: `frontend/`

## Variables de entorno

| Variable | Descripcion |
|----------|-------------|
| `SCRAPING_TARGET` | Sitio a scrapear (default: `https://animeav1.com`) |
| `PORT` | Puerto del servidor (default: 3000) |
