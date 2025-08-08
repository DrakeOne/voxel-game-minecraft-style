'use strict';

// Variables globales
let scene, camera, renderer, clock, fpsCounter;
let controls = { forward: false, backward: false, left: false, right: false, jump: false };
let velocity = new THREE.Vector3();
let direction = new THREE.Vector3();
let moveSpeed = 5;
let yaw = 0, pitch = 0;

// Inicialización de la escena, cámara, renderer y controles
init();
animate();

function init() {
  clock = new THREE.Clock();
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb); // Cielo azul

  // Configuración de cámara
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 2, 5); // Posición inicial del jugador

  // Configuración del renderer
  renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('gameCanvas'), antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);

  // Iluminación
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(5, 10, 7.5);
  scene.add(directionalLight);

  // Creación de un chunk de voxeles usando InstancedMesh para optimización
  createVoxelChunk();

  // Elemento HUD para mostrar FPS
  fpsCounter = document.getElementById('fps');

  // Listeners para eventos
  window.addEventListener('resize', onWindowResize, false);
  document.addEventListener('keydown', onKeyDown, false);
  document.addEventListener('keyup', onKeyUp, false);
  document.addEventListener('mousemove', onMouseMove, false);

  // Configuración de controles táctiles para móviles
  setupMobileControls();

  // Pointer lock para controles de ratón en escritorio
  const canvas = renderer.domElement;
  canvas.addEventListener('click', function() {
    canvas.requestPointerLock();
  }, false);
}

// Función para crear un chunk de voxeles (por ejemplo, un terreno plano)
function createVoxelChunk() {
  const chunkSize = 16;    // Tamaño del chunk
  const blockSize = 1;     // Tamaño de cada bloque
  const geometry = new THREE.BoxGeometry(blockSize, blockSize, blockSize);

  // Material básico para los bloques (color madera)
  const material = new THREE.MeshLambertMaterial({ color: 0x8B4513 });

  const totalBlocks = chunkSize * chunkSize;
  // Uso de InstancedMesh para optimizar la renderización de muchos bloques
  const instancedMesh = new THREE.InstancedMesh(geometry, material, totalBlocks);
  let index = 0;
  const dummy = new THREE.Object3D();

  // Genera un terreno plano a nivel y centrado en el origen
  for (let i = 0; i < chunkSize; i++) {
    for (let j = 0; j < chunkSize; j++) {
      dummy.position.set(i - chunkSize / 2, 0, j - chunkSize / 2);
      dummy.updateMatrix();
      instancedMesh.setMatrixAt(index++, dummy.matrix);
    }
  }
  scene.add(instancedMesh);
}

// Configura los controles táctiles para móviles
function setupMobileControls() {
  const btnUp = document.getElementById('btnUp');
  const btnDown = document.getElementById('btnDown');
  const btnLeft = document.getElementById('btnLeft');
  const btnRight = document.getElementById('btnRight');
  const btnJump = document.getElementById('btnJump');

  if(btnUp) {
    btnUp.addEventListener('touchstart', () => { controls.forward = true; });
    btnUp.addEventListener('touchend', () => { controls.forward = false; });
  }
  if(btnDown) {
    btnDown.addEventListener('touchstart', () => { controls.backward = true; });
    btnDown.addEventListener('touchend', () => { controls.backward = false; });
  }
  if(btnLeft) {
    btnLeft.addEventListener('touchstart', () => { controls.left = true; });
    btnLeft.addEventListener('touchend', () => { controls.left = false; });
  }
  if(btnRight) {
    btnRight.addEventListener('touchstart', () => { controls.right = true; });
    btnRight.addEventListener('touchend', () => { controls.right = false; });
  }
  if(btnJump) {
    btnJump.addEventListener('touchstart', () => { controls.jump = true; });
    btnJump.addEventListener('touchend', () => { controls.jump = false; });
  }
}

// Manejo de eventos de teclado
function onKeyDown(event) {
  switch (event.code) {
    case 'KeyW':
    case 'ArrowUp':
      controls.forward = true;
      break;
    case 'KeyS':
    case 'ArrowDown':
      controls.backward = true;
      break;
    case 'KeyA':
    case 'ArrowLeft':
      controls.left = true;
      break;
    case 'KeyD':
    case 'ArrowRight':
      controls.right = true;
      break;
    case 'Space':
      controls.jump = true;
      break;
  }
}

function onKeyUp(event) {
  switch (event.code) {
    case 'KeyW':
    case 'ArrowUp':
      controls.forward = false;
      break;
    case 'KeyS':
    case 'ArrowDown':
      controls.backward = false;
      break;
    case 'KeyA':
    case 'ArrowLeft':
      controls.left = false;
      break;
    case 'KeyD':
    case 'ArrowRight':
      controls.right = false;
      break;
    case 'Space':
      controls.jump = false;
      break;
  }
}

// Manejo del movimiento del ratón para cambiar la vista
function onMouseMove(event) {
  if (document.pointerLockElement === renderer.domElement) {
    const movementX = event.movementX || 0;
    const movementY = event.movementY || 0;
    const sensitivity = 0.002;
    yaw -= movementX * sensitivity;
    pitch -= movementY * sensitivity;
    pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch));
  }
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// Loop de animación que actualiza la escena y renderiza
function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  updateControls(delta);
  updateHUD();
  renderer.render(scene, camera);
}

// Actualización de la posición y controles del jugador
function updateControls(delta) {
  // Cálculo del vector "forward" tomando en cuenta yaw y pitch
  const cosPitch = Math.cos(pitch);
  const forward = new THREE.Vector3(Math.sin(yaw) * cosPitch, Math.sin(pitch), Math.cos(yaw) * cosPitch);

  // Vector perpendicular para movimiento lateral
  const right = new THREE.Vector3(Math.sin(yaw - Math.PI / 2), 0, Math.cos(yaw - Math.PI / 2));

  // Actualiza la rotación de la cámara
  camera.rotation.order = 'YXZ';
  camera.rotation.y = yaw;
  camera.rotation.x = pitch;

  direction.set(0, 0, 0);
  if (controls.forward) direction.add(forward);
  if (controls.backward) direction.sub(forward);
  if (controls.left) direction.sub(right);
  if (controls.right) direction.add(right);
  direction.normalize();

  // Asigna velocidad basada en la dirección
  velocity.x = direction.x * moveSpeed;
  velocity.z = direction.z * moveSpeed;

  // Simulación básica de salto y gravedad
  if (controls.jump && Math.abs(camera.position.y - 2) < 0.01) {
    velocity.y = 8; // Impulso de salto
  }
  velocity.y -= 9.8 * delta; // Gravedad
  camera.position.addScaledVector(velocity, delta);

  // Colisión simple con el suelo (nivel y = 2 para la altura del jugador)
  if (camera.position.y < 2) {
    camera.position.y = 2;
    velocity.y = 0;
  }
}

// Actualiza el HUD (por ejemplo, mostrando el FPS actual)
function updateHUD() {
  const fps = (1 / clock.getDelta()).toFixed(1);
  fpsCounter.innerHTML = 'FPS: ' + fps;
}