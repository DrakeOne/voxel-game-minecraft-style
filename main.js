'use strict';

// Variables globales
let scene, camera, renderer, clock, fpsCounter;
let controls = { forward: false, backward: false, left: false, right: false, jump: false };
let velocity = new THREE.Vector3();
let direction = new THREE.Vector3();
let moveSpeed = 5;
let yaw = 0, pitch = 0;

// Sistema de bloques
let blocks = new Map(); // Almacena todos los bloques del mundo
let selectedBlockType = 0; // Tipo de bloque seleccionado
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
let highlightMesh; // Mesh para resaltar el bloque seleccionado
let ghostMesh; // Mesh fantasma para preview de colocación

// Tipos de bloques disponibles
const BLOCK_TYPES = [
  { name: 'Dirt', color: 0x8B4513 },     // Tierra
  { name: 'Stone', color: 0x808080 },    // Piedra
  { name: 'Wood', color: 0xDEB887 },     // Madera
  { name: 'Grass', color: 0x228B22 },    // Hierba
  { name: 'Sand', color: 0xF4A460 }      // Arena
];

// Inicialización
init();
animate();

function init() {
  clock = new THREE.Clock();
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb); // Cielo azul
  scene.fog = new THREE.Fog(0x87ceeb, 10, 100); // Niebla para profundidad

  // Configuración de cámara
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 2, 5);

  // Configuración del renderer
  renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('gameCanvas'), antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // Iluminación mejorada
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(5, 10, 7.5);
  directionalLight.castShadow = true;
  directionalLight.shadow.camera.near = 0.1;
  directionalLight.shadow.camera.far = 50;
  directionalLight.shadow.camera.left = -20;
  directionalLight.shadow.camera.right = 20;
  directionalLight.shadow.camera.top = 20;
  directionalLight.shadow.camera.bottom = -20;
  scene.add(directionalLight);

  // Crear mundo inicial
  createInitialWorld();
  
  // Crear meshes de ayuda
  createHelperMeshes();
  
  // Actualizar HUD
  updateBlockSelector();

  // Elemento HUD para mostrar FPS
  fpsCounter = document.getElementById('fps');

  // Listeners para eventos
  window.addEventListener('resize', onWindowResize, false);
  document.addEventListener('keydown', onKeyDown, false);
  document.addEventListener('keyup', onKeyUp, false);
  document.addEventListener('mousemove', onMouseMove, false);
  document.addEventListener('mousedown', onMouseClick, false);
  document.addEventListener('contextmenu', (e) => e.preventDefault(), false);

  // Configuración de controles táctiles para móviles
  setupMobileControls();

  // Pointer lock para controles de ratón en escritorio
  const canvas = renderer.domElement;
  canvas.addEventListener('click', function() {
    if (!document.pointerLockElement) {
      canvas.requestPointerLock();
    }
  }, false);
}

// Crear meshes de ayuda (highlight y ghost)
function createHelperMeshes() {
  // Mesh para resaltar bloque seleccionado
  const highlightGeometry = new THREE.BoxGeometry(1.01, 1.01, 1.01);
  const highlightMaterial = new THREE.MeshBasicMaterial({ 
    color: 0xffffff, 
    transparent: true, 
    opacity: 0.3,
    side: THREE.BackSide 
  });
  highlightMesh = new THREE.Mesh(highlightGeometry, highlightMaterial);
  highlightMesh.visible = false;
  scene.add(highlightMesh);

  // Mesh fantasma para preview
  const ghostGeometry = new THREE.BoxGeometry(1, 1, 1);
  const ghostMaterial = new THREE.MeshBasicMaterial({ 
    color: BLOCK_TYPES[selectedBlockType].color,
    transparent: true, 
    opacity: 0.5 
  });
  ghostMesh = new THREE.Mesh(ghostGeometry, ghostMaterial);
  ghostMesh.visible = false;
  scene.add(ghostMesh);
}

// Crear mundo inicial con diferentes tipos de bloques
function createInitialWorld() {
  const worldSize = 16;
  
  // Generar terreno con variación
  for (let x = -worldSize/2; x < worldSize/2; x++) {
    for (let z = -worldSize/2; z < worldSize/2; z++) {
      // Altura variable usando ruido simple
      const height = Math.floor(Math.sin(x * 0.3) * Math.cos(z * 0.3) * 2);
      
      // Colocar bloques de tierra hasta la altura
      for (let y = -2; y <= height; y++) {
        // Tipo de bloque según la altura
        let blockType = 0; // Tierra por defecto
        if (y === height && height > 0) {
          blockType = 3; // Hierba en la superficie
        } else if (y < -1) {
          blockType = 1; // Piedra en profundidad
        }
        
        addBlock(x, y, z, blockType);
      }
    }
  }
}

// Añadir un bloque al mundo
function addBlock(x, y, z, type = 0) {
  const key = `${Math.round(x)},${Math.round(y)},${Math.round(z)}`;
  
  // Si ya existe un bloque en esa posición, no hacer nada
  if (blocks.has(key)) return;
  
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const material = new THREE.MeshLambertMaterial({ 
    color: BLOCK_TYPES[type].color 
  });
  const block = new THREE.Mesh(geometry, material);
  
  block.position.set(Math.round(x), Math.round(y), Math.round(z));
  block.castShadow = true;
  block.receiveShadow = true;
  block.userData = { type: type, position: key };
  
  scene.add(block);
  blocks.set(key, block);
}

// Eliminar un bloque del mundo
function removeBlock(x, y, z) {
  const key = `${Math.round(x)},${Math.round(y)},${Math.round(z)}`;
  const block = blocks.get(key);
  
  if (block) {
    scene.remove(block);
    blocks.delete(key);
    
    // Efecto de partículas (simplificado)
    createBreakEffect(x, y, z, block.material.color);
  }
}

// Crear efecto de ruptura
function createBreakEffect(x, y, z, color) {
  const particleCount = 8;
  const particles = [];
  
  for (let i = 0; i < particleCount; i++) {
    const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    const material = new THREE.MeshBasicMaterial({ color: color });
    const particle = new THREE.Mesh(geometry, material);
    
    particle.position.set(x, y, z);
    particle.velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 0.2,
      Math.random() * 0.3,
      (Math.random() - 0.5) * 0.2
    );
    
    scene.add(particle);
    particles.push(particle);
  }
  
  // Animar partículas
  let frame = 0;
  function animateParticles() {
    frame++;
    if (frame > 30) {
      particles.forEach(p => scene.remove(p));
      return;
    }
    
    particles.forEach(p => {
      p.position.add(p.velocity);
      p.velocity.y -= 0.02;
      p.rotation.x += 0.1;
      p.rotation.y += 0.1;
    });
    
    requestAnimationFrame(animateParticles);
  }
  animateParticles();
}

// Manejar clicks del mouse
function onMouseClick(event) {
  if (!document.pointerLockElement) return;
  
  // Calcular el centro de la pantalla (donde apunta la cámara)
  mouse.x = 0;
  mouse.y = 0;
  
  // Configurar el raycaster desde la cámara
  raycaster.setFromCamera(mouse, camera);
  
  // Buscar intersecciones con bloques
  const intersects = raycaster.intersectObjects(Array.from(blocks.values()));
  
  if (event.button === 0) { // Click izquierdo - Colocar bloque
    if (intersects.length > 0) {
      const intersect = intersects[0];
      const normal = intersect.face.normal;
      const position = intersect.object.position.clone();
      position.add(normal);
      
      // Verificar que no colisione con el jugador
      const playerPos = camera.position;
      const blockPos = position;
      const distance = playerPos.distanceTo(blockPos);
      
      if (distance > 1.5) {
        addBlock(position.x, position.y, position.z, selectedBlockType);
      }
    }
  } else if (event.button === 2) { // Click derecho - Destruir bloque
    if (intersects.length > 0) {
      const position = intersects[0].object.position;
      removeBlock(position.x, position.y, position.z);
    }
  }
}

// Actualizar el selector de bloques en el HUD
function updateBlockSelector() {
  // Actualizar el HUD para mostrar el bloque seleccionado
  const instructions = document.getElementById('instructions');
  if (instructions) {
    instructions.innerHTML = `
      WASD/Flechas: Mover | Mouse: Mirar | Click Izq: Colocar | Click Der: Destruir<br>
      Bloque: <span style="color: #${BLOCK_TYPES[selectedBlockType].color.toString(16).padStart(6, '0')}">${BLOCK_TYPES[selectedBlockType].name}</span> | 
      Teclas 1-5: Cambiar bloque
    `;
  }
  
  // Actualizar color del ghost mesh
  if (ghostMesh) {
    ghostMesh.material.color.setHex(BLOCK_TYPES[selectedBlockType].color);
  }
}

// Configurar controles táctiles para móviles
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
  
  // Añadir botones para colocar/destruir en móvil
  const mobileControls = document.getElementById('mobile-controls');
  if (mobileControls && !document.getElementById('btnPlace')) {
    const btnPlace = document.createElement('div');
    btnPlace.id = 'btnPlace';
    btnPlace.className = 'touch-button';
    btnPlace.innerHTML = '⬜';
    btnPlace.addEventListener('touchstart', () => {
      // Simular click izquierdo
      onMouseClick({ button: 0 });
    });
    mobileControls.appendChild(btnPlace);
    
    const btnBreak = document.createElement('div');
    btnBreak.id = 'btnBreak';
    btnBreak.className = 'touch-button';
    btnBreak.innerHTML = '⛏️';
    btnBreak.addEventListener('touchstart', () => {
      // Simular click derecho
      onMouseClick({ button: 2 });
    });
    mobileControls.appendChild(btnBreak);
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
    // Selección de bloques con teclas numéricas
    case 'Digit1':
      selectedBlockType = 0;
      updateBlockSelector();
      break;
    case 'Digit2':
      selectedBlockType = 1;
      updateBlockSelector();
      break;
    case 'Digit3':
      selectedBlockType = 2;
      updateBlockSelector();
      break;
    case 'Digit4':
      selectedBlockType = 3;
      updateBlockSelector();
      break;
    case 'Digit5':
      selectedBlockType = 4;
      updateBlockSelector();
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

// Manejo del movimiento del ratón
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

// Loop de animación
function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  updateControls(delta);
  updateRaycaster();
  updateHUD();
  renderer.render(scene, camera);
}

// Actualizar el raycaster para highlight y preview
function updateRaycaster() {
  if (!document.pointerLockElement) {
    highlightMesh.visible = false;
    ghostMesh.visible = false;
    return;
  }
  
  // Raycaster desde el centro de la pantalla
  mouse.x = 0;
  mouse.y = 0;
  raycaster.setFromCamera(mouse, camera);
  
  const intersects = raycaster.intersectObjects(Array.from(blocks.values()));
  
  if (intersects.length > 0) {
    const intersect = intersects[0];
    const position = intersect.object.position;
    
    // Mostrar highlight en el bloque apuntado
    highlightMesh.position.copy(position);
    highlightMesh.visible = true;
    
    // Mostrar preview del bloque a colocar
    const normal = intersect.face.normal;
    const ghostPosition = position.clone().add(normal);
    ghostMesh.position.copy(ghostPosition);
    ghostMesh.visible = true;
  } else {
    highlightMesh.visible = false;
    ghostMesh.visible = false;
  }
}

// Actualización de controles del jugador
function updateControls(delta) {
  // Cálculo del vector "forward"
  const cosPitch = Math.cos(pitch);
  const forward = new THREE.Vector3(Math.sin(yaw) * cosPitch, 0, Math.cos(yaw) * cosPitch);
  forward.normalize();

  // Vector perpendicular para movimiento lateral
  const right = new THREE.Vector3(Math.sin(yaw - Math.PI / 2), 0, Math.cos(yaw - Math.PI / 2));
  right.normalize();

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

  // Velocidad horizontal
  velocity.x = direction.x * moveSpeed;
  velocity.z = direction.z * moveSpeed;

  // Salto y gravedad
  if (controls.jump && Math.abs(camera.position.y - 2) < 0.1) {
    velocity.y = 8;
  }
  velocity.y -= 9.8 * delta;
  
  // Aplicar velocidad
  camera.position.addScaledVector(velocity, delta);

  // Colisión con el suelo
  if (camera.position.y < 2) {
    camera.position.y = 2;
    velocity.y = 0;
  }
  
  // Colisión simple con bloques (evitar atravesar bloques)
  const playerKey = `${Math.round(camera.position.x)},${Math.round(camera.position.y - 1)},${Math.round(camera.position.z)}`;
  if (blocks.has(playerKey)) {
    camera.position.y = Math.round(camera.position.y) + 1;
    velocity.y = 0;
  }
}

// Actualizar HUD
function updateHUD() {
  const fps = (1 / clock.getDelta()).toFixed(1);
  if (fpsCounter) {
    fpsCounter.innerHTML = `FPS: ${fps} | Bloques: ${blocks.size}`;
  }
}