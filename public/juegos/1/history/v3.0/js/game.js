// ============================================================================
// NEON BLASTER - GAME CREATOR v2.0
// ============================================================================

const Game = {
    canvas: null,
    ctx: null,
    state: 'menu', // menu, playing, paused, gameover, shop, leaderboard
    running: false,

    // Game objects
    player: null,
    enemies: [],
    bullets: [],
    powerUps: [],
    particles: [],
    enemyBullets: [],
    bosses: [],
    collectibles: [],

    // Stats
    score: 0,
    highScore: 0,
    level: 1,
    waveTimer: 0,
    spawnTimer: 0,
    combo: 0,
    comboTimer: 0,
    killsInLevel: 0,
    groundY: 400,
    cameraX: 0,

    // Config
    config: {
        player: {
            width: 40,
            height: 50,
            speed: 5,
            health: 3,
            maxHealth: 3,
            cooldown: 12,
            color: '#00ff88',
            skin: 'default',
            pixels: [
                '    PPPP    ',
                '   PPPPPP   ',
                '   PPPPPP   ',
                '   PP  PP   ',
                '   PPPPPP   ',
                '    PPPP    ',
                '   GGGGGG   ',
                '  GGGGGGGG  ',
                ' GGGGGGGGGG ',
                'GGGG    GGGG'
            ]
        },
        walker: {
            width: 35,
            height: 45,
            speed: 1.5,
            health: 2,
            points: 100,
            color: '#ff6b6b',
            pixels: [
                '   CCCCC   ',
                '  CCCCCCC  ',
                '  CC C CC  ',
                '   CCCCC   ',
                '   CCCCC   ',
                '  CCCCCCC  ',
                '  CCC CCC  ',
                '   C   C   ',
                '  CC   CC  ',
                ' CC     CC '
            ]
        },
        flyer: {
            width: 40,
            height: 30,
            speed: 2,
            health: 1,
            points: 150,
            color: '#ffd93d',
            pixels: [
                '   CCCCCCCC   ',
                '  CC CCCCCC  ',
                ' C   C    C  ',
                'CC        CC ',
                ' C        C  ',
                '  C      C   ',
                '   CCCCCCC    '
            ]
        },
        shooter: {
            width: 30,
            height: 50,
            speed: 0.8,
            health: 3,
            points: 200,
            cooldown: 90,
            color: '#c792ea',
            pixels: [
                '   CCC   ',
                '  CCCCC  ',
                '  CC CC  ',
                '   CCC   ',
                '   CCC   ',
                '  CCCCC  ',
                '  CCCCC  ',
                '   CCC   ',
                '  CC CC  ',
                ' CC   CC '
            ]
        },
        boss: {
            width: 120,
            height: 100,
            speed: 0.5,
            health: 50,
            points: 5000,
            color: '#ff0055',
            pixels: [
                '   CCCCCCCCCCCC   ',
                ' CCCCCCCCCCCCCCC ',
                'CCCCCCCCCCCCCCCCC',
                'CCC R R R R R RC ',
                'CCCCCCCCCCCCCCCCC',
                'CCCCCCCCCCCCCCCCC',
                ' CCCCCCCCCCCCCCC ',
                '  CC CC CC CC CC  ',
                '   C   C   C   C   ',
                '  CC   CC   CC   CC  '
            ]
        },
        bullet: {
            width: 15,
            height: 6,
            speed: 12,
            color: '#00ff88',
            pixels: ['CCCCCCCCCCCCCCC']
        },
        powerup_health: {
            width: 25,
            height: 25,
            color: '#ff6b6b',
            pixels: [
                '  CCCCC  ',
                ' CCCCCCC ',
                'CCCCCCCCCC',
                'CCC R CCC',
                'CCCCCCCCCC',
                'CCCCCCCCCC',
                ' CCCCCCC ',
                '  CCCCC  '
            ]
        },
        powerup_speed: {
            width: 25,
            height: 25,
            color: '#00ff88',
            pixels: [
                'C    ',
                ' CC   ',
                '  CC  ',
                '   CC ',
                '    CC',
                '   CC ',
                '  CC  ',
                ' CC   ',
                'C    '
            ]
        },
        coin: {
            width: 20,
            height: 20,
            color: '#ffd700',
            pixels: [
                ' CCC ',
                'CCCCC',
                'CRCRC',
                'CCCCC',
                ' CCC '
            ]
        }
    },

    // Skins shop
    skins: {
        default: { name: 'Neón Verde', color: '#00ff88', price: 0, owned: true },
        cyan: { name: 'Cyan Clásico', color: '#00ffff', price: 500, owned: false },
        purple: { name: 'Púrpura', color: '#c792ea', price: 500, owned: false },
        red: { name: 'Rojo Fuego', color: '#ff4444', price: 750, owned: false },
        gold: { name: 'Oro', color: '#ffd700', price: 1000, owned: false },
        rainbow: { name: 'Arcoíris', color: 'rainbow', price: 2000, owned: false },
        ghost: { name: 'Fantasma', color: '#ffffff80', price: 1500, owned: false }
    },

    // Level definitions
    levels: [
        { enemies: 10, speedMult: 1, spawnRate: 60, enemyTypes: ['walker'] },
        { enemies: 15, speedMult: 1.1, spawnRate: 55, enemyTypes: ['walker', 'walker'] },
        { enemies: 20, speedMult: 1.2, spawnRate: 50, enemyTypes: ['walker', 'flyer'] },
        { enemies: 25, speedMult: 1.3, spawnRate: 45, enemyTypes: ['walker', 'flyer', 'flyer'] },
        { enemies: 1, speedMult: 1.5, spawnRate: 120, enemyTypes: ['boss'], isBoss: true },
        { enemies: 25, speedMult: 1.4, spawnRate: 40, enemyTypes: ['walker', 'flyer', 'shooter'] },
        { enemies: 30, speedMult: 1.5, spawnRate: 35, enemyTypes: ['flyer', 'shooter'] },
        { enemies: 35, speedMult: 1.6, spawnRate: 30, enemyTypes: ['shooter', 'shooter', 'flyer'] },
        { enemies: 40, speedMult: 1.7, spawnRate: 25, enemyTypes: ['walker', 'shooter'] },
        { enemies: 1, speedMult: 2, spawnRate: 180, enemyTypes: ['boss'], isBoss: true }
    ],

    // Game state
    coins: 0,
    totalKills: 0,
    selectedSkin: 'default',
    keys: { left: false, right: false, up: false, space: false },
    lastShot: 0,
    audioContext: null,
    sounds: {},
    musicPlaying: false,
    touchControls: { left: false, right: false, up: false, shoot: false }
};

const G = Game; // shorthand

// ============================================================================
// INITIALIZATION
// ============================================================================

function init() {
    G.canvas = document.getElementById('gameCanvas');
    G.ctx = G.canvas.getContext('2d');

    loadProgress();
    initAudio();
    resizeCanvas();
    setupInput();
    setupUI();

    resetPlayer();

    G.running = true;
    requestAnimationFrame(gameLoop);

    // Init touch controls for mobile
    initTouchControls();
}

function resizeCanvas() {
    const container = document.getElementById('gameArea');
    if (container) {
        G.canvas.width = container.clientWidth;
        G.canvas.height = container.clientHeight;
        G.groundY = G.canvas.height - 100;
    }
}

function loadProgress() {
    const saved = localStorage.getItem('neonBlaster_v2');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            G.coins = data.coins || 0;
            G.totalKills = data.totalKills || 0;
            G.highScore = data.highScore || 0;
            G.selectedSkin = data.selectedSkin || 'default';
            G.skins = { ...G.skins, ...data.skins };
        } catch (e) {}
    }
}

function saveProgress() {
    localStorage.setItem('neonBlaster_v2', JSON.stringify({
        coins: G.coins,
        totalKills: G.totalKills,
        highScore: G.highScore,
        selectedSkin: G.selectedSkin,
        skins: G.skins
    }));
}

// ============================================================================
// AUDIO SYSTEM
// ============================================================================

function initAudio() {
    try {
        G.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        createSounds();
    } catch (e) {
        console.log('Audio not available');
    }
}

function createSounds() {
    if (!G.audioContext) return;

    const ctx = G.audioContext;

    // Shoot sound
    G.sounds.shoot = () => playTone(800, 0.05, 'square', 0.3);

    // Jump sound
    G.sounds.jump = () => playTone(400, 0.1, 'sine', 0.2);

    // Hit sound
    G.sounds.hit = () => playTone(200, 0.1, 'sawtooth', 0.3);

    // Explosion sound
    G.sounds.explosion = () => {
        playTone(150, 0.2, 'sawtooth', 0.4);
        playTone(100, 0.3, 'square', 0.2);
    };

    // Coin sound
    G.sounds.coin = () => {
        playTone(880, 0.1, 'sine', 0.3);
        setTimeout(() => playTone(1100, 0.1, 'sine', 0.3), 50);
    };

    // Powerup sound
    G.sounds.powerup = () => {
        playTone(440, 0.1, 'sine', 0.3);
        setTimeout(() => playTone(660, 0.1, 'sine', 0.3), 100);
        setTimeout(() => playTone(880, 0.15, 'sine', 0.3), 200);
    };

    // Level up sound
    G.sounds.levelUp = () => {
        playTone(523, 0.15, 'sine', 0.4);
        setTimeout(() => playTone(659, 0.15, 'sine', 0.4), 150);
        setTimeout(() => playTone(784, 0.15, 'sine', 0.4), 300);
        setTimeout(() => playTone(1047, 0.3, 'sine', 0.4), 450);
    };

    // Game over sound
    G.sounds.gameOver = () => {
        playTone(400, 0.3, 'sawtooth', 0.4);
        setTimeout(() => playTone(300, 0.3, 'sawtooth', 0.3), 300);
        setTimeout(() => playTone(200, 0.5, 'sawtooth', 0.2), 600);
    };
}

function playTone(freq, duration, type = 'sine', volume = 0.5) {
    if (!G.audioContext) return;

    try {
        const osc = G.audioContext.createOscillator();
        const gain = G.audioContext.createGain();

        osc.type = type;
        osc.frequency.value = freq;

        gain.gain.value = volume;
        gain.gain.exponentialRampToValueAtTime(0.01, G.audioContext.currentTime + duration);

        osc.connect(gain);
        gain.connect(G.audioContext.destination);

        osc.start();
        osc.stop(G.audioContext.currentTime + duration);
    } catch (e) {}
}

// ============================================================================
// INPUT HANDLING
// ============================================================================

function setupInput() {
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') G.keys.left = true;
        if (e.key === 'ArrowRight') G.keys.right = true;
        if (e.key === 'ArrowUp') G.keys.up = true;
        if (e.key === ' ') {
            G.keys.space = true;
            e.preventDefault();
        }
        if (e.key === 'Tab') {
            e.preventDefault();
            toggleEditor();
        }
        if (e.key === 'Escape') {
            if (G.state === 'playing') G.state = 'paused';
            else if (G.state === 'paused') G.state = 'playing';
        }
    });

    document.addEventListener('keyup', (e) => {
        if (e.key === 'ArrowLeft') G.keys.left = false;
        if (e.key === 'ArrowRight') G.keys.right = false;
        if (e.key === 'ArrowUp') G.keys.up = false;
        if (e.key === ' ') G.keys.space = false;
    });

    window.addEventListener('resize', resizeCanvas);
}

function initTouchControls() {
    const canvas = G.canvas;

    // Left zone
    const leftZone = document.getElementById('touchLeft');
    if (leftZone) {
        leftZone.addEventListener('touchstart', (e) => { e.preventDefault(); G.touchControls.left = true; });
        leftZone.addEventListener('touchend', () => G.touchControls.left = false);
    }

    // Right zone
    const rightZone = document.getElementById('touchRight');
    if (rightZone) {
        rightZone.addEventListener('touchstart', (e) => { e.preventDefault(); G.touchControls.right = true; });
        rightZone.addEventListener('touchend', () => G.touchControls.right = false);
    }

    // Jump zone
    const jumpZone = document.getElementById('touchJump');
    if (jumpZone) {
        jumpZone.addEventListener('touchstart', (e) => { e.preventDefault(); G.touchControls.up = true; });
        jumpZone.addEventListener('touchend', () => G.touchControls.up = false);
    }

    // Shoot zone
    const shootZone = document.getElementById('touchShoot');
    if (shootZone) {
        shootZone.addEventListener('touchstart', (e) => { e.preventDefault(); G.touchControls.shoot = true; });
        shootZone.addEventListener('touchend', () => G.touchControls.shoot = false);
    }
}

// ============================================================================
// UI HANDLING
// ============================================================================

function setupUI() {
    document.querySelector('#startScreen .startBtn')?.addEventListener('click', startGame);

    document.querySelectorAll('.editor-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.editor-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            showTab(tab.dataset.tab);
        });
    });

    document.getElementById('objectSelect')?.addEventListener('change', (e) => loadSpriteToEditor(e.target.value));
    document.getElementById('btnApply')?.addEventListener('click', applyEditorChanges);
    document.getElementById('btnReset')?.addEventListener('click', resetToDefault);

    // Shop button
    document.getElementById('btnShop')?.addEventListener('click', () => showScreen('shop'));
    document.getElementById('btnShopBack')?.addEventListener('click', () => showScreen('menu'));

    // Leaderboard button
    document.getElementById('btnLeaderboard')?.addEventListener('click', () => showScreen('leaderboard'));
    document.getElementById('btnLeaderboardBack')?.addEventListener('click', () => showScreen('menu'));

    // Retry button
    document.querySelector('#gameOverScreen .startBtn')?.addEventListener('click', () => {
        if (G.state === 'gameover') startGame();
    });
}

function showScreen(screen) {
    document.getElementById('startScreen').style.display = screen === 'menu' ? 'flex' : 'none';
    document.getElementById('gameOverScreen').style.display = screen === 'gameover' ? 'flex' : 'none';
    document.getElementById('shopScreen').style.display = screen === 'shop' ? 'flex' : 'none';
    document.getElementById('leaderboardScreen').style.display = screen === 'leaderboard' ? 'flex' : 'none';

    if (screen === 'shop') renderShop();
    if (screen === 'leaderboard') renderLeaderboard();

    G.state = screen;
}

function showTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tc => tc.style.display = 'none');
    const tab = document.getElementById('tab-' + tabName);
    if (tab) tab.style.display = 'block';
}

function toggleEditor() {
    const panel = document.getElementById('editorPanel');
    const indicator = document.getElementById('modeIndicator');

    if (panel.classList.contains('editor-hidden')) {
        panel.classList.remove('editor-hidden');
        indicator.style.display = 'block';

        // Initialize new PixelEditor
        if (window.PixelEditor) {
            PixelEditor.init();
            loadSpriteToEditor('player');
        }
    } else {
        panel.classList.add('editor-hidden');
        indicator.style.display = 'none';
    }
}

function updateUI() {
    document.getElementById('score').textContent = `PUNTOS: ${G.score}`;
    document.getElementById('levelDisplay').textContent = `NIVEL ${G.level}`;

    let hearts = '♥'.repeat(Math.max(0, G.player.health));
    document.getElementById('hearts').textContent = hearts;
    document.getElementById('hearts').style.color = '#ff6b6b';

    document.getElementById('coinDisplay').textContent = `🪙 ${G.coins}`;

    // Combo display
    if (G.combo > 1) {
        document.getElementById('comboDisplay').textContent = `${G.combo}x COMBO!`;
        document.getElementById('comboDisplay').style.opacity = 1;
    } else {
        document.getElementById('comboDisplay').style.opacity = 0;
    }
}

// ============================================================================
// GAME FLOW
// ============================================================================

function startGame() {
    showScreen('playing');

    G.score = 0;
    G.level = 1;
    G.waveTimer = 0;
    G.spawnTimer = 60;
    G.combo = 0;
    G.comboTimer = 0;
    G.killsInLevel = 0;

    G.enemies = [];
    G.bullets = [];
    G.enemyBullets = [];
    G.powerUps = [];
    G.bosses = [];
    G.collectibles = [];
    G.particles = [];

    resetPlayer();
    updateUI();
}

function resetPlayer() {
    const cfg = G.config.player;
    const skin = G.skins[G.selectedSkin];

    // Apply skin color to player config
    G.config.player.color = skin.color === 'rainbow' ? '#00ff88' : skin.color;
    G.config.player.skin = G.selectedSkin;

    G.player = {
        x: 100,
        y: G.groundY - cfg.height,
        width: cfg.width,
        height: cfg.height,
        vx: 0,
        vy: 0,
        facing: 1,
        health: cfg.health,
        maxHealth: cfg.maxHealth,
        shootCooldown: 0,
        invincible: 0,
        onGround: true
    };
}

function nextLevel() {
    G.level++;
    G.waveTimer = 0;
    G.killsInLevel = 0;

    // Clear all enemies
    G.enemies = [];
    G.bosses = [];
    G.enemyBullets = [];

    // Bonus coins for completing level
    const bonus = G.level * 50;
    G.coins += bonus;

    G.sounds.levelUp?.();
    emitParticles(G.canvas.width / 2, G.canvas.height / 2, '#ffd700', 50);

    saveProgress();
    updateUI();
}

function gameOver() {
    G.state = 'gameover';

    // Update high score
    if (G.score > G.highScore) {
        G.highScore = G.score;
    }

    // Add coins based on score
    const coinsEarned = Math.floor(G.score / 10);
    G.coins += coinsEarned;

    G.totalKills += G.killsInLevel;

    G.sounds.gameOver?.();

    saveProgress();

    document.getElementById('finalScore').innerHTML = `
        <p>Puntuación: ${G.score}</p>
        <p>Monedas ganadas: +${coinsEarned}</p>
        <p>Nivel alcanzado: ${G.level}</p>
    `;
    document.getElementById('highScore').textContent = G.highScore;
    document.getElementById('gameOverScreen').style.display = 'flex';
}

// ============================================================================
// GAME LOOP
// ============================================================================

function gameLoop() {
    if (G.running) {
        if (G.state === 'playing') {
            update();
        }
        draw();
        requestAnimationFrame(gameLoop);
    }
}

function update() {
    updatePlayer();
    updateBullets();
    updateEnemies();
    updateBosses();
    updatePowerUps();
    updateCollectibles();
    updateParticles();
    checkCollisions();

    if (G.comboTimer > 0) {
        G.comboTimer--;
        if (G.comboTimer <= 0) {
            G.combo = 0;
        }
    }

    updateUI();
}

function updatePlayer() {
    const p = G.player;
    const cfg = G.config.player;

    const leftPressed = G.keys.left || G.touchControls.left;
    const rightPressed = G.keys.right || G.touchControls.right;
    const upPressed = G.keys.up || G.touchControls.up;
    const spacePressed = G.keys.space || G.touchControls.shoot;

    if (leftPressed) {
        p.vx = -cfg.speed;
        p.facing = -1;
    } else if (rightPressed) {
        p.vx = cfg.speed;
        p.facing = 1;
    } else {
        p.vx *= 0.8;
    }

    if (upPressed && p.onGround) {
        p.vy = -14;
        p.onGround = false;
        G.sounds.jump?.();
    }

    if (spacePressed && p.shootCooldown <= 0) {
        const bx = p.facing === 1 ? p.x + p.width : p.x - 15;
        G.bullets.push({
            x: bx,
            y: p.y + 25,
            width: 15,
            height: 6,
            vx: G.config.bullet.speed * p.facing,
            alive: true
        });
        p.shootCooldown = cfg.cooldown;
        G.sounds.shoot?.();
    }

    p.vy += 0.6;
    p.x += p.vx;
    p.y += p.vy;

    if (p.y + p.height >= G.groundY) {
        p.y = G.groundY - p.height;
        p.vy = 0;
        p.onGround = true;
    }

    if (p.shootCooldown > 0) p.shootCooldown--;
    if (p.invincible > 0) p.invincible--;

    // Camera follow
    if (p.x < G.cameraX + 100) {
        G.cameraX = p.x - 100;
    } else if (p.x > G.cameraX + G.canvas.width - 150) {
        G.cameraX = p.x - G.canvas.width + 150;
    }
}

function updateBullets() {
    G.bullets.forEach(b => {
        b.x += b.vx;
        if (b.x < G.cameraX - 50 || b.x > G.cameraX + G.canvas.width + 50) {
            b.alive = false;
        }
    });
    G.bullets = G.bullets.filter(b => b.alive);

    G.enemyBullets.forEach(b => {
        b.x += b.vx;
        b.y += b.vy || 0;
    });
    G.enemyBullets = G.enemyBullets.filter(b => b.x > G.cameraX - 50 && b.x < G.cameraX + G.canvas.width + 50);
}

function updateEnemies() {
    const levelIdx = (G.level - 1) % G.levels.length;
    const level = G.levels[levelIdx];

    // Spawn enemies
    if (!level.isBoss) {
        G.spawnTimer--;
        if (G.spawnTimer <= 0 && G.killsInLevel < level.enemies) {
            spawnEnemy(level);
            G.spawnTimer = level.spawnRate;
        }
    }

    // Update existing enemies
    G.enemies.forEach(e => {
        e.x -= e.speed * level.speedMult;

        if (e.type === 'flyer') {
            e.wave = (e.wave || 0) + 0.05;
            e.y = e.baseY + Math.sin(e.wave) * 50;
        }

        if (e.hitTimer > 0) e.hitTimer--;

        if (e.type === 'shooter') {
            e.cooldownTimer = (e.cooldownTimer || 0) - 1;
            if (e.cooldownTimer <= 0 && e.x < G.cameraX + G.canvas.width && e.x > G.cameraX) {
                e.cooldownTimer = e.cooldown;
                G.enemyBullets.push({
                    x: e.x,
                    y: e.y + e.height / 2,
                    vx: -5,
                    vy: 0
                });
            }
        }

        if (e.x < G.cameraX - 100) e.alive = false;
    });

    G.enemies = G.enemies.filter(e => e.alive);

    // Check level completion
    if (!level.isBoss && G.killsInLevel >= level.enemies && G.enemies.length === 0 && G.bosses.length === 0) {
        nextLevel();
    }
}

function spawnEnemy(level) {
    const x = G.cameraX + G.canvas.width + 50;
    const types = level.enemyTypes;
    const type = types[Math.floor(Math.random() * types.length)];
    const cfg = G.config[type];

    G.enemies.push({
        x: x,
        y: type === 'flyer' ? 200 + Math.random() * 150 : G.groundY - cfg.height,
        width: cfg.width,
        height: cfg.height,
        type: type,
        speed: cfg.speed * (0.8 + Math.random() * 0.4),
        health: cfg.health,
        points: cfg.points,
        color: cfg.color,
        cooldown: cfg.cooldown,
        cooldownTimer: cfg.cooldown || 90,
        alive: true,
        hitTimer: 0,
        wave: Math.random() * Math.PI * 2,
        baseY: type === 'flyer' ? 200 + Math.random() * 150 : 0
    });
}

function updateBosses() {
    const levelIdx = (G.level - 1) % G.levels.length;
    const level = G.levels[levelIdx];

    // Spawn boss
    if (level.isBoss && G.bosses.length === 0 && G.killsInLevel === 0) {
        spawnBoss();
    }

    G.bosses.forEach(boss => {
        // Movement pattern
        boss.moveTimer = (boss.moveTimer || 0) + 1;
        boss.x -= boss.speed;

        if (boss.moveTimer % 60 === 0) {
            boss.direction = boss.direction === 'up' ? 'down' : 'up';
        }
        if (boss.direction === 'up') {
            boss.y -= 1;
        } else {
            boss.y += 1;
        }

        // Keep boss in bounds
        if (boss.y < 100) boss.y = 100;
        if (boss.y > G.groundY - boss.height - 50) boss.y = G.groundY - boss.height - 50;

        // Shoot
        boss.shootTimer = (boss.shootTimer || 0) - 1;
        if (boss.shootTimer <= 0) {
            boss.shootTimer = 30;

            // Triple shot
            G.enemyBullets.push({ x: boss.x, y: boss.y + 20, vx: -8, vy: 0 });
            G.enemyBullets.push({ x: boss.x, y: boss.y + boss.height / 2, vx: -8, vy: -2 });
            G.enemyBullets.push({ x: boss.x, y: boss.y + boss.height - 20, vx: -8, vy: 2 });
        }

        if (boss.hitTimer > 0) boss.hitTimer--;
    });

    G.bosses = G.bosses.filter(b => b.alive);

    // Boss defeated
    if (level.isBoss && G.bosses.length === 0 && G.killsInLevel >= 1) {
        nextLevel();
    }
}

function spawnBoss() {
    const cfg = G.config.boss;
    G.bosses.push({
        x: G.cameraX + G.canvas.width + 50,
        y: 150,
        width: cfg.width,
        height: cfg.height,
        type: 'boss',
        speed: cfg.speed,
        health: cfg.health * G.level,
        maxHealth: cfg.health * G.level,
        points: cfg.points * G.level,
        color: cfg.color,
        alive: true,
        hitTimer: 0,
        direction: 'up',
        moveTimer: 0,
        shootTimer: 60
    });

    G.sounds.levelUp?.();
    emitParticles(G.canvas.width / 2, 150, '#ff0055', 30);
}

function updatePowerUps() {
    G.powerUps.forEach(p => {
        p.timer--;
        if (p.timer <= 0) p.y += 2;
    });
    G.powerUps = G.powerUps.filter(p => p.y < G.canvas.height + 50);
}

function updateCollectibles() {
    G.collectibles.forEach(c => {
        c.y += 0.5;
        c.rotation = (c.rotation || 0) + 5;
    });
    G.collectibles = G.collectibles.filter(c => c.y < G.canvas.height + 50 && c.alive);
}

function updateParticles() {
    G.particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.1;
        p.life--;
    });
    G.particles = G.particles.filter(p => p.life > 0);
}

function checkCollisions() {
    const p = G.player;

    // Bullets vs Enemies
    G.bullets.forEach(b => {
        G.enemies.forEach(e => {
            if (b.x < e.x + e.width && b.x + b.width > e.x &&
                b.y < e.y + e.height && b.y + b.height > e.y) {
                b.alive = false;
                e.health--;
                e.hitTimer = 5;
                G.sounds.hit?.();
                emitParticles(e.x + e.width / 2, e.y + e.height / 2, e.color, 5);

                if (e.health <= 0) {
                    e.alive = false;
                    G.killsInLevel++;
                    addScore(e.points);
                    G.sounds.explosion?.();
                    emitParticles(e.x + e.width / 2, e.y + e.height / 2, e.color, 15);

                    // Drop coins
                    if (Math.random() < 0.3) {
                        spawnCoin(e.x, e.y);
                    }

                    // Random power-up
                    if (Math.random() < 0.15) {
                        spawnPowerUp(e.x, e.y);
                    }
                }
            }
        });

        // Bullets vs Boss
        G.bosses.forEach(boss => {
            if (b.x < boss.x + boss.width && b.x + b.width > boss.x &&
                b.y < boss.y + boss.height && b.y + b.height > boss.y) {
                b.alive = false;
                boss.health--;
                boss.hitTimer = 5;
                G.sounds.hit?.();
                emitParticles(boss.x + boss.width / 2, boss.y + boss.height / 2, boss.color, 3);

                if (boss.health <= 0) {
                    boss.alive = false;
                    G.killsInLevel++;
                    addScore(boss.points);
                    G.sounds.explosion?.();
                    emitParticles(boss.x + boss.width / 2, boss.y + boss.height / 2, boss.color, 50);

                    // Lots of coins
                    for (let i = 0; i < 5; i++) {
                        spawnCoin(boss.x + Math.random() * boss.width, boss.y + Math.random() * boss.height);
                    }

                    // Random power-ups
                    for (let i = 0; i < 3; i++) {
                        spawnPowerUp(boss.x + Math.random() * boss.width, boss.y + Math.random() * boss.height);
                    }
                }
            }
        });
    });

    // Enemies vs Player
    G.enemies.forEach(e => {
        if (p.invincible <= 0 &&
            p.x < e.x + e.width && p.x + p.width > e.x &&
            p.y < e.y + e.height && p.y + p.height > e.y) {
            p.health--;
            p.invincible = 60;
            G.sounds.hit?.();
            emitParticles(p.x + p.width / 2, p.y + p.height / 2, '#ff6b6b', 10);
            if (p.health <= 0) gameOver();
        }
    });

    // Boss vs Player
    G.bosses.forEach(boss => {
        if (p.invincible <= 0 &&
            p.x < boss.x + boss.width && p.x + p.width > boss.x &&
            p.y < boss.y + boss.height && p.y + p.height > boss.y) {
            p.health--;
            p.invincible = 60;
            G.sounds.hit?.();
            emitParticles(p.x + p.width / 2, p.y + p.height / 2, '#ff0055', 15);
            if (p.health <= 0) gameOver();
        }
    });

    // Enemy bullets vs Player
    G.enemyBullets.forEach(b => {
        if (p.invincible <= 0 &&
            b.x < p.x + p.width && b.x + 8 > p.x &&
            b.y < p.y + p.height && b.y + 8 > p.y) {
            b.vx = -1000;
            p.health--;
            p.invincible = 60;
            G.sounds.hit?.();
            emitParticles(p.x + p.width / 2, p.y + p.height / 2, '#ffd93d', 10);
            if (p.health <= 0) gameOver();
        }
    });

    // PowerUps vs Player
    G.powerUps.forEach(pu => {
        if (p.x < pu.x + 25 && p.x + p.width > pu.x &&
            p.y < pu.y + 25 && p.y + p.height > pu.y) {
            pu.y = 1000;

            if (pu.type === 'health' && p.health < p.maxHealth) {
                p.health = Math.min(p.health + 1, p.maxHealth);
                G.sounds.powerup?.();
                emitParticles(pu.x + 12, pu.y + 12, '#ff6b6b', 15);
            } else if (pu.type === 'speed') {
                G.sounds.powerup?.();
                emitParticles(pu.x + 12, pu.y + 12, '#00ff88', 25);
            }

            G.coins += 10;
            saveProgress();
        }
    });

    // Coins vs Player
    G.collectibles.forEach(c => {
        if (p.x < c.x + c.width && p.x + p.width > c.x &&
            p.y < c.y + c.height && p.y + c.height > c.y) {
            c.alive = false;
            G.coins += 5;
            G.sounds.coin?.();
            saveProgress();
        }
    });
}

function addScore(points) {
    G.combo++;
    G.comboTimer = 120;

    const multiplier = Math.min(G.combo, 10);
    G.score += points * multiplier;
}

function spawnPowerUp(x, y) {
    const type = Math.random() < 0.6 ? 'health' : 'speed';
    G.powerUps.push({
        x: x,
        y: y,
        width: 25,
        height: 25,
        type: type,
        timer: 300
    });
}

function spawnCoin(x, y) {
    G.collectibles.push({
        x: x,
        y: y,
        width: 20,
        height: 20,
        type: 'coin',
        rotation: 0,
        alive: true
    });
}

function emitParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        G.particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 12,
            vy: (Math.random() - 0.5) * 12,
            size: 4 + Math.random() * 4,
            color: color,
            life: 25 + Math.random() * 20
        });
    }
}

// ============================================================================
// DRAWING
// ============================================================================

function draw() {
    const ctx = G.ctx;
    const cam = G.cameraX;

    // Clear and background
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, G.canvas.width, G.canvas.height);

    const grad = ctx.createLinearGradient(0, 0, 0, G.canvas.height);
    grad.addColorStop(0, '#0d1117');
    grad.addColorStop(1, '#161b22');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, G.canvas.width, G.canvas.height);

    // Draw bullets
    ctx.fillStyle = G.config.player.color;
    ctx.shadowBlur = 15;
    ctx.shadowColor = G.config.player.color;
    G.bullets.forEach(b => ctx.fillRect(b.x - cam, b.y, b.width, b.height));

    // Draw enemies
    G.enemies.forEach(e => drawSprite(e.type, e.x - cam, e.y, e.hitTimer > 0 ? '#fff' : e.color));

    // Draw bosses
    G.bosses.forEach(boss => {
        // Boss health bar
        const healthPct = boss.health / boss.maxHealth;
        ctx.fillStyle = '#333';
        ctx.fillRect(boss.x - cam, boss.y - 15, boss.width, 8);
        ctx.fillStyle = '#ff0055';
        ctx.shadowColor = '#ff0055';
        ctx.fillRect(boss.x - cam, boss.y - 15, boss.width * healthPct, 8);

        drawSprite('boss', boss.x - cam, boss.y, boss.hitTimer > 0 ? '#fff' : boss.color);
    });

    // Draw powerups
    G.powerUps.forEach(pu => drawSprite('powerup_' + pu.type, pu.x - cam, pu.y));

    // Draw coins
    G.collectibles.forEach(c => {
        ctx.save();
        ctx.translate(c.x - cam + c.width / 2, c.y + c.height / 2);
        ctx.rotate(c.rotation * Math.PI / 180);
        ctx.fillStyle = '#ffd700';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#ffd700';
        ctx.fillRect(-c.width / 2, -c.height / 2, c.width, c.height);
        ctx.restore();
    });

    // Draw player
    if (G.player) {
        const p = G.player;
        const skin = G.skins[G.selectedSkin];

        if (p.invincible <= 0 || Math.floor(p.invincible / 3) % 2 === 0) {
            let color = skin.color;
            if (color === 'rainbow') {
                const hue = (Date.now() / 20) % 360;
                color = `hsl(${hue}, 100%, 60%)`;
            }

            ctx.save();
            ctx.shadowBlur = 20;
            ctx.shadowColor = color;
            drawSprite('player', p.x - cam, p.y, color);
            ctx.restore();
        }
    }

    // Draw particles
    ctx.shadowBlur = 10;
    G.particles.forEach(p => {
        ctx.globalAlpha = p.life / 45;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.fillRect(p.x - cam, p.y, p.size, p.size);
    });
    ctx.globalAlpha = 1;

    // Draw enemy bullets
    ctx.fillStyle = '#ff6b6b';
    ctx.shadowColor = '#ff6b6b';
    G.enemyBullets.forEach(b => ctx.fillRect(b.x - cam, b.y, 8, 8));

    // Draw ground
    drawGround();

    // Draw HUD
    drawHUD();

    // Draw boss health bar
    if (G.bosses.length > 0) {
        G.bosses.forEach(boss => {
            const healthPct = boss.health / boss.maxHealth;
            ctx.fillStyle = '#333';
            ctx.fillRect(20, 60, G.canvas.width - 40, 10);
            ctx.fillStyle = '#ff0055';
            ctx.shadowColor = '#ff0055';
            ctx.fillRect(20, 60, (G.canvas.width - 40) * healthPct, 10);
            ctx.fillStyle = '#fff';
            ctx.font = '12px Segoe UI';
            ctx.fillText(`BOSS - ${boss.health}/${boss.maxHealth}`, 20, 80);
        });
    }

    // Paused overlay
    if (G.state === 'paused') {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, G.canvas.width, G.canvas.height);
        ctx.fillStyle = '#00ff88';
        ctx.font = '32px Segoe UI';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSADO', G.canvas.width / 2, G.canvas.height / 2);
        ctx.font = '14px Segoe UI';
        ctx.fillText('Presiona ESC para continuar', G.canvas.width / 2, G.canvas.height / 2 + 30);
        ctx.textAlign = 'left';
    }
}

function drawSprite(type, x, y, overrideColor) {
    const cfg = G.config[type];
    if (!cfg || !cfg.pixels) return;

    const ctx = G.ctx;
    ctx.save();
    ctx.shadowBlur = 10;
    ctx.shadowColor = overrideColor || cfg.color;

    const pixelW = cfg.width / (cfg.pixels[0]?.length || 1);
    const pixelH = cfg.height / cfg.pixels.length;

    cfg.pixels.forEach((row, py) => {
        for (let px = 0; px < row.length; px++) {
            const char = row[px];
            if (char !== ' ') {
                let color;
                if (char === 'P') color = '#00ff88';
                else if (char === 'G') color = '#00cc6a';
                else if (char === 'R') color = '#ff0000';
                else color = overrideColor || cfg.color;

                ctx.fillStyle = color;
                ctx.fillRect(x + px * pixelW, y + py * pixelH, pixelW + 0.5, pixelH + 0.5);
            }
        }
    });

    ctx.restore();
}

function drawGround() {
    const ctx = G.ctx;
    const gy = G.groundY;

    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, gy, G.canvas.width, 100);

    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 2;
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#00ff88';
    ctx.beginPath();
    ctx.moveTo(0, gy);
    ctx.lineTo(G.canvas.width, gy);
    ctx.stroke();

    ctx.strokeStyle = '#333';
    ctx.shadowBlur = 0;
    for (let i = 0; i < G.canvas.width + 50; i += 50) {
        const offsetX = G.cameraX % 50;
        ctx.beginPath();
        ctx.moveTo(i - offsetX, gy + 10);
        ctx.lineTo(i - offsetX + 30, gy + 10);
        ctx.stroke();
    }
}

function drawHUD() {
    const ctx = G.ctx;

    // Top bar background
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, G.canvas.width, 45);

    // Score
    ctx.fillStyle = '#00ff88';
    ctx.font = 'bold 18px Segoe UI';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#00ff88';
    ctx.fillText(`PUNTOS: ${G.score}`, 15, 30);

    // Level
    ctx.fillStyle = '#ffd93d';
    ctx.shadowColor = '#ffd93d';
    ctx.fillText(`NIVEL ${G.level}`, 220, 30);

    // Coins
    ctx.fillStyle = '#ffd700';
    ctx.shadowColor = '#ffd700';
    ctx.fillText(`🪙 ${G.coins}`, 400, 30);

    // Health
    ctx.fillStyle = '#ff6b6b';
    ctx.shadowColor = '#ff6b6b';
    const hearts = '♥'.repeat(Math.max(0, G.player.health));
    ctx.fillText(`VIDA: ${hearts}`, 550, 30);

    // Combo
    if (G.combo > 1) {
        ctx.fillStyle = '#ff00ff';
        ctx.shadowColor = '#ff00ff';
        ctx.font = 'bold 20px Segoe UI';
        ctx.fillText(`${G.combo}x COMBO!`, G.canvas.width / 2, 30);
    }

    ctx.shadowBlur = 0;
}

// ============================================================================
// SHOP SYSTEM
// ============================================================================

function renderShop() {
    const container = document.getElementById('shopItems');
    container.innerHTML = '';

    Object.entries(G.skins).forEach(([id, skin]) => {
        const owned = skin.owned;
        const selected = id === G.selectedSkin;
        const canAfford = G.coins >= skin.price;

        const item = document.createElement('div');
        item.className = 'shop-item';
        item.innerHTML = `
            <div class="shop-item-preview" style="background: ${skin.color === 'rainbow' ? 'linear-gradient(45deg, red, orange, yellow, green, blue, purple)' : skin.color}"></div>
            <div class="shop-item-info">
                <div class="shop-item-name">${skin.name}</div>
                <div class="shop-item-price">${owned ? 'OWNED' : `🪙 ${skin.price}`}</div>
            </div>
            <div class="shop-item-actions">
                ${selected ? '<span class="selected-tag">SELECTED</span>' :
                  owned ? `<button class="btn btn-small" onclick="selectSkin('${id}')">SELECT</button>` :
                  `<button class="btn btn-small" ${!canAfford ? 'disabled' : ''} onclick="buySkin('${id}')">BUY</button>`}
            </div>
        `;
        container.appendChild(item);
    });
}

function buySkin(id) {
    const skin = G.skins[id];
    if (G.coins >= skin.price && !skin.owned) {
        G.coins -= skin.price;
        skin.owned = true;
        G.selectedSkin = id;
        saveProgress();
        renderShop();
        G.sounds.coin?.();
    }
}

function selectSkin(id) {
    if (G.skins[id].owned) {
        G.selectedSkin = id;
        saveProgress();
        renderShop();
    }
}

// ============================================================================
// LEADERBOARD
// ============================================================================

function renderLeaderboard() {
    const container = document.getElementById('leaderboardList');

    // Get scores from localStorage
    let scores = JSON.parse(localStorage.getItem('neonBlasterScores') || '[]');

    // Add current score
    if (G.score > 0) {
        scores.push({
            score: G.score,
            level: G.level,
            date: new Date().toLocaleDateString()
        });
        scores.sort((a, b) => b.score - a.score);
        scores = scores.slice(0, 10); // Keep top 10
        localStorage.setItem('neonBlasterScores', JSON.stringify(scores));
    }

    if (scores.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:#888;padding:20px;">No hay puntuaciones aún</p>';
        return;
    }

    container.innerHTML = scores.map((s, i) => `
        <div class="leaderboard-item">
            <span class="rank">#${i + 1}</span>
            <span class="score">${s.score}</span>
            <span class="level">Nivel ${s.level}</span>
            <span class="date">${s.date}</span>
        </div>
    `).join('');
}

// ============================================================================
// EDITOR (Simplified for brevity - same as before)
// ============================================================================

// ============================================================================
// EDITOR INTEGRATION
// ============================================================================

function applyEditorChanges() {
    const type = document.getElementById('objectSelect')?.value;
    const cfg = G.config[type];

    // Update properties
    cfg.width = parseInt(document.getElementById('propWidth').value);
    cfg.height = parseInt(document.getElementById('propHeight').value);
    cfg.speed = parseFloat(document.getElementById('propSpeed').value);
    cfg.health = parseInt(document.getElementById('propHealth').value);
    cfg.points = parseInt(document.getElementById('propPoints').value);
    cfg.cooldown = parseInt(document.getElementById('propCooldown').value);
    cfg.color = document.getElementById('propColor').value;

    // Get sprite from PixelEditor if drawn
    if (window.PixelEditor) {
        const sprite = PixelEditor.exportSprite();
        if (sprite && sprite.pixels.length > 0) {
            cfg.pixels = sprite.pixels;
            cfg.width = sprite.width;
            cfg.height = sprite.height;
        }
    }

    if (type === 'player') {
        G.player.width = cfg.width;
        G.player.height = cfg.height;
        G.player.health = cfg.health;
        G.player.y = G.groundY - cfg.height;
    }

    saveConfig();
    loadSpriteToEditor(type);
    renderSpritePreview(type);

    const notif = document.getElementById('notification');
    if (notif) {
        notif.textContent = 'Cambios aplicados';
        notif.classList.add('show');
        setTimeout(() => notif.classList.remove('show'), 2000);
    }
}

function resetToDefault() {
    if (!confirm('¿Restaurar sprite original?')) return;

    const type = document.getElementById('objectSelect')?.value;
    const defaults = getDefaultConfig();

    if (defaults[type]) {
        G.config[type] = JSON.parse(JSON.stringify(defaults[type]));
        saveConfig();
        loadSpriteToEditor(type);
        renderSpritePreview(type);

        // Also reset PixelEditor if available
        if (window.PixelEditor) {
            PixelEditor.initPixels();
            PixelEditor.init();
        }
    }
}

function loadSpriteToEditor(type) {
    const cfg = G.config[type];
    if (!cfg) return;

    // Update property fields
    document.getElementById('propWidth').value = cfg.width;
    document.getElementById('propWidthVal').textContent = cfg.width;
    document.getElementById('propHeight').value = cfg.height;
    document.getElementById('propHeightVal').textContent = cfg.height;
    document.getElementById('propSpeed').value = cfg.speed || 0;
    document.getElementById('propSpeedVal').textContent = cfg.speed || 0;
    document.getElementById('propHealth').value = cfg.health || 1;
    document.getElementById('propHealthVal').textContent = cfg.health || 1;
    document.getElementById('propPoints').value = cfg.points || 0;
    document.getElementById('propPointsVal').textContent = cfg.points || 0;
    document.getElementById('propCooldown').value = cfg.cooldown || 0;
    document.getElementById('propCooldownVal').textContent = cfg.cooldown || 0;
    document.getElementById('propColor').value = cfg.color || '#00ff88';

    // Load into PixelEditor if available
    if (window.PixelEditor && cfg.pixels) {
        PixelEditor.initPixels();

        // Copy pixels from config to PixelEditor
        const startY = Math.max(0, (64 - cfg.pixels.length) / 2);
        const startX = Math.max(0, (64 - (cfg.pixels[0]?.length || 0)) / 2);

        cfg.pixels.forEach((row, py) => {
            for (let px = 0; px < row.length; px++) {
                const char = row[px];
                if (char !== ' ') {
                    let color;
                    if (char === 'P') color = '#00ff88';
                    else if (char === 'G') color = '#00cc6a';
                    else if (char === 'R') color = '#ff0000';
                    else color = cfg.color;

                    PixelEditor.pixels[startY + py][startX + px] = color;
                }
            }
        });

        PixelEditor.renderGrid();
        PixelEditor.updatePreview();
    }

    // Update stats
    updateSpriteStats(type);
    renderSpritePreview(type);
}

function renderSpritePreview(type) {
    const canvas = document.getElementById('spritePreviewCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, 200, 150);

    const cfg = G.config[type];
    if (!cfg || !cfg.pixels) return;

    const pixelW = Math.min(150 / cfg.pixels.length, 100 / cfg.pixels.length);
    const pixelH = pixelW;

    const offsetX = (200 - cfg.pixels[0].length * pixelW) / 2;
    const offsetY = (150 - cfg.pixels.length * pixelH) / 2;

    ctx.shadowBlur = 5;

    cfg.pixels.forEach((row, py) => {
        for (let px = 0; px < row.length; px++) {
            const char = row[px];
            if (char !== ' ') {
                let color;
                if (char === 'P') color = '#00ff88';
                else if (char === 'G') color = '#00cc6a';
                else if (char === 'R') color = '#ff0000';
                else color = cfg.color;

                ctx.fillStyle = color;
                ctx.shadowColor = color;
                ctx.fillRect(offsetX + px * pixelW, offsetY + py * pixelH, pixelW + 0.5, pixelH + 0.5);
            }
        }
    });
}

function updateSpriteStats(type) {
    const cfg = G.config[type];
    if (!cfg || !cfg.pixels) return;

    let width = cfg.pixels[0]?.length || 0;
    let height = cfg.pixels.length;
    let pixels = 0;

    cfg.pixels.forEach(row => {
        for (let i = 0; i < row.length; i++) {
            if (row[i] !== ' ') pixels++;
        }
    });

    const statWidth = document.getElementById('statWidth');
    const statHeight = document.getElementById('statHeight');
    const statPixels = document.getElementById('statPixels');
    const statScale = document.getElementById('statScale');

    if (statWidth) statWidth.textContent = width;
    if (statHeight) statHeight.textContent = height;
    if (statPixels) statPixels.textContent = pixels;
    if (statScale) statScale.textContent = `${Math.round(cfg.width / width)}x`;
}

// ============================================================================
// STARTUP
// ============================================================================

document.addEventListener('DOMContentLoaded', init);