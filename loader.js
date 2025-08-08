// Loader para garantizar que Three.js se cargue antes que main.js
(function() {
    'use strict';
    
    let attempts = 0;
    const maxAttempts = 50;
    
    function checkAndLoadMain() {
        attempts++;
        
        if (typeof THREE !== 'undefined') {
            console.log('✅ Three.js cargado correctamente');
            
            // Crear y cargar main.js dinámicamente
            const mainScript = document.createElement('script');
            mainScript.src = 'main.js?v=' + Date.now(); // Evitar caché
            mainScript.onload = function() {
                console.log('✅ main.js cargado correctamente');
            };
            mainScript.onerror = function() {
                console.error('❌ Error al cargar main.js');
            };
            document.body.appendChild(mainScript);
            
        } else if (attempts < maxAttempts) {
            console.log(`⏳ Esperando Three.js... intento ${attempts}/${maxAttempts}`);
            setTimeout(checkAndLoadMain, 100);
        } else {
            console.error('❌ Three.js no se pudo cargar después de ' + maxAttempts + ' intentos');
            
            // Intentar recargar Three.js
            const threeScript = document.createElement('script');
            threeScript.src = 'https://cdn.jsdelivr.net/npm/three@0.136.0/build/three.min.js';
            threeScript.onload = function() {
                console.log('🔄 Three.js recargado, intentando de nuevo...');
                attempts = 0;
                checkAndLoadMain();
            };
            document.head.appendChild(threeScript);
        }
    }
    
    // Iniciar verificación cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkAndLoadMain);
    } else {
        checkAndLoadMain();
    }
})();