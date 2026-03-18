/**
 * SHADOW CORRIDOR - First Person Horror Game
 * Main Game Engine
 */

// ===== GAME NAMESPACE =====
const Game = {
    // Game state
    state: {
        isRunning: false,
        isPaused: false,
        isGameOver: false,
        currentLevel: 1,
        difficulty: 'normal',
        checkpoint: null
    },

    // Player stats
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
        maxInventory: 4
    },

    // Game world
    world: {
        walls: [],
        interactiveObjects: [],
        enemies: [],
        lights: [],
        ambientSounds: []
    },

    // Input handling
    input: {
        mouse: { x: 0, y: 0 },
        keys: {},
        isMouseLocked: false
    },

    // Time tracking
    time: {
        delta: 0,
        lastFrame: 0,
        gameTime: 0
    },

    // ===== INITIALIZATION =====
    init: function() {
        console.log('Shadow Corridor - Initializing...');
        this.setupEventListeners();
        this.createWorld();
        this.updateUI();
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
        window.addEventListener('resize', () => this.handleResize());
        window.addEventListener('blur', () => this.handleWindowBlur());
    },

    lockMouse: function() {
        if (!this.state.isRunning) return;
        
        const canvas = document.getElementById('game-canvas');
        canvas.requestPointerLock = canvas.requestPointerLock || 
                                   canvas.mozRequestPointerLock ||
                                   canvas.webkitRequestPointerLock;
        
        canvas.requestPointerLock();
        
        // Track pointer lock changes
        document.addEventListener('pointerlockchange', () => this.handlePointerLockChange());
        document.addEventListener('mozpointerlockchange', () => this.handlePointerLockChange());
        document.addEventListener('webkitpointerlockchange', () => this.handlePointerLockChange());
    },

    handlePointerLockChange: function() {
        this.input.isMouseLocked = document.pointerLockElement === document.getElementById('game-canvas');
    },

    // ===== WORLD CREATION =====
    createWorld: function() {
        // Create walls (simplified for now)
        this.world.walls = [
            // Outer walls
            { id: 'wall1', x: 0, z: -10, width: 20, height: 3, type: 'stone' },
            { id: 'wall2', x: 0, z: 10, width: 20, height: 3, type: 'stone' },
            { id: 'wall3', x: -10, z: 0, width: 20, height: 3, type: 'stone' },
            { id: 'wall4', x: 10, z: 0, width: 20, height: 3, type: 'stone' },
            
            // Interior walls
            { id: 'wall5', x: -5, z: -5, width: 1, height: 3, type: 'wood' },
            { id: 'wall6', x: 5, z: 5, width: 1, height: 3, type: 'wood' }
        ];

        // Create interactive objects
        this.world.interactiveObjects = [
            {
                id: 'note1',
                type: 'note',
                position: { x: -3, z: -2 },
                message: 'They come from the shadows...',
                isCollected: false,
                interactionDistance: 2
            },
            {
                id: 'battery1',
                type: 'battery',
                position: { x: 4, z: 3 },
                value: 25,
                isCollected: false,
                interactionDistance: 2
            },
            {
                id: 'key1',
                type: 'key',
                position: { x: -2, z: 4 },
                doorId: 'door1',
                isCollected: false,
                interactionDistance: 2
            },
            {
                id: 'medkit1',
                type: 'medkit',
                position: { x: 1, z: -4 },
                value: 30,
                isCollected: false,
                interactionDistance: 2
            }
        ];

        // Create enemies
        this.world.enemies = [
            {
                id: 'enemy1',
                type: 'shadow',
                position: { x: 8, z: 8 },
                patrolPoints: [
                    { x: 8, z: 8 },
                    { x: 8, z: 5 },
                    { x: 5, z: 5 },
                    { x: 5, z: 8 }
                ],
                currentPatrolIndex: 0,
                speed: 0.02,
                detectionRange: 5,
                attackRange: 1.5,
                attackDamage: 15,
                isActive: true,
                lastMove: Date.now()
            },
            {
                id: 'enemy2',
                type: 'whisper',
                position: { x: -7, z: -7 },
                speed: 0.015,
                detectionRange: 4,
                attackDamage: 10,
                isActive: true,
                lastMove: Date.now()
            }
        ];

        // Create lights
        this.world.lights = [
            { id: 'light1', position: { x: 0, z: 0 }, intensity: 1, isFlickering: true },
            { id: 'light2', position: { x: -5, z: 5 }, intensity: 0.8, isFlickering: false }
        ];
    },

    // ===== GAME FLOW =====
    startNewGame: function() {
        console.log('Starting new game...');
        
        // Reset player stats
        this.player.health = 100;
        this.player.sanity = 100;
        this.player.flashlight.battery = 100;
        this.player.flashlight.isOn = true;
        this.player.position = { x: 0, y: 0, z: 0 };
        this.player.inventory = [];
        
        // Reset world objects
        this.world.interactiveObjects.forEach(obj => obj.isCollected = false);
        this.world.enemies.forEach(enemy => enemy.isActive = true);
        
        // Update UI
        this.updateUI();
        
        // Show game UI, hide menus
        document.getElementById('main-menu').classList.add('hidden');
        document.getElementById('game-ui').style.display = 'block';
        
        // Start game loop
        this.state.isRunning = true;
        this.state.isGameOver = false;
        this.time.lastFrame = performance.now();
        requestAnimationFrame((t) => this.gameLoop(t));
        
        // Set initial objective
        this.setObjective('Find a way out of the corridor');
    },

    pause: function() {
        if (!this.state.isRunning) return;
        
        this.state.isPaused = true;
        document.getElementById('pause-menu').classList.remove('hidden');
    },

    resume: function() {
        this.state.isPaused = false;
        document.getElementById('pause-menu').classList.add('hidden');
    },

    gameOver: function(deathMessage = 'You have succumbed to the darkness...') {
        this.state.isRunning = false;
        this.state.isGameOver = true;
        
        document.getElementById('death-message').textContent = deathMessage;
        document.getElementById('game-over-menu').classList.remove('hidden');
    },

    // ===== GAME LOOP =====
    gameLoop: function(currentTime) {
        if (!this.state.isRunning) return;
        
        // Calculate delta time
        this.time.delta = (currentTime - this.time.lastFrame) / 1000;
        this.time.lastFrame = currentTime;
        this.time.gameTime += this.time.delta;
        
        if (!this.state.isPaused) {
            // Update game systems
            this.updatePlayer();
            this.updateEnemies();
            this.checkInteractions();
            this.updateFlashlight();
            this.updateSanity();
            this.checkCollisions();
            this.render();
        }
        
        requestAnimationFrame((t) => this.gameLoop(t));
    },

    // ===== PLAYER UPDATES =====
    updatePlayer: function() {
        // Handle movement
        const speed = 5.0; // units per second
        const moveSpeed = speed * this.time.delta;
        
        if (this.input.keys['KeyW'] || this.input.keys['ArrowUp']) {
            this.player.position.z -= moveSpeed;
        }
        if (this.input.keys['KeyS'] || this.input.keys['ArrowDown']) {
            this.player.position.z += moveSpeed;
        }
        if (this.input.keys['KeyA'] || this.input.keys['ArrowLeft']) {
            this.player.position.x -= moveSpeed;
        }
        if (this.input.keys['KeyD'] || this.input.keys['ArrowRight']) {
            this.player.position.x += moveSpeed;
        }
        
        // Update rotation based on mouse
        if (this.input.isMouseLocked) {
            this.player.rotation.y += this.input.mouse.x * 0.002;
            this.player.rotation.x = Math.max(-Math.PI/2, 
                                     Math.min(Math.PI/2, 
                                     this.player.rotation.x + this.input.mouse.y * 0.002));
        }
        
        // Drain flashlight battery when moving
        if (this.player.flashlight.isOn && 
            (this.input.keys['KeyW'] || this.input.keys['KeyS'] || 
             this.input.keys['KeyA'] || this.input.keys['KeyD'])) {
            this.player.flashlight.battery = Math.max(0, 
                this.player.flashlight.battery - 0.5 * this.time.delta);
            this.updateUI();
            
            if (this.player.flashlight.battery <= 0) {
                this.player.flashlight.isOn = false;
            }
        }
    },

    // ===== ENEMY AI =====
    updateEnemies: function() {
        this.world.enemies.forEach(enemy => {
            if (!enemy.isActive) return;
            
            const now = Date.now();
            if (now - enemy.lastMove < 100) return; // Throttle updates
            
            // Simple patrol or chase behavior
            const dx = this.player.position.x - enemy.position.x;
            const dz = this.player.position.z - enemy.position.z;
            const distanceToPlayer = Math.sqrt(dx * dx + dz * dz);
            
            if (distanceToPlayer < enemy.detectionRange) {
                // Chase player
                const angle = Math.atan2(dz, dx);
                enemy.position.x += Math.cos(angle) * enemy.speed;
                enemy.position.z += Math.sin(angle) * enemy.speed;
                
                // Attack if close enough
                if (distanceToPlayer < enemy.attackRange) {
                    this.takeDamage(enemy.attackDamage);
                }
            } else if (enemy.patrolPoints) {
                // Patrol behavior
                const target = enemy.patrolPoints[enemy.currentPatrolIndex];
                const dxTarget = target.x - enemy.position.x;
                const dzTarget = target.z - enemy.position.z;
                const distanceToTarget = Math.sqrt(dxTarget * dxTarget + dzTarget * dzTarget);
                
                if (distanceToTarget < 0.5) {
                    enemy.currentPatrolIndex = (enemy.currentPatrolIndex + 1) % enemy.patrolPoints.length;
                } else {
                    const angle = Math.atan2(dzTarget, dxTarget);
                    enemy.position.x += Math.cos(angle) * enemy.speed * 0.5;
                    enemy.position.z += Math.sin(angle) * enemy.speed * 0.5;
                }
            }
            
            enemy.lastMove = now;
        });
    },

    // ===== INTERACTION SYSTEM =====
    checkInteractions: function() {
        let nearestObject = null;
        let nearestDistance = Infinity;
        
        this.world.interactiveObjects.forEach(obj => {
            if (obj.isCollected) return;
            
            const dx = obj.position.x - this.player.position.x;
            const dz = obj.position.z - this.player.position.z;
            const distance = Math.sqrt(dx * dx + dz * dz);
            
            if (distance < obj.interactionDistance && distance < nearestDistance) {
                nearestObject = obj;
                nearestDistance = distance;
            }
        });
        
        if (nearestObject) {
            this.showInteractionPrompt(nearestObject);
        } else {
            this.hideInteractionPrompt();
        }
    },

    interact: function() {
        this.world.interactiveObjects.forEach(obj => {
            if (obj.isCollected) return;
            
            const dx = obj.position.x - this.player.position.x;
            const dz = obj.position.z - this.player.position.z;
            const distance = Math.sqrt(dx * dx + dz * dz);
            
            if (distance < obj.interactionDistance) {
                this.handleInteraction(obj);
            }
        });
    },

    handleInteraction: function(obj) {
        switch(obj.type) {
            case 'note':
                this.showMessage(obj.message);
                obj.isCollected = true;
                break;
                
            case 'battery':
                this.player.flashlight.battery = Math.min(100, 
                    this.player.flashlight.battery + obj.value);
                this.showMessage(`Battery +${obj.value}%`);
                obj.isCollected = true;
                this.updateUI();
                break;
                
            case 'medkit':
                this.player.health = Math.min(100, this.player.health + obj.value);
                this.showMessage(`Health +${obj.value}`);
                obj.isCollected = true;
                this.updateUI();
                break;
                
            case 'key':
                if (this.player.inventory.length < this.player.maxInventory) {
                    this.player.inventory.push(obj);
                    this.showMessage(`Picked up: ${obj.id}`);
                    obj.isCollected = true;
                    this.updateInventoryUI();
                } else {
                    this.showMessage('Inventory full!');
                }
                break;
        }
    },

    // ===== DAMAGE SYSTEM =====
    takeDamage: function(amount) {
        this.player.health = Math.max(0, this.player.health - amount);
        this.player.sanity = Math.max(0, this.player.sanity - amount * 0.5);
        
        // Visual feedback
        this.showDamageEffect();
        this.updateUI();
        
        if (this.player.health <= 0) {
            this.gameOver('You were killed by the shadows...');
        }
        
        if (this.player.sanity <= 0) {
            this.gameOver('Your mind shattered from fear...');
        }
    },

    showDamageEffect: function() {
        const overlay = document.createElement('div');
        overlay.className = 'damage-overlay';
        document.getElementById('game-wrapper').appendChild(overlay);
        
        setTimeout(() => overlay.remove(), 300);
    },

    // ===== SANITY SYSTEM =====
    updateSanity: function() {
        // Sanity drains slowly in darkness
        if (!this.player.flashlight.isOn) {
            this.player.sanity = Math.max(0, this.player.sanity - 0.1 * this.time.delta);
            this.updateUI();
        }
        
        // Sanity regenerates slightly in light
        if (this.player.flashlight.isOn && this.player.sanity < 100) {
            this.player.sanity = Math.min(100, this.player.sanity + 0.05 * this.time.delta);
            this.updateUI();
        }
        
        // Sanity effects
        if (this.player.sanity < 30) {
            // Add visual/audio distortions
            this.applyInsanityEffects();
        }
    },

    applyInsanityEffects: function() {
        // Will implement visual distortions here
        // For now, just log
        if (Math.random() < 0.01) {
            console.log('*whispers*');
        }
    },

    // ===== FLASHLIGHT SYSTEM =====
    updateFlashlight: function() {
        if (this.player.flashlight.isOn) {
            document.body.classList.add('flashlight-on');
        } else {
            document.body.classList.remove('flashlight-on');
        }
    },

    toggleFlashlight: function() {
        if (this.player.flashlight.battery > 0) {
            this.player.flashlight.isOn = !this.player.flashlight.isOn;
        } else {
            this.showMessage('Flashlight battery is dead!');
        }
    },

    // ===== COLLISION DETECTION =====
    checkCollisions: function() {
        // Simple collision with walls
        this.world.walls.forEach(wall => {
            // Simplified box collision
            const playerHalfSize = 0.5;
            
            if (Math.abs(this.player.position.x - wall.x) < playerHalfSize + wall.width/2 &&
                Math.abs(this.player.position.z - wall.z) < playerHalfSize + 1) {
                
                // Push player back
                if (this.player.position.x > wall.x) {
                    this.player.position.x = wall.x + wall.width/2 + playerHalfSize;
                } else {
                    this.player.position.x = wall.x - wall.width/2 - playerHalfSize;
                }
            }
        });
    },

    // ===== RENDERING =====
    render: function() {
        // This will be expanded with actual 3D rendering
        // For now, just update the view based on rotation
        
        const canvas = document.getElementById('game-canvas');
        const ctx = canvas.getContext('2d');
        
        // Clear canvas
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw simple representation of world
        ctx.save();
        
        // Apply camera transformation
        ctx.translate(canvas.width/2, canvas.height/2);
        ctx.rotate(this.player.rotation.y);
        
        // Draw walls (simplified)
        ctx.fillStyle = '#333';
        this.world.walls.forEach(wall => {
            const screenX = (wall.x - this.player.position.x) * 50;
            const screenZ = (wall.z - this.player.position.z) * 50;
            
            if (screenZ > 0) { // Only draw in front
                const scale = 200 / screenZ;
                const x = screenX * scale;
                const y = 0;
                const w = wall.width * 100 * scale;
                const h = wall.height * 50 * scale;
                
                ctx.fillStyle = '#666';
                ctx.fillRect(x - w/2, y - h/2, w, h);
            }
        });
        
        ctx.restore();
    },

    // ===== UI UPDATES =====
    updateUI: function() {
        // Health
        document.getElementById('health-fill').style.width = 
            (this.player.health / this.player.maxHealth * 100) + '%';
        document.getElementById('health-value').textContent = 
            Math.round(this.player.health);
        
        // Sanity
        document.getElementById('sanity-fill').style.width = 
            (this.player.sanity / this.player.maxSanity * 100) + '%';
        document.getElementById('sanity-value').textContent = 
            Math.round(this.player.sanity);
        
        // Flashlight
        document.getElementById('flashlight-fill').style.width = 
            this.player.flashlight.battery + '%';
        document.getElementById('flashlight-value').textContent = 
            Math.round(this.player.flashlight.battery) + '%';
    },

    updateInventoryUI: function() {
        const slots = document.querySelectorAll('.inventory-slot');
        slots.forEach((slot, index) => {
            if (this.player.inventory[index]) {
                slot.style.background = '#333';
                slot.setAttribute('data-item', this.player.inventory[index].type);
            } else {
                slot.style.background = 'rgba(0,0,0,0.7)';
                slot.removeAttribute('data-item');
            }
        });
    },

    showInteractionPrompt: function(obj) {
        const prompt = document.getElementById('interaction-prompt');
        const text = document.getElementById('interaction-text');
        
        let actionText = '';
        switch(obj.type) {
            case 'note': actionText = 'Read Note'; break;
            case 'battery': actionText = 'Pick up Battery'; break;
            case 'medkit': actionText = 'Take Medkit'; break;
            case 'key': actionText = 'Take Key'; break;
            default: actionText = 'Interact';
        }
        
        text.textContent = actionText;
        prompt.classList.remove('hidden');
    },

    hideInteractionPrompt: function() {
        document.getElementById('interaction-prompt').classList.add('hidden');
    },

    showMessage: function(message) {
        const prompt = document.getElementById('interaction-prompt');
        const text = document.getElementById('interaction-text');
        const key = document.getElementById('interaction-key');
        
        key.style.display = 'none';
        text.textContent = message;
        prompt.classList.remove('hidden');
        
        setTimeout(() => {
            key.style.display = 'block';
            this.hideInteractionPrompt();
        }, 2000);
    },

    setObjective: function(objective) {
        document.getElementById('current-objective').textContent = objective;
    },

    // ===== INPUT HANDLERS =====
    handleMouseMove: function(e) {
        if (this.input.isMouseLocked) {
            this.input.mouse.x = e.movementX;
            this.input.mouse.y = e.movementY;
        }
    },

    handleClick: function(e) {
        if (!this.state.isRunning) return;
        if (this.state.isPaused) return;
        
        // Check for interaction
        this.interact();
    },

    handleKeyDown: function(e) {
        this.input.keys[e.code] = true;
        
        // Global keys
        if (e.code === 'Escape') {
            if (this.state.isPaused) {
                this.resume();
            } else {
                this.pause();
            }
        }
        
        if (e.code === 'KeyF') {
            this.toggleFlashlight();
        }
        
        if (e.code === 'KeyE') {
            this.interact();
        }
        
        // Prevent default for game controls
        if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 
             'ArrowLeft', 'ArrowRight', 'KeyF', 'KeyE', 'Escape'].includes(e.code)) {
            e.preventDefault();
        }
    },

    handleKeyUp: function(e) {
        this.input.keys[e.code] = false;
    },

    handleResize: function() {
        // Adjust canvas size
        const canvas = document.getElementById('game-canvas');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    },

    handleWindowBlur: function() {
        // Clear input when window loses focus
        this.input.keys = {};
    },

    // ===== MENU FUNCTIONS =====
    showOptions: function() {
        console.log('Options menu - To be implemented');
        // Will implement options menu
    },

    showCredits: function() {
        console.log('Credits - To be implemented');
        // Will implement credits
    },

    quitToMenu: function() {
        this.state.isRunning = false;
        document.getElementById('pause-menu').classList.add('hidden');
        document.getElementById('game-over-menu').classList.add('hidden');
        document.getElementById('main-menu').classList.remove('hidden');
        document.getElementById('game-ui').style.display = 'none';
    },

    restartFromCheckpoint: function() {
        // Reset to last checkpoint
        if (this.state.checkpoint) {
            this.player.position = { ...this.state.checkpoint.position };
            this.player.health = this.state.checkpoint.health;
            this.player.sanity = this.state.checkpoint.sanity;
            this.player.flashlight.battery = this.state.checkpoint.battery;
            
            this.state.isRunning = true;
            this.state.isGameOver = false;
            document.getElementById('game-over-menu').classList.add('hidden');
            this.updateUI();
        } else {
            // No checkpoint, start new game
            this.startNewGame();
        }
    }
};

// ===== INITIALIZE GAME WHEN PAGE LOADS =====
window.addEventListener('load', () => {
    Game.init();
    Game.handleResize(); // Set initial canvas size
});
