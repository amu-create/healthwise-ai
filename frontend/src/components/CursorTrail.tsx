import React, { useEffect, useState } from 'react';
import '../styles/cursor-effects.css';

interface TrailDot {
  id: number;
  x: number;
  y: number;
}

const CursorTrail: React.FC = () => {
  const [trail, setTrail] = useState<TrailDot[]>([]);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    let dotId = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const newDot: TrailDot = {
        id: dotId++,
        x: e.clientX,
        y: e.clientY,
      };

      setTrail((prevTrail) => [...prevTrail, newDot].slice(-20)); // Keep last 20 dots

      // Remove old dots after animation completes
      setTimeout(() => {
        setTrail((prevTrail) => prevTrail.filter((dot) => dot.id !== newDot.id));
      }, 1000);
    };

    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);

    // Add event listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    // Cleanup
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div className="cursor-trail">
      {trail.map((dot) => (
        <div
          key={dot.id}
          className="trail-dot"
          style={{
            left: dot.x - 3,
            top: dot.y - 3,
          }}
        />
      ))}
    </div>
  );
};

export default CursorTrail;
