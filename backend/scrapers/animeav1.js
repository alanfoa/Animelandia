const axios = require('axios');
const cheerio = require('cheerio');
const http = require('http');
const https = require('https');

const httpAgent = new http.Agent({ keepAlive: true, keepAliveMsecs: 30000 });
const httpsAgent = new https.Agent({ keepAlive: true, keepAliveMsecs: 30000 });
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';
const BASE_URL = process.env.SCRAPING_TARGET || 'https://animeav1.com';

const INFO_CACHE = new Map();
const VIDEO_CACHE = new Map();
const SEARCH_CACHE = new Map();
const LATEST_CACHE = { data: null, lastUpdate: 0 };
const FEATURED_CACHE = { data: null, lastUpdate: 0 };
const HOMEPAGE_CACHE = { $: null, lastUpdate: 0 };

let homepagePromise = null;

async function fetchAndParse(url) {
    const response = await axios.get(url, {
        headers: { 'User-Agent': USER_AGENT },
        timeout: 15000,
        httpAgent, httpsAgent
    });
    return cheerio.load(response.data);
}

async function getHomepage() {
    const ahora = Date.now();
    if (HOMEPAGE_CACHE.$ && (ahora - HOMEPAGE_CACHE.lastUpdate < 600000)) return HOMEPAGE_CACHE.$;
    if (homepagePromise) return homepagePromise;
    homepagePromise = fetchAndParse(`${BASE_URL}/`).then($ => {
        HOMEPAGE_CACHE.$ = $;
        HOMEPAGE_CACHE.lastUpdate = Date.now();
        homepagePromise = null;
        return $;
    }).catch(e => { homepagePromise = null; throw e; });
    return homepagePromise;
}

function getCached(cacheMap, key, ttlMs) {
    if (cacheMap.has(key)) {
        const entry = cacheMap.get(key);
        if (Date.now() - entry.time < ttlMs) return entry.data;
    }
    return null;
}

function setCache(cacheMap, key, data) {
    cacheMap.set(key, { data, time: Date.now() });
}

// Limpieza periódica de caché
const CACHE_MAX_AGE = 3600000;
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of INFO_CACHE) { if (now - entry.time > CACHE_MAX_AGE) INFO_CACHE.delete(key); }
    for (const [key, entry] of VIDEO_CACHE) { if (now - entry.time > CACHE_MAX_AGE) VIDEO_CACHE.delete(key); }
    for (const [key, entry] of SEARCH_CACHE) { if (now - entry.time > CACHE_MAX_AGE) SEARCH_CACHE.delete(key); }
}, 300000);

async function getLatest() {
    const ahora = Date.now();
    if (LATEST_CACHE.data && (ahora - LATEST_CACHE.lastUpdate < 600000)) return LATEST_CACHE.data;

    const $ = await getHomepage();
    const scripts = $('script').map((i, el) => $(el).html()).get();
    const target = scripts.find(s => s.includes('latestEpisodes'));
    if (!target) return [];

    const results = [];
    const regex = /media:\s*\{id:\s*(\d+),\s*slug:\s*"([^"]+)",\s*title:\s*"((?:[^"\\]|\\.)+)"[^}]*\},\s*number:\s*(\d+)/g;
    let m;
    while ((m = regex.exec(target)) !== null) {
        results.push({ titulo: m[3].replace(/\\"/g, '"'), imagen: `https://cdn.animeav1.com/covers/${m[1]}.jpg`, slug: m[2], cap: m[4] });
    }
    LATEST_CACHE.data = results.slice(0, 24);
    LATEST_CACHE.lastUpdate = ahora;
    return LATEST_CACHE.data;
}

async function getFeatured() {
    const ahora = Date.now();
    if (FEATURED_CACHE.data && (ahora - FEATURED_CACHE.lastUpdate < 600000)) return FEATURED_CACHE.data;

    const $ = await getHomepage();
    const scripts = $('script').map((i, el) => $(el).html()).get();
    const allScripts = scripts.join('');

    const featuredArrayStart = allScripts.indexOf('featured:[');
    if (featuredArrayStart === -1) return [];

    const featuredArrayEnd = allScripts.indexOf('],latestEpisodes:', featuredArrayStart);
    if (featuredArrayEnd === -1) return [];

    const featuredArrayStr = allScripts.substring(featuredArrayStart + 'featured:['.length, featuredArrayEnd);

    const items = [];
    let depth = 0, itemStart = 0, inString = false, escapeNext = false;
    for (let i = 0; i < featuredArrayStr.length; i++) {
        const ch = featuredArrayStr[i];
        if (escapeNext) { escapeNext = false; continue; }
        if (ch === '\\' && inString) { escapeNext = true; continue; }
        if (ch === '"') { inString = !inString; continue; }
        if (!inString) {
            if (ch === '{') { if (depth === 0) itemStart = i; depth++; }
            else if (ch === '}') { depth--; if (depth === 0) items.push(featuredArrayStr.substring(itemStart, i + 1)); }
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
                if (!inString) { if (ch === '{' || ch === '[') depth++; else if (ch === '}' || ch === ']') depth--; }
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

    const results = [];
    for (const itemStr of items) {
        const id = getTopLevelValue(itemStr, 'id');
        const slug = getTopLevelValue(itemStr, 'slug');
        const title = getTopLevelValue(itemStr, 'title');
        const synopsis = getTopLevelValue(itemStr, 'synopsis') || '';
        const startDate = getTopLevelValue(itemStr, 'startDate') || '';
        const status = getTopLevelValue(itemStr, 'status') || 0;
        let categoryType = '';
        const catMatch = itemStr.match(/category:\s*\{[^}]*name:\s*"([^"]+)"/);
        if (catMatch) categoryType = catMatch[1];
        const genreNames = [];
        const genresMatch = itemStr.match(/genres:\s*\[([\s\S]*?)\]/);
        if (genresMatch) {
            const genreRegex = /name:"([^"]+)"/g;
            let gm;
            while ((gm = genreRegex.exec(genresMatch[1])) !== null) genreNames.push(gm[1]);
        }
        results.push({
            titulo: title, slug, id, backdrop: `https://cdn.animeav1.com/covers/${id}.jpg`,
            tipo: categoryType, anio: startDate.split('-')[0], status,
            synopsis: synopsis.replace(/\\n/g, ' ').replace(/\\r/g, '').trim(),
            generos: genreNames.slice(0, 4)
        });
    }

    FEATURED_CACHE.data = results;
    FEATURED_CACHE.lastUpdate = ahora;
    return results;
}

async function search(q, page = 1, filters = {}) {
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
    for (const [key, value] of Object.entries(filters)) params.append(key, value);

    const queryString = params.toString();
    const urlDestino = queryString
        ? `${BASE_URL}/catalogo?${queryString}&page=${page}`
        : `${BASE_URL}/catalogo?page=${page}`;

    const ahora = Date.now();
    const cached = getCached(SEARCH_CACHE, urlDestino, 300000);
    if (cached) return cached;

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
        if (!totalPagesMatch && resultados.length >= 20) pagination.totalPages = parseInt(page) + 1;
    } catch (e) {}

    const responseData = { results: resultados, pagination };
    setCache(SEARCH_CACHE, urlDestino, responseData);
    return responseData;
}

async function getAnimeInfo(slug) {
    const ahora = Date.now();
    const cached = getCached(INFO_CACHE, slug, 3600000);
    if (cached) return cached;

    const $ = await fetchAndParse(`${BASE_URL}/media/${slug.split('/')[0]}`);
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

    setCache(INFO_CACHE, slug, info);
    return info;
}

async function getVideo(slug, cap) {
    const cacheKey = `${slug}/${cap}`;
    const ahora = Date.now();
    const cached = getCached(VIDEO_CACHE, cacheKey, 1800000);
    if (cached) return cached;

    const $ = await fetchAndParse(`${BASE_URL}/media/${slug}/${cap}`);
    const scripts = $('script').map((i, el) => $(el).html()).get();
    const script = scripts.find(s => s.includes('embeds'));
    if (!script) return { servidores: [], descargas: [], episodeTitle: null };

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

    const data = { servidores, descargas, episodeTitle };
    setCache(VIDEO_CACHE, cacheKey, data);
    return data;
}

module.exports = { source: 'av1', getLatest, getFeatured, search, getAnimeInfo, getVideo };
