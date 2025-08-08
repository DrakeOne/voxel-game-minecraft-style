'use strict';

// Primero, verificar que Three.js se haya cargado correctamente
if (typeof THREE === 'undefined') {
 document.body.innerHTML = '<div style="padding: 20px; text-align: center; font-size: 1.2em; color: red;">Error: La librería Three.js no se pudo cargar. Revisa tu conexión a internet o la URL del CDN.</div>';
 throw new Error("Three.js no se ha cargado.");
}

// --- VARIABLES GLOBALES ---
let scene, camera, renderer, clock, fpsCounter;

// Controles y física del jugador
let controls = { forward: false, backward: false, left: false, right: false, jump: false };
let velocity = new THREE.Vector3();
let onGround = false;
const moveSpeed = 5.0;
const jumpForce = 7.0;
const gravity = 20.0;
const playerHeight = 1.8; // Altura de la cámara desde los pies del jugador

// Rotación de la cámara
let yaw = 0, pitch = 0;

// --- INICIALIZACIÓN ---
init();
animate();

// --- FUNCIONES PRINCIPALES ---

/**
* Inicializa la escena, cámara, renderer, luces, terreno y eventos.
*/
function init() {
 clock = new THREE.Clock();
 scene = new THREE.Scene();
 scene.background = new THREE.Color(0x87ceeb); // Color de cielo azul
 scene.fog = new THREE.Fog(0x87ceeb, 0, 100); // Niebla para dar profundidad

 // Cámara
 camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
 camera.position.set(0, playerHeight, 5); // Posición inicial a la altura del jugador

 // Renderer
 const canvas = document.getElementById('gameCanvas');
 renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
 renderer.setPixelRatio(window.devicePixelRatio);
 renderer.setSize(window.innerWidth, window.innerHeight);

 // Iluminación
 const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
 scene.add(ambientLight);
 const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
 directionalLight.position.set(15, 20, 10);
 scene.add(directionalLight);

 // Terreno de Voxels
 createVoxelChunk();

 // HUD
 fpsCounter = document.getElementById('fps');

 // Listeners de eventos
 window.addEventListener('resize', onWindowResize, false);
 document.addEventListener('keydown', onKeyDown, false);
 document.addEventListener('keyup', onKeyUp, false);
 document.addEventListener('mousemove', onMouseMove, false);
 canvas.addEventListener('click', () => { canvas.requestPointerLock(); });

 // Controles para móvil
 setupMobileControls();
}

/**
* Crea un terreno plano de vóxeles usando InstancedMesh para optimización.
*/
function createVoxelChunk() {
 const chunkSize = 32; // Un chunk más grande
 const blockSize = 1;
 const geometry = new THREE.BoxGeometry(blockSize, blockSize, blockSize);
 const material = new THREE.MeshLambertMaterial({ color: 0x6B8E23 }); // Verde olivo

 const totalBlocks = chunkSize * chunkSize;
 const instancedMesh = new THREE.InstancedMesh(geometry, material, totalBlocks);
 
 const dummy = new THREE.Object3D();

 for (let i = 0; i < chunkSize; i++) {
   for (let j = 0; j < chunkSize; j++) {
     const index = i * chunkSize + j;
     // Posicionar los bloques para que su superficie superior esté en y=0
     dummy.position.set(
       (i - chunkSize / 2) * blockSize,
       -blockSize / 2, 
       (j - chunkSize / 2) * blockSize
     );
     dummy.updateMatrix();
     instancedMesh.setMatrixAt(index, dummy.matrix);
   }
 }
 instancedMesh.instanceMatrix.needsUpdate = true; // Marcar la matriz para actualización
 scene.add(instancedMesh);
}

/**
* Bucle de animación principal.
*/
function animate() {
 requestAnimationFrame(animate);
 const delta = Math.min(clock.getDelta(), 0.1); // Limitar delta para evitar saltos
 
 updatePlayer(delta);
 updateHUD(delta);
 
 renderer.render(scene, camera);
}

/**
* Actualiza la posición y estado del jugador (movimiento, gravedad, salto).
* @param {number} delta - Tiempo transcurrido desde el último frame.
*/
function updatePlayer(delta) {
   // Rotar la cámara según el movimiento del mouse
   camera.rotation.order = 'YXZ';
   camera.rotation.y = yaw;
   camera.rotation.x = pitch;

   // Obtener vectores de dirección basados en la rotación de la cámara
   const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
   const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);

   // Calcular la dirección del movimiento horizontal
   let moveDirection = new THREE.Vector3();
   if (controls.forward) moveDirection.add(forward);
   if (controls.backward) moveDirection.sub(forward);
   if (controls.right) moveDirection.add(right);
   if (controls.left) moveDirection.sub(right);
   
   moveDirection.y = 0; // No moverse verticalmente con las teclas de dirección
   moveDirection.normalize();

   // Aplicar velocidad de movimiento
   velocity.x = moveDirection.x * moveSpeed;
   velocity.z = moveDirection.z * moveSpeed;

   // Aplicar gravedad
   velocity.y -= gravity * delta;

   // Actualizar la posición de la cámara con la velocidad
   camera.position.addScaledVector(velocity, delta);

   // Colisión con el suelo
   if (camera.position.y < playerHeight) {
       camera.position.y = playerHeight;
       velocity.y = 0;
       onGround = true;
   } else {
       onGround = false;
   }

   // Salto
   if (controls.jump && onGround) {
       velocity.y = jumpForce;
   }
}

/**
* Actualiza el contador de FPS en el HUD.
* @param {number} delta - Tiempo transcurrido.
*/
function updateHUD(delta) {
 if (fpsCounter) {
   const fps = (1 / delta).toFixed(0);
   fpsCounter.textContent = 'FPS: ' + fps;
 }
}

// --- MANEJO DE EVENTOS ---

function onWindowResize() {
 camera.aspect = window.innerWidth / window.innerHeight;
 camera.updateProjectionMatrix();
 renderer.setSize(window.innerWidth, window.innerHeight);
}

function onKeyDown(event) {
 switch (event.code) {
   case 'KeyW': case 'ArrowUp': controls.forward = true; break;
   case 'KeyS': case 'ArrowDown': controls.backward = true; break;
   case 'KeyA': case 'ArrowLeft': controls.left = true; break;
   case 'KeyD': case 'ArrowRight': controls.right = true; break;
   case 'Space': controls.jump = true; break;
 }
}

function onKeyUp(event) {
 switch (event.code) {
   case 'KeyW': case 'ArrowUp': controls.forward = false; break;
   case 'KeyS': case 'ArrowDown': controls.backward = false; break;
   case 'KeyA': case 'ArrowLeft': controls.left = false; break;
   case 'KeyD': case 'ArrowRight': controls.right = false; break;
   case 'Space': controls.jump = false; break;
 }
}

function onMouseMove(event) {
 if (document.pointerLockElement === renderer.domElement) {
   const sensitivity = 0.002;
   yaw -= event.movementX * sensitivity;
   pitch -= event.movementY * sensitivity;
   pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch)); // Limitar vista vertical
 }
}

function setupMobileControls() {
   const buttons = {
       btnUp: 'forward',
       btnDown: 'backward',
       btnLeft: 'left',
       btnRight: 'right',
       btnJump: 'jump'
   };

   for (const [id, control] of Object.entries(buttons)) {
       const button = document.getElementById(id);
       if (button) {
           button.addEventListener('touchstart', (e) => { e.preventDefault(); controls[control] = true; }, { passive: false });
           button.addEventListener('touchend', (e) => { e.preventDefault(); controls[control] = false; });
       }
   }
}