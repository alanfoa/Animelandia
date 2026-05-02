const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

// Configuración
const TARGET_URL = 'https://animeav1.com';
const TEST_SLUG = 'one-piece';
const ITERATIONS = 3;

// Utilidad para medir tiempo
const measureTime = async (fn, label) => {
    const start = Date.now();
    try {
        const result = await fn();
        const time = Date.now() - start;
        console.log(`✅ ${label}: ${time}ms - ${result.length || result.episodios?.length || 0} items`);
        return { time, result };
    } catch (e) {
        const time = Date.now() - start;
        console.log(`❌ ${label}: ${time}ms - ERROR: ${e.message}`);
        return { time, error: e.message };
    }
};

// ===================== OPCIÓN A: Axios + Cheerio (Más rápida) =====================
async function testAxiosCheerioLatest() {
    const response = await axios.get(TARGET_URL, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        timeout: 15000
    });
    
    const $ = cheerio.load(response.data);
    const scripts = $('script').map((i, el) => $(el).html()).get();
    const target = scripts.find(s => s.includes('latestEpisodes'));
    
    if (!target) return [];
    
    const results = [];
    const regex = /id:(\d+),slug:"([^"]+)",title:"([^"]+)"\},number:(\d+)/g;
    let m;
    while ((m = regex.exec(target)) !== null) {
        results.push({ 
            titulo: m[3], 
            imagen: `https://cdn.animeav1.com/covers/${m[1]}.jpg`, 
            slug: m[2], 
            cap: m[4] 
        });
    }
    return results.slice(0, 24);
}

async function testAxiosCheerioSearch(query) {
    const response = await axios.get(`https://animeav1.com/catalogo?search=${encodeURIComponent(query)}`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        timeout: 15000
    });
    
    const $ = cheerio.load(response.data);
    const results = [];
    
    $('article').each((i, el) => {
        const article = $(el);
        const a = article.find('a[href*="/media/"]');
        const img = article.find('img');
        const h3 = article.find('h3');
        
        if (a.length && img.length) {
            const labels = article.find('div').map((i, d) => $(d).text().trim()).get();
            results.push({
                titulo: h3.text().trim() || "Sin título",
                imagen: img.attr('src'),
                slug: a.attr('href').split('/media/')[1],
                anio: labels.find(l => /^\d{4}$/.test(l)) || "",
                tipo: labels.find(l => ["TV", "MOVIE", "OVA", "SPECIAL"].includes(l)) || "Anime",
                cap: null
            });
        }
    });
    
    return results;
}

async function testAxiosCheerioAnimeInfo(slug) {
    const response = await axios.get(`https://animeav1.com/media/${slug}`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        timeout: 15000
    });
    
    const $ = cheerio.load(response.data);
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
    
    return {
        descripcion: scripts.match(/synopsis:"([\s\S]*?)",/)?.[1]?.replace(/\\n/g, ' ') || "Sin descripción.",
        rating: scripts.match(/score:(\d+\.?\d*)/)?.[1] || "0.0",
        anio: scripts.match(/startDate:"(\d{4})/)?.[1] || "",
        generos: [...new Set([...scripts.matchAll(/name:"([^"]+)"/g)].map(m => m[1]))].filter(n => n.length > 3 && !n.includes('Anime')).slice(0, 5),
        episodios: episodes.sort((a, b) => b.numero - a.numero)
    };
}

// ===================== OPCIÓN B: Puppeteer Optimizado (Bloquea recursos) =====================
async function testPuppeteerOptimizedLatest() {
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    
    const page = await browser.newPage();
    
    // Bloquear imágenes, CSS, fonts
    await page.setRequestInterception(true);
    page.on('request', (req) => {
        if (['image', 'stylesheet', 'font', 'media'].includes(req.resourceType())) {
            req.abort();
        } else {
            req.continue();
        }
    });
    
    await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    
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
    
    await browser.close();
    return episodios.slice(0, 24);
}

// ===================== OPCIÓN C: Puppeteer Actual (Baseline) =====================
async function testPuppeteerCurrentLatest() {
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--single-process']
    });
    
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    await page.goto(TARGET_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    
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
    
    await browser.close();
    return episodios.slice(0, 24);
}

// ===================== BENCHMARK =====================
async function runBenchmark() {
    console.log('\n🚀 INICIANDO BENCHMARK DE SCRAPING');
    console.log('='.repeat(60));
    
    const results = {
        axios: { times: [], avg: 0 },
        puppeteerOptimized: { times: [], avg: 0 },
        puppeteerCurrent: { times: [], avg: 0 }
    };
    
    // Test 1: Últimos episodios
    console.log('\n📺 TEST 1: /latest (Últimos episodios)');
    console.log('-'.repeat(60));
    
    for (let i = 0; i < ITERATIONS; i++) {
        console.log(`\nIteración ${i + 1}:`);
        
        const a = await measureTime(testAxiosCheerioLatest, 'Axios + Cheerio');
        results.axios.times.push(a.time);
        
        const b = await measureTime(testPuppeteerOptimizedLatest, 'Puppeteer Optimizado');
        results.puppeteerOptimized.times.push(b.time);
        
        const c = await measureTime(testPuppeteerCurrentLatest, 'Puppeteer Actual (baseline)');
        results.puppeteerCurrent.times.push(c.time);
    }
    
    // Calcular promedios
    for (let method in results) {
        results[method].avg = Math.round(results[method].times.reduce((a, b) => a + b, 0) / ITERATIONS);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESULTADOS FINALES (promedio):');
    console.log('='.repeat(60));
    console.log(`Axios + Cheerio:          ${results.axios.avg}ms`);
    console.log(`Puppeteer Optimizado:     ${results.puppeteerOptimized.avg}ms`);
    console.log(`Puppeteer Actual:         ${results.puppeteerCurrent.avg}ms`);
    console.log(`\nMejora estimada: ${Math.round((1 - results.axios.avg / results.puppeteerCurrent.avg) * 100)}% más rápido`);
    
    // Test 2: Búsqueda (solo Axios + Cheerio, más rápido)
    console.log('\n' + '='.repeat(60));
    console.log('🔍 TEST 2: /search (Búsqueda)');
    console.log('-'.repeat(60));
    
    const searchResult = await measureTime(() => testAxiosCheerioSearch('one piece'), 'Axios + Cheerio Search');
    
    // Test 3: Info de anime (solo Axios + Cheerio)
    console.log('\n' + '='.repeat(60));
    console.log('ℹ️  TEST 3: /anime-info (Info de anime)');
    console.log('-'.repeat(60));
    
    const infoResult = await measureTime(() => testAxiosCheerioAnimeInfo(TEST_SLUG), 'Axios + Cheerio Anime Info');
    if (infoResult.result) {
        console.log(`   Rating: ${infoResult.result.rating}`);
        console.log(`   Año: ${infoResult.result.anio}`);
        console.log(`   Episodios: ${infoResult.result.episodios.length}`);
    }
    
    console.log('\n✅ BENCHMARK COMPLETADO');
}

// Ejecutar benchmark
runBenchmark().catch(console.error);
