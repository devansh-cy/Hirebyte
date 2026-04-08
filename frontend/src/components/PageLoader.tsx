import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

export default function PageLoader({ onComplete }: { onComplete: () => void }) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const logoRef = useRef<HTMLDivElement>(null)
  const lettersRef = useRef<(HTMLSpanElement | null)[]>([])
  const brandName = 'HireByte'

  useEffect(() => {
    // Only run if user accepts motion
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    
    if (prefersReduced) {
        // Skip animation on reduced motion
        onComplete();
        return;
    }

    const tl = gsap.timeline()

    // Step 1: Letters stagger in
    tl.from(lettersRef.current.filter(Boolean), {
      opacity: 0,
      y: 30,
      stagger: 0.08,
      duration: 0.6,
      ease: 'power3.out',
    })

    // Step 2: Hold
    .to({}, { duration: 0.8 })

    // Step 3: Logo fades out
    .to(logoRef.current, {
      opacity: 0,
      duration: 0.4,
      ease: 'power2.in',
    })

    // Step 4: Overlay slides up (curtain lift)
    .to(overlayRef.current, {
      yPercent: -100,
      duration: 0.9,
      ease: 'power3.inOut',
      onComplete: onComplete,  // triggers page reveal
    }, '-=0.1')

    return () => { tl.kill() }
  }, [onComplete])

  return (
    <div
      ref={overlayRef}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#080808',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div ref={logoRef} style={{ display: 'flex', gap: '0.02em' }}>
        {brandName.split('').map((letter, i) => (
          <span
            key={i}
            ref={(el) => { lettersRef.current[i] = el }}
            style={{
              fontFamily: '"Cormorant Garamond", serif',
              fontSize: 'clamp(2.5rem, 6vw, 5rem)',
              fontWeight: 700,
              color: '#C9A84C',
              letterSpacing: '0.05em',
            }}
          >
            {letter}
          </span>
        ))}
      </div>
    </div>
  )
}
