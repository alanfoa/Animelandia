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
        const port = process.env.PORT || 3000;
        app.listen(port, '0.0.0.0', () => console.log(`📡 Servidor en puerto ${port}`));
        await new Promise(resolve => setTimeout(resolve, 5000));
        browser = await puppeteer.launch({
            headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--single-process']
        });
        console.log("✅ Navegador listo");
    } catch (error) { console.error("❌ Error:", error); }
}
startApp();

// 1. ÚLTIMOS ESTRENOS (Para la Home)
app.get('/latest', async (req, res) => {
    const ahora = Date.now();
    if (LATEST_CACHE.data && (ahora - LATEST_CACHE.lastUpdate < 600000)) return res.json(LATEST_CACHE.data);
    let page;
    try {
        page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
        await page.goto('https://animeav1.com/', { waitUntil: 'networkidle2', timeout: 30000 });
        const episodios = await page.evaluate(() => {
            const scripts = Array.from(document.querySelectorAll('script'));
            const target = scripts.find(s => s.innerText.includes('latestEpisodes'));
            if (!target) return [];
            const results = [];
            const regex = /id:(\d+),slug:"([^"]+)",title:"([^"]+)"\},number:(\d+)/g;
            let m;
            while ((m = regex.exec(target.innerText)) !== null) {
                results.push({ titulo: m[3], imagen: `https://cdn.animeav1.com/covers/${m[1]}.jpg`, slug: m[2], cap: m[4] });
            }
            return results;
        });
        await page.close();
        LATEST_CACHE = { data: episodios.slice(0, 24), lastUpdate: ahora };
        res.json(LATEST_CACHE.data);
    } catch (e) { if (page) await page.close(); res.json([]); }
});

// 2. BUSCADOR (Para buscar series - Corregido sin undefined)
app.get('/search', async (req, res) => {
    const { q, page = 1 } = req.query;
    const pBrowser = await browser.newPage();
    try {
        await pBrowser.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
        let url = q.includes('genre') ? `https://animeav1.com/catalogo?${q}&page=${page}` : `https://animeav1.com/catalogo?search=${encodeURIComponent(q)}&page=${page}`;
        await pBrowser.goto(url, { waitUntil: 'domcontentloaded', timeout: 40000 });
        await new Promise(r => setTimeout(r, 2000));
        const resultados = await pBrowser.evaluate(() => {
            return Array.from(document.querySelectorAll('article')).map(item => {
                const a = item.querySelector('a[href*="/media/"]');
                const img = item.querySelector('img');
                const h3 = item.querySelector('h3');
                if (!a || !img) return null;
                return { titulo: h3 ? h3.innerText.trim() : "Sin título", imagen: img.src, slug: a.href.split('/media/')[1], cap: null };
            }).filter(r => r !== null);
        });
        await pBrowser.close();
        res.json(resultados);
    } catch (e) { if (pBrowser) await pBrowser.close(); res.json([]); }
});

// 3. INFO DEL ANIME (Para la página de detalles y lista de caps)
app.get('/anime-info', async (req, res) => {
    const { slug } = req.query;
    const page = await browser.newPage();
    try {
        await page.goto(`https://animeav1.com/media/${slug.split('/')[0]}`, { waitUntil: 'domcontentloaded' });
        const info = await page.evaluate(() => {
            const scripts = Array.from(document.querySelectorAll('script')).map(s => s.innerText).join('');
            const mediaId = scripts.match(/media:\{id:(\d+)/)?.[1];
            const episodes = [];
            const regex = /\{id:(\d+),number:(\d+)\}/g;
            let m;
            while ((m = regex.exec(scripts)) !== null) {
                episodes.push({ numero: parseInt(m[2]), thumbnail: mediaId ? `https://cdn.animeav1.com/screenshots/${mediaId}/${m[2]}.jpg` : "" });
            }
            return {
                descripcion: scripts.match(/synopsis:"([\s\S]*?)",/)?.[1]?.replace(/\\n/g, ' ') || "Sin descripción.",
                rating: scripts.match(/score:(\d+\.?\d*)/)?.[1] || "0.0",
                anio: scripts.match(/startDate:"(\d{4})/)?.[1] || "",
                generos: [...new Set([...scripts.matchAll(/name:"([^"]+)"/g)].map(m => m[1]))].filter(n => n.length > 3 && !n.includes('Anime')).slice(0, 5),
                episodios: episodes
            };
        });
        await page.close();
        info.episodios.sort((a, b) => b.numero - a.numero);
        res.json(info);
    } catch (e) { if (page) await page.close(); res.json({ error: "Error" }); }
});

// 4. REPRODUCTOR (Única versión que extrae los servidores de video)
app.get('/get-video', async (req, res) => {
    const { slug, cap } = req.query;
    let page;
    try {
        page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

        const videoUrl = `https://animeav1.com/ver/${slug}-${cap}`;
        console.log(`🚀 Forzando scraping en: ${videoUrl}`);

        await page.goto(videoUrl, { waitUntil: 'networkidle2', timeout: 50000 });

        // TRUCO: Hacemos un scroll pequeño. Algunos sitios no cargan scripts de video hasta que hay interacción.
        await page.evaluate(() => window.scrollBy(0, 300));
        await new Promise(r => setTimeout(r, 3000)); // Damos 3 segundos reales

        const servidores = await page.evaluate(() => {
            const scripts = Array.from(document.querySelectorAll('script'));
            // Buscamos con un método más agresivo cualquier script que mencione 'embeds'
            const target = scripts.find(s => s.innerText.toLowerCase().includes('embeds'));
            if (!target) return [];

            const results = [];
            const regex = /\{server:"([^"]+)",url:"([^"]+)"\}/g;
            let m;
            while ((m = regex.exec(target.innerText)) !== null) {
                const url = m[2].replace(/\\u0023/g, '#');
                if (url.includes('http') && !results.some(s => s.url === url)) {
                    results.push({ nombre: m[1].toUpperCase(), url });
                }
            }
            return results;
        });

        await page.close();

        if (servidores.length === 0) {
            console.log("❌ Sigue sin encontrar. Probablemente el script cambió de nombre.");
        }

        res.json({ servidores });

    } catch (e) {
        console.error("❌ Error en get-video:", e.message);
        if (page) await page.close();
        res.json({ servidores: [] });
    }
});