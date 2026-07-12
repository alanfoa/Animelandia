const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
const https = require('https');
require('dotenv').config();

const tioanime = require('./scrapers/tioanime');

const SCRAPING_TARGET = process.env.SCRAPING_TARGET || 'https://animeav1.com';
const CORS_ORIGINS = (process.env.CORS_ORIGINS || 'https://animelandia-oficial.netlify.app,https://animelandia1.netlify.app,http://localhost:5500,http://127.0.0.1:5500').split(',');

const httpAgent = new http.Agent({ keepAlive: true, keepAliveMsecs: 30000 });
const httpsAgent = new https.Agent({ keepAlive: true, keepAliveMsecs: 30000 });
const axiosRetry = require('axios-retry');

axiosRetry.default(axios, {
    retries: 3,
    retryDelay: axiosRetry.exponentialDelay,
    retryCondition: (error) => {
        return axiosRetry.isNetworkOrIdempotentRequestError(error)
            || error.code === 'ECONNABORTED';
    }
});

const app = express();
app.use(cors({ origin: CORS_ORIGINS }));
app.use(helmet());
app.use(compression());
app.use(morgan('short'));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: "Demasiadas solicitudes. Intentalo de nuevo en 15 minutos." }
});
app.use(limiter);

app.use((req, res, next) => {
    res.set('Cache-Control', 'public, max-age=300');
    next();
});

// Health check endpoint
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: Date.now() }));

let INFO_CACHE = new Map();
let LATEST_CACHE = { data: null, lastUpdate: 0 };
let FEATURED_CACHE = { data: null, lastUpdate: 0 };
let HOMEPAGE_CACHE = { $: null, lastUpdate: 0 };
let VIDEO_CACHE = new Map();
let SEARCH_CACHE = new Map();

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

async function fetchAndParse(url) {
    const response = await axios.get(url, {
        headers: { 'User-Agent': USER_AGENT },
        timeout: 15000,
        httpAgent, httpsAgent
    });
    return cheerio.load(response.data);
}

let homepagePromise = null;

async function getHomepage() {
    const ahora = Date.now();
    if (HOMEPAGE_CACHE.$ && (ahora - HOMEPAGE_CACHE.lastUpdate < 600000)) {
        return HOMEPAGE_CACHE.$;
    }
    if (homepagePromise) return homepagePromise;
    homepagePromise = fetchAndParse(`${SCRAPING_TARGET}/`).then($ => {
        HOMEPAGE_CACHE = { $, lastUpdate: Date.now() };
        homepagePromise = null;
        return $;
    }).catch(e => {
        homepagePromise = null;
        throw e;
    });
    return homepagePromise;
}

// Limpieza periódica de caché (evita memory leak)
const CACHE_MAX_AGE = 3600000;
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of INFO_CACHE) { if (now - entry.time > CACHE_MAX_AGE) INFO_CACHE.delete(key); }
    for (const [key, entry] of VIDEO_CACHE) { if (now - entry.time > CACHE_MAX_AGE) VIDEO_CACHE.delete(key); }
    for (const [key, entry] of SEARCH_CACHE) { if (now - entry.time > CACHE_MAX_AGE) SEARCH_CACHE.delete(key); }
}, 300000);

const port = process.env.PORT || 3000;
const server = app.listen(port, '0.0.0.0', () => console.log(`📡 Sniper activo en puerto ${port}`));

// Graceful shutdown
process.on('SIGTERM', () => { console.log('🛑 SIGTERM recibido, cerrando...'); server.close(() => process.exit(0)); });
process.on('SIGINT', () => { console.log('🛑 SIGINT recibido, cerrando...'); server.close(() => process.exit(0)); });

// 1. ÚLTIMOS ESTRENOS (Home) - Axios + Cheerio
app.get('/latest', async (req, res) => {
    const { source } = req.query;

    if (source === 'tio') {
        try {
            const data = await tioanime.getLatest();
            return res.json(data.map(item => ({
                titulo: item.titulo,
                imagen: item.imagen,
                slug: item.slug,
                cap: item.cap,
                source: 'tio'
            })));
        } catch (e) { console.error('Error en /latest (tio):', e.message); return res.status(500).json({ error: e.message }); }
    }

    const ahora = Date.now();
    if (LATEST_CACHE.data && LATEST_CACHE.data.length > 0 && (ahora - LATEST_CACHE.lastUpdate < 600000)) return res.json(LATEST_CACHE.data);
    try {
        const $ = await fetchAndParse(`${SCRAPING_TARGET}/`);
        const scripts = $('script').map((i, el) => $(el).html()).get();
        const target = scripts.find(s => s && s.includes('latestEpisodes'));
        if (!target) {
            console.log('latestEpisodes not found in any script tag');
            return res.json(LATEST_CACHE.data && LATEST_CACHE.data.length > 0 ? LATEST_CACHE.data : []);
        }
        
        const results = [];
        const regex = /media:\s*\{id:\s*(\d+),\s*slug:\s*"([^"]+)",\s*title:\s*"((?:[^"\\]|\\.)+)"[^}]*\},\s*number:\s*(\d+)/g;
        let m;
        while ((m = regex.exec(target)) !== null) {
            results.push({ titulo: m[3].replace(/\\"/g, '"'), imagen: `https://cdn.animeav1.com/covers/${m[1]}.jpg`, slug: m[2], cap: m[4] });
        }
        if (results.length > 0) {
            LATEST_CACHE = { data: results.slice(0, 24), lastUpdate: ahora };
        }
        console.log(`Latest: ${results.length} episodes found`);
        res.json(results.length > 0 ? results.slice(0, 24) : (LATEST_CACHE.data || []));
    } catch (e) { console.error('Error en /latest:', e.message); res.status(500).json({ error: e.message }); }
});

// 1.5. FEATURED / CAROUSEL (Home) - Axios + Cheerio
app.get('/featured', async (req, res) => {
    const { source } = req.query;

    if (source === 'tio') {
        try {
            const data = await tioanime.getFeatured();
            return res.json(data);
        } catch (e) { console.error('Error en /featured (tio):', e.message); return res.status(500).json({ error: e.message }); }
    }

    const ahora = Date.now();
    if (FEATURED_CACHE.data && (ahora - FEATURED_CACHE.lastUpdate < 600000)) return res.json(FEATURED_CACHE.data);
    try {
        const $ = await getHomepage();
        const scripts = $('script').map((i, el) => $(el).html()).get();
        const allScripts = scripts.join('');
        
        const featuredArrayStart = allScripts.indexOf('featured:[');
        if (featuredArrayStart === -1) {
            console.log('Featured section not found');
            return res.json([]);
        }
        
        const featuredArrayEnd = allScripts.indexOf('],latestEpisodes:', featuredArrayStart);
        if (featuredArrayEnd === -1) {
            return res.json([]);
        }
        
        // Extract just the array content (without 'featured:[' prefix)
        const featuredArrayStr = allScripts.substring(featuredArrayStart + 'featured:['.length, featuredArrayEnd);
        
        // Split into individual items by finding balanced braces
        const items = [];
        let depth = 0;
        let itemStart = 0;
        let inString = false;
        let escapeNext = false;
        
        for (let i = 0; i < featuredArrayStr.length; i++) {
            const ch = featuredArrayStr[i];
            
            if (escapeNext) {
                escapeNext = false;
                continue;
            }
            
            if (ch === '\\' && inString) {
                escapeNext = true;
                continue;
            }
            
            if (ch === '"' ) {
                inString = !inString;
                continue;
            }
            
            if (!inString) {
                if (ch === '{') {
                    if (depth === 0) itemStart = i;
                    depth++;
                } else if (ch === '}') {
                    depth--;
                    if (depth === 0) {
                        items.push(featuredArrayStr.substring(itemStart, i + 1));
                    }
                }
            }
        }
        
        function getTopLevelValue(objStr, key) {
            const search = key + ':';
            let pos = 0;
            while (pos < objStr.length) {
                const idx = objStr.indexOf(search, pos);
                if (idx === -1) return null;
                
                let depth = 0, inString = false, escapeNext = false;
                for (let i = 0; i < idx; i++) {
                    const ch = objStr[i];
                    if (escapeNext) { escapeNext = false; continue; }
                    if (ch === '\\' && inString) { escapeNext = true; continue; }
                    if (ch === '"') { inString = !inString; continue; }
                    if (!inString) {
                        if (ch === '{' || ch === '[') depth++;
                        else if (ch === '}' || ch === ']') depth--;
                    }
                }
                
                if (depth === 0) {
                    const start = idx + search.length;
                    if (objStr[start] === '"') {
                        let result = '', escaped = false;
                        for (let i = start + 1; i < objStr.length; i++) {
                            const ch = objStr[i];
                            if (escaped) { result += ch; escaped = false; continue; }
                            if (ch === '\\') { escaped = true; continue; }
                            if (ch === '"') break;
                            result += ch;
                        }
                        return result;
                    }
                    const match = objStr.substring(start).match(/^(\d+)/);
                    return match ? parseInt(match[1]) : null;
                }
                pos = idx + search.length;
            }
            return null;
        }
        
        function extractTopLevelString(objStr, key) {
            const val = getTopLevelValue(objStr, key);
            return typeof val === 'string' ? val : '';
        }
        
        function extractTopLevelNumber(objStr, key) {
            const val = getTopLevelValue(objStr, key);
            return typeof val === 'number' ? val : 0;
        }
        
        const results = [];
        
        for (const itemStr of items) {
            // Extract fields using depth-tracking to get top-level properties only
            const id = extractTopLevelNumber(itemStr, 'id');
            const slug = extractTopLevelString(itemStr, 'slug');
            const title = extractTopLevelString(itemStr, 'title');
            const synopsis = extractTopLevelString(itemStr, 'synopsis');
            const startDate = extractTopLevelString(itemStr, 'startDate');
            const status = extractTopLevelNumber(itemStr, 'status');
            
            // Extract category name from category:{id:N,name:"Tipo"}
            let categoryType = '';
            const catMatch = itemStr.match(/category:\s*\{[^}]*name:\s*"([^"]+)"/);
            if (catMatch) categoryType = catMatch[1];
            
            // Extract genre names from genres array
            const genreNames = [];
            const genresMatch = itemStr.match(/genres:\s*\[([\s\S]*?)\]/);
            if (genresMatch) {
                const genreRegex = /name:"([^"]+)"/g;
                let gm;
                const genresStr = genresMatch[1];
                while ((gm = genreRegex.exec(genresStr)) !== null) {
                    genreNames.push(gm[1]);
                }
            }
            
            // Use cover image as backdrop since backdrops may not exist
            results.push({
                titulo: title,
                slug: slug,
                id: id,
                backdrop: `https://cdn.animeav1.com/covers/${id}.jpg`,
                tipo: categoryType,
                anio: startDate.split('-')[0],
                status: status,
                synopsis: synopsis.replace(/\\n/g, ' ').replace(/\\r/g, '').trim(),
                generos: genreNames.slice(0, 4)
            });
        }
        
        console.log(`Featured: found ${results.length} items`);
        FEATURED_CACHE = { data: results, lastUpdate: ahora };
        res.json(FEATURED_CACHE.data);
    } catch (e) { 
        console.error('Error en /featured:', e.message);
        res.status(500).json({ error: e.message }); 
    }
});

// 2. BUSCADOR
app.get('/search', async (req, res) => {
    const { q, page = 1, source, ...filters } = req.query;

    if (source === 'tio') {
        try {
            const tioFilters = {};
            if (filters.genre) tioFilters.genero = filters.genre;
            if (filters.category) {
                const typeMap = { 'tv-anime': '0', 'pelicula': '1', 'ova': '2', 'especial': '3' };
                if (typeMap[filters.category]) tioFilters.type = typeMap[filters.category];
            }
            if (filters.status) {
                const statusMap = { 'airing': '1', 'finished': '2', 'upcoming': '3' };
                if (statusMap[filters.status]) tioFilters.status = statusMap[filters.status];
            }
            if (filters.order) {
                const orderMap = { 'year': 'recent', 'score': 'recent' };
                if (orderMap[filters.order]) tioFilters.sort = orderMap[filters.order];
            }
            if (filters.minYear) tioFilters.year = filters.minYear;

            const data = await tioanime.search(q, page, tioFilters);
            return res.json({
                results: data.results.map(item => ({ ...item, source: 'tio' })),
                pagination: data.pagination
            });
        } catch (e) { console.error('Error en /search (tio):', e.message); return res.status(500).json({ results: [], pagination: { currentPage: 1, totalPages: 1, totalRecords: 0 }, error: e.message }); }
    }

    const ahora = Date.now();
    if (page && (isNaN(page) || page < 1)) return res.status(400).json({ error: "'page' debe ser un número positivo" });
    try {
        const params = new URLSearchParams();

        if (q) {
            const decodedQ = decodeURIComponent(q);
            if (decodedQ.includes('=') || decodedQ.includes('&')) {
                const temp = new URLSearchParams(decodedQ);
                for (const [key, value] of temp) params.append(key, value);
            } else {
                params.append('search', decodedQ);
            }
        }

        const orderMap = { 'score-desc': 'score', 'title-asc': 'title', 'year-desc': 'year' };
        if (filters.order && orderMap[filters.order]) filters.order = orderMap[filters.order];

        const statusMap = { 'airing': 'emision', 'finished': 'finalizado', 'upcoming': 'proximamente' };
        if (filters.status && statusMap[filters.status]) filters.status = statusMap[filters.status];

        for (const [key, value] of Object.entries(filters)) {
            params.append(key, value);
        }

        const queryString = params.toString();
        const urlDestino = queryString
            ? `${SCRAPING_TARGET}/catalogo?${queryString}&page=${page}`
            : `${SCRAPING_TARGET}/catalogo?page=${page}`;
        console.log('URL destino:', urlDestino);

        if (SEARCH_CACHE.has(urlDestino) && (ahora - SEARCH_CACHE.get(urlDestino).time < 300000)) {
            return res.json(SEARCH_CACHE.get(urlDestino).data);
        }

        const $ = await fetchAndParse(urlDestino);
        const resultados = [];

        $('article').each((i, el) => {
            const article = $(el);
            const a = article.find('a[href*="/media/"]');
            const img = article.find('img');
            const h3 = article.find('h3');

            if (a.length && img.length) {
                const labels = article.find('div').map((i, d) => $(d).text().trim()).get();
                resultados.push({
                    titulo: h3.text().trim() || "Sin título",
                    imagen: img.attr('src'),
                    slug: a.attr('href').split('/media/')[1],
                    anio: labels.find(l => /^\d{4}$/.test(l)) || "",
                    tipo: labels.find(l => ["TV", "MOVIE", "OVA", "SPECIAL"].includes(l)) || "Anime",
                    cap: null
                });
            }
        });

        let pagination = { currentPage: parseInt(page), totalPages: 1, totalRecords: resultados.length };
        try {
            const scripts = $('script').map((i, el) => $(el).html()).get();
            const allScripts = scripts.join('');
            const totalPagesMatch = allScripts.match(/totalPages:(\d+)/);
            const totalRecordsMatch = allScripts.match(/totalRecords:(\d+)/);

            if (totalPagesMatch) pagination.totalPages = parseInt(totalPagesMatch[1]);
            if (totalRecordsMatch) pagination.totalRecords = parseInt(totalRecordsMatch[1]);

            if (!totalPagesMatch && resultados.length >= 20) {
                pagination.totalPages = parseInt(page) + 1;
            }
        } catch (e) {
            console.error('Error extrayendo paginación:', e.message);
        }

        const responseData = { results: resultados, pagination };
        SEARCH_CACHE.set(urlDestino, { data: responseData, time: ahora });
        res.json(responseData);
    } catch (e) {
        console.error('Error en /search:', e.message);
        res.status(500).json({ results: [], pagination: { currentPage: 1, totalPages: 1, totalRecords: 0 }, error: e.message });
    }
});

// 3. INFO DEL ANIME (Detalles y Lista de Caps)
app.get('/anime-info', async (req, res) => {
    const { slug, source } = req.query;
    if (!slug) return res.status(400).json({ error: "Falta el parámetro 'slug'. Ejemplo: /anime-info?slug=naruto" });

    if (source === 'tio') {
        try {
            const info = await tioanime.getAnimeInfo(slug.split('/')[0]);
            const statusMap = { '1': '0', '2': '2', '3': '1' };
            info.status = statusMap[info.status] || info.status;
            try {
                let av1Scripts = '';
                try {
                    const $av1 = await fetchAndParse(`${SCRAPING_TARGET}/media/${slug.split('/')[0]}`);
                    av1Scripts = $av1('script').map((i, el) => $(el).html()).get().join('');
                } catch (e) {}
                if (!av1Scripts.includes('nextDate:')) {
                    const $search = await fetchAndParse(`${SCRAPING_TARGET}/catalogo?search=${encodeURIComponent(info.titulo)}`);
                    const firstLink = $search('article a[href*="/media/"]').first().attr('href');
                    if (firstLink) {
                        const resp = await axios.get(`${SCRAPING_TARGET}${firstLink}`, {
                            headers: { 'User-Agent': USER_AGENT }, timeout: 15000, httpAgent, httpsAgent
                        });
                        av1Scripts = resp.data;
                    }
                }
                const nextDate = av1Scripts.match(/nextDate:"(\d{4}-\d{2}-\d{2})"/)?.[1] || null;
                const waitDays = av1Scripts.match(/waitDays:(\d+)/)?.[1] || null;
                if (nextDate) info.nextDate = nextDate;
                if (waitDays) info.waitDays = waitDays;
            } catch (e) {}
            return res.json({ ...info, source: 'tio' });
        } catch (e) { console.error('Error en /anime-info (tio):', e.message); return res.status(500).json({ error: e.message }); }
    }

    const ahora = Date.now();
    if (INFO_CACHE.has(slug) && (ahora - INFO_CACHE.get(slug).time < 3600000)) return res.json(INFO_CACHE.get(slug).data);
    try {
        const $ = await fetchAndParse(`${SCRAPING_TARGET}/media/${slug.split('/')[0]}`);
        const scripts = $('script').map((i, el) => $(el).html()).get().join('');
        
        const mediaId = scripts.match(/media:\{id:(\d+)/)?.[1];
        const episodes = [];
        const regex = /\{id:(\d+),number:(\d+)\}/g;
        let m;
        while ((m = regex.exec(scripts)) !== null) {
            episodes.push({ numero: parseInt(m[2]), thumbnail: mediaId ? `https://cdn.animeav1.com/screenshots/${mediaId}/${m[2]}.jpg` : "" });
        }
        
        const info = {
            descripcion: scripts.match(/synopsis:"((?:[^"\\]|\\.)*?)",/)?.[1]?.replace(/\\n/g, ' ').replace(/\\"/g, '"') || "Sin descripción.",
            rating: scripts.match(/score:(\d+\.?\d*)/)?.[1] || "0.0",
            titulo: scripts.match(/\btitle:"((?:[^"\\]|\\.)*?)"/)?.[1] || $('h1').first().text().trim() || '',
            anio: scripts.match(/startDate:"(\d{4})/)?.[1] || "",
            tipo: scripts.match(/category:\s*\{[^}]*name:\s*"([^"]+)"/)?.[1] || "",
            generos: [...new Set([...scripts.matchAll(/name:"([^"]+)"/g)].map(m => m[1]))].filter(n => n.length > 3 && !n.includes('Anime')).slice(0, 5),
            status: scripts.match(/status:(\d+)/)?.[1] || "0",
            episodios: episodes.sort((a, b) => b.numero - a.numero),
            imagen: mediaId ? `https://cdn.animeav1.com/covers/${mediaId}.jpg` : "",
            nextDate: scripts.match(/nextDate:"(\d{4}-\d{2}-\d{2})"/)?.[1] || null,
            waitDays: scripts.match(/waitDays:(\d+)/)?.[1] || null,
            relaciones: (() => {
                try {
                    const relMatch = scripts.match(/relations:\s*\[([\s\S]*?)\]/);
                    if (!relMatch) return [];
                    const relStr = relMatch[1];
                    const results = [];
                    const itemRegex = /\{type:(\d+),destination:\{id:(\d+),slug:"([^"]+)",title:"((?:[^"\\]|\\.)*?)"/g;
                    let rm;
                    while ((rm = itemRegex.exec(relStr)) !== null) {
                        const typeMap = { '1': 'Precuela', '2': 'Secuela', '3': 'Spin-off', '4': 'Adaptación', '5': 'Relacionado' };
                        results.push({ type: rm[1], typeName: typeMap[rm[1]] || 'Relacionado', slug: rm[3], titulo: rm[4].replace(/\\"/g, '"') });
                    }
                    return results;
                } catch (e) { return []; }
            })()
        };
        
        INFO_CACHE.set(slug, { data: info, time: ahora });
        res.json(info);
    } catch (e) { res.status(500).json({ error: "Error al obtener info del anime: " + e.message }); }
});

// 4. REPRODUCTOR - Axios + Cheerio
app.get('/get-video', async (req, res) => {
    const { slug, cap, source } = req.query;
    if (!slug) return res.status(400).json({ error: "Falta el parámetro 'slug'" });
    if (!cap) return res.status(400).json({ error: "Falta el parámetro 'cap'" });

    if (source === 'tio') {
        try {
            const data = await tioanime.getVideo(slug.split('/')[0], cap);
            return res.json({ ...data, source: 'tio' });
        } catch (e) { console.error('Error en /get-video (tio):', e.message); return res.status(500).json({ error: e.message }); }
    }

    const cacheKey = `${slug}/${cap}`;
    const ahora = Date.now();
    if (VIDEO_CACHE.has(cacheKey) && (ahora - VIDEO_CACHE.get(cacheKey).time < 1800000)) return res.json(VIDEO_CACHE.get(cacheKey).data);
    try {
        const $ = await fetchAndParse(`${SCRAPING_TARGET}/media/${slug}/${cap}`);
        const scripts = $('script').map((i, el) => $(el).html()).get();
        const script = scripts.find(s => s.includes('embeds'));
        if (!script) return res.json({ servidores: [], descargas: [] });
        
        const servidores = [];
        const descargas = [];
        let episodeTitle = null;
        const pairRegex = /\{server:"([^"]+)",url:"([^"]+)"\}/g;
        
        const subMatches = [...script.matchAll(/SUB:\[([^\]]*)\]/g)];
        const embedMatch = subMatches[0] || null;
        if (embedMatch) {
            let m;
            while ((m = pairRegex.exec(embedMatch[1])) !== null) {
                servidores.push({ nombre: m[1], url: m[2].replace(/\\u0023/g, '#') });
            }
        }
        
        const downloadMatch = subMatches[1] || null;
        if (downloadMatch) {
            let m;
            while ((m = pairRegex.exec(downloadMatch[1])) !== null) {
                descargas.push({ nombre: m[1], url: m[2].replace(/\\u0023/g, '#') });
            }
        }
        
        const epTitleMatch = script.match(/episode:\{[^}]*title:(null|"((?:[^"\\]|\\.)*)")/);
        if (epTitleMatch && epTitleMatch[1] !== 'null') episodeTitle = epTitleMatch[2].replace(/\\"/g, '"');
        
        VIDEO_CACHE.set(cacheKey, { data: { servidores, descargas, episodeTitle }, time: ahora });
        res.json({ servidores, descargas, episodeTitle });
    } catch (e) { res.status(500).json({ error: "Error al obtener video: " + e.message }); }
});

// 404 handler
app.use((req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));

// Error handler centralizado
app.use((err, req, res, next) => {
    console.error('Error no capturado:', err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
});
