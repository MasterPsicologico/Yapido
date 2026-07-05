// ============================================================================
// TILEMAP ENGINE - Bitmask Autotiling + Parallax Layers + Free Decorations
// ============================================================================

const TilemapEngine = {
    maps: new Map(),
    currentMap: null,

    tileAtlas: null,
    tileSize: 16,
    atlasColumns: 16,

    BITMASK: {
        NONE: 0,
        TOP: 1,
        RIGHT: 2,
        BOTTOM: 4,
        LEFT: 8,
        TOP_RIGHT: 16,
        BOTTOM_RIGHT: 32,
        BOTTOM_LEFT: 64,
        TOP_LEFT: 128
    },

    createMap(mapId, width, height, tileSize = 16) {
        const map = {
            id: mapId,
            width,
            height,
            tileSize,
            layers: [],
            decorations: [],
            tiles: [],
            collisionMap: []
        };

        for (let y = 0; y < height; y++) {
            map.tiles[y] = [];
            map.collisionMap[y] = [];
            for (let x = 0; x < width; x++) {
                map.tiles[y][x] = { tileId: -1, flippedX: false, flippedY: false, variant: 0 };
                map.collisionMap[y][x] = 0;
            }
        }

        this.maps.set(mapId, map);
        return map;
    },

    addLayer(mapId, layerConfig) {
        const map = this.maps.get(mapId);
        if (!map) return null;

        const layer = {
            name: layerConfig.name || `Layer ${map.layers.length + 1}`,
            type: layerConfig.type || 'tile',
            parallaxX: layerConfig.parallaxX !== undefined ? layerConfig.parallaxX : 1,
            parallaxY: layerConfig.parallaxY !== undefined ? layerConfig.parallaxY : 1,
            visible: true,
            locked: false,
            opacity: layerConfig.opacity || 1,
            zIndex: map.layers.length
        };

        map.layers.push(layer);
        return layer;
    },

    setTile(mapId, layerIndex, x, y, tileId, options = {}) {
        const map = this.maps.get(mapId);
        if (!map || x < 0 || x >= map.width || y < 0 || y >= map.height) return;

        const tile = map.tiles[y][x];
        tile.tileId = tileId;
        tile.flippedX = options.flippedX || false;
        tile.flippedY = options.flippedY || false;
        tile.variant = options.variant || 0;
        tile.rotation = options.rotation || 0;

        if (options.collision !== undefined) {
            map.collisionMap[y][x] = options.collision;
        }

        this.updateAutotiles(mapId, x, y);
    },

    updateAutotiles(mapId, changedX, changedY) {
        const map = this.maps.get(mapId);
        if (!map) return;

        for (let y = Math.max(0, changedY - 1); y <= Math.min(map.height - 1, changedY + 1); y++) {
            for (let x = Math.max(0, changedX - 1); x <= Math.min(map.width - 1, changedX + 1); x++) {
                const tile = map.tiles[y][x];
                if (tile.tileId >= 0) {
                    const bitmask = this.calculateBitmask(map, x, y, tile.tileId);
                    tile.autotileBitmask = bitmask;
                    tile.variant = this.getAutotileVariant(bitmask);
                }
            }
        }
    },

    calculateBitmask(map, x, y, baseTileId) {
        const getTile = (dx, dy) => {
            if (dx === 0 && dy === 0) return true;
            const nx = x + dx, ny = y + dy;
            if (nx < 0 || nx >= map.width || ny < 0 || ny >= map.height) return false;
            return map.tiles[ny][nx].tileId === baseTileId;
        };

        let bitmask = this.BITMASK.NONE;

        if (getTile(0, -1)) bitmask |= this.BITMASK.TOP;
        if (getTile(1, 0)) bitmask |= this.BITMASK.RIGHT;
        if (getTile(0, 1)) bitmask |= this.BITMASK.BOTTOM;
        if (getTile(-1, 0)) bitmask |= this.BITMASK.LEFT;

        if (getTile(1, -1)) bitmask |= this.BITMASK.TOP_RIGHT;
        if (getTile(1, 1)) bitmask |= this.BITMASK.BOTTOM_RIGHT;
        if (getTile(-1, 1)) bitmask |= this.BITMASK.BOTTOM_LEFT;
        if (getTile(-1, -1)) bitmask |= this.BITMASK.TOP_LEFT;

        return bitmask;
    },

    getAutotileVariant(bitmask) {
        const autotileTable = {
            0: 0,
            1: 1,
            2: 2,
            3: 3,
            4: 4,
            5: 5,
            6: 6,
            7: 7,
            8: 8,
            9: 9,
            10: 10,
            11: 11,
            12: 12,
            13: 13,
            14: 14,
            15: 15
        };

        return autotileTable[bitmask] || 0;
    },

    addDecoration(mapId, decoration) {
        const map = this.maps.get(mapId);
        if (!map) return;

        map.decorations.push({
            id: decoration.id || `decoration_${Date.now()}`,
            spriteKey: decoration.spriteKey,
            x: decoration.x,
            y: decoration.y,
            z: decoration.z || 0,
            rotation: decoration.rotation || 0,
            scaleX: decoration.scaleX || 1,
            scaleY: decoration.scaleY || 1,
            layer: decoration.layer || 'decorations'
        });
    },

    removeDecoration(mapId, decorationId) {
        const map = this.maps.get(mapId);
        if (!map) return;

        map.decorations = map.decorations.filter(d => d.id !== decorationId);
    },

    renderToContainer(mapId, container, spriteGetter) {
        const map = this.maps.get(mapId);
        if (!map) return;

        container.removeChildren();

        const sortedLayers = [...map.layers].sort((a, b) => a.zIndex - b.zIndex);

        sortedLayers.forEach(layer => {
            if (!layer.visible) return;

            const layerContainer = new PIXI.Container();
            layerContainer.label = layer.name;

            const parallaxMultiplier = { x: layer.parallaxX, y: layer.parallaxY };

            if (layer.type === 'tile') {
                for (let y = 0; y < map.height; y++) {
                    for (let x = 0; x < map.width; x++) {
                        const tile = map.tiles[y][x];
                        if (tile.tileId < 0) continue;

                        const tileSprite = this.getTileSprite(tile, spriteGetter);
                        if (tileSprite) {
                            tileSprite.x = x * map.tileSize;
                            tileSprite.y = y * map.tileSize;

                            if (tile.flippedX) tileSprite.scale.x *= -1;
                            if (tile.flippedY) tileSprite.scale.y *= -1;
                            if (tile.rotation) tileSprite.rotation = tile.rotation * Math.PI / 180;

                            tileSprite.parallaxMultiplier = parallaxMultiplier;
                            tileSprite.alpha = layer.opacity;

                            layerContainer.addChild(tileSprite);
                        }
                    }
                }
            }

            if (layer.type === 'decoration' || layer.type === 'sprite') {
                const relevantDecorations = map.decorations.filter(d => d.layer === layer.name);
                relevantDecorations.forEach(dec => {
                    const sprite = spriteGetter(dec.spriteKey);
                    if (sprite) {
                        sprite.x = dec.x;
                        sprite.y = dec.y;
                        sprite.rotation = dec.rotation * Math.PI / 180;
                        sprite.scale.x = dec.scaleX;
                        sprite.scaleY = dec.scaleY;
                        sprite.parallaxMultiplier = parallaxMultiplier;
                        sprite.zIndex = dec.z;

                        layerContainer.addChild(sprite);
                    }
                });
            }

            container.addChild(layerContainer);
        });
    },

    getTileSprite(tile, spriteGetter) {
        if (!this.tileAtlas) return null;

        const atlasColumn = this.atlasColumns || 16;
        const tileSize = this.tileSize || 16;

        let frameX = tile.variant % atlasColumn;
        let frameY = Math.floor(tile.variant / atlasColumn);

        const frame = new PIXI.Rectangle(
            frameX * tileSize,
            frameY * tileSize,
            tileSize,
            tileSize
        );

        const texture = new PIXI.Texture(this.tileAtlas.baseTexture, frame);
        const sprite = new PIXI.Sprite(texture);

        return sprite;
    },

    setTileAtlas(atlasTexture, tileSize = 16, columns = 16) {
        this.tileAtlas = atlasTexture;
        this.tileSize = tileSize;
        this.atlasColumns = columns;
    },

    getCollision(mapId, x, y) {
        const map = this.maps.get(mapId);
        if (!map) return 0;

        const tileX = Math.floor(x / map.tileSize);
        const tileY = Math.floor(y / map.tileSize);

        if (tileX < 0 || tileX >= map.width || tileY < 0 || tileY >= map.height) return 1;

        return map.collisionMap[tileY][tileX];
    },

    isColliding(mapId, x, y, width, height) {
        const points = [
            { x, y },
            { x: x + width, y },
            { x, y: y + height },
            { x: x + width, y: y + height }
        ];

        return points.some(p => this.getCollision(mapId, p.x, p.y) === 1);
    },

    renderParallax(container, cameraX, cameraY, containerWidth, containerHeight) {
        container.children.forEach(layerContainer => {
            const parallax = layerContainer.parallaxMultiplier || { x: 1, y: 1 };

            layerContainer.x = -cameraX * (1 - parallax.x);
            layerContainer.y = -cameraY * (1 - parallax.y);
        });
    },

    exportMap(mapId) {
        const map = this.maps.get(mapId);
        if (!map) return null;

        return JSON.stringify({
            id: map.id,
            width: map.width,
            height: map.height,
            tileSize: map.tileSize,
            layers: map.layers,
            tiles: map.tiles,
            decorations: map.decorations,
            collisionMap: map.collisionMap
        });
    },

    importMap(mapId, mapData) {
        try {
            const data = typeof mapData === 'string' ? JSON.parse(mapData) : mapData;

            const map = this.createMap(mapId, data.width, data.height, data.tileSize);
            map.layers = data.layers;
            map.decorations = data.decorations || [];

            data.tiles.forEach((row, y) => {
                row.forEach((tile, x) => {
                    if (tile.tileId >= 0) {
                        map.tiles[y][x] = tile;
                    }
                });
            });

            if (data.collisionMap) {
                data.collisionMap.forEach((row, y) => {
                    map.collisionMap[y] = row;
                });
            }

            return map;
        } catch (e) {
            console.error('Failed to import map:', e);
            return null;
        }
    },

    saveToLocalStorage(mapId) {
        const mapData = this.exportMap(mapId);
        if (mapData) {
            localStorage.setItem(`tilemap_${mapId}`, mapData);
        }
    },

    loadFromLocalStorage(mapId) {
        const mapData = localStorage.getItem(`tilemap_${mapId}`);
        if (mapData) {
            return this.importMap(mapId, mapData);
        }
        return null;
    }
};

window.TilemapEngine = TilemapEngine;