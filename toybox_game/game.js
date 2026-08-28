// --- UI Management ---
let coins = 500;
let diamonds = 50;

function updateCurrencyUI() {
    document.getElementById('coin-amount').innerText = coins;
    document.getElementById('diamond-amount').innerText = diamonds;
}

function showScreen(screenId) {
    // Hide all screens
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    // Show target
    document.getElementById(screenId).classList.add('active');

    // Manage 3D Canvas visibility logic
    if (screenId === 'game-ui') {
        isGameRunning = true;
        document.getElementById('game-container').style.display = 'block';
    } else {
        isGameRunning = false;
        document.getElementById('game-container').style.display = 'none'; // hide 3D in menus
    }
}

function buySkin(cost, currency) {
    if (currency === 'coin' && coins >= cost) {
        coins -= cost;
        alert("Skin purchased with Coins!");
    } else if (currency === 'diamond' && diamonds >= cost) {
        diamonds -= cost;
        alert("Premium Skin purchased with Diamonds!");
    } else {
        alert("Not enough currency!");
    }
    updateCurrencyUI();
}

// --- 3D Scene Setup ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x222222); // Darker background for menus initially

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 25, 20);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('game-container').appendChild(renderer.domElement);
document.getElementById('game-container').style.display = 'none'; // Hide initially

const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(10, 20, 10);
scene.add(dirLight);

// Ground (Will change color based on level)
const groundGeo = new THREE.PlaneGeometry(120, 120);
const groundMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 }); // Default brown
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// --- Game State ---
let isGameRunning = false;
let playerMesh;
let playerType = 'mecha';
const playerSpeed = 12;
const bullets = [];
const enemies = [];
let lastTime = performance.now();

// Progression
let gameStage = 1; // 1 to 10
let inGameLevel = 1; // Toy Power (1-10)
let currentXP = 0;
let xpToNextLevel = 50;

// Input tracking
const keys = { w: false, a: false, s: false, d: false };
const mouse = new THREE.Vector2();
const raycaster = new THREE.Raycaster();
const planeNormal = new THREE.Vector3(0, 1, 0);
const plane = new THREE.Plane(planeNormal, 0);

window.addEventListener('keydown', (e) => { if (keys.hasOwnProperty(e.key.toLowerCase())) keys[e.key.toLowerCase()] = true; });
window.addEventListener('keyup', (e) => { if (keys.hasOwnProperty(e.key.toLowerCase())) keys[e.key.toLowerCase()] = false; });
window.addEventListener('mousemove', (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
});
window.addEventListener('mousedown', (e) => {
    // Only shoot if game is active AND not clicking UI
    if (isGameRunning && e.button === 0 && e.target.tagName !== 'BUTTON') shoot();
});

// --- Game Logic ---
function startGame(type) {
    playerType = type;
    showScreen('game-ui');

    // Setup Player
    if (playerMesh) scene.remove(playerMesh);
    let geo, mat;
    if (type === 'mecha') {
        geo = new THREE.BoxGeometry(2, 2.5, 2); mat = new THREE.MeshLambertMaterial({ color: 0x3498db });
    } else if (type === 'teddy') {
        geo = new THREE.SphereGeometry(1.5, 32, 32); mat = new THREE.MeshLambertMaterial({ color: 0xe67e22 });
    } else if (type === 'doll') {
        geo = new THREE.CylinderGeometry(0.5, 1, 3, 16); mat = new THREE.MeshLambertMaterial({ color: 0xe74c3c });
    }
    playerMesh = new THREE.Mesh(geo, mat);
    playerMesh.position.y = 1.5;
    scene.add(playerMesh);

    // Reset State
    gameStage = 1;
    inGameLevel = 1;
    currentXP = 0;
    xpToNextLevel = 50;
    enemies.forEach(e => scene.remove(e.mesh)); enemies.length = 0;
    bullets.forEach(b => scene.remove(b.mesh)); bullets.length = 0;

    updateEnvironment();
    updateHUD();

    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
}

function updateEnvironment() {
    // Change floor color/sky based on stage to simulate different rooms
    if (gameStage <= 2) {
        ground.material.color.setHex(0x8B4513); // Wood floor
        scene.background = new THREE.Color(0x87CEEB); // Day room
        document.getElementById('stage-name').innerText = "The Wooden Floor";
    } else if (gameStage <= 5) {
        ground.material.color.setHex(0x2ecc71); // Green Playmat
        scene.background = new THREE.Color(0xFFE4B5); // Warm room
        document.getElementById('stage-name').innerText = "The Playmat Area";
    } else {
        ground.material.color.setHex(0x34495e); // Dark carpet
        scene.background = new THREE.Color(0x2c3e50); // Night room
        document.getElementById('stage-name').innerText = "Living Room (Boss Territory)";
    }
}

function shoot() {
    raycaster.setFromCamera(mouse, camera);
    const intersectPoint = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, intersectPoint);

    if (intersectPoint) {
        // Different attacks based on character and level
        let bSize = 0.5 + (inGameLevel * 0.1);
        let bColor = 0xffff00;
        if (playerType === 'doll') bColor = 0xff69b4; // Pink magic
        if (playerType === 'teddy') { bSize *= 2; bColor = 0xffaa00; } // Big slow punches

        const bulletMesh = new THREE.Mesh(new THREE.SphereGeometry(bSize, 8, 8), new THREE.MeshBasicMaterial({ color: bColor }));
        bulletMesh.position.copy(playerMesh.position);

        const direction = new THREE.Vector3().subVectors(intersectPoint, playerMesh.position).normalize();
        direction.y = 0; direction.normalize();

        scene.add(bulletMesh);
        bullets.push({ mesh: bulletMesh, dir: direction, speed: playerType === 'teddy' ? 15 : 25, power: inGameLevel });
    }
}

function useUltimate() {
    if (inGameLevel >= 3) {
        inGameLevel -= 2;
        updateHUD();
        // Clear enemies
        enemies.forEach(e => scene.remove(e.mesh));
        enemies.length = 0;
        // Flash screen
        const oldBg = scene.background.getHex();
        scene.background = new THREE.Color(0xffffff);
        setTimeout(() => scene.background = new THREE.Color(oldBg), 150);
    }
}

function spawnEnemy() {
    if (!isGameRunning) return;

    const isBossStage = gameStage >= 6;
    const spawnPetBoss = isBossStage && Math.random() < 0.1; // 10% chance in later stages

    let geo, mat, speed, hp, size;

    if (spawnPetBoss) {
        // The Cat/Dog Boss
        geo = new THREE.CylinderGeometry(3, 3, 12, 16);
        mat = new THREE.MeshLambertMaterial({ color: 0x95a5a6 });
        speed = 4 + (gameStage * 0.5);
        hp = 100 + (gameStage * 20);
        size = 4;

        document.getElementById('boss-warning').style.display = 'block';
        setTimeout(() => document.getElementById('boss-warning').style.display = 'none', 2000);
    } else {
        // Normal Craft-lings
        geo = new THREE.DodecahedronGeometry(1);
        mat = new THREE.MeshLambertMaterial({ color: 0x9b59b6 }); // Purple dough
        speed = 6 + gameStage;
        hp = 10 + (gameStage * 5);
        size = 1.5;
    }

    const enemyMesh = new THREE.Mesh(geo, mat);
    const angle = Math.random() * Math.PI * 2;
    const radius = 40;
    enemyMesh.position.set(Math.cos(angle) * radius, size/2, Math.sin(angle) * radius);

    scene.add(enemyMesh);
    enemies.push({ mesh: enemyMesh, speed: speed, hp: hp, isBoss: spawnPetBoss, size: size });
}

setInterval(spawnEnemy, 1500);

function updateHUD() {
    document.getElementById('game-stage').innerText = gameStage;
    document.getElementById('in-game-level').innerText = inGameLevel;
    const xpPercent = Math.min(100, Math.floor((currentXP / xpToNextLevel) * 100));
    document.getElementById('xp-display').innerText = `${xpPercent}%`;
}

function gainXP(amount) {
    currentXP += amount;
    if (currentXP >= xpToNextLevel) {
        // Level up Power
        if (inGameLevel < 10) {
            inGameLevel++;
            currentXP -= xpToNextLevel;
            xpToNextLevel = Math.floor(xpToNextLevel * 1.5);
            playerMesh.scale.setScalar(1 + (inGameLevel * 0.05));
        } else {
            currentXP = xpToNextLevel; // Max
        }

        // Progress Stage logic (Every 3 power level ups, advance stage)
        if (inGameLevel % 3 === 0 && gameStage < 10) {
            advanceStage();
        }
    }
    updateHUD();
}

function advanceStage() {
    gameStage++;
    updateEnvironment();

    // Show story popup
    isGameRunning = false; // Pause
    const popup = document.getElementById('story-popup');
    popup.style.display = 'block';

    if (gameStage === 6) {
        document.getElementById('story-title').innerText = "Stage 6: The Living Room";
        document.getElementById('story-text').innerText = "Watch out! The humans left the family pet here. Beware of the giant paws!";
    } else {
        document.getElementById('story-title').innerText = `Stage ${gameStage} Reached!`;
        document.getElementById('story-text').innerText = "The toys march onward into more dangerous territory.";
    }

    // Resume logic is handled via the Continue button calling a small wrapper
    popup.querySelector('button').onclick = () => {
        popup.style.display = 'none';
        isGameRunning = true;
        lastTime = performance.now();
        requestAnimationFrame(gameLoop);
    };
}

function gameOver() {
    isGameRunning = false;
    let earned = gameStage * 15;
    coins += earned;
    document.getElementById('earned-coins').innerText = earned;
    updateCurrencyUI();
    showScreen('game-over');
}

function gameLoop() {
    if (!isGameRunning) return;

    const now = performance.now();
    const dt = (now - lastTime) / 1000;
    lastTime = now;

    // Player Move
    const moveDir = new THREE.Vector3(0, 0, 0);
    if (keys.w) moveDir.z -= 1;
    if (keys.s) moveDir.z += 1;
    if (keys.a) moveDir.x -= 1;
    if (keys.d) moveDir.x += 1;

    if (moveDir.length() > 0) moveDir.normalize();
    playerMesh.position.addScaledVector(moveDir, playerSpeed * dt);

    // Constrain
    playerMesh.position.x = Math.max(-55, Math.min(55, playerMesh.position.x));
    playerMesh.position.z = Math.max(-55, Math.min(55, playerMesh.position.z));

    // Camera follow
    camera.position.x += (playerMesh.position.x - camera.position.x) * 0.1;
    camera.position.z += (playerMesh.position.z + 25 - camera.position.z) * 0.1;
    camera.lookAt(playerMesh.position.x, 0, playerMesh.position.z);

    // Bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        b.mesh.position.addScaledVector(b.dir, b.speed * dt);

        if (b.mesh.position.length() > 80) {
            scene.remove(b.mesh); bullets.splice(i, 1); continue;
        }

        // Collisions
        for (let j = enemies.length - 1; j >= 0; j--) {
            const e = enemies[j];
            const dist = b.mesh.position.distanceTo(e.mesh.position);

            if (dist < (e.size + b.mesh.geometry.parameters.radius)) {
                e.hp -= (10 + (b.power * 4));
                scene.remove(b.mesh); bullets.splice(i, 1);

                if (e.hp <= 0) {
                    scene.remove(e.mesh); enemies.splice(j, 1);
                    gainXP(e.isBoss ? 50 : 15);
                }
                break;
            }
        }
    }

    // Enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        const dir = new THREE.Vector3().subVectors(playerMesh.position, e.mesh.position);
        dir.y = 0; if (dir.length() > 0) dir.normalize();

        e.mesh.position.addScaledVector(dir, e.speed * dt);

        if (e.mesh.position.distanceTo(playerMesh.position) < (e.size + 1)) {
            gameOver();
        }
    }

    renderer.render(scene, camera);
    requestAnimationFrame(gameLoop);
}

// Init UI
updateCurrencyUI();
showScreen('main-menu');
