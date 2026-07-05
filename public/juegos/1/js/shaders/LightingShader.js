// ============================================================================
// LIGHTING SHADER SYSTEM - GLSL Lambert + Normal Maps + Material Properties
// ============================================================================

const LightingShader = {
    vertexShader: `
        attribute vec2 aVertexPosition;
        attribute vec2 aTextureCoord;

        uniform mat3 projectionMatrix;
        uniform mat3 translationMatrix;
        uniform mat3 uTextureMatrix;

        varying vec2 vTextureCoord;

        void main(void) {
            gl_Position = vec4((projectionMatrix * translationMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);
            vTextureCoord = (uTextureMatrix * vec3(aTextureCoord, 1.0)).xy;
        }
    `,

    fragmentShader: `
        precision mediump float;

        varying vec2 vTextureCoord;

        uniform sampler2D uSampler;
        uniform sampler2D uNormalMap;
        uniform bool uHasNormalMap;

        uniform vec3 uLightPosition;
        uniform vec3 uLightColor;
        uniform float uLightIntensity;
        uniform float uAmbientIntensity;
        uniform vec3 uAmbientColor;

        uniform float uShininess;
        uniform vec3 uEmissionColor;
        uniform float uEmissionIntensity;

        uniform vec2 uResolution;

        void main(void) {
            vec4 texColor = texture2D(uSampler, vTextureCoord);

            if (texColor.a < 0.1) {
                gl_FragColor = vec4(0.0);
                return;
            }

            vec3 lightDir = normalize(uLightPosition);

            vec3 normal;
            if (uHasNormalMap) {
                vec3 normalMapColor = texture2D(uNormalMap, vTextureCoord).rgb * 2.0 - 1.0;
                normal = normalize(normalMapColor);
            } else {
                normal = vec3(0.0, 0.0, 1.0);
            }

            float lambert = max(dot(normal, lightDir), 0.0);

            vec3 viewDir = normalize(vec3(0.5, 0.5, 1.0));
            vec3 halfDir = normalize(lightDir + viewDir);
            float specular = pow(max(dot(normal, halfDir), 0.0), uShininess * 128.0);

            vec3 diffuse = texColor.rgb * lambert * uLightColor * uLightIntensity;
            vec3 ambient = texColor.rgb * uAmbientColor * uAmbientIntensity;
            vec3 specularLight = uLightColor * specular * uShininess * uLightIntensity;
            vec3 emission = uEmissionColor * uEmissionIntensity;

            vec3 finalColor = ambient + diffuse + specularLight + emission;

            gl_FragColor = vec4(finalColor, texColor.a);
        }
    `,

    filters: [],

    createLitFilter(options = {}) {
        const {
            lightPosition = { x: 100, y: 100, z: 50 },
            lightColor = [1, 1, 1],
            lightIntensity = 1.0,
            ambientIntensity = 0.3,
            ambientColor = [0.1, 0.1, 0.15],
            shininess = 0.5,
            emissionColor = [0, 0, 0],
            emissionIntensity = 0,
            hasNormalMap = false
        } = options;

        const uniforms = {
            uLightPosition: { type: 'vec3', value: [lightPosition.x, lightPosition.y, lightPosition.z] },
            uLightColor: { type: 'vec3', value: lightColor },
            uLightIntensity: { type: 'float', value: lightIntensity },
            uAmbientIntensity: { type: 'float', value: ambientIntensity },
            uAmbientColor: { type: 'vec3', value: ambientColor },
            uShininess: { type: 'float', value: shininess },
            uEmissionColor: { type: 'vec3', value: emissionColor },
            uEmissionIntensity: { type: 'float', value: emissionIntensity },
            uHasNormalMap: { type: 'bool', value: hasNormalMap },
            uResolution: { type: 'vec2', value: [800, 600] },
            uTextureMatrix: { type: 'mat3', value: new PIXI.Matrix()] }
        };

        const filter = new PIXI.Filter(this.vertexShader, this.fragmentShader, uniforms);
        return filter;
    },

    createSpriteWithLighting(albedoTexture, normalTexture, options = {}) {
        const {
            x = 0,
            y = 0,
            anchor = { x: 0.5, y: 0.5 },
            scale = { x: 1, y: 1 },
            rotation = 0,
            shininess = 0.5,
            emissionColor = 0x000000,
            emissionIntensity = 0,
            layer = 'player'
        } = options;

        const container = new PIXI.Container();
        container.position.set(x, y);
        container.rotation = rotation;
        container.scale.set(scale.x, scale.y);

        const sprite = new PIXI.Sprite(albedoTexture);
        sprite.anchor.set(anchor.x, anchor.y);
        sprite.label = 'albedo';
        container.addChild(sprite);

        let normalSprite = null;
        let litFilter = null;

        if (normalTexture) {
            normalSprite = new PIXI.Sprite(normalTexture);
            normalSprite.anchor.set(anchor.x, anchor.y);
            normalSprite.label = 'normalMap';
            container.addChild(normalSprite);

            litFilter = this.createLitFilter({
                hasNormalMap: true,
                shininess,
                emissionColor: this.hexToRgb(emissionColor),
                emissionIntensity
            });

            sprite.filters = [litFilter];
            if (normalSprite) {
                normalSprite.filters = [litFilter];
            }
        }

        container.litFilter = litFilter;
        container.albedoTexture = albedoTexture;
        container.normalTexture = normalTexture;
        container.shininess = shininess;
        container.emissionColor = emissionColor;
        container.emissionIntensity = emissionIntensity;

        return container;
    },

    updateLightPosition(sprite, lightX, lightY, lightZ = 50) {
        if (sprite.litFilter) {
            sprite.litFilter.uniforms.uLightPosition.value = [lightX, lightY, lightZ];
        }
    },

    updateMaterialProperties(sprite, options = {}) {
        if (sprite.litFilter) {
            if (options.shininess !== undefined) {
                sprite.litFilter.uniforms.uShininess.value = options.shininess;
            }
            if (options.emissionColor !== undefined) {
                sprite.litFilter.uniforms.uEmissionColor.value = this.hexToRgb(options.emissionColor);
            }
            if (options.emissionIntensity !== undefined) {
                sprite.litFilter.uniforms.uEmissionIntensity.value = options.emissionIntensity;
            }
            if (options.lightIntensity !== undefined) {
                sprite.litFilter.uniforms.uLightIntensity.value = options.lightIntensity;
            }
        }
        if (options.emissionColor !== undefined) sprite.emissionColor = options.emissionColor;
        if (options.emissionIntensity !== undefined) sprite.emissionIntensity = options.emissionIntensity;
        if (options.shininess !== undefined) sprite.shininess = options.shininess;
    },

    hexToRgb(hex) {
        const r = ((hex >> 16) & 0xFF) / 255;
        const g = ((hex >> 8) & 0xFF) / 255;
        const b = (hex & 0xFF) / 255;
        return [r, g, b];
    },

    rgbToHex(r, g, b) {
        return (Math.round(r * 255) << 16) + (Math.round(g * 255) << 8) + Math.round(b * 255);
    },

    createNormalMapFromHeightmap(heightmapTexture, strength = 1.0) {
        const canvas = document.createElement('canvas');
        const width = heightmapTexture.width;
        const height = heightmapTexture.height;
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(heightmapTexture.source, 0, 0);

        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        const normalData = new Uint8ClampedArray(data.length);

        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const idx = (y * width + x) * 4;

                const left = ((y * width + (x - 1)) * 4);
                const right = ((y * width + (x + 1)) * 4);
                const top = (((y - 1) * width + x) * 4);
                const bottom = (((y + 1) * width + x) * 4);

                const heightL = data[left];
                const heightR = data[right];
                const heightT = data[top];
                const heightB = data[bottom];

                let nx = (heightL - heightR) * strength;
                let ny = (heightT - heightB) * strength;
                let nz = 1.0;

                const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
                nx /= len;
                ny /= len;
                nz /= len;

                normalData[idx] = Math.floor((nx * 0.5 + 0.5) * 255);
                normalData[idx + 1] = Math.floor((ny * 0.5 + 0.5) * 255);
                normalData[idx + 2] = Math.floor((nz * 0.5 + 0.5) * 255);
                normalData[idx + 3] = 255;
            }
        }

        const normalImageData = new ImageData(normalData, width, height);
        ctx.putImageData(normalImageData, 0, 0);

        const normalCanvas = document.createElement('canvas');
        normalCanvas.width = width;
        normalCanvas.height = height;
        const nctx = normalCanvas.getContext('2d');
        nctx.drawImage(canvas, 0, 0);

        return PIXI.Texture.from(normalCanvas.toDataURL());
    }
};

window.LightingShader = LightingShader;