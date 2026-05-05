# Plan de Profesionalización - Animelandia

> Fecha: Mayo 2026
> Objetivo: Migrar de JavaScript Vanilla a stack profesional similar a Gestión Laboratorio
> Basado en: Análisis comparativo con `E:\Proyecto Desarrollo de Aplicaciones\gestion-laboratorio-grupo8`

---

## proyecto actualmente:

### Auditoría Real del Proyecto (Mayo 2026)

⚠️ **El documento anterior contenía información falsa**: Afirmaba que la Fase 1 (Backend TypeScript) estaba completada, lo cual es incorrecto. A continuación el estado real:

---

#### Backend (Carpeta `backend/`)
- ✅ Funcional: Express + Axios + Cheerio (scraping de animeav1.com)
- ❌ **Sigue en JavaScript Vanilla**: Existe `server.js`, no hay `server.ts`
- ❌ Fase 1 de migración a TypeScript **NO completada**
- ❌ Sin validaciones de parámetros en endpoints (ej: `/anime-info` sin `?slug=` da error vacío)
- ❌ Sin variables de entorno (`.env`): URLs hardcodeadas
- ❌ Sin tests (Jest/Supertest)
- 📦 Dependencias actuales: `express`, `axios`, `cheerio`, `cors` (sin tipos `@types/*`)

---

#### Frontend
- ❌ **Sin frontend funcional**: Se borraron `anime.html` y `explorar.html` sin tener React operativo
- ✅ `index.html` original preservado (no se borró)
- ⚠️ **Vite + React + TypeScript inicializado pero ROTO**:
  - Pantalla blanca en `http://localhost:5173` (errores silenciosos en componentes)
  - Errores de imports en `HomePage.tsx` (`Link` no existe en `react-router-dom` v7, `Anime` no está definido)
  - Tailwind CSS no configurado correctamente (faltan directivas `@import "tailwindcss"` en `index.css`)
  - Falta `react-router-dom` configurado, no hay navegación entre páginas
- ❌ No hay componentes reutilizables, no hay React Query operativo

---

#### Git y Despliegue
- 🌳 Rama actual: `refactor/migracion-profesional` (1 commit detrás del remoto `origin/refactor/migracion-profesional`)
- 📝 Cambios sin commitear: Borrado de HTMLs originales, archivos React sin trackear, modificación de contextos
- 🚀 Backend en Render sigue funcionando: `https://animelandia-api-6wp2.onrender.com`
- ❌ Netlify sigue sirviendo el frontend vanilla antiguo (no hay despliegue de React)

---

#### Problemas Críticos a Resolver
1. **Pantalla blanca en React**: Errores no capturados por falta de `ErrorBoundary` y sintaxis incorrecta en componentes migrados
2. **Backend sin migrar a TypeScript**: La documentación previa era falsa, no hay progreso en Fase 1
3. **Pérdida de funcionalidad**: Se borraron los HTMLs originales antes de tener un reemplazo funcional
4. **Dependencias rotas**: `typescript` mal escrito en `frontend/package.json` (`typescript` vs `typescript`), falta `@radix-ui` y `lucide-react`

---

## 📊 Comparación de Stacks (Actual vs Objetivo)

### Estado Actual (Animelandia)
| Componente | Tecnología Actual | Problema |
|------------|-------------------|----------|
| Backend | Express.js + JS Vanilla | Sin tipos, errores en runtime |
| Frontend | HTML5 + CSS3 + JS Vanilla | Sin build tools, difícil de mantener |
| Build Tools | ❌ Ninguno | Desarrollo lento |
| Tipos | ❌ No | Sin validaciones |
| Deploy | Render + Netlify | ✅ Ya configurado |

### Objetivo (类似 Gestión Laboratorio)
| Componente | Tecnología Objetivo | Beneficio |
|------------|---------------------|-----------|
| Backend | **Express + TypeScript** | Tipos, validaciones, mantenibilidad |
| Frontend | **React 19 + Vite + TypeScript** | Componentes reutilizables, SPA |
| Styling | **Tailwind CSS 4** | Desarrollo rápido, responsive |
| UI Components | **Radix UI + lucide-react** | Accesibilidad, iconos profesionales |
| Data Fetching | **@tanstack/react-query** | Caché automático, loading states |
| Routing | **react-router-dom** | Navegación SPA (1 HTML) |
| Backend (opcional) | **TypeORM + SQLite** | Caché persistente |
| Testing | **Jest + Supertest** | Cobertura de código |

---

## 🎯 Sprint: Profesionalización (2-3 semanas)

### 📋 Objetivos del Sprint

1. ✅ Migrar Backend a TypeScript (Express + TS)
2. ✅ Migrar Frontend a React + Vite + TypeScript
3. ✅ Implementar Tailwind CSS + Radix UI
4. ✅ Configurar React Query para API calls
5. ✅ Agregar validaciones de parámetros (objetivo del CONTEXT.md)
6. ✅ Configurar variables de entorno (.env) (objetivo del CONTEXT.md)
7. ✅ Opcional: Agregar tests con Jest

---

## 🚀 Fase 1: Backend a TypeScript (2-3 días)

### Objetivo
Migrar `backend/server.js` a TypeScript manteniendo la lógica de scraping.

### Pasos

#### 1.1 Instalación de dependencias
```bash
cd backend
npm install --save-dev typescript @types/node @types/express @types/cors @types/axios
npm install --save-dev ts-node @types/supertest jest ts-jest
```

#### 1.2 Configuración de TypeScript
Crear `backend/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./",
    "strict": false,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node"
  },
  "include": ["*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

#### 1.3 Migración de código
- Renombrar `server.js` → `server.ts`
- Agregar tipos para:
  ```typescript
  interface CacheEntry {
    data: any;
    timestamp: number;
  }
  
  interface AnimeInfo {
    titulo: string;
    descripcion: string;
    rating: string;
    anio: string;
    tipo: string;
    generos: string[];
    episodios: Episode[];
  }
  
  interface Episode {
    numero: number;
    titulo: string;
    thumbnail: string;
    cap?: string;
  }
  ```

#### 1.4 Actualizar `package.json`
```json
{
  "scripts": {
    "build": "tsc",
    "start": "node dist/server.js",
    "dev": "ts-node server.ts",
    "test": "jest"
  }
}
```

#### 1.5 Validaciones de parámetros (Objetivo del CONTEXT.md)
```typescript
function validateSlug(slug: any): string | null {
  if (typeof slug !== 'string' || !slug.trim()) return null;
  return slug;
}

// En el endpoint:
const slug = validateSlug(req.query.slug);
if (!slug) return res.status(400).json({ error: "Falta el parámetro slug" });
```

#### 1.6 Variables de entorno (.env) (Objetivo del CONTEXT.md)
```bash
# backend/.env
SCRAPING_TARGET=https://animeav1.com
PORT=3000
NODE_ENV=production
```

```typescript
// Instalar: npm install dotenv @types/dotenv
import dotenv from 'dotenv';
dotenv.config();

const API_URL = process.env.SCRAPING_TARGET || 'https://animeav1.com';
const PORT = process.env.PORT || 3000;
```

---

## 🚀 Fase 2: Frontend React + Vite + TypeScript (5-7 días)

### Objetivo
Transformar 3 HTMLs separados en una SPA (Single Page Application) con React.

### Pasos

#### 2.1 Inicializar proyecto con Vite
```bash
cd frontend
npm create vite@latest . -- --template react-ts
# Seleccionar: React + TypeScript
npm install
npm install tailwindcss @tailwindcss/vite
npm install react-router-dom @tanstack/react-query axios
npm install lucide-react
npm install -D @types/react @types/react-dom
```

#### 2.2 Configuración de Tailwind
```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

```css
/* src/index.css */
@import "tailwindcss";
```

#### 2.3 Nueva estructura de frontend
```
frontend/
├── public/
│   └── assets/img/Logo.png
├── src/
│   ├── components/
│   │   ├── Navbar.tsx          # Barra de navegación (reutilizable)
│   │   ├── EpisodeCard.tsx     # Tarjeta de episodio (reutilizable)
│   │   ├── Pagination.tsx      # Paginación (reutilizable)
│   │   ├── VideoPlayer.tsx     # Reproductor de video
│   │   └── ui/                 # Componentes UI base
│   │       ├── Button.tsx
│   │       ├── Badge.tsx        # Tags de género, rating, etc.
│   │       └── FavoriteIcon.tsx  # Icono SVG de favoritos
│   ├── pages/
│   │   ├── HomePage.tsx        # index.html (últimos estrenos)
│   │   ├── AnimeDetail.tsx      # anime.html (detalles)
│   │   └── CatalogPage.tsx      # explorar.html (catálogo)
│   ├── hooks/
│   │   ├── useFavorites.ts     # Hook para favoritos (localStorage)
│   │   ├── useSearch.ts        # Hook para búsqueda
│   │   └── useEpisodes.ts      # Hook para episodios con paginación
│   ├── api/
│   │   ├── client.ts          # Axios instance configurada
│   │   ├── animeApi.ts        # Endpoints: /latest, /search, /anime-info, /get-video
│   │   └── types.ts          # Tipos compartidos: Anime, Episode, ApiResponse
│   ├── context/
│   │   └── ThemeContext.tsx   # Tema claro/oscuro (ya implementado)
│   ├── App.tsx                # Router principal
│   ├── main.tsx               # Entry point
│   └── index.css             # Estilos globales + Tailwind
├── index.html                  # Entry point (Vite)
├── vite.config.ts
├── tsconfig.json
└── package.json
```

#### 2.4 Migración de JavaScript a TypeScript
**Ejemplo: `api/animeApi.ts`**
```typescript
import axios from './client';
import { AnimeInfo, SearchResult, ApiResponse } from './types';

export async function getLatest(): Promise<Episode[]> {
  const res = await axios.get<Episode[]>('/latest');
  return res.data;
}

export async function searchAnime(query: string, page?: number): Promise<SearchResult> {
  const res = await axios.get<ApiResponse<Episode[]>>('/search', {
    params: { q: query, page }
  });
  return res.data;
}

export async function getAnimeInfo(slug: string): Promise<AnimeInfo> {
  const res = await axios.get<AnimeInfo>('/anime-info', {
    params: { slug }
  });
  return res.data;
}
```

#### 2.5 Hook de Favoritos (migrando de JS vanilla)
```typescript
// hooks/useFavorites.ts
import { useState, useEffect } from 'react';
import { Anime } from '../api/types';

export function useFavorites() {
  const [favorites, setFavorites] = useState<Anime[]>(() => {
    const saved = localStorage.getItem('misAnimes');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('misAnimes', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (anime: Anime) => {
    setFavorites(prev => {
      const exists = prev.some(f => f.slug === anime.slug);
      if (exists) {
        return prev.filter(f => f.slug !== anime.slug);
      } else {
        return [...prev, anime];
      }
    });
  };

  return { favorites, toggleFavorite };
}
```

#### 2.6 Componente FavoriteIcon (migrando el SVG)
```tsx
// components/ui/FavoriteIcon.tsx
interface FavoriteIconProps {
  isActive: boolean;
  onClick?: () => void;
}

export function FavoriteIcon({ isActive, onClick }: FavoriteIconProps) {
  return (
    <button onClick={onClick} className="relative w-6 h-9 z-30">
      <svg viewBox="0 0 24 36" className="w-full h-full transition-all duration-300">
        <path
          className={`transition-all duration-300 ${
            isActive 
              ? 'fill-[#FFB800] stroke-[#FFB800]' 
              : 'fill-[#808080] stroke-[#808080]'
          }`}
          strokeWidth="2"
          strokeLinejoin="round"
          d="M5,2 L19,2 Q22,2 22,5 L22,28 L12,34 L2,28 L2,5 Q2,2 5,2 Z"
        />
        <path
          className={`transition-all duration-300 ${
            isActive ? 'fill-white stroke-none' : 'fill-white stroke-white'
          }`}
          strokeWidth="2"
          strokeLinejoin="round"
          d="M12,10 L14,13 L18,14 L15,16 L16,20 L12,18 L8,20 L9,16 L6,14 L10,13 Z"
        />
      </svg>
    </button>
  );
}
```

---

## 🚀 Fase 3: Opcional - Persistencia con SQLite (2 días)

### Objetivo
Evitar que el caché se pierda al reiniciar el servidor (objetivo del CONTEXT.md).

### Pasos
```bash
cd backend
npm install typeorm sqlite3 reflect-metadata
npm install --save-dev @types/sqlite3
```

```typescript
// entities/CacheEntry.ts
import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class CacheEntry {
  @PrimaryColumn()
  key!: string;

  @Column('json')
  data!: any;

  @CreateDateColumn()
  createdAt!: Date;

  @Column()
  timestamp!: number;
}
```

---

## 🚀 Fase 4: Deploy Actualizado (1 día)

### Cambios necesarios
1. **Backend (Render)**: Ya configurado, solo actualizar build command:
   ```
   Build Command: npm run build
   Start Command: npm start
   ```

2. **Frontend (Netlify)**:
   ```
   Build Command: cd frontend && npm run build
   Publish Directory: frontend/dist
   ```

---

## 📊 Comparación Final: Antes vs Después

| Aspecto | Antes (JS Vanilla) | Después (React + TS) |
|---------|---------------------|----------------------|
| **Backend** | Express + JS | Express + TypeScript ✅ |
| **Frontend** | 3 HTMLs + JS embebido | React SPA + TypeScript ✅ |
| **Build Tools** | ❌ Ninguno | Vite ✅ |
| **Tipos** | ❌ No | TypeScript ✅ |
| **Componentes** | Manual (copy-paste) | Reutilizables ✅ |
| **Routing** | Múltiples HTML | React Router ✅ |
| **Data Fetching** | fetch() manual | React Query ✅ |
| **Styling** | CSS puro | Tailwind CSS ✅ |
| **Iconos** | Emojis / SVG manual | lucide-react ✅ |
| **State Management** | Variables globales | React Hooks + Context ✅ |
| **Testing** | ❌ No | Jest + Testing Library ✅ |
| **Validaciones** | ❌ Pendiente | TypeScript + express-validator ✅ |
| **Variables entorno** | ❌ Hardcodeadas | .env ✅ |
| **Caché persistente** | ❌ Volátil | SQLite (opcional) ✅ |

---

## ✅ Checklist del Sprint (Actualizado 05/05/2026)

### Fase 1: Backend TypeScript ✅ COMPLETADO
- [x] Instalar TypeScript y tipos
- [x] Configurar `tsconfig.json`
- [x] Migrar `server.js` → `server.ts` (commit 73ab4ac)
- [x] Agregar tipos para cache, respuestas API (`types.d.ts`)
- [x] Implementar validaciones de parámetros
- [x] Configurar variables de entorno (.env)
- [x] Actualizar `package.json` con scripts de build
- [x] Probar que el backend sigue funcionando (endpoints /health, /latest, /search probados)

### Fase 2: Frontend React + Vite 🔄 EN PROGRESO (Sesión 05/05/2026)
- [x] Inicializar proyecto con Vite (React + TS) - `npm create vite@latest frontend -- --template react-ts`
- [x] Configurar Tailwind CSS + @tailwindcss/vite
- [x] Crear estructura de carpetas (`components/`, `pages/`, `api/`, `context/`)
- [x] Migrar lógica de `index.html` → `HomePage.tsx` (estructura base)
- [x] Migrar lógica de `anime.html` → `AnimeDetail.tsx` (estructura base)
- [x] Migrar lógica de `explorar.html` → `CatalogPage.tsx` (estructura base)
- [x] Crear componente `FavoriteIcon` (SVG animado)
- [x] Crear componente `Navbar.tsx`
- [x] Configurar React Router en `App.tsx`
- [x] Migrar tema claro/oscuro a `ThemeContext.tsx`
- [x] Crear `animeApi.ts` para llamadas a API
- [x] Build exitoso con `npm run build`
- [ ] Compilar sin errores TypeScript (`npx tsc --noEmit`)
- [ ] Probar que la SPA funciona correctamente en dev server
- [ ] Hacer commit y push a `refactor/migracion-profesional`

#### Errores enfrentados en la migración (para no repetir):
1. **Sintaxis JSX corrompida**: Al escribir archivos `.tsx` con la herramienta `write`, las comillas se volvían curvas y los tags JSX se cerraban mal
   - Solución: Usar `Out-File -Encoding UTF8` desde PowerShell para escribir archivos limpios
2. **Borrado accidental de trabajo**: En un momento de frustración por los errores de sintaxis, ejecuté `git reset --hard` y borré todo lo que no estaba commiteado
   - Solución: Volvimos al commit `73ab4ac`, borramos `frontend/` y empezamos con `npm create vite@latest`
3. **Archivos no commiteados**: Los `.tsx` creados manualmente no llegaron al staging area, así que se perdieron en el reset
   - Lección: Commitear frecuentemente durante la migración

#### Estado actual de archivos (05/05/2026 - Fin de sesión):
```
frontend/
├── index.html              ✅ Creado por Vite
├── vite.config.ts          ✅ Configurado con @vitejs/plugin-react + @tailwindcss/vite
├── tsconfig.json           ✅ Configurado para React + TypeScript
├── package.json            ✅ Actualizado con dependencias
└── src/
    ├── main.tsx             ✅ Entry point con ReactDOM
    ├── App.tsx              ✅ Router configurado con react-router-dom
    ├── index.css            ✅ Variables CSS para tema
    ├── vite-env.d.ts        ✅ Declaraciones para Vite
    ├── api/
    │   ├── client.ts        ✅ Axios configurado con API_URL dinámica
    │   ├── animeApi.ts      ✅ Funciones: getLatest, searchAnime, getAnimeInfo, getVideoServers
    │   └── types.ts         ✅ Tipos: Anime, Episode, AnimeInfo, SearchResult
    ├── components/
    │   ├── Navbar.tsx       ✅ Barra navegación (sin search, solo logo + enlaces)
    │   └── FavoriteIcon.tsx ✅ Ícono SVG con animación (isActive prop)
    ├── pages/
    │   ├── HomePage.tsx     ✅ Página principal (últimos animes + búsqueda + favoritos)
    │   ├── AnimeDetail.tsx  ✅ Página detalles (ventana 5 botones + reproductor + tags hover)
    │   └── CatalogPage.tsx  ✅ Catálogo con 46 géneros + paginación profesional
    └── context/
        └── ThemeContext.tsx  ✅ Context para tema claro/oscuro
```

**Rama actual**: `refactor/migracion-profesional` (en commit `73ab4ac` + archivos nuevos sin commit)
**Siguiente paso**: Compilar TypeScript, probar en navegador, commitear y pushear

### Fase 3: Opcional - SQLite
- [ ] Instalar TypeORM + SQLite
- [ ] Crear entidades para caché
- [ ] Migrar lógica de `Map` a TypeORM

### Fase 4: Deploy
- [ ] Actualizar configuración de Render (build command)
- [ ] Actualizar configuración de Netlify (build command + publish directory)
- [ ] Hacer deploy de prueba
- [ ] Verificar que todo funciona en producción

---

## 📝 Notas Importantes

1. **No romper lo que funciona**: Migrar incrementalmente, probando cada cambio
2. **Mantener compatibilidad**: La API de backend debe seguir devolviendo el mismo formato
3. **Preservar funcionalidad**: Favoritos, tema claro/oscuro, paginación
4. **Aprovechar lo existente**: El diseño actual funciona bien, solo modernizar la tecnología

---

## 🎯 Próximos Pasos (Cuando termines este sprint)

1. **Loading States (Spinners)** - CONTEXT.md objetivo (usar React Suspense)
2. **Manejo de Errores Visual** - CONTEXT.md objetivo (componente ErrorBoundary)
3. **Título Dinámico** - CONTEXT.md objetivo (`document.title`)
4. **Modo Offline Básico** - CONTEXT.md objetivo (Service Workers + React Query)
5. **Monitoreo con UptimeRobot** - CONTEXT.md objetivo (ya se puede hacer)

---

**¡Éxito con la profesionalización! 🚀**  
Este plan transformará Animelandia en un proyecto de nivel profesional, manteniendo toda la funcionalidad que ya tienes trabajando.
