// =====================================================
// CINESTREAM APP v3
// Scroll infinito real, búsqueda YouTube, filtrado mejorado
// =====================================================

const typeLabels = {
    pelicula: "Película",
    documental: "Documental"
};

const genreLabels = {
    accion: "Acción",
    comedia: "Comedia",
    drama: "Drama",
    terror: "Terror",
    cienciaficcion: "Ciencia Ficción",
    anime: "Anime",
    romance: "Romance",
    thriller: "Thriller",
    documental: "Documental",
    aventura: "Aventura",
    fantasia: "Fantasía",
    misterio: "Misterio",
    busqueda: "Búsqueda"
};

// Estado
let allLoadedMovies = [];
let currentMovies = [];
let currentPage = 1;
const moviesPerPage = 12;
let isPlaying = false;
let currentMovieId = null;
let isLoadingMore = false;
let hasMoreMovies = true;
let lastScrollLoad = 0;
const SCROLL_COOLDOWN = 2000; // 2 segundos entre cargas

let currentFilters = {
    category: 'all',
    year: 'all',
    type: 'all',
    search: '',
    language: 'both'
};

let searchTimeout = null;
const SEARCH_DELAY = 500; // debounce 500ms

// =====================================================
// HERO EFFECTS — Particles + Parallax
// =====================================================
function initHeroParticles() {
    const container = document.getElementById('heroParticles');
    if (!container) return;

    const count = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--particle-count')) || 12;

    container.innerHTML = '';
    for (let i = 0; i < count; i++) {
        const p = document.createElement('div');
        p.className = 'hero-particle';
        p.style.left = `${Math.random() * 100}%`;
        p.style.top = `${Math.random() * 100}%`;
        p.style.setProperty('--float-delay', `${Math.random() * 6}s`);
        p.style.setProperty('--float-duration', `${4 + Math.random() * 6}s`);
        p.style.setProperty('--float-x', `${-30 + Math.random() * 60}px`);
        p.style.setProperty('--float-y', `${-40 + Math.random() * 80}px`);
        container.appendChild(p);
    }
}

let _heroParallaxHandler = null;

function initHeroParallax() {
    const hero = document.getElementById('heroSection');
    if (!hero) return;

    if (_heroParallaxHandler) {
        window.removeEventListener('scroll', _heroParallaxHandler);
    }

    _heroParallaxHandler = () => {
        const scrollY = window.scrollY;
        const heroHeight = hero.offsetHeight || 500;
        if (scrollY < heroHeight) {
            hero.style.setProperty('--parallax-y', `${scrollY * 0.3}px`);
        }
    };

    window.addEventListener('scroll', _heroParallaxHandler, { passive: true });
}

function setupHeaderScroll() {
    const header = document.querySelector('.site-header');
    if (!header) return;
    let lastScroll = 0;

    window.addEventListener('scroll', () => {
        const currentScroll = window.scrollY;
        if (currentScroll > 80) {
            header.classList.add('header-hidden');
            header.classList.remove('header-visible');
        } else {
            header.classList.remove('header-hidden');
            header.classList.add('header-visible');
        }
        lastScroll = currentScroll;
    }, { passive: true });
}

function initGenreChips() {
    const nav = document.querySelector('.nav-links');
    if (!nav) return;

    nav.querySelectorAll('.nav-btn').forEach(btn => {
        const genre = btn.dataset.filter;
        if (genre && genre !== 'all' && genreLabels[genre]) {
            btn.setAttribute('data-genre', genre);
        }
    });
}

/**
 * Inicialización
 */
async function init() {
    console.log('CineStream v3: Initializing...');

    try {
        if (!window.CineStreamDB) {
            await waitForFirestoreService();
        }

        // Listener en tiempo real
        window.CineStreamDB.init((movies) => {
            if (movies && movies.length > allLoadedMovies.length) {
                allLoadedMovies = movies;
                applyFiltersSilent();
                renderHeroSection();
                renderGenreRows();
            }
        });

        // Iniciar verificación de videos eliminados
        window.CineStreamDB.startVerification();

        // Carga inicial
        const movies = await window.CineStreamDB.getAllMovies();
        allLoadedMovies = Array.isArray(movies) ? movies : [];

        allLoadedMovies.sort((a, b) => (b.year || 0) - (a.year || 0));
        currentMovies = [...allLoadedMovies];

        console.log(`Loaded ${allLoadedMovies.length} movies`);

        setupEventListeners();
        setupInfiniteScroll();
        setupHeaderScroll();
        renderHeroSection();
        renderGenreRows();
        renderMovies();
        initGenreChips();

    } catch (error) {
        console.error('Init error:', error);
        showError('Error al cargar. Verifica tu conexión.');
    }
}

function waitForFirestoreService() {
    return new Promise((resolve) => {
        const check = () => {
            if (window.CineStreamDB) resolve();
            else setTimeout(check, 100);
        };
        check();
    });
}

/**
 * Scroll infinito mejorado
 */
function setupInfiniteScroll() {
    let ticking = false;

    if (window._cinestreamScrollHandler) {
        window.removeEventListener('scroll', window._cinestreamScrollHandler);
    }

    window._cinestreamScrollHandler = () => {
        if (ticking) return;

        ticking = true;
        requestAnimationFrame(() => {
            const now = Date.now();

            if (now - lastScrollLoad < SCROLL_COOLDOWN) {
                ticking = false;
                return;
            }

            if (isLoadingMore || !hasMoreMovies) {
                ticking = false;
                return;
            }

            // No hacer scroll load si hay búsqueda activa
            if (currentFilters.search && currentFilters.search.length >= 2) {
                ticking = false;
                return;
            }

            const scrollPosition = window.innerHeight + window.scrollY;
            const threshold = document.body.offsetHeight - 400;

            if (scrollPosition >= threshold) {
                lastScrollLoad = now;
                loadMoreMovies();
            }

            ticking = false;
        });
    };

    window.addEventListener('scroll', window._cinestreamScrollHandler);
}

/**
 * Carga películas para la categoría actual (botón manual)
 */
async function loadCategoryMovies() {
    const genre = currentFilters.category;
    const language = currentFilters.language || 'both';
    if (!genre || genre === 'all') return;

    const grid = document.getElementById('moviesGrid');
    grid.innerHTML = buildSkeletonCards(6);

    try {
        if (!window.CineStreamDB) {
            await waitForFirestoreService();
        }

        for (let i = 0; i < 3; i++) {
            const newMovies = await window.CineStreamDB.loadMoreMovies(genre, language);
            if (!newMovies || newMovies.length === 0) break;
            allLoadedMovies = [...allLoadedMovies, ...newMovies];
            await new Promise(r => setTimeout(r, 3000));
        }

        currentMovies = allLoadedMovies.filter(m => m.genre === genre);
        currentPage = 1;
        renderMovies();

    } catch (error) {
        console.error('Load category error:', error);
        grid.innerHTML = `
            <div class="empty-state" style="grid-column: 1/-1; text-align: center; padding: 3rem;">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #e50914; margin-bottom: 1rem;"></i>
                <h3>Error al cargar</h3>
                <p>${error.message || 'Verifica tu conexión o intenta más tarde'}</p>
                <button onclick="location.reload()" style="margin-top: 1rem; background: var(--primary-color); color: white; border: none; padding: 0.8rem 2rem; border-radius: 8px; cursor: pointer;">
                    Reintentar
                </button>
            </div>
        `;
    }
}

/**
 * Carga más películas (scroll infinito)
 */
async function loadMoreMovies() {
    if (isLoadingMore || !hasMoreMovies) return;

    isLoadingMore = true;
    const grid = document.getElementById('moviesGrid');

    let loaderEl = document.getElementById('scroll-loader');
    if (!loaderEl) {
        loaderEl = document.createElement('div');
        loaderEl.id = 'scroll-loader';
        loaderEl.className = 'loading';
        loaderEl.innerHTML = '<div class="loading-spinner"></div>';
        loaderEl.style.gridColumn = '1/-1';
        grid.appendChild(loaderEl);
    }
    loaderEl.style.display = 'flex';

    try {
        const genre = currentFilters.category === 'all' ? 'accion' : currentFilters.category;
        const language = currentFilters.language || 'both';
        const newMovies = await window.CineStreamDB.loadMoreMovies(genre, language);

        if (!newMovies || newMovies.length === 0) {
            // Intentar otro género si el actual no da resultados
            if (currentFilters.category === 'all') {
                const genres = ['comedia', 'drama', 'terror', 'anime', 'thriller'];
                for (const altGenre of genres) {
                    if (!hasMoreMovies) break;
                    const altMovies = await window.CineStreamDB.loadMoreMovies(altGenre, language);
                    if (altMovies && altMovies.length > 0) {
                        allLoadedMovies = [...allLoadedMovies, ...altMovies];
                        allLoadedMovies.sort((a, b) => (b.year || 0) - (a.year || 0));
                        applyFiltersSilent();
                        break;
                    }
                }
            } else {
                hasMoreMovies = false;
            }
            loaderEl.style.display = 'none';
        } else {
            allLoadedMovies = [...allLoadedMovies, ...newMovies];
            allLoadedMovies.sort((a, b) => (b.year || 0) - (a.year || 0));
            applyFiltersSilent();
        }

    } catch (error) {
        console.error('Load more error:', error);
        hasMoreMovies = false;
    } finally {
        isLoadingMore = false;
        if (loaderEl) loaderEl.style.display = 'none';
    }
}

/**
 * Aplica filtros sin parpadeo
 */
function applyFiltersSilent() {
    if (!window.CineStreamDB) return;

    const filtered = window.CineStreamDB.getFilteredMovies(currentFilters);
    currentMovies = Array.isArray(filtered) ? filtered : [];

    const start = (currentPage - 1) * moviesPerPage;
    const end = start + moviesPerPage;
    const currentVisible = currentMovies.slice(start, end);

    if (currentVisible.length > 0) {
        renderMovies();
    }
}

function applyFilters() {
    if (!window.CineStreamDB) {
        console.error('CineStreamDB not available');
        return;
    }

    currentMovies = window.CineStreamDB.getFilteredMovies(currentFilters);
    if (!Array.isArray(currentMovies)) {
        currentMovies = [];
    }

    currentMovies.sort((a, b) => (b.year || 0) - (a.year || 0));
    currentPage = 1;
    renderMovies();
}

function sortMovies(criteria) {
    if (!currentMovies.length) return;

    currentMovies.sort((a, b) => {
        if (criteria === 'title') return (a.title || '').localeCompare(b.title || '');
        if (criteria === 'year') return (b.year || 0) - (a.year || 0);
        if (criteria === 'rating') return parseFloat(b.rating || 0) - parseFloat(a.rating || 0);
        return 0;
    });
    renderMovies();
}

/**
 * Renderiza peláculas
 */
function renderMovies() {
    const grid = document.getElementById('moviesGrid');
    if (!grid) return;

    const start = (currentPage - 1) * moviesPerPage;
    const end = start + moviesPerPage;
    const moviesToShow = currentMovies.slice(start, end);

    if (moviesToShow.length === 0) {
        if (allLoadedMovies.length === 0) {
            grid.innerHTML = buildSkeletonCards(12);
        } else if (currentFilters.category !== 'all') {
            grid.innerHTML = `
                <div class="empty-state" style="grid-column: 1/-1; text-align: center; padding: 3rem;">
                    <i class="fas fa-film" style="font-size: 3rem; color: var(--text-secondary); margin-bottom: 1rem;"></i>
                    <h3>No hay peláculas en "${genreLabels[currentFilters.category] || currentFilters.category}"</h3>
                    <p style="margin-bottom: 1.5rem;">Esta categoráa aún no tiene peláculas guardadas</p>
                    <button onclick="loadCategoryMovies()" style="background: var(--primary-color); color: white; border: none; padding: 0.8rem 2rem; border-radius: 8px; font-size: 1rem; cursor: pointer; font-weight: 600;">
                        <i class="fas fa-download"></i> Cargar peláculas de ${genreLabels[currentFilters.category] || currentFilters.category}
                    </button>
                </div>
            `;
        } else {
            grid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-film"></i>
                    <h3>No se encontraron peláculas</h3>
                    <p>Intenta con otros filtros</p>
                </div>
            `;
        }
        return;
    }

    grid.innerHTML = moviesToShow.map((movie, index) => {
        const genre = movie.genre || 'accion';
        const ratingNum = parseFloat(movie.rating) || 0;
        const ratingPercent = Math.round((ratingNum / 10) * 100);
        return `
        <div class="movie-card" data-genre="${genre}" style="--card-index: ${index}" onclick="openPlayer('${movie.id || movie.youtubeId}')">
            <div class="card-genre-accent"></div>
            <div class="movie-poster-container">
                <img src="${movie.poster || ''}" alt="${movie.title || ''}" class="movie-poster" loading="lazy" onerror="this.src='https://picsum.photos/400/600?random=${movie.youtubeId}'">
                <span class="movie-quality">${movie.quality || 'HD'}</span>
                <span class="movie-type">${typeLabels[movie.type] || 'Pelácula'}</span>
            </div>
            <div class="movie-info">
                <div class="movie-info-top">
                    <h3 class="movie-title">${movie.title || 'Sin tátulo'}</h3>
                    <div class="rating-gauge" style="--rating-percent: ${ratingPercent}" title="${movie.rating || 'N/A'}">${ratingNum > 0 ? ratingNum.toFixed(1) : 'N/A'}</div>
                </div>
                <div class="movie-meta">
                    <span>${movie.year || 'N/A'}</span>
                </div>
                <p class="movie-genre">${genreLabels[movie.genre] || ''}</p>
            </div>
        </div>
    `}).join('');

    renderPagination();
}

function buildSkeletonCards(count) {
    let html = '';
    for (let i = 0; i < count; i++) {
        html += `
            <div class="movie-card-skeleton" style="--card-index: ${i}">
                <div class="skel-poster"></div>
                <div class="skel-info">
                    <div class="skel-line title"></div>
                    <div class="skel-line meta"></div>
                    <div class="skel-line genre"></div>
                </div>
            </div>
        `;
    }
    return html;
}

function renderPagination() {
    const totalPages = Math.ceil(currentMovies.length / moviesPerPage);
    const pagination = document.getElementById('pagination');
    if (!pagination) return;

    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }

    let html = `<button class="pagination-btn" onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}><i class="fas fa-chevron-left"></i></button>`;

    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
            html += `<button class="pagination-btn ${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">${i}</button>`;
        } else if (i === currentPage - 2 || i === currentPage + 2) {
            html += '<span class="pagination-btn">...</span>';
        }
    }

    html += `<button class="pagination-btn" onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}><i class="fas fa-chevron-right"></i></button>`;
    pagination.innerHTML = html;
}

function changePage(page) {
    const totalPages = Math.ceil(currentMovies.length / moviesPerPage);
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    renderMovies();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Búsqueda con debounce que consulta YouTube
 */
async function performSearch(query) {
    const grid = document.getElementById('moviesGrid');
    if (!grid) return;

    if (!query || query.length < 2) {
        currentFilters.search = '';
        applyFilters();
        return;
    }

    // Mostrar estado de carga
    grid.innerHTML = buildSkeletonCards(6);

    try {
        const language = currentFilters.language || 'both';
        const results = await window.CineStreamDB.searchMovies(query, language);
        currentMovies = results;
        currentPage = 1;

        // Auto-categorizar y persistir resultados nuevos en Firestore
        if (results.length > 0) {
            const detectedGenre = detectGenre(query);
            const existingIds = new Set(allLoadedMovies.map(m => m.id || m.youtubeId));

            results.forEach(m => {
                if (!existingIds.has(m.id || m.youtubeId)) {
                    // Asignar género detectado por keywords
                    m.genre = detectedGenre;
                    allLoadedMovies.push(m);

                    // Persistir en Firestore si tiene youtubeId y no viene de allLoadedMovies
                    if (m.youtubeId && m.source === 'youtube' && window.CineStreamDB) {
                        try {
                            const movieData = {
                                youtubeId: m.youtubeId,
                                title: m.title,
                                description: (m.description || '').substring(0, 300),
                                genre: detectedGenre,
                                type: m.type || 'pelicula',
                                year: m.year || new Date().getFullYear(),
                                rating: m.rating || (Math.random() * 2 + 7).toFixed(1),
                                quality: m.quality || 'HD',
                                poster: m.poster || '',
                                addedAt: firebase.firestore.FieldValue.serverTimestamp(),
                                lastChecked: firebase.firestore.FieldValue.serverTimestamp(),
                                isActive: true,
                                language: m.language || language
                            };
                            firebase.firestore().collection('cinestream_movies').doc(m.youtubeId).set(movieData);
                        } catch (e) { /* silenciar errores de escritura */ }
                    }
                }
            });

            // Actualizar hero y filas con las nuevas películas
            renderHeroSection();
            renderGenreRows();
        }

        if (results.length === 0) {
            grid.innerHTML = `
                <div class="empty-state" style="grid-column: 1/-1; text-align: center; padding: 3rem;">
                    <i class="fas fa-search" style="font-size: 3rem; color: var(--text-secondary); margin-bottom: 1rem;"></i>
                    <h3>No se encontraron resultados para "${query}"</h3>
                    <p>Intenta con otros términos</p>
                </div>
            `;
        } else {
            renderMovies();
        }
    } catch (error) {
        console.error('Search error:', error);
        // Fallback: buscar solo en caché
        currentFilters.search = query;
        applyFilters();
    }
}

// =====================================================
// HERO SECTION — Pelácula destacada del dáa
// =====================================================
function renderHeroSection() {
    const container = document.getElementById('heroSection');
    if (!container || allLoadedMovies.length === 0) return;

    // Tomar la pelácula ms reciente como destacada
    const featured = allLoadedMovies[0];
    if (!featured) return;

    container.className = 'hero-section';
    container.setAttribute('data-genre', featured.genre || 'accion');
    container.innerHTML = `
        <div class="hero-backdrop" style="background-image: url('${featured.poster || ''}')"></div>
        <div class="hero-particles" id="heroParticles"></div>
        <div class="hero-content">
            <div class="hero-badge">
                <i class="fas fa-fire"></i> Destacada
            </div>
            <h1 class="hero-title">${featured.title || 'Sin título'}</h1>
            <div class="hero-meta">
                <span class="hero-rating"><i class="fas fa-star"></i> ${featured.rating || 'N/A'}</span>
                <span class="hero-dot"></span>
                <span>${featured.year || 'N/A'}</span>
                <span class="hero-dot"></span>
                <span>${genreLabels[featured.genre] || ''}</span>
                <span class="hero-dot"></span>
                <span>${featured.quality || 'HD'}</span>
            </div>
            <p class="hero-description">${featured.description || ''}</p>
            <div class="hero-actions">
                <button class="hero-btn hero-btn-play" onclick="openPlayer('${featured.id || featured.youtubeId}')">
                    <i class="fas fa-play"></i> Ver ahora
                </button>
                <button class="hero-btn hero-btn-info" onclick="openPlayer('${featured.id || featured.youtubeId}')">
                    <i class="fas fa-info-circle"></i> Más info
                </button>
            </div>
        </div>
    `;

    initHeroParticles();
    initHeroParallax();
}

// =====================================================
// GENRE ROWS — Filas horizontales tipo Netflix
// =====================================================
const GENRE_ICONS = {
    accion: 'fa-burst',
    comedia: 'fa-face-laugh-beam',
    drama: 'fa-masks-theater',
    terror: 'fa-ghost',
    cienciaficcion: 'fa-rocket',
    anime: 'fa-dragon',
    romance: 'fa-heart',
    thriller: 'fa-mask',
    documental: 'fa-book-open',
    aventura: 'fa-compass',
    fantasia: 'fa-wand-magic-sparkles',
    misterio: 'fa-magnifying-glass',
    busqueda: 'fa-search'
};

function renderGenreRows() {
    const container = document.getElementById('movieRows');
    if (!container) return;

    if (allLoadedMovies.length === 0) {
        container.innerHTML = '';
        return;
    }

    // Agrupar peláculas por gnero
    const genreGroups = {};
    allLoadedMovies.forEach(movie => {
        const genre = movie.genre || 'accion';
        if (!genreGroups[genre]) genreGroups[genre] = [];
        genreGroups[genre].push(movie);
    });

    // Orden: primero los que ms tienen, mostrar solo los que tienen >= 2
    const sortedGenres = Object.entries(genreGroups)
        .filter(([_, movies]) => movies.length >= 2)
        .sort((a, b) => b[1].length - a[1].length);

    if (sortedGenres.length === 0) {
        container.innerHTML = '';
        return;
    }

    let html = '';
    sortedGenres.forEach(([genre, movies]) => {
        const icon = GENRE_ICONS[genre] || 'fa-film';
        html += `
            <div class="movie-row" data-genre="${genre}">
                <div class="movie-row-header">
                    <h2 class="movie-row-title">
                        <i class="fas ${icon}"></i>
                        ${genreLabels[genre] || genre}
                        <span class="row-count">${movies.length}</span>
                    </h2>
                </div>
                <div class="movie-row-scroll" id="row-scroll-${genre}">
                    <button class="row-arrow row-arrow-left hidden" onclick="scrollRow('${genre}', -1)">
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    ${movies.map(movie => `
                        <div class="movie-row-card" onclick="openPlayer('${movie.id || movie.youtubeId}')">
                            <img class="row-card-poster" src="${movie.poster || ''}" alt="${movie.title || ''}" loading="lazy" onerror="this.src='https://picsum.photos/300/450?random=${movie.youtubeId}'">
                            <span class="row-card-quality">${movie.quality || 'HD'}</span>
                            <div class="row-card-overlay">
                                <div class="row-card-title">${movie.title || ''}</div>
                                <div class="row-card-year">${movie.year || ''} ┬À ${genreLabels[movie.genre] || ''}</div>
                            </div>
                            <div class="row-card-play"><i class="fas fa-play"></i></div>
                        </div>
                    `).join('')}
                    <button class="row-arrow row-arrow-right" onclick="scrollRow('${genre}', 1)">
                        <i class="fas fa-chevron-right"></i>
                    </button>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;

    // Inicializar estado de flechas para cada fila
    sortedGenres.forEach(([genre]) => {
        setTimeout(() => updateArrows(genre), 100);
    });
}

function scrollRow(genre, direction) {
    const scroll = document.getElementById(`row-scroll-${genre}`);
    if (!scroll) return;
    const scrollAmount = 400;
    scroll.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
    setTimeout(() => updateArrows(genre), 400);
}

function updateArrows(genre) {
    const scroll = document.getElementById(`row-scroll-${genre}`);
    if (!scroll) return;
    const left = scroll.querySelector('.row-arrow-left');
    const right = scroll.querySelector('.row-arrow-right');
    if (left) left.classList.toggle('hidden', scroll.scrollLeft <= 10);
    if (right) right.classList.toggle('hidden', scroll.scrollLeft + scroll.clientWidth >= scroll.scrollWidth - 10);
}

// Listener de scroll en cada fila para actualizar flechas
document.addEventListener('scroll', (e) => {
    if (e.target.classList && e.target.classList.contains('movie-row-scroll')) {
        const genre = e.target.closest('.movie-row')?.dataset.genre;
        if (genre) updateArrows(genre);
    }
}, true);

// =====================================================
// AUTO-CATEGORIZACIN de búsquedas
// =====================================================
const GENRE_KEYWORDS = {
    anime: ['anime', 'dragon ball', 'naruto', 'one piece', 'attack on titan', 'death note', 'demon slayer', 'jujutsu kaisen', 'fullmetal', 'evangelion', 'spirited away', 'your name', 'akira', 'bleach', 'hunter', 'sailor moon', 'pokemon', 'digimon', 'doraemon', 'inuyasha', 'fairy tail', 'one punch', 'tokyo ghoul', 'berserk', 'overlord', 'chainsaw man', 'vinland', 'code geass', 'steins', 're:zero', 'mob psycho', 'haikyuu', 'slam dunk', 'blue lock', 'gurren', 'toradora', 'sword art'],
    accion: ['accion', 'action', 'lucha', 'pelea', 'guerra', 'explosion', 'martial arts', 'superhero', 'avengers', 'batman', 'spider'],
    comedia: ['comedia', 'comedy', 'funny', 'risas', 'humor', 'parodia', 'romp com'],
    drama: ['drama', 'dramatic', 'emocional', 'tears', 'vida real', 'biopic'],
    terror: ['terror', 'horror', 'scary', 'miedo', 'slasher', 'demonio', 'fantasma', 'zombie', 'saw', 'conjuring'],
    cienciaficcion: ['sci-fi', 'science fiction', 'futurista', 'space', 'alien', 'robot', 'cyberpunk', 'dystopia', 'matrix', 'star wars'],
    romance: ['romance', 'love', 'amor', 'romantico', 'romantic', 'novela'],
    thriller: ['thriller', 'suspense', 'policial', 'detective', 'crimen', 'serial killer', 'mystery'],
    documental: ['documental', 'documentary', 'real', 'historia real', 'naturaleza', 'planet', 'earth'],
    aventura: ['aventura', 'adventure', 'treasure', 'quest', 'expedition', 'island'],
    fantasia: ['fantasia', 'fantasy', 'magic', 'magia', 'dragon', 'sword', 'medieval', 'wizard'],
    misterio: ['mystery', 'misterio', 'enigma', 'detective', 'investigation']
};

function detectGenre(query) {
    const q = (query || '').toLowerCase();
    for (const [genre, keywords] of Object.entries(GENRE_KEYWORDS)) {
        if (keywords.some(k => q.includes(k))) return genre;
    }
    return 'accion'; // default
}

// =====================================================
// Toggle entre vista hero+filas y vista grilla
// =====================================================
function showHeroView() {
    const hero = document.getElementById('heroSection');
    const rows = document.getElementById('movieRows');
    const grid = document.getElementById('moviesGrid');
    const filters = document.querySelector('.filters');
    const pagination = document.getElementById('pagination');

    if (hero) { hero.classList.remove('view-exit'); hero.classList.add('view-enter'); hero.style.display = ''; }
    if (rows) { rows.classList.remove('view-exit'); rows.classList.add('view-enter'); rows.style.display = ''; }
    if (grid) grid.style.display = 'none';
    if (filters) filters.style.display = 'none';
    if (pagination) pagination.style.display = 'none';
}

function showGridView() {
    const hero = document.getElementById('heroSection');
    const rows = document.getElementById('movieRows');
    const grid = document.getElementById('moviesGrid');
    const filters = document.querySelector('.filters');
    const pagination = document.getElementById('pagination');

    if (hero) { hero.classList.remove('view-enter'); hero.classList.add('view-exit'); setTimeout(() => { hero.style.display = 'none'; }, 300); }
    if (rows) { rows.classList.remove('view-enter'); rows.classList.add('view-exit'); setTimeout(() => { rows.style.display = 'none'; }, 300); }
    if (grid) { grid.style.display = ''; grid.classList.add('view-enter'); }
    if (filters) filters.style.display = '';
    if (pagination) pagination.style.display = '';
}

function setupEventListeners() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.dataset.filter;
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            if (filter === 'anime') {
                showAnimeHub();
                return;
            }

            if (window._animeHubActive) {
                hideAnimeHub();
            }

            currentFilters.category = filter;
            hasMoreMovies = true;

            // "Todo" muestra hero+filas, gneros especáficos muestran grilla
            if (filter === 'all') {
                showHeroView();
            } else {
                showGridView();
                applyFilters();
            }
        });
    });

    // Búsqueda con debounce - consulta YouTube
    document.getElementById('searchInput')?.addEventListener('input', (e) => {
        const query = e.target.value.trim();

        if (window._animeHubActive) {
            handleAnimeSearch(query);
            return;
        }

        clearTimeout(searchTimeout);

        if (!query || query.length < 2) {
            currentFilters.search = '';
            hasMoreMovies = true;
            applyFilters();
            return;
        }

        searchTimeout = setTimeout(() => {
            performSearch(query);
        }, SEARCH_DELAY);
    });

    document.getElementById('sortSelect')?.addEventListener('change', (e) => {
        if (!window._animeHubActive) sortMovies(e.target.value);
    });

    document.getElementById('yearFilter')?.addEventListener('change', (e) => {
        currentFilters.year = e.target.value;
        if (!window._animeHubActive) applyFilters();
    });

    document.getElementById('typeFilter')?.addEventListener('change', (e) => {
        currentFilters.type = e.target.value;
        if (!window._animeHubActive) applyFilters();
    });

    document.getElementById('languageFilter')?.addEventListener('change', (e) => {
        currentFilters.language = e.target.value;
        if (window.CineStreamDB) window.CineStreamDB.setLanguageFilter(e.target.value);
        if (!window._animeHubActive) applyFilters();
    });

    document.getElementById('closePlayer')?.addEventListener('click', closePlayer);
    document.getElementById('playerModal')?.addEventListener('click', (e) => {
        if (e.target === document.getElementById('playerModal')) closePlayer();
    });

    setupPlayerControls();
}


function openPlayer(movieId) {
    const movie = allLoadedMovies.find(m => (m.id || m.youtubeId) === movieId);
    if (!movie) return;

    currentMovieId = movieId;
    const modal = document.getElementById('playerModal');
    const embed = document.getElementById('youtubeEmbed');
    const placeholder = document.getElementById('videoPlaceholder');

    const existingBackdrop = modal.querySelector('.player-modal-backdrop');
    if (existingBackdrop) existingBackdrop.remove();
    if (movie.poster) {
        const backdrop = document.createElement('div');
        backdrop.className = 'player-modal-backdrop';
        backdrop.style.backgroundImage = `url('${movie.poster}')`;
        modal.insertBefore(backdrop, modal.firstChild);
    }

    document.getElementById('playerTitle').textContent = movie.title || '';
    document.getElementById('playerYear').textContent = movie.year || '';
    document.getElementById('playerGenre').textContent = genreLabels[movie.genre] || '';
    const ratingNum = parseFloat(movie.rating) || 0;
    const ratingPercent = Math.round((ratingNum / 10) * 100);
    document.getElementById('playerRating').innerHTML = `<i class="fas fa-star"></i> ${movie.rating || ''}`;
    document.getElementById('playerDescription').textContent = movie.description || '';

    placeholder.style.display = 'flex';
    embed.innerHTML = '';

    const params = new URLSearchParams({
        autoplay: 1, controls: 1, rel: 0, modestbranding: 1, iv_load_policy: 3, fs: 1
    });

    embed.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${movie.youtubeId}?${params}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="width:100%;height:100%"></iframe>`;

    embed.style.display = 'block';
    placeholder.style.display = 'none';
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    isPlaying = true;
    updatePlayPauseButton();
}

function closePlayer() {
    const embed = document.getElementById('youtubeEmbed');
    embed.innerHTML = '';
    embed.style.display = 'none';
    const modal = document.getElementById('playerModal');
    modal.classList.remove('active');
    const backdrop = modal.querySelector('.player-modal-backdrop');
    if (backdrop) backdrop.remove();
    document.body.style.overflow = '';
    isPlaying = false;
    currentMovieId = null;
    updatePlayPauseButton();
}

function setupPlayerControls() {
    document.getElementById('playPauseBtn')?.addEventListener('click', togglePlayPause);
    document.getElementById('rewindBtn')?.addEventListener('click', () => seekVideo(-10));
    document.getElementById('forwardBtn')?.addEventListener('click', () => seekVideo(10));
    document.getElementById('volumeBtn')?.addEventListener('click', toggleMute);
    document.getElementById('volumeSlider')?.addEventListener('input', setVolume);
    document.getElementById('fullscreenBtn')?.addEventListener('click', toggleFullscreen);

    document.getElementById('progressContainer')?.addEventListener('click', (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        seekToPercent((e.clientX - rect.left) / rect.width);
    });
}

function togglePlayPause() {
    isPlaying = !isPlaying;
    updatePlayPauseButton();
    controlYouTubePlayer(isPlaying ? 'playVideo' : 'pauseVideo');
}

function updatePlayPauseButton() {
    const btn = document.getElementById('playPauseBtn');
    if (btn) btn.innerHTML = isPlaying ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play"></i>';
}

function seekVideo(s) { controlYouTubePlayer('seekTo', s); }
function seekToPercent(p) { controlYouTubePlayer('seekTo', p * 100); }

function toggleMute() {
    const slider = document.getElementById('volumeSlider');
    const btn = document.getElementById('volumeBtn');
    if (slider.value > 0) {
        slider.dataset.prevVolume = slider.value;
        slider.value = 0;
        btn.innerHTML = '<i class="fas fa-volume-mute"></i>';
        controlYouTubePlayer('mute');
    } else {
        slider.value = slider.dataset.prevVolume || 100;
        btn.innerHTML = '<i class="fas fa-volume-up"></i>';
        controlYouTubePlayer('unMute');
    }
}

function setVolume(e) {
    const v = e.target.value;
    document.getElementById('volumeBtn').innerHTML = v == 0 ? '<i class="fas fa-volume-mute"></i>' : '<i class="fas fa-volume-up"></i>';
    controlYouTubePlayer('setVolume', v);
}

function toggleFullscreen() {
    const container = document.querySelector('.video-wrapper');
    if (!document.fullscreenElement) {
        container?.requestFullscreen().catch(() => {});
    } else {
        document.exitFullscreen();
    }
}

function controlYouTubePlayer(action, value) {
    const iframe = document.querySelector('#youtubeEmbed iframe');
    if (!iframe?.contentWindow) return;
    try {
        iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: action, args: value !== undefined ? [value] : [] }), 'https://www.youtube.com');
    } catch (e) {}
}

function formatTime(s) {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
}

if (window._cinestreamKeydownHandler) {
    window.removeEventListener('keydown', window._cinestreamKeydownHandler);
}

window._cinestreamKeydownHandler = (e) => {
    if (!document.getElementById('playerModal')?.classList.contains('active')) return;
    switch(e.key) {
        case 'Escape': closePlayer(); break;
        case ' ': e.preventDefault(); togglePlayPause(); break;
        case 'ArrowLeft': seekVideo(-10); break;
        case 'ArrowRight': seekVideo(10); break;
        case 'f': toggleFullscreen(); break;
    }
};

window.addEventListener('keydown', window._cinestreamKeydownHandler);

function showError(msg) {
    const grid = document.getElementById('moviesGrid');
    if (grid) {
        grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;text-align:center;padding:3rem;"><i class="fas fa-exclamation-triangle" style="font-size:3rem;color:var(--primary-color);margin-bottom:1rem;"></i><h3>Error</h3><p>${msg}</p></div>`;
    }
}

// =====================================================
// ANIME HUB — Top 50 Franquicias de Toda la Historia
// =====================================================

const TOP_50_ANIMES = [
    { rank: 1,  name: 'Dragon Ball',            query: 'Dragon Ball Z pelicula completa español',              img: 'https://upload.wikimedia.org/wikipedia/en/a/a7/Dragon_ball_series_logo.png', color: '#f97316', pop: '9.8' },
    { rank: 2,  name: 'Naruto',                 query: 'Naruto pelicula completa español subtitulado',         img: 'https://upload.wikimedia.org/wikipedia/en/9/94/NarutoCoverTankobon1.jpg',   color: '#f59e0b', pop: '9.7' },
    { rank: 3,  name: 'One Piece',              query: 'One Piece pelicula completa español',                  img: 'https://upload.wikimedia.org/wikipedia/en/9/90/One_Piece%2C_Volume_61_Cover_%28Japanese%29.jpg', color: '#3b82f6', pop: '9.6' },
    { rank: 4,  name: 'Attack on Titan',        query: 'Shingeki no Kyojin pelicula español subtitulado',      img: 'https://upload.wikimedia.org/wikipedia/en/d/d6/Shingeki_no_Kyojin_manga_vol_1.jpg', color: '#6b7280', pop: '9.5' },
    { rank: 5,  name: 'Death Note',             query: 'Death Note pelicula completa español',                 img: 'https://upload.wikimedia.org/wikipedia/en/6/6b/Death_Note%2C_volume_1.jpg',  color: '#1e1b4b', pop: '9.5' },
    { rank: 6,  name: 'Fullmetal Alchemist',    query: 'Fullmetal Alchemist pelicula completa español',        img: 'https://upload.wikimedia.org/wikipedia/en/b/b9/Fullmetal_Alchemist_manga_volume_1_cover.jpg', color: '#d97706', pop: '9.4' },
    { rank: 7,  name: 'Demon Slayer',           query: 'Kimetsu no Yaiba pelicula completa español subtitulado', img: 'https://upload.wikimedia.org/wikipedia/en/8/8c/Kimetsu_no_Yaiba_Volume_1.jpg', color: '#dc2626', pop: '9.4' },
    { rank: 8,  name: 'Hunter x Hunter',        query: 'Hunter x Hunter pelicula completa español',            img: 'https://upload.wikimedia.org/wikipedia/en/2/2b/HunterXHunter_manga_volume_1.jpg', color: '#7c3aed', pop: '9.3' },
    { rank: 9,  name: 'Bleach',                 query: 'Bleach pelicula completa español',                     img: 'https://upload.wikimedia.org/wikipedia/en/1/12/Bleach_volume_1_cover.jpg',   color: '#0ea5e9', pop: '9.2' },
    { rank: 10, name: 'My Hero Academia',        query: 'Boku no Hero Academia pelicula completa español',      img: 'https://upload.wikimedia.org/wikipedia/en/8/84/Boku_no_Hero_Academia_Volume_1.jpg', color: '#2563eb', pop: '9.1' },
    { rank: 11, name: 'Jujutsu Kaisen',         query: 'Jujutsu Kaisen pelicula completa español subtitulado', img: 'https://upload.wikimedia.org/wikipedia/en/2/2f/Jujutsu_Kaisen_Volume_1.jpg',  color: '#1d4ed8', pop: '9.1' },
    { rank: 12, name: 'Sword Art Online',       query: 'Sword Art Online pelicula completa español',           img: 'https://upload.wikimedia.org/wikipedia/en/0/05/Sword_Art_Online_light_novel_volume_1_cover.jpg', color: '#16a34a', pop: '9.0' },
    { rank: 13, name: 'Evangelion',             query: 'Evangelion pelicula completa español rebuild',         img: 'https://upload.wikimedia.org/wikipedia/en/9/98/Neon_Genesis_Evangelion_Volume_1.jpg', color: '#7c3aed', pop: '9.0' },
    { rank: 14, name: 'Spirited Away',          query: 'El viaje de Chihiro pelicula completa español',        img: 'https://upload.wikimedia.org/wikipedia/en/d/db/Spirited_Away_Japanese_poster.png', color: '#0891b2', pop: '9.0' },
    { rank: 15, name: 'Your Name',              query: 'Kimi no Na wa pelicula completa español',              img: 'https://upload.wikimedia.org/wikipedia/en/0/0b/Your_Name_poster.png',        color: '#ec4899', pop: '8.9' },
    { rank: 16, name: 'Cowboy Bebop',           query: 'Cowboy Bebop pelicula completa español',               img: 'https://upload.wikimedia.org/wikipedia/en/c/c0/Cowboy_Bebop_volume_1.jpg',  color: '#b45309', pop: '8.9' },
    { rank: 17, name: 'Ghost in the Shell',     query: 'Ghost in the Shell pelicula completa español',         img: 'https://upload.wikimedia.org/wikipedia/en/b/be/Githellposter.jpg',           color: '#0f766e', pop: '8.8' },
    { rank: 18, name: 'Princess Mononoke',      query: 'Princesa Mononoke pelicula completa español',          img: 'https://upload.wikimedia.org/wikipedia/en/4/4e/Mononokehime_poster.jpg',     color: '#15803d', pop: '8.8' },
    { rank: 19, name: 'Akira',                  query: 'Akira 1988 pelicula completa español',                 img: 'https://upload.wikimedia.org/wikipedia/en/4/4c/Akira_%281988_film%29.jpg', color: '#dc2626', pop: '8.8' },
    { rank: 20, name: 'JoJo Bizarre Adventure', query: 'JoJo no Kimyou na Bouken pelicula español',            img: 'https://upload.wikimedia.org/wikipedia/en/b/b6/JoJos_Bizarre_Adventure_manga_volume_1.jpg', color: '#d946ef', pop: '8.7' },
    { rank: 21, name: 'One Punch Man',          query: 'One Punch Man pelicula completa español',              img: 'https://upload.wikimedia.org/wikipedia/en/3/32/One_Punch_Man%2C_Volume_1_Cover.jpg', color: '#facc15', pop: '8.7' },
    { rank: 22, name: 'Code Geass',             query: 'Code Geass pelicula completa español',                 img: 'https://upload.wikimedia.org/wikipedia/en/0/0e/Code_Geass_Lelouch_of_the_Rebellion_DVD_Vol._1.jpg', color: '#7c3aed', pop: '8.7' },
    { rank: 23, name: 'Steins;Gate',            query: 'Steins Gate pelicula completa español',                img: 'https://upload.wikimedia.org/wikipedia/en/6/63/Steins_Gate_volume_1.jpg',    color: '#0369a1', pop: '8.6' },
    { rank: 24, name: 'Re:Zero',                query: 'Re Zero pelicula completa español subtitulado',        img: 'https://upload.wikimedia.org/wikipedia/en/9/9c/Re_Zero_kara_Hajimeru_Isekai_Seikatsu_volume_1.jpg', color: '#be185d', pop: '8.6' },
    { rank: 25, name: 'Tokyo Ghoul',            query: 'Tokyo Ghoul pelicula completa español',                img: 'https://upload.wikimedia.org/wikipedia/en/f/f6/Tokyo_Ghoul_manga_vol_1.jpg',  color: '#9f1239', pop: '8.5' },
    { rank: 26, name: 'Fairy Tail',             query: 'Fairy Tail pelicula completa español',                 img: 'https://upload.wikimedia.org/wikipedia/en/9/9b/Fairy_Tail_manga_volume_1.jpg', color: '#1d4ed8', pop: '8.5' },
    { rank: 27, name: 'Mob Psycho 100',         query: 'Mob Psycho 100 pelicula completa español',             img: 'https://upload.wikimedia.org/wikipedia/en/a/a7/Mob_Psycho_100_volume_1.jpg',  color: '#4f46e5', pop: '8.5' },
    { rank: 28, name: 'Chainsaw Man',           query: 'Chainsaw Man pelicula completa español subtitulado',   img: 'https://upload.wikimedia.org/wikipedia/en/9/99/Chainsaw_Man_Volume_1.jpg',   color: '#dc2626', pop: '8.4' },
    { rank: 29, name: 'Vinland Saga',           query: 'Vinland Saga pelicula completa español',               img: 'https://upload.wikimedia.org/wikipedia/en/2/22/VinlandSagaVol1.jpg',        color: '#92400e', pop: '8.4' },
    { rank: 30, name: 'Berserk',                query: 'Berserk pelicula completa español',                    img: 'https://upload.wikimedia.org/wikipedia/en/a/a9/Berserk_manga_volume_1.jpg', color: '#1c1917', pop: '8.4' },
    { rank: 31, name: 'Overlord',               query: 'Overlord pelicula completa español anime',             img: 'https://upload.wikimedia.org/wikipedia/en/3/37/Overlord_light_novel_volume_1_cover.jpg', color: '#064e3b', pop: '8.3' },
    { rank: 32, name: 'Black Clover',           query: 'Black Clover pelicula completa español',               img: 'https://upload.wikimedia.org/wikipedia/en/0/0b/Black_Clover_volume_1.jpg',   color: '#15803d', pop: '8.3' },
    { rank: 33, name: 'Haikyuu',                query: 'Haikyuu pelicula completa español subtitulado',        img: 'https://upload.wikimedia.org/wikipedia/en/2/2f/Haikyuu_manga_volume_1.jpg',  color: '#f97316', pop: '8.3' },
    { rank: 34, name: 'Slam Dunk',              query: 'Slam Dunk pelicula completa español',                  img: 'https://upload.wikimedia.org/wikipedia/en/f/fa/Slam_Dunk_volume_1.jpg',     color: '#dc2626', pop: '8.2' },
    { rank: 35, name: 'Blue Lock',              query: 'Blue Lock pelicula completa español',                  img: 'https://upload.wikimedia.org/wikipedia/en/1/14/Blue_Lock_volume_1.jpg',     color: '#1d4ed8', pop: '8.2' },
    { rank: 36, name: 'Inuyasha',               query: 'Inuyasha pelicula completa español',                   img: 'https://upload.wikimedia.org/wikipedia/en/6/6a/Inuyasha_volume_1.jpg',      color: '#b91c1c', pop: '8.2' },
    { rank: 37, name: 'Yu Yu Hakusho',          query: 'Yu Yu Hakusho pelicula completa español',              img: 'https://upload.wikimedia.org/wikipedia/en/f/f4/Yu_Yu_Hakusho_manga_v1.jpg', color: '#7c3aed', pop: '8.1' },
    { rank: 38, name: 'Sailor Moon',            query: 'Sailor Moon pelicula completa español',                img: 'https://upload.wikimedia.org/wikipedia/en/4/42/Sailor_Moon_volume_1.jpg',    color: '#db2777', pop: '8.1' },
    { rank: 39, name: 'Hellsing',               query: 'Hellsing Ultimate pelicula completa español',          img: 'https://upload.wikimedia.org/wikipedia/en/a/a6/Hellsing_vol01.jpg',          color: '#7f1d1d', pop: '8.0' },
    { rank: 40, name: 'Trigun',                 query: 'Trigun pelicula completa español',                     img: 'https://upload.wikimedia.org/wikipedia/en/b/be/Trigun_vol01_cover.jpg',      color: '#ca8a04', pop: '8.0' },
    { rank: 41, name: 'Pokmon',               query: 'Pokemon pelicula completa español latino',              img: 'https://upload.wikimedia.org/wikipedia/en/c/c5/Pok%C3%A9mon_Yellow_box_art.jpg', color: '#eab308', pop: '9.2' },
    { rank: 42, name: 'Digimon',               query: 'Digimon pelicula completa español latino',              img: 'https://upload.wikimedia.org/wikipedia/en/4/4e/Digimonlogo.png',             color: '#2563eb', pop: '8.5' },
    { rank: 43, name: 'Cardcaptor Sakura',      query: 'Cardcaptor Sakura pelicula completa español',          img: 'https://upload.wikimedia.org/wikipedia/en/0/06/Cardcaptor_Sakura_volume_1.jpg', color: '#f472b6', pop: '8.0' },
    { rank: 44, name: 'Doraemon',              query: 'Doraemon pelicula completa español',                    img: 'https://upload.wikimedia.org/wikipedia/en/b/b9/Doraemon_character.png',      color: '#2563eb', pop: '8.8' },
    { rank: 45, name: 'Detective Conan',        query: 'Detective Conan pelicula completa español',            img: 'https://upload.wikimedia.org/wikipedia/en/7/7a/Case_Closed_Manga_Volume_1.jpg', color: '#1e40af', pop: '8.6' },
    { rank: 46, name: 'Dragon Ball Super',      query: 'Dragon Ball Super Broly pelicula completa español',    img: 'https://upload.wikimedia.org/wikipedia/en/6/6a/Dragon_Ball_Super_manga_volume_1.jpg', color: '#f97316', pop: '8.7' },
    { rank: 47, name: 'Sword Art Online Alicization', query: 'SAO Alicization pelicula completa español',     img: 'https://upload.wikimedia.org/wikipedia/en/0/05/Sword_Art_Online_light_novel_volume_1_cover.jpg', color: '#16a34a', pop: '8.2' },
    { rank: 48, name: 'Gurren Lagann',          query: 'Gurren Lagann pelicula completa español',              img: 'https://upload.wikimedia.org/wikipedia/en/4/4e/Gurren_Lagann_DVD_vol_1.jpg',  color: '#dc2626', pop: '8.5' },
    { rank: 49, name: 'Toradora',               query: 'Toradora pelicula completa español',                   img: 'https://upload.wikimedia.org/wikipedia/en/b/bc/Toradora_light_novel_v1.jpg', color: '#f43f5e', pop: '8.3' },
    { rank: 50, name: 'Sword Art Online Progressive', query: 'SAO Progressive pelicula completa español',     img: 'https://upload.wikimedia.org/wikipedia/en/0/05/Sword_Art_Online_light_novel_volume_1_cover.jpg', color: '#16a34a', pop: '8.1' },
];

window._animeHubActive = false;

let _savedMainHTML = null;
let _savedFiltersDisplay = null;

function showAnimeHub() {
    window._animeHubActive = true;

    const filtersEl = document.querySelector('.filters');
    const paginationEl = document.getElementById('pagination');
    if (filtersEl) { _savedFiltersDisplay = filtersEl.style.display; filtersEl.style.display = 'none'; }
    if (paginationEl) paginationEl.innerHTML = '';

    const grid = document.getElementById('moviesGrid');
    if (!grid) return;

    grid.className = 'anime-hub';
    grid.innerHTML = `
        <div class="anime-hub-header">
            <h2>Los 50 Animes Ms Populares de la Historia</h2>
            <p>Selecciona una franquicia para ver sus peláculas disponibles en español</p>
        </div>
        <div class="anime-franchise-grid" id="animeFranchiseGrid"></div>
    `;

    renderAnimeGrid();
}

function hideAnimeHub() {
    window._animeHubActive = false;

    const grid = document.getElementById('moviesGrid');
    if (grid) grid.className = 'movies-grid';

    // Restaurar vista hero+filas
    showHeroView();
    renderHeroSection();
    renderGenreRows();
}

function renderAnimeGrid() {
    const container = document.getElementById('animeFranchiseGrid');
    if (!container) return;

    container.innerHTML = TOP_50_ANIMES.map(anime => `
        <div class="anime-franchise-card"
             id="anime-card-${anime.rank}"
             onclick="openAnimeMovies(${anime.rank})"
             title="${anime.name}">
            <img
                src="${anime.img}"
                alt="${anime.name}"
                loading="lazy"
                onerror="this.src='https://picsum.photos/seed/${encodeURIComponent(anime.name)}/300/450'"
            >
            <div class="anime-card-overlay">
                <span class="anime-rank-badge">#${anime.rank}</span>
                <span class="anime-pop-badge">
                    <i class="fas fa-star"></i>${anime.pop}
                </span>
                <div class="anime-card-name">${anime.name}</div>
                <span class="anime-card-btn">
                    <i class="fas fa-film"></i> Ver peláculas
                </span>
            </div>
        </div>
    `).join('');
}

let cachedAnimeMoviesData = null;
async function getAnimeMoviesData() {
    if (cachedAnimeMoviesData) return cachedAnimeMoviesData;
    try {
        const response = await fetch('/p/anime-movies-data.json');
        if (!response.ok) throw new Error('Error loading static anime data');
        cachedAnimeMoviesData = await response.json();
        return cachedAnimeMoviesData;
    } catch (err) {
        console.error(err);
        return {};
    }
}

function deduplicateMovies(movies) {
    const seen = new Set();
    return movies.filter(m => {
        const key = m.youtubeId || m.archiveId || m.title;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

async function openAnimeMovies(rank) {
    const anime = TOP_50_ANIMES.find(a => a.rank === rank);
    if (!anime) return;

    window._currentFranchiseRank = rank;

    const grid = document.getElementById('moviesGrid');
    if (!grid) return;

    grid.innerHTML = `
        <div class="anime-movies-section">
            <div class="anime-movies-topbar">
                <button class="anime-back-btn" onclick="showAnimeHub()">
                    <i class="fas fa-arrow-left"></i> Volver a Animes
                </button>
                <h2 class="anime-movies-title">${anime.name} — Peláculas</h2>
            </div>
            <div class="anime-movies-grid" id="animeMoviesGrid">
                <div class="anime-loading">
                    <div class="anime-loading-spinner"></div>
                    <p>Cargando peláculas de <strong>${anime.name}</strong> en español...</p>
                </div>
            </div>
        </div>
    `;

    const data = await getAnimeMoviesData();
    const results = data[rank] || [];
    renderAnimeMovies(results, anime);
}

async function searchAnimeMovies(anime) {
    const data = await getAnimeMoviesData();
    return data[anime.rank] || [];
}

function decodeHtmlEntities(str) {
    if (!str) return '';
    const txt = document.createElement('textarea');
    txt.innerHTML = str;
    return txt.value;
}

function cleanAnimeTitle(title, animeName) {
    let cleaned = decodeHtmlEntities(title);
    return cleaned
        .replace(/\s*[\|\-ÔÇô—]\s*.+/g, '')
        .replace(/\[.*?\]/g, '')
        .replace(/\(.*?(HD|4K|1080p|720p|completa?|subtitulad[ao]|español|latino).*?\)/gi, '')
        .replace(/HD|4K|1080p|720p/gi, '')
        .replace(/\s{2,}/g, ' ')
        .trim() || animeName;
}

async function handleAnimeSearch(query) {
    const q = (query || '').toLowerCase().trim();

    if (!window._animeHubActive) return;

    const data = await getAnimeMoviesData();

    if (window._currentFranchiseRank) {
        const anime = TOP_50_ANIMES.find(a => a.rank === window._currentFranchiseRank);
        const franchiseMovies = data[window._currentFranchiseRank] || [];
        const filteredMovies = franchiseMovies.filter(m =>
            m.title.toLowerCase().includes(q)
        );
        renderAnimeMovies(filteredMovies, anime);
        return;
    }

    const grid = document.getElementById('moviesGrid');
    if (!grid) return;

    if (!q) {
        grid.className = 'anime-hub';
        grid.innerHTML = `
            <div class="anime-hub-header">
                <h2>Los 50 Animes Ms Populares de la Historia</h2>
                <p>Selecciona una franquicia para ver sus peláculas disponibles en español</p>
            </div>
            <div class="anime-franchise-grid" id="animeFranchiseGrid"></div>
        `;
        renderAnimeGrid();
        return;
    }

    const matchingFranchises = TOP_50_ANIMES.filter(a => a.name.toLowerCase().includes(q));

    let matchingMovies = [];
    for (const rank in data) {
        const anime = TOP_50_ANIMES.find(a => a.rank == rank);
        const franchiseName = anime ? anime.name : '';
        const movies = data[rank] || [];
        movies.forEach(m => {
            if (m.title.toLowerCase().includes(q)) {
                matchingMovies.push({
                    ...m,
                    franchiseName: franchiseName,
                    franchiseRank: rank
                });
            }
        });
    }

    matchingMovies = deduplicateMovies(matchingMovies);

    grid.className = 'anime-hub';

    let html = `
        <div class="anime-hub-header">
            <h2>Resultados de búsqueda para "${query}"</h2>
            <p>Se encontraron ${matchingFranchises.length} franquicias y ${matchingMovies.length} peláculas</p>
        </div>
    `;

    if (matchingFranchises.length > 0) {
        html += `
            <h3 class="anime-section-subtitle" style="margin: 2rem auto 1rem; max-width: 1400px; padding: 0 1rem; color: #a855f7; font-size: 1.4rem;">
                <i class="fas fa-list"></i> Franquicias de Anime
            </h3>
            <div class="anime-franchise-grid" id="searchFranchiseGrid" style="margin-bottom: 3rem;"></div>
        `;
    }

    if (matchingMovies.length > 0) {
        html += `
            <h3 class="anime-section-subtitle" style="margin: 2rem auto 1rem; max-width: 1400px; padding: 0 1rem; color: #ec4899; font-size: 1.4rem;">
                <i class="fas fa-film"></i> Peláculas Disponibles
            </h3>
            <div class="anime-movies-grid" id="searchMoviesGrid"></div>
        `;
    }

    if (matchingFranchises.length === 0 && matchingMovies.length === 0) {
        html += `
            <div class="anime-empty" style="text-align: center; padding: 4rem 1rem;">
                <i class="fas fa-exclamation-circle" style="font-size: 3rem; color: rgba(168, 85, 247, 0.4); margin-bottom: 1rem; display: block;"></i>
                <h3>No se encontraron resultados</h3>
                <p>Prueba con otros trminos de búsqueda como "Dragon Ball", "Naruto" o "Mewtwo".</p>
            </div>
        `;
    }

    grid.innerHTML = html;

    if (matchingFranchises.length > 0) {
        const franchiseContainer = document.getElementById('searchFranchiseGrid');
        if (franchiseContainer) {
            franchiseContainer.innerHTML = matchingFranchises.map(anime => `
                <div class="anime-franchise-card"
                     onclick="openAnimeMovies(${anime.rank})"
                     title="${anime.name}">
                    <img src="${anime.img}" alt="${anime.name}" loading="lazy" onerror="this.src='https://picsum.photos/seed/${encodeURIComponent(anime.name)}/300/450'">
                    <div class="anime-card-overlay">
                        <span class="anime-rank-badge">#${anime.rank}</span>
                        <span class="anime-pop-badge"><i class="fas fa-star"></i>${anime.pop}</span>
                        <div class="anime-card-name">${anime.name}</div>
                        <span class="anime-card-btn"><i class="fas fa-film"></i> Ver peláculas</span>
                    </div>
                </div>
            `).join('');
        }
    }

    if (matchingMovies.length > 0) {
        const moviesContainer = document.getElementById('searchMoviesGrid');
        if (moviesContainer) {
            moviesContainer.innerHTML = matchingMovies.map(movie => `
                <div class="anime-result-card"
                     onclick="openAnimePlayer('${movie.youtubeId || ''}', '${movie.archiveId || ''}', '${movie.title.replace(/'/g, '&#39;')}', '${movie.franchiseName.replace(/'/g, '&#39;')}')"
                     title="${movie.title}">
                    <img src="${movie.poster}" alt="${movie.title}" loading="lazy" onerror="this.src='https://picsum.photos/seed/${movie.youtubeId || movie.archiveId}/300/450'">
                    <div class="anime-result-overlay">
                        <div class="anime-result-title">${movie.title}</div>
                        <div style="font-size: 0.72rem; color: #a855f7; margin-top: 0.2rem; font-weight: 500;">Franquicia: ${movie.franchiseName}</div>
                        <span class="anime-result-play"><i class="fas fa-play-circle"></i> Reproducir</span>
                    </div>
                </div>
            `).join('');
        }
    }
}

function renderAnimeMovies(movies, anime) {
    const container = document.getElementById('animeMoviesGrid');
    if (!container) return;

    const uniqueMovies = deduplicateMovies(movies);

    if (uniqueMovies.length === 0) {
        container.innerHTML = `
            <div class="anime-empty">
                <i class="fas fa-exclamation-circle"></i>
                <h3>No se encontraron peláculas</h3>
                <p>No hay peláculas disponibles en español para <strong>${anime.name}</strong>. Intenta ms tarde.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = uniqueMovies.map(movie => `
        <div class="anime-result-card"
             onclick="openAnimePlayer('${movie.youtubeId || ''}', '${movie.archiveId || ''}', '${movie.title.replace(/'/g, '&#39;')}', '${anime.name.replace(/'/g, '&#39;')}')"
             title="${movie.title}">
            <img
                src="${movie.poster}"
                alt="${movie.title}"
                loading="lazy"
                onerror="this.src='https://picsum.photos/seed/${movie.youtubeId || movie.archiveId}/300/450'"
            >
            <div class="anime-result-overlay">
                <div class="anime-result-title">${movie.title}</div>
                <span class="anime-result-play">
                    <i class="fas fa-play-circle"></i> Reproducir
                </span>
            </div>
        </div>
    `).join('');
}

function openAnimePlayer(youtubeId, archiveId, title, animeName) {
    const modal = document.getElementById('playerModal');
    const embed  = document.getElementById('youtubeEmbed');
    const placeholder = document.getElementById('videoPlaceholder');

    if (!modal || !embed) return;

    document.getElementById('playerTitle').textContent  = title || animeName;
    document.getElementById('playerYear').textContent   = '';
    document.getElementById('playerGenre').textContent  = `Anime ┬À ${animeName}`;
    document.getElementById('playerRating').innerHTML   = '<i class="fas fa-star"></i> Anime';
    document.getElementById('playerDescription').textContent = `Pelácula de la franquicia ${animeName}`;

    if (placeholder) placeholder.style.display = 'flex';
    embed.innerHTML = '';

    if (youtubeId && youtubeId !== 'null' && youtubeId !== 'undefined' && youtubeId !== '') {
        const params = new URLSearchParams({
            autoplay: 1, controls: 1, rel: 0, modestbranding: 1,
            iv_load_policy: 3, fs: 1, hl: 'es', cc_lang_pref: 'es',
        });

        embed.innerHTML = `<iframe
            src="https://www.youtube-nocookie.com/embed/${youtubeId}?${params}"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
            style="width:100%;height:100%">
        </iframe>`;
    } else if (archiveId && archiveId !== 'null' && archiveId !== 'undefined' && archiveId !== '') {
        embed.innerHTML = `<iframe
            src="https://archive.org/embed/${archiveId}"
            frameborder="0"
            webkitallowfullscreen="true"
            mozallowfullscreen="true"
            allowfullscreen
            style="width:100%;height:100%">
        </iframe>`;
    } else {
        embed.innerHTML = `
            <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:var(--text-secondary);padding:2rem;text-align:center;">
                <i class="fas fa-exclamation-triangle" style="font-size:3rem;color:var(--primary-color);margin-bottom:1rem;"></i>
                <h3>No hay reproductor disponible</h3>
                <p>Esta pelácula no tiene un enlace de reproducción configurado.</p>
            </div>
        `;
    }

    embed.style.display = 'block';
    if (placeholder) placeholder.style.display = 'none';
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    isPlaying = true;
    updatePlayPauseButton();
}

window.openAnimeMovies  = openAnimeMovies;
window.openAnimePlayer  = openAnimePlayer;
window.showAnimeHub     = showAnimeHub;

// =====================================================
// Init
// =====================================================
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

window.loadCategoryMovies = loadCategoryMovies;

// =====================================================
// EFFECT: Brillo magntico en tarjetas (mouse glow)
// =====================================================
document.addEventListener('mousemove', (e) => {
    const cards = document.querySelectorAll('.movie-card, .movie-row-card, .anime-franchise-card, .anime-result-card');
    cards.forEach(card => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);
    });
});
