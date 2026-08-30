// --- Scene Setup ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1c23); // Dark slate studio background

// Add subtle fog to blend the horizon
scene.fog = new THREE.Fog(0x1a1c23, 10, 50);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
// Position camera to see all 3 characters
camera.position.set(0, 5, 14);
camera.lookAt(0, 2, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.getElementById('canvas-container').appendChild(renderer.domElement);

// Controls so user can drag to rotate camera
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.target.set(0, 2, 0);
controls.maxPolarAngle = Math.PI / 2 + 0.1; // Don't go below ground
controls.minDistance = 5;
controls.maxDistance = 20;

// --- Lighting (Studio Setup) ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

// Key Light
const keyLight = new THREE.SpotLight(0xffffff, 1.2);
keyLight.position.set(-5, 15, 10);
keyLight.angle = Math.PI / 4;
keyLight.penumbra = 0.5;
keyLight.castShadow = true;
keyLight.shadow.mapSize.width = 2048;
keyLight.shadow.mapSize.height = 2048;
scene.add(keyLight);

// Fill Light (blue-ish tint)
const fillLight = new THREE.DirectionalLight(0xabcdef, 0.6);
fillLight.position.set(10, 5, 5);
scene.add(fillLight);

// Back/Rim Light (warm tint)
const rimLight = new THREE.DirectionalLight(0xffddaa, 0.8);
rimLight.position.set(0, 10, -10);
scene.add(rimLight);

// --- Environment ---
// Infinite Floor
const floorGeo = new THREE.PlaneGeometry(200, 200);
const floorMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    roughness: 0.1,
    metalness: 0.5
});
const floor = new THREE.Mesh(floorGeo, floorMat);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

// Function to create a display podium
function createPodium(xPos) {
    const podiumGeo = new THREE.CylinderGeometry(2, 2.2, 0.4, 32);
    const podiumMat = new THREE.MeshStandardMaterial({
        color: 0x333333,
        roughness: 0.4,
        metalness: 0.6
    });
    const podium = new THREE.Mesh(podiumGeo, podiumMat);
    podium.position.set(xPos, 0.2, 0);
    podium.receiveShadow = true;
    podium.castShadow = true;

    // Glowing ring
    const ringGeo = new THREE.TorusGeometry(1.8, 0.05, 16, 64);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.21;
    podium.add(ring);

    scene.add(podium);
    return podium;
}

const leftPodium = createPodium(-4);
const centerPodium = createPodium(0);
const rightPodium = createPodium(4);


// --- Character Modeling Functions (Reused and enhanced) ---

function createMecha() {
    const group = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: 0x3498db, roughness: 0.3, metalness: 0.8 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x2c3e50, roughness: 0.5, metalness: 0.9 });
    const lightMat = new THREE.MeshStandardMaterial({ color: 0xecf0f1, roughness: 0.2, metalness: 0.2 });

    // Body Core
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.6, 1.2), mat);
    body.position.y = 1.6;
    body.castShadow = true;
    group.add(body);

    // Chest Plate
    const chest = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 0.2), lightMat);
    chest.position.set(0, 1.8, 0.65);
    chest.castShadow = true;
    group.add(chest);

    // Power Core (Glowing)
    const core = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.3), new THREE.MeshLambertMaterial({color: 0xe74c3c, emissive: 0xe74c3c}));
    core.rotation.x = Math.PI / 2;
    core.position.set(0, 1.8, 0.75);
    group.add(core);

    // Head
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.9), mat);
    head.position.y = 2.9;
    head.castShadow = true;
    group.add(head);

    // Antenna
    const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.6), darkMat);
    antenna.position.set(0.4, 3.5, 0);
    antenna.castShadow = true;
    group.add(antenna);

    // Eye visor (Glowing)
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.25, 0.2), new THREE.MeshLambertMaterial({color: 0xf1c40f, emissive: 0xf1c40f, emissiveIntensity: 0.8}));
    visor.position.set(0, 2.9, 0.46);
    group.add(visor);

    // Shoulders
    const shoulderGeo = new THREE.SphereGeometry(0.45, 16, 16);
    const leftShoulder = new THREE.Mesh(shoulderGeo, mat);
    leftShoulder.position.set(-1.1, 2.2, 0);
    leftShoulder.castShadow = true;
    group.add(leftShoulder);
    const rightShoulder = new THREE.Mesh(shoulderGeo, mat);
    rightShoulder.position.set(1.1, 2.2, 0);
    rightShoulder.castShadow = true;
    group.add(rightShoulder);

    // Arms
    const armGeo = new THREE.BoxGeometry(0.4, 1.2, 0.4);
    const leftArm = new THREE.Mesh(armGeo, darkMat);
    leftArm.position.set(-1.1, 1.4, 0);
    leftArm.castShadow = true;
    group.add(leftArm);
    const rightArm = new THREE.Mesh(armGeo, darkMat);
    rightArm.position.set(1.1, 1.4, 0);
    rightArm.castShadow = true;
    group.add(rightArm);

    // Hand Cannon (Right Arm)
    const cannon = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.3, 0.9, 16), mat);
    cannon.rotation.x = Math.PI / 2;
    cannon.position.set(1.1, 0.8, 0.35);
    cannon.castShadow = true;
    group.add(cannon);

    // Legs
    const legGeo = new THREE.BoxGeometry(0.6, 1.2, 0.6);
    const leftLeg = new THREE.Mesh(legGeo, darkMat);
    leftLeg.position.set(-0.5, 0.6, 0);
    leftLeg.castShadow = true;
    group.add(leftLeg);
    const rightLeg = new THREE.Mesh(legGeo, darkMat);
    rightLeg.position.set(0.5, 0.6, 0);
    rightLeg.castShadow = true;
    group.add(rightLeg);

    // Feet
    const footGeo = new THREE.BoxGeometry(0.8, 0.3, 1);
    const leftFoot = new THREE.Mesh(footGeo, mat);
    leftFoot.position.set(-0.5, 0.15, 0.1);
    leftFoot.castShadow = true;
    group.add(leftFoot);
    const rightFoot = new THREE.Mesh(footGeo, mat);
    rightFoot.position.set(0.5, 0.15, 0.1);
    rightFoot.castShadow = true;
    group.add(rightFoot);

    return group;
}

function createTeddy() {
    const group = new THREE.Group();
    // Use softer/rougher material for "plush" look
    const mat = new THREE.MeshStandardMaterial({ color: 0xe67e22, roughness: 0.9, metalness: 0.0 });
    const lightMat = new THREE.MeshStandardMaterial({ color: 0xf1c40f, roughness: 0.9, metalness: 0.0 });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5, metalness: 0.2 });

    // Body (Fat sphere)
    const body = new THREE.Mesh(new THREE.SphereGeometry(1.4, 32, 32), mat);
    body.position.y = 1.4;
    body.castShadow = true;
    group.add(body);

    // Belly patch
    const belly = new THREE.Mesh(new THREE.SphereGeometry(1.1, 32, 32), lightMat);
    belly.position.set(0, 1.3, 0.4);
    belly.castShadow = true;
    group.add(belly);

    // Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.9, 32, 32), mat);
    head.position.set(0, 2.9, 0.2);
    head.castShadow = true;
    group.add(head);

    // Eyes (Button eyes)
    const eyeGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.1, 16);
    const leftEye = new THREE.Mesh(eyeGeo, darkMat);
    leftEye.rotation.x = Math.PI / 2;
    leftEye.position.set(-0.35, 3.1, 1.05);
    leftEye.castShadow = true;
    group.add(leftEye);
    const rightEye = new THREE.Mesh(eyeGeo, darkMat);
    rightEye.rotation.x = Math.PI / 2;
    rightEye.position.set(0.35, 3.1, 1.05);
    rightEye.castShadow = true;
    group.add(rightEye);

    // Ears
    const earGeo = new THREE.SphereGeometry(0.4, 16, 16);
    const leftEar = new THREE.Mesh(earGeo, mat);
    leftEar.position.set(-0.7, 3.6, 0.1);
    leftEar.castShadow = true;
    group.add(leftEar);
    const rightEar = new THREE.Mesh(earGeo, mat);
    rightEar.position.set(0.7, 3.6, 0.1);
    rightEar.castShadow = true;
    group.add(rightEar);

    // Snout
    const snout = new THREE.Mesh(new THREE.SphereGeometry(0.4, 32, 32), lightMat);
    snout.position.set(0, 2.8, 1.0);
    snout.castShadow = true;
    group.add(snout);

    // Nose
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 16), darkMat);
    nose.position.set(0, 2.95, 1.35);
    nose.castShadow = true;
    group.add(nose);

    // Arms
    const armGeo = new THREE.CapsuleGeometry(0.4, 0.8, 16, 16);
    const leftArm = new THREE.Mesh(armGeo, mat);
    leftArm.position.set(-1.4, 1.8, 0.2);
    leftArm.rotation.z = Math.PI / 6;
    leftArm.castShadow = true;
    group.add(leftArm);
    const rightArm = new THREE.Mesh(armGeo, mat);
    rightArm.position.set(1.4, 1.8, 0.2);
    rightArm.rotation.z = -Math.PI / 6;
    rightArm.castShadow = true;
    group.add(rightArm);

    // Legs
    const legGeo = new THREE.CapsuleGeometry(0.45, 0.6, 16, 16);
    const leftLeg = new THREE.Mesh(legGeo, mat);
    leftLeg.position.set(-0.7, 0.5, 0.3);
    leftLeg.rotation.x = -Math.PI / 8;
    leftLeg.castShadow = true;
    group.add(leftLeg);
    const rightLeg = new THREE.Mesh(legGeo, mat);
    rightLeg.position.set(0.7, 0.5, 0.3);
    rightLeg.rotation.x = -Math.PI / 8;
    rightLeg.castShadow = true;
    group.add(rightLeg);

    return group;
}

function createDoll() {
    const group = new THREE.Group();
    // Materials for plastic doll
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xffccaa, roughness: 0.3, metalness: 0.1 });
    const dressMat = new THREE.MeshStandardMaterial({ color: 0xe74c3c, roughness: 0.6, metalness: 0.1 });
    const hairMat = new THREE.MeshStandardMaterial({ color: 0xf1c40f, roughness: 0.7, metalness: 0.0 });
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5, metalness: 0.1 });

    // Dress Skirt (Cone)
    const skirt = new THREE.Mesh(new THREE.ConeGeometry(0.9, 1.4, 32), dressMat);
    skirt.position.y = 0.9;
    skirt.castShadow = true;
    group.add(skirt);

    // Dress Frill (Bottom)
    const frill = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.1, 16, 64), whiteMat);
    frill.rotation.x = Math.PI / 2;
    frill.position.y = 0.2;
    frill.castShadow = true;
    group.add(frill);

    // Torso
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.4, 0.8, 32), dressMat);
    torso.position.y = 2.0;
    torso.castShadow = true;
    group.add(torso);

    // Belt
    const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.12, 32), whiteMat);
    belt.position.y = 1.6;
    belt.castShadow = true;
    group.add(belt);

    // Head
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.45, 32, 32), skinMat);
    head.position.y = 2.7;
    head.castShadow = true;
    group.add(head);

    // Hair (Top Volume)
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.5, 32, 32, 0, Math.PI * 2, 0, Math.PI/1.8), hairMat);
    hair.position.set(0, 2.75, -0.05);
    hair.castShadow = true;
    group.add(hair);

    // Hair (Ponytail)
    const ponytail = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.8, 16), hairMat);
    ponytail.position.set(0, 2.3, -0.5);
    ponytail.rotation.x = Math.PI / 6;
    ponytail.castShadow = true;
    group.add(ponytail);

    // Bow (Back of head)
    const bow = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.2, 0.1), dressMat);
    bow.position.set(0, 2.6, -0.45);
    bow.castShadow = true;
    group.add(bow);

    // Arms
    const armGeo = new THREE.CapsuleGeometry(0.12, 0.8, 16, 16);
    const leftArm = new THREE.Mesh(armGeo, skinMat);
    leftArm.position.set(-0.4, 2.1, 0);
    leftArm.rotation.z = Math.PI / 8;
    leftArm.castShadow = true;
    group.add(leftArm);

    const rightArm = new THREE.Mesh(armGeo, skinMat);
    rightArm.position.set(0.4, 2.1, 0);
    rightArm.rotation.z = -Math.PI / 8;
    rightArm.rotation.x = -Math.PI / 4; // Right arm pointing forward
    rightArm.castShadow = true;
    group.add(rightArm);

    // Magic Wand (Right Hand)
    const wandHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.8, 16), whiteMat);
    wandHandle.position.set(0.4, 1.8, 0.4);
    wandHandle.rotation.x = -Math.PI / 2;
    wandHandle.castShadow = true;
    group.add(wandHandle);

    const wandStar = new THREE.Mesh(new THREE.DodecahedronGeometry(0.15), new THREE.MeshLambertMaterial({color: 0xf1c40f, emissive: 0xf1c40f, emissiveIntensity: 0.5}));
    wandStar.position.set(0.4, 1.8, 0.8);
    wandStar.castShadow = true;
    group.add(wandStar);

    return group;
}


// --- Add Characters to Scene ---
const mecha = createMecha();
mecha.position.set(-4, 0.4, 0); // Above left podium
// Scale up for detail viewing
mecha.scale.setScalar(1.2);
scene.add(mecha);

const teddy = createTeddy();
teddy.position.set(0, 0.4, 0); // Above center podium
teddy.scale.setScalar(1.2);
scene.add(teddy);

const doll = createDoll();
doll.position.set(4, 0.4, 0); // Above right podium
doll.scale.setScalar(1.2);
scene.add(doll);

// Array to hold characters for rotation
const characters = [mecha, teddy, doll];

// --- Animation Loop ---
function animate() {
    requestAnimationFrame(animate);

    // Slowly rotate characters
    characters.forEach(char => {
        char.rotation.y += 0.005;
    });

    // Update orbit controls
    controls.update();

    renderer.render(scene, camera);
}

// Handle window resize
window.addEventListener('resize', onWindowResize, false);
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

animate();
