/* ═══════════════════════════════════════════════════════════
   X·STREAM — Reproductor instantáneo de anime por enlaces directos
   Vanilla JS · localStorage · sin backend
   ═══════════════════════════════════════════════════════════ */

'use strict';

/* ─────────── Paletas de portada (gradientes) ─────────── */
const GRADS = [
  ['#7c3aed', '#312e81'], ['#ff2e63', '#4a0e2e'], ['#f59e0b', '#7c2d12'],
  ['#10b981', '#064e3b'], ['#3b82f6', '#1e3a8a'], ['#ef4444', '#7f1d1d'],
  ['#ec4899', '#831843'], ['#14b8a6', '#134e4a'], ['#8b5cf6', '#4c1d95'],
  ['#f97316', '#7c2d12'], ['#06b6d4', '#164e63'], ['#d8ff3e', '#3f6212'],
];

/* ─────────── Videos demo (MP4 directos de Google) ─────────── */
const DEMO = [
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4',
];

/* ─────────── 30 series anime precargadas ───────────
   demo:true  → el cap 1 trae un MP4 de prueba para reproducir al instante. */
const SEED = [
  { t: 'Attack on Titan',      jp: '進撃',  eps: 87,   tag: 'Acción · Oscuro',  g: 1, demo: true },
  { t: 'Demon Slayer',         jp: '鬼滅',  eps: 63,   tag: 'Shonen · Fantasía', g: 0, demo: true },
  { t: 'Naruto',               jp: 'ナルト', eps: 220,  tag: 'Shonen · Ninjas',   g: 9, demo: true },
  { t: 'One Piece',            jp: 'ワンピ', eps: 220,  tag: 'Aventura · Piratas', g: 4, demo: true },
  { t: 'Jujutsu Kaisen',       jp: '呪術',  eps: 47,   tag: 'Shonen · Maldiciones', g: 8, demo: true },
  { t: 'Death Note',           jp: 'デスノ', eps: 37,   tag: 'Thriller · Psicológico', g: 3, demo: true },
  { t: 'Fullmetal Alchemist: Brotherhood', jp: '鋼の錬', eps: 64, tag: 'Acción · Alquimia', g: 5, demo: true },
  { t: 'My Hero Academia',     jp: 'ヒロアカ', eps: 159, tag: 'Shonen · Héroes',   g: 2, demo: true },
  { t: 'Dragon Ball Z',        jp: 'ドラゴン', eps: 291, tag: 'Clásico · Peleas',  g: 10, demo: true },
  { t: 'One Punch Man',        jp: 'ワンパン', eps: 24,  tag: 'Comedia · Acción',  g: 11, demo: true },
  { t: 'Spy x Family',         jp: 'スパイ', eps: 37,   tag: 'Comedia · Familia', g: 6 },
  { t: 'Chainsaw Man',         jp: 'チェンソ', eps: 12,  tag: 'Acción · Gore',    g: 1 },
  { t: 'Hunter x Hunter',      jp: 'ハンター', eps: 148, tag: 'Aventura · Nen',   g: 3 },
  { t: 'Tokyo Ghoul',          jp: '喰種',  eps: 48,   tag: 'Oscuro · Ghoul',    g: 5 },
  { t: 'Sword Art Online',     jp: 'SAO',   eps: 96,   tag: 'Isekai · VRMMO',    g: 4 },
  { t: 'Bleach',               jp: 'ブリーチ', eps: 366, tag: 'Shonen · Shinigami', g: 0 },
  { t: 'Black Clover',         jp: 'ブラクロ', eps: 170, tag: 'Shonen · Magia',   g: 8 },
  { t: 'Vinland Saga',         jp: 'ヴィンラ', eps: 48,  tag: 'Histórico · Vikingos', g: 7 },
  { t: 'Mob Psycho 100',       jp: 'モブサイコ', eps: 37, tag: 'Psíquicos · Comedia', g: 6 },
  { t: 'Cowboy Bebop',         jp: 'ビバップ', eps: 26,  tag: 'Sci-Fi · Jazz',    g: 3 },
  { t: 'Neon Genesis Evangelion', jp: 'エヴァ', eps: 26,  tag: 'Mecha · Filosófico', g: 0 },
  { t: 'Code Geass',           jp: 'コードギアス', eps: 50, tag: 'Mecha · Estrategia', g: 5 },
  { t: 'Haikyuu!!',            jp: 'ハイキュー', eps: 85, tag: 'Deportes · Voley', g: 9 },
  { t: 'Dr. Stone',            jp: 'ドクター', eps: 57,  tag: 'Ciencia · Supervivencia', g: 3 },
  { t: 'Fairy Tail',           jp: 'フェアリー', eps: 328, tag: 'Magia · Gremio', g: 4 },
  { t: 'JoJo\'s Bizarre Adventure', jp: 'ジョジョ', eps: 152, tag: 'Bizarro · Stands', g: 11 },
  { t: 'Re:Zero',              jp: 'リゼロ', eps: 50,   tag: 'Isekai · Drama',   g: 7 },
  { t: 'Overlord',             jp: 'オーバーロード', eps: 52, tag: 'Isekai · Villano', g: 8 },
  { t: 'Blue Lock',            jp: 'ブルーロック', eps: 24, tag: 'Deportes · Fútbol', g: 4 },
  { t: 'Kaiju No. 8',          jp: '怪獣8号', eps: 12,  tag: 'Kaiju · Acción',   g: 2 },
];

/* ─────────── Estado ─────────── */
const LS_KEY = 'xstream-v1';
let state = { series: [], autoplay: true };
let current = { seriesId: null, ep: null };
let editing = false;

function seed() {
  state.series = SEED.map((s, i) => {
    const episodes = [];
    for (let n = 1; n <= Math.min(s.eps, 220); n++) {
      episodes.push({ n, t: `Capítulo ${n}`, url: s.demo && n === 1 ? DEMO[i % DEMO.length] : '' });
    }
    return {
      id: 's' + i + '-' + s.t.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      t: s.t, jp: s.jp, tag: s.tag, g: s.g,
      episodes,
    };
  });
}

function load() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.series && parsed.series.length) { state = parsed; return; }
    }
  } catch (e) { /* corrupto → reseed */ }
  seed();
}
function save() { localStorage.setItem(LS_KEY, JSON.stringify(state)); }

const $ = id => document.getElementById(id);
const els = {
  video: $('video'), driveFrame: $('driveFrame'), playerArea: $('playerArea'), empty: $('playerEmpty'), noUrl: $('playerNoUrl'),
  spinner: $('spinner'), bigPlay: $('bigPlay'), controls: $('controls'),
  seekWrap: $('seekWrap'), seekFill: $('seekFill'), seekBuffer: $('seekBuffer'), seekThumb: $('seekThumb'),
  playBtn: $('playBtn'), playIcon: $('playIcon'), prevEp: $('prevEp'), nextEp: $('nextEp'),
  muteBtn: $('muteBtn'), volume: $('volume'), tCur: $('tCur'), tDur: $('tDur'),
  speed: $('speed'), pipBtn: $('pipBtn'), fsBtn: $('fsBtn'), autoplayBtn: $('autoplayBtn'),
  nowPlaying: $('nowPlaying'), stageTitle: $('stageTitle'), stageSub: $('stageSub'),
  stageBadges: $('stageBadges'), seriesList: $('seriesList'), seriesCount: $('seriesCount'),
  episodesGrid: $('episodesGrid'), episodesTitle: $('episodesTitle'), searchInput: $('searchInput'),
  editModeBtn: $('editModeBtn'), addSeriesBtn: $('addSeriesBtn'), addEpBtn: $('addEpBtn'),
  delSeriesBtn: $('delSeriesBtn'), goEditBtn: $('goEditBtn'),
  insertEpBtn: $('insertEpBtn'), undoBtn: $('undoBtn'), themeBtn: $('themeBtn'),
  shareBtn: $('shareBtn'), modalShare: $('modalShare'), shareTitle: $('shareTitle'),
  shareGrid: $('shareGrid'), shareUrl: $('shareUrl'), copyShareUrl: $('copyShareUrl'),
  closeShare: $('closeShare'),
  modalAdd: $('modalAdd'), newTitle: $('newTitle'), newJp: $('newJp'), newEps: $('newEps'),
  gradPicker: $('gradPicker'), cancelAdd: $('cancelAdd'), confirmAdd: $('confirmAdd'),
  toast: $('toast'), gestL: $('gestL'), gestR: $('gestR'),
};

/* ═══════════ Google Drive ═══════════
   Convierte cualquier formato de enlace de Drive al ID del archivo
   y genera la URL reproducible (preview embebible).                 */
function parseDriveId(url) {
  if (!url || typeof url !== 'string') return null;
  if (!/drive\.google|docs\.google\.com\/.*drive/i.test(url)) return null;
  const m = url.match(/drive\.google\.com\/file\/d\/([\w-]+)/i)        // /file/d/ID/view…
        || url.match(/[?&]id=([\w-]+)/)                                 // ?id=ID (uc?export=…&id=…, open?id=…)
        || url.match(/\/d\/([\w-]+)/i);                                 // docs.google.com/…/d/ID/…
  const id = m && m[1];
  return id && id.length > 15 ? id : null;
}
const drivePreviewUrl = id => `https://drive.google.com/file/d/${id}/preview`;
const isDriveMode = () => els.playerArea.classList.contains('drive-mode');

function exitDriveMode() {
  if (!isDriveMode()) return;
  els.playerArea.classList.remove('drive-mode');
  els.driveFrame.src = 'about:blank'; // detiene la reproducción del iframe
}

/* ═══════════ Papelera / Deshacer (sesión) ═══════════
   Guarda los capítulos eliminados de esta sesión para recuperarlos. */
const trash = []; // { seriesId, index, ep }
function syncUndoBtn() { els.undoBtn.classList.toggle('hidden', trash.length === 0); }

/* ═══════════ Helpers ═══════════ */
const grad = s => { const [a, b] = GRADS[s.g % GRADS.length]; return `linear-gradient(135deg,${a},${b})`; };
const getSeries = id => state.series.find(s => s.id === id);
const getEp = epN => { const s = getSeries(current.seriesId); return s && s.episodes.find(e => e.n === epN); };

function fmt(sec) {
  if (!isFinite(sec)) return '00:00';
  sec = Math.max(0, Math.floor(sec));
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  const p = n => String(n).padStart(2, '0');
  return h ? `${h}:${p(m)}:${p(s)}` : `${p(m)}:${p(s)}`;
}

let toastTimer;
function toast(msg, err = false) {
  els.toast.textContent = msg;
  els.toast.classList.toggle('err', err);
  els.toast.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => els.toast.classList.add('hidden'), 2400);
}

/* ═══════════ Render: lista de series ═══════════ */
function renderSeries(filter = '') {
  const q = filter.trim().toLowerCase();
  els.seriesList.innerHTML = '';
  const visible = state.series.filter(s => !q || s.t.toLowerCase().includes(q));
  els.seriesCount.textContent = state.series.length;

  if (!visible.length) {
    els.seriesList.innerHTML = `<div class="episodes-hint" style="margin:10px">Sin resultados para «${filter}»</div>`;
    return;
  }
  for (const s of visible) {
    const linked = s.episodes.filter(e => e.url).length;
    const btn = document.createElement('button');
    btn.className = 's-item' + (s.id === current.seriesId ? ' active' : '');
    btn.innerHTML = `
      <span class="s-cover" style="background:${grad(s)}">${s.jp || s.t.slice(0, 2).toUpperCase()}</span>
      <span class="s-meta">
        <span class="s-title">${s.t}</span>
        <span class="s-sub">${s.episodes.length} eps · ${linked ? `<span class="s-linked">${linked} con enlace</span>` : 'sin enlaces'}</span>
      </span>`;
    btn.addEventListener('click', () => selectSeries(s.id));
    els.seriesList.appendChild(btn);
  }
}

/* ═══════════ Render: episodios ═══════════ */
function renderEpisodes() {
  const s = getSeries(current.seriesId);
  els.episodesGrid.innerHTML = '';
  if (!s) {
    els.episodesTitle.textContent = 'Capítulos';
    els.episodesGrid.innerHTML = '<div class="episodes-hint">← Selecciona una serie para ver sus capítulos</div>';
    els.delSeriesBtn.classList.add('hidden');
    return;
  }
  els.episodesTitle.textContent = `${s.t} — ${s.episodes.length} capítulos`;
  els.delSeriesBtn.classList.remove('hidden');

  for (const ep of s.episodes) {
    const cell = document.createElement('div');
    cell.className = 'ep' + (ep.url ? ' has-url' : '') + (current.ep === ep.n ? ' playing' : '');
    cell.innerHTML = `<span class="num">${ep.n}</span><span class="lbl">${ep.t}</span>`;

    if (editing) {
      cell.style.cursor = 'default';
      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'ep-url' + (ep.url ? ' has' : '');
      input.placeholder = 'URL directa (.mp4/.webm) o enlace de Google Drive…';
      input.value = ep.url;
      input.addEventListener('change', () => {
        ep.url = input.value.trim();
        save();
        input.classList.toggle('has', !!ep.url);
        toast(ep.url ? `✔ Enlace guardado — ${s.t} ep ${ep.n}` : 'Enlace eliminado');
        renderSeries(els.searchInput.value);
        if (current.ep === ep.n) loadEpisode(ep.n, false);
      });
      const del = document.createElement('button');
      del.className = 'ep-del';
      del.textContent = '×';
      del.title = 'Eliminar capítulo';
      del.addEventListener('click', ev => {
        ev.stopPropagation();
        if (s.episodes.length <= 1) return toast('La serie necesita al menos 1 capítulo', true);
        const idx = s.episodes.indexOf(ep);
        trash.push({ seriesId: s.id, index: idx, ep: { n: ep.n, t: ep.t, url: ep.url } });
        syncUndoBtn();
        s.episodes.splice(idx, 1);
        s.episodes.forEach((e, i) => e.n = i + 1);
        if (current.ep === ep.n) current.ep = null;
        save(); renderEpisodes(); renderSeries(els.searchInput.value);
        toast('Capítulo eliminado — pulsa «↩ Deshacer» para recuperarlo');
      });
      cell.append(input, del);
    } else {
      cell.addEventListener('click', () => loadEpisode(ep.n, true));
      /* botón compartir por capítulo */
      const sh = document.createElement('span');
      sh.className = 'ep-share';
      sh.title = 'Compartir este capítulo';
      sh.innerHTML = '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v14"/></svg>';
      sh.addEventListener('click', ev => { ev.stopPropagation(); openShare(s.id, ep.n); });
      cell.appendChild(sh);
    }
    els.episodesGrid.appendChild(cell);
  }
}

/* ═══════════ Selección de serie ═══════════ */
function selectSeries(id) {
  current.seriesId = id;
  const s = getSeries(id);
  els.stageTitle.textContent = s.t;
  els.stageSub.textContent = s.tag + ' · ' + s.jp;
  els.stageBadges.innerHTML = s.episodes.map(() => '').join('')
    + `<span class="badge">${s.episodes.length} episodios</span>`
    + `<span class="badge acid">${s.episodes.filter(e => e.url).length} con enlace</span>`;
  renderSeries(els.searchInput.value);
  renderEpisodes();
  // auto-reproduce el primer episodio con enlace (o el 1)
  const first = s.episodes.find(e => e.url) || s.episodes[0];
  if (first) loadEpisode(first.n, true);
  document.querySelector('.stage').scrollTo({ top: 0, behavior: 'smooth' });
}

/* ═══════════ Carga instantánea de un capítulo ═══════════ */
function loadEpisode(epN, autoplayNow = true) {
  const s = getSeries(current.seriesId);
  if (!s) return;
  const ep = s.episodes.find(e => e.n === epN);
  if (!ep) return;
  current.ep = epN;

  els.empty.classList.add('hidden');
  els.nowPlaying.textContent = `${s.t} · E${ep.n}`;
  document.title = `E${ep.n} · ${s.t} — X·STREAM`;
  els.shareBtn.classList.remove('hidden');
  syncAddressBar();

  if (!ep.url) {
    exitDriveMode();
    els.video.removeAttribute('src');
    els.video.load();
    els.noUrl.classList.remove('hidden');
    els.bigPlay.classList.add('hidden');
    renderEpisodes();
    return;
  }
  els.noUrl.classList.add('hidden');

  /* ── Enlace de Google Drive → reproductor embebido (iframe) ── */
  const driveId = parseDriveId(ep.url);
  if (driveId) {
    const v = els.video;
    v.pause();
    v.removeAttribute('src');
    v.load();
    els.spinner.classList.add('hidden');
    els.playerArea.classList.add('drive-mode');
    const src = drivePreviewUrl(driveId);
    if (!els.driveFrame.src.startsWith(src)) els.driveFrame.src = src;
    els.nowPlaying.textContent += ' · DRIVE';
    renderEpisodes();
    return;
  }
  exitDriveMode();

  const v = els.video;
  if (!v.src.endsWith(ep.url)) {
    v.src = ep.url;
    v.load(); // carga inmediata
  }
  if (autoplayNow) {
    v.play().catch(() => toast('Pulsa play para iniciar (autoplay bloqueado)'));
  }
  renderEpisodes();
}

/* ═══════════ Player: UI de controles ═══════════ */
const ICON_PLAY = '<path d="M7 4.5v15l13-7.5z"/>';
const ICON_PAUSE = '<path d="M6 4h4v16H6zm8 0h4v16h-4z"/>';

function setPlayIcon() {
  const paused = els.video.paused || els.video.ended;
  els.playIcon.innerHTML = paused ? ICON_PLAY : ICON_PAUSE;
  els.playerArea.classList.toggle('paused', paused);
  // big-play visible solo si hay fuente cargada, pausada y sin overlays
  const overlayVisible = !els.empty.classList.contains('hidden') || !els.noUrl.classList.contains('hidden');
  const showBigPlay = paused && !!els.video.src && !overlayVisible;
  els.bigPlay.classList.toggle('hidden', !showBigPlay);
}

function togglePlay() {
  if (isDriveMode()) return; // en modo Drive el video se controla dentro del iframe
  if (!els.video.src) return toast('Elige un capítulo con enlace', true);
  els.video.paused ? els.video.play() : els.video.pause();
}

els.video.addEventListener('play', setPlayIcon);
els.video.addEventListener('pause', setPlayIcon);
els.video.addEventListener('ended', () => {
  setPlayIcon();
  if (state.autoplay && !isDriveMode()) {
    const s = getSeries(current.seriesId);
    const next = s && s.episodes.find(e => e.n === current.ep + 1);
    if (next && next.url) { toast(`▶ Siguiente: E${next.n}`); loadEpisode(next.n, true); }
  }
});
els.video.addEventListener('waiting', () => els.spinner.classList.remove('hidden'));
els.video.addEventListener('canplay', () => els.spinner.classList.add('hidden'));
els.video.addEventListener('playing', () => els.spinner.classList.add('hidden'));
els.video.addEventListener('error', () => {
  els.spinner.classList.add('hidden');
  if (els.video.src) toast('⚠ El enlace no se pudo cargar. Verifica que sea una URL directa.', true);
});

els.video.addEventListener('timeupdate', updateSeek);
els.video.addEventListener('loadedmetadata', () => { els.tDur.textContent = fmt(els.video.duration); updateSeek(); });
function updateSeek() {
  const v = els.video, d = v.duration;
  if (!isFinite(d) || !d) return;
  const p = (v.currentTime / d) * 100;
  els.seekFill.style.width = p + '%';
  els.seekThumb.style.left = p + '%';
  els.tCur.textContent = fmt(v.currentTime);
  try {
    if (v.buffered.length) {
      els.seekBuffer.style.width = (v.buffered.end(v.buffered.length - 1) / d) * 100 + '%';
    }
  } catch (e) {}
}

/* seek: click + drag */
let dragging = false;
function seekFromEvent(ev) {
  const rect = els.seekWrap.getBoundingClientRect();
  const x = Math.min(Math.max((ev.clientX - rect.left) / rect.width, 0), 1);
  const v = els.video;
  if (isFinite(v.duration)) v.currentTime = x * v.duration;
  if (!dragging) updateSeek();
}
els.seekWrap.addEventListener('pointerdown', ev => { dragging = true; els.seekWrap.classList.add('dragging'); els.seekWrap.setPointerCapture(ev.pointerId); seekFromEvent(ev); });
els.seekWrap.addEventListener('pointermove', ev => { if (dragging) seekFromEvent(ev); });
els.seekWrap.addEventListener('pointerup', () => { dragging = false; els.seekWrap.classList.remove('dragging'); });

els.playBtn.addEventListener('click', togglePlay);
els.bigPlay.addEventListener('click', togglePlay);
els.video.addEventListener('click', togglePlay);

/* prev/next */
els.prevEp.addEventListener('click', () => { if (current.ep > 1) loadEpisode(current.ep - 1, true); });
els.nextEp.addEventListener('click', () => {
  const s = getSeries(current.seriesId);
  if (s && current.ep < s.episodes.length) loadEpisode(current.ep + 1, true);
});

/* volumen */
els.volume.addEventListener('input', () => {
  els.video.volume = +els.volume.value;
  els.video.muted = +els.volume.value === 0;
  updateVolIcon();
});
els.muteBtn.addEventListener('click', () => { els.video.muted = !els.video.muted; updateVolIcon(); });
els.video.addEventListener('volumechange', updateVolIcon);
function updateVolIcon() {
  const v = els.video;
  document.getElementById('volIcon').innerHTML = (v.muted || v.volume === 0)
    ? '<path d="M3 9v6h4l5 5V4L7 9H3zm13.6 3 2.7-2.7 1.4 1.4-2.7 2.7 2.7 2.7-1.4 1.4-2.7-2.7-2.7 2.7-1.4-1.4 2.7-2.7-2.7-2.7 1.4-1.4z"/>'
    : '<path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4zM14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6z"/>';
}

/* velocidad */
els.speed.addEventListener('change', () => { els.video.playbackRate = +els.speed.value; toast(`Velocidad ${els.speed.value}×`); });

/* autoplay toggle */
function syncAutoplayBtn() { els.autoplayBtn.classList.toggle('on', state.autoplay); }
els.autoplayBtn.addEventListener('click', () => {
  state.autoplay = !state.autoplay; save(); syncAutoplayBtn();
  toast('Autoplay ' + (state.autoplay ? 'activado' : 'desactivado'));
});

/* PiP */
els.pipBtn.addEventListener('click', async () => {
  try {
    if (document.pictureInPictureElement) await document.exitPictureInPicture();
    else if (els.video.src) await els.video.requestPictureInPicture();
  } catch (e) { toast('PiP no disponible', true); }
});

/* fullscreen */
els.fsBtn.addEventListener('click', toggleFullscreen);
function toggleFullscreen() {
  if (document.fullscreenElement) document.exitFullscreen();
  else els.playerArea.requestFullscreen?.();
}
document.addEventListener('fullscreenchange', () => {
  els.playerArea.classList.toggle('fullscreen', !!document.fullscreenElement);
});

/* doble click / tap zonal: rewind-forward + fullscreen */
els.playerArea.addEventListener('dblclick', ev => {
  if (ev.target.closest('.controls') || ev.target.closest('.big-play')) return;
  const rect = els.playerArea.getBoundingClientRect();
  const x = (ev.clientX - rect.left) / rect.width;
  if (x < 0.35) { els.video.currentTime = Math.max(0, els.video.currentTime - 10); popGesture(els.gestL); }
  else if (x > 0.65) { els.video.currentTime = Math.min(els.video.duration || 0, els.video.currentTime + 10); popGesture(els.gestR); }
  else toggleFullscreen();
});
function popGesture(el) { el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); }

/* ocultar controles con tiempo en fullscreen */
let hideTimer;
els.playerArea.addEventListener('mousemove', () => {
  els.playerArea.classList.add('show-ui');
  clearTimeout(hideTimer);
  hideTimer = setTimeout(() => els.playerArea.classList.remove('show-ui'), 2600);
});

/* ═══════════ Teclado ═══════════ */
document.addEventListener('keydown', ev => {
  const tag = document.activeElement.tagName;
  if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') {
    if (ev.key === 'Escape') document.activeElement.blur();
    return;
  }
  const v = els.video;
  switch (ev.key.toLowerCase()) {
    case ' ': case 'k': ev.preventDefault(); togglePlay(); break;
    case 'arrowright': case 'l': v.currentTime += 10; popGesture(els.gestR); break;
    case 'arrowleft': case 'j': v.currentTime -= 10; popGesture(els.gestL); break;
    case 'arrowup': ev.preventDefault(); v.volume = Math.min(1, v.volume + 0.1); els.volume.value = v.volume; break;
    case 'arrowdown': ev.preventDefault(); v.volume = Math.max(0, v.volume - 0.1); els.volume.value = v.volume; break;
    case 'f': toggleFullscreen(); break;
    case 'm': v.muted = !v.muted; break;
    case 'n': els.nextEp.click(); break;
    case 'p': els.prevEp.click(); break;
    case '/': ev.preventDefault(); els.searchInput.focus(); break;
  }
});

/* ═══════════ Búsqueda ═══════════ */
els.searchInput.addEventListener('input', () => renderSeries(els.searchInput.value));

/* ═══════════ Compartir capítulos ═══════════
   Cada capítulo tiene un enlace único: index.html#s=<serie>&e=<n>
   El enlace incrusta el título y la URL del video, de modo que abre
   el capítulo exacto aunque la otra persona nunca haya usado la app. */

function buildShareUrl(s, ep) {
  const base = location.href.split('#')[0];
  const p = new URLSearchParams({ s: s.id, e: String(ep.n), t: s.t });
  if (ep.url) p.set('u', ep.url);
  return `${base}#${p.toString()}`;
}

/* redes sociales destino */
const SHARE_NETS = [
  { id: 'whatsapp', name: 'WhatsApp', c: '#25D366',
    url: (txt, u) => `https://wa.me/?text=${encodeURIComponent(txt + '\n' + u)}` },
  { id: 'telegram', name: 'Telegram', c: '#229ED9',
    url: (txt, u) => `https://t.me/share/url?url=${encodeURIComponent(u)}&text=${encodeURIComponent(txt)}` },
  { id: 'facebook', name: 'Facebook', c: '#1877F2',
    url: (txt, u) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(u)}` },
  { id: 'x',        name: 'X / Twitter', c: '#111111',
    url: (txt, u) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(txt + '\n' + u)}` },
  { id: 'email',    name: 'Email', c: '#7c3aed',
    url: (txt, u) => `mailto:?subject=${encodeURIComponent(txt)}&body=${encodeURIComponent(u)}` },
];

let shareCtx = null; // { s, ep, url, msg }

function openShare(seriesId, epN) {
  const s = getSeries(seriesId);
  const ep = s && s.episodes.find(e => e.n === epN);
  if (!s || !ep) return;
  const url = buildShareUrl(s, ep);
  shareCtx = { s, ep, url, msg: `▶ ${s.t} — Capítulo ${ep.n} · míralo en X·STREAM` };

  els.shareTitle.textContent = `${s.t} · Capítulo ${ep.n}`;
  els.shareUrl.value = url;

  /* botones de redes */
  els.shareGrid.innerHTML = '';
  for (const net of SHARE_NETS) {
    const b = document.createElement('button');
    b.className = 'share-net';
    b.style.background = net.c;
    b.textContent = net.name;
    b.addEventListener('click', () => {
      window.open(net.url(shareCtx.msg, shareCtx.url), '_blank', 'noopener,width=640,height=520');
    });
    els.shareGrid.appendChild(b);
  }
  /* botón "más apps" con Web Share API (abre el menú nativo del teléfono) */
  const more = document.createElement('button');
  more.className = 'share-net';
  more.style.background = 'var(--panel2)';
  more.style.color = 'var(--ink)';
  more.style.border = '1px solid var(--line)';
  more.textContent = navigator.share ? '＋ Más apps' : '＋ Copiar';
  more.addEventListener('click', async () => {
    if (navigator.share) {
      try { await navigator.share({ title: shareCtx.msg, text: shareCtx.msg, url: shareCtx.url }); }
      catch (e) { /* cancelado */ }
    } else {
      copyShareLink();
    }
  });
  els.shareGrid.appendChild(more);

  els.modalShare.classList.remove('hidden');
}

function copyShareLink() {
  if (!shareCtx) return;
  navigator.clipboard.writeText(shareCtx.url)
    .then(() => toast('🔗 Enlace copiado — pégalo donde quieras'))
    .catch(() => { els.shareUrl.select(); document.execCommand('copy'); toast('🔗 Enlace copiado'); });
}

els.copyShareUrl.addEventListener('click', copyShareLink);
els.closeShare.addEventListener('click', () => els.modalShare.classList.add('hidden'));
els.modalShare.addEventListener('click', ev => { if (ev.target === els.modalShare) els.modalShare.classList.add('hidden'); });
els.shareBtn.addEventListener('click', () => {
  if (current.seriesId && current.ep) openShare(current.seriesId, current.ep);
});

/* ── Abrir un capítulo desde un enlace compartido ── */
function openFromHash() {
  const h = location.hash.replace(/^#/, '');
  if (!h) return false;
  const p = new URLSearchParams(h);
  const sid = p.get('s'), epN = parseInt(p.get('e'), 10);
  if (!sid || !epN) return false;

  let s = getSeries(sid);
  if (!s) {
    /* serie no existe localmente → se crea al vuelo con el capítulo compartido */
    s = {
      id: sid,
      t: p.get('t') || 'Serie compartida',
      jp: '▶', tag: 'Compartida contigo', g: 5,
      episodes: [{ n: epN, t: `Capítulo ${epN}`, url: p.get('u') || '' }],
    };
    state.series.push(s);
    save();
  }
  selectSeries(sid);
  loadEpisode(epN, true);
  renderSeries(els.searchInput.value);
  toast('▶ Capítulo compartido cargado');
  return true;
}
window.addEventListener('hashchange', openFromHash);

/* mantiene la URL del navegador siempre compartible */
function syncAddressBar() {
  const s = getSeries(current.seriesId);
  const ep = s && s.episodes.find(e => e.n === current.ep);
  if (!s || !ep) return;
  try { history.replaceState(null, '', buildShareUrl(s, ep)); } catch (e) { /* file:// antiguo */ }
}

/* ═══════════ Tema claro / oscuro ═══════════ */
const ICON_MOON = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';
const ICON_SUN  = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';

function applyTheme(theme) {
  const light = theme === 'light';
  document.body.classList.toggle('light', light);
  els.themeBtn.innerHTML = light ? ICON_MOON : ICON_SUN;
  els.themeBtn.title = light ? 'Cambiar a tema oscuro' : 'Cambiar a tema claro';
}
els.themeBtn.addEventListener('click', () => {
  state.theme = state.theme === 'light' ? 'dark' : 'light';
  save();
  applyTheme(state.theme);
  toast(state.theme === 'light' ? '☀ Tema claro' : '🌙 Tema oscuro');
});

/* ═══════════ Modo edición ═══════════ */
function setEditing(on) {
  editing = on;
  document.body.classList.toggle('editing', on);
  els.editModeBtn.classList.toggle('active', on);
  els.editModeBtn.querySelector('span').textContent = on ? 'Salir de edición' : 'Editar enlaces';
  renderEpisodes();
}
els.editModeBtn.addEventListener('click', () => setEditing(!editing));
els.goEditBtn.addEventListener('click', () => {
  setEditing(true);
  els.episodesPanel.scrollIntoView({ behavior: 'smooth' });
});

/* ═══════════ Añadir / eliminar ═══════════ */
els.addEpBtn.addEventListener('click', () => {
  const s = getSeries(current.seriesId);
  if (!s) return toast('Primero selecciona una serie', true);
  const n = s.episodes.length + 1;
  s.episodes.push({ n, t: `Capítulo ${n}`, url: '' });
  save(); renderEpisodes(); renderSeries(els.searchInput.value);
  toast(`+ Capítulo ${n} añadido a ${s.t}`);
});

/* ── Deshacer: recupera el último capítulo borrado (con su enlace) ── */
els.undoBtn.addEventListener('click', () => {
  const item = trash.pop();
  if (!item) { syncUndoBtn(); return; }
  const s = getSeries(item.seriesId);
  if (!s) { toast('Esa serie ya no existe', true); syncUndoBtn(); return; }
  const idx = Math.min(item.index, s.episodes.length);
  s.episodes.splice(idx, 0, { n: idx + 1, t: item.ep.t, url: item.ep.url });
  s.episodes.forEach((e, i) => e.n = i + 1);
  save(); renderEpisodes(); renderSeries(els.searchInput.value);
  syncUndoBtn();
  toast(`↩ Capítulo ${item.ep.n} recuperado en ${s.t}`);
});

/* ── Insertar capítulo en una posición concreta ── */
els.insertEpBtn.addEventListener('click', () => {
  const s = getSeries(current.seriesId);
  if (!s) return toast('Primero selecciona una serie', true);
  const total = s.episodes.length;
  const resp = prompt(
    `¿En qué posición insertar el nuevo capítulo de «${s.t}»?\n(1 = al principio · ${total + 1} = al final)\nLos demás se reenumeran y conservan sus enlaces.`,
    String(current.ep || 1)
  );
  if (resp === null) return;
  const pos = Math.max(1, Math.min(total + 1, parseInt(resp, 10) || 1));
  s.episodes.splice(pos - 1, 0, { n: pos, t: `Capítulo ${pos}`, url: '' });
  s.episodes.forEach((e, i) => e.n = i + 1);
  save(); renderEpisodes(); renderSeries(els.searchInput.value);
  setEditing(true); // listo para pegar el enlace del nuevo capítulo
  toast(`⇂ Capítulo insertado en la posición ${pos}`);
});

els.delSeriesBtn.addEventListener('click', () => {
  const s = getSeries(current.seriesId);
  if (!s) return;
  if (!confirm(`¿Eliminar «${s.t}» y sus ${s.episodes.length} capítulos?`)) return;
  state.series.splice(state.series.indexOf(s), 1);
  current.seriesId = null; current.ep = null;
  save();
  els.shareBtn.classList.add('hidden');
  els.video.removeAttribute('src'); els.video.load();
  els.empty.classList.remove('hidden');
  els.noUrl.classList.add('hidden');
  els.stageTitle.textContent = 'X·STREAM Anime';
  els.stageSub.textContent = 'Tu reproductor instantáneo de enlaces directos';
  els.stageBadges.innerHTML = '';
  els.nowPlaying.textContent = '';
  renderSeries(els.searchInput.value);
  renderEpisodes();
  toast('Serie eliminada');
});

/* ═══════════ Modal nueva serie ═══════════ */
let pickedGrad = 0;
function renderGradPicker() {
  els.gradPicker.innerHTML = '';
  GRADS.forEach((g, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'grad-swatch' + (i === pickedGrad ? ' sel' : '');
    b.style.background = `linear-gradient(135deg,${g[0]},${g[1]})`;
    b.addEventListener('click', () => { pickedGrad = i; renderGradPicker(); });
    els.gradPicker.appendChild(b);
  });
}
els.addSeriesBtn.addEventListener('click', () => {
  els.modalAdd.classList.remove('hidden');
  els.newTitle.value = ''; els.newJp.value = ''; els.newEps.value = 12;
  pickedGrad = Math.floor(Math.random() * GRADS.length);
  renderGradPicker();
  setTimeout(() => els.newTitle.focus(), 60);
});
els.cancelAdd.addEventListener('click', () => els.modalAdd.classList.add('hidden'));
els.modalAdd.addEventListener('click', ev => { if (ev.target === els.modalAdd) els.modalAdd.classList.add('hidden'); });

els.confirmAdd.addEventListener('click', () => {
  const title = els.newTitle.value.trim();
  const count = Math.max(1, Math.min(1200, parseInt(els.newEps.value, 10) || 12));
  if (!title) return toast('Ponle un nombre a la serie', true);
  const id = 'custom-' + Date.now();
  const episodes = [];
  for (let n = 1; n <= count; n++) episodes.push({ n, t: `Capítulo ${n}`, url: '' });
  state.series.push({
    id, t: title, jp: els.newJp.value.trim() || title.slice(0, 2).toUpperCase(),
    tag: 'Personalizada', g: pickedGrad, episodes,
  });
  save();
  els.modalAdd.classList.add('hidden');
  renderSeries(els.searchInput.value);
  selectSeries(id);
  toast(`⚡ «${title}» creada con ${count} capítulos`);
  setEditing(true); // pega los enlaces de una vez
});
els.newTitle.addEventListener('keydown', ev => { if (ev.key === 'Enter') els.confirmAdd.click(); });

/* ═══════════ Init ═══════════ */
load();
applyTheme(state.theme || 'dark');
syncAutoplayBtn();
renderSeries();
renderEpisodes();
setPlayIcon();
syncUndoBtn();
/* si la URL trae un capítulo compartido (#s=…&e=…), lo abre directo */
if (openFromHash()) {
  document.querySelector('.stage').scrollTo({ top: 0 });
}

/* registro global por si se quiere depurar */
window.XSTREAM = { state, save };
