# Plan de Mejoras — Animelandia

> **Progreso total:** 22/25 tareas completadas (88%)
>
> _Ultima actualización: Junio 2026 — Segunda sesión de mejoras_

---

## Fase 1: Alto impacto / Poco esfuerzo ⚡

- [ ] **1. Extraer CSS compartido** — Unificar ~150 líneas de navbar/tema replicadas en los 3 HTMLs en un solo `frontend/styles.css` (mantenibilidad)
- [x] **2. Meta tags OG + Twitter Cards** — Vista previa al compartir en WhatsApp, Discord, Telegram (social proof)
- [x] **3. Persistir filtros en URL** — `explorar.html`: guardar `?genre=&year=&type=` en el `location.search` para compartir/bookmarkear filtros
- [x] **4. sessionStorage con TTL** — Cachear anime-info con expiración (ej: 1 hora) para detectar episodios nuevos sin cerrar pestaña
- [x] **5. Toast al togglear favoritos** — Mini notificación "Agregado a favoritos" / "Eliminado" con fade-out
- [x] **6. Scroll-to-top flotante** — Botón en esquina inferior derecha en páginas con scroll largo (explorar, anime)
- [x] **7. Typo "seu" → "su"** — "Busque seu anime favorito..." es portugués, debe ser español
- [x] **8. Share button en anime** — Botón "Compartir" con Web Share API (nativo en mobile, fallback a copiar link)
- [x] **9. Atajo Ctrl+K / / para buscar** — Enfocar el input de búsqueda con teclado

### Progreso Fase 1: 8/9 (89%) — Falta: CSS compartido (se hará al final)

---

## Fase 2: Medio impacto / Esfuerzo medio 🚀

- [x] **10. Rate limiter roto** — Montado en `/api/` pero las rutas son en `/`. Corregido a `app.use(limiter)`
- [x] **11. Caché con límite** — `setInterval` de limpieza cada 5 minutos para evitar memory leak
- [x] **12. Página 404 personalizada** — `404.html` con diseño Animelandia y botón "Volver al inicio"
- [ ] **13. Skeleton screens** — Mostrar placeholders grises del tamaño de las cards mientras carga (reemplazar/complementar spinner Sharingan)
- [x] **14. `loading="lazy"` en imágenes** — Agregado a thumbnails de episodios, cards de catálogo y favoritos
- [x] **15. Accesibilidad básica** — `aria-label` en toggle tema y carrusel, `role="alert"` en errores
- [x] **16. Graceful shutdown** — Capturar `SIGTERM`/`SIGINT` para cerrar conexiones limpiamente
- [x] **17. Error 404 handler (backend)** — Express ahora responde JSON `{ error: "Ruta no encontrada" }`
- [x] **18. Centralizar error handling** — Middleware global de errores Express agregado
- [x] **19. Logging con Morgan** — Morgan 'short' reemplaza console.log esparcidos
- [x] **20. CORS restrictivo** — Solo orígenes conocidos (Netlify, localhost) en lista blanca

### Progreso Fase 2: 10/11 (91%) — Falta: skeleton screens en anime.html

---

## Fase 3: Extra — para romperla 🏆

- [x] **21. PWA Manifest + Service Worker** — `manifest.json`, `apple-touch-icon`, `theme-color` meta tag
- [x] **22. Helmet + seguridad** — Headers HTTP de seguridad agregados con helmet
- [x] **23. Transiciones entre páginas** — instant.page precarga links al hover, navegación instantánea
- [ ] **24. JSON-LD structured data** — Datos estructurados para rich snippets en Google (pendiente)
- [x] **25. Dockerfile funcional** — `.dockerignore` agregado, WORKDIR corregido

### Progreso Fase 3: 4/5 (80%) — Falta: JSON-LD structured data

---

## Resumen

| Fase | Tareas | Completadas | Progreso |
|------|--------|-------------|----------|
| Fase 1: Alto impacto | 9 | 8 | 89% |
| Fase 2: Medio impacto | 11 | 10 | 91% |
| Fase 3: Extra | 5 | 4 | 80% |
| **Total** | **25** | **22** | **88%** |
