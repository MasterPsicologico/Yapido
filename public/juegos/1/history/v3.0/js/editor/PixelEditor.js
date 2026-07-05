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
        ctx.shadowBlur = 5;

        for (let y = bounds.minY; y <= bounds.maxY; y++) {
            for (let x = bounds.minX; x <= bounds.maxX; x++) {
                const color = this.pixels[y][x];
                if (color) {
                    ctx.fillStyle = color;
                    ctx.shadowColor = color;
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

    initUploadHandlers() {
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
        // Create canvas at 64x64 for processing
        const canvas = document.createElement('canvas');
        canvas.width = this.gridWidth;
        canvas.height = this.gridHeight;
        const ctx = canvas.getContext('2d');

        // Calculate scaling to fit and center
        const scale = Math.min(this.gridWidth / img.width, this.gridHeight / img.height);
        const scaledW = img.width * scale;
        const scaledH = img.height * scale;
        const offsetX = (this.gridWidth - scaledW) / 2;
        const offsetY = (this.gridHeight - scaledH) / 2;

        // Draw scaled image
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, offsetX, offsetY, scaledW, scaledH);

        // Get pixel data and process
        const imageData = ctx.getImageData(0, 0, this.gridWidth, this.gridHeight);
        const data = imageData.data;

        // Color quantization for pixel art look
        const colorMap = this.quantizeColors(data, 12); // Limit to 12 main colors

        // Find bounds of actual content (trim transparent edges)
        let minX = this.gridWidth, maxX = 0, minY = this.gridHeight, maxY = 0;

        for (let y = 0; y < this.gridHeight; y++) {
            for (let x = 0; x < this.gridWidth; x++) {
                const i = (y * this.gridWidth + x) * 4;
                const alpha = data[i + 3];

                if (alpha > 128) { // Non-transparent pixel
                    minX = Math.min(minX, x);
                    maxX = Math.max(maxX, x);
                    minY = Math.min(minY, y);
                    maxY = Math.max(maxY, y);
                }
            }
        }

        // Clear pixels
        this.initPixels();

        // Draw pixel art
        for (let y = minY; y <= maxY; y++) {
            for (let x = minX; x <= maxX; x++) {
                const i = (y * this.gridWidth + x) * 4;
                const alpha = data[i + 3];
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];

                if (alpha > 128) {
                    const closestColor = this.findClosestColor(`rgb(${r},${g},${b})`, colorMap);
                    this.pixels[y][x] = closestColor;
                }
            }
        }

        this.renderGrid();
        this.updatePreview();
        this.showNotification('Sprite convertido a pixel art');
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
            let line = '';
            for (let x = bounds.minX; x <= bounds.maxX; x++) {
                const color = this.pixels[y][x];
                if (!color) {
                    line += ' ';
                } else if (this.colorChars[color]) {
                    line += this.colorChars[color];
                } else {
                    line += 'C';
                }
            }
            pixels.push(line);
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

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('pixelGridContainer')) {
        PixelEditor.init();
    }
});

// Make globally available
window.PixelEditor = PixelEditor;