// =====================================================
// CINESTREAM - Firestore Movie Service v4
// Firestore FIRST - API solo para cargar más
// =====================================================

const FIRESTORE_CONFIG = {
    projectId: 'studio-4796645076-6f375',
    appId: '1:294212274372:web:57e201d54dc62a72152191',
    apiKey: 'AIzaSyB3UPA2BTY-BT6YripgFmf5VX_BT9XIwGo',
    authDomain: 'studio-4796645076-6f375.firebaseapp.com'
};

const firebaseApp = firebase.initializeApp(FIRESTORE_CONFIG);
const db = firebase.firestore();

const MOVIES_COLLECTION = 'cinestream_movies';

// Rate limiting
const RATE_LIMIT = {
    maxPerMinute: 6,
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
function purgeNonSpanishMovies() {
  // Scan Firestore collection and deactivate movies that are not Spanish.
  // This runs once on init to ensure only Spanish titles remain.
  try {
    return db.collection(MOVIES_COLLECTION).get().then(snapshot => {
      if (snapshot.empty) return;
      const batch = db.batch();
      snapshot.forEach(doc => {
        const data = doc.data();
        const title = data && data.title ? data.title : '';
        if (!isSpanish(title)) {
          // Mark as inactive instead of deleting to keep history.
          batch.update(doc.ref, { isActive: false });
        }
      });
      return batch.commit();
    }).catch(err => {
      console.error('Error purging non-Spanish movies:', err);
    });
  } catch (e) {
    console.error('purgeNonSpanishMovies exception:', e);
  }
}
function isSpanish(text) {
  // Heuristic to filter out English titles
  const englishWords = [
    'the', 'of', 'and', 'season', 'episode', 'part', 'vol', 'official',
    'trailer', 'teaser', 'full movie', 'full film', 'hd', '4k', '1080p', '720p'
  ];
  const lowered = (text || '').toLowerCase();
  return !englishWords.some(w => lowered.includes(w));
}
// TODAS las categorías con queries para cargar cuando haya cuota
const GENRE_QUERIES = {
    accion: ['full movie action', 'pelicula completa accion', 'full action movie'],
    comedia: ['full movie comedy', 'pelicula completa comedia', 'full comedy movie'],
    drama: ['full movie drama', 'pelicula completa drama', 'full drama movie'],
    terror: ['full movie horror', 'pelicula completa terror', 'full horror movie'],
    cienciaficcion: ['full movie sci-fi', 'pelicula completa ciencia ficcion', 'full science fiction'],
    anime: ['full anime movie', 'anime film completo', 'anime OVA full movie', 'anime special movie', 'pelicula anime completa'],
    romance: ['full romance movie', 'pelicula romance completa', 'full romantic movie'],
    thriller: ['full thriller movie', 'pelicula thriller completa', 'full suspense movie'],
    documental: ['full documentary', 'documental completo', 'full documentary film'],
    aventura: ['full adventure movie', 'pelicula aventura completa', 'full adventure film'],
    fantasia: ['full fantasy movie', 'pelicula fantasia completa', 'full fantasy film'],
    misterio: ['full mystery movie', 'pelicula misterio completa', 'full mystery film']
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
    if (status === 403) {
        RATE_LIMIT.lastQuotaError = Date.now();
        RATE_LIMIT.quotaErrorCount++;
        RATE_LIMIT.backoffTime = Math.min(600000, 60000 * Math.pow(2, RATE_LIMIT.quotaErrorCount - 1));
        return true;
    }
    return false;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

/**
 * INICIALIZACIÓN - Solo lee de Firestore, NO gasta cuota
 */
async function initFirestoreService(onUpdate) {
    if (isInitialized) return;
    onMoviesUpdateCallback = onUpdate;
    
    try {
        unsubscribeListener = db.collection(MOVIES_COLLECTION)
            .orderBy('addedAt', 'desc')
            .limit(1000)
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
await purgeNonSpanishMovies();
        console.log(`Firestore connected - ${moviesCache.length} movies cached`);
        
    } catch (error) {
        console.error('Init error:', error);
    }
}

/**
 * Obtiene películas de Firestore - SIN API CALLS
 */
async function getAllMovies() {
    try {
        const snapshot = await db.collection(MOVIES_COLLECTION)
            .orderBy('addedAt', 'desc')
            .limit(500)
            .get();
        
        const movies = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            if (data && data.isActive !== false) {
                movies.push({ id: doc.id, ...data });
            }
        });
        
        // Ordenar por año descendente (más recientes primero)
        movies.sort((a, b) => (b.year || 0) - (a.year || 0));
        
        moviesCache = movies;
        console.log(`Loaded ${movies.length} movies from Firestore (0 API calls)`);
        
        // Cargar más en background SOLO si hay cuota
        if (movies.length < 200) {
            loadMoreInBackground();
        }
        
        return movies;
        
    } catch (error) {
        console.error('Get movies error:', error);
        return moviesCache;
    }
}

/**
 * Carga más películas en background (solo si hay cuota)
 */
async function loadMoreInBackground() {
    console.log('Checking if we can load more movies...');
    
    // Rotar por todos los géneros
    const allGenres = Object.keys(GENRE_QUERIES);
    let loaded = 0;
    
    for (const genre of allGenres) {
        if (!canMakeRequest()) {
            console.log('No quota available, stopping background load');
            break;
        }
        
        const queries = GENRE_QUERIES[genre];
        const query = queries[Math.floor(Math.random() * queries.length)];
        
        try {
            const newMovies = await fetchAndSaveMovies(query, genre);
            loaded += newMovies.length;
            recordRequest();
            await sleep(4000);
        } catch (error) {
            console.error(`Background load ${genre}:`, error);
            if (handleApiError(403)) break;
        }
    }
    
    console.log(`Background load complete: ${loaded} new movies`);
}

/**
 * Busca y guarda películas
 */
async function fetchAndSaveMovies(query, genre) {
    if (!canMakeRequest()) return [];
    
    const YOUTUBE_API_KEY = 'AIzaSyBiEkLi9koBFz3HpBCgeIfcJvjDnA-ZXDs';
    
    try {
        const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&videoDuration=long&maxResults=15&order=relevance&relevanceLanguage=es&regionCode=ES&key=${YOUTUBE_API_KEY}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            handleApiError(response.status);
            throw new Error(`API ${response.status}`);
        }
        
        recordRequest();
        const data = await response.json();
        
        if (!data.items || data.items.length === 0) return [];
        
        const existingIds = new Set(moviesCache.map(m => m.youtubeId));
        const newMovies = [];
        
        for (const item of data.items) {
          const title = item.snippet.title;
          // Excluir episodios, capítulos, partes de series
          if (/episode|capitulo|capítulo|part \d|parte \d|ep\d|eps\d|\d+ of \d+/i.test(title)) {
            continue;
          }
          // Excluir títulos que no parecen estar en español
          if (!isSpanish(title)) {
            continue;
          }
          
          if (existingIds.has(item.id.videoId)) continue;
            
            const movieData = {
                youtubeId: item.id.videoId,
                title: cleanTitle(item.snippet.title),
                description: (item.snippet.description || '').substring(0, 300),
                genre: genre,
                type: genre === 'anime' ? 'pelicula' : (genre === 'documental' ? 'documental' : (Math.random() > 0.8 ? 'documental' : 'pelicula')),
                year: new Date(item.snippet.publishedAt).getFullYear(),
                rating: (Math.random() * 3 + 6).toFixed(1),
                quality: ['4K', '1080p', '720p'][Math.floor(Math.random() * 3)],
                poster: item.snippet.thumbnails.high?.url || item.snippet.thumbnails.medium?.url || '',
                addedAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastChecked: firebase.firestore.FieldValue.serverTimestamp(),
                isActive: true
            };
            
            await db.collection(MOVIES_COLLECTION).doc(item.id.videoId).set(movieData);
            existingIds.add(item.id.videoId);
            newMovies.push({ id: item.id.videoId, ...movieData, addedAt: new Date() });
        }
        
        console.log(`Saved ${newMovies.length} movies: ${genre}`);
        return newMovies;
        
    } catch (error) {
        console.error(`Fetch error:`, error);
        return [];
    }
}

/**
 * Carga más (scroll infinito) - SOLO si hay cuota
 */
async function loadMoreMovies(genre) {
    if (!canMakeRequest()) {
        console.log('No quota - showing cached movies only');
        return [];
    }
    
    const queries = GENRE_QUERIES[genre] || GENRE_QUERIES.accion;
    const query = queries[Math.floor(Math.random() * queries.length)] + ' ' + Math.floor(Math.random() * 10000);
    
    try {
        const newMovies = await fetchAndSaveMovies(query, genre);
        if (newMovies.length > 0) {
            moviesCache = [...newMovies, ...moviesCache];
            if (onMoviesUpdateCallback) onMoviesUpdateCallback(moviesCache, []);
        }
        return newMovies;
    } catch (error) {
        return [];
    }
}

/**
 * Verificación de videos eliminados
 */
async function startVideoVerification() {
    if (verificationInterval) return;
    
    verificationInterval = setInterval(async () => {
        if (!canMakeRequest()) return;
        await verifyVideosBatch();
    }, 12 * 60 * 60 * 1000); // Cada 12 horas
    
    setTimeout(() => verifyVideosBatch(), 120000); // Primera vez en 2 min
}

async function verifyVideosBatch() {
    if (!canMakeRequest()) return;
    
    const YOUTUBE_API_KEY = 'AIzaSyBiEkLi9koBFz3HpBCgeIfcJvjDnA-ZXDs';
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

function getFilteredMovies(filters) {
    let filtered = Array.isArray(moviesCache) ? [...moviesCache] : [];
    
    // Ordenar por año descendente por defecto (más recientes primero)
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

function cleanTitle(title) {
    if (!title) return 'Sin título';
    return title.replace(/\|.*$/g, '').replace(/FULL MOVIE|Full Movie|full movie|PELICULA COMPLETA/gi, '')
        .replace(/\[.*?\]/g, '').replace(/\(.*?\)/g, '').replace(/HD|4K|1080p|720p/gi, '')
        .replace(/\s+/g, ' ').trim() || 'Sin título';
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
