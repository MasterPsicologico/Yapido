// ============================================================================
// SMART IMAGE PROCESSOR - Converts images to pixel art
// ============================================================================

const SmartProcessor = {
    edgeThreshold: 18,

    async processImage(img, mode = 'sprite', options = {}) {
        const {
            gridWidth = 64,
            gridHeight = 64,
            outlineEnabled = true,
            outlineColor = '#000000'
        } = options;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        canvas.width = gridWidth;
        canvas.height = gridHeight;

        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, 0, 0, gridWidth, gridHeight);

        const imageData = ctx.getImageData(0, 0, gridWidth, gridHeight);
        let pixels = new Uint8ClampedArray(imageData.data);

        const samplePixel = [pixels[0], pixels[1], pixels[2], pixels[3]];
        console.log('Sample raw pixel:', samplePixel);

        pixels = this.removeGridPattern(pixels, gridWidth, gridHeight);

        const edges = this.detectEdges(pixels, gridWidth, gridHeight);
        const bgColor = this.findBackgroundColor(pixels, gridWidth, gridHeight);
        console.log('Background color detected:', bgColor);

        const contours = this.findContours(pixels, gridWidth, gridHeight, edges);

        const result = [];
        for (let y = 0; y < gridHeight; y++) {
            result[y] = [];
            for (let x = 0; x < gridWidth; x++) {
                const idx = (y * gridWidth + x) * 4;
                const r = pixels[idx];
                const g = pixels[idx + 1];
                const b = pixels[idx + 2];
                const a = pixels[idx + 3];

                if (a < 40) {
                    result[y][x] = null;
                    continue;
                }

                const isContour = contours[y * gridWidth + x] === 255;

                if (isContour && outlineEnabled) {
                    result[y][x] = { color: outlineColor, isEdge: true };
                } else {
                    result[y][x] = { color: this.toHex(r, g, b), isEdge: false };
                }
            }
        }

        let minX = gridWidth, maxX = 0, minY = gridHeight, maxY = 0;
        for (let y = 0; y < gridHeight; y++) {
            for (let x = 0; x < gridWidth; x++) {
                if (result[y][x]) {
                    minX = Math.min(minX, x);
                    maxX = Math.max(maxX, x);
                    minY = Math.min(minY, y);
                    maxY = Math.max(maxY, y);
                }
            }
        }

        const pixelArray = [];
        for (let y = minY; y <= maxY; y++) {
            pixelArray[y - minY] = [];
            for (let x = minX; x <= maxX; x++) {
                pixelArray[y - minY][x - minX] = result[y][x] ? result[y][x].color : null;
            }
        }

        console.log('Final pixelArray sample:', pixelArray[0]?.slice(0, 5));

        return {
            pixels: pixelArray,
            width: maxX - minX + 1,
            height: maxY - minY + 1,
            minX, minY, maxX, maxY
        };
    },

    removeGridPattern(pixels, width, height) {
        const bgColor = this.findBackgroundColor(pixels, width, height);
        const gridThreshold = 40;

        const filtered = new Uint8ClampedArray(pixels);

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;
                const r = pixels[idx];
                const g = pixels[idx + 1];
                const b = pixels[idx + 2];

                const distToBg = this.colorDist(r, g, b, bgColor.r, bgColor.g, bgColor.b);

                if (distToBg < gridThreshold) {
                    const isGridLine = (y % 2 === 0) || (x % 2 === 0);

                    if (isGridLine) {
                        const neighbors = this.getNeighborAvg(pixels, width, height, x, y, 2);
                        filtered[idx] = neighbors.r;
                        filtered[idx + 1] = neighbors.g;
                        filtered[idx + 2] = neighbors.b;
                    }
                }
            }
        }

        return filtered;
    },

    findBackgroundColor(pixels, width, height) {
        const colorCounts = new Map();

        for (let y = 0; y < height; y += 3) {
            for (let x = 0; x < width; x += 3) {
                const idx = (y * width + x) * 4;
                const r = Math.round(pixels[idx] / 16) * 16;
                const g = Math.round(pixels[idx + 1] / 16) * 16;
                const b = Math.round(pixels[idx + 2] / 16) * 16;

                const key = `${r},${g},${b}`;
                colorCounts.set(key, (colorCounts.get(key) || 0) + 1);
            }
        }

        let maxCount = 0;
        let bgColor = { r: 240, g: 240, b: 240 };

        for (const [key, count] of colorCounts) {
            if (count > maxCount) {
                maxCount = count;
                const [r, g, b] = key.split(',').map(Number);
                bgColor = { r, g, b };
            }
        }

        return bgColor;
    },

    getNeighborAvg(pixels, width, height, x, y, radius) {
        let r = 0, g = 0, b = 0, count = 0;

        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const nx = x + dx;
                const ny = y + dy;

                if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                    const idx = (ny * width + nx) * 4;
                    r += pixels[idx];
                    g += pixels[idx + 1];
                    b += pixels[idx + 2];
                    count++;
                }
            }
        }

        return { r: r / count, g: g / count, b: b / count };
    },

    detectEdges(pixels, width, height) {
        const edges = new Uint8Array(width * height);

        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const idx = (y * width + x) * 4;
                const intensity = (pixels[idx] + pixels[idx+1] + pixels[idx+2]) / 3;

                const idxL = (y * width + x - 1) * 4;
                const idxR = (y * width + x + 1) * 4;
                const idxT = ((y-1) * width + x) * 4;
                const idxB = ((y+1) * width + x) * 4;

                const gx = Math.abs(intensity - (pixels[idxL] + pixels[idxL+1] + pixels[idxL+2]) / 3) +
                          Math.abs(intensity - (pixels[idxR] + pixels[idxR+1] + pixels[idxR+2]) / 3);
                const gy = Math.abs(intensity - (pixels[idxT] + pixels[idxT+1] + pixels[idxT+2]) / 3) +
                          Math.abs(intensity - (pixels[idxB] + pixels[idxB+1] + pixels[idxB+2]) / 3);

                edges[y * width + x] = (gx + gy) > this.edgeThreshold ? 255 : 0;
            }
        }

        return edges;
    },

    findContours(pixels, width, height, edges) {
        const contours = new Uint8Array(width * height);

        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                if (edges[y * width + x] === 0) continue;

                const idx = (y * width + x) * 4;
                if (pixels[idx + 3] < 40) continue;

                const top = ((y-1) * width + x) * 4;
                const bottom = ((y+1) * width + x) * 4;
                const left = (y * width + x - 1) * 4;
                const right = (y * width + x + 1) * 4;

                const isBoundary = pixels[top + 3] < 40 ||
                                   pixels[bottom + 3] < 40 ||
                                   pixels[left + 3] < 40 ||
                                   pixels[right + 3] < 40;

                if (isBoundary) {
                    contours[y * width + x] = 255;
                }
            }
        }

        return contours;
    },

    colorDist(r1, g1, b1, r2, g2, b2) {
        return Math.sqrt((r1-r2)**2 + (g1-g2)**2 + (b1-b2)**2);
    },

    toHex(r, g, b) {
        const toHexPair = (v) => {
            const h = Math.min(255, Math.max(0, Math.round(v))).toString(16);
            return h.length === 1 ? '0' + h : h;
        };
        return '#' + toHexPair(r) + toHexPair(g) + toHexPair(b);
    }
};

// ============================================================================
// ENHANCED PIXEL EDITOR
// ============================================================================

const PixelEditor = {
    gridWidth: 64,
    gridHeight: 64,
    pixelSize: 5,
    currentScale: 5,
    pixels: [],

    currentColor: '#00ff88',
    isDrawing: false,
    uploadedImage: null,

    palette: [
        '#00ff88', '#00cc6a', '#ff6b6b', '#ffd93d',
        '#ff8800', '#ff0000', '#00ffff', '#c792ea',
        '#ffffff', '#888888', '#333333', '#000000'
    ],

    init() {
        this.initPixels();
        this.createGrid();
        this.createPreview();
        this.initColorPicker();
        this.initScaleControls();
        this.initUploadHandlers();
    },

    initPixels() {
        this.pixels = [];
        for (let y = 0; y < this.gridHeight; y++) {
            this.pixels[y] = [];
            for (let x = 0; x < this.gridWidth; x++) {
                this.pixels[y][x] = null;
            }
        }
    },

    createGrid() {
        const container = document.getElementById('pixelGridContainer');
        if (!container) return;

        container.innerHTML = '';

        const wrapper = document.createElement('div');
        wrapper.className = 'pixel-grid-wrapper';
        wrapper.style.overflow = 'auto';
        wrapper.style.maxWidth = '100%';
        wrapper.style.maxHeight = '45vh';
        wrapper.style.display = 'flex';
        wrapper.style.justifyContent = 'center';
        wrapper.style.alignItems = 'center';
        wrapper.style.padding = '10px';

        const grid = document.createElement('div');
        grid.className = 'pixel-grid-inner';
        grid.style.display = 'grid';
        grid.style.gridTemplateColumns = `repeat(${this.gridWidth}, ${this.pixelSize}px)`;
        grid.style.gridTemplateRows = `repeat(${this.gridHeight}, ${this.pixelSize}px)`;
        grid.style.gap = '0';

        const scale = this.currentScale / 10;
        grid.style.transform = `scale(${scale})`;
        grid.style.transformOrigin = 'center center';
        grid.style.transition = 'transform 0.15s ease';

        for (let y = 0; y < this.gridHeight; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                const pixel = document.createElement('div');
                pixel.className = 'editor-pixel';
                pixel.style.width = `${this.pixelSize}px`;
                pixel.style.height = `${this.pixelSize}px`;
                pixel.style.background = 'transparent';
                pixel.style.border = 'none';
                pixel.style.margin = '0';
                pixel.style.padding = '0';
                pixel.dataset.x = x;
                pixel.dataset.y = y;

                pixel.addEventListener('mousedown', (e) => {
                    e.preventDefault();
                    this.isDrawing = true;
                    this.togglePixel(x, y, e.shiftKey);
                });

                pixel.addEventListener('mouseenter', (e) => {
                    if (this.isDrawing && e.buttons === 1) {
                        this.togglePixel(x, y, e.shiftKey);
                    }
                });

                grid.appendChild(pixel);
            }
        }

        document.addEventListener('mouseup', () => this.isDrawing = false);
        wrapper.appendChild(grid);
        container.appendChild(wrapper);
    },

    togglePixel(x, y, erase = false) {
        const pixel = document.querySelector(`.editor-pixel[data-x="${x}"][data-y="${y}"]`);
        if (!pixel) return;

        if (erase || this.pixels[y][x]) {
            this.pixels[y][x] = null;
            pixel.style.background = 'transparent';
            pixel.classList.remove('filled');
        } else {
            this.pixels[y][x] = this.currentColor;
            pixel.style.background = this.currentColor;
            pixel.classList.add('filled');
        }

        this.updatePreview();
        this.updateStats();
    },

    createPreview() {
        const container = document.getElementById('pixelPreviewContainer');
        if (!container) return;

        container.innerHTML = '';

        const canvas = document.createElement('canvas');
        canvas.width = 280;
        canvas.height = 180;

        container.appendChild(canvas);

        this.previewCanvas = canvas;
        this.previewCtx = canvas.getContext('2d');

        this.updatePreview();
    },

    updatePreview() {
        if (!this.previewCtx) return;

        const ctx = this.previewCtx;
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, 280, 180);

        const bounds = this.getBounds();
        if (!bounds) return;

        const w = bounds.maxX - bounds.minX + 1;
        const h = bounds.maxY - bounds.minY + 1;

        const scale = Math.min(240 / w, 150 / h, 25);
        const ox = (280 - w * scale) / 2 - bounds.minX * scale;
        const oy = (180 - h * scale) / 2 - bounds.minY * scale;

        for (let y = bounds.minY; y <= bounds.maxY; y++) {
            for (let x = bounds.minX; x <= bounds.maxX; x++) {
                const color = this.pixels[y][x];
                if (color) {
                    ctx.fillStyle = color;
                    ctx.fillRect(
                        Math.round(ox + x * scale),
                        Math.round(oy + y * scale),
                        Math.ceil(scale),
                        Math.ceil(scale)
                    );
                }
            }
        }

        ctx.fillStyle = '#555';
        ctx.font = '10px monospace';
        ctx.fillText(`${w}x${h}`, 5, 175);
    },

    initColorPicker() {
        const container = document.getElementById('colorPicker');
        if (!container) return;

        container.innerHTML = '';

        this.palette.forEach((color, i) => {
            const swatch = document.createElement('div');
            swatch.className = 'color-swatch' + (i === 0 ? ' selected' : '');
            swatch.style.background = color;
            swatch.dataset.color = color;

            swatch.addEventListener('click', () => {
                document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
                swatch.classList.add('selected');
                this.currentColor = color;
            });

            container.appendChild(swatch);
        });

        // Custom color
        const customInput = document.createElement('input');
        customInput.type = 'color';
        customInput.value = this.currentColor;
        customInput.style.cssText = 'width:22px;height:22px;border:none;cursor:pointer;background:none;padding:0;';

        customInput.addEventListener('input', (e) => {
            this.currentColor = e.target.value;
            document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
        });

        container.appendChild(customInput);
    },

    initScaleControls() {
        const slider = document.getElementById('pixelScaleSlider');
        const value = document.getElementById('pixelScaleValue');

        if (slider) {
            slider.value = this.currentScale;
            slider.addEventListener('input', (e) => {
                this.currentScale = parseInt(e.target.value);
                if (value) value.textContent = `${this.currentScale}x`;
                this.updateGridScale();
            });
        }
    },

    updateGridScale() {
        const grid = document.querySelector('.pixel-grid-inner');
        if (grid) {
            grid.style.transform = `scale(${this.currentScale / 10})`;
        }
    },

    initUploadHandlers() {
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('imageUpload');

        if (uploadArea) {
            uploadArea.addEventListener('click', () => fileInput?.click());
            uploadArea.addEventListener('dragover', (e) => { e.preventDefault(); uploadArea.style.borderColor = 'var(--accent)'; });
            uploadArea.addEventListener('dragleave', () => { uploadArea.style.borderColor = ''; });
            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.style.borderColor = '';
                const file = e.dataTransfer?.files[0];
                if (file && file.type.startsWith('image/')) this.processImage(file);
            });
        }

        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files?.[0];
                if (file) this.processImage(file);
            });
        }
    },

    async processImage(file) {
        const reader = new FileReader();

        reader.onload = async (e) => {
            const img = new Image();
            img.onload = async () => {
                this.uploadedImage = img;
                this.showNotification('Procesando...');

                try {
                    const result = await SmartProcessor.processImage(img, 'sprite', {
                        gridWidth: this.gridWidth,
                        gridHeight: this.gridHeight,
                        outlineEnabled: true,
                        outlineColor: '#000000'
                    });

                    this.loadResult(result);
                    this.showNotification('Listo');
                } catch (err) {
                    console.error(err);
                    this.showNotification('Error', 'error');
                }
            };
            img.src = e.target.result;
        };

        reader.readAsDataURL(file);
    },

    loadResult(result) {
        this.initPixels();

        const offsetY = Math.floor((this.gridHeight - result.height) / 2);
        const offsetX = Math.floor((this.gridWidth - result.width) / 2);

        result.pixels.forEach((row, py) => {
            for (let px = 0; px < row.length; px++) {
                const color = row[px];
                if (color) {
                    const y = offsetY + py;
                    const x = offsetX + px;

                    if (y >= 0 && y < this.gridHeight && x >= 0 && x < this.gridWidth) {
                        this.pixels[y][x] = color;
                    }
                }
            }
        });

        this.renderGrid();
        this.updatePreview();
        this.updateStats();
    },

    renderGrid() {
        const grid = document.querySelector('.pixel-grid-inner');
        if (!grid) return;

        const pixels = grid.querySelectorAll('.editor-pixel');
        pixels.forEach(pixel => {
            const x = parseInt(pixel.dataset.x);
            const y = parseInt(pixel.dataset.y);
            const color = this.pixels[y]?.[x];

            if (color) {
                pixel.style.background = color;
                pixel.classList.add('filled');
            } else {
                pixel.style.background = 'transparent';
                pixel.classList.remove('filled');
            }
        });
    },

    getBounds() {
        let minX = this.gridWidth, maxX = 0, minY = this.gridHeight, maxY = 0;

        for (let y = 0; y < this.gridHeight; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                if (this.pixels[y][x]) {
                    minX = Math.min(minX, x);
                    maxX = Math.max(maxX, x);
                    minY = Math.min(minY, y);
                    maxY = Math.max(maxY, y);
                }
            }
        }

        return maxX >= minX ? { minX, maxX, minY, maxY } : null;
    },

    updateStats() {
        const bounds = this.getBounds();
        if (!bounds) {
            document.getElementById('statWidth').textContent = '0';
            document.getElementById('statHeight').textContent = '0';
            document.getElementById('statPixels').textContent = '0';
            document.getElementById('statScale').textContent = '1x';
            return;
        }

        let count = 0;
        for (let y = bounds.minY; y <= bounds.maxY; y++) {
            for (let x = bounds.minX; x <= bounds.maxX; x++) {
                if (this.pixels[y][x]) count++;
            }
        }

        const w = bounds.maxX - bounds.minX + 1;
        const h = bounds.maxY - bounds.minY + 1;

        document.getElementById('statWidth').textContent = w;
        document.getElementById('statHeight').textContent = h;
        document.getElementById('statPixels').textContent = count;
        document.getElementById('statScale').textContent = `${Math.max(1, Math.round(40/w))}x`;
    },

    exportSprite() {
        const bounds = this.getBounds();
        if (!bounds) return { pixels: [], width: 0, height: 0 };

        const w = bounds.maxX - bounds.minX + 1;
        const h = bounds.maxY - bounds.minY + 1;

        const pixels = [];
        for (let y = bounds.minY; y <= bounds.maxY; y++) {
            const row = [];
            for (let x = bounds.minX; x <= bounds.maxX; x++) {
                const color = this.pixels[y][x];
                if (color) {
                    row.push(SpriteManager.colorToChar(color));
                } else {
                    row.push(' ');
                }
            }
            pixels.push(row);
        }

        return { pixels, width: w, height: h };
    },

    clearGrid() {
        if (confirm('¿Limpiar?')) {
            this.initPixels();
            this.renderGrid();
            this.updatePreview();
            this.updateStats();
        }
    },

    flipHorizontal() {
        for (let y = 0; y < this.gridHeight; y++) {
            const row = this.pixels[y].slice();
            for (let x = 0; x < this.gridWidth; x++) {
                this.pixels[y][this.gridWidth - 1 - x] = row[x];
            }
        }
        this.renderGrid();
        this.updatePreview();
    },

    flipVertical() {
        const newPixels = [];
        for (let y = 0; y < this.gridHeight; y++) {
            newPixels[this.gridHeight - 1 - y] = this.pixels[y].slice();
        }
        this.pixels = newPixels;
        this.renderGrid();
        this.updatePreview();
    },

    rotateCW() {
        const newPixels = [];
        for (let x = 0; x < this.gridWidth; x++) {
            newPixels[x] = [];
            for (let y = this.gridHeight - 1; y >= 0; y--) {
                newPixels[x][this.gridHeight - 1 - y] = this.pixels[y][x];
            }
        }
        this.pixels = newPixels;

        const temp = this.gridWidth;
        this.gridWidth = this.gridHeight;
        this.gridHeight = temp;

        this.renderGrid();
        this.updatePreview();
    },

    fillEmpty() {
        const fill = (x, y, target, replacement) => {
            if (x < 0 || x >= this.gridWidth || y < 0 || y >= this.gridHeight) return;
            if (this.pixels[y][x] !== null) return;

            this.pixels[y][x] = replacement;
            fill(x+1, y, target, replacement);
            fill(x-1, y, target, replacement);
            fill(x, y+1, target, replacement);
            fill(x, y-1, target, replacement);
        };

        fill(0, 0, null, this.currentColor);
        this.renderGrid();
        this.updatePreview();
    },

    showNotification(msg, type = 'success') {
        const notif = document.getElementById('notification');
        if (notif) {
            notif.textContent = msg;
            notif.className = 'notification show' + (type === 'error' ? ' error' : '');
            setTimeout(() => notif.classList.remove('show'), 2000);
        }
    }
};

// ============================================================================
// SPRITE MANAGER - Category system, upload, and live game updates
// ============================================================================

const SpriteManager = {
    currentCategory: 'all',
    selectedSprite: null,

    categories: {
        player: { label: 'Jugador', icon: '🎮', color: '#00ff88' },
        enemy: { label: 'Enemigos', icon: '👾', color: '#ff6b6b' },
        boss: { label: 'Jefes', icon: '👹', color: '#ff0055' },
        bullet: { label: 'Balas', icon: '🔵', color: '#00ffff' },
        powerup: { label: 'Power-ups', icon: '⚡', color: '#ffd93d' },
        object: { label: 'Objetos', icon: '📦', color: '#c792ea' },
        environment: { label: 'Entorno', icon: '🏔️', color: '#888888' },
        particle: { label: 'Partículas', icon: '✨', color: '#ffffff' }
    },

    spriteMap: {
        player: ['player'],
        enemy: ['walker', 'flyer', 'shooter'],
        boss: ['boss'],
        bullet: ['bullet'],
        powerup: ['powerup_health', 'powerup_speed'],
        object: ['coin'],
        environment: [],
        particle: []
    },

    init() {
        this.renderCategoryButtons();
        this.renderSpriteGrid();
        this.initUploadZone();
        this.initNewSpriteModal();
    },

    renderCategoryButtons() {
        const container = document.getElementById('spriteCategories');
        if (!container) return;

        container.innerHTML = `
            <button class="sprite-category-btn ${this.currentCategory === 'all' ? 'active' : ''}" data-category="all">
                📋 Todos
            </button>
            ${Object.entries(this.categories).map(([key, cat]) => `
                <button class="sprite-category-btn ${this.currentCategory === key ? 'active' : ''}" data-category="${key}">
                    ${cat.icon} ${cat.label}
                </button>
            `).join('')}
        `;

        container.querySelectorAll('.sprite-category-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.currentCategory = btn.dataset.category;
                container.querySelectorAll('.sprite-category-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.renderSpriteGrid();
            });
        });
    },

    renderSpriteGrid() {
        const container = document.getElementById('spriteGrid');
        if (!container) return;

        const gameConfig = window.G?.config || {};
        const spriteKeys = Object.keys(gameConfig).filter(key => {
            if (!gameConfig[key]?.pixels || gameConfig[key].pixels.length === 0) return false;
            if (this.currentCategory === 'all') return true;
            return this.spriteMap[this.currentCategory]?.includes(key);
        });

        container.innerHTML = spriteKeys.map(key => {
            const cfg = gameConfig[key];
            const currentCat = this.getSpriteCategory(key);
            return `
                <div class="sprite-card" data-sprite="${key}" onclick="SpriteManager.selectSprite('${key}')">
                    <div class="sprite-icon">
                        <canvas width="48" height="48" id="sprite-icon-${key}"></canvas>
                    </div>
                    <span class="sprite-name">${this.getSpriteDisplayName(key)}</span>
                    <span class="sprite-category-tag">${this.getSpriteCategoryLabel(key)}</span>
                    <div class="sprite-card-actions">
                        <select onchange="SpriteManager.changeCategory('${key}', this.value); event.stopPropagation();" onclick="event.stopPropagation();">
                            ${Object.entries(this.categories).map(([catKey, cat]) =>
                                `<option value="${catKey}" ${currentCat === catKey ? 'selected' : ''}>${cat.icon} ${cat.label}</option>`
                            ).join('')}
                        </select>
                    </div>
                    <div class="sprite-card-actions">
                        <button class="tool-btn" style="flex:1;font-size:9px;padding:3px;" onclick="SpriteManager.uploadImageForSprite('${key}'); event.stopPropagation();" title="Subir imagen">📤</button>
                        <button class="tool-btn" style="flex:1;font-size:9px;padding:3px;" onclick="SpriteManager.deleteSprite('${key}'); event.stopPropagation();" title="Eliminar">🗑️</button>
                    </div>
                </div>
            `;
        }).join('');

        spriteKeys.forEach(key => this.renderSpriteIcon(key));
    },

    getSpriteCategory(key) {
        for (const [cat, keys] of Object.entries(this.spriteMap)) {
            if (keys.includes(key)) return cat;
        }
        return 'object';
    },

    renderSpriteIcon(key) {
        const canvas = document.getElementById(`sprite-icon-${key}`);
        if (!canvas) return;

        const cfg = window.G?.config?.[key];
        if (!cfg?.pixels || cfg.pixels.length === 0) return;

        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, 48, 48);

        const pixelW = Math.min(40 / cfg.pixels.length, 44 / (cfg.pixels[0]?.length || 1));
        const offsetX = (48 - cfg.pixels[0].length * pixelW) / 2;
        const offsetY = (48 - cfg.pixels.length * pixelW) / 2;

        ctx.shadowBlur = 3;
        cfg.pixels.forEach((row, py) => {
            for (let px = 0; px < row.length; px++) {
                const char = row[px];
                if (char !== ' ') {
                    const color = this.getColorForChar(char, cfg.color);
                    ctx.fillStyle = color;
                    ctx.shadowColor = color;
                    ctx.fillRect(offsetX + px * pixelW, offsetY + py * pixelW, pixelW + 0.5, pixelW + 0.5);
                }
            }
        });
    },

    getColorForChar(char, defaultColor) {
        const colorMap = {
            'P': '#00ff88',
            'G': '#00cc6a',
            'R': '#ff9966',
            'B': '#000000',
            'D': '#ffd700',
            'O': '#ff8800',
            'U': '#6699ff',
            'V': '#9966cc',
            'W': '#ffffff',
            'N': '#8b4513',
            'Y': '#ffff00',
            'L': '#00ffff'
        };
        return colorMap[char] || defaultColor || '#ffffff';
    },

    getSpriteDisplayName(key) {
        const names = {
            player: 'Jugador',
            walker: 'Caminante',
            flyer: 'Volador',
            shooter: 'Tirador',
            boss: 'Jefe',
            bullet: 'Bala',
            powerup_health: 'Vida',
            powerup_speed: 'Velocidad',
            coin: 'Moneda'
        };
        return names[key] || key;
    },

    getSpriteCategoryLabel(key) {
        const cat = this.getSpriteCategory(key);
        return this.categories[cat]?.label || 'Sin categoría';
    },

    selectSprite(key) {
        this.selectedSprite = key;

        document.querySelectorAll('.sprite-card').forEach(card => {
            card.classList.toggle('selected', card.dataset.sprite === key);
        });

        if (window.loadSpriteToEditor) {
            loadSpriteToEditor(key);
        }

        const select = document.getElementById('objectSelect');
        if (select) select.value = key;
    },

    initUploadZone() {
        const zone = document.getElementById('spriteUploadZone');
        if (!zone) return;

        zone.addEventListener('click', () => {
            if (!this.selectedSprite) {
                PixelEditor.showNotification('Selecciona un sprite primero', 'error');
                return;
            }
            this.triggerImageUpload();
        });

        zone.addEventListener('dragover', (e) => {
            e.preventDefault();
            zone.classList.add('dragover');
        });

        zone.addEventListener('dragleave', () => {
            zone.classList.remove('dragover');
        });

        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            zone.classList.remove('dragover');
            const file = e.dataTransfer?.files[0];
            if (file && file.type.startsWith('image/')) {
                this.uploadSpriteImage(file);
            }
        });
    },

    triggerImageUpload() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = e.target.files?.[0];
            if (file) this.uploadSpriteImage(file);
        };
        input.click();
    },

    uploadImageForSprite(key) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = e.target.files?.[0];
            if (file) this.uploadSpriteImageForKey(file, key);
        };
        input.click();
    },

    async uploadSpriteImage(file) {
        if (!this.selectedSprite) {
            PixelEditor.showNotification('Selecciona un sprite primero', 'error');
            return;
        }
        await this.uploadSpriteImageForKey(file, this.selectedSprite);
    },

    async uploadSpriteImageForKey(file, key) {
        console.log('uploadSpriteImageForKey:', key, file.name);
        PixelEditor.showNotification('Procesando imagen...');

        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                console.log('FileReader loaded');
                const img = new Image();
                img.onload = async () => {
                    console.log('Image loaded, calling SmartProcessor');
                    try {
                        const result = await SmartProcessor.processImage(img, 'sprite', {
                            gridWidth: 64,
                            gridHeight: 64,
                            outlineEnabled: true,
                            outlineColor: '#000000'
                        });

                        console.log('SmartProcessor result received:', result.pixels?.length, 'rows');
                        console.log('Sample pixels:', result.pixels?.[0]?.slice(0, 5));

                        this.applyToSprite(key, result);
                        resolve();
                    } catch (err) {
                        console.error('SmartProcessor error:', err);
                        PixelEditor.showNotification('Error al procesar', 'error');
                        reject(err);
                    }
                };
                img.onerror = () => {
                    console.error('Image load error');
                    PixelEditor.showNotification('Error al cargar imagen', 'error');
                    reject(new Error('Image load failed'));
                };
                img.src = e.target.result;
            };
            reader.onerror = () => {
                console.error('FileReader error');
                PixelEditor.showNotification('Error al leer archivo', 'error');
                reject(new Error('FileReader failed'));
            };
            reader.readAsDataURL(file);
        });
    },

    applyToSprite(key, result) {
        const cfg = window.G?.config?.[key];
        if (!cfg) {
            console.error('Sprite config not found:', key);
            PixelEditor.showNotification('Error: Sprite no encontrado', 'error');
            return;
        }

        if (!result.pixels || !result.pixels.length) {
            console.error('No pixel data in result');
            PixelEditor.showNotification('Error: Sin datos de píxeles', 'error');
            return;
        }

        const convertedPixels = this.convertPixelsToChars(result.pixels);
        if (!convertedPixels || !convertedPixels.length) {
            console.error('Conversion failed');
            PixelEditor.showNotification('Error: Falló conversión', 'error');
            return;
        }

        cfg.pixels = convertedPixels;
        cfg.width = result.width || 40;
        cfg.height = result.height || 40;

        if (window.G?.player && key === 'player') {
            window.G.player.width = cfg.width;
            window.G.player.height = cfg.height;
        }

        if (window.saveConfig) window.saveConfig();

        if (window.updateSpriteStats) updateSpriteStats(key);
        if (window.renderSpritePreview) renderSpritePreview(key);

        this.renderSpriteIcon(key);
        this.renderSpriteGrid();

        if (window.G?.render) window.G.render();

        PixelEditor.showNotification('Sprite actualizado');
    },

    convertPixelsToChars(pixels) {
        if (!pixels || !pixels.length) return [];

        return pixels.map(row => {
            if (!row) return [];
            return row.map(color => {
                if (!color) return ' ';
                return this.colorToChar(color);
            });
        });
    },

    colorToChar(color) {
        if (!color || typeof color !== 'string' || !color.startsWith('#')) {
            return 'W';
        }

        const c = this.parseColor(color);
        const { r, g, b } = c;

        const colorChars = [
            { char: 'P', r: 0, g: 255, b: 136, tolerance: 80 },    // Verde brillante
            { char: 'G', r: 0, g: 204, b: 106, tolerance: 80 },     // Verde oscuro
            { char: 'R', r: 255, g: 153, b: 102, tolerance: 90 },   // Piel
            { char: 'B', r: 0, g: 0, b: 0, tolerance: 50 },        // Negro
            { char: 'D', r: 255, g: 215, b: 0, tolerance: 70 },    // Dorado
            { char: 'O', r: 255, g: 136, b: 0, tolerance: 80 },     // Naranja
            { char: 'U', r: 102, g: 153, b: 255, tolerance: 80 },  // Azul
            { char: 'V', r: 153, g: 102, b: 204, tolerance: 80 },   // Púrpura
            { char: 'W', r: 255, g: 255, b: 255, tolerance: 50 },  // Blanco
            { char: 'Y', r: 255, g: 255, b: 0, tolerance: 70 },    // Amarillo
            { char: 'N', r: 139, g: 69, b: 19, tolerance: 70 },    // Marrón
            { char: 'L', r: 0, g: 255, b: 255, tolerance: 70 },   // Cian
            { char: 'S', r: 128, g: 128, b: 128, tolerance: 60 },  // Gris
        ];

        let bestMatch = null;
        let bestDist = Infinity;

        for (const cc of colorChars) {
            const dist = Math.sqrt((r - cc.r) ** 2 + (g - cc.g) ** 2 + (b - cc.b) ** 2);
            if (dist < bestDist) {
                bestDist = dist;
                bestMatch = cc;
            }
        }

        return bestDist < 150 ? bestMatch.char : 'W';
    },
    },

    parseColor(color) {
        if (typeof color !== 'string') return { r: 128, g: 128, b: 128 };
        if (!color.startsWith('#') || color.length !== 7) {
            return { r: 128, g: 128, b: 128 };
        }
        return {
            r: parseInt(color.substr(1, 2), 16),
            g: parseInt(color.substr(3, 2), 16),
            b: parseInt(color.substr(5, 2), 16)
        };
    },

    initNewSpriteModal() {
        let modal = document.getElementById('newSpriteModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'newSpriteModal';
            modal.className = 'modal-overlay hidden';
            modal.innerHTML = `
                <div class="modal-content">
                    <h2>➕ Nuevo Sprite</h2>
                    <div class="form-group">
                        <label>Nombre del sprite</label>
                        <input type="text" id="newSpriteName" placeholder="mi_sprite">
                    </div>
                    <div class="form-group">
                        <label>Categoría</label>
                        <select id="newSpriteCategory">
                            ${Object.entries(this.categories).map(([key, cat]) =>
                                `<option value="${key}">${cat.icon} ${cat.label}</option>`
                            ).join('')}
                        </select>
                    </div>
                    <div class="modal-actions">
                        <button class="tool-btn" onclick="SpriteManager.hideNewSpriteModal()">Cancelar</button>
                        <button class="tool-btn primary" onclick="SpriteManager.createNewSprite()">Crear</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }
    },

    showNewSpriteModal() {
        const modal = document.getElementById('newSpriteModal');
        if (modal) {
            modal.classList.remove('hidden');
            const nameInput = document.getElementById('newSpriteName');
            if (nameInput) {
                nameInput.value = '';
                nameInput.focus();
            }
        }
    },

    hideNewSpriteModal() {
        const modal = document.getElementById('newSpriteModal');
        if (modal) {
            modal.classList.add('hidden');
        }
    },

    createNewSprite() {
        const nameInput = document.getElementById('newSpriteName');
        const catSelect = document.getElementById('newSpriteCategory');

        if (!nameInput || !catSelect) return;

        const name = nameInput.value.trim();
        const category = catSelect.value;

        if (!name || name.includes(' ')) {
            PixelEditor.showNotification('Nombre inválido (sin espacios)', 'error');
            return;
        }

        if (window.G?.config?.[name]) {
            PixelEditor.showNotification('Ya existe ese nombre', 'error');
            return;
        }

        if (!this.categories[category]) {
            PixelEditor.showNotification('Categoría inválida', 'error');
            return;
        }

        window.G.config[name] = {
            width: 40,
            height: 40,
            speed: 2,
            health: 1,
            points: 50,
            color: '#ffffff',
            pixels: []
        };

        if (!this.spriteMap[category]) this.spriteMap[category] = [];
        this.spriteMap[category].push(name);

        this.hideNewSpriteModal();
        PixelEditor.showNotification('Sprite creado - dibuja algo!');
        this.renderSpriteGrid();
        this.selectSprite(name);
    },

    addNewSprite() {
        this.showNewSpriteModal();
    },

    deleteSprite(key) {
        if (!confirm(`¿Eliminar sprite "${key}"?`)) return;

        for (const cat of Object.keys(this.spriteMap)) {
            const idx = this.spriteMap[cat].indexOf(key);
            if (idx > -1) this.spriteMap[cat].splice(idx, 1);
        }

        if (window.G?.config?.[key]) {
            delete window.G.config[key];
        }

        if (this.selectedSprite === key) {
            this.selectedSprite = null;
        }

        this.renderSpriteGrid();
        PixelEditor.showNotification('Sprite eliminado');

        if (window.G?.render) window.G.render();
    },

    changeCategory(key, newCategory) {
        if (!this.categories[newCategory]) {
            PixelEditor.showNotification('Categoría inválida', 'error');
            return;
        }

        for (const cat of Object.keys(this.spriteMap)) {
            const idx = this.spriteMap[cat].indexOf(key);
            if (idx > -1) {
                this.spriteMap[cat].splice(idx, 1);
                break;
            }
        }

        if (!this.spriteMap[newCategory]) this.spriteMap[newCategory] = [];
        this.spriteMap[newCategory].push(key);

        this.renderSpriteGrid();
        PixelEditor.showNotification(`Movido a ${this.categories[newCategory].label}`);

        if (window.G?.render) window.G.render();
    }
};

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('pixelGridContainer')) {
        PixelEditor.init();
    }
    if (document.getElementById('spriteGrid')) {
        SpriteManager.init();
    }
});

window.PixelEditor = PixelEditor;
window.SmartProcessor = SmartProcessor;
window.SpriteManager = SpriteManager;