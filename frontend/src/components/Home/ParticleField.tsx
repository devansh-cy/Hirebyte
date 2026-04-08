import { useRef, useEffect } from 'react';
import * as THREE from 'three';

export const ParticleField = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    
    // Setup
    const scene = new THREE.Scene();
    
    // Camera
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 30;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Particles
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 800;
    
    const posArray = new Float32Array(particlesCount * 3);
    const velocityArray = new Float32Array(particlesCount * 3);
    
    for(let i = 0; i < particlesCount * 3; i++) {
        // Position - spread across screen
        posArray[i] = (Math.random() - 0.5) * 80;
        
        // Velocity
        velocityArray[i] = (Math.random() - 0.5) * 0.02;
    }
    
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    
    const material = new THREE.PointsMaterial({
        size: 0.15,
        color: new THREE.Color('#06B6D4'), // accent-cyan
        transparent: true,
        opacity: 0.3,
        blending: THREE.AdditiveBlending
    });
    
    const particlesMesh = new THREE.Points(particlesGeometry, material);
    scene.add(particlesMesh);

    // Lines between particles
    const linesMaterial = new THREE.LineBasicMaterial({
        color: 0x06B6D4,
        transparent: true,
        opacity: 0.05,
        blending: THREE.AdditiveBlending
    });
    
    // Initial empty geometry for lines, will be updated in animation loop
    const linesGeometry = new THREE.BufferGeometry();
    const linesMesh = new THREE.LineSegments(linesGeometry, linesMaterial);
    scene.add(linesMesh);

    // Mouse Interaction
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;
    
    const windowHalfX = window.innerWidth / 2;
    const windowHalfY = window.innerHeight / 2;

    const handleMouseMove = (event: MouseEvent) => {
        mouseX = (event.clientX - windowHalfX);
        mouseY = (event.clientY - windowHalfY);
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Animation Loop
    let animationFrameId: number;

    const tick = () => {
        
        targetX = mouseX * 0.001;
        targetY = mouseY * 0.001;
        
        // Update particles
        const positions = particlesMesh.geometry.attributes.position.array as Float32Array;
        
        // Simple lines implementation (connect close particles)
        // Note: For 800 particles O(n^2) every frame is heavy, so we limit lines
        // For performance, we'll only do distance checks for a subset or skip drawing lines 
        // if performance is an issue. Here we do a fast check.
        // To strictly match "Particle connections draw when within 120px", we use a simplified
        // 3D distance threshold.
        
        const linePositions = [];
        
        for(let i = 0; i < particlesCount; i++) {
            const i3 = i * 3;
            
            // Move particles
            positions[i3] += velocityArray[i3];
            positions[i3+1] += velocityArray[i3+1];
            positions[i3+2] += velocityArray[i3+2];
            
            // Wrap around edges
            if(positions[i3] > 40) positions[i3] = -40;
            if(positions[i3] < -40) positions[i3] = 40;
            if(positions[i3+1] > 40) positions[i3+1] = -40;
            if(positions[i3+1] < -40) positions[i3+1] = 40;
            
            // Mouse repulsion (simple version)
            // Camera covers ~ [-30, 30] horizontally
            const dx = positions[i3] - (mouseX / windowHalfX * 30);
            const dy = positions[i3+1] - (-mouseY / windowHalfY * 30); // negative because y is inverted
            const dist = Math.sqrt(dx*dx + dy*dy);
            
            if (dist < 4) { // 4 units radius
               positions[i3] += dx * 0.01;
               positions[i3+1] += dy * 0.01;
            }
            
            // Connect lines (sample every Nth particle for performance)
            if (i % 4 === 0) {
               for(let j = i + 1; j < particlesCount; j+= 4) {
                   const j3 = j * 3;
                   const ddx = positions[i3] - positions[j3];
                   const ddy = positions[i3+1] - positions[j3+1];
                   const ddstep = Math.sqrt(ddx*ddx + ddy*ddy);
                   
                   // Connection threshold
                   if (ddstep < 4) {
                       linePositions.push(
                           positions[i3], positions[i3+1], positions[i3+2],
                           positions[j3], positions[j3+1], positions[j3+2]
                       );
                   }
               }
            }
        }
        
        particlesMesh.geometry.attributes.position.needsUpdate = true;
        
        // Update lines
        linesMesh.geometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
        
        // Subtle scene rotation
        scene.rotation.y += 0.0005;
        scene.rotation.x += (targetY - scene.rotation.x) * 0.05;
        scene.rotation.y += (targetX - scene.rotation.y) * 0.05;

        renderer.render(scene, camera);
        animationFrameId = requestAnimationFrame(tick);
    };

    tick();

    // Window Resize
    const handleResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };
    
    window.addEventListener('resize', handleResize);

    return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('mousemove', handleMouseMove);
        cancelAnimationFrame(animationFrameId);
        if (container.contains(renderer.domElement)) {
            container.removeChild(renderer.domElement);
        }
        particlesGeometry.dispose();
        linesGeometry.dispose();
        material.dispose();
        linesMaterial.dispose();
        renderer.dispose();
    };
  }, []);

  return <div ref={containerRef} className="absolute inset-0 w-full h-full -z-10" />;
};
