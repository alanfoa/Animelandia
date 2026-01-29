const express = require('express');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const cors = require('cors');

puppeteer.use(StealthPlugin());
const app = express();
app.use(cors());

let browser;
let INFO_CACHE = new Map();
let LATEST_CACHE = { data: null, lastUpdate: 0 };

async function startApp() {
    try {
        browser = await puppeteer.launch({
            headless: "new",
            // ESTA ES LA RUTA QUE RENDER SÍ RECONOCE
            executablePath: '/usr/bin/google-chrome-stable', 
            args: [
                '--no-sandbox', 
                '--disable-setuid-sandbox', 
                '--disable-dev-shm-usage', 
                '--single-process'
            ]
        });
        console.log('🚀 Sniper Animelandia: MOTOR OPERATIVO');
        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => console.log(`🔥 Servidor listo en puerto ${PORT}`));
    } catch (err) { 
        console.error("❌ Error fatal:", err); 
    }
}
startApp();

// 1. ÚLTIMOS ESTRENOS
// 1. ÚLTIMOS ESTRENOS (CORREGIDO PARA CARGA RÁPIDA)
app.get('/latest', async (req, res) => {
    const ahora = Date.now();
    // Cache de 10 minutos para no saturar
    if (LATEST_CACHE.data && (ahora - LATEST_CACHE.lastUpdate < 600000)) return res.json(LATEST_CACHE.data);
    
    const page = await browser.newPage();
    try {
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
        
        // Vamos directo a la home sin parámetros de página
        await page.goto('https://animeav1.com/', { waitUntil: 'domcontentloaded' });
        
        const episodios = await page.evaluate(() => {
            const scripts = Array.from(document.querySelectorAll('script'));
            const target = scripts.find(s => s.innerText.includes('latestEpisodes'));
            const results = [];
            const regex = /media:\{id:(\d+),slug:"([^"]+)",title:"([^"]+)"\},number:(\d+)/g;
            let m;
            while ((m = regex.exec(target.innerText)) !== null) {
                results.push({ 
                    titulo: m[3], 
                    imagen: `https://cdn.animeav1.com/covers/${m[1]}.jpg`, 
                    slug: m[2], 
                    cap: m[4] 
                });
            }
            return results;
        });

        await page.close();
        LATEST_CACHE = { data: episodios.slice(0, 24), lastUpdate: ahora };
        res.json(LATEST_CACHE.data);
    } catch (e) { 
        if (page) await page.close(); 
        res.json([]); 
    }
});

// 2. BUSCADOR CON PAGINACIÓN BAJO DEMANDA
app.get('/search', async (req, res) => {
    const { q, page = 1 } = req.query; // Recibe el número de página
    const pageBrowser = await browser.newPage();
    try {
        await pageBrowser.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

        let urlBase = (q.includes('minYear') || q.includes('category') || q.includes('genre') || q.includes('status')) 
            ? `https://animeav1.com/catalogo?${q}` 
            : `https://animeav1.com/catalogo?search=${encodeURIComponent(q)}`;

        // Agregamos el parámetro de página a la URL oficial
        let urlFinal = `${urlBase}&page=${page}`;
        console.log(`Buscando en página ${page}: ${urlFinal}`);

        await pageBrowser.goto(urlFinal, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await new Promise(r => setTimeout(r, 1500)); // Espera mínima para SPA

        const resultados = await pageBrowser.evaluate(() => {
            return Array.from(document.querySelectorAll('article')).map(item => {
                const a = item.querySelector('a[href*="/media/"]');
                const img = item.querySelector('img');
                const h3 = item.querySelector('h3');
                const labels = Array.from(item.querySelectorAll('div')).map(d => d.innerText.toUpperCase().trim());
                
                let tipo = "Anime";
                if (labels.some(l => l.includes("PELÍCULA"))) tipo = "PELÍCULA";
                else if (labels.some(l => l.includes("OVA"))) tipo = "OVA";
                else if (labels.some(l => l.includes("TV"))) tipo = "TV ANIME";

                if (!a || !img) return null;
                return {
                    titulo: h3 ? h3.innerText.trim() : "Sin título",
                    imagen: img.src,
                    slug: a.href.split('/media/')[1],
                    anio: labels.find(l => /^\d{4}$/.test(l)) || "",
                    tipo: tipo
                };
            }).filter(r => r !== null);
        });

        await pageBrowser.close();
        res.json(resultados);
    } catch (e) {
        if (pageBrowser) await pageBrowser.close();
        res.json([]);
    }
});

// 3. INFO DEL ANIME (AÑO Y DETALLES)
app.get('/anime-info', async (req, res) => {
    const { slug } = req.query;
    const ahora = Date.now();
    if (INFO_CACHE.has(slug) && (ahora - INFO_CACHE.get(slug).time < 3600000)) return res.json(INFO_CACHE.get(slug).data);

    const page = await browser.newPage();
    try {
        await page.goto(`https://animeav1.com/media/${slug.split('/')[0]}`, { waitUntil: 'domcontentloaded' });

        const infoTotal = await page.evaluate(() => {
            const scripts = Array.from(document.querySelectorAll('script'));
            const dataScript = scripts.find(s => s.innerText.includes('startDate:'));
            if (!dataScript) return null;
            const text = dataScript.innerText;

            const dateMatch = text.match(/startDate:"(\d{4})-\d{2}-\d{2}"/);
            const mediaIdMatch = text.match(/media:\{id:(\d+)/);
            const mediaId = mediaIdMatch ? mediaIdMatch[1] : null;

            const episodeRegex = /\{id:(\d+),number:(\d+)\}/g;
            const episodes = [];
            let match;
            while ((match = episodeRegex.exec(text)) !== null) {
                episodes.push({
                    numero: parseInt(match[2]),
                    thumbnail: mediaId ? `https://cdn.animeav1.com/screenshots/${mediaId}/${match[2]}.jpg` : ""
                });
            }

            return {
                descripcion: text.match(/synopsis:"([\s\S]*?)",/)?.[1].replace(/\\n/g, ' ').replace(/\\"/g, '"') || "Sin descripción.",
                rating: text.match(/score:(\d+\.?\d*)/)?.[1] || "0.0",
                anio: dateMatch ? dateMatch[1] : "",
                generos: [...new Set([...text.matchAll(/name:"([^"]+)"/g)].map(m => m[1]))].filter(n => n.length > 3 && !n.includes('Anime')).slice(0, 5),
                episodios: episodes
            };
        });

        await page.close();
        if (infoTotal) {
            infoTotal.episodios.sort((a, b) => b.numero - a.numero);
            INFO_CACHE.set(slug, { data: infoTotal, time: ahora });
            return res.json(infoTotal);
        }
        res.json({ error: "Error" });
    } catch (e) { if (page) await page.close(); res.json({ error: "Error" }); }
});

app.get('/get-video', async (req, res) => {
    const { slug, cap } = req.query;
    const page = await browser.newPage();
    try {
        await page.goto(`https://animeav1.com/media/${slug}/${cap}`, { waitUntil: 'domcontentloaded' });
        const servidores = await page.evaluate(() => {
            const scripts = Array.from(document.querySelectorAll('script'));
            const dataScript = scripts.find(s => s.innerText.includes('embeds'));
            if (!dataScript) return [];
            const results = [];
            const regex = /\{server:"([^"]+)",url:"([^"]+)"\}/g;
            let m;
            while ((m = regex.exec(dataScript.innerText)) !== null) {
                const url = m[2].replace(/\\u0023/g, '#');
                if (url.includes('http') && !results.some(s => s.url === url)) results.push({ nombre: m[1].toUpperCase(), url });
            }
            return results;
        });
        await page.close();
        res.json({ servidores });
    } catch (e) { if (page) await page.close(); res.json({ servidores: [] }); }
});