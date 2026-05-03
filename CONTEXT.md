# Animelandia - Context File

> Proyecto creado en verano 2025 (Argentina)
> Última actualización: Mayo 2026 (Pagination fixed!)

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
- **Middleware**: CORS (v2.8.6)

### Frontend
- **Lenguajes**: HTML5, CSS3, JavaScript Vanilla (sin frameworks)
- **Estilos**: CSS con Variables CSS para theming
- **Almacenamiento**: localStorage para favoritos y preferencias de tema

### Deployment
- **Plataforma**: Render (Backend) + Netlify (Frontend)
- **URL de API**: `https://animelandia-api-6wp2.onrender.com`
- **URL de Frontend**: `https://animelandia1.netlify.app` (verificar en Netlify)
- **Containerización**: Docker con imagen base Node.js 20

---

## Estructura del Proyecto

```
E:\Github\Animelandia\
├── CONTEXT.md             # Este archivo de contexto
├── backend\               # Servidor y lógica de scraping
│   ├── server.js          # Servidor Express con scraping de Axios + Cheerio
│   ├── package.json       # Dependencias y scripts
│   ├── package-lock.json  # Lock file de dependencias
│   ├── Dockerfile         # Configuración Docker
│   ├── render-build.sh    # Script de build (para Render.com, no usado)
│   └── .gitignore         # Ignora node_modules/ y .env
└── frontend\              # Interfaz de usuario
    ├── index.html         # Homepage - últimos episodios
    ├── anime.html         # Página de detalles de anime
    ├── explorar.html      # Catálogo con filtros
    └── assets\
        └── img\
            └── Logo.png   # Logo del proyecto
```

**Nota**: Proyecto separado en backend/ y frontend/ para mejor organización.

---

## API Endpoints (server.js)

| Endpoint | Método | Propósito | Cache |
|----------|--------|-----------|-------|
| `/health` | GET | Health check (monitoreo) | Sin cache |
| `/latest` | GET | Obtener últimos episodios | 10 minutos |
| `/search?q=&page=&...` | GET | Buscar anime (texto o filtros) + paginación | Sin cache |
| `/anime-info?slug=` | GET | Detalles de anime y episodios | 1 hora |
| `/get-video?slug=&cap=` | GET | Servidores de video para episodio | Sin cache |

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

### Frontend: `frontend/index.html`
- Muestra últimos episodios en grilla
- Barra de búsqueda con soporte para tecla Enter
- Sección de favoritos
- Botón de cambio de tema

### Frontend: `frontend/anime.html`
- Info de anime (sinopsis, rating, géneros, año)
- Grilla de episodios con thumbnails
- Búsqueda/filtro de episodios
- Reproductor con selección de servidor
- Muestra favoritos

### Frontend: `frontend/explorar.html`
- Filtros avanzados: género (46 opciones), año (1990-2026), tipo, estado, orden, letra
- Resultados paginados con paginación profesional (1,2,3,...,N,>>)
- Paginación dinámica que muestra rango alrededor de la página actual + ellipsis
- Limpieza de resultados al cambiar de página (evita acumulación)

---

## Detalles de Implementación

### Scraping
- **Target**: animeav1.com
- **Métodos**:
  - Axios para peticiones HTTP rápidas
  - Cheerio para extraer datos del HTML
  - Parseo de scripts embebidos para episodios y metadatos

### Estrategia de Caching
- Usa caché en memoria con `Map` de JavaScript y verificación de timestamps
- **No persistente** entre reinicios del servidor
- Tiempos configurados por endpoint (ver tabla de API)

### Headers
- Usa User-Agent personalizado para evitar bloqueos básicos

### Diseño Responsive
- Todos los HTML incluyen media queries CSS para móviles

### Sin Proceso de Build
- HTML/CSS/JS puro sin transpilación o bundling

---

## Deployment

### Render (Producción)
- URL: `https://animelandia-api-6wp2.onrender.com`
- Referenciada en archivos HTML frontend para llamadas API

### Docker
- Base: Node.js 20
- Instala dependencias npm estándar
- Expone puerto 3000
- WORKDIR: `/app/backend`
- Entry point: `node server.js`

### Archivo No Usado
- `render-build.sh` - Leftover de intento previo con Render.com (ya no se usa)

---

## Cosas a Tener en Mente

1. **Sin README**: No hay documentación previa - este archivo es el primero
2. **Sin Tests**: No hay framework de testing configurado
3. **Sin TypeScript**: Proyecto en JavaScript puro
4. **Estructura Separada**: Backend y frontend organizados en carpetas dedicadas (backend/ y frontend/)
5. **Dependencias de Scraping**: Si animeav1.com cambia su estructura HTML, el scraping se romperá
6. **Variables de Entorno**: Las URLs de API están hardcodeadas en archivos HTML (Pendiente: usar .env)
7. **Caché Volátil**: El caché se pierde con reinicios del servidor
8. **Sin Puppeteer**: Migrado a Axios + Cheerio para mayor velocidad (67% más rápido)

---

## Objetivos y Mejoras Futuras (Próximas Sesiones)

> Última actualización: Mayo 2026 (Paginación profesional completada y pusheada a main)

### 🔧 Backend (backend/server.js) - Prioridad Alta

1. **Variables de Entorno (.env)** - *Recomendado para mañana*
   - Problema: Cambiar de sitio de scraping requiere editar código
   - Solución: Crear `backend/.env` con `SCRAPING_TARGET=https://animeav1.com` y `API_URL`
   - Dependencias: `dotenv`
   - Impacto: Facilita deploy y configuración

2. **Validación de Parámetros** - *Recomendado para mañana*
   - Problema: Llamadas sin `?slug=` en `/anime-info` o `/get-video` causan errores
   - Solución: 
     ```javascript
     if (!slug) return res.status(400).json({ error: "Falta el parámetro slug" });
     ```
   - Impacto: Mejor manejo de errores

3. **Reintentos (Retry) con Axios** (Prioridad: Alta)
   - Problema: Si animeav1.com falla, usuario ve error vacío
   - Solución: Agregar `axios-retry` con 3 reintentos y exponential backoff
   - Impacto: Mayor resiliencia sin cambios visibles

4. **Logger Estructurado** (Prioridad: Baja)
   - Problema: `console.log` sin timestamps ni niveles
   - Solución: Usar `winston` o formato consistente con timestamps

5. **Rate Limiting** (Prioridad: Media)
   - Problema: Alguien puede tumbar el servicio gratuito con bucles
   - Solución: Agregar `express-rate-limit` (100 requests/15 min)
   - Dependencias: `express-rate-limit`

### 🎨 Frontend (frontend/) - Prioridad Media

6. **Loading States (Spinners)** - *Recomendado para mañana*
   - Problema: Pantalla en blanco mientras carga el catálogo o anime
   - Solución: Agregar spinners CSS en `index.html`, `anime.html`, `explorar.html`
   - Implementación: CSS puro + clase `.loading`
   - Impacto: UX mucho más profesional

7. **Manejo de Errores Visual** (Prioridad: Media)
   - Problema: Los errores son textos planos poco amigables
   - Solución: Mensajes con botón "Reintentar" y estilos consistentes
   - Implementación: `<div id="error-container">` oculto por defecto

8. **Título Dinámico** (Prioridad: Baja)
   - Problema: La pestaña siempre dice "Animelandia" incluso en detalles de anime
   - Solución: `document.title = \`${titulo} - Animelandia\`;`
   - Impacto: Detalle pequeño pero pulido

9. **Modo Offline Básico** (Prioridad: Baja)
   - Problema: Si backend cae, frontend no sirve
   - Solución: Cachear resultados en `localStorage` y mostrarlos si falla la red

### 📊 Infraestructura

10. **Monitoreo con UptimeRobot** (Prioridad: Baja)
    - Problema: Servicio gratuito de Render se "duerme" por inactividad
    - Solución: Ping cada 14 min al endpoint `/health`
    - Impacto: Mantiene el servicio despierto

---

---

## Cambios Recientes (Mayo 2026 - Completados y Pusheados a Main)

### ✅ Paginación Profesional Implementada (Merge a main: commit `1586c11`)

**Historial de la rama `feature/pagination`:**

1. **feat: agregar filtro de Tipo (TV Anime, Película, OVA, Especial) en catálogo**
   - Agregado dropdown de "Tipo" en `frontend/explorar.html`

2. **feat: expandir filtro de géneros a 46 opciones**
   - Actualizado select de "Género" con todos los slugs de animeav1.com

3. **feat: agregar filtro de Estado (Finalizado, En emisión, Próximamente)**
   - Dropdown de "Estado" con valores: `finished`, `airing`, `upcoming`

4. **feat: agregar filtros Ordenar por y Filtro Alfabético A-Z**
   - Dropdowns de orden y letras A-Z

5. **feat: implementar paginación profesional tipo animeav1**
   - Reemplazado botón "Cargar Más" con paginación numérica: 1,2,3,...,N,>>
   - Backend devuelve `pagination.totalPages` extraído de scripts embebidos
   - Corregido envío de filtros al backend (sin doble encodeo)

6. **fix: corregir paginación y envío de filtros al backend**
   - Solucionado bug de acumulación de resultados
   - `createPageLink()` marca página activa correctamente
   - Backend maneja parámetros individuales y formato legacy `q=`

7. **fix: cambiar URL de backend a producción para Netlify**
   - `explorar.html` apunta a `https://animelandia-api-6wp2.onrender.com`

**Estado actual:**
- ✅ Paginación funcionando en producción (Netlify + Render)
- ✅ Catálogo con filtros avanzados y paginación profesional
- ✅ Sin errores de `file://` al usar Netlify (CORS solucionado)

### Problema conocido:
- Al abrir `explorar.html` directamente desde el filesystem (`file://`), el navegador bloquea peticiones por CORS. Solución: servir con un servidor local o usar Live Server.

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
