const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
app.use(cors());

// Health check endpoint
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: Date.now() }));

let INFO_CACHE = new Map();
let LATEST_CACHE = { data: null, lastUpdate: 0 };
let FEATURED_CACHE = { data: null, lastUpdate: 0 };

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

async function fetchAndParse(url) {
    const response = await axios.get(url, {
        headers: { 'User-Agent': USER_AGENT },
        timeout: 15000
    });
    return cheerio.load(response.data);
}

const port = process.env.PORT || 3000;
app.listen(port, '0.0.0.0', () => console.log(`📡 Sniper activo en puerto ${port}`));

// 1. ÚLTIMOS ESTRENOS (Home) - Axios + Cheerio
app.get('/latest', async (req, res) => {
    const ahora = Date.now();
    if (LATEST_CACHE.data && (ahora - LATEST_CACHE.lastUpdate < 600000)) return res.json(LATEST_CACHE.data);
    try {
        const $ = await fetchAndParse('https://animeav1.com/');
        const scripts = $('script').map((i, el) => $(el).html()).get();
        const target = scripts.find(s => s.includes('latestEpisodes'));
        if (!target) return res.json([]);
        
        const results = [];
        // Nuevo regex para formato actual: media:{id:123,slug:"slug",title:"Titulo"},number:16
        const regex = /media:\s*\{id:\s*(\d+),\s*slug:\s*"([^"]+)",\s*title:\s*"([^"]+)"[^}]*\},\s*number:\s*(\d+)/g;
        let m;
        while ((m = regex.exec(target)) !== null) {
            results.push({ titulo: m[3], imagen: `https://cdn.animeav1.com/covers/${m[1]}.jpg`, slug: m[2], cap: m[4] });
        }
        LATEST_CACHE = { data: results.slice(0, 24), lastUpdate: ahora };
        res.json(LATEST_CACHE.data);
    } catch (e) { res.json([]); }
});

// 1.5. FEATURED / CAROUSEL (Home) - Axios + Cheerio
app.get('/featured', async (req, res) => {
    const ahora = Date.now();
    if (FEATURED_CACHE.data && (ahora - FEATURED_CACHE.lastUpdate < 600000)) return res.json(FEATURED_CACHE.data);
    try {
        const $ = await fetchAndParse('https://animeav1.com/');
        const scripts = $('script').map((i, el) => $(el).html()).get();
        const allScripts = scripts.join('');
        
        // Find the featured section by looking for the pattern
        const featuredStart = allScripts.indexOf('featured:[{');
        if (featuredStart === -1) {
            console.log('Featured section not found');
            return res.json([]);
        }
        
        // Extract each anime item by finding slug patterns
        const results = [];
        const slugRegex = /slug:"([^"]+)"[^}]*?synopsis:"([\s\S]*?)"[^}]*?title:"([^"]+)"/g;
        let m;
        
        // We need to search in a limited portion that contains featured
        const featuredSection = allScripts.substring(featuredStart, featuredStart + 50000);
        
        while ((m = slugRegex.exec(featuredSection)) !== null) {
            const slug = m[1];
            const synopsis = m[2].replace(/\\n/g, ' ').trim();
            const titulo = m[3];
            
            // Get the id from nearby context
            const beforeMatch = featuredSection.substring(Math.max(0, m.index - 100), m.index);
            const idMatch = beforeMatch.match(/id:(\d+),/);
            const id = idMatch ? idMatch[1] : '';
            
            // Get type from nearby context
            const typeMatch = beforeMatch.match(/name:"([^"]+)"[^}]*\}/);
            const tipo = typeMatch ? typeMatch[1] : '';
            
            // Extract genres (up to 4)
            const contextAround = featuredSection.substring(m.index, m.index + 500);
            const genres = [];
            const genreRegex = /name:"([^"]+)"/g;
            let gm;
            let genreCount = 0;
            while ((gm = genreRegex.exec(contextAround)) !== null && genreCount < 6) {
                const name = gm[1];
                if (name !== tipo && name.length > 2 && !['Anime', 'accion', 'drama', 'fantasia', 'aventura', 'shounen', 'seinen', 'comedia', 'romance', 'misterio', 'terror', 'ciencia-ficcion', 'recuentos-de-la-vida', 'sobrenatural', 'suspenso', 'deportes', 'escolares', 'isekai', 'mecha', 'militar', 'musica', 'parodia', 'psicologico', 'samurai', 'superpoderes', 'vampiros', 'harem', 'ecchi', 'gore', 'infantil', 'gourmet', 'detectives', 'historico', 'mitologia', 'espacial', 'mahou-shoujo', 'josei', 'shoujo', 'shoujo-ai', 'shounen-ai', 'juegos-estrategia', 'idols-hombre', 'idols-mujer', 'carreras', 'artes-marciales', 'antropomorfico'].includes(name.toLowerCase())) {
                    continue;
                }
                if (name !== tipo && genres.length < 4) {
                    genres.push(name);
                }
                genreCount++;
            }
            
            if (slug && titulo && id) {
                results.push({
                    titulo,
                    slug,
                    id,
                    backdrop: `https://cdn.animeav1.com/backdrops/${id}.jpg`,
                    tipo,
                    anio: '',
                    status: 0,
                    synopsis,
                    generos: genres
                });
            }
        }
        
        // Better approach: use JSON-like parsing
        if (results.length === 0) {
            // Try alternative parsing - extract each object block
            const itemRegex = /\{category:\{id:(\d+),name:"([^"]+)"\},genres:(\[[\s\S]*?\]),id:(\d+),slug:"([^"]+)",startDate:"([^"]+)",status:(\d+),synopsis:"([\s\S]*?)",title:"([^"]+)"/g;
            let m2;
            while ((m2 = itemRegex.exec(featuredSection)) !== null) {
                const genresRaw = m2[3];
                const genreNames = [];
                const genreRegex = /name:"([^"]+)"/g;
                let gm;
                while ((gm = genreRegex.exec(genresRaw)) !== null) {
                    genreNames.push(gm[1]);
                }
                
                results.push({
                    titulo: m2[9],
                    slug: m2[5],
                    id: m2[4],
                    backdrop: `https://cdn.animeav1.com/backdrops/${m2[4]}.jpg`,
                    tipo: m2[2],
                    anio: m2[6].split('-')[0],
                    status: parseInt(m2[7]),
                    synopsis: m2[8].replace(/\\n/g, ' ').replace(/\\r/g, '').trim(),
                    generos: genreNames.slice(0, 4)
                });
            }
        }
        
        console.log(`Featured: found ${results.length} items`);
        FEATURED_CACHE = { data: results, lastUpdate: ahora };
        res.json(FEATURED_CACHE.data);
    } catch (e) { 
        console.error('Error en /featured:', e.message);
        res.json([]); 
    }
});

// 2. BUSCADOR
app.get('/search', async (req, res) => {
    const { q, page = 1, ...filters } = req.query;
    try {
        const params = new URLSearchParams();

        if (q) {
            // Decodificar q por si viene encodeado
            const decodedQ = decodeURIComponent(q);
            if (decodedQ.includes('=') || decodedQ.includes('&')) {
                // q es un string de parámetros (formato legacy)
                const temp = new URLSearchParams(decodedQ);
                for (const [key, value] of temp) params.append(key, value);
            } else {
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
                    imagen: img.attr('src'),
                    slug: a.attr('href').split('/media/')[1],
                    anio: labels.find(l => /^\d{4}$/.test(l)) || "",
                    tipo: labels.find(l => ["TV", "MOVIE", "OVA", "SPECIAL"].includes(l)) || "Anime",
                    cap: null
                });
            }
        });

        // Extraer metadatos de paginación del script embebido
        let pagination = { currentPage: parseInt(page), totalPages: 1, totalRecords: resultados.length };
        try {
            const scripts = $('script').map((i, el) => $(el).html()).get();
            const allScripts = scripts.join('');
            const totalPagesMatch = allScripts.match(/totalPages:(\d+)/);
            const totalRecordsMatch = allScripts.match(/totalRecords:(\d+)/);

            if (totalPagesMatch) pagination.totalPages = parseInt(totalPagesMatch[1]);
            if (totalRecordsMatch) pagination.totalRecords = parseInt(totalRecordsMatch[1]);

            // Si no se encontró totalPages pero hay 20 resultados, estimar más páginas
            if (!totalPagesMatch && resultados.length >= 20) {
                pagination.totalPages = parseInt(page) + 1;
            }
        } catch (e) {
            console.error('Error extrayendo paginación:', e.message);
        }

        res.json({ results: resultados, pagination });
    } catch (e) {
        console.error('Error en /search:', e.message);
        res.json({ results: [], pagination: { currentPage: 1, totalPages: 1, totalRecords: 0 } });
    }
});

// 3. INFO DEL ANIME (Detalles y Lista de Caps)
app.get('/anime-info', async (req, res) => {
    const { slug } = req.query;
    const ahora = Date.now();
    if (INFO_CACHE.has(slug) && (ahora - INFO_CACHE.get(slug).time < 3600000)) return res.json(INFO_CACHE.get(slug).data);
    try {
        const $ = await fetchAndParse(`https://animeav1.com/media/${slug.split('/')[0]}`);
        const scripts = $('script').map((i, el) => $(el).html()).get().join('');
        
        const mediaId = scripts.match(/media:\{id:(\d+)/)?.[1];
        const episodes = [];
        const regex = /\{id:(\d+),number:(\d+)\}/g;
        let m;
        while ((m = regex.exec(scripts)) !== null) {
            episodes.push({ numero: parseInt(m[2]), thumbnail: mediaId ? `https://cdn.animeav1.com/screenshots/${mediaId}/${m[2]}.jpg` : "" });
        }
        
        const info = {
            descripcion: scripts.match(/synopsis:"([\s\S]*?)",/)?.[1]?.replace(/\\n/g, ' ') || "Sin descripción.",
            rating: scripts.match(/score:(\d+\.?\d*)/)?.[1] || "0.0",
            anio: scripts.match(/startDate:"(\d{4})/)?.[1] || "",
            generos: [...new Set([...scripts.matchAll(/name:"([^"]+)"/g)].map(m => m[1]))].filter(n => n.length > 3 && !n.includes('Anime')).slice(0, 5),
            episodios: episodes.sort((a, b) => b.numero - a.numero)
        };
        
        INFO_CACHE.set(slug, { data: info, time: ahora });
        res.json(info);
    } catch (e) { res.json({ error: "Error" }); }
});

// 4. REPRODUCTOR - Axios + Cheerio
app.get('/get-video', async (req, res) => {
    const { slug, cap } = req.query;
    try {
        const $ = await fetchAndParse(`https://animeav1.com/media/${slug}/${cap}`);
        const scripts = $('script').map((i, el) => $(el).html()).get();
        const script = scripts.find(s => s.includes('embeds'));
        if (!script) return res.json({ servidores: [] });
        
        const results = [];
        const regex = /\{server:"([^"]+)",url:"([^"]+)"\}/g;
        let m;
        while ((m = regex.exec(script)) !== null) {
            results.push({ nombre: m[1].toUpperCase(), url: m[2].replace(/\\u0023/g, '#') });
        }
        res.json({ servidores: results });
    } catch (e) { res.json({ servidores: [] }); }
});