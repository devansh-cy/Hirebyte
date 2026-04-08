import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export const CustomCursor = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHoveringButton, setIsHoveringButton] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) {
      setIsTouchDevice(true);
      return;
    }

    const updateMousePosition = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName.toLowerCase() === 'button' || 
        target.tagName.toLowerCase() === 'a' ||
        target.closest('button') ||
        target.closest('a') ||
        target.classList.contains('cursor-pointer')
      ) {
        setIsHoveringButton(true);
      } else {
        setIsHoveringButton(false);
      }
    };

    const handleMouseDown = () => setIsClicked(true);
    const handleMouseUp = () => setIsClicked(false);

    window.addEventListener('mousemove', updateMousePosition);
    window.addEventListener('mouseover', handleMouseOver);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    document.body.style.cursor = 'none';

    return () => {
      window.removeEventListener('mousemove', updateMousePosition);
      window.removeEventListener('mouseover', handleMouseOver);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'auto';
    };
  }, []);

  if (isTouchDevice) return null;

  // Dot variants
  const dotVariants = {
    default: {
      scale: 1,
    },
    clicked: {
      scale: 0.6,
    }
  };

  // Ring variants
  const ringVariants = {
    default: {
      x: mousePosition.x - 16,
      y: mousePosition.y - 16,
      width: 32,
      height: 32,
      borderRadius: '50%',
      backgroundColor: 'transparent',
      border: '1px solid rgba(201, 168, 76, 0.25)',
      mixBlendMode: 'normal' as const,
    },
    buttonHover: {
      x: mousePosition.x - 30,
      y: mousePosition.y - 30,
      width: 60,
      height: 60,
      borderRadius: '50%',
      backgroundColor: 'rgba(255,255,255,1)',
      border: 'none',
      mixBlendMode: 'difference' as const,
    }
  };

  return (
    <div className="pointer-events-none fixed inset-0 z-[99999]">
      {/* Target Dot - zero lag */}
      <motion.div
        className="fixed top-0 left-0 w-2 h-2 rounded-full bg-gold"
        style={{
          transform: `translate(${mousePosition.x - 4}px, ${mousePosition.y - 4}px)`,
        }}
        variants={dotVariants}
        animate={isClicked ? 'clicked' : 'default'}
        transition={{ type: "tween", ease: "linear", duration: 0.1 }}
      />
      
      {/* Trailing Ring - lerp (represented by spring) */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none"
        variants={ringVariants}
        animate={isHoveringButton ? 'buttonHover' : 'default'}
        transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.5 }}
      />
    </div>
  );
};
