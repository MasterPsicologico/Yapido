/**
 * AnimeStream - Custom Video Player
 * Soporta: MP4, WebM, M3U8 (HLS), MKV (via transmuxing)
 * Controles personalizados, keyboard shortcuts, PiP, fullscreen
 */

import Hls from 'https://cdn.jsdelivr.net/npm/hls.js@latest/+esm';

export class VideoPlayer {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.video = this.container.querySelector('.video-element');
    this.options = {
      autoPlay: true,
      preload: 'metadata',
      defaultVolume: 0.8,
      skipIntros: false,
      intros: {},
      ...options
    };
    
    this.state = {
      isPlaying: false,
      isMuted: false,
      volume: this.options.defaultVolume,
      currentTime: 0,
      duration: 0,
      buffered: 0,
      isFullscreen: false,
      isPiP: false,
      quality: 'auto',
      playbackRate: 1,
      currentSrc: null,
      hls: null
    };
    
    this.elements = {};
    this.listeners = new Map();
    this.previewThumbnails = null;
    this.thumbnailsTrack = null;
    
    this.init();
  }
  
  init() {
    this.cacheElements();
    this.bindEvents();
    this.setupVideo();
    this.loadSettings();
  }
  
  cacheElements() {
    this.elements = {
      playPauseBtn: this.container.querySelector('#playPauseBtn'),
      rewindBtn: this.container.querySelector('#rewindBtn'),
      forwardBtn: this.container.querySelector('#forwardBtn'),
      skipPrevBtn: this.container.querySelector('#skipPrevBtn'),
      skipNextBtn: this.container.querySelector('#skipNextBtn'),
      muteBtn: this.container.querySelector('#muteBtn'),
      volumeSlider: this.container.querySelector('#volumeSlider'),
      pipBtn: this.container.querySelector('#pipBtn'),
      fullscreenBtn: this.container.querySelector('#fullscreenBtn'),
      progressBar: this.container.querySelector('#progressBar'),
      progressTrack: this.container.querySelector('.progress-track'),
      progressFill: this.container.querySelector('#progressFill'),
      progressBuffered: this.container.querySelector('#progressBuffered'),
      progressHandle: this.container.querySelector('#progressHandle'),
      previewTooltip: this.container.querySelector('#previewTooltip'),
      previewImage: this.container.querySelector('.preview-image'),
      previewTime: this.container.querySelector('.preview-time'),
      currentTime: this.container.querySelector('#currentTime'),
      duration: this.container.querySelector('#duration'),
      loadingOverlay: this.container.querySelector('#loadingOverlay'),
      loadingText: this.container.querySelector('#loadingText'),
      errorOverlay: this.container.querySelector('#errorOverlay'),
      errorMessage: this.container.querySelector('#errorMessage'),
      retryBtn: this.container.querySelector('#retryBtn'),
      episodeTitle: this.container.querySelector('#episodeTitle')
    };
  }
  
  bindEvents() {
    // Video events
    this.video.addEventListener('loadstart', () => this.onLoadStart());
    this.video.addEventListener('loadedmetadata', () => this.onLoadedMetadata());
    this.video.addEventListener('loadeddata', () => this.onLoadedData());
    this.video.addEventListener('canplay', () => this.onCanPlay());
    this.video.addEventListener('play', () => this.onPlay());
    this.video.addEventListener('pause', () => this.onPause());
    this.video.addEventListener('timeupdate', () => this.onTimeUpdate());
    this.video.addEventListener('progress', () => this.onProgress());
    this.video.addEventListener('ended', () => this.onEnded());
    this.video.addEventListener('error', (e) => this.onError(e));
    this.video.addEventListener('waiting', () => this.onWaiting());
    this.video.addEventListener('playing', () => this.onPlaying());
    this.video.addEventListener('volumechange', () => this.onVolumeChange());
    this.video.addEventListener('ratechange', () => this.onRateChange());
    this.video.addEventListener('fullscreenchange', () => this.onFullscreenChange());
    this.video.addEventListener('enterpictureinpicture', () => this.onEnterPiP());
    this.video.addEventListener('leavepictureinpicture', () => this.onLeavePiP());
    
    // Control events
    this.elements.playPauseBtn.addEventListener('click', () => this.togglePlay());
    this.elements.rewindBtn.addEventListener('click', () => this.seekRelative(-10));
    this.elements.forwardBtn.addEventListener('click', () => this.seekRelative(10));
    this.elements.skipPrevBtn.addEventListener('click', () => this.emit('prevEpisode'));
    this.elements.skipNextBtn.addEventListener('click', () => this.emit('nextEpisode'));
    this.elements.muteBtn.addEventListener('click', () => this.toggleMute());
    this.elements.volumeSlider.addEventListener('input', (e) => this.setVolume(e.target.value));
    this.elements.pipBtn.addEventListener('click', () => this.togglePiP());
    this.elements.fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
    this.elements.retryBtn.addEventListener('click', () => this.retry());
    
    // Progress bar events
    this.setupProgressBar();
    
    // Keyboard shortcuts
    this.bindKeyboardShortcuts();
    
    // Touch/mobile support
    this.setupTouchControls();
  }
  
  setupProgressBar() {
    let isDragging = false;
    let wasPlaying = false;
    
    const updateProgress = (clientX) => {
      const rect = this.elements.progressTrack.getBoundingClientRect();
      const percentage = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      this.seek(percentage * this.state.duration);
      this.updateProgressUI(percentage);
    };
    
    const onMouseDown = (e) => {
      isDragging = true;
      wasPlaying = !this.video.paused;
      this.video.pause();
      this.elements.progressTrack.classList.add('dragging');
      updateProgress(e.clientX);
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    };
    
    const onMouseMove = (e) => {
      if (!isDragging) return;
      updateProgress(e.clientX);
      
      // Show preview tooltip
      const rect = this.elements.progressTrack.getBoundingClientRect();
      const percentage = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      this.showPreviewTooltip(e.clientX, percentage);
    };
    
    const onMouseUp = () => {
      isDragging = false;
      this.elements.progressTrack.classList.remove('dragging');
      this.hidePreviewTooltip();
      if (wasPlaying) this.video.play();
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    
    // Hover preview
    this.elements.progressTrack.addEventListener('mousemove', (e) => {
      if (isDragging) return;
      const rect = this.elements.progressTrack.getBoundingClientRect();
      const percentage = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      this.showPreviewTooltip(e.clientX, percentage);
    });
    
    this.elements.progressTrack.addEventListener('mouseleave', () => {
      if (!isDragging) this.hidePreviewTooltip();
    });
    
    this.elements.progressTrack.addEventListener('click', (e) => {
      if (isDragging) return;
      updateProgress(e.clientX);
    });
    
    this.elements.progressTrack.addEventListener('mousedown', onMouseDown);
    
    // Touch events
    this.elements.progressTrack.addEventListener('touchstart', (e) => {
      isDragging = true;
      wasPlaying = !this.video.paused;
      this.video.pause();
      const touch = e.touches[0];
      updateProgress(touch.clientX);
    }, { passive: true });
    
    this.elements.progressTrack.addEventListener('touchmove', (e) => {
      if (!isDragging) return;
      const touch = e.touches[0];
      updateProgress(touch.clientX);
    }, { passive: true });
    
    this.elements.progressTrack.addEventListener('touchend', () => {
      isDragging = false;
      this.hidePreviewTooltip();
      if (wasPlaying) this.video.play();
    });
  }
  
  showPreviewTooltip(clientX, percentage) {
    if (!this.previewThumbnails) {
      // Show time only
      const time = percentage * this.state.duration;
      this.elements.previewTime.textContent = this.formatTime(time);
      this.elements.previewImage.style.display = 'none';
    } else {
      // Show thumbnail if available
      const thumb = this.getThumbnailAtTime(percentage * this.state.duration);
      if (thumb) {
        this.elements.previewImage.src = thumb.url;
        this.elements.previewImage.style.display = 'block';
      } else {
        this.elements.previewImage.style.display = 'none';
      }
      this.elements.previewTime.textContent = this.formatTime(percentage * this.state.duration);
    }
    
    const rect = this.elements.progressTrack.getBoundingClientRect();
    const containerRect = this.container.getBoundingClientRect();
    const left = clientX - containerRect.left;
    
    this.elements.previewTooltip.style.left = `${left}px`;
    this.elements.previewTooltip.classList.remove('hidden');
  }
  
  hidePreviewTooltip() {
    this.elements.previewTooltip.classList.add('hidden');
  }
  
  getThumbnailAtTime(time) {
    if (!this.previewThumbnails) return null;
    return this.previewThumbnails.find(t => t.startTime <= time && t.endTime > time) || null;
  }
  
  setThumbnails(thumbnails) {
    this.previewThumbnails = thumbnails;
  }
  
  setupVideo() {
    this.video.volume = this.state.volume;
    this.video.preload = this.options.preload;
    this.video.playsInline = true;
    this.video.crossOrigin = 'anonymous';
  }
  
  setupTouchControls() {
    let tapTimeout;
    let lastTap = 0;
    
    this.video.addEventListener('touchstart', (e) => {
      const now = Date.now();
      if (now - lastTap < 300) {
        // Double tap - toggle fullscreen
        this.toggleFullscreen();
        clearTimeout(tapTimeout);
      } else {
        tapTimeout = setTimeout(() => {
          this.togglePlay();
        }, 300);
      }
      lastTap = now;
    });
    
    // Swipe for seek
    let touchStartX = 0;
    let touchStartTime = 0;
    
    this.video.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartTime = Date.now();
    }, { passive: true });
    
    this.video.addEventListener('touchend', (e) => {
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndTime = Date.now();
      const deltaX = touchEndX - touchStartX;
      const deltaTime = touchEndTime - touchStartTime;
      
      if (deltaTime < 300 && Math.abs(deltaX) > 50) {
        // Swipe detected
        if (deltaX > 0) {
          this.seekRelative(10);
        } else {
          this.seekRelative(-10);
        }
      }
    }, { passive: true });
  }
  
  bindKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Ignore if typing in input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
        return;
      }
      
      switch (e.code) {
        case 'Space':
          e.preventDefault();
          this.togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          e.shiftKey ? this.seekRelative(-60) : this.seekRelative(-10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          e.shiftKey ? this.seekRelative(60) : this.seekRelative(10);
          break;
        case 'ArrowUp':
          e.preventDefault();
          this.setVolume(Math.min(1, this.state.volume + 0.1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          this.setVolume(Math.max(0, this.state.volume - 0.1));
          break;
        case 'KeyM':
          this.toggleMute();
          break;
        case 'KeyF':
          this.toggleFullscreen();
          break;
        case 'KeyP':
          this.togglePiP();
          break;
        case 'KeyN':
          this.emit('nextEpisode');
          break;
        case 'KeyB':
          this.emit('prevEpisode');
          break;
        case 'Slash':
          if (e.shiftKey) {
            e.preventDefault();
            this.showShortcutsHelp();
          }
          break;
        case 'Escape':
          if (this.state.isFullscreen) this.exitFullscreen();
          if (this.state.isPiP) this.exitPiP();
          break;
      }
    });
  }
  
  // Video event handlers
  onLoadStart() {
    this.showLoading('Cargando video...');
    this.hideError();
  }
  
  onLoadedMetadata() {
    this.state.duration = this.video.duration;
    this.elements.duration.textContent = this.formatTime(this.state.duration);
    this.emit('metadataLoaded', { duration: this.state.duration });
  }
  
  onLoadedData() {
    this.hideLoading();
  }
  
  onCanPlay() {
    this.hideLoading();
    if (this.options.autoPlay) {
      this.video.play().catch(() => {
        // Auto-play blocked, show play button
      });
    }
  }
  
  onPlay() {
    this.state.isPlaying = true;
    this.updatePlayButton();
    this.hideLoading();
    this.emit('play');
  }
  
  onPause() {
    this.state.isPlaying = false;
    this.updatePlayButton();
    this.emit('pause');
  }
  
  onTimeUpdate() {
    this.state.currentTime = this.video.currentTime;
    this.elements.currentTime.textContent = this.formatTime(this.state.currentTime);
    
    const percentage = this.state.duration ? (this.state.currentTime / this.state.duration) : 0;
    this.updateProgressUI(percentage);
    
    // Check for intro/outro skip
    if (this.options.skipIntros && this.options.intros[this.state.currentSrc]) {
      const { intro, outro } = this.options.intros[this.state.currentSrc];
      if (intro && this.state.currentTime >= intro.start && this.state.currentTime < intro.end) {
        this.showSkipButton('intro', intro.end);
      } else if (outro && this.state.currentTime >= outro.start && this.state.currentTime < outro.end) {
        this.showSkipButton('outro', outro.end);
      } else {
        this.hideSkipButton();
      }
    }
    
    this.emit('timeUpdate', { currentTime: this.state.currentTime });
  }
  
  onProgress() {
    if (this.video.buffered.length > 0) {
      this.state.buffered = this.video.buffered.end(this.video.buffered.length - 1);
      const percentage = this.state.duration ? (this.state.buffered / this.state.duration) : 0;
      this.elements.progressBuffered.style.width = `${percentage * 100}%`;
    }
  }
  
  onEnded() {
    this.state.isPlaying = false;
    this.updatePlayButton();
    this.emit('ended');
  }
  
  onError(e) {
    this.hideLoading();
    let message = 'Error desconocido';
    
    if (this.video.error) {
      switch (this.video.error.code) {
        case MediaError.MEDIA_ERR_ABORTED:
          message = 'Carga cancelada';
          break;
        case MediaError.MEDIA_ERR_NETWORK:
          message = 'Error de red. Verifica tu conexión.';
          break;
        case MediaError.MEDIA_ERR_DECODE:
          message = 'Error de decodificación. Formato no soportado.';
          break;
        case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
          message = 'Formato de video no soportado.';
          break;
      }
    }
    
    this.showError(message);
    this.emit('error', { message, code: this.video.error?.code });
  }
  
  onWaiting() {
    this.showLoading('Buffering...');
  }
  
  onPlaying() {
    this.hideLoading();
  }
  
  onVolumeChange() {
    this.state.volume = this.video.volume;
    this.state.isMuted = this.video.muted;
    this.updateVolumeUI();
    this.saveSettings();
  }
  
  onRateChange() {
    this.state.playbackRate = this.video.playbackRate;
  }
  
  onFullscreenChange() {
    this.state.isFullscreen = !!document.fullscreenElement;
    this.updateFullscreenButton();
  }
  
  onEnterPiP() {
    this.state.isPiP = true;
    this.updatePiPButton();
  }
  
  onLeavePiP() {
    this.state.isPiP = false;
    this.updatePiPButton();
  }
  
  // Public methods
  load(src, options = {}) {
    this.stop();
    this.state.currentSrc = src;
    this.showLoading('Preparando reproductor...');
    
    // Clean up previous HLS instance
    if (this.state.hls) {
      this.state.hls.destroy();
      this.state.hls = null;
    }
    
    // Check if HLS
    if (this.isHLS(src)) {
      this.loadHLS(src, options);
    } else {
      this.loadDirect(src);
    }
    
    // Update episode title
    if (options.title) {
      this.elements.episodeTitle.textContent = options.title;
    }
    
    // Set intros/outros for skip
    if (options.intro) this.options.intros[src] = { ...this.options.intros[src], intro: options.intro };
    if (options.outro) this.options.intros[src] = { ...this.options.intros[src], outro: options.outro };
    
    this.emit('loadStart', { src, options });
  }
  
  isHLS(src) {
    return src.includes('.m3u8') || src.includes('.m3u') || src.includes('playlist');
  }
  
  loadHLS(src, options) {
    if (!Hls.isSupported()) {
      // Fallback for Safari
      this.video.src = src;
      return;
    }
    
    this.state.hls = new Hls({
      enableWorker: true,
      lowLatencyMode: true,
      ...options.hlsConfig
    });
    
    this.state.hls.loadSource(src);
    this.state.hls.attachMedia(this.video);
    
    this.state.hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
      this.emit('manifestParsed', { levels: data.levels });
      // Auto-select quality
      if (this.options.defaultQuality !== 'auto') {
        this.setQuality(this.options.defaultQuality);
      }
    });
    
    this.state.hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
      this.emit('qualityChange', { quality: data.level });
    });
    
    this.state.hls.on(Hls.Events.ERROR, (event, data) => {
      if (data.fatal) {
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            this.state.hls.startLoad();
            break;
          case Hls.ErrorTypes.MEDIA_ERROR:
            this.state.hls.recoverMediaError();
            break;
          default:
            this.showError('Error en la transmisión HLS');
            this.state.hls.destroy();
            this.state.hls = null;
        }
      }
    });
  }
  
  loadDirect(src) {
    this.video.src = src;
  }
  
  play() {
    return this.video.play();
  }
  
  pause() {
    this.video.pause();
  }
  
  togglePlay() {
    if (this.video.paused) {
      this.play();
    } else {
      this.pause();
    }
  }
  
  stop() {
    this.video.pause();
    this.video.currentTime = 0;
    if (this.state.hls) {
      this.state.hls.destroy();
      this.state.hls = null;
    }
    this.video.src = '';
    this.video.load();
    this.state.currentSrc = null;
    this.updatePlayButton();
    this.updateProgressUI(0);
    this.elements.currentTime.textContent = '0:00';
    this.elements.duration.textContent = '0:00';
  }
  
  seek(time) {
    this.video.currentTime = Math.max(0, Math.min(time, this.state.duration));
  }
  
  seekRelative(seconds) {
    this.seek(this.state.currentTime + seconds);
  }
  
  setVolume(volume) {
    this.video.volume = Math.max(0, Math.min(1, volume));
    this.state.volume = this.video.volume;
    this.updateVolumeUI();
  }
  
  toggleMute() {
    this.video.muted = !this.video.muted;
  }
  
  setPlaybackRate(rate) {
    this.video.playbackRate = rate;
  }
  
  setQuality(quality) {
    if (this.state.hls && this.state.hls.levels) {
      const level = this.state.hls.levels.findIndex(l => l.height === parseInt(quality));
      if (level >= 0) {
        this.state.hls.currentLevel = level;
      }
    }
  }
  
  async toggleFullscreen() {
    if (this.state.isFullscreen) {
      await this.exitFullscreen();
    } else {
      await this.enterFullscreen();
    }
  }
  
  async enterFullscreen() {
    try {
      if (this.container.requestFullscreen) {
        await this.container.requestFullscreen();
      } else if (this.container.webkitRequestFullscreen) {
        await this.container.webkitRequestFullscreen();
      } else if (this.container.msRequestFullscreen) {
        await this.container.msRequestFullscreen();
      }
    } catch (e) {
      console.warn('Fullscreen failed:', e);
    }
  }
  
  async exitFullscreen() {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        await document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        await document.msExitFullscreen();
      }
    } catch (e) {
      console.warn('Exit fullscreen failed:', e);
    }
  }
  
  async togglePiP() {
    if (this.state.isPiP) {
      await this.exitPiP();
    } else {
      await this.enterPiP();
    }
  }
  
  async enterPiP() {
    try {
      if (document.pictureInPictureEnabled) {
        await this.video.requestPictureInPicture();
      }
    } catch (e) {
      console.warn('PiP failed:', e);
      this.showToast('Picture-in-Picture no disponible', 'warning');
    }
  }
  
  async exitPiP() {
    try {
      await document.exitPictureInPicture();
    } catch (e) {
      console.warn('Exit PiP failed:', e);
    }
  }
  
  retry() {
    if (this.state.currentSrc) {
      this.load(this.state.currentSrc);
    }
  }
  
  // UI Updates
  updatePlayButton() {
    const playIcon = this.elements.playPauseBtn.querySelector('.play-icon');
    const pauseIcon = this.elements.playPauseBtn.querySelector('.pause-icon');
    
    if (this.state.isPlaying) {
      playIcon.classList.add('hidden');
      pauseIcon.classList.remove('hidden');
    } else {
      playIcon.classList.remove('hidden');
      pauseIcon.classList.add('hidden');
    }
  }
  
  updateProgressUI(percentage) {
    this.elements.progressFill.style.width = `${percentage * 100}%`;
    this.elements.progressHandle.style.left = `${percentage * 100}%`;
  }
  
  updateVolumeUI() {
    const volumeHigh = this.elements.muteBtn.querySelector('.volume-high');
    const volumeLow = this.elements.muteBtn.querySelector('.volume-low');
    const volumeMute = this.elements.muteBtn.querySelector('.volume-mute');
    
    volumeHigh.classList.add('hidden');
    volumeLow.classList.add('hidden');
    volumeMute.classList.add('hidden');
    
    if (this.state.isMuted || this.state.volume === 0) {
      volumeMute.classList.remove('hidden');
    } else if (this.state.volume < 0.5) {
      volumeLow.classList.remove('hidden');
    } else {
      volumeHigh.classList.remove('hidden');
    }
    
    this.elements.volumeSlider.value = this.state.volume;
  }
  
  updateFullscreenButton() {
    const enterIcon = this.elements.fullscreenBtn.querySelector('.fullscreen-enter');
    const exitIcon = this.elements.fullscreenBtn.querySelector('.fullscreen-exit');
    
    if (this.state.isFullscreen) {
      enterIcon.classList.add('hidden');
      exitIcon.classList.remove('hidden');
    } else {
      enterIcon.classList.remove('hidden');
      exitIcon.classList.add('hidden');
    }
  }
  
  updatePiPButton() {
    // Could change icon for PiP state
  }
  
  showLoading(text = 'Cargando...') {
    this.elements.loadingText.textContent = text;
    this.elements.loadingOverlay.classList.remove('hidden');
  }
  
  hideLoading() {
    this.elements.loadingOverlay.classList.add('hidden');
  }
  
  showError(message) {
    this.elements.errorMessage.textContent = message;
    this.elements.errorOverlay.classList.remove('hidden');
  }
  
  hideError() {
    this.elements.errorOverlay.classList.add('hidden');
  }
  
  showSkipButton(type, targetTime) {
    // Could show a "Saltar intro/outro" button
    this.emit('showSkip', { type, targetTime });
  }
  
  hideSkipButton() {
    this.emit('hideSkip');
  }
  
  formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hrs > 0) return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }
  
  showShortcutsHelp() {
    const help = document.getElementById('shortcutsHelp');
    if (help) help.classList.remove('hidden');
  }
  
  showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${this.getToastIcon(type)}</span>
      <span>${message}</span>
      <button class="toast-close">&times;</button>
    `;
    
    toast.querySelector('.toast-close').addEventListener('click', () => toast.remove());
    
    container.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'slideIn 0.3s ease reverse';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }
  
  getToastIcon(type) {
    const icons = {
      success: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>',
      error: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
      warning: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
      info: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>'
    };
    return icons[type] || icons.info;
  }
  
  // Event system
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
    return () => this.off(event, callback);
  }
  
  off(event, callback) {
    if (!this.listeners.has(event)) return;
    const callbacks = this.listeners.get(event);
    const index = callbacks.indexOf(callback);
    if (index >= 0) callbacks.splice(index, 1);
  }
  
  emit(event, data) {
    if (!this.listeners.has(event)) return;
    this.listeners.get(event).forEach(cb => cb(data));
  }
  
  // Settings persistence
  saveSettings() {
    const settings = {
      volume: this.state.volume,
      isMuted: this.state.isMuted,
      playbackRate: this.state.playbackRate
    };
    try {
      localStorage.setItem('animestream_player_settings', JSON.stringify(settings));
    } catch (e) {
      console.warn('Failed to save player settings:', e);
    }
  }
  
  loadSettings() {
    try {
      const saved = localStorage.getItem('animestream_player_settings');
      if (saved) {
        const settings = JSON.parse(saved);
        this.setVolume(settings.volume ?? this.options.defaultVolume);
        this.video.muted = settings.isMuted ?? false;
        this.video.playbackRate = settings.playbackRate ?? 1;
        this.updateVolumeUI();
      }
    } catch (e) {
      console.warn('Failed to load player settings:', e);
    }
  }
  
  // Cleanup
  destroy() {
    this.stop();
    this.listeners.clear();
  }
}

// Auto-load HLS.js if needed
if (typeof window !== 'undefined' && !window.Hls) {
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/hls.js@latest/dist/hls.min.js';
  script.onload = () => window.Hls = Hls;
  document.head.appendChild(script);
}