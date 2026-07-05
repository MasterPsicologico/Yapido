// ============================================================================
// ANIMATION MANAGER - LERP Interpolation + State Machine with Blend Transitions
// ============================================================================

const AnimationManager = {
    entities: new Map(),

    createAnimatedEntity(sprite, config = {}) {
        const entity = {
            sprite,
            bones: new Map(),
            states: new Map(),
            currentState: null,
            previousState: null,
            blendFactor: 0,
            blendDuration: 0.2,
            blendTimer: 0,
            time: 0,
            speed: 1,
            loop: true,
            flippedX: false,
            flippedY: false
        };

        if (config.bones) {
            Object.entries(config.bones).forEach(([name, bone]) => {
                entity.bones.set(name, {
                    name,
                    x: bone.x || 0,
                    y: bone.y || 0,
                    rotation: bone.rotation || 0,
                    scaleX: bone.scaleX || 1,
                    scaleY: bone.scaleY || 1,
                    pivotX: bone.pivotX || 0,
                    pivotY: bone.pivotY || 0
                });
            });
        }

        if (config.states) {
            Object.entries(config.states).forEach(([name, state]) => {
                entity.states.set(name, {
                    name,
                    clips: state.clips || [],
                    duration: state.duration || 1000,
                    loop: state.loop !== undefined ? state.loop : true,
                    transitionTo: state.transitionTo || [],
                    blendDuration: state.blendDuration || 0.2
                });
            });
        }

        this.entities.set(sprite.label || sprite.uuid, entity);
        return entity;
    },

    addState(entityId, stateName, stateConfig) {
        const entity = this.entities.get(entityId);
        if (!entity) return;

        entity.states.set(stateName, {
            name: stateName,
            clips: stateConfig.clips || [],
            duration: stateConfig.duration || 1000,
            loop: stateConfig.loop !== undefined ? stateConfig.loop : true,
            transitionTo: stateConfig.transitionTo || [],
            blendDuration: stateConfig.blendDuration || 0.2
        });
    },

    addBone(entityId, boneName, boneConfig) {
        const entity = this.entities.get(entityId);
        if (!entity) return;

        entity.bones.set(boneName, {
            name: boneName,
            x: boneConfig.x || 0,
            y: boneConfig.y || 0,
            rotation: boneConfig.rotation || 0,
            scaleX: boneConfig.scaleX || 1,
            scaleY: boneConfig.scaleY || 1,
            pivotX: boneConfig.pivotX || 0,
            pivotY: boneConfig.pivotY || 0
        });
    },

    setState(entityId, stateName, force = false) {
        const entity = this.entities.get(entityId);
        if (!entity) return;

        const newState = entity.states.get(stateName);
        if (!newState) return;

        if (!force && entity.currentState?.name === stateName) return;

        if (entity.currentState && newState.transitionTo.includes(entity.currentState.name)) {
            entity.previousState = entity.currentState;
            entity.blendTimer = 0;
            entity.blendDuration = newState.blendDuration;
            entity.blendFactor = 0;
        } else {
            entity.previousState = null;
            entity.blendFactor = 1;
        }

        entity.currentState = newState;
        entity.time = 0;
        entity.loop = newState.loop;
    },

    update(deltaTime) {
        const toRemove = [];

        this.entities.forEach((entity, id) => {
            if (!entity.sprite || !entity.currentState) return;

            entity.time += deltaTime * entity.speed;
            const stateDuration = entity.currentState.duration;

            if (entity.time >= stateDuration) {
                if (entity.loop) {
                    entity.time = entity.time % stateDuration;
                } else {
                    entity.time = stateDuration;
                    const autoTransition = entity.currentState.transitionTo[0];
                    if (autoTransition) {
                        this.setState(id, autoTransition);
                    }
                }
            }

            if (entity.previousState && entity.blendFactor < 1) {
                entity.blendTimer += deltaTime;
                entity.blendFactor = Math.min(entity.blendTimer / entity.blendDuration, 1);
            }

            const t = entity.loop ? (entity.time / stateDuration) : Math.min(entity.time / stateDuration, 1);
            this.applyAnimationFrame(entity, t);

            if (entity.flippedX) {
                entity.sprite.scale.x = -Math.abs(entity.sprite.scale.x);
            }
            if (entity.flippedY) {
                entity.sprite.scale.y = -Math.abs(entity.sprite.scale.y);
            }
        });

        toRemove.forEach(id => this.entities.delete(id));
    },

    applyAnimationFrame(entity, t) {
        const clips = entity.currentState.clips;
        if (!clips || clips.length === 0) return;

        let clip = clips[0];
        if (clips.length > 1) {
            const clipIndex = Math.floor(t * clips.length);
            clip = clips[Math.min(clipIndex, clips.length - 1)];
        }

        if (!clip) return;

        const progress = t * clips.length % 1;
        const localT = (t * clips.length) % 1;

        entity.bones.forEach((bone, boneName) => {
            if (!clip.bones || !clip.bones[boneName]) return;

            const keyframes = clip.bones[boneName];
            if (!keyframes || keyframes.length === 0) return;

            let prevKeyframe = keyframes[0];
            let nextKeyframe = keyframes[keyframes.length - 1];

            for (let i = 0; i < keyframes.length - 1; i++) {
                if (keyframes[i].time <= localT && keyframes[i + 1].time > localT) {
                    prevKeyframe = keyframes[i];
                    nextKeyframe = keyframes[i + 1];
                    break;
                }
            }

            const keyT = prevKeyframe.time === nextKeyframe.time ? 0 :
                (localT - prevKeyframe.time) / (nextKeyframe.time - prevKeyframe.time);

            const lerpedX = this.lerp(prevKeyframe.x || bone.x, nextKeyframe.x || bone.x, keyT);
            const lerpedY = this.lerp(prevKeyframe.y || bone.y, nextKeyframe.y || bone.y, keyT);
            const lerpedRotation = this.lerpAngle(prevKeyframe.rotation || bone.rotation, nextKeyframe.rotation || bone.rotation, keyT);
            const lerpedScaleX = this.lerp(prevKeyframe.scaleX || bone.scaleX, nextKeyframe.scaleX || bone.scaleX, keyT);
            const lerpedScaleY = this.lerp(prevKeyframe.scaleY || bone.scaleY, nextKeyframe.scaleY || bone.scaleY, keyT);

            if (entity.previousState && entity.blendFactor < 1) {
                const prevClip = entity.previousState.clips[0];
                if (prevClip && prevClip.bones && prevClip.bones[boneName]) {
                    const prevKey = prevClip.bones[boneName][0];
                    const blendedX = this.lerp(prevKey?.x || lerpedX, lerpedX, entity.blendFactor);
                    const blendedY = this.lerp(prevKey?.y || lerpedY, lerpedY, entity.blendFactor);
                    const blendedRot = this.lerpAngle(prevKey?.rotation || lerpedRotation, lerpedRotation, entity.blendFactor);
                    const blendedScaleX = this.lerp(prevKey?.scaleX || lerpedScaleX, lerpedScaleX, entity.blendFactor);
                    const blendedScaleY = this.lerp(prevKey?.scaleY || lerpedScaleY, lerpedScaleY, entity.blendFactor);

                    bone.currentX = blendedX;
                    bone.currentY = blendedY;
                    bone.currentRotation = blendedRot;
                    bone.currentScaleX = blendedScaleX;
                    bone.currentScaleY = blendedScaleY;
                } else {
                    bone.currentX = lerpedX;
                    bone.currentY = lerpedY;
                    bone.currentRotation = lerpedRotation;
                    bone.currentScaleX = lerpedScaleX;
                    bone.currentScaleY = lerpedScaleY;
                }
            } else {
                bone.currentX = lerpedX;
                bone.currentY = lerpedY;
                bone.currentRotation = lerpedRotation;
                bone.currentScaleX = lerpedScaleX;
                bone.currentScaleY = lerpedScaleY;
            }
        });

        this.applyBonesToSprite(entity);
    },

    applyBonesToSprite(entity) {
        if (!entity.sprite) return;

        let offsetX = 0;
        let offsetY = 0;

        entity.bones.forEach((bone) => {
            if (bone.name === 'root' || bone.name === 'body') {
                offsetX = bone.currentX || 0;
                offsetY = bone.currentY || 0;
            }
        });

        entity.bones.forEach((bone) => {
            if (bone.name === 'root' || bone.name === 'body') {
                entity.sprite.x += (bone.currentX || 0) - offsetX;
                entity.sprite.y += (bone.currentY || 0) - offsetY;
                entity.sprite.rotation = bone.currentRotation || 0;
                entity.sprite.scale.x *= (bone.currentScaleX || 1);
                entity.sprite.scale.y *= (bone.currentScaleY || 1);
            }
        });
    },

    lerp(a, b, t) {
        return a + (b - a) * t;
    },

    lerpAngle(a, b, t) {
        let diff = b - a;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        return a + diff * t;
    },

    flipX(entityId, flipped) {
        const entity = this.entities.get(entityId);
        if (entity) entity.flippedX = flipped;
    },

    flipY(entityId, flipped) {
        const entity = this.entities.get(entityId);
        if (entity) entity.flippedY = flipped;
    },

    setSpeed(entityId, speed) {
        const entity = this.entities.get(entityId);
        if (entity) entity.speed = speed;
    },

    removeEntity(entityId) {
        this.entities.delete(entityId);
    },

    createAnimationClip(keyframes) {
        return {
            bones: keyframes.bones || {},
            duration: keyframes.duration || 1000,
            loop: keyframes.loop !== undefined ? keyframes.loop : true
        };
    },

    createKeyframe(time, properties) {
        return {
            time,
            x: properties.x,
            y: properties.y,
            rotation: properties.rotation || 0,
            scaleX: properties.scaleX || 1,
            scaleY: properties.scaleY || 1
        };
    }
};

window.AnimationManager = AnimationManager;