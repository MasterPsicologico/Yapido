// ============================================================================
// PIXI WEBGL RENDERER - Professional rendering with PixiJS + Custom Shaders
// ============================================================================

const PixiRenderer = {
    app: null,
    worldContainer: null,
    spriteLayers: {},
    lights: [],
    ambientColor: 0x111122,
    ambientIntensity: 0.3,

    async init(canvasId) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return false;

        this.app = new PIXI.Application({
            view: canvas,
            width: canvas.clientWidth || 800,
            height: canvas.clientHeight || 600,
            backgroundColor: 0x0a0a0f,
            antialias: true,
            resolution: window.devicePixelRatio || 1,
            autoDensity: true,
        });

        this.worldContainer = new PIXI.Container();
        this.app.stage.addChild(this.worldContainer);

        this.createLayers();

        window.addEventListener('resize', () => this.resize());

        return true;
    },

    createLayers() {
        const layerNames = ['background', 'parallax-far', 'parallax-mid', 'tilemap', 'entities', 'player', 'particles', 'foreground', 'ui'];
        layerNames.forEach(name => {
            const layer = new PIXI.Container();
            layer.name = name;
            layer.sortableChildren = true;
            this.worldContainer.addChild(layer);
            this.spriteLayers[name] = layer;
        });
    },

    resize() {
        const canvas = document.getElementById('gameCanvas');
        if (canvas && this.app) {
            this.app.renderer.resize(canvas.clientWidth, canvas.clientHeight);
            if (this.worldContainer) {
                this.worldContainer.scale.set(1);
            }
        }
    },

    clearLayer(layerName) {
        const layer = this.spriteLayers[layerName];
        if (layer) {
            layer.removeChildren();
        }
    },

    createLitSprite(texture, normalTexture, options = {}) {
        const {
            x = 0,
            y = 0,
            anchor = { x: 0.5, y: 0.5 },
            shininess = 0.5,
            emissionColor = 0x000000,
            emissionIntensity = 0
        } = options;

        const container = new PIXI.Container();
        container.position.set(x, y);
        container.label = 'lit-sprite';

        const sprite = new PIXI.Sprite(texture);
        sprite.anchor.set(anchor.x, anchor.y);
        container.addChild(sprite);

        if (normalTexture) {
            const normalSprite = new PIXI.Sprite(normalTexture);
            normalSprite.anchor.set(anchor.x, anchor.y);
            normalSprite.label = 'normalMap';
            container.addChild(normalSprite);
        }

        container.label = 'litSprite';
        container.shininess = shininess;
        container.emissionColor = emissionColor;
        container.emissionIntensity = emissionIntensity;

        return container;
    },

    createSimpleSprite(texture, options = {}) {
        const {
            x = 0,
            y = 0,
            anchor = { x: 0.5, y: 0.5 },
            scale = { x: 1, y: 1 },
            rotation = 0,
            alpha = 1
        } = options;

        const sprite = new PIXI.Sprite(texture);
        sprite.position.set(x, y);
        sprite.anchor.set(anchor.x, anchor.y);
        sprite.scale.set(scale.x, scale.y);
        sprite.rotation = rotation;
        sprite.alpha = alpha;

        return sprite;
    },

    addLight(x, y, color = 0xffffff, intensity = 1, radius = 200) {
        const light = { x, y, color, intensity, radius };
        this.lights.push(light);
        return light;
    },

    updateLights(playerX, playerY) {
        this.lights.forEach(light => {
            const dx = light.x - playerX;
            const dy = light.y - playerY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const maxDist = light.radius;

            if (dist < maxDist) {
                light.currentIntensity = light.intensity * (1 - dist / maxDist);
            } else {
                light.currentIntensity = 0;
            }
        });
    },

    addToLayer(layerName, displayObject) {
        const layer = this.spriteLayers[layerName];
        if (layer) {
            layer.addChild(displayObject);
        }
    },

    removeFromLayer(layerName, displayObject) {
        const layer = this.spriteLayers[layerName];
        if (layer && displayObject.parent === layer) {
            layer.removeChild(displayObject);
        }
    },

    getTextureFromCanvas(canvas) {
        return PIXI.Texture.from(canvas.toDataURL());
    },

    getTextureFromImageSrc(src) {
        return PIXI.Texture.from(src);
    },

    async loadImage(url) {
        return new Promise((resolve, reject) => {
            PIXI.Assets.load(url).then(texture => {
                resolve(texture);
            }).catch(reject);
        });
    },

    render() {
        if (this.app) {
            this.app.render();
        }
    },

    getWidth() {
        return this.app?.screen.width || 800;
    },

    getHeight() {
        return this.app?.screen.height || 600;
    }
};

window.PixiRenderer = PixiRenderer;