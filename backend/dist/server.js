"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const axios_1 = __importDefault(require("axios"));
const cheerio_1 = __importDefault(require("cheerio"));
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: Date.now() });
});
// Cache
const INFO_CACHE = new Map();
let LATEST_CACHE = { data: null, lastUpdate: 0 };
let FEATURED_CACHE = { data: null, lastUpdate: 0 };
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';
async function fetchAndParse(url) {
    const response = await axios_1.default.get(url, {
        headers: { 'User-Agent': USER_AGENT },
        timeout: 15000
    });
    return cheerio_1.default.load(response.data);
}
const port = process.env.PORT || 3000;
app.listen(Number(port), '0.0.0.0', () => console.log(`📡 Servidor activo en puerto ${port}`));
// 1. ÚLTIMOS ESTRENOS (Home) - Axios + Cheerio
app.get('/latest', async (req, res) => {
    const ahora = Date.now();
    if (LATEST_CACHE.data && (ahora - LATEST_CACHE.lastUpdate < 600000)) {
        return res.json(LATEST_CACHE.data);
    }
    try {
        const $ = await fetchAndParse('https://animeav1.com/');
        const scripts = $('script').map((i, el) => $(el).html()).get();
        const target = scripts.find((s) => s.includes('latestEpisodes'));
        if (!target)
            return res.json([]);
        const results = [];
        // Nuevo regex para formato actual: media:{id:123,slug:"slug",title:"Titulo"},number:16
        const regex = /media:\s*\{id:\s*(\d+),\s*slug:\s*"([^"]+)",\s*title:\s*"([^"]+)"[^}]*\},\s*number:\s*(\d+)/g;
        let m;
        while ((m = regex.exec(target)) !== null) {
            results.push({
                titulo: m[3],
                imagen: `https://cdn.animeav1.com/covers/${m[1]}.jpg`,
                slug: m[2],
                cap: m[4],
                anio: "",
                tipo: "Anime"
            });
        }
        LATEST_CACHE = { data: results.slice(0, 24), lastUpdate: ahora };
        res.json(LATEST_CACHE.data);
    }
    catch (e) {
        res.json([]);
    }
});
// 1.5. FEATURED / CAROUSEL (Home) - Axios + Cheerio
app.get('/featured', async (req, res) => {
    const ahora = Date.now();
    if (FEATURED_CACHE.data && (ahora - FEATURED_CACHE.lastUpdate < 600000)) {
        return res.json(FEATURED_CACHE.data);
    }
    try {
        const $ = await fetchAndParse('https://animeav1.com/');
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
            if (ch === '"') {
                inString = !inString;
                continue;
            }
            if (!inString) {
                if (ch === '{') {
                    if (depth === 0)
                        itemStart = i;
                    depth++;
                }
                else if (ch === '}') {
                    depth--;
                    if (depth === 0) {
                        items.push(featuredArrayStr.substring(itemStart, i + 1));
                    }
                }
            }
        }
        // Helper to extract a string value for a given key (only top-level, not nested)
        function extractString(objStr, key) {
            const search = key + ':"';
            let pos = 0;
            while (pos < objStr.length) {
                const idx = objStr.indexOf(search, pos);
                if (idx === -1)
                    return '';
                // Check if this occurrence is at the top level (depth 0)
                let depth = 0;
                let inString = false;
                let escapeNext = false;
                let isTopLevel = true;
                for (let i = 0; i < idx; i++) {
                    const ch = objStr[i];
                    if (escapeNext) {
                        escapeNext = false;
                        continue;
                    }
                    if (ch === '\\' && inString) {
                        escapeNext = true;
                        continue;
                    }
                    if (ch === '"') {
                        inString = !inString;
                        continue;
                    }
                    if (!inString) {
                        if (ch === '{')
                            depth++;
                        else if (ch === '}')
                            depth--;
                    }
                }
                if (depth === 0) {
                    // Found at top level, extract the value
                    const start = idx + search.length;
                    let result = '';
                    let escaped = false;
                    for (let i = start; i < objStr.length; i++) {
                        const ch = objStr[i];
                        if (escaped) {
                            result += ch;
                            escaped = false;
                            continue;
                        }
                        if (ch === '\\') {
                            escaped = true;
                            continue;
                        }
                        if (ch === '"')
                            break;
                        result += ch;
                    }
                    return result;
                }
                // Not at top level, skip past this match and continue searching
                pos = idx + search.length;
            }
            return '';
        }
        // Helper to extract a numeric value for a given key (only top-level, not nested)
        function extractNumber(objStr, key) {
            const search = key + ':';
            let pos = 0;
            while (pos < objStr.length) {
                const idx = objStr.indexOf(search, pos);
                if (idx === -1)
                    return 0;
                // Check if this occurrence is at the top level (depth 0)
                let depth = 0;
                let inString = false;
                let escapeNext = false;
                let isTopLevel = true;
                for (let i = 0; i < idx; i++) {
                    const ch = objStr[i];
                    if (escapeNext) {
                        escapeNext = false;
                        continue;
                    }
                    if (ch === '\\' && inString) {
                        escapeNext = true;
                        continue;
                    }
                    if (ch === '"') {
                        inString = !inString;
                        continue;
                    }
                    if (!inString) {
                        if (ch === '{')
                            depth++;
                        else if (ch === '}')
                            depth--;
                    }
                }
                if (depth === 0) {
                    // Found at top level, extract the value
                    const start = idx + search.length;
                    const match = objStr.substring(start).match(/^(\d+)/);
                    return match ? parseInt(match[1]) : 0;
                }
                // Not at top level, skip past this match and continue searching
                pos = idx + search.length;
            }
            return 0;
        }
        // Helper to extract top-level string value
        function extractTopLevelString(objStr, key) {
            const search = key + ':"';
            let pos = 0;
            while (pos < objStr.length) {
                const idx = objStr.indexOf(search, pos);
                if (idx === -1)
                    return '';
                // Check if this is at top level (depth 0)
                let depth = 0;
                let inString = false;
                let escapeNext = false;
                for (let i = 0; i < idx; i++) {
                    const ch = objStr[i];
                    if (escapeNext) {
                        escapeNext = false;
                        continue;
                    }
                    if (ch === '\\' && inString) {
                        escapeNext = true;
                        continue;
                    }
                    if (ch === '"') {
                        inString = !inString;
                        continue;
                    }
                    if (!inString) {
                        if (ch === '{' || ch === '[')
                            depth++;
                        else if (ch === '}' || ch === ']')
                            depth--;
                    }
                }
                if (depth === 0) {
                    // Extract the string value
                    const start = idx + search.length;
                    let result = '';
                    let escaped = false;
                    for (let i = start; i < objStr.length; i++) {
                        const ch = objStr[i];
                        if (escaped) {
                            result += ch;
                            escaped = false;
                            continue;
                        }
                        if (ch === '\\') {
                            escaped = true;
                            continue;
                        }
                        if (ch === '"')
                            break;
                        result += ch;
                    }
                    return result;
                }
                pos = idx + search.length;
            }
            return '';
        }
        // Helper to extract top-level numeric value
        function extractTopLevelNumber(objStr, key) {
            const search = key + ':';
            let pos = 0;
            while (pos < objStr.length) {
                const idx = objStr.indexOf(search, pos);
                if (idx === -1)
                    return 0;
                // Check if this is at top level (depth 0)
                let depth = 0;
                let inString = false;
                let escapeNext = false;
                for (let i = 0; i < idx; i++) {
                    const ch = objStr[i];
                    if (escapeNext) {
                        escapeNext = false;
                        continue;
                    }
                    if (ch === '\\' && inString) {
                        escapeNext = true;
                        continue;
                    }
                    if (ch === '"') {
                        inString = !inString;
                        continue;
                    }
                    if (!inString) {
                        if (ch === '{' || ch === '[')
                            depth++;
                        else if (ch === '}' || ch === ']')
                            depth--;
                    }
                }
                if (depth === 0) {
                    const start = idx + search.length;
                    const match = objStr.substring(start).match(/^(\d+)/);
                    return match ? parseInt(match[1]) : 0;
                }
                pos = idx + search.length;
            }
            return 0;
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
            const catMatch = itemStr.match(/category:\s*\{[^}]*name:\s*"([^"]+)"\}/);
            if (catMatch)
                categoryType = catMatch[1];
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
        function findArrayEnd(str, arrayStartPos) {
            let depth = 0;
            let inString = false;
            let escapeNext = false;
            for (let i = arrayStartPos; i < str.length; i++) {
                const ch = str[i];
                if (escapeNext) {
                    escapeNext = false;
                    continue;
                }
                if (ch === '\\' && inString) {
                    escapeNext = true;
                    continue;
                }
                if (ch === '"') {
                    inString = !inString;
                    continue;
                }
                if (!inString) {
                    if (ch === '[')
                        depth++;
                    else if (ch === ']') {
                        depth--;
                        if (depth === 0)
                            return i;
                    }
                }
            }
            return str.length - 1;
        }
        console.log(`Featured: found ${results.length} items`);
        FEATURED_CACHE = { data: results, lastUpdate: ahora };
        res.json(FEATURED_CACHE.data);
    }
    catch (e) {
        console.error('Error en /featured:', e.message);
        res.json([]);
    }
});
// 2. BÚSQUEDA
app.get('/search', async (req, res) => {
    const { q, page = '1', ...filters } = req.query;
    try {
        const params = new URLSearchParams();
        if (q) {
            // Decodificar q por si viene encodeado
            const decodedQ = decodeURIComponent(q);
            if (decodedQ.includes('=') || decodedQ.includes('&')) {
                // q es un string de parámetros (formato legacy)
                const temp = new URLSearchParams(decodedQ);
                for (const [key, value] of temp) {
                    params.append(key, value);
                }
            }
            else {
                params.append('search', decodedQ);
            }
        }
        // Agregar filtros individuales (tienen prioridad sobre q)
        for (const [key, value] of Object.entries(filters)) {
            params.append(key, value);
        }
        const queryString = params.toString();
        const urlDestino = queryString
            ? `https://animeav1.com/catalogo?${queryString}&page=${page}`
            : `https://animeav1.com/catalogo?page=${page}`;
        console.log('URL destino:', urlDestino);
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
                    imagen: img.attr('src') || '',
                    slug: (a.attr('href') || '').split('/media/')[1] || '',
                    anio: labels.find((l) => /^\d{4}$/.test(l)) || "",
                    tipo: labels.find((l) => ["TV", "MOVIE", "OVA", "SPECIAL"].includes(l)) || "Anime",
                    cap: null
                });
            }
        });
        // Extraer metadatos de paginación del script embebido
        let pagination = {
            currentPage: parseInt(page),
            totalPages: 1,
            totalRecords: resultados.length
        };
        try {
            const scripts = $('script').map((i, el) => $(el).html()).get();
            const allScripts = scripts.join('');
            const totalPagesMatch = allScripts.match(/totalPages:(\d+)/);
            const totalRecordsMatch = allScripts.match(/totalRecords:(\d+)/);
            if (totalPagesMatch)
                pagination.totalPages = parseInt(totalPagesMatch[1]);
            if (totalRecordsMatch)
                pagination.totalRecords = parseInt(totalRecordsMatch[1]);
            // Si no se encontró totalPages pero hay 20 resultados, estimar más páginas
            if (!totalPagesMatch && resultados.length >= 20) {
                pagination.totalPages = parseInt(page) + 1;
            }
        }
        catch (e) {
            console.error('Error extrayendo paginación:', e.message);
        }
        res.json({ results: resultados, pagination });
    }
    catch (e) {
        console.error('Error en /search:', e.message);
        res.json({ results: [], pagination: { currentPage: 1, totalPages: 1, totalRecords: 0 } });
    }
});
// 3. INFO DEL ANIME (Detalles y Lista de Caps)
app.get('/anime-info', async (req, res) => {
    const { slug } = req.query;
    if (!slug || typeof slug !== 'string') {
        return res.status(400).json({ error: "Falta el parámetro slug" });
    }
    const ahora = Date.now();
    const cached = INFO_CACHE.get(slug);
    if (cached && (ahora - cached.time < 3600000)) {
        return res.json(cached.data);
    }
    try {
        const $ = await fetchAndParse(`https://animeav1.com/media/${slug.split('/')[0]}`);
        const scripts = $('script').map((i, el) => $(el).html()).get().join('');
        const mediaId = scripts.match(/media:\{id:(\d+)/)?.[1];
        const episodes = [];
        const regex = /\{id:(\d+),number:(\d+)\}/g;
        let m;
        while ((m = regex.exec(scripts)) !== null) {
            episodes.push({
                numero: parseInt(m[2]),
                thumbnail: mediaId ? `https://cdn.animeav1.com/screenshots/${mediaId}/${m[2]}.jpg` : ""
            });
        }
        const info = {
            descripcion: scripts.match(/synopsis:"([\s\S]*?)",/)?.[1]?.replace(/\\n/g, ' ') || "Sin descripción.",
            rating: scripts.match(/score:(\d+\.?\d*)/)?.[1] || "0.0",
            anio: scripts.match(/startDate:"(\d{4})/)?.[1] || "",
            tipo: scripts.match(/category:\s*\{[^}]*name:\s*"([^"]+)"/)?.[1] || "",
            generos: [...new Set([...scripts.matchAll(/name:"([^"]+)"/g)].map((m) => m[1]))].filter((n) => n.length > 3 && !n.includes('Anime')).slice(0, 5),
            episodios: episodes.sort((a, b) => b.numero - a.numero)
        };
        INFO_CACHE.set(slug, { data: info, time: ahora });
        res.json(info);
    }
    catch (e) {
        res.json({ error: "Error" });
    }
});
// 4. REPRODUCTOR - Axios + Cheerio
app.get('/get-video', async (req, res) => {
    const { slug, cap } = req.query;
    if (!slug || !cap) {
        return res.status(400).json({ error: "Faltan parámetros" });
    }
    try {
        const $ = await fetchAndParse(`https://animeav1.com/media/${slug}/${cap}`);
        const scripts = $('script').map((i, el) => $(el).html()).get();
        const script = scripts.find((s) => s.includes('embeds'));
        if (!script)
            return res.json({ servidores: [] });
        const results = [];
        const regex = /\{server:"([^"]+)",url:"([^"]+)"\}/g;
        let m;
        while ((m = regex.exec(script)) !== null) {
            results.push({
                nombre: m[1].toUpperCase(),
                url: m[2].replace(/\\u0026/g, '#')
            });
        }
        res.json({ servidores: results });
    }
    catch (e) {
        res.json({ servidores: [] });
    }
});
