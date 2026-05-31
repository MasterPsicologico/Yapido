'use client';

import { useEffect, useRef, useState } from 'react';

export default function PeliculasPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Capa 2: Meta robots dinámico (refuerzo client-side)
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow, noarchive, nosnippet, noodp, noimageindex, notranslate';
    document.head.appendChild(meta);

    const meta2 = document.createElement('meta');
    meta2.name = 'googlebot';
    meta2.content = 'noindex, nofollow, noarchive, nosnippet';
    document.head.appendChild(meta2);

    const meta3 = document.createElement('meta');
    meta3.name = 'bingbot';
    meta3.content = 'noindex, nofollow, noarchive';
    document.head.appendChild(meta3);

    const metaEquiv = document.createElement('meta');
    metaEquiv.httpEquiv = 'X-Robots-Tag';
    metaEquiv.content = 'noindex, nofollow, noarchive, nosnippet';
    document.head.appendChild(metaEquiv);

    // Scripts de CineStream
    let active = true;
    let firebaseScript: HTMLScriptElement | null = null;
    let firestoreScript: HTMLScriptElement | null = null;
    let dbService: HTMLScriptElement | null = null;
    let appScript: HTMLScriptElement | null = null;

    const loadScripts = async () => {
      const loadScript = (src: string, id: string): Promise<HTMLScriptElement | null> => {
        return new Promise((resolve) => {
          if (!active) {
            resolve(null);
            return;
          }
          
          const existing = document.getElementById(id) as HTMLScriptElement;
          if (existing) {
            resolve(existing);
            return;
          }

          const script = document.createElement('script');
          script.src = src;
          script.id = id;
          script.async = true;
          script.onload = () => resolve(script);
          script.onerror = () => resolve(null);
          document.body.appendChild(script);
        });
      };

      firebaseScript = await loadScript('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js', 'firebase-app-compat');
      if (!active) return;

      firestoreScript = await loadScript('https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-compat.js', 'firebase-firestore-compat');
      if (!active) return;

      dbService = await loadScript('/p/firestore-service.js', 'cinestream-db-service');
      if (!active) return;

      appScript = await loadScript('/p/app.js', 'cinestream-app-script');
      if (!active && appScript) {
        if (document.body.contains(appScript)) document.body.removeChild(appScript);
        return;
      }

      if (active) {
        setIsLoaded(true);
      }
    };

    loadScripts();

    return () => {
      active = false;

      // Limpiar meta tags de robots
      if (document.head.contains(meta)) document.head.removeChild(meta);
      if (document.head.contains(meta2)) document.head.removeChild(meta2);
      if (document.head.contains(meta3)) document.head.removeChild(meta3);
      if (document.head.contains(metaEquiv)) document.head.removeChild(metaEquiv);

      const w = window as any;
      if (w.CineStreamDB) {
        w.CineStreamDB.cleanup();
      }
      if (w._cinestreamKeydownHandler) {
        window.removeEventListener('keydown', w._cinestreamKeydownHandler);
        w._cinestreamKeydownHandler = null;
      }
      if (w._cinestreamScrollHandler) {
        window.removeEventListener('scroll', w._cinestreamScrollHandler);
        w._cinestreamScrollHandler = null;
      }

      if (firebaseScript && document.body.contains(firebaseScript)) document.body.removeChild(firebaseScript);
      if (firestoreScript && document.body.contains(firestoreScript)) document.body.removeChild(firestoreScript);
      if (dbService && document.body.contains(dbService)) document.body.removeChild(dbService);
      if (appScript && document.body.contains(appScript)) document.body.removeChild(appScript);
    };
  }, []);

  return (
    <>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" precedence="default" />
      <link rel="stylesheet" href="/p/styles.css" precedence="default" />
      <div ref={containerRef} className="cinestream-app">
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <i className="fas fa-film"></i>
            <span>CineStream</span>
          </div>
          <nav className="nav">
            <button className="nav-btn active" data-filter="all">Todo</button>
            <button className="nav-btn" data-filter="accion">Acción</button>
            <button className="nav-btn" data-filter="comedia">Comedia</button>
            <button className="nav-btn" data-filter="drama">Drama</button>
            <button className="nav-btn" data-filter="terror">Terror</button>
            <button className="nav-btn" data-filter="cienciaficcion">Ciencia Ficción</button>
            <button className="nav-btn" data-filter="anime">Anime</button>
            <button className="nav-btn" data-filter="romance">Romance</button>
            <button className="nav-btn" data-filter="thriller">Thriller</button>
            <button className="nav-btn" data-filter="documental">Documental</button>
            <button className="nav-btn" data-filter="aventura">Aventura</button>
            <button className="nav-btn" data-filter="fantasia">Fantasía</button>
            <button className="nav-btn" data-filter="misterio">Misterio</button>
          </nav>
          <div className="search-box">
            <i className="fas fa-search"></i>
            <input type="text" id="searchInput" placeholder="Buscar películas..." />
          </div>
        </div>
      </header>

      <main className="main">
        <div id="heroSection" className="hero-skeleton"></div>
        <div id="movieRows" className="movie-rows-container"></div>
        <section className="filters">
          <div className="filter-group">
            <label>Ordenar por:</label>
            <select id="sortSelect">
              <option value="year">Año (recientes)</option>
              <option value="title">Título</option>
              <option value="rating">Calificación</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Año:</label>
            <select id="yearFilter">
              <option value="all">Todos</option>
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
              <option value="2023">2023</option>
              <option value="2022">2022</option>
              <option value="2021">2021</option>
              <option value="2020">2020</option>
              <option value="old">Anteriores</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Tipo:</label>
            <select id="typeFilter">
              <option value="all">Todos</option>
              <option value="pelicula">Película</option>
              <option value="documental">Documental</option>
            </select>
          </div>
        </section>

        <section className="movies-grid" id="moviesGrid">
          <div className="loading" style={{ gridColumn: '1/-1' }}>
            <div className="loading-spinner"></div>
            <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Cargando películas desde la nube...</p>
          </div>
        </section>
        <section className="pagination" id="pagination"></section>
      </main>

      <div className="player-modal" id="playerModal">
        <div className="player-container">
          <div className="player-header">
            <h2 id="playerTitle">Título de la película</h2>
            <button className="close-player" id="closePlayer">
              <i className="fas fa-times"></i>
            </button>
          </div>
          <div className="video-wrapper">
            <div className="video-placeholder" id="videoPlaceholder">
              <div className="loader"></div>
              <p>Cargando reproductor...</p>
            </div>
            <video id="customPlayer" className="custom-video" playsInline>
              Tu navegador no soporta el reproductor de video.
            </video>
            <div className="youtube-embed" id="youtubeEmbed"></div>
          </div>
          <div className="player-controls">
            <div className="progress-container" id="progressContainer">
              <div className="progress-bar" id="progressBar"></div>
              <div className="progress-buffered" id="progressBuffered"></div>
            </div>
            <div className="controls-row">
              <div className="controls-left">
                <button className="control-btn" id="playPauseBtn">
                  <i className="fas fa-play"></i>
                </button>
                <button className="control-btn" id="rewindBtn">
                  <i className="fas fa-backward-10"></i>
                </button>
                <button className="control-btn" id="forwardBtn">
                  <i className="fas fa-forward-10"></i>
                </button>
                <div className="volume-control">
                  <button className="control-btn" id="volumeBtn">
                    <i className="fas fa-volume-up"></i>
                  </button>
                  <input type="range" id="volumeSlider" min="0" max="100" defaultValue="100" />
                </div>
                <span className="time-display" id="timeDisplay">0:00 / 0:00</span>
              </div>
              <div className="controls-right">
                <button className="control-btn" id="settingsBtn">
                  <i className="fas fa-cog"></i>
                </button>
                <button className="control-btn" id="fullscreenBtn">
                  <i className="fas fa-expand"></i>
                </button>
                <select id="qualitySelect" className="quality-select">
                  <option value="1080">1080p</option>
                  <option value="720">720p</option>
                  <option value="480">480p</option>
                </select>
              </div>
            </div>
          </div>
          <div className="player-info">
            <div className="movie-meta">
              <span id="playerYear">2024</span>
              <span id="playerGenre">Acción</span>
              <span id="playerRating"><i className="fas fa-star"></i> 8.5</span>
            </div>
            <p id="playerDescription">Descripción de la película...</p>
          </div>
        </div>
      </div>

      <footer className="footer">
        <p>&copy; 2024 CineStream - Todos los derechos reservados</p>
      </footer>
    </div>
  </>
);
}
