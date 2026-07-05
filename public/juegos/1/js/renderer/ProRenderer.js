// ============================================================================
// PRO RENDERER INTEGRATION - Connects PixiJS + Shaders + Animation + Tilemap
// ============================================================================

const ProRenderer = {
    initialized: false,

    async init(canvasId) {
        if (this.initialized) return;

        try {
            await PixiRenderer.init(canvasId);
            this.initialized = true;
            console.log('[ProRenderer] Initialized with WebGL + Shaders');
        } catch (e) {
            console.error('[ProRenderer] Failed to initialize:', e);
        }
    },

    createSpriteWithNormalMap(albedoSrc, normalSrc, options = {}) {
        const albedoTexture = PixiRenderer.getTextureFromImageSrc(albedoSrc);
        let normalTexture = null;

        if (normalSrc) {
            normalTexture = PixiRenderer.getTextureFromImageSrc(normalSrc);
        }

        const sprite = LightingShader.createSpriteWithLighting(
            albedoTexture,
            normalTexture,
            options
        );

        return sprite;
    },

    async loadSpritePair(albedoUrl, normalUrl, options = {}) {
        try {
            let albedoTexture, normalTexture;

            if (albedoUrl) {
                albedoTexture = await PixiRenderer.loadImage(albedoUrl);
            }

            if (normalUrl) {
                normalTexture = await PixiRenderer.loadImage(normalUrl);
            } else if (albedoUrl) {
                const albedoImg = albedoTexture.source;
                if (albedoImg && albedoImg.complete) {
                    normalTexture = LightingShader.createNormalMapFromHeightmap({
                        width: albedoImg.width,
                        height: albedoImg.height,
                        source: albedoImg
                    });
                }
            }

            const sprite = LightingShader.createSpriteWithLighting(
                albedoTexture,
                normalTexture,
                options
            );

            return sprite;
        } catch (e) {
            console.error('[ProRenderer] Failed to load sprite pair:', e);
            return null;
        }
    },

    updateSpriteMaterial(sprite, options) {
        LightingShader.updateMaterialProperties(sprite, options);
    },

    updateLight(sprite, lightX, lightY, lightZ) {
        LightingShader.updateLightPosition(sprite, lightX, lightY, lightZ);
    },

    createAnimatedSprite(spriteKey, config = {}) {
        const sprite = PixiRenderer.createSimpleSprite(
            PixiRenderer.getTextureFromImageSrc(config.textureUrl),
            { x: config.x || 0, y: config.y || 0 }
        );

        const entity = AnimationManager.createAnimatedEntity(sprite, {
            bones: config.bones || {
                body: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1 }
            },
            states: config.states || {
                idle: {
                    clips: [{ bones: { body: [{ time: 0, rotation: 0, scaleX: 1, scaleY: 1 }] } }],
                    duration: 1000,
                    loop: true
                }
            }
        });

        return { sprite, entity };
    },

    update(deltaTime) {
        AnimationManager.update(deltaTime);
    },

    createTilemap(mapId, width, height, tileSize = 16) {
        return TilemapEngine.createMap(mapId, width, height, tileSize);
    },

    addTilemapLayer(mapId, layerConfig) {
        return TilemapEngine.addLayer(mapId, layerConfig);
    },

    setTilemapTile(mapId, layerIndex, x, y, tileId, options = {}) {
        TilemapEngine.setTile(mapId, layerIndex, x, y, tileId, options);
    },

    renderTilemap(mapId, layerName = 'tilemap') {
        const layer = PixiRenderer.spriteLayers[layerName];
        if (layer) {
            TilemapEngine.renderToContainer(mapId, layer, (key) => {
                return PixiRenderer.createSimpleSprite(
                    PixiRenderer.getTextureFromImageSrc(window.G?.config?.[key]?.textureUrl || window.G?.config?.[key]?.pixels)
                );
            });
        }
    },

    getWidth() {
        return PixiRenderer.getWidth();
    },

    getHeight() {
        return PixiRenderer.getHeight();
    },

    getApp() {
        return PixiRenderer.app;
    },

    addToLayer(layerName, displayObject) {
        PixiRenderer.addToLayer(layerName, displayObject);
    },

    clearLayer(layerName) {
        PixiRenderer.clearLayer(layerName);
    },

    addLight(x, y, color, intensity, radius) {
        return PixiRenderer.addLight(x, y, color, intensity, radius);
    },

    updateLights(playerX, playerY) {
        PixiRenderer.updateLights(playerX, playerY);
    }
};

window.ProRenderer = ProRenderer;