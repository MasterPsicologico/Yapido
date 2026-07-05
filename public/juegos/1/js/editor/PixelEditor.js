// ============================================================================
// SMART IMAGE PROCESSOR - Converts images to pixel art with proper colors
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

        pixels = this.removeGridPattern(pixels, gridWidth, gridHeight);

        const bgColor = this.findBackgroundColor(pixels, gridWidth, gridHeight);
        pixels = this.makeBackgroundTransparent(pixels, gridWidth, gridHeight, bgColor);

        const edges = this.detectEdges(pixels, gridWidth, gridHeight);
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

    makeBackgroundTransparent(pixels, width, height, bgColor) {
        const filtered = new Uint8ClampedArray(pixels);
        const bgThreshold = 50;
        const visited = new Uint8Array(width * height);
        const queue = [];

        for (let x = 0; x < width; x++) {
            if (this.colorDist(pixels[x*4], pixels[x*4+1], pixels[x*4+2], bgColor.r, bgColor.g, bgColor.b) < bgThreshold) {
                queue.push({x, y: 0}); visited[x] = 1;
            }
            const bIdx = ((height-1)*width+x)*4;
            const bKey = (height-1)*width+x;
            if (this.colorDist(pixels[bIdx], pixels[bIdx+1], pixels[bIdx+2], bgColor.r, bgColor.g, bgColor.b) < bgThreshold) {
                if (!visited[bKey]) { queue.push({x, y: height-1}); visited[bKey] = 1; }
            }
        }
        for (let y = 0; y < height; y++) {
            const lIdx = (y*width)*4;
            if (this.colorDist(pixels[lIdx], pixels[lIdx+1], pixels[lIdx+2], bgColor.r, bgColor.g, bgColor.b) < bgThreshold) {
                const key = y*width; if (!visited[key]) { queue.push({x:0, y}); visited[key] = 1; }
            }
            const rIdx = (y*width+width-1)*4;
            if (this.colorDist(pixels[rIdx], pixels[rIdx+1], pixels[rIdx+2], bgColor.r, bgColor.g, bgColor.b) < bgThreshold) {
                const key = y*width+width-1; if (!visited[key]) { queue.push({x:width-1, y}); visited[key] = 1; }
            }
        }

        const dx = [-1, 1, 0, 0];
        const dy = [0, 0, -1, 1];
        let head = 0;
        while (head < queue.length) {
            const {x, y} = queue[head++];
            const pos = y * width + x;
            filtered[pos * 4 + 3] = 0;

            for (let d = 0; d < 4; d++) {
                const nx = x + dx[d], ny = y + dy[d];
                if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
                const npos = ny * width + nx;
                if (visited[npos]) continue;
                const idx = npos * 4;
                if (this.colorDist(pixels[idx], pixels[idx+1], pixels[idx+2], bgColor.r, bgColor.g, bgColor.b) < bgThreshold) {
                    visited[npos] = 1;
                    queue.push({x: nx, y: ny});
                }
            }
        }

        return filtered;
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
// ADVANCED PIXEL ART EDITOR
// ============================================================================

const PixelEditor = {
    // Grid configuration
    gridWidth: 64,
    gridHeight: 64,
    pixelSize: 8, // Display size of each pixel
    maxScale: 100,
    minScale: 1,
    currentScale: 8, // 8x preview

    // Current sprite data (64x64)
    pixels: [],

    // Original image reference
    originalImage: null,

    // Drawing state
    currentColor: '#00ff88',
    isDrawing: false,

    // Canvas references
    previewCanvas: null,
    previewCtx: null,

    // Config for each sprite type
    spriteConfigs: {
        player: { gameWidth: 40, gameHeight: 50, scale: 4 },
        walker: { gameWidth: 35, gameHeight: 45, scale: 4 },
        flyer: { gameWidth: 40, gameHeight: 30, scale: 4 },
        shooter: { gameWidth: 30, gameHeight: 50, scale: 4 },
        boss: { gameWidth: 120, gameHeight: 100, scale: 4 },
        bullet: { gameWidth: 15, gameHeight: 6, scale: 4 },
        powerup_health: { gameWidth: 25, gameHeight: 25, scale: 4 },
        powerup_speed: { gameWidth: 25, gameHeight: 25, scale: 4 },
        coin: { gameWidth: 20, height: 20, scale: 4 }
    },

    // Color palette
    palette: [
        '#00ff88', '#00cc6a', '#ff6b6b', '#ffd93d',
        '#c792ea', '#ff0000', '#ff8800', '#00ffff',
        '#ffffff', '#888888', '#333333', '#ff00ff'
    ],

    // Color to char mapping
    colorChars: {
        '#00ff88': 'P',
        '#00cc6a': 'G',
        '#ff0000': 'R',
        'custom': 'C'
    },

    initialized: false,

    init() {
        if (this.initialized) {
            this.createGrid();
            this.createPreview();
            return;
        }
        this.initialized = true;

        this.initPixels();
        this.createGrid();
        this.createPreview();
        this.initColorPicker();
        this.initScaleControls();
        this.initUploadHandlers();
        this.initTabs();
    },

    initTabs() {
        const tabs = document.querySelectorAll('.editor-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                const tabName = tab.dataset.tab;
                const tabDraw = document.getElementById('tab-draw');
                const tabSprites = document.getElementById('tab-sprites');
                const tabProps = document.getElementById('tab-props');

                if (tabDraw) tabDraw.style.display = tabName === 'draw' ? 'block' : 'none';
                if (tabSprites) tabSprites.style.display = tabName === 'sprites' ? 'block' : 'none';
                if (tabProps) tabProps.style.display = tabName === 'props' ? 'block' : 'none';
            });
        });
    },

    initPixels() {
        this.pixels = [];
        for (let y = 0; y < this.gridHeight; y++) {
            this.pixels[y] = [];
            for (let x = 0; x < this.gridWidth; x++) {
                this.pixels[y][x] = null; // null = empty
            }
        }
    },

    createGrid() {
        const container = document.getElementById('pixelGridContainer');
        if (!container) return;

        container.innerHTML = '';

        // Create wrapper for zoom/pan
        const wrapper = document.createElement('div');
        wrapper.className = 'pixel-grid-wrapper';
        wrapper.style.overflow = 'auto';
        wrapper.style.maxWidth = '100%';
        wrapper.style.maxHeight = '400px';
        wrapper.style.border = '2px solid #00ff88';
        wrapper.style.borderRadius = '8px';
        wrapper.style.background = '#111';

        // Create grid container
        const grid = document.createElement('div');
        grid.className = 'pixel-grid-inner';
        grid.style.display = 'grid';
        grid.style.gridTemplateColumns = `repeat(${this.gridWidth}, ${this.pixelSize}px)`;
        grid.style.gap = '0px';
        grid.style.padding = '10px';
        grid.style.width = `${this.gridWidth * this.pixelSize + 20}px`;
        grid.style.transform = `scale(${this.currentScale / 10})`;
        grid.style.transformOrigin = 'top left';

        // Create pixels
        for (let y = 0; y < this.gridHeight; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                const pixel = document.createElement('div');
                pixel.className = 'editor-pixel';
                pixel.style.width = `${this.pixelSize}px`;
                pixel.style.height = `${this.pixelSize}px`;
                pixel.style.background = '#222';
                pixel.style.cursor = 'crosshair';
                pixel.dataset.x = x;
                pixel.dataset.y = y;

                // Mouse events
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

                pixel.addEventListener('contextmenu', (e) => e.preventDefault());

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
            // Erase
            this.pixels[y][x] = null;
            pixel.style.background = '#222';
            pixel.classList.remove('filled');
        } else {
            // Draw with current color
            this.pixels[y][x] = this.currentColor;
            pixel.style.background = this.currentColor;
            pixel.classList.add('filled');
        }

        this.updatePreview();
    },

    createPreview() {
        const container = document.getElementById('pixelPreviewContainer');
        if (!container) return;

        container.innerHTML = '';

        this.previewCanvas = document.createElement('canvas');
        this.previewCanvas.width = 400;
        this.previewCanvas.height = 300;
        this.previewCanvas.style.border = '1px solid #333';
        this.previewCanvas.style.borderRadius = '4px';
        this.previewCanvas.style.background = '#0a0a0f';

        this.previewCtx = this.previewCanvas.getContext('2d');
        container.appendChild(this.previewCanvas);

        this.updatePreview();
    },

    updatePreview() {
        if (!this.previewCtx) return;

        const ctx = this.previewCtx;
        ctx.clearRect(0, 0, 400, 300);

        // Calculate bounds if auto-crop is enabled
        const bounds = this.getPixelBounds();
        if (!bounds) return;

        const spriteType = document.getElementById('objectSelect')?.value || 'player';
        const config = this.spriteConfigs[spriteType] || { gameWidth: 40, gameHeight: 50 };

        // Calculate scale to fit preview
        const padding = 20;
        const availableWidth = 400 - padding * 2;
        const availableHeight = 300 - padding * 2;

        const spriteW = bounds.maxX - bounds.minX + 1;
        const spriteH = bounds.maxY - bounds.minY + 1;

        const scaleX = availableWidth / (spriteW * 4);
        const scaleY = availableHeight / (spriteH * 4);
        const previewScale = Math.min(scaleX, scaleY, 20);

        const offsetX = (400 - spriteW * previewScale) / 2 - bounds.minX * previewScale;
        const offsetY = (300 - spriteH * previewScale) / 2 - bounds.minY * previewScale;

        // Draw pixels
        for (let y = bounds.minY; y <= bounds.maxY; y++) {
            for (let x = bounds.minX; x <= bounds.maxX; x++) {
                const color = this.pixels[y][x];
                if (color) {
                    ctx.shadowBlur = 0;
                    ctx.fillStyle = color;
                    ctx.fillRect(
                        offsetX + x * previewScale,
                        offsetY + y * previewScale,
                        previewScale + 0.5,
                        previewScale + 0.5
                    );
                }
            }
        }

        // Draw info
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#888';
        ctx.font = '11px monospace';
        ctx.fillText(`${spriteW}×${spriteH} pixels | Scale: ${previewScale.toFixed(1)}x`, 10, 290);
    },

    getPixelBounds() {
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

        if (maxX < minX) return null; // Empty

        return { minX, maxX, minY, maxY };
    },

    initColorPicker() {
        const container = document.getElementById('colorPicker');
        if (!container) return;

        container.innerHTML = '';

        this.palette.forEach(color => {
            const swatch = document.createElement('div');
            swatch.className = 'color-swatch' + (color === this.currentColor ? ' selected' : '');
            swatch.style.background = color;
            swatch.dataset.color = color;

            swatch.addEventListener('click', () => {
                document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
                swatch.classList.add('selected');
                this.currentColor = color;
            });

            container.appendChild(swatch);
        });

        // Custom color picker
        const customWrapper = document.createElement('div');
        customWrapper.style.cssText = 'position:relative;';

        const customInput = document.createElement('input');
        customInput.type = 'color';
        customInput.value = this.currentColor;
        customInput.style.cssText = 'width:28px;height:28px;border:none;cursor:pointer;';

        customInput.addEventListener('input', (e) => {
            this.currentColor = e.target.value;
            document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
        });

        customWrapper.appendChild(customInput);
        container.appendChild(customWrapper);
    },

    initScaleControls() {
        const scaleSlider = document.getElementById('pixelScaleSlider');
        const scaleValue = document.getElementById('pixelScaleValue');

        if (scaleSlider) {
            scaleSlider.min = this.minScale;
            scaleSlider.max = this.maxScale;
            scaleSlider.value = this.currentScale;

            scaleSlider.addEventListener('input', (e) => {
                this.currentScale = parseInt(e.target.value);
                if (scaleValue) scaleValue.textContent = `${this.currentScale}x`;
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

    uploadHandlersInitialized: false,

    initUploadHandlers() {
        if (this.uploadHandlersInitialized) return;
        this.uploadHandlersInitialized = true;

        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('imageUpload');

        if (uploadArea) {
            uploadArea.addEventListener('click', () => fileInput?.click());

            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadArea.style.borderColor = '#00ff88';
            });

            uploadArea.addEventListener('dragleave', () => {
                uploadArea.style.borderColor = '#333';
            });

            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.style.borderColor = '#333';
                const file = e.dataTransfer?.files[0];
                if (file && file.type.startsWith('image/')) {
                    this.processImage(file);
                }
            });
        }

        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files?.[0];
                if (file) this.processImage(file);
            });
        }

        // Upload type toggle
        const uploadType = document.getElementById('uploadType');
        if (uploadType) {
            uploadType.addEventListener('change', (e) => {
                this.uploadMode = e.target.value; // 'sprite' or 'background'
            });
        }
    },

    uploadMode: 'sprite', // 'sprite' or 'background'

    processImage(file) {
        const reader = new FileReader();

        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                this.originalImage = img;

                if (this.uploadMode === 'background') {
                    this.processAsBackground(img);
                } else {
                    this.processAsSprite(img);
                }
            };
            img.src = e.target.result;
        };

        reader.readAsDataURL(file);
    },

    processAsSprite(img) {
        SmartProcessor.processImage(img, 'sprite', {
            gridWidth: this.gridWidth,
            gridHeight: this.gridHeight,
            outlineEnabled: true,
            outlineColor: '#000000'
        }).then(result => {
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
            this.showNotification('Sprite convertido a pixel art');
        }).catch(err => {
            console.error(err);
            this.showNotification('Error al convertir', 'error');
        });
    },

    processAsBackground(img) {
        // For backgrounds, scale to larger resolution (128x128)
        const bgWidth = 128;
        const bgHeight = 128;

        const canvas = document.createElement('canvas');
        canvas.width = bgWidth;
        canvas.height = bgHeight;
        const ctx = canvas.getContext('2d');

        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, 0, 0, bgWidth, bgHeight);

        const imageData = ctx.getImageData(0, 0, bgWidth, bgHeight);
        const data = imageData.data;

        const colorMap = this.quantizeColors(data, 16);

        // Store background data separately
        this.backgroundPixels = [];
        for (let y = 0; y < bgHeight; y++) {
            this.backgroundPixels[y] = [];
            for (let x = 0; x < bgWidth; x++) {
                const i = (y * bgWidth + x) * 4;
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                const a = data[i + 3];

                if (a > 128) {
                    this.backgroundPixels[y][x] = this.findClosestColor(`rgb(${r},${g},${b})`, colorMap);
                } else {
                    this.backgroundPixels[y][x] = null;
                }
            }
        }

        // Convert to text format and store
        this.backgroundText = this.pixelsToText(this.backgroundPixels, bgWidth, bgHeight);

        this.showNotification('Fondo convertido (128x128)');
    },

    quantizeColors(data, numColors) {
        const colors = [];

        for (let i = 0; i < data.length; i += 4) {
            if (data[i + 3] > 128) { // Only opaque pixels
                colors.push({
                    r: data[i],
                    g: data[i + 1],
                    b: data[i + 2]
                });
            }
        }

        // Simple quantization - k-means would be better but this works
        const step = Math.ceil(256 / Math.cbrt(numColors));
        const quantized = [];

        for (let r = 0; r < 256; r += step) {
            for (let g = 0; g < 256; g += step) {
                for (let b = 0; b < 256; b += step) {
                    quantized.push({ r, g, b });
                }
            }
        }

        return quantized.slice(0, numColors);
    },

    findClosestColor(rgbStr, palette) {
        const match = rgbStr.match(/rgb\((\d+),(\d+),(\d+)\)/);
        if (!match) return this.currentColor;

        const r = parseInt(match[1]);
        const g = parseInt(match[2]);
        const b = parseInt(match[3]);

        let closest = palette[0];
        let minDist = Infinity;

        for (const color of palette) {
            const dist = Math.sqrt(
                Math.pow(r - color.r, 2) +
                Math.pow(g - color.g, 2) +
                Math.pow(b - color.b, 2)
            );

            if (dist < minDist) {
                minDist = dist;
                closest = color;
            }
        }

        // Map to our palette
        const hex = this.rgbToHex(closest.r, closest.g, closest.b);

        // Map to known colors
        if (hex === '#000000' || hex === '#111111' || hex === '#222222') return '#333333';
        if (hex === '#ffffff') return '#ffffff';
        if (hex === '#ff0000' || hex === '#cc0000') return '#ff0000';
        if (this.isCloseTo(hex, '#00ff88')) return '#00ff88';
        if (this.isCloseTo(hex, '#00cc6a')) return '#00cc6a';
        if (this.isCloseTo(hex, '#ff6b6b')) return '#ff6b6b';
        if (this.isCloseTo(hex, '#ffd93d')) return '#ffd93d';
        if (this.isCloseTo(hex, '#c792ea')) return '#c792ea';
        if (this.isCloseTo(hex, '#00ffff')) return '#00ffff';
        if (this.isCloseTo(hex, '#ff8800')) return '#ff8800';

        return hex;
    },

    isCloseTo(hex1, hex2, threshold = 30) {
        const c1 = this.hexToRgb(hex1);
        const c2 = this.hexToRgb(hex2);
        if (!c1 || !c2) return false;

        return Math.abs(c1.r - c2.r) < threshold &&
               Math.abs(c1.g - c2.g) < threshold &&
               Math.abs(c1.b - c2.b) < threshold;
    },

    rgbToHex(r, g, b) {
        return '#' + [r, g, b].map(x => {
            const hex = x.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        }).join('');
    },

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    },

    pixelsToText(pixels, width, height) {
        const lines = [];
        for (let y = 0; y < height; y++) {
            let line = '';
            for (let x = 0; x < width; x++) {
                const color = pixels[y]?.[x];
                if (!color) {
                    line += ' ';
                } else if (this.colorChars[color]) {
                    line += this.colorChars[color];
                } else {
                    line += 'C';
                }
            }
            lines.push(line);
        }
        return lines;
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
                pixel.style.background = '#222';
                pixel.classList.remove('filled');
            }
        });
    },

    exportSprite() {
        const bounds = this.getPixelBounds();
        if (!bounds) {
            this.showNotification('No hay sprite para exportar', 'error');
            return null;
        }

        const width = bounds.maxX - bounds.minX + 1;
        const height = bounds.maxY - bounds.minY + 1;

        const pixels = [];
        for (let y = bounds.minY; y <= bounds.maxY; y++) {
            pixels[y - bounds.minY] = [];
            for (let x = bounds.minX; x <= bounds.maxX; x++) {
                const color = this.pixels[y][x];
                if (!color) {
                    pixels[y - bounds.minY][x - bounds.minX] = null;
                } else {
                    pixels[y - bounds.minY][x - bounds.minX] = color;
                }
            }
        }

        return {
            width,
            height,
            pixels,
            color: this.currentColor
        };
    },

    clearGrid() {
        if (!confirm('¿Limpiar el lienzo?')) return;
        this.initPixels();
        this.renderGrid();
        this.updatePreview();
    },

    fillEmpty() {
        // Flood fill starting from top-left corner
        const filled = new Set();

        const fill = (x, y, targetColor, replacementColor) => {
            if (x < 0 || x >= this.gridWidth || y < 0 || y >= this.gridHeight) return;
            if (filled.has(`${x},${y}`)) return;
            if (this.pixels[y][x] !== targetColor && this.pixels[y][x] !== null) return;

            this.pixels[y][x] = replacementColor;
            filled.add(`${x},${y}`);

            fill(x + 1, y, targetColor, replacementColor);
            fill(x - 1, y, targetColor, replacementColor);
            fill(x, y + 1, targetColor, replacementColor);
            fill(x, y - 1, targetColor, replacementColor);
        };

        fill(0, 0, null, this.currentColor);
        this.renderGrid();
        this.updatePreview();
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

        // Swap dimensions
        [this.gridWidth, this.gridHeight] = [this.gridHeight, this.gridWidth];

        this.renderGrid();
        this.updatePreview();
    },

    showNotification(message, type = 'success') {
        const notif = document.getElementById('notification');
        if (notif) {
            notif.textContent = message;
            notif.className = 'notification show' + (type === 'error' ? ' error' : '');
            setTimeout(() => notif.classList.remove('show'), 2000);
        }
    },

    getStats() {
        const bounds = this.getPixelBounds();
        if (!bounds) return { width: 0, height: 0, pixels: 0 };

        let pixelCount = 0;
        for (let y = bounds.minY; y <= bounds.maxY; y++) {
            for (let x = bounds.minX; x <= bounds.maxX; x++) {
                if (this.pixels[y][x]) pixelCount++;
            }
        }

        return {
            width: bounds.maxX - bounds.minX + 1,
            height: bounds.maxY - bounds.minY + 1,
            pixels: pixelCount
        };
    }
};

// ============================================================================
// SPRITE MANAGER
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
        const offsetX = (48 - (cfg.pixels[0]?.length || 1) * pixelW) / 2;
        const offsetY = (48 - cfg.pixels.length * pixelW) / 2;

        ctx.shadowBlur = 3;
        cfg.pixels.forEach((row, py) => {
            for (let px = 0; px < row.length; px++) {
                const char = row[px];
                if (char !== ' ' && char !== null && char !== undefined) {
                    let color;
                    if (typeof char === 'string' && char.startsWith('#')) {
                        color = char;
                    } else {
                        color = this.getColorForChar(char, cfg.color);
                    }
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

    uploadZoneInitialized: false,

    initUploadZone() {
        if (this.uploadZoneInitialized) return;
        this.uploadZoneInitialized = true;

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

    async uploadSpriteImage(file) {
        if (!this.selectedSprite) {
            PixelEditor.showNotification('Selecciona un sprite primero', 'error');
            return;
        }
        await this.uploadSpriteImageForKey(file, this.selectedSprite);
    },

    async uploadSpriteImageForKey(file, key) {
        PixelEditor.showNotification('Procesando imagen...');

        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const img = new Image();
                img.onload = async () => {
                    try {
                        const result = await SmartProcessor.processImage(img, 'sprite', {
                            gridWidth: 64,
                            gridHeight: 64,
                            outlineEnabled: true,
                            outlineColor: '#000000'
                        });

                        this.applyToSprite(key, result);
                        resolve();
                    } catch (err) {
                        console.error(err);
                        PixelEditor.showNotification('Error al procesar', 'error');
                        reject(err);
                    }
                };
                img.onerror = () => {
                    PixelEditor.showNotification('Error al cargar imagen', 'error');
                    reject(new Error('Image load failed'));
                };
                img.src = e.target.result;
            };
            reader.onerror = () => {
                PixelEditor.showNotification('Error al leer archivo', 'error');
                reject(new Error('FileReader failed'));
            };
            reader.readAsDataURL(file);
        });
    },

    applyToSprite(key, result) {
        const cfg = window.G?.config?.[key];
        if (!cfg) return;

        cfg.pixels = result.pixels;
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

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('pixelGridContainer')) {
        PixelEditor.init();
    }
    if (document.getElementById('spriteGrid')) {
        SpriteManager.init();
    }
});

// Make globally available
window.PixelEditor = PixelEditor;
window.SmartProcessor = SmartProcessor;
window.SpriteManager = SpriteManager;