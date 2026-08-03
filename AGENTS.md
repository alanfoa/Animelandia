# AGENTS.md — Animelandia

Guía de contexto completa del proyecto. Con esta única instrucción alcanza para ponerse al día.

## Qué es

Streaming de anime gratis: frontend estático (HTML/CSS/JS vanilla, sin build) + API backend en Express que scrapea dos fuentes (`animeav1.com` y `tioanime.com`) y devuelve JSON. El reproductor incrusta iframes/embeds de los servidores de video.

## Estructura del repo

```
backend/
  server.js              Express API (~580 líneas). Todo el backend.
  scrapers/
    animeav1.js          Fuente av1 (default). Exporta { source:'av1', getLatest, getFeatured, search, getAnimeInfo, getVideo }
    tioanime.js          Fuente tio. Exporta { source:'tio', ...mismas funciones }
  package.json           Express 5, axios+cheerio, cors, helmet, compression, morgan, express-rate-limit, axios-retry, dotenv
  .env                   Variables locales (NO se commitea)
  .env.example           Plantilla
  Dockerfile             node:20 + npm start (alternativa a Render build)
  render-build.sh        Instala chromium (legacy, no se usa en runtime actual)
frontend/
  index.html             Home: carrusel + /latest + favoritos + continuar viendo + búsqueda con autocomplete
  explorar.html          Catálogo con filtros avanzados + paginación con prefetch
  anime.html             Detalle del anime + reproductor + descargas + shortcuts
  styles.css             CSS compartido (navbar, tema, toasts, skeletons, favoritos)
  manifest.json, _redirects, serve.json, 404.html
  assets/img/            Logo.png, Sharingam.png (spinner)
README.md, CONTEXT.md, plan.md, aprendizaje.md   Docs (pueden estar desactualizados)
```

## Backend (server.js)

### Endpoints
| Endpoint | Params | Descripción |
|---|---|---|
| `GET /health` | - | `{ status:'ok', timestamp }` |
| `GET /latest` | `source` | 24 últimos episodios. Cache 10 min (no cachea arrays vacíos) |
| `GET /featured` | `source` | Carrusel. Cache 10 min |
| `GET /search` | `q`, `page`, `genre`, `category`, `status`, `order`, `letter`, `minYear`, `maxYear`, `source` | Catálogo. Cache 5 min por URL |
| `GET /anime-info` | `slug`, `source` | Info del anime + episodios. Cache 1 h |
| `GET /get-video` | `slug`, `cap`, `source` | Servidores + descargas del cap. Cache 30 min |

Todos responden `{ error }` con 4xx/5xx en fallos. 404 global → JSON.

### Middlewares
- CORS whitelist (línea 16): `CORS_ORIGINS` env o default `https://animelandia-oficial.netlify.app, https://animelandia1.netlify.app, http://localhost:5500, http://127.0.0.1:5500`
- helmet, compression, morgan 'short', rate limit global 100 req/15 min, `Cache-Control: public, max-age=300`.

### Cachés
`INFO_CACHE`, `VIDEO_CACHE`, `SEARCH_CACHE` (Maps con TTL 1 h), `LATEST_CACHE`, `FEATURED_CACHE`, `HOMEPAGE_CACHE` (10 min). Limpieza automática cada 5 min (evita memory leak). `homepagePromise` coalesce pedidos simultáneos a la home. axios-retry: 3 reintentos con exponentialDelay para errores de red/timeout.

### Scrapers
- Patrón común: `fetchAndParse` con UA Chrome 122, timeout 15 s, http/https Agent keepAlive 30 s.
- **av1**: home/`/media/{slug}`/`/media/{slug}/{cap}`. Extrae datos de scripts embebidos (regex sobre `media:{...}`, `featured:[...]`, `latestEpisodes`, `SUB:[{server,url}...]`). Imágenes: `https://cdn.animeav1.com/covers/{id}.jpg` y `.../screenshots/{id}/{n}.jpg`. `enriquecerServidor` se aplica en el server.js.
- **tio**: home/`/anime/{slug}`/`/ver/{slug}-{cap}`. Slug pattern distinto. `getAnimeInfo` en modo tio intenta merge de `nextDate`/`waitDays` scrapeando la página av1 del mismo anime.

### HLS de zilla (CRÍTICO — sesión actual)
- `enriquecerServidor(srv)` (server.js:61): si `url` matchea `^https://player\.zilla-networks\.com/play/([0-9a-f]{32})` → `{ ...srv, tipo:'hls', hlsUrl:'https://player.zilla-networks.com/m3u8/{id}' }`; si no → `{ ...srv, tipo:'iframe' }`.
- **Regla de oro**: reproducir `hlsUrl` con un **iframe** que apunte directo al `.m3u8` (el navegador lo muestra como media document). **NO** usar `<video>` nativo ni hls.js: el manifest responde 200 pero los segmentos `/segs/*` están protegidos por Cloudflare y dan 403 a requests que no vienen de un navegador real (hls.js falla con "❌ No se pudo reproducir el video"). No proxear por backend.
- El iframe usa `referrerpolicy="no-referrer"`.

## Frontend

### Funcionamiento general
- `API_URL`: localhost/127.0.0.1 → `http://localhost:3001`; prod → `https://animelandia-api-6wp2.onrender.com`.
- Fuente: `localStorage.animeSource` (`'av1'` default | `'tio'`). `withSource(url)` agrega `&source=tio`. Toggle en navbar (habilitado en index/explorar; **deshabilitado en anime.html a propósito**, commit 73c7e2a).
- Tema: `localStorage.theme` (`'dark'` default | `'light'`), atributo `data-theme` en `<html>`, CSS vars en styles.css (`--racing-celeste: #00AEEF`, etc.).
- `localStorage`: `misAnimes` (favoritos), `continuarViendo`, `animeSource`, `theme`.
- `sessionStorage`: `anime-info-{slug}` (TTL 1 h vía campo `_time`), `animeReferrer` (volver atrás correctamente).
- instant.page en las 3 páginas. hls.js CDN cargado en anime.html (ya no es el flujo principal).

### index.html
Carrusel **hardcodeado** (`carouselData`: Gintama, Naruto, One Piece, Chainsaw Man...), `/latest`, `/search` con dropdown autocomplete (debounce 300 ms, 8 resultados), sección favoritos y continuar viendo.

### explorar.html
Filtros (género, tipo, estado, año 1950–2026, orden, letra) persistidos en la URL (`history.replaceState`), paginación con ventana deslizante + prefetch al hover, skeletons, reinicio de página con `reintentar()`.

### anime.html
Ruta `/anime/{slug}` (rewrite por `_redirects` de Netlify y `serve.json` local). Muestra info, tags (rating, tipo, año, estado, próximos caps con `waitDays`, relaciones precuela/secuela), lista de episodios con paginación (50/pág), buscador de cap y orden asc/desc, reproductor con botones de servidores, dropdown de descargas, atajos de teclado (`F` fullscreen, `←`/`→` caps, `Ctrl+K` o `/` buscar), guarda en continuar viendo, JSON-LD para Google. `buscarOpciones` auto-selecciona el primer servidor `tipo === 'hls'`, si no, el primero.

## Despliegue

- **Backend**: Render desde GitHub `main` (auto-deploy) → `https://animelandia-api-6wp2.onrender.com`. Build: `render-build.sh` (instala chromium) + `npm start`.
- **Frontend**: Netlify → `https://animelandia-oficial.netlify.app` (existe también `animelandia1.netlify.app` en CORS). `_redirects`: `/anime/* → /anime.html 200`. Sin build.
- Pushear a `main` dispara el redeploy automático de ambos.

## Mantener el backend despierto (Render free)

Render duerme el servicio tras 15 min de inactividad. Se usa **UptimeRobot** para ping cada 5 min a `https://animelandia-api-6wp2.onrender.com/health`. Si hay que recrearlo: crear monitor HTTP(s) apuntando a esa URL, intervalo 5 min.

## Historico de optimización (mayo 2026, previo al plan.md)

- Backend: `cc22947` (homepage cache + keepAlive + axios-retry), `d525c41` (simplificar parser /featured), `5f772f9` (cache 30 min /get-video), `97bf4dd` (promise caching getHomepage), `e0c98f5` (compression gzip), `1d99f2f` (cache 5 min /search), `40d9e12` (validación + errores detallados), `4fd5a59` (rate limit), `f82d51b` (variables de entorno).
- Frontend: `b71496d` (prefetch catálogo), `e7221bc` (fadeIn cards), `0566107` (dns-prefetch/preconnect), `c20087f` (sessionStorage anime-info), `be559e3` (errores visuales con REINTENTAR), `7124950` (título dinámico), `dee8fde` (fix Sharingam.png no commiteado).

## Dev local

```
# Backend (usa backend/.env)
cd backend; npm start        # → http://localhost:3001

# Frontend (CORS espera estos puertos)
cd frontend; npx serve -l 5500   # → http://localhost:5500
```
- `serve.json` hace rewrite de `/anime/**` → `anime.html`.
- Si servís el frontend en otro puerto (ej. 3000), hay que agregar ese origen a `CORS_ORIGINS` del backend.
- `backend/server.log` y `backend/server.err` son untracked; no commitear.
- `.env`, `node_modules/` y `aprendizaje.md` están en `.gitignore`.

## Git

- Repo: `github.com/alanfoa/Animelandia`, rama `main` (única en origin). Ramas locales legacy: `feat/animeflv-source`, `feat/faster-scraping`, `feature/pagination`, `refactor/migracion-profesional`.
- Convensión de commits: `tipo: descripción en español` (ej. `feat:`, `fix:`).
- **Regla**: no pushear cambios no probados.
- Último commit (c4df872): reproducir HLS de zilla vía iframe (m3u8 directo) + HLS como servidor por defecto.

## Plan y estado real

`plan.md` quedó desactualizado (declara 25/28 = 89%). Estado **real**: las 28 tareas del plan están completas.

- Tarea 1 (CSS compartido → styles.css): **hecha**.
- Tarea 13 (skeleton screens): **hecha** (skeletons en las 3 páginas).
- Tarea 24 (JSON-LD): **hecha** (en anime.html).

Trabajo posterior al plan.md:
1. **Simplificar URLs** (3b33a46): ruta `/anime/{slug}`, próximo capítulo (`nextDate`/`waitDays`), relaciones precuela/secuela.
2. **Fix regex servidores** (3dd148b, 6fed894): `SUB:[...]` correcto cuando existe DUB; descargas como segundo bloque.
3. **`/latest` sin cachear arrays vacíos** (dca8168).
4. **Filtros catálogo** (1d0961d, 3568e8e): mapeo de `order` a valores de av1, filtros en URL, live search autocomplete, `autocomplete="off"`, status mapping.
5. **TioAnime como segunda fuente** (1b8c810) con toggle en navbar.
6. **Year selector + filters mapping + merge nextDate/waitDays** desde av1 en modo tio (53ef3b6).
7. **Deshabilitar toggle de fuente en detalle** (73c7e2a).
8. **Fix status mapping TioAnime** (fbaac9d): Próximamente mostraba Finalizado.
9. **HLS vía iframe m3u8 directo + default** (c4df872, última sesión, pusheado).

## Gotchas / pendientes

- Los segmentos HLS de zilla solo reproducen en navegador real (Cloudflare). No intentar proxy por backend.
- El toggle de fuente en `anime.html` está deshabilitado intencionalmente.
- `README.md`, `CONTEXT.md`, `plan.md` y `aprendizaje.md` pueden estar desactualizados: **el código es la fuente de verdad**.
- No hay tests (el script `test` es un stub). Verificar cambios probando en el navegador contra localhost.
