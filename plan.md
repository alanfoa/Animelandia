# Plan de Mejoras — Animelandia

> **Progreso total:** 0/25 tareas completadas (0%)
>
> _Ultima actualización: Junio 2026_

---

## Fase 1: Alto impacto / Poco esfuerzo ⚡

- [ ] **1. Extraer CSS compartido** — Unificar ~150 líneas de navbar/tema replicadas en los 3 HTMLs en un solo `frontend/styles.css` (mantenibilidad)
- [ ] **2. Meta tags OG + Twitter Cards** — Vista previa al compartir en WhatsApp, Discord, Telegram (social proof)
- [ ] **3. Persistir filtros en URL** — `explorar.html`: guardar `?genre=&year=&type=` en el `location.search` para compartir/bookmarkear filtros
- [ ] **4. sessionStorage con TTL** — Cachear anime-info con expiración (ej: 1 hora) para detectar episodios nuevos sin cerrar pestaña
- [ ] **5. Toast al togglear favoritos** — Mini notificación "Agregado a favoritos ❤️" / "Eliminado 💔" con fade-out
- [ ] **6. Scroll-to-top flotante** — Botón en esquina inferior derecha en páginas con scroll largo (explorar, anime)
- [ ] **7. Typo "seu" → "su"** — "Busque seu anime favorito..." es portugués, debe ser español
- [ ] **8. Share button en anime** — Botón "Compartir" con Web Share API (nativo en mobile, fallback a copiar link)
- [ ] **9. Atajo Ctrl+K / &#47; para buscar** — Enfocar el input de búsqueda con teclado

### Progreso Fase 1: 0/9 (0%)

---

## Fase 2: Medio impacto / Esfuerzo medio 🚀

- [ ] **10. Rate limiter roto** — Está montado en `/api/` pero las rutas son en `/`. Mover a `app.use(limiter)` sin prefijo
- [ ] **11. Caché con límite** — `INFO_CACHE`, `VIDEO_CACHE`, `SEARCH_CACHE` crecen sin control. Implementar `lru-cache` o setInterval de limpieza
- [ ] **12. Página 404 personalizada** — `404.html` con diseño Animelandia y botón "Volver al inicio"
- [ ] **13. Skeleton screens** — Mostrar placeholders grises del tamaño de las cards mientras carga (reemplazar/complementar spinner Sharingan)
- [ ] **14. `loading="lazy"` en imágenes** — Agregar `loading="lazy"` a thumbnails de episodios, cards de catálogo, favoritos
- [ ] **15. Accesibilidad básica** — `aria-label` en botones (toggle tema, carrusel, favoritos), `role="alert"` en errores, `aria-pressed` en favoritos
- [ ] **16. Graceful shutdown** — Capturar `SIGTERM`/`SIGINT` para cerrar conexiones limpiamente (Render lo exige)
- [ ] **17. Error 404 handler (backend)** — Express devuelve HTML en rutas no encontradas; debe responder JSON `{ error: "Route not found" }`
- [ ] **18. Centralizar error handling** — Middleware global de errores Express en vez de try/catch duplicados en cada endpoint
- [ ] **19. Logging con Morgan** — Reemplazar `console.log` esparcidos por request logging estructurado
- [ ] **20. CORS restrictivo** — Solo permitir orígenes conocidos (Netlify, localhost) en vez de `app.use(cors())` genérico

### Progreso Fase 2: 0/11 (0%)

---

## Fase 3: Extra — para romperla 🏆

- [ ] **21. PWA Manifest + Service Worker** — `manifest.json`, `apple-touch-icon`, `theme-color`, SW para cachear shell y offline
- [ ] **22. Helmet + seguridad** — Headers HTTP (`X-Content-Type-Options`, `Strict-Transport-Security`, etc.), validación de env vars al iniciar
- [ ] **23. Transiciones entre páginas** — Eliminar el flash blanco al navegar entre index/anime/explorar con CSS transitions o `instant.page`
- [ ] **24. JSON-LD structured data** — Datos estructurados para que Google muestre rich snippets (rating, episodios, fecha) en resultados de búsqueda
- [ ] **25. Dockerfile funcional** — Arreglar `WORKDIR` y agregar `.dockerignore` (actualmente no arranca el contenedor)

### Progreso Fase 3: 0/5 (0%)

---

## Resumen

| Fase | Tareas | Completadas | Progreso |
|------|--------|-------------|----------|
| Fase 1: Alto impacto | 9 | 0 | 0% |
| Fase 2: Medio impacto | 11 | 0 | 0% |
| Fase 3: Extra | 5 | 0 | 0% |
| **Total** | **25** | **0** | **0%** |
