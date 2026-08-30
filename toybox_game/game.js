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
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('game-container').appendChild(renderer.domElement);
document.getElementById('game-container').style.display = 'none'; // Hide initially

const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(20, 40, 20);
dirLight.castShadow = true;
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
dirLight.shadow.camera.near = 0.5;
dirLight.shadow.camera.far = 100;
dirLight.shadow.camera.left = -50;
dirLight.shadow.camera.right = 50;
dirLight.shadow.camera.top = 50;
dirLight.shadow.camera.bottom = -50;
scene.add(dirLight);

// Ground (Will change color based on level)
const groundGeo = new THREE.PlaneGeometry(120, 120);
const groundMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 }); // Default brown
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
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

// --- 3D Model Generators ---
function createMecha() {
    const group = new THREE.Group();
    const mat = new THREE.MeshLambertMaterial({ color: 0x3498db });
    const darkMat = new THREE.MeshLambertMaterial({ color: 0x2c3e50 });

    // Body
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, 1), mat);
    body.position.y = 1.5;
    body.castShadow = true;
    group.add(body);

    // Head
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), mat);
    head.position.y = 2.7;
    head.castShadow = true;
    group.add(head);

    // Eye visor
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.2, 0.2), new THREE.MeshLambertMaterial({color: 0xf1c40f}));
    visor.position.set(0, 2.7, 0.4);
    group.add(visor);

    // Arms
    const armGeo = new THREE.BoxGeometry(0.4, 1.2, 0.4);
    const leftArm = new THREE.Mesh(armGeo, darkMat);
    leftArm.position.set(-1, 1.5, 0);
    leftArm.castShadow = true;
    group.add(leftArm);
    const rightArm = new THREE.Mesh(armGeo, darkMat);
    rightArm.position.set(1, 1.5, 0);
    rightArm.castShadow = true;
    group.add(rightArm);

    // Legs
    const legGeo = new THREE.BoxGeometry(0.5, 1, 0.5);
    const leftLeg = new THREE.Mesh(legGeo, darkMat);
    leftLeg.position.set(-0.4, 0.5, 0);
    leftLeg.castShadow = true;
    group.add(leftLeg);
    const rightLeg = new THREE.Mesh(legGeo, darkMat);
    rightLeg.position.set(0.4, 0.5, 0);
    rightLeg.castShadow = true;
    group.add(rightLeg);

    return group;
}

function createTeddy() {
    const group = new THREE.Group();
    const mat = new THREE.MeshLambertMaterial({ color: 0xe67e22 });
    const lightMat = new THREE.MeshLambertMaterial({ color: 0xf39c12 });

    // Body (Fat sphere)
    const body = new THREE.Mesh(new THREE.SphereGeometry(1.2, 16, 16), mat);
    body.position.y = 1.2;
    body.castShadow = true;
    group.add(body);

    // Belly patch
    const belly = new THREE.Mesh(new THREE.SphereGeometry(0.9, 16, 16), lightMat);
    belly.position.set(0, 1.2, 0.4);
    group.add(belly);

    // Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.8, 16, 16), mat);
    head.position.y = 2.6;
    head.castShadow = true;
    group.add(head);

    // Ears
    const earGeo = new THREE.SphereGeometry(0.3, 16, 16);
    const leftEar = new THREE.Mesh(earGeo, mat);
    leftEar.position.set(-0.6, 3.1, 0);
    group.add(leftEar);
    const rightEar = new THREE.Mesh(earGeo, mat);
    rightEar.position.set(0.6, 3.1, 0);
    group.add(rightEar);

    // Snout
    const snout = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 16), lightMat);
    snout.position.set(0, 2.5, 0.7);
    group.add(snout);

    // Nose
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 8), new THREE.MeshLambertMaterial({color: 0x000000}));
    nose.position.set(0, 2.6, 0.95);
    group.add(nose);

    // Arms
    const armGeo = new THREE.CapsuleGeometry(0.3, 0.6, 8, 8);
    const leftArm = new THREE.Mesh(armGeo, mat);
    leftArm.position.set(-1.2, 1.5, 0);
    leftArm.rotation.z = Math.PI / 4;
    leftArm.castShadow = true;
    group.add(leftArm);
    const rightArm = new THREE.Mesh(armGeo, mat);
    rightArm.position.set(1.2, 1.5, 0);
    rightArm.rotation.z = -Math.PI / 4;
    rightArm.castShadow = true;
    group.add(rightArm);

    return group;
}

function createDoll() {
    const group = new THREE.Group();
    const skinMat = new THREE.MeshLambertMaterial({ color: 0xffe0bd });
    const dressMat = new THREE.MeshLambertMaterial({ color: 0xe74c3c });
    const hairMat = new THREE.MeshLambertMaterial({ color: 0xf1c40f }); // Blonde

    // Dress (Cone)
    const dress = new THREE.Mesh(new THREE.ConeGeometry(0.8, 1.5, 16), dressMat);
    dress.position.y = 1;
    dress.castShadow = true;
    group.add(dress);

    // Torso
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 0.8), dressMat);
    torso.position.y = 2.1;
    torso.castShadow = true;
    group.add(torso);

    // Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 16), skinMat);
    head.position.y = 2.7;
    head.castShadow = true;
    group.add(head);

    // Hair
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.45, 16, 16, 0, Math.PI * 2, 0, Math.PI/1.5), hairMat);
    hair.position.y = 2.75;
    group.add(hair);

    // Arms
    const armGeo = new THREE.CylinderGeometry(0.1, 0.1, 1);
    const leftArm = new THREE.Mesh(armGeo, skinMat);
    leftArm.position.set(-0.5, 2, 0);
    leftArm.rotation.z = Math.PI / 6;
    leftArm.castShadow = true;
    group.add(leftArm);
    const rightArm = new THREE.Mesh(armGeo, skinMat);
    rightArm.position.set(0.5, 2, 0);
    rightArm.rotation.z = -Math.PI / 6;
    rightArm.castShadow = true;
    group.add(rightArm);

    return group;
}

// --- Game Logic ---
function startGame(type) {
    playerType = type;
    showScreen('game-ui');

    // Setup Player
    if (playerMesh) scene.remove(playerMesh);

    if (type === 'mecha') {
        playerMesh = createMecha();
    } else if (type === 'teddy') {
        playerMesh = createTeddy();
    } else if (type === 'doll') {
        playerMesh = createDoll();
    }

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

        const bulletMesh = new THREE.Mesh(new THREE.SphereGeometry(bSize, 8, 8), new THREE.MeshLambertMaterial({ color: bColor, emissive: bColor, emissiveIntensity: 0.5 }));
        bulletMesh.position.copy(playerMesh.position);
        bulletMesh.position.y = 1.5; // Shoot from chest height
        bulletMesh.castShadow = true;

        const direction = new THREE.Vector3().subVectors(intersectPoint, playerMesh.position).normalize();
        direction.y = 0; direction.normalize();

        // Rotate player to face shooting direction
        playerMesh.rotation.y = Math.atan2(-direction.z, direction.x) + Math.PI/2;

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

    let enemyMesh = new THREE.Group();
    let speed, hp, size;

    if (spawnPetBoss) {
        // Cat Paw Boss
        const pawMat = new THREE.MeshLambertMaterial({ color: 0xbdc3c7 });
        const padMat = new THREE.MeshLambertMaterial({ color: 0xffb6c1 }); // Pink pads

        const mainPaw = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 8, 16), pawMat);
        mainPaw.rotation.x = Math.PI / 2;
        mainPaw.position.y = 3;
        mainPaw.castShadow = true;
        enemyMesh.add(mainPaw);

        const mainPad = new THREE.Mesh(new THREE.SphereGeometry(1.5, 16, 16), padMat);
        mainPad.position.set(0, 1.5, 2.5);
        enemyMesh.add(mainPad);

        // Toes
        for (let i = -1.5; i <= 1.5; i+=1.5) {
            const toe = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 16), pawMat);
            toe.position.set(i, 3, 4);
            toe.castShadow = true;
            enemyMesh.add(toe);

            const pad = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 16), padMat);
            pad.position.set(i, 2.2, 4.2);
            enemyMesh.add(pad);
        }

        speed = 4 + (gameStage * 0.5);
        hp = 100 + (gameStage * 20);
        size = 4;

        document.getElementById('boss-warning').style.display = 'block';
        setTimeout(() => document.getElementById('boss-warning').style.display = 'none', 2000);
    } else {
        // Normal Craft-lings (Playdough monsters)
        const body = new THREE.Mesh(new THREE.DodecahedronGeometry(1.2), new THREE.MeshLambertMaterial({ color: 0x9b59b6 }));
        body.position.y = 1.2;
        body.castShadow = true;
        enemyMesh.add(body);

        // Eyes
        const eyeMat = new THREE.MeshLambertMaterial({color: 0xffffff});
        const pupilMat = new THREE.MeshLambertMaterial({color: 0x000000});
        const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.3), eyeMat);
        leftEye.position.set(-0.4, 1.5, 1);
        const leftPupil = new THREE.Mesh(new THREE.SphereGeometry(0.1), pupilMat);
        leftPupil.position.set(-0.4, 1.5, 1.25);
        enemyMesh.add(leftEye); enemyMesh.add(leftPupil);

        const rightEye = new THREE.Mesh(new THREE.SphereGeometry(0.3), eyeMat);
        rightEye.position.set(0.4, 1.5, 1);
        const rightPupil = new THREE.Mesh(new THREE.SphereGeometry(0.1), pupilMat);
        rightPupil.position.set(0.4, 1.5, 1.25);
        enemyMesh.add(rightEye); enemyMesh.add(rightPupil);

        speed = 6 + gameStage;
        hp = 10 + (gameStage * 5);
        size = 1.5;
    }

    const angle = Math.random() * Math.PI * 2;
    const radius = 40;
    enemyMesh.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);

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

    // Player Move & Animate
    const moveDir = new THREE.Vector3(0, 0, 0);
    if (keys.w) moveDir.z -= 1;
    if (keys.s) moveDir.z += 1;
    if (keys.a) moveDir.x -= 1;
    if (keys.d) moveDir.x += 1;

    if (moveDir.length() > 0) {
        moveDir.normalize();
        // Bobbing animation when walking
        playerMesh.position.y = Math.sin(now * 0.01) * 0.2;

        // Optional: Make player face movement direction if not shooting
        // if (!isShooting) {
        //    playerMesh.rotation.y = Math.atan2(-moveDir.z, moveDir.x) + Math.PI/2;
        // }
    } else {
        playerMesh.position.y = 0; // reset bobbing
    }

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
            // Adjust hit detection to account for enemy Y position and size
            const dist = new THREE.Vector3(b.mesh.position.x, 0, b.mesh.position.z).distanceTo(new THREE.Vector3(e.mesh.position.x, 0, e.mesh.position.z));

            if (dist < e.size) {
                e.hp -= (10 + (b.power * 4));

                // Visual hit feedback (flash red)
                e.mesh.children.forEach(child => {
                    if(child.material && child.material.color) {
                        child.userData.origColor = child.material.color.getHex();
                        child.material.color.setHex(0xff0000);
                        setTimeout(() => {
                            if(child.material) child.material.color.setHex(child.userData.origColor);
                        }, 100);
                    }
                });
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

        // Face player
        e.mesh.rotation.y = Math.atan2(-dir.z, dir.x) + Math.PI/2;

        // Bobbing animation
        if (!e.isBoss) {
            e.mesh.position.y = Math.sin(now * 0.01 + i) * 0.2;
        }

        if (new THREE.Vector3(e.mesh.position.x, 0, e.mesh.position.z).distanceTo(new THREE.Vector3(playerMesh.position.x, 0, playerMesh.position.z)) < (e.size + 1)) {
            gameOver();
        }
    }

    renderer.render(scene, camera);
    requestAnimationFrame(gameLoop);
}

// Init UI
updateCurrencyUI();
showScreen('main-menu');
