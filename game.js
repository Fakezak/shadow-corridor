/**
 * SHADOW CORRIDOR - First Person Horror Game
 * Complete JavaScript Game Engine
 */

const Game = {
    // ===== GAME STATE =====
    state: {
        isRunning: false,
        isPaused: false,
        isGameOver: false,
        difficulty: 'normal',
        checkpoint: null
    },

    // ===== PLAYER STATS =====
    player: {
        health: 100,
        maxHealth: 100,
        sanity: 100,
        maxSanity: 100,
        flashlight: {
            battery: 100,
            isOn: true,
            maxBattery: 100
        },
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0 },
        inventory: [],
        maxInventory: 4,
        isRunning: false
    },

    // ===== WORLD DATA =====
    world: {
        walls: [
            // Outer walls (boundary)
            { id: 'wall1', x: 0, z: -15, width: 30, height: 3, type: 'stone' },
            { id: 'wall2', x: 0, z: 15, width: 30, height: 3, type: 'stone' },
            { id: 'wall3', x: -15, z: 0, width: 30, height: 3, type: 'stone' },
            { id: 'wall4', x: 15, z: 0, width: 30, height: 3, type: 'stone' },
            
            // Interior walls (maze)
            { id: 'wall5', x: -5, z: -5, width: 1, height: 3, type: 'wood' },
            { id: 'wall6', x: 5, z: 5, width: 1, height: 3, type: 'wood' },
            { id: 'wall7', x: -8, z: 2, width: 10, height: 3, type: 'wood' },
            { id: 'wall8', x: 8, z: -2, width: 10, height: 3, type: 'wood' },
            { id: 'wall9', x: 0, z: 0, width: 2, height: 3, type: 'stone' },
            { id: 'wall10', x: -3, z: 8, width: 1, height: 3, type: 'wood' },
            { id: 'wall11', x: 3, z: -8, width: 1, height: 3, type: 'wood' }
        ],
        
        interactiveObjects: [
            {
                id: 'note1',
                type: 'note',
                position: { x: -4, z: -3 },
                message: 'The shadows are watching... they know when your flashlight dies.',
                isCollected: false,
                interactionDistance: 2,
                value: null
            },
            {
                id: 'note2',
                type: 'note',
                position: { x: 5, z: 6 },
                message: 'I found a way out but I need the rusty key. Its somewhere in the darkness...',
                isCollected: false,
                interactionDistance: 2,
                value: null
            },
            {
                id: 'battery1',
                type: 'battery',
                position: { x: -6, z: 4 },
                message: 'Battery +25%',
                isCollected: false,
                interactionDistance: 2,
                value: 25
            },
            {
                id: 'battery2',
                type: 'battery',
                position: { x: 7, z: -5 },
                message: 'Battery +25%',
                isCollected: false,
                interactionDistance: 2,
                value: 25
            },
            {
                id: 'medkit1',
                type: 'medkit',
                position: { x: -2, z: -7 },
                message: 'Health +30',
                isCollected: false,
                interactionDistance: 2,
                value: 30
            },
            {
                id: 'key1',
                type: 'key',
                position: { x: 2, z: 9 },
                message: 'Rusty Key',
                isCollected: false,
                interactionDistance: 2,
                value: 'exit'
            },
            {
                id: 'exit1',
                type: 'exit',
                position: { x: 12, z: 12 },
                message: 'Press E to escape',
                isCollected: false,
                interactionDistance: 3,
                value: null,
                requiresKey: true
            }
        ],
        
        enemies: [
            {
                id: 'shadow1',
                type: 'shadow',
                position: { x: 10, z: 8 },
                patrolPoints: [
                    { x: 10, z: 8 },
                    { x: 10, z: 5 },
                    { x: 7, z: 5 },
                    { x: 7, z: 8 }
                ],
                currentPatrolIndex: 0,
                speed: 0.02,
                detectionRange: 6,
                attackRange: 2,
                attackDamage: 15,
                isActive: true,
                lastMove: Date.now(),
                color: '#330000'
            },
            {
                id: 'shadow2',
                type: 'whisper',
                position: { x: -9, z: -8 },
                patrolPoints: [
                    { x: -9, z: -8 },
                    { x: -9, z: -4 },
                    { x: -5, z: -4 },
                    { x: -5, z: -8 }
                ],
                currentPatrolIndex: 0,
                speed: 0.015,
                detectionRange: 5,
                attackRange: 2,
                attackDamage: 10,
                isActive: true,
                lastMove: Date.now(),
                color: '#331900'
            },
            {
                id: 'shadow3',
                type: 'hunter',
                position: { x: 0, z: -12 },
                speed: 0.025,
                detectionRange: 7,
                attackRange: 2.5,
                attackDamage: 20,
                isActive: true,
                lastMove: Date.now(),
                color: '#330033'
            }
        ],
        
        lights: [
            { id: 'light1', x: 0, z: 0, intensity: 1, flicker: true },
            { id: 'light2', x: -5, z: 5, intensity: 0.8, flicker: false },
            { id: 'light3', x: 5, z: -5, intensity: 0.8, flicker: true }
        ]
    },

    // ===== INPUT HANDLING =====
    input: {
        mouse: { x: 0, y: 0 },
        keys: {},
        isMouseLocked: false
    },

    // ===== TIME TRACKING =====
    time: {
        delta: 0,
        lastFrame: 0,
        gameTime: 0,
        lastEnemyUpdate: 0,
        lastSanityDrain: 0,
        lastBatteryDrain: 0
    },

    // ===== INITIALIZATION =====
    init: function() {
        console.log('Shadow Corridor - Initializing...');
        this.setupEventListeners();
        this.resizeCanvas();
        this.showMainMenu();
    },

    setupEventListeners: function() {
        // Mouse events
        document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        document.addEventListener('click', (e) => this.handleClick(e));
        document.addEventListener('mousedown', () => this.lockMouse());
        
        // Keyboard events
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
        // Window events
        window.addEventListener('resize', () => this.resizeCanvas());
        window.addEventListener('blur', () => this.handleWindowBlur());
        
        // Pointer lock
        document.addEventListener('pointerlockchange', () => this.handlePointerLockChange());
    },

    lockMouse: function() {
        if (!this.state.isRunning || this.state.isPaused) return;
        const canvas = document.getElementById('game-canvas');
        canvas.requestPointerLock();
    },

    handlePointerLockChange: function() {
        const canvas = document.getElementById('game-canvas');
        this.input.isMouseLocked = document.pointerLockElement === canvas;
    },

    resizeCanvas: function() {
        const canvas = document.getElementById('game-canvas');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        this.render(); // Immediate render after resize
    },

    // ===== GAME FLOW =====
    startNewGame: function() {
        console.log('Starting new game...');
        
        // Reset player
        this.player.health = 100;
        this.player.sanity = 100;
        this.player.flashlight.battery = 100;
        this.player.flashlight.isOn = true;
        this.player.position = { x: 0, y: 0, z: 0 };
        this.player.rotation = { x: 0, y: 0 };
        this.player.inventory = [];
        
        // Reset world objects
        this.world.interactiveObjects.forEach(obj => obj.isCollected = false);
        this.world.enemies.forEach(enemy => enemy.isActive = true);
        
        // Reset enemy positions
        this.world.enemies[0].position = { x: 10, z: 8 };
        this.world.enemies[1].position = { x: -9, z: -8 };
        this.world.enemies[2].position = { x: 0, z: -12 };
        
        // Update UI
        this.updateUI();
        this.updateInventoryUI();
        
        // Hide menus, show game
        document.getElementById('main-menu').classList.add('hidden');
        document.getElementById('pause-menu').classList.add('hidden');
        document.getElementById('game-over-menu').classList.add('hidden');
        document.getElementById('controls-menu').classList.add('hidden');
        document.getElementById('credits-menu').classList.add('hidden');
        document.getElementById('game-ui').style.display = 'block';
        
        // Start game
        this.state.isRunning = true;
        this.state.isPaused = false;
        this.state.isGameOver = false;
        this.time.lastFrame = performance.now();
        
        // Add flashlight class
        document.body.classList.add('flashlight-on');
        
        // Set objective
        this.setObjective('Find the rusty key and escape');
        
        // Start game loop
        requestAnimationFrame((t) => this.gameLoop(t));
    },

    pause: function() {
        if (!this.state.isRunning) return;
        this.state.isPaused = true;
        document.getElementById('pause-menu').classList.remove('hidden');
    },

    resume: function() {
        this.state.isPaused = false;
        document.getElementById('pause-menu').classList.add('hidden');
        this.lockMouse();
    },

    gameOver: function(message) {
        this.state.isRunning = false;
        this.state.isGameOver = true;
        document.getElementById('death-message').textContent = message;
        document.getElementById('game-over-menu').classList.remove('hidden');
    },

    restartFromCheckpoint: function() {
        // Simple restart - reset to beginning
        this.startNewGame();
    },

    quitToMenu: function() {
        this.state.isRunning = false;
        document.getElementById('pause-menu').classList.add('hidden');
        document.getElementById('game-over-menu').classList.add('hidden');
        this.showMainMenu();
    },

    showMainMenu: function() {
        document.getElementById('main-menu').classList.remove('hidden');
        document.getElementById('game-ui').style.display = 'none';
        document.body.classList.remove('flashlight-on');
    },

    showControls: function() {
        document.getElementById('main-menu').classList.add('hidden');
        document.getElementById('pause-menu').classList.add('hidden');
        document.getElementById('controls-menu').classList.remove('hidden');
    },

    hideControls: function() {
        document.getElementById('controls-menu').classList.add('hidden');
        if (this.state.isRunning && !this.state.isPaused) {
            document.getElementById('pause-menu').classList.remove('hidden');
        } else {
            document.getElementById('main-menu').classList.remove('hidden');
        }
    },

    showCredits: function() {
        document.getElementById('main-menu').classList.add('hidden');
        document.getElementById('credits-menu').classList.remove('hidden');
    },

    hideCredits: function() {
        document.getElementById('credits-menu').classList.add('hidden');
        document.getElementById('main-menu').classList.remove('hidden');
    },

    // ===== GAME LOOP =====
    gameLoop: function(currentTime) {
        if (!this.state.isRunning) return;
        
        // Calculate delta time
        this.time.delta = Math.min(0.05, (currentTime - this.time.lastFrame) / 1000);
        this.time.lastFrame = currentTime;
        this.time.gameTime += this.time.delta;
        
        if (!this.state.isPaused) {
            // Update game systems
            this.handleMovement();
            this.updateEnemies();
            this.updateFlashlight();
            this.updateSanity();
            this.checkInteractions();
            this.checkCollisions();
            this.checkEnemyCollisions();
        }
        
        // Always render
        this.render();
        
        requestAnimationFrame((t) => this.gameLoop(t));
    },

    // ===== MOVEMENT =====
    handleMovement: function() {
        // Movement speed
        let speed = this.player.isRunning ? 8 : 4;
        speed *= this.time.delta;
        
        // Get movement direction based on rotation
        const forward = Math.cos(this.player.rotation.y);
        const right = Math.sin(this.player.rotation.y);
        
        // Apply movement
        if (this.input.keys['KeyW'] || this.input.keys['ArrowUp']) {
            this.player.position.x += right * speed;
            this.player.position.z += forward * speed;
        }
        if (this.input.keys['KeyS'] || this.input.keys['ArrowDown']) {
            this.player.position.x -= right * speed;
            this.player.position.z -= forward * speed;
        }
        if (this.input.keys['KeyA'] || this.input.keys['ArrowLeft']) {
            this.player.position.x -= forward * speed;
            this.player.position.z += right * speed;
        }
        if (this.input.keys['KeyD'] || this.input.keys['ArrowRight']) {
            this.player.position.x += forward * speed;
            this.player.position.z -= right * speed;
        }
        
        // Running
        this.player.isRunning = this.input.keys['ShiftLeft'] || this.input.keys['ShiftRight'];
        
        // Update rotation from mouse
        if (this.input.isMouseLocked) {
            this.player.rotation.y += this.input.mouse.x * 0.005;
            this.player.rotation.x += this.input.mouse.y * 0.005;
            this.player.rotation.x = Math.max(-1, Math.min(1, this.player.rotation.x));
            
            // Reset mouse movement
            this.input.mouse.x = 0;
            this.input.mouse.y = 0;
        }
        
        // Keep player in bounds
        this.player.position.x = Math.max(-12, Math.min(12, this.player.position.x));
        this.player.position.z = Math.max(-12, Math.min(12, this.player.position.z));
    },

    // ===== ENEMY AI =====
    updateEnemies: function() {
        const now = Date.now();
        if (now - this.time.lastEnemyUpdate < 100) return; // Update every 100ms
        this.time.lastEnemyUpdate = now;
        
        this.world.enemies.forEach(enemy => {
            if (!enemy.isActive) return;
            
            const dx = this.player.position.x - enemy.position.x;
            const dz = this.player.position.z - enemy.position.z;
            const distanceToPlayer = Math.sqrt(dx * dx + dz * dz);
            
            // Check if player is detected (based on flashlight and distance)
            const detectionModifier = this.player.flashlight.isOn ? 1.5 : 1;
            if (distanceToPlayer < enemy.detectionRange * detectionModifier) {
                // Chase player
                const angle = Math.atan2(dz, dx);
                enemy.position.x += Math.cos(angle) * enemy.speed;
                enemy.position.z += Math.sin(angle) * enemy.speed;
            } else if (enemy.patrolPoints) {
                // Patrol behavior
                const target = enemy.patrolPoints[enemy.currentPatrolIndex];
                const dxTarget = target.x - enemy.position.x;
                const dzTarget = target.z - enemy.position.z;
                const distanceToTarget = Math.sqrt(dxTarget * dxTarget + dzTarget * dzTarget);
                
                if (distanceToTarget < 1) {
                    enemy.currentPatrolIndex = (enemy.currentPatrolIndex + 1) % enemy.patrolPoints.length;
                } else {
                    const angle = Math.atan2(dzTarget, dxTarget);
                    enemy.position.x += Math.cos(angle) * enemy.speed * 0.5;
                    enemy.position.z += Math.sin(angle) * enemy.speed * 0.5;
                }
            }
        });
    },

    checkEnemyCollisions: function() {
        this.world.enemies.forEach(enemy => {
            if (!enemy.isActive) return;
            
            const dx = this.player.position.x - enemy.position.x;
            const dz = this.player.position.z - enemy.position.z;
            const distance = Math.sqrt(dx * dx + dz * dz);
            
            if (distance < enemy.attackRange) {
                this.takeDamage(enemy.attackDamage);
                
                // Push enemy back after attack
                enemy.position.x -= dx * 0.5;
                enemy.position.z -= dz * 0.5;
            }
        });
    },

    // ===== FLASHLIGHT SYSTEM =====
    updateFlashlight: function() {
        const now = Date.now();
        
        // Drain battery when on
        if (this.player.flashlight.isOn) {
            if (now - this.time.lastBatteryDrain > 1000) { // Drain every second
                this.player.flashlight.battery = Math.max(0, this.player.flashlight.battery - 1);
                this.time.lastBatteryDrain = now;
                this.updateUI();
            }
            
            // Low battery flicker
            if (this.player.flashlight.battery < 20) {
                if (Math.random() < 0.1) {
                    document.body.classList.toggle('flashlight-on');
                    setTimeout(() => {
                        document.body.classList.add('flashlight-on');
                    }, 100);
                }
            }
        }
        
        // Auto-off when battery dies
        if (this.player.flashlight.battery <= 0) {
            this.player.flashlight.isOn = false;
            document.body.classList.remove('flashlight-on');
            this.showMessage('Flashlight died!');
        }
    },

    toggleFlashlight: function() {
        if (this.player.flashlight.battery > 0) {
            this.player.flashlight.isOn = !this.player.flashlight.isOn;
            if (this.player.flashlight.isOn) {
                document.body.classList.add('flashlight-on');
            } else {
                document.body.classList.remove('flashlight-on');
            }
        } else {
            this.showMessage('Battery is dead!');
        }
    },

    // ===== SANITY SYSTEM =====
    updateSanity: function() {
        const now = Date.now();
        if (now - this.time.lastSanityDrain < 1000) return; // Update every second
        this.time.lastSanityDrain = now;
        
        // Sanity drains in darkness
        if (!this.player.flashlight.isOn) {
            this.player.sanity = Math.max(0, this.player.sanity - 2);
        }
        
        // Sanity drains near enemies
        this.world.enemies.forEach(enemy => {
            if (!enemy.isActive) return;
            const dx = this.player.position.x - enemy.position.x;
            const dz = this.player.position.z - enemy.position.z;
            const distance = Math.sqrt(dx * dx + dz * dz);
            
            if (distance < 8) {
                this.player.sanity = Math.max(0, this.player.sanity - 1);
            }
        });
        
        // Sanity slowly regenerates in light
        if (this.player.flashlight.isOn && this.player.sanity < 100) {
            this.player.sanity = Math.min(100, this.player.sanity + 1);
        }
        
        // Apply sanity effects
        if (this.player.sanity < 30) {
            document.body.classList.add('sanity-low');
            
            // Random whispers at low sanity
            if (Math.random() < 0.1) {
                this.showMessage('*whispers*', 1000);
            }
        } else {
            document.body.classList.remove('sanity-low');
        }
        
        this.updateUI();
        
        // Game over from insanity
        if (this.player.sanity <= 0) {
            this.gameOver('Your mind shattered from fear...');
        }
    },

    // ===== INTERACTION SYSTEM =====
    checkInteractions: function() {
        let nearestObj = null;
        let nearestDist = Infinity;
        
        this.world.interactiveObjects.forEach(obj => {
            if (obj.isCollected) return;
            
            const dx = obj.position.x - this.player.position.x;
            const dz = obj.position.z - this.player.position.z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            
            if (dist < obj.interactionDistance && dist < nearestDist) {
                nearestObj = obj;
                nearestDist = dist;
            }
        });
        
        if (nearestObj) {
            this.showInteractionPrompt(nearestObj);
        } else {
            this.hideInteractionPrompt();
        }
    },

    interact: function() {
        this.world.interactiveObjects.forEach(obj => {
            if (obj.isCollected) return;
            
            const dx = obj.position.x - this.player.position.x;
            const dz = obj.position.z - this.player.position.z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            
            if (dist < obj.interactionDistance) {
                this.handleInteraction(obj);
            }
        });
    },

    handleInteraction: function(obj) {
        switch(obj.type) {
            case 'note':
                this.showMessage(obj.message, 3000);
                obj.isCollected = true;
                break;
                
            case 'battery':
                this.player.flashlight.battery = Math.min(100, 
                    this.player.flashlight.battery + obj.value);
                this.showMessage(`+${obj.value}% Battery`, 2000);
                obj.isCollected = true;
                this.updateUI();
                break;
                
            case 'medkit':
                this.player.health = Math.min(100, this.player.health + obj.value);
                this.showMessage(`+${obj.value} Health`, 2000);
                obj.isCollected = true;
                this.updateUI();
                break;
                
            case 'key':
                if (this.player.inventory.length < this.player.maxInventory) {
                    this.player.inventory.push(obj);
                    this.showMessage('Picked up: Rusty Key', 2000);
                    obj.isCollected = true;
                    this.updateInventoryUI();
                    this.setObjective('Find the exit door');
                } else {
                    this.showMessage('Inventory full!', 1500);
                }
                break;
                
            case 'exit':
                const hasKey = this.player.inventory.some(item => item.type === 'key');
                if (hasKey || !obj.requiresKey) {
                    this.gameOver('You escaped! Congratulations!');
                } else {
                    this.showMessage('The door is locked. Find the key.', 2000);
                }
                break;
        }
    },

    // ===== COLLISION DETECTION =====
    checkCollisions: function() {
        const playerSize = 0.7;
        
        this.world.walls.forEach(wall => {
            const dx = Math.abs(this.player.position.x - wall.x);
            const dz = Math.abs(this.player.position.z - wall.z);
            
            if (dx < playerSize + wall.width/2 && dz < playerSize + 1) {
                // Push player back
                if (dx > dz) {
                    if (this.player.position.x > wall.x) {
                        this.player.position.x = wall.x + wall.width/2 + playerSize;
                    } else {
                        this.player.position.x = wall.x - wall.width/2 - playerSize;
                    }
                } else {
                    if (this.player.position.z > wall.z) {
                        this.player.position.z = wall.z + 1 + playerSize;
                    } else {
                        this.player.position.z = wall.z - 1 - playerSize;
                    }
                }
            }
        });
    },

    // ===== DAMAGE SYSTEM =====
    takeDamage: function(amount) {
        this.player.health = Math.max(0, this.player.health - amount);
        
        // Visual feedback
        const overlay = document.createElement('div');
        overlay.className = 'damage-overlay';
        document.getElementById('game-wrapper').appendChild(overlay);
        setTimeout(() => overlay.remove(), 300);
        
        // Screen shake
        const canvas = document.getElementById('game-canvas');
        canvas.style.transform = 'translate(5px, 5px)';
        setTimeout(() => canvas.style.transform = '', 100);
        
        this.updateUI();
        
        if (this.player.health <= 0) {
            this.gameOver('You were killed by the shadows...');
        }
    },

    // ===== RENDERING =====
    render: function() {
        const canvas = document.getElementById('game-canvas');
        const ctx = canvas.getContext('2d');
        
        // Clear canvas
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Simple 3D rendering (raycasting style)
        const w = canvas.width;
        const h = canvas.height;
        
        // Draw floor and ceiling
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, h/2, w, h/2);
        ctx.fillStyle = '#222';
        ctx.fillRect(0, 0, w, h/2);
        
        // Draw walls (simplified)
        this.world.walls.forEach(wall => {
            const dx = wall.x - this.player.position.x;
            const dz = wall.z - this.player.position.z;
            
            // Transform to camera space
            const rotY = this.player.rotation.y;
            const x = dx * Math.cos(rotY) - dz * Math.sin(rotY);
            const z = dx * Math.sin(rotY) + dz * Math.cos(rotY);
            
            if (z > 0.5) { // Only draw in front
                const scale = 200 / z;
                const screenX = (x * scale) + w/2;
                const screenY = h/2;
                const wallWidth = wall.width * 100 * scale;
                const wallHeight = wall.height * 50 * scale;
                
                if (screenX > -wallWidth/2 && screenX < w + wallWidth/2) {
                    // Shade based on distance and type
                    const shade = Math.min(255, Math.max(100, 255 - z * 10));
                    ctx.fillStyle = `rgb(${shade/2}, ${shade/4}, ${shade/4})`;
                    
                    ctx.fillRect(
                        screenX - wallWidth/2,
                        screenY - wallHeight/2,
                        wallWidth,
                        wallHeight
                    );
                    
                    // Add outline
                    ctx.strokeStyle = '#ff0000';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(
                        screenX - wallWidth/2,
                        screenY - wallHeight/2,
                        wallWidth,
                        wallHeight
                    );
                }
            }
        });
        
        // Draw enemies
        this.world.enemies.forEach(enemy => {
            if (!enemy.isActive) return;
            
            const dx = enemy.position.x - this.player.position.x;
            const dz = enemy.position.z - this.player.position.z;
            const distance = Math.sqrt(dx * dx + dz * dz);
            
            const rotY = this.player.rotation.y;
            const x = dx * Math.cos(rotY) - dz * Math.sin(rotY);
            const z = dx * Math.sin(rotY) + dz * Math.cos(rotY);
            
            if (z > 0.5 && distance < 15) {
                const scale = 200 / z;
                const screenX = (x * scale) + w/2;
                const screenY = h/2;
                const size = 30 * scale;
                
                // Draw enemy (red glowing circle)
                ctx.shadowColor = '#ff0000';
                ctx.shadowBlur = 20;
                ctx.fillStyle = enemy.color || '#330000';
                ctx.beginPath();
                ctx.arc(screenX, screenY - size/2, size/2, 0, Math.PI*2);
                ctx.fill();
                
                // Draw eyes
                ctx.shadowBlur = 10;
                ctx.fillStyle = '#ff0000';
                ctx.beginPath();
                ctx.arc(screenX - size/4, screenY - size, size/6, 0, Math.PI*2);
                ctx.arc(screenX + size/4, screenY - size, size/6, 0, Math.PI*2);
                ctx.fill();
                
                ctx.shadowBlur = 0;
            }
        });
        
        // Draw interactive objects
        this.world.interactiveObjects.forEach(obj => {
            if (obj.isCollected) return;
            
            const dx = obj.position.x - this.player.position.x;
            const dz = obj.position.z - this.player.position.z;
            
            const rotY = this.player.rotation.y;
            const x = dx * Math.cos(rotY) - dz * Math.sin(rotY);
            const z = dx * Math.sin(rotY) + dz * Math.cos(rotY);
            
            if (z > 0.5 && z < 10) {
                const scale = 200 / z;
                const screenX = (x * scale) + w/2;
                const screenY = h/2;
                const size = 15 * scale;
                
                // Draw pickup icon
                ctx.shadowColor = '#ffff00';
                ctx.shadowBlur = 10;
                ctx.fillStyle = '#ffaa00';
                ctx.beginPath();
                
                switch(obj.type) {
                    case 'battery':
                        ctx.fillStyle = '#00ff00';
                        ctx.fillRect(screenX - size/2, screenY - size, size, size*2);
                        break;
                    case 'medkit':
                        ctx.fillStyle = '#ff0000';
                        ctx.fillRect(screenX - size/2, screenY - size, size, size*2);
                        ctx.fillRect(screenX - size, screenY - size/2, size*2, size);
                        break;
                    case 'key':
                        ctx.fillStyle = '#ffaa00';
                        ctx.beginPath();
                        ctx.arc(screenX, screenY - size/2, size/2, 0, Math.PI*2);
                        ctx.fill();
                        break;
                    default:
                        ctx.fillStyle = '#ffffff';
                        ctx.beginPath();
                        ctx.arc(screenX, screenY - size/2, size/3, 0, Math.PI*2);
                        ctx.fill();
                }
                
                ctx.shadowBlur = 0;
            }
        });
    },

    // ===== UI FUNCTIONS =====
    updateUI: function() {
        document.getElementById('health-fill').style.width = 
            (this.player.health / this.player.maxHealth * 100) + '%';
        document.getElementById('health-value').textContent = 
            Math.round(this.player.health);
        
        document.getElementById('sanity-fill').style.width = 
            (this.player.sanity / this.player.maxSanity * 100) + '%';
        document.getElementById('sanity-value').textContent = 
            Math.round(this.player.sanity);
        
        document.getElementById('flashlight-fill').style.width = 
            this.player.flashlight.battery + '%';
        document.getElementById('flashlight-value').textContent = 
            Math.round(this.player.flashlight.battery) + '%';
    },

    updateInventoryUI: function() {
        const slots = document.querySelectorAll('.inventory-slot');
        slots.forEach((slot, index) => {
            slot.removeAttribute('data-item');
            if (this.player.inventory[index]) {
                slot.setAttribute('data-item', this.player.inventory[index].type);
            }
        });
    },

    showInteractionPrompt: function(obj) {
        const prompt = document.getElementById('interaction-prompt');
        const text = document.getElementById('interaction-text');
        
        let action = 'Interact';
        switch(obj.type) {
            case 'note': action = 'Read'; break;
            case 'battery': action = 'Take Battery'; break;
            case 'medkit': action = 'Take Medkit'; break;
            case 'key': action = 'Take Key'; break;
            case 'exit': action = 'Open Door'; break;
        }
        
        text.textContent = action;
        prompt.classList.remove('hidden');
    },

    hideInteractionPrompt: function() {
        document.getElementById('interaction-prompt').classList.add('hidden');
    },

    showMessage: function(text, duration = 2000) {
        const msgArea = document.getElementById('message-area');
        msgArea.textContent = text;
        msgArea.classList.remove('hidden');
        
        setTimeout(() => {
            msgArea.classList.add('hidden');
        }, duration);
    },

    setObjective: function(text) {
        document.getElementById('current-objective').textContent = text;
    },

    // ===== INPUT HANDLERS =====
    handleMouseMove: function(e) {
        if (this.input.isMouseLocked) {
            this.input.mouse.x = e.movementX;
            this.input.mouse.y = e.movementY;
        }
    },

    handleClick: function(e) {
        if (!this.state.isRunning || this.state.isPaused) return;
        this.interact();
    },

    handleKeyDown: function(e) {
        this.input.keys[e.code] = true;
        
        // Global keys
        if (e.code === 'Escape') {
            if (this.state.isRunning) {
                if (this.state.isPaused) {
                    this.resume();
                } else {
                    this.pause();
                }
            }
        }
        
        if (this.state.isRunning && !this.state.isPaused) {
            if (e.code === 'KeyF') {
                this.toggleFlashlight();
            }
            if (e.code === 'KeyE') {
                this.interact();
            }
        }
        
        // Prevent default for game controls
        if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 
             'ArrowLeft', 'ArrowRight', 'KeyF', 'KeyE', 'ShiftLeft', 
             'ShiftRight', 'Escape'].includes(e.code)) {
            e.preventDefault();
        }
    },

    handleKeyUp: function(e) {
        this.input.keys[e.code] = false;
    },

    handleWindowBlur: function() {
        this.input.keys = {};
    }
};

// ===== START THE GAME =====
window.addEventListener('load', () => {
    Game.init();
});
