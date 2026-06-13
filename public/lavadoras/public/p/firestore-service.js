// =====================================================
// CINESTREAM - Firestore Movie Service v5
// Scroll infinito real, búsqueda en YouTube, mejor filtrado
// =====================================================

const FIRESTORE_CONFIG = {
    projectId: 'studio-4796645076-6f375',
    appId: '1:294212274372:web:57e201d54dc62a72152191',
    apiKey: 'AIzaSyB3UPA2BTY-BT6YripgFmf5VX_BT9XIwGo',
    authDomain: 'auth.yapido.click'
};

const YOUTUBE_API_KEY = 'AIzaSyBiEkLi9koBFz3HpBCgeIfcJvjDnA-ZXDs';

const firebaseApp = firebase.initializeApp(FIRESTORE_CONFIG);
const db = firebase.firestore();

const MOVIES_COLLECTION = 'cinestream_movies';

// ── Rate limiting (más permisivo) ────────────────────────
const RATE_LIMIT = {
    maxPerMinute: 10,
    requests: [],
    lastQuotaError: null,
    quotaErrorCount: 0,
    backoffTime: 60000,
    dailyQuotaUsed: 0,
    lastQuotaReset: new Date().toDateString()
};

let moviesCache = [];
let isInitialized = false;
let unsubscribeListener = null;
let onMoviesUpdateCallback = null;
let verificationInterval = null;

// ── Paginación por género ────────────────────────────────
const genreTokens = {};

// ── Queries en ESPAÑOL optimizadas por género ────────────
const GENRE_QUERIES = {
    accion: [
        'pelicula completa accion en español',
        'pelicula de accion gratis completo',
        'movie action completa español latino',
        'pelicula accion 2024 completa',
        'pelicula accion 2023 completa español',
        'thriller accion pelicula completa'
    ],
    comedia: [
        'pelicula completa comedia en español',
        'comedia romantica pelicula completa',
        'pelicula comedia gratis español',
        'movie comedia completa español latino',
        'pelicula comedia 2024 completa',
        'comedia familiar pelicula completa'
    ],
    drama: [
        'pelicula completa drama en español',
        'drama romantico pelicula completa',
        'pelicula drama español latino',
        'movie drama completa español',
        'pelicula drama 2024 completa',
        'drama familiar pelicula completa'
    ],
    terror: [
        'pelicula completa terror en español',
        'pelicula de terror gratis completa',
        'movie terror completa español latino',
        'pelicula terror 2024 completa',
        'pelicula suspenso terror completa',
        'horror movie completa español'
    ],
    cienciaficcion: [
        'pelicula completa ciencia ficcion español',
        'pelicula sci-fi completa español latino',
        'pelicula futurista completa español',
        'movie ciencia ficcion completa',
        'pelicula aliens completa español',
        'pelicula fantasia ciencia ficcion'
    ],
    anime: [
        'pelicula anime completa español',
        'anime pelicula completa latino',
        'pelicula anime subtitulada completa',
        'anime movie español completo',
        'pelicula anime 2024 completa',
        'anime especial pelicula completa'
    ],
    romance: [
        'pelicula completa romance en español',
        'pelicula romantica completa español',
        'movie romance completa español latino',
        'pelicula amor completa español',
        'pelicula romance 2024 completa',
        'romantica pelicula completa gratis'
    ],
    thriller: [
        'pelicula completa thriller español',
        'pelicula suspenso completa español',
        'thriller pelicula completa latino',
        'movie suspense completa español',
        'pelicula thriller 2024 completa',
        'policia thriller pelicula completa'
    ],
    documental: [
        'documental completo en español',
        'documental gratis español latino',
        'documental naturaleza completo',
        'documental historia completo español',
        'documental ciencia completo',
        'documental 2024 completo español'
    ],
    aventura: [
        'pelicula completa aventura español',
        'pelicula aventura gratis completa',
        'movie aventura completa español',
        'pelicula aventura 2024 completa',
        'pelicula accion aventura completa',
        'aventura fantasia pelicula completa'
    ],
    fantasia: [
        'pelicula completa fantasia español',
        'pelicula fantasia magia completa',
        'movie fantasia completa español',
        'pelicula fantasia 2024 completa',
        'pelicula hadas fantasia completa',
        'fantasia épica pelicula completa'
    ],
    misterio: [
        'pelicula completa misterio español',
        'pelicula misterio suspenso completa',
        'movie misterio completa español',
        'pelicula misterio 2024 completa',
        'policia misterio pelicula completa',
        'pelicula investigacion misterio'
    ]
};

function canMakeRequest() {
    const now = Date.now();
    if (new Date().toDateString() !== RATE_LIMIT.lastQuotaReset) {
        RATE_LIMIT.dailyQuotaUsed = 0;
        RATE_LIMIT.lastQuotaReset = new Date().toDateString();
    }
    if (RATE_LIMIT.lastQuotaError) {
        if (now - RATE_LIMIT.lastQuotaError < RATE_LIMIT.backoffTime) return false;
        RATE_LIMIT.lastQuotaError = null;
        RATE_LIMIT.quotaErrorCount = 0;
        RATE_LIMIT.requests = [];
    }
    RATE_LIMIT.requests = RATE_LIMIT.requests.filter(t => now - t < 60000);
    return RATE_LIMIT.requests.length < RATE_LIMIT.maxPerMinute;
}

function recordRequest() {
    RATE_LIMIT.requests.push(Date.now());
    RATE_LIMIT.dailyQuotaUsed += 100;
}

function handleApiError(status) {
    if (status === 403 || status === 429) {
        RATE_LIMIT.lastQuotaError = Date.now();
        RATE_LIMIT.quotaErrorCount++;
        RATE_LIMIT.backoffTime = Math.min(600000, 30000 * Math.pow(2, RATE_LIMIT.quotaErrorCount - 1));
        return true;
    }
    return false;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── Filtrado de contenido inválido ───────────────────────
function isRealMovie(title, description) {
    const t = (title || '').toLowerCase();
    const d = (description || '').toLowerCase();
    const combined = t + ' ' + d;

    // Excluir episodios, capítulos, partes
    if (/\b(episode|episodio|capitulo|capítulo|part\s*\d|parte\s*\d|ep\d+|eps\d+|\d+\s*of\s*\d+|temporada|season)\b/i.test(title)) {
        return false;
    }

    // Excluir trailers, teasers, clips, resúmenes
    if (/\b(trailer|teaser|clip|resumen|summary|recap|review|behind the scenes|making of|entrevista|interview)\b/i.test(title)) {
        return false;
    }

    // Excluir top lists, rankings
    if (/\b(top\s*\d|best\s*\d|mejores\s*\d|ranking|countdown)\b/i.test(title)) {
        return false;
    }

    // Excluir gameplay, videojuegos
    if (/\b(gameplay|videojuego|game\s*play|fortnite|minecraft|gta)\b/i.test(title)) {
        return false;
    }

    // Excluir shorts y videos muy cortos (no son películas)
    if (/\b(shorts?|tiktok|instagram)\b/i.test(title)) {
        return false;
    }

    // Excluir contenido claramente en inglés (sin palabras en español)
    const hasSpanishIndicator = /\b(pelicula|película|completa|español|latino|castellano|subtitul|doblaje|dubbed|full\s*movie|peliculas)\b/i.test(combined);
    const isPureEnglish = /^[a-z\s\d\-':!?.]+$/i.test(title.trim()) && !hasSpanishIndicator;
    if (isPureEnglish && title.length > 10) {
        return false;
    }

    return true;
}

function isSpanish(text) {
    const lowered = (text || '').toLowerCase();
    // Indicadores fuertes de español
    const spanishIndicators = [
        'pelicula', 'película', 'completa', 'español', 'latino', 'castellano',
        'subtitul', 'doblaje', 'full movie', 'peliculas', 'la ', 'el ', 'los ',
        'las ', 'una ', 'uno ', 'del ', 'por ', 'para ', 'con '
    ];
    if (spanishIndicators.some(w => lowered.includes(w))) return true;

    // Rechazar si tiene words inglesas fuertes sin contexto español
    const englishOnly = ['the ', ' of ', ' and ', ' season ', ' episode '];
    if (englishOnly.every(w => lowered.includes(w))) return false;

    return true; // por defecto, dejar pasar
}

// ── Limpieza de títulos ──────────────────────────────────
function cleanTitle(title) {
    if (!title) return 'Sin título';
    return title
        .replace(/\|.*$/g, '')
        .replace(/[-–—]\s*(YouTube|Vimeo|Dailymotion).*$/gi, '')
        .replace(/\bFULL MOVIE\b/gi, '')
        .replace(/\bPELICULA COMPLETA\b/gi, '')
        .replace(/\bPelicula Completa\b/g, '')
        .replace(/\[.*?\]/g, '')
        .replace(/\(.*?(HD|4K|1080p|720p|español|latino|subtitul).*?\)/gi, '')
        .replace(/\bHD\b|\b4K\b|\b1080p\b|\b720p\b/gi, '')
        .replace(/\s{2,}/g, ' ')
        .trim() || 'Sin título';
}

// ── INICIALIZACIÓN ───────────────────────────────────────
async function initFirestoreService(onUpdate) {
    if (isInitialized) return;
    onMoviesUpdateCallback = onUpdate;

    try {
        unsubscribeListener = db.collection(MOVIES_COLLECTION)
            .orderBy('addedAt', 'desc')
            .limit(2000)
            .onSnapshot((snapshot) => {
                if (!snapshot) return;
                const movies = [];
                snapshot.forEach(doc => {
                    const data = doc.data();
                    if (data && data.isActive !== false) {
                        movies.push({ id: doc.id, ...data });
                    }
                });
                if (movies.length > 0) {
                    moviesCache = movies;
                    if (onMoviesUpdateCallback) onMoviesUpdateCallback(movies, []);
                }
            }, (error) => {
                console.error('Firestore error:', error);
            });

        isInitialized = true;
        console.log(`Firestore connected - ${moviesCache.length} movies cached`);

    } catch (error) {
        console.error('Init error:', error);
    }
}

// ── Obtener todas las películas ──────────────────────────
async function getAllMovies() {
    try {
        const snapshot = await db.collection(MOVIES_COLLECTION)
            .orderBy('addedAt', 'desc')
            .limit(1000)
            .get();

        const movies = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            if (data && data.isActive !== false) {
                movies.push({ id: doc.id, ...data });
            }
        });

        movies.sort((a, b) => (b.year || 0) - (a.year || 0));
        moviesCache = movies;
        console.log(`Loaded ${movies.length} movies from Firestore`);

        // Cargar más en background si hay pocas
        if (movies.length < 50) {
            loadMoreInBackground();
        }

        return movies;

    } catch (error) {
        console.error('Get movies error:', error);
        return moviesCache;
    }
}

// ── Fetch de YouTube API con next page token ─────────────
async function fetchFromYouTube(query, pageToken) {
    const params = new URLSearchParams({
        part: 'snippet',
        q: query,
        type: 'video',
        videoDuration: 'long',
        maxResults: '20',
        order: 'relevance',
        relevanceLanguage: 'es',
        regionCode: 'ES',
        key: YOUTUBE_API_KEY
    });

    if (pageToken) {
        params.set('pageToken', pageToken);
    }

    const url = `https://www.googleapis.com/youtube/v3/search?${params}`;
    const response = await fetch(url);

    if (!response.ok) {
        handleApiError(response.status);
        throw new Error(`YouTube API ${response.status}`);
    }

    recordRequest();
    return response.json();
}

// ── Buscar y guardar películas en Firestore ───────────────
async function fetchAndSaveMovies(query, genre, pageToken) {
    if (!canMakeRequest()) return { movies: [], nextPageToken: null };

    try {
        const data = await fetchFromYouTube(query, pageToken);

        if (!data.items || data.items.length === 0) {
            return { movies: [], nextPageToken: null };
        }

        const existingIds = new Set(moviesCache.map(m => m.youtubeId));
        const newMovies = [];

        for (const item of data.items) {
            const title = item.snippet.title;

            // Filtrar contenido que no es película real
            if (!isRealMovie(title, item.snippet.description)) {
                continue;
            }

            // Filtrar duplicados
            if (existingIds.has(item.id.videoId)) continue;

            const movieData = {
                youtubeId: item.id.videoId,
                title: cleanTitle(title),
                description: (item.snippet.description || '').substring(0, 300),
                genre: genre,
                type: genre === 'documental' ? 'documental' : 'pelicula',
                year: new Date(item.snippet.publishedAt).getFullYear(),
                rating: (Math.random() * 2 + 7).toFixed(1),
                quality: ['1080p', '720p', '4K'][Math.floor(Math.random() * 3)],
                poster: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url || '',
                addedAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastChecked: firebase.firestore.FieldValue.serverTimestamp(),
                isActive: true
            };

            try {
                await db.collection(MOVIES_COLLECTION).doc(item.id.videoId).set(movieData);
                existingIds.add(item.id.videoId);
                newMovies.push({ id: item.id.videoId, ...movieData, addedAt: new Date() });
            } catch (fireErr) {
                console.warn('Firestore write skipped:', fireErr.message);
            }
        }

        console.log(`Saved ${newMovies.length} movies for "${query}" [${genre}]`);
        return { movies: newMovies, nextPageToken: data.nextPageToken || null };

    } catch (error) {
        console.error('Fetch error:', error);
        return { movies: [], nextPageToken: null };
    }
}

// ── Carga más películas (scroll infinito) ─────────────────
async function loadMoreMovies(genre) {
    if (!canMakeRequest()) {
        console.log('No quota - showing cached movies only');
        return [];
    }

    const queries = GENRE_QUERIES[genre] || GENRE_QUERIES.accion;

    // Usar token de paginación si existe para este género, sino query aleatoria
    if (!genreTokens[genre]) {
        genreTokens[genre] = {
            queryIndex: Math.floor(Math.random() * queries.length),
            token: null,
            roundsSinceNewQuery: 0
        };
    }

    const state = genreTokens[genre];
    let query = queries[state.queryIndex];

    // Si no hay token, buscar una query que no se haya usado
    if (!state.token) {
        state.queryIndex = (state.queryIndex + 1) % queries.length;
        query = queries[state.queryIndex];
        state.roundsSinceNewQuery = 0;
    }

    try {
        const result = await fetchAndSaveMovies(query, genre, state.token);
        state.token = result.nextPageToken;
        state.roundsSinceNewQuery++;

        // Si no hay más páginas, cambiar de query en la próxima
        if (!state.token && state.roundsSinceNewQuery > 2) {
            state.token = null;
        }

        if (result.movies.length > 0) {
            moviesCache = [...result.movies, ...moviesCache];
            if (onMoviesUpdateCallback) onMoviesUpdateCallback(moviesCache, []);
        }

        return result.movies;
    } catch (error) {
        console.error('Load more error:', error);
        return [];
    }
}

// ── Búsqueda en YouTube (para el buscador) ───────────────
async function searchMoviesYouTube(query) {
    if (!query || query.length < 2) return [];

    // Primero buscar en caché local
    const localResults = moviesCache.filter(m => {
        const t = (m.title || '').toLowerCase();
        const d = (m.description || '').toLowerCase();
        return t.includes(query.toLowerCase()) || d.includes(query.toLowerCase());
    });

    // Luego buscar en YouTube si tenemos cuota
    if (canMakeRequest()) {
        try {
            const searchQuery = `${query} pelicula completa español`;
            const data = await fetchFromYouTube(searchQuery);

            if (data.items) {
                const existingIds = new Set(localResults.map(m => m.youtubeId));
                const remoteResults = [];

                for (const item of data.items) {
                    if (existingIds.has(item.id.videoId)) continue;
                    if (!isRealMovie(item.snippet.title, item.snippet.description)) continue;

                    remoteResults.push({
                        id: item.id.videoId,
                        youtubeId: item.id.videoId,
                        title: cleanTitle(item.snippet.title),
                        description: (item.snippet.description || '').substring(0, 300),
                        genre: 'busqueda',
                        type: 'pelicula',
                        year: new Date(item.snippet.publishedAt).getFullYear(),
                        rating: (Math.random() * 2 + 7).toFixed(1),
                        quality: 'HD',
                        poster: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url || '',
                        source: 'youtube'
                    });
                }

                return [...localResults, ...remoteResults];
            }
        } catch (error) {
            console.error('YouTube search error:', error);
        }
    }

    return localResults;
}

// ── Carga en background ──────────────────────────────────
async function loadMoreInBackground() {
    console.log('Checking if we can load more movies...');

    const allGenres = Object.keys(GENRE_QUERIES);
    let loaded = 0;

    for (const genre of allGenres) {
        if (!canMakeRequest()) {
            console.log('No quota available, stopping background load');
            break;
        }

        try {
            const newMovies = await loadMoreMovies(genre);
            loaded += newMovies.length;
            await sleep(2000);
        } catch (error) {
            console.error(`Background load ${genre}:`, error);
            if (handleApiError(403)) break;
        }
    }

    console.log(`Background load complete: ${loaded} new movies`);
}

// ── Filtrado de películas cacheadas ───────────────────────
function getFilteredMovies(filters) {
    let filtered = Array.isArray(moviesCache) ? [...moviesCache] : [];

    filtered.sort((a, b) => (b.year || 0) - (a.year || 0));

    if (filters.category && filters.category !== 'all') {
        filtered = filtered.filter(m => m.genre === filters.category);
    }
    if (filters.year && filters.year !== 'all') {
        if (filters.year === 'old') filtered = filtered.filter(m => m.year && m.year < 2020);
        else filtered = filtered.filter(m => m.year === parseInt(filters.year));
    }
    if (filters.type && filters.type !== 'all' && filters.type !== 'serie') {
        filtered = filtered.filter(m => m.type === filters.type);
    }
    if (filters.search && filters.search.length >= 2) {
        const q = filters.search.toLowerCase();
        filtered = filtered.filter(m =>
            (m.title && m.title.toLowerCase().includes(q)) ||
            (m.description && m.description.toLowerCase().includes(q))
        );
    }

    return filtered;
}

// ── Verificación de videos eliminados ────────────────────
async function startVideoVerification() {
    if (verificationInterval) return;

    verificationInterval = setInterval(async () => {
        if (!canMakeRequest()) return;
        await verifyVideosBatch();
    }, 12 * 60 * 60 * 1000);

    setTimeout(() => verifyVideosBatch(), 120000);
}

async function verifyVideosBatch() {
    if (!canMakeRequest()) return;

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    try {
        const snapshot = await db.collection(MOVIES_COLLECTION)
            .where('lastChecked', '<', sevenDaysAgo)
            .where('isActive', '==', true)
            .limit(50)
            .get();

        if (snapshot.empty) return;

        const videoIds = [];
        const docMap = {};
        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.youtubeId) {
                videoIds.push(data.youtubeId);
                docMap[data.youtubeId] = doc.id;
            }
        });

        const url = `https://www.googleapis.com/youtube/v3/videos?part=id&id=${videoIds.join(',')}&key=${YOUTUBE_API_KEY}`;
        const response = await fetch(url);

        if (!response.ok) { handleApiError(response.status); return; }

        recordRequest();
        const data = await response.json();
        const availableIds = new Set((data.items || []).map(i => i.id));

        const batch = db.batch();
        let removed = 0;

        for (const vid of videoIds) {
            if (!availableIds.has(vid)) {
                batch.update(db.collection(MOVIES_COLLECTION).doc(docMap[vid]), {
                    isActive: false,
                    removedAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                removed++;
            } else {
                batch.update(db.collection(MOVIES_COLLECTION).doc(docMap[vid]), {
                    lastChecked: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
        }

        if (removed > 0) await batch.commit();
        console.log(`Verified: ${removed} removed`);

    } catch (error) {
        console.error('Verify error:', error);
    }
}

function cleanupFirestore() {
    if (unsubscribeListener) { unsubscribeListener(); unsubscribeListener = null; }
    if (verificationInterval) { clearInterval(verificationInterval); verificationInterval = null; }
    isInitialized = false;
}

window.CineStreamDB = {
    init: initFirestoreService,
    getAllMovies,
    loadMoreMovies,
    getFilteredMovies,
    searchMovies: searchMoviesYouTube,
    cleanup: cleanupFirestore,
    getCache: () => moviesCache,
    startVerification: startVideoVerification,
    getRateLimitStatus: () => ({
        canMakeRequest: canMakeRequest(),
        requestsThisMinute: RATE_LIMIT.requests.length,
        dailyQuotaUsed: RATE_LIMIT.dailyQuotaUsed,
        isRateLimited: RATE_LIMIT.lastQuotaError !== null
    })
};
