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
        app.listen(port, '0.0.0.0', () => {
            console.log(`📡 Servidor escuchando en puerto ${port}`);
        });
        await new Promise(resolve => setTimeout(resolve, 5000));
        browser = await puppeteer.launch({
            headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--no-first-run', '--no-zygote', '--single-process']
        });
        console.log("Servidor corriendo en la nube ✅");
    } catch (error) { console.error("❌ Error al arrancar:", error); }
}
startApp();

// 1. ÚLTIMOS ESTRENOS
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

// 2. BUSCADOR (Corregido para evitar el 'undefined' en el tag de episodio)
app.get('/search', async (req, res) => {
    const { q, page = 1 } = req.query;
    const pageBrowser = await browser.newPage();
    try {
        await pageBrowser.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
        let urlBase = (q.includes('minYear') || q.includes('genre'))
            ? `https://animeav1.com/catalogo?${q}`
            : `https://animeav1.com/catalogo?search=${encodeURIComponent(q)}`;
        await pageBrowser.goto(`${urlBase}&page=${page}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await new Promise(r => setTimeout(r, 2000));
        const resultados = await pageBrowser.evaluate(() => {
            return Array.from(document.querySelectorAll('article')).map(item => {
                const a = item.querySelector('a[href*="/media/"]');
                const img = item.querySelector('img');
                const h3 = item.querySelector('h3');
                if (!a || !img) return null;
                return {
                    titulo: h3 ? h3.innerText.trim() : "Sin título",
                    imagen: img.src,
                    slug: a.href.split('/media/')[1],
                    cap: null // Seteamos null para que el frontend no muestre 'undefined'
                };
            }).filter(r => r !== null);
        });
        await pageBrowser.close();
        res.json(resultados);
    } catch (e) { if (pageBrowser) await pageBrowser.close(); res.json([]); }
});

// 3. INFO DEL ANIME
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
            const mediaId = text.match(/media:\{id:(\d+)/)?.[1];
            const episodes = [];
            const regex = /\{id:(\d+),number:(\d+)\}/g;
            let match;
            while ((match = regex.exec(text)) !== null) {
                episodes.push({ numero: parseInt(match[2]), thumbnail: mediaId ? `https://cdn.animeav1.com/screenshots/${mediaId}/${match[2]}.jpg` : "" });
            }
            return {
                descripcion: text.match(/synopsis:"([\s\S]*?)",/)?.[1].replace(/\\n/g, ' ') || "Sin descripción.",
                rating: text.match(/score:(\d+\.?\d*)/)?.[1] || "0.0",
                anio: text.match(/startDate:"(\d{4})/)?.[1] || "",
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

// 4. REPRODUCTOR (CORREGIDO CON LA URL /VER/)
app.get('/get-video', async (req, res) => {
    const { slug, cap } = req.query;
    const page = await browser.newPage();
    try {
        const videoUrl = `https://animeav1.com/ver/${slug}-${cap}`;
        console.log(`🎬 Scrapeando: ${videoUrl}`);
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
        await page.goto(videoUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
        await new Promise(r => setTimeout(r, 2500)); // Tiempo para Railway
        const servidores = await page.evaluate(() => {
            const scripts = Array.from(document.querySelectorAll('script'));
            const dataScript = scripts.find(s => s.innerText.includes('embeds'));
            if (!dataScript) return [];
            const results = [];
            const regex = /\{server:"([^"]+)",url:"([^"]+)"\}/g;
            let m;
            while ((m = regex.exec(dataScript.innerText)) !== null) {
                results.push({ nombre: m[1].toUpperCase(), url: m[2].replace(/\\u0023/g, '#') });
            }
            return results;
        });
        await page.close();
        res.json({ servidores });
    } catch (e) { if (page) await page.close(); res.json({ servidores: [] }); }
});