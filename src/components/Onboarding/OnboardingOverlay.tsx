/**
 * Onboarding Overlay Component
 * Overlay với spotlight effect để highlight các phần tử UI
 */

import { useEffect, useState, useRef } from 'react';

interface OnboardingOverlayProps {
  target?: string; // CSS selector
}

export default function OnboardingOverlay({ target }: OnboardingOverlayProps) {
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [position, setPosition] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!target) {
      setTargetElement(null);
      setPosition(null);
      return;
    }

    // Tìm element với data attribute hoặc selector
    const element = document.querySelector(target) as HTMLElement;
    if (element) {
      setTargetElement(element);
      
      // Scroll element vào view
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Tính toán vị trí
      const updatePosition = () => {
        const rect = element.getBoundingClientRect();
        setPosition({
          top: rect.top + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
          height: rect.height,
        });
      };

      updatePosition();
      
      // Update position khi scroll hoặc resize
      const handleScroll = () => updatePosition();
      const handleResize = () => updatePosition();
      
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleResize);
      
      return () => {
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleResize);
      };
    } else {
      setTargetElement(null);
      setPosition(null);
    }
  }, [target]);

  if (!target || !position || !targetElement) {
    return null;
  }

  // Tạo spotlight effect với SVG mask
  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 pointer-events-none"
      style={{ pointerEvents: 'none' }}
    >
      {/* Backdrop với opacity */}
      <div className="absolute inset-0 bg-black/50" />
      
      {/* Spotlight area */}
      <svg className="absolute inset-0 w-full h-full">
        <defs>
          <mask id="spotlight-mask">
            <rect width="100%" height="100%" fill="black" />
            <rect
              x={position.left}
              y={position.top}
              width={position.width}
              height={position.height}
              fill="white"
              rx="8"
            />
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="black"
          opacity="0.5"
          mask="url(#spotlight-mask)"
        />
      </svg>

      {/* Highlight border */}
      <div
        className="absolute border-4 border-blue-500 rounded-lg pointer-events-none animate-pulse"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
          width: `${position.width}px`,
          height: `${position.height}px`,
          boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)',
        }}
      />
    </div>
  );
}
