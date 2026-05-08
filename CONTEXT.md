# Animelandia - Context File

> Proyecto creado en verano 2025 (Argentina)
> Última actualización: Mayo 2026 (Optimización total: backend cache, prefetch, rate limit, env vars)

## Descripción General

Animelandia es una aplicación web full-stack de streaming y descubrimiento de anime. Funciona como una interfaz frontend que hace scraping de **animeav1.com** para mostrar contenido.

### Funcionalidades Principales
- **Últimos Episodios**: Muestra episodios recientes en la homepage
- **Búsqueda de Anime**: Búsqueda en tiempo real por nombre
- **Explorar Catálogo**: Navegación con filtros avanzados (género, año)
- **Detalles de Anime**: Sinopsis, rating, géneros y lista de episodios
- **Reproductor de Video**: Visualización de episodios con múltiples servidores
- **Sistema de Favoritos**: Guardado local usando localStorage
- **Tema Claro/Oscuro**: Alternancia persistente

---

## Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js (v5.2.1)
- **Web Scraping**:
  - Axios (v1.13.3) - Peticiones HTTP rápidas
  - Cheerio (v1.2.0) - Parsing de HTML del lado del servidor
- **Middleware**: CORS, compression (gzip), express-rate-limit
- **Utilidades**: axios-retry (reintentos con backoff), dotenv (variables de entorno)

### Frontend
- **Lenguajes**: HTML5, CSS3, JavaScript Vanilla (sin frameworks)
- **Estilos**: CSS con Variables CSS para theming
- **Almacenamiento**: localStorage para favoritos y preferencias de tema, sessionStorage para caché de anime-info

### Deployment
- **Plataforma**: Render (Backend) + Netlify (Frontend)
- **URL de API**: `https://animelandia-api-6wp2.onrender.com`
- **URL de Frontend Netlify**: `https://animelandia-oficial.netlify.app`
- **URL de Frontend anterior**: `https://animelandia1.netlify.app`
- **Containerización**: Docker con imagen base Node.js 20

---

## Estructura del Proyecto

```
E:\Github\Animelandia\
├── CONTEXT.md               # Este archivo de contexto
├── .gitignore               # Ignora node_modules/, .env y aprendizaje.md
├── backend\                 # Servidor y lógica de scraping
│   ├── server.js            # Servidor Express con scraping de Axios + Cheerio
│   ├── package.json         # Dependencias y scripts
│   ├── package-lock.json    # Lock file de dependencias
│   ├── Dockerfile           # Configuración Docker
│   ├── .env                 # Variables de entorno (no subido a git)
│   └── render-build.sh      # Script de build (para Render.com, no usado)
└── frontend\                # Interfaz de usuario
    ├── index.html           # Homepage - últimos episodios + carrusel fijo
    ├── anime.html           # Página de detalles de anime
    ├── explorar.html        # Catálogo con filtros
    └── assets\
        └── img\
            ├── Logo.png     # Logo del proyecto
            └── Sharingam.png # Spinner de carga animado
```

**Nota**: Proyecto separado en backend/ y frontend/ para mejor organización.

---

## API Endpoints (server.js)

| Endpoint | Método | Propósito | Cache | Validación |
|----------|--------|-----------|-------|------------|
| `/health` | GET | Health check (monitoreo) | Sin cache | - |
| `/latest` | GET | Obtener últimos episodios | 10 minutos | - |
| `/search?q=&page=&...` | GET | Buscar anime (texto o filtros) + paginación | **5 minutos** | `page` debe ser número positivo |
| `/anime-info?slug=` | GET | Detalles de anime y episodios | 1 hora | requiere `slug` |
| `/get-video?slug=&cap=` | GET | Servidores de video para episodio | **30 minutos** | requiere `slug` y `cap` |

### Detalles de `/search`
- Soporta parámetros individuales (`genre`, `category`, `status`, `order`, `letter`, `minYear`, `maxYear`, `page`)
- También acepta `q` con string de parámetros encodeado (legacy)
- Devuelve `{ results: [...], pagination: { currentPage, totalPages, totalRecords } }`
- `totalPages` se extrae del script embebido de animeav1.com (regex `totalPages:(\d+)`)

---

## Archivos Principales

### Backend: `backend/server.js`
- Inicia servidor Express en puerto 3000 (o variable `PORT`)
- Usa Axios + Cheerio para scraping rápido (sin Puppeteer)
- Implementa 5 endpoints de API (ver tabla arriba)
- Usa caching con `Map` y timestamps
- Maneja parámetros individuales y formato legacy `q` en `/search`
- **SCRAPING_TARGET** configurable via `.env` (default: `https://animeav1.com`)

### Frontend: `frontend/index.html`
- Muestra últimos episodios en grilla
- Barra de búsqueda con soporte para tecla Enter
- Sección de favoritos con icono SVG (marcador + estrella)
- Botón de cambio de tema
- Navbar: solo icono amarillo de favoritos (sin texto)
- **Carrusel fijo** con datos hardcodeados en 4K
- **Error visual** con botón REINTENTAR y spinner Sharingam

### Frontend: `frontend/anime.html`
- Navbar unificada idéntica a `index.html` (fixed, logo, búsqueda, CATALOGO, icono favoritos, toggle tema)
- Info de anime (sinopsis, rating con ⭐ amarillo sobre fondo blanco, **tipo** (TV Anime/Película/OVA/Especial), géneros, año)
- Grilla de episodios con thumbnails y paginación deslizante (5 botones + botones < > >>)
- Búsqueda/filtro de episodios
- Reproductor con selección de servidor
- Muestra favoritos
- Botón de favoritos sobre imagen de portada (icono SVG animado)
- **sessionStorage**: cachea la info del anime para carga instantánea al volver
- **Título dinámico**: la pestaña muestra el nombre del anime
- **Error visual** con botón REINTENTAR y spinner Sharingam

### Frontend: `frontend/explorar.html`
- Filtros avanzados: género (46 opciones), año (1990-2026), tipo, estado, orden, letra
- Resultados paginados con paginación profesional (1,2,3,...,N,>>)
- Paginación dinámica que muestra rango alrededor de la página actual + ellipsis
- Limpieza de resultados al cambiar de página (evita acumulación)
- Botón de favoritos en tarjetas (icono SVG animado)
- **Prefetch anticipado**: al pasar mouse sobre un número de página, carga en background
- **Error visual** con botón REINTENTAR y spinner Sharingam

---

## Detalles de Implementación

### Scraping
- **Target**: Configurable via `SCRAPING_TARGET` en `.env`
- **Métodos**:
  - Axios para peticiones HTTP rápidas
  - Cheerio para extraer datos del HTML
  - Parseo de scripts embebidos para episodios y metadatos

### Estrategia de Caching
- Usa caché en memoria con `Map` de JavaScript y verificación de timestamps
- **No persistente** entre reinicios del servidor
- Tiempos configurados por endpoint (ver tabla de API)
- **Promise caching** en `getHomepage()`: si expira el caché y llegan múltiples requests, solo 1 fetch a animeav1.com

### Optimizaciones de Red
- **keepAlive agents**: Reutiliza conexiones TCP (~30% más rápido en requests consecutivos)
- **axios-retry**: 3 reintentos con exponential backoff en errores de red/timeout
- **compression middleware**: Respuestas JSON comprimidas con gzip (~70% más pequeñas)
- **Cache-Control headers**: `public, max-age=300` en todas las respuestas
- **Rate Limiting**: 100 requests por ventana de 15 minutos

### Headers
- Usa User-Agent personalizado para evitar bloqueos básicos

### Diseño Responsive
- Todos los HTML incluyen media queries CSS para móviles

### Sin Proceso de Build
- HTML/CSS/JS puro sin transpilación o bundling

### Validación de Parámetros
- Todos los endpoints validan parámetros requeridos y devuelven errores 400/500 descriptivos con `e.message`

---

## Deployment

### Render (Producción) - Backend
- URL: `https://animelandia-api-6wp2.onrender.com`
- Referenciada en archivos HTML frontend para llamadas API

#### Variable de Entorno Requerida en Render
Agregar en Render Dashboard → Environment:
- Key: `SCRAPING_TARGET`
- Value: `https://animeav1.com`

#### Mantener Despierto con UptimeRobot
Render duerme el servicio gratis tras 15 min de inactividad. Para mantenerlo activo:
1. Crear cuenta en https://uptimerobot.com
2. Add New Monitor → HTTP(s)
3. Friendly Name: `Animelandia API`
4. URL: `https://animelandia-api-6wp2.onrender.com/health`
5. Interval: 5 minutes
6. Crear monitor

### Docker
- Base: Node.js 20
- Instala dependencias npm estándar
- Expone puerto 3000
- WORKDIR: `/app/backend`
- Entry point: `node server.js`

---

## Cosas a Tener en Mente

1. **Sin README**: No hay documentación previa - este archivo es el primero
2. **Sin Tests**: No hay framework de testing configurado
3. **Sin TypeScript**: Proyecto en JavaScript puro
4. **Estructura Separada**: Backend y frontend organizados en carpetas dedicadas (backend/ y frontend/)
5. **Dependencias de Scraping**: Si animeav1.com cambia su estructura HTML, el scraping se romperá
6. **Caché Volátil**: El caché en memoria se pierde con reinicios del servidor
7. **Sin Puppeteer**: Migrado a Axios + Cheerio para mayor velocidad (67% más rápido)
8. **Sharingam.png**: Debe estar commiteado en git para que Netlify lo sirva
9. **SCRAPING_TARGET**: En producción (Render), debe configurarse como variable de entorno

---

## Ejecución Local

- **Backend**: `cd backend` → `npm start` (puerto 3000)
- **Frontend**: Servir `frontend/` con Live Server (VS Code) o `npx serve frontend`
- **API_URL**: Los 3 HTML detectan `localhost` y `127.0.0.1` (Live Server usa 127.0.0.1)
- En desarrollo apuntan a `http://localhost:3000`, en producción a `https://animelandia-api-6wp2.onrender.com`

---

## Scripts Disponibles

```bash
npm start          # Inicia servidor (node server.js)
npm test           # Test placeholder (no implementado)
```

---

## Información de Licencia
- **License**: ISC (según package.json)
- **No hay archivo LICENSE**: Considerar agregar uno si se va a hacer público

---

## 📖 Recursos de Aprendizaje

Para aprender todo sobre este proyecto, leé el archivo **`aprendizaje.md`**.
Fue escrito como una clase completa que cubre:
- Arquitectura y flujo de datos
- Tecnologías usadas y por qué
- Desafíos enfrentados (paginación, scraping, CORS)
- Lecciones para el mercado laboral
- Plan de estudio para mañana (variables de entorno, spinners, etc.)
- Mensaje de motivación personalizado 💪

---

## Cambios Recientes - Sesión de Optimización (Mayo 2026)

> Todos los commits pusheados a `main`.

### 🚀 Backend - Velocidad de Scraping

| Commit | Descripción |
|--------|-------------|
| `cc22947` | **feat: homepage cache + keepAlive + axios-retry** — Homepage cache compartido entre `/latest` y `/featured`. keepAlive agents reusan conexiones TCP. axios-retry con 3 reintentos y exponential backoff. |
| `d525c41` | **refactor: simplificar parser de /featured** — Reducción de ~200 a ~50 líneas. Eliminadas 4 funciones duplicadas (`extractString`, `extractNumber`, `extractTopLevelString`, `extractTopLevelNumber`) reemplazadas por 1 helper compartido. |
| `5f772f9` | **feat: cache de 30min en /get-video** — Los servidores de video se cachean 30 min. Volver a un episodio ya visto es instantáneo. |
| `97bf4dd` | **feat: promise caching en getHomepage** — Si expira el caché y llegan requests simultáneos, solo 1 fetch a animeav1.com. El resto espera la misma Promise. |
| `e0c98f5` | **feat: compression middleware gzip** — Respuestas JSON ~70% más pequeñas al cliente. |
| `1d99f2f` | **feat: cache de 5min en /search** — Búsquedas repetidas no vuelven a scrapear. |
| `40d9e12` | **feat: validación de parámetros + errores detallados** — Todos los endpoints devuelven errores 400/500 descriptivos con `e.message`. |
| `4fd5a59` | **feat: rate limiting** — 100 requests por 15 minutos. Protege el servicio gratuito de Render. |
| `f82d51b` | **feat: variables de entorno (.env)** — `SCRAPING_TARGET` configurable via `.env`. Ya no hay URLs hardcodeadas. |

### 🎨 Frontend - Experiencia de Usuario

| Commit | Descripción |
|--------|-------------|
| `b71496d` | **feat: prefetch en catálogo** — `mouseenter` sobre un link de página fetchea en background. Navegación instantánea. |
| `e7221bc` | **feat: fadeIn en cards** — Animación CSS `fadeIn` (opacity 0→1, translateY 8px→0) en 0.3s. Cards aparecen suaves. |
| `0566107` | **feat: dns-prefetch + preconnect** — Tags en `<head>` para anticipar conexión a API y CDN de imágenes. |
| `c20087f` | **feat: sessionStorage en anime-info** — La info del anime se guarda en sessionStorage. Al volver a un anime visto, carga instantáneo sin fetch. |
| `be559e3` | **feat: manejo de errores visual** — Contenedor de error estilizado (rojo) con botón REINTENTAR y spinner Sharingam en los 3 HTMLs. |
| `7124950` | **feat: título dinámico** — La pestaña muestra "Naruto - Animelandia" en vez de "Animelandia - Detalles". |
| `dee8fde` | **fix: Sharingam.png faltante** — El archivo no estaba commiteado en git. Netlify no lo servía. |

### Resumen de Estado Actual

- ✅ Todos los endpoints con caché y validación
- ✅ Scraping optimizado: keepAlive, retry, compression, promise dedup
- ✅ Rate limiting protegiendo el backend
- ✅ Variables de entorno para scraping target
- ✅ Errores visuales con reintentar en frontend
- ✅ Prefetch en paginación de catálogo
- ✅ sessionStorage para carga instantánea en anime-info
- ✅ FadeIn en cards + dns-prefetch
- ✅ Título dinámico en pestaña
- ✅ Spinner Sharingam funcionando en producción
