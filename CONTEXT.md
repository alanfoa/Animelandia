# Animelandia - Context File

> Proyecto creado en verano 2025 (Argentina)
> Última actualización: Mayo 2026

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
│   ├── server.js          # Servidor Express con scraping de Puppeteer
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
| `/latest` | GET | Obtener últimos episodios | 10 minutos |
| `/search?q=` | GET | Buscar anime (texto o filtros) | Sin cache |
| `/anime-info?slug=` | GET | Detalles de anime y episodios | 1 hora |
| `/get-video?slug=&cap=` | GET | Servidores de video para episodio | Sin cache |

---

## Archivos Principales

### Backend: `backend/server.js`
- Inicia servidor Express en puerto 3000 (o variable `PORT`)
- Lanza navegador Puppeteer con modo stealth
- Implementa 4 endpoints de API (ver tabla arriba)
- Usa caching con `Map` y timestamps

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
- Filtros avanzados: género (15 opciones), año (1990-2026)
- Resultados paginados
- Funcionalidad "Cargar Más"

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
6. **Sin Variables de Entorno**: Las URLs de API están hardcodeadas en archivos HTML
7. **Caché Volátil**: El caché se pierde con reinicios del servidor
8. **Sin Puppeteer**: Migrado a Axios + Cheerio para mayor velocidad (67% más rápido)

---

## Mejoras Planeadas (Pendientes)

### 🔧 Backend (backend/server.js)

1. **Reintentos (Retry) con Axios** (Prioridad: Alta)
   - Problema: Si animeav1.com falla, usuario ve error vacío
   - Solución: Agregar `axios-retry` con 3 reintentos y exponential backoff
   - Impacto: Mayor resiliencia sin cambios visibles

2. **Validación de Parámetros** (Prioridad: Alta)
   - Problema: Llamadas sin `?slug=` causan errores
   - Solución: 
     ```javascript
     if (!slug) return res.status(400).json({ error: "Falta el parámetro slug" });
     ```

3. **Variables de Entorno** (Prioridad: Media)
   - Problema: Cambiar de sitio de scraping requiere editar código
   - Solución: Crear `backend/.env` con `SCRAPING_TARGET=https://animeav1.com`
   - Dependencias: `dotenv`

4. **Logger Estructurado** (Prioridad: Baja)
   - Problema: `console.log` sin timestamps ni niveles
   - Solución: Usar `winston` o formato consistente con timestamps

5. **Rate Limiting** (Prioridad: Media)
   - Problema: Alguien puede tumbar el servicio gratuito con bucles
   - Solución: Agregar `express-rate-limit` (100 requests/15 min)
   - Dependencias: `express-rate-limit`

### 🎨 Frontend (frontend/)

6. **Loading States (Spinners)** (Prioridad: Alta)
   - Problema: Pantalla en blanco mientras carga
   - Solución: Agregar spinners en index.html, anime.html y explorar.html
   - Implementación: CSS puro + clase `.loading`

7. **Manejo de Errores Visual** (Prioridad: Media)
   - Problema: "Error de conexión" en texto plano
   - Solución: Mensaje amigable con botón "Reintentar"
   - Implementación: `<div id="error-container">` oculto por defecto

8. **Título Dinámico** (Prioridad: Baja)
   - Problema: Pestaña siempre dice "Animelandia" en lugar del anime
   - Solución: `document.title = \`${data.titulo} - Animelandia\`;`

9. **Modo Offline Básico** (Prioridad: Baja)
   - Problema: Si backend cae, frontend no sirve
   - Solución: Cachear resultados en `localStorage` y mostrarlos si falla la red

### 📊 Infraestructura

10. **Monitoreo con UptimeRobot** (Prioridad: Baja)
    - Problema: Servicio gratuito se "duerme" por inactividad
    - Solución: Ping cada 14 min a `/health` endpoint

---

## Scripts Disponibles

```bash
npm start          # Inicia servidor (node server.js)
npm test           # Test placeholder (no implementado)
```

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
