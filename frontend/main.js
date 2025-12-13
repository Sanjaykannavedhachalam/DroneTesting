// Global variables
let scene, camera, renderer, drone, propellers = [];
let roll = 0, pitch = 0, yaw = 0, throttle = 0;
let targetRoll = 0, targetPitch = 0, targetYaw = 0, targetThrottle = 0;
const smoothingFactor = 0.1;
let lastTime = 0;
let currentY = 0;
let fps = 60;
let frameCount = 0;
let lastFpsUpdate = 0;

// Initialize Three.js
function initThreeJS() {
    const container = document.getElementById('threejs-container');

    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x121212);

    // Camera
    camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(5, 5, 5);
    camera.lookAt(0, 0, 0);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    scene.add(directionalLight);

    // Helpers
    const gridHelper = new THREE.GridHelper(10, 10, 0x444444, 0x222222);
    scene.add(gridHelper);
    const axesHelper = new THREE.AxesHelper(5);
    scene.add(axesHelper);

    // Load drone model
    const loader = new THREE.GLTFLoader();
    loader.load('models/drone.glb', function(gltf) {
        drone = gltf.scene;
        drone.scale.set(1.2, 1.2, 1.2); // Increase size slightly
        scene.add(drone);

        // Assume propellers are named 'propeller1', 'propeller2', etc.
        // Adjust based on actual model
        drone.traverse(function(child) {
            if (child.isMesh && child.name.includes('propeller')) {
                propellers.push(child);
            }
        });

        console.log('Drone model loaded');
    }, undefined, function(error) {
        console.error('Error loading drone model:', error);
    });

    // Handle window resize
    window.addEventListener('resize', onWindowResize, false);
}

function onWindowResize() {
    const container = document.getElementById('threejs-container');
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}

// Animation loop
function animate(time) {
    requestAnimationFrame(animate);

    const deltaTime = (time - lastTime) / 1000;
    lastTime = time;

    // Calculate FPS
    frameCount++;
    if (time - lastFpsUpdate > 1000) {
        fps = Math.round(frameCount / ((time - lastFpsUpdate) / 1000));
        frameCount = 0;
        lastFpsUpdate = time;
        document.getElementById('fps-value').textContent = fps;
    }

    if (drone) {
        // Smooth interpolation
        roll += (targetRoll - roll) * smoothingFactor;
        pitch += (targetPitch - pitch) * smoothingFactor;
        yaw += (targetYaw - yaw) * smoothingFactor;
        throttle += (targetThrottle - throttle) * smoothingFactor;

        // Altitude based on throttle
        const targetY = (throttle / 100) * 5; // Max altitude 5 units
        currentY += (targetY - currentY) * smoothingFactor;
        drone.position.y = currentY;

        // Apply rotations (in radians)
        drone.rotation.x = THREE.MathUtils.degToRad(roll);
        drone.rotation.y = THREE.MathUtils.degToRad(pitch);
        drone.rotation.z = THREE.MathUtils.degToRad(yaw);

        // Propeller rotation
        const rpm = throttle * 100; // Mock RPM based on throttle
        const radPerSec = (rpm / 60) * 2 * Math.PI;
        propellers.forEach((prop, index) => {
            const direction = index % 2 === 0 ? 1 : -1; // Alternate directions
            prop.rotation.z += direction * radPerSec * deltaTime;
        });
    }

    // Update dashboard
    updateDashboard();

    renderer.render(scene, camera);
}

// Update dashboard values
function updateDashboard() {
    document.getElementById('roll-value').textContent = roll.toFixed(2);
    document.getElementById('pitch-value').textContent = pitch.toFixed(2);
    document.getElementById('yaw-value').textContent = yaw.toFixed(2);
    document.getElementById('throttle-value').textContent = throttle.toFixed(2);
    document.getElementById('rpm-value').textContent = Math.round(throttle * 100);
    document.getElementById('last-update').textContent = new Date().toLocaleTimeString();
}

// Joystick callbacks
function onLeftJoystickChange(x, y) {
    // Left: Vertical Throttle, Horizontal Yaw
    targetThrottle = Math.max(0, Math.min(100, (1 - y) * 50)); // 0 to 100
    targetYaw = x * 180; // -180 to 180
    targetYaw = (targetYaw + 360) % 360;

    // Update joystick values
    document.getElementById('left-throttle').textContent = targetThrottle.toFixed(2);
    document.getElementById('left-yaw').textContent = targetYaw.toFixed(2);
}

function onRightJoystickChange(x, y) {
    // Right: Vertical Pitch, Horizontal Roll
    targetPitch = -y * 30; // -30 to 30
    targetRoll = x * 30; // -30 to 30

    // Update joystick values
    document.getElementById('right-pitch').textContent = targetPitch.toFixed(2);
    document.getElementById('right-roll').textContent = targetRoll.toFixed(2);
}

// Mode switch
document.getElementById('manual-mode').addEventListener('click', function() {
    this.classList.add('active');
    document.getElementById('live-mode').classList.remove('active');
    document.getElementById('data-source').textContent = 'Manual';
    document.getElementById('bottom-status').textContent = 'Manual input active';
});

document.getElementById('live-mode').addEventListener('click', function() {
    this.classList.add('active');
    document.getElementById('manual-mode').classList.remove('active');
    document.getElementById('data-source').textContent = 'Live';
    document.getElementById('bottom-status').textContent = 'Live data active';
});

// Keyboard controls (optional)
document.addEventListener('keydown', function(event) {
    switch(event.key) {
        case 'w':
            targetPitch = Math.min(30, targetPitch + 5);
            break;
        case 's':
            targetPitch = Math.max(-30, targetPitch - 5);
            break;
        case 'a':
            targetRoll = Math.max(-30, targetRoll - 5);
            break;
        case 'd':
            targetRoll = Math.min(30, targetRoll + 5);
            break;
        case 'q':
            targetYaw = (targetYaw - 5 + 360) % 360;
            break;
        case 'e':
            targetYaw = (targetYaw + 5) % 360;
            break;
        case 'ArrowUp':
            targetThrottle = Math.min(100, targetThrottle + 5);
            break;
        case 'ArrowDown':
            targetThrottle = Math.max(0, targetThrottle - 5);
            break;
    }
});

// Initialize
initThreeJS();
initJoysticks(onLeftJoystickChange, onRightJoystickChange);
animate(0);