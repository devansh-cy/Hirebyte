import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export default function ParticleField() {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // === SETUP ===
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
    camera.position.z = 5

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    renderer.setClearColor(0x000000, 0)
    
    if (mountRef.current) {
        mountRef.current.appendChild(renderer.domElement)
    }

    // === PARTICLES ===
    const isMobile = window.matchMedia("(pointer: coarse)").matches;
    const count = isMobile ? 200 : 600;
    
    // Disable on very small screens for performance if needed
    if (window.innerWidth < 480) {
        // Just return to avoid heavy work on small devices
    }

    const positions = new Float32Array(count * 3)
    const velocities: { x: number; y: number; z: number }[] = []

    for (let i = 0; i < count; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 20  // x
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20  // y
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10  // z
      velocities.push({
        x: (Math.random() - 0.5) * 0.003,
        y: (Math.random() - 0.5) * 0.003,
        z: 0,
      })
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

    const material = new THREE.PointsMaterial({
      color: 0xC9A84C,   // gold color
      size: 0.03,
      transparent: true,
      opacity: 0.55,
      sizeAttenuation: true,
    })

    const particles = new THREE.Points(geometry, material)
    scene.add(particles)

    // === MOUSE REACTIVE REPULSION ===
    const mouse = { x: 0, y: 0 }
    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = (e.clientX / window.innerWidth - 0.5) * 10
      mouse.y = -(e.clientY / window.innerHeight - 0.5) * 10
    }
    
    if (!isMobile) {
        window.addEventListener('mousemove', handleMouseMove)
    }

    // === ANIMATION LOOP ===
    let animId: number
    const animate = () => {
      animId = requestAnimationFrame(animate)
      const pos = geometry.attributes.position.array as Float32Array

      for (let i = 0; i < count; i++) {
        // Drift
        pos[i * 3]     += velocities[i].x
        pos[i * 3 + 1] += velocities[i].y

        // Mouse repulsion (within 2.5 unit radius)
        if (!isMobile) {
            const dx = pos[i * 3] - mouse.x
            const dy = pos[i * 3 + 1] - mouse.y
            const dist = Math.sqrt(dx * dx + dy * dy)
            if (dist < 2.5) {
                const force = (2.5 - dist) / 2.5
                pos[i * 3]     += dx * force * 0.015
                pos[i * 3 + 1] += dy * force * 0.015
            }
        }

        // Wrap edges
        if (pos[i * 3] > 10)  pos[i * 3] = -10
        if (pos[i * 3] < -10) pos[i * 3] = 10
        if (pos[i * 3 + 1] > 10)  pos[i * 3 + 1] = -10
        if (pos[i * 3 + 1] < -10) pos[i * 3 + 1] = 10
      }

      geometry.attributes.position.needsUpdate = true
      renderer.render(scene, camera)
    }
    animate()

    // === RESIZE ===
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', handleResize)

    // === REDUCED MOTION ===
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) cancelAnimationFrame(animId)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('resize', handleResize)
      renderer.dispose()
      if (mountRef.current) {
          mountRef.current.removeChild(renderer.domElement)
      }
    }
  }, [])

  return (
    <div
      ref={mountRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  )
}
