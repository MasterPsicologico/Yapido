/**
 * AnimeStream - Episode Manager
 * Gestión de episodios, auto-obtención desde APIs, edición manual
 */

import { TOP_10_ANIME, SAMPLE_EPISODES, FETCH_SOURCES, generateId, sortEpisodes, groupBySeason, formatDuration } from './data/anime-data.js';

export class EpisodeManager {
  constructor(storageKey = 'animestream_data') {
    this.storageKey = storageKey;
    this.series = [];
    this.currentSeriesId = null;
    this.currentSeason = 'all';
    this.listeners = new Map();
    this.fetchCache = new Map();
    
    this.loadData();
  }
  
  // Data persistence
  loadData() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        const data = JSON.parse(saved);
        this.series = data.series || [];
        this.currentSeriesId = data.currentSeriesId || null;
        this.currentSeason = data.currentSeason || 'all';
      } else {
        // First run - initialize with top 10 anime
        this.initializeDefaultSeries();
      }
    } catch (e) {
      console.warn('Failed to load data, initializing defaults:', e);
      this.initializeDefaultSeries();
    }
    this.emit('dataLoaded', { series: this.series });
  }
  
  saveData() {
    try {
      const data = {
        series: this.series,
        currentSeriesId: this.currentSeriesId,
        currentSeason: this.currentSeason,
        lastUpdated: Date.now()
      };
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save data:', e);
      this.showToast('Error guardando datos', 'error');
    }
  }
  
  initializeDefaultSeries() {
    this.series = TOP_10_ANIME.map(anime => ({
      ...anime,
      id: anime.id,
      episodes: [...(SAMPLE_EPISODES[anime.id] || [])],
      createdAt: Date.now(),
      updatedAt: Date.now()
    }));
    this.currentSeriesId = this.series[0]?.id || null;
    this.saveData();
  }
  
  // Series management
  getAllSeries() {
    return [...this.series].sort((a, b) => b.updatedAt - a.updatedAt);
  }
  
  getSeriesById(id) {
    return this.series.find(s => s.id === id) || null;
  }
  
  async addSeries(seriesData) {
    const id = generateId(seriesData.title);
    
    // Check if exists
    if (this.series.find(s => s.id === id)) {
      throw new Error('Esta serie ya existe');
    }
    
    const newSeries = {
      id,
      title: seriesData.title,
      titleJp: seriesData.titleJp || '',
      year: seriesData.year || new Date().getFullYear(),
      status: seriesData.status || 'airing',
      genres: seriesData.genres ? seriesData.genres.split(',').map(g => g.trim()).filter(Boolean) : [],
      poster: seriesData.poster || '',
      backdrop: seriesData.backdrop || '',
      synopsis: seriesData.synopsis || '',
      totalEpisodes: seriesData.totalEpisodes || 0,
      seasons: seriesData.seasons || 1,
      malId: seriesData.malId || null,
      anilistId: seriesData.anilistId || null,
      episodes: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    this.series.unshift(newSeries);
    this.currentSeriesId = id;
    this.saveData();
    this.emit('seriesAdded', { series: newSeries });
    
    // Auto-fetch episodes if requested
    if (seriesData.autoFetch) {
      this.fetchEpisodes(id).catch(err => {
        console.warn('Auto-fetch failed:', err);
        this.showToast('No se pudieron obtener episodios automáticamente', 'warning');
      });
    }
    
    return newSeries;
  }
  
  updateSeries(id, updates) {
    const index = this.series.findIndex(s => s.id === id);
    if (index === -1) throw new Error('Serie no encontrada');
    
    this.series[index] = {
      ...this.series[index],
      ...updates,
      updatedAt: Date.now()
    };
    
    this.saveData();
    this.emit('seriesUpdated', { series: this.series[index] });
    return this.series[index];
  }
  
  deleteSeries(id) {
    const index = this.series.findIndex(s => s.id === id);
    if (index === -1) throw new Error('Serie no encontrada');
    
    const deleted = this.series.splice(index, 1)[0];
    
    if (this.currentSeriesId === id) {
      this.currentSeriesId = this.series[0]?.id || null;
    }
    
    this.saveData();
    this.emit('seriesDeleted', { id, series: deleted });
    return deleted;
  }
  
  // Episode management
  getEpisodes(seriesId, season = 'all') {
    const series = this.getSeriesById(seriesId);
    if (!series) return [];
    
    let episodes = [...series.episodes];
    
    if (season !== 'all') {
      episodes = episodes.filter(ep => ep.season === parseInt(season));
    }
    
    return sortEpisodes(episodes);
  }
  
  getSeasons(seriesId) {
    const series = this.getSeriesById(seriesId);
    if (!series) return [];
    
    const seasons = new Set(series.episodes.map(ep => ep.season || 1));
    return Array.from(seasons).sort((a, b) => a - b);
  }
  
  getEpisode(seriesId, episodeId) {
    const series = this.getSeriesById(seriesId);
    if (!series) return null;
    return series.episodes.find(ep => ep.id === episodeId) || null;
  }
  
  addEpisode(seriesId, episodeData) {
    const series = this.getSeriesById(seriesId);
    if (!series) throw new Error('Serie no encontrada');
    
    const episode = {
      id: generateId(`${seriesId}-ep-${episodeData.number}-${Date.now()}`),
      number: episodeData.number,
      season: episodeData.season || 1,
      title: episodeData.title,
      synopsis: episodeData.synopsis || '',
      videoUrl: episodeData.videoUrl,
      thumbnail: episodeData.thumbnail || '',
      duration: episodeData.duration || 0,
      tags: episodeData.tags ? episodeData.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      addedAt: Date.now(),
      updatedAt: Date.now()
    };
    
    series.episodes.push(episode);
    series.updatedAt = Date.now();
    series.totalEpisodes = Math.max(series.totalEpisodes, episode.number);
    
    this.saveData();
    this.emit('episodeAdded', { seriesId, episode });
    return episode;
  }
  
  updateEpisode(seriesId, episodeId, updates) {
    const series = this.getSeriesById(seriesId);
    if (!series) throw new Error('Serie no encontrada');
    
    const index = series.episodes.findIndex(ep => ep.id === episodeId);
    if (index === -1) throw new Error('Episodio no encontrado');
    
    series.episodes[index] = {
      ...series.episodes[index],
      ...updates,
      updatedAt: Date.now()
    };
    
    series.updatedAt = Date.now();
    this.saveData();
    this.emit('episodeUpdated', { seriesId, episode: series.episodes[index] });
    return series.episodes[index];
  }
  
  deleteEpisode(seriesId, episodeId) {
    const series = this.getSeriesById(seriesId);
    if (!series) throw new Error('Serie no encontrada');
    
    const index = series.episodes.findIndex(ep => ep.id === episodeId);
    if (index === -1) throw new Error('Episodio no encontrado');
    
    const deleted = series.episodes.splice(index, 1)[0];
    series.updatedAt = Date.now();
    
    this.saveData();
    this.emit('episodeDeleted', { seriesId, episodeId, episode: deleted });
    return deleted;
  }
  
  // Bulk operations
  bulkAddEpisodes(seriesId, episodesData) {
    const series = this.getSeriesById(seriesId);
    if (!series) throw new Error('Serie no encontrada');
    
    const added = episodesData.map(data => this.addEpisode(seriesId, data));
    this.emit('episodesBulkAdded', { seriesId, count: added.length });
    return added;
  }
  
  reorderEpisodes(seriesId, episodeIds) {
    const series = this.getSeriesById(seriesId);
    if (!series) throw new Error('Serie no encontrada');
    
    const episodeMap = new Map(series.episodes.map(ep => [ep.id, ep]));
    series.episodes = episodeIds.map(id => episodeMap.get(id)).filter(Boolean);
    series.updatedAt = Date.now();
    
    this.saveData();
    this.emit('episodesReordered', { seriesId });
  }
  
  // Auto-fetch from APIs
  async fetchEpisodes(seriesId, options = {}) {
    const series = this.getSeriesById(seriesId);
    if (!series) throw new Error('Serie no encontrada');
    
    this.emit('fetchStarted', { seriesId });
    
    try {
      // Try Jikan API first (no auth required)
      const episodes = await this.fetchFromJikan(series);
      
      if (episodes.length > 0) {
        // Merge with existing episodes (preserve manual edits)
        const existingMap = new Map(series.episodes.map(ep => [`${ep.season}-${ep.number}`, ep]));
        
        const merged = episodes.map(ep => {
          const key = `${ep.season}-${ep.number}`;
          const existing = existingMap.get(key);
          if (existing && existing.videoUrl) {
            // Preserve manual video URL and edits
            return { ...ep, videoUrl: existing.videoUrl, thumbnail: existing.thumbnail || ep.thumbnail, updatedAt: existing.updatedAt };
          }
          return ep;
        });
        
        series.episodes = merged;
        series.updatedAt = Date.now();
        series.totalEpisodes = merged.length;
        
        this.saveData();
        this.emit('fetchCompleted', { seriesId, count: merged.length });
        return merged;
      }
      
      throw new Error('No episodes found');
    } catch (error) {
      this.emit('fetchFailed', { seriesId, error: error.message });
      throw error;
    }
  }
  
  async fetchFromJikan(series) {
    const cacheKey = `jikan-${series.malId || series.id}`;
    
    if (this.fetchCache.has(cacheKey)) {
      return this.fetchCache.get(cacheKey);
    }
    
    let malId = series.malId;
    
    // If no MAL ID, search for it
    if (!malId) {
      malId = await this.searchJikan(series.title);
      if (malId) {
        series.malId = malId;
      }
    }
    
    if (!malId) {
      throw new Error('No se encontró la serie en Jikan');
    }
    
    // Fetch episodes
    let allEpisodes = [];
    let page = 1;
    let hasNext = true;
    
    while (hasNext && page <= 10) { // Limit to 10 pages
      const response = await fetch(`${FETCH_SOURCES.jikan}/anime/${malId}/episodes?page=${page}&limit=100`);
      
      if (!response.ok) {
        if (response.status === 429) {
          // Rate limited
          await new Promise(r => setTimeout(r, 1000));
          continue;
        }
        throw new Error(`Jikan API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.data && data.data.length > 0) {
        const episodes = data.data.map(ep => ({
          id: generateId(`${series.id}-ep-${ep.mal_id}`),
          number: ep.episode,
          season: 1, // Jikan doesn't always provide season info
          title: ep.title || `Episodio ${ep.episode}`,
          titleJp: ep.title_japanese || '',
          synopsis: ep.synopsis || '',
          videoUrl: '', // To be filled manually
          thumbnail: ep.images?.jpg?.image_url || '',
          duration: ep.duration || 1440,
          aired: ep.aired,
          filler: ep.filler || false,
          recap: ep.recap || false,
          forumUrl: ep.forum_url || '',
          addedAt: Date.now(),
          updatedAt: Date.now()
        }));
        
        allEpisodes = allEpisodes.concat(episodes);
        hasNext = data.pagination.has_next_page;
        page++;
      } else {
        hasNext = false;
      }
    }
    
    // Try to detect seasons from episode count patterns
    allEpisodes = this.detectSeasons(allEpisodes, series);
    
    this.fetchCache.set(cacheKey, allEpisodes);
    return allEpisodes;
  }
  
  async searchJikan(title) {
    try {
      const response = await fetch(`${FETCH_SOURCES.jikan}/anime?q=${encodeURIComponent(title)}&limit=1&sfw=true`);
      if (!response.ok) return null;
      
      const data = await response.json();
      if (data.data && data.data.length > 0) {
        return data.data[0].mal_id;
      }
    } catch (e) {
      console.warn('Jikan search failed:', e);
    }
    return null;
  }
  
  detectSeasons(episodes, series) {
    // Simple heuristic: if > 50 episodes, assume multiple seasons
    // This is a fallback - real detection would need more metadata
    if (episodes.length <= 50) return episodes;
    
    // Try to split by common season boundaries
    const seasonBreaks = [24, 25, 26, 48, 49, 50, 51, 52, 72, 73, 74, 75, 76];
    let currentSeason = 1;
    let lastBreak = 0;
    
    return episodes.map((ep, index) => {
      const epNum = ep.number;
      
      // Check if this episode number matches a season break
      if (seasonBreaks.includes(epNum) && epNum > lastBreak) {
        currentSeason++;
        lastBreak = epNum;
      }
      
      return { ...ep, season: currentSeason };
    });
  }
  
  // Import/Export
  exportData() {
    return {
      version: '1.0',
      exportDate: new Date().toISOString(),
      series: this.series
    };
  }
  
  importData(jsonData) {
    try {
      const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
      
      if (!data.series || !Array.isArray(data.series)) {
        throw new Error('Formato de datos inválido');
      }
      
      // Merge with existing (avoid duplicates)
      data.series.forEach(imported => {
        const existingIndex = this.series.findIndex(s => s.id === imported.id);
        if (existingIndex >= 0) {
          // Merge episodes
          const existing = this.series[existingIndex];
          const episodeMap = new Map(existing.episodes.map(ep => [`${ep.season}-${ep.number}`, ep]));
          
          imported.episodes.forEach(ep => {
            const key = `${ep.season}-${ep.number}`;
            if (!episodeMap.has(key)) {
              existing.episodes.push(ep);
            } else if (ep.videoUrl && !episodeMap.get(key).videoUrl) {
              // Update if imported has video URL and existing doesn't
              episodeMap.set(key, ep);
            }
          });
          
          existing.episodes = Array.from(episodeMap.values());
          existing.updatedAt = Date.now();
        } else {
          this.series.unshift(imported);
        }
      });
      
      this.saveData();
      this.emit('dataImported', { count: data.series.length });
      return true;
    } catch (e) {
      console.error('Import failed:', e);
      throw new Error('Error importando datos: ' + e.message);
    }
  }
  
  // Search
  searchSeries(query) {
    const q = query.toLowerCase().trim();
    if (!q) return this.getAllSeries();
    
    return this.series.filter(s => 
      s.title.toLowerCase().includes(q) ||
      (s.titleJp && s.titleJp.toLowerCase().includes(q)) ||
      s.genres.some(g => g.toLowerCase().includes(q))
    );
  }
  
  searchEpisodes(seriesId, query) {
    const q = query.toLowerCase().trim();
    if (!q) return this.getEpisodes(seriesId);
    
    const series = this.getSeriesById(seriesId);
    if (!series) return [];
    
    return series.episodes.filter(ep =>
      ep.title.toLowerCase().includes(q) ||
      (ep.titleJp && ep.titleJp.toLowerCase().includes(q)) ||
      (ep.synopsis && ep.synopsis.toLowerCase().includes(q)) ||
      ep.tags.some(t => t.toLowerCase().includes(q))
    );
  }
  
  // Statistics
  getStats() {
    const totalSeries = this.series.length;
    const totalEpisodes = this.series.reduce((sum, s) => sum + s.episodes.length, 0);
    const totalWatched = this.series.reduce((sum, s) => 
      sum + s.episodes.filter(ep => ep.watched).length, 0);
    const seriesWithVideos = this.series.filter(s => 
      s.episodes.some(ep => ep.videoUrl)).length;
    
    return {
      totalSeries,
      totalEpisodes,
      totalWatched,
      seriesWithVideos,
      completionRate: totalEpisodes > 0 ? (totalWatched / totalEpisodes * 100).toFixed(1) : 0
    };
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
  
  // Utility
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
  
  // Clear all data
  clearAll() {
    this.series = [];
    this.currentSeriesId = null;
    this.currentSeason = 'all';
    this.fetchCache.clear();
    localStorage.removeItem(this.storageKey);
    this.emit('dataCleared');
  }
}

// Singleton instance
export const episodeManager = new EpisodeManager();