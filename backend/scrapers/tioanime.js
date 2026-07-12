const axios = require('axios');
const cheerio = require('cheerio');
const http = require('http');
const https = require('https');

const httpAgent = new http.Agent({ keepAlive: true, keepAliveMsecs: 30000 });
const httpsAgent = new https.Agent({ keepAlive: true, keepAliveMsecs: 30000 });
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';
const BASE_URL = process.env.TIOANIME_URL || 'https://tioanime.com';

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
    const results = [];

    $('ul.list-unstyled li').each((i, el) => {
        if (results.length >= 24) return false;
        const a = $(el).find('a');
        const img = $(el).find('img');
        const href = a.attr('href') || '';
        const match = href.match(/\/ver\/(.+)-(\d+)$/);
        if (match) {
            const titulo = $(el).find('h3').text().trim() || $(el).find('p').first().text().trim();
            const slug = match[1];
            const cap = match[2];
            let imagen = img.attr('src') || '';
            if (!imagen.startsWith('http')) imagen = `${BASE_URL}${imagen}`;
            imagen = imagen.replace('/uploads/thumbs/', '/uploads/portadas/');
            results.push({ titulo, imagen, slug, cap });
        }
    });

    LATEST_CACHE.data = results;
    LATEST_CACHE.lastUpdate = ahora;
    return results;
}

async function getFeatured() {
    const ahora = Date.now();
    if (FEATURED_CACHE.data && (ahora - FEATURED_CACHE.lastUpdate < 600000)) return FEATURED_CACHE.data;

    const $ = await getHomepage();
    const results = [];

    $('section').has('h2.title').find('article.anime').each((i, el) => {
        if (results.length >= 12) return false;
        const a = $(el).find('a');
        const img = $(el).find('img');
        const h3 = $(el).find('h3');
        const href = a.attr('href') || '';
        const slugMatch = href.match(/\/anime\/(.+)/);
        if (slugMatch && h3.length) {
            let imagen = img.attr('src') || '';
            if (!imagen.startsWith('http')) imagen = `${BASE_URL}${imagen}`;
            const idMatch = imagen.match(/\/(\d+)\./);
            results.push({
                titulo: h3.text().trim(),
                slug: slugMatch[1],
                id: idMatch ? idMatch[1] : '',
                backdrop: imagen,
                tipo: 'Anime',
                anio: '',
                status: 0,
                synopsis: '',
                generos: []
            });
        }
    });

    FEATURED_CACHE.data = results;
    FEATURED_CACHE.lastUpdate = ahora;
    return results;
}

async function search(q, page = 1, filters = {}) {
    const params = new URLSearchParams();
    params.append('p', page);
    if (q) params.append('q', q);
    if (filters.genero) params.append('genero', filters.genero);
    if (filters.type) params.append('type[]', filters.type);
    if (filters.status) params.append('status', filters.status);
    if (filters.sort) params.append('sort', filters.sort);
    if (filters.year) params.append('year', filters.year);

    const urlDestino = `${BASE_URL}/directorio?${params.toString()}`;

    const ahora = Date.now();
    const cached = getCached(SEARCH_CACHE, urlDestino, 300000);
    if (cached) return cached;

    const $ = await fetchAndParse(urlDestino);
    const resultados = [];

    $('ul.animes li').each((i, el) => {
        const article = $(el).find('article.anime');
        const a = article.find('a');
        const img = article.find('img');
        const h3 = article.find('h3');
        if (a.length && h3.length) {
            const href = a.attr('href') || '';
            const slugMatch = href.match(/\/anime\/(.+)/);
            if (slugMatch) {
                let imagen = img.attr('src') || '';
                if (!imagen.startsWith('http')) imagen = `${BASE_URL}${imagen}`;
                resultados.push({
                    titulo: h3.text().trim() || 'Sin título',
                    imagen,
                    slug: slugMatch[1],
                    anio: '',
                    tipo: 'Anime',
                    cap: null
                });
            }
        }
    });

    let pagination = { currentPage: parseInt(page), totalPages: 1, totalRecords: resultados.length };
    const pageLinks = $('ul.pagination li a');
    pageLinks.each((i, el) => {
        const href = $(el).attr('href') || '';
        const pageMatch = href.match(/p=(\d+)/);
        if (pageMatch) {
            const pageNum = parseInt(pageMatch[1]);
            if (pageNum > pagination.totalPages) pagination.totalPages = pageNum;
        }
    });

    const responseData = { results: resultados, pagination };
    setCache(SEARCH_CACHE, urlDestino, responseData);
    return responseData;
}

async function getAnimeInfo(slug) {
    const ahora = Date.now();
    const cached = getCached(INFO_CACHE, slug, 3600000);
    if (cached) return cached;

    const $ = await fetchAndParse(`${BASE_URL}/anime/${slug}`);

    let animeId = '';
    let episodes = [];
    let episodesDetails = [];
    const scripts = $('script').map((i, el) => $(el).html()).get();

    for (const s of scripts) {
        const infoMatch = s.match(/var\s+anime_info\s*=\s*(\[.*?\]);/);
        if (infoMatch) {
            try {
                const info = JSON.parse(infoMatch[1]);
                animeId = info[0] || '';
            } catch (e) {}
        }
        const epMatch = s.match(/var\s+episodes\s*=\s*(\[.*?\]);/);
        if (epMatch) {
            try {
                episodes = JSON.parse(epMatch[1]);
            } catch (e) {}
        }
        const detailMatch = s.match(/var\s+episodes_details\s*=\s*(\[.*?\]);/);
        if (detailMatch) {
            try {
                episodesDetails = JSON.parse(detailMatch[1]);
            } catch (e) {}
        }
    }

    const titulo = $('h1.title').text().trim() || '';
    const descripcion = $('p.sinopsis').text().trim() || 'Sin descripción.';
    const tipo = $('span.anime-type-peli').first().text().trim() || '';
    const anio = $('article.anime-single .meta span.year').first().text().trim() || $('span.year').first().text().trim() || '';
    const statusText = $('a.btn.status').text().trim().toLowerCase();
    let status = '0';
    if (statusText.includes('emision') || statusText.includes('emisión') || statusText.includes('en emisión')) status = '2';
    else if (statusText.includes('finalizado')) status = '1';
    else if (statusText.includes('proximamente') || statusText.includes('próximamente')) status = '3';

    const generos = [];
    $('p.genres a').each((i, el) => {
        const g = $(el).text().trim();
        if (g) generos.push(g);
    });

    let imagen = $('img[src*=portadas]').attr('src') || $('.thumb img').attr('src') || '';
    if (!imagen.startsWith('http')) imagen = `${BASE_URL}${imagen}`;

    const episodeList = episodes.map((ep, idx) => ({
        numero: ep,
        thumbnail: animeId ? `${BASE_URL}/uploads/thumbs/${animeId}.jpg` : imagen
    }));
    episodeList.sort((a, b) => b.numero - a.numero);

    const info = {
        descripcion,
        rating: '0.0',
        titulo,
        anio,
        tipo,
        generos,
        status,
        episodios: episodeList,
        imagen,
        nextDate: null,
        waitDays: null,
        relaciones: []
    };

    setCache(INFO_CACHE, slug, info);
    return info;
}

async function getVideo(slug, cap) {
    const cacheKey = `${slug}/${cap}`;
    const ahora = Date.now();
    const cached = getCached(VIDEO_CACHE, cacheKey, 1800000);
    if (cached) return cached;

    try {
        const $ = await fetchAndParse(`${BASE_URL}/ver/${slug}-${cap}`);
        const episodeTitle = $('h1.anime-title').text().trim() || $('head title').text().replace(/\s*-\s*TioAnime.*$/i, '').trim() || null;

        const scripts = $('script').map((i, el) => $(el).html()).get();
        const videosScript = scripts.find(s => s && s.includes('var videos ='));

        const servidores = [];
        const descargas = [];

        if (videosScript) {
            const videosMatch = videosScript.match(/var videos = (\[.*?\]);/s);
            if (videosMatch) {
                try {
                    const videos = JSON.parse(videosMatch[1]);
                    videos.forEach(v => {
                        servidores.push({
                            nombre: v[0],
                            url: v[1]
                        });
                    });
                } catch (e) {}
            }
        }

        const data = { servidores, descargas, episodeTitle };
        setCache(VIDEO_CACHE, cacheKey, data);
        return data;
    } catch (e) {
        return { servidores: [], descargas: [], episodeTitle: null };
    }
}

module.exports = { source: 'tio', getLatest, getFeatured, search, getAnimeInfo, getVideo };
