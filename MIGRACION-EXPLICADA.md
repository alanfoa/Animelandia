# Migración Explicada: De JavaScript Vanilla a React + TypeScript

> Fecha: Mayo 2026
> Objetivo: Entender qué hicimos, por qué lo hicimos y qué nos falta

---

## 🤔 ¿Qué teníamos antes? (JavaScript Vanilla)

Imaginate que **Animelandia** era como una casa construida pieza por pieza con herramientas básicas:

### Estructura Anterior
```
frontend/
├── index.html      ← Página principal (últimos episodios)
├── anime.html      ← Página de detalles de anime
├── explorar.html   ← Página de catálogo
└── assets/
    └── img/
        └── Logo.png
```

### Problema #1: Tres archivos HTML separados
- Cada página era un archivo `.html` diferente
- Si cambiabas el menú en `index.html`, tenías que copiarlo manualmente a `anime.html` y `explorar.html`
- Si querías pasar datos de una página a otra, usabas URLs largas: `/anime?slug=xxx&titulo=yyy&imagen=zzz`

### Problema #2: JavaScript pegado en el HTML
- El código JavaScript estaba metido dentro de etiquetas `<script>` en cada HTML
- No había "componentes reutilizables"
- Si querías un botón de favoritos en varios lados, copiabas y pegabas el código

### Problema #3: Sin tipos (JavaScript puro)
- Podías escribir `anime.titulo` y funcionaba
- Pero también podías escribir `anime.chabacano` y no te daba error hasta que ejecutaras la página
- Errores en tiempo de ejecución (runtime errors)

---

## 🚀 ¿Qué hicimos hoy? (Migración a React + TypeScript + Vite)

### Paso 1: ¿Por qué migrar a React?

**React** es una biblioteca de JavaScript para construir interfaces de usuario con **componentes reutilizables**.

#### Analogía simple:
- **Antes**: Tenías 3 casas separadas (3 HTMLs) y si cambiabas la puerta en una, tenías que cambiarla en las otras 2 manualmente
- **Ahora**: Construís una **Single Page Application (SPA)** - una sola casa donde cada "habitación" (página) es un componente de React que comparte la misma "puerta" (navbar)

#### Beneficios de React:
1. **Componentes reutilizables**: El `Navbar` se escribe UNA vez y aparece en todas las páginas
2. **State management**: Manejás el estado (ej: favoritos, tema claro/oscuro) de forma centralizada
3. **Routing**: Cambiás de página sin recargar el navegador (usando `react-router-dom`)

### Paso 2: ¿Por qué TypeScript?

**TypeScript** es JavaScript con "tipos" (etiquetas que dicen qué tipo de dato es cada cosa).

#### Ejemplo práctico:
```typescript
// JavaScript (antes) - No sabés qué devuelve la función
function getAnime(slug) {
  // ...hace algo...
  return data; // ¿Qué hay en data? ¿Un objeto? ¿Un array? ¿Qué propiedades tiene?
}

// TypeScript (ahora) - SABÉS exactamente qué devuelve
interface AnimeInfo {
  titulo: string;    // Tiene que ser texto
  imagen: string;    // Tiene que ser texto
  rating: string;    // Tiene que ser texto
  generos: string[]; // Tiene que ser un ARRAY de textos
}

function getAnime(slug: string): AnimeInfo {
  // ...hace algo...
  return data; // TypeScript te obliga a que `data` tenga la forma de `AnimeInfo`
}
```

#### Beneficios de TypeScript:
1. **Te avisa de errores ANTES de ejecutar**: Si escribís `anime.chabacano`, TypeScript te dice "eso no existe" al momento de escribir el código
2. **Autocompletado inteligente**: Al escribir `anime.`, tu editor te sugiere `titulo`, `imagen`, `rating`, etc.
3. **Refactorización segura**: Si cambiás el nombre de una propiedad, TypeScript te marca todos los lugares que necesitan actualizarse

### Paso 3: ¿Por qué Vite?

**Vite** es una herramienta de build (construcción) moderna y súper rápida.

#### Analogía:
- **Antes (sin build tool)**: Tenías que abrir cada HTML individualmente con el navegador (doble clic en `index.html`)
- **Ahora (con Vite)**: Tenés un servidor de desarrollo que:
  1. Une todos tus archivos `.tsx` en uno solo
  2. Transforma TypeScript a JavaScript que el navegador entiende
  3. Recarga la página automáticamente cuando guardás cambios

#### Comandos de Vite:
```bash
npm run dev    # Inicia servidor de desarrollo (http://localhost:5173)
npm run build  # "Compila" todo para producción (crea carpeta dist/)
```

---

## 📁 Nueva Estructura de Carpetas

### Antes (JavaScript Vanilla)
```
frontend/
├── index.html
├── anime.html
├── explorar.html
└── assets/
```

### Ahora (React + TypeScript + Vite)
```
frontend/
├── index.html          ← Entry point único (lo carga Vite)
├── vite.config.ts      ← Configuración de Vite
├── tsconfig.json       ← Configuración de TypeScript
├── package.json        ← Dependencias (react, react-router-dom, etc.)
└── src/
    ├── main.tsx         ← Punto de entrada (le dice a React dónde renderizar)
    ├── App.tsx          ← Router principal (define las rutas /, /anime/:slug, /catalog)
    ├── index.css        ← Estilos globales + variables CSS para tema
    ├── vite-env.d.ts    ← Declaraciones para que TypeScript entienda Vite
    ├── api/
    │   ├── client.ts    ← Configuración de Axios (cliente HTTP)
    │   ├── animeApi.ts  ← Funciones para llamar a tu backend (getLatest, searchAnime, etc.)
    │   └── types.ts     ← Tipos compartidos (Anime, Episode, AnimeInfo, etc.)
    ├── components/
    │   ├── Navbar.tsx       ← Barra de navegación (aparece en todas las páginas)
    │   └── FavoriteIcon.tsx ← Ícono de favoritos (SVG animado)
    ├── pages/
    │   ├── HomePage.tsx     ← Página principal (equivale a index.html)
    │   ├── AnimeDetail.tsx  ← Página de detalles (equivale a anime.html)
    │   └── CatalogPage.tsx  ← Catálogo con filtros (equivale a explorar.html)
    └── context/
        └── ThemeContext.tsx  ← Manejo del tema claro/oscuro
```

---

## 🔍 ¿Qué hicimos paso a paso hoy?

### 1. ✅ Migramos el Backend a TypeScript (Fase 1 - Completada)
**Archivo**: `backend/server.js` → `backend/server.ts`

**Qué hicimos**:
- Instalamos `typescript`, `@types/node`, `@types/express`, etc.
- Creamos `backend/tsconfig.json` (configuración de TypeScript)
- Creamos `backend/types.d.ts` (tipos para el backend)
- Cambiamos `server.js` a `server.ts` agregando tipos:
  ```typescript
  interface CacheEntry {
    data: any;
    timestamp: number;
  }
  
  interface AnimeInfo {
    titulo: string;
    descripcion: string;
    // etc...
  }
  ```
- Configuramos variables de entorno (`.env`) con `SCRAPING_TARGET` y `PORT`
- Agregamos validaciones de parámetros (si falta `?slug=`, devolvemos error 400)

**Por qué**:
- Para que el backend sea más mantenible y tenga menos errores
- Para que sepamos qué datos devuelve cada endpoint

### 2. 🔄 Inicializamos el Frontend con Vite + React + TypeScript (Fase 2 - En progreso)
**Comando ejecutado**:
```bash
cd frontend
npm create vite@latest . -- --template react-ts
npm install
npm install react-router-dom @tanstack/react-query axios
npm install -D tailwindcss @tailwindcss/vite
```

**Qué creamos**:
1. **Vite configurado** (`vite.config.ts`):
   ```typescript
   import { defineConfig } from 'vite'
   import react from '@vitejs/plugin-react'
   import tailwindcss from '@tailwindcss/vite'
   
   export default defineConfig({
     plugins: [react(), tailwindcss()],
   })
   ```

2. **Archivos base**:
   - `src/main.tsx`: Le dice a React "renderizá la app en el div con id='root'"
   - `src/App.tsx`: Define las rutas (si vas a `/`, mostrá `HomePage`; si vas a `/anime/xxx`, mostrá `AnimeDetail`)

3. **Componentes**:
   - `Navbar.tsx`: Barra de navegación (Logo + enlaces a Catálogo + Favoritos + Tema)
   - `FavoriteIcon.tsx`: Ícono SVG de favoritos con animación

4. **Páginas**:
   - `HomePage.tsx`: Página principal con últimos animes + búsqueda + sección favoritos
   - `AnimeDetail.tsx`: Detalles del anime + lista de episodios + reproductor de video + paginación
   - `CatalogPage.tsx`: Catálogo con filtros avanzados (46 géneros, año, tipo, estado) + paginación profesional

5. **API**:
   - `api/client.ts`: Configura Axios para que apunte al backend (localhost:3000 en dev, render.com en prod)
   - `api/animeApi.ts`: Funciones para llamar a los endpoints (`getLatest()`, `searchAnime()`, `getAnimeInfo()`, `getVideoServers()`)
   - `api/types.ts`: Tipos TypeScript compartidos

6. **Context**:
   - `ThemeContext.tsx`: Maneja el tema claro/oscuro con `localStorage`

---

## 📊 Estado Actual (Resumen)

### ✅ Lo que YA funciona:
1. **Backend**: Compila con TypeScript y funciona (`npm start` en carpeta backend)
2. **Frontend**: 
   - Compila sin errores de TypeScript (`npx tsc --noEmit` ✅)
   - Build exitoso con Vite (`npm run build` ✅)
   - Servidor de desarrollo corriendo (`npm run dev` en `http://localhost:5173` ✅)

### 🔄 Lo que está EN PROGRESO (Fase 2):
1. **AnimeDetail.tsx**: Tiene la estructura pero necesita probar:
   - ✅ Paginación de episodios (ventana deslizante de 5 botones)
   - ✅ Reproductor de video con servidores múltiples
   - ✅ Botón favoritos sobre la imagen
   - ✅ Tags con hover (rating, año, tipo, géneros)
   - ⏳ Falta probar en el navegador

2. **CatalogPage.tsx**: Tiene la estructura pero necesita probar:
   - ✅ Filtros avanzados (46 géneros, año 1990-2026, tipo, estado, orden, letra)
   - ✅ Paginación profesional (1,2,3,...,N,>>)
   - ✅ Limpieza de resultados al cambiar filtros
   - ⏳ Falta probar en el navegador

3. **HomePage.tsx**: 
   - ✅ Estructura base con últimos animes
   - ✅ Búsqueda funcional
   - ✅ Sección favoritos
   - ⏳ Falta probar en el navegador

### ❌ Lo que falta COMPLETAR:
1. **Probar la aplicación en el navegador** (http://localhost:5173)
   - Ver si cargan los animes
   - Ver si funciona la búsqueda
   - Ver si funciona el reproductor de video
   - Ver si se agregan favoritos correctamente

2. **Corregir errores de runtime** (si los hay)
   - El backend devuelve los datos en el formato correcto?
   - Las rutas de React Router funcionan?
   - Los componentes se renderizan bien?

3. **Actualizar configuración de Netlify** para deploy:
   ```
   Build Command: cd frontend && npm run build
   Publish Directory: frontend/dist
   ```

4. **Hacer commit y push** a la rama `refactor/migracion-profesional`

---

## 🧠 Conceptos Clave Explicados

### ¿Qué es un Componente en React?
Es como una "función" que devuelve HTML (JSX):

```tsx
// Componente básico
function HolaMundo() {
  return <h1>Hola Mundo</h1>;
}

// Componente con props (parámetros)
interface SaludoProps {
  nombre: string;
}

function Saludo({ nombre }: SaludoProps) {
  return <h1>Hola {nombre}</h1>;
}

// Uso: <Saludo nombre="Alan" />
```

### ¿Qué es JSX?
Es una sintaxis que mezcla HTML dentro de JavaScript/TypeScript:
```tsx
// Esto es JSX (HTML dentro de TS)
<div style={{ color: 'red' }}>
  <h1>Título</h1>
  <p>Descripción</p>
</div>
```

### ¿Qué es el State en React?
Es como una "variable" que, cuando cambia, **redibuja** el componente:

```tsx
function Contador() {
  const [count, setCount] = useState(0); // State inicial = 0

  return (
    <div>
      <p>Contador: {count}</p>
      <button onClick={() => setCount(count + 1)}>Sumar</button>
    </div>
  );
}
// Cuando hacés click en "Sumar", count cambia a 1, y React redibuja el componente
```

### ¿Qué es React Router?
Es una biblioteca que te permite tener **múltiples páginas en una SPA**:

```tsx
// En App.tsx defines las rutas
<Routes>
  <Route path="/" element={<HomePage />} />
  <Route path="/anime/:slug" element={<AnimeDetail />} />
  <Route path="/catalog" element={<CatalogPage />} />
</Routes>

// Cuando vas a http://localhost:5173/anime/naruto, React muestra AnimeDetail
// Y podés leer el "slug" con: const { slug } = useParams<{ slug: string }>();
```

---

## 🎯 Próximos Pasos (Recomendados)

### 1. Probar la app en el navegador (YA)
- Abrir http://localhost:5173
- Ir a "Catálogo" y probar filtros
- Buscar un anime y hacer clic en él
- Ver si carga el reproductor de video
- Agregar a favoritos y ver si se guardan

### 2. Corregir errores que aparezcan
- Si algo no carga, abrir la consola del navegador (F12)
- Ver errores en la pestaña "Console"
- Corregir en el código y guardar (Vite recarga solo)

### 3. Commit y push
```bash
git add .
git commit -m "feat: migrate frontend to React + TypeScript + Vite (Fase 2)"
git push origin refactor/migracion-profesional
```

### 4. Actualizar Netlify para deploy
- Ir a Netlify → Site Settings → Build & Deploy
- Cambiar:
  - Build command: `cd frontend && npm run build`
  - Publish directory: `frontend/dist`

---

## 💡 Resumen para no perderse

| Concepto | Antes (Vanilla) | Ahora (React + TS) |
|----------|------------------|---------------------|
| ¿Cómo se navega? | Múltiples `.html` | `react-router-dom` (SPA) |
| ¿Cómo se reutiliza código? | Copy-paste | Componentes React |
| ¿Cómo se manejan datos? | Variables globales | State (`useState`) + Context |
| ¿Cómo se sabe qué tipos tiene? | Ninguno | TypeScript (tipos explícitos) |
| ¿Cómo se construye para prod? | No había (abrís el HTML) | Vite (`npm run build`) |
| ¿Dónde está la lógica? | `<script>` en HTML | Archivos `.tsx` separados |

---

## ✅ Checklist de lo que completamos hoy

- [x] Entender por qué migrar a React + TypeScript + Vite
- [x] Backend migrado a TypeScript (Fase 1 completa)
- [x] Frontend inicializado con Vite + React + TypeScript
- [x] Estructura de carpetas creada (`components/`, `pages/`, `api/`, `context/`)
- [x] Componentes base creados (`Navbar`, `FavoriteIcon`)
- [x] Páginas creadas (`HomePage`, `AnimeDetail`, `CatalogPage`)
- [x] API configurada (`animeApi.ts` con funciones para endpoints)
- [x] Tipos TypeScript creados (`types.ts`)
- [x] Tema claro/oscuro migrado a `ThemeContext`
- [x] Compilación exitosa (`npx tsc --noEmit` sin errores)
- [x] Build exitoso (`npm run build` funciona)
- [x] Servidor de desarrollo corriendo (`http://localhost:5173`)

---

## ❓ ¿Dudas frecuentes?

### ¿Por qué no usamos NestJS como en gestion-laboratorio?
Porque el backend de Animelandia **solo hace scraping** (peticiones HTTP y parseo de HTML). NestJS es para APIs complejas con base de datos, autenticación, etc. Expres + TypeScript es suficiente y más simple.

### ¿Por qué separamos backend y frontend en carpetas?
- **Backend** (`/backend`): Es un servidor Express que corre en un puerto (3000)
- **Frontend** (`/frontend`): Es una SPA que corre en otro puerto (5173 en dev)
- Se comunican via HTTP (el frontend hace fetch a `http://localhost:3000/latest`)

### ¿Qué es `cd frontend && npm run build` para Netlify?
Netlify necesita saber:
1. **Dónde está el código fuente**: `frontend/`
2. **Cómo construirlo**: `npm run build` (ejecuta Vite)
3. **Qué subir al CDN**: `frontend/dist/` (la carpeta que crea Vite)

---

**¡Listo! Ahora tenés una base sólida en React + TypeScript + Vite.** 🚀

La próxima clase vamos a:
1. Probar la app en el navegador
2. Corregir cualquier error que aparezca
3. Hacer commit y push
4. Configurar Netlify para el nuevo build

¿Tenés alguna duda específica sobre lo que vimos hoy?
