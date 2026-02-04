'use client';

import { useEffect, useState } from 'react';

interface Confetti {
  id: number;
  left: number;
  delay: number;
  duration: number;
}

export function Confetti() {
  const [confetti, setConfetti] = useState<Confetti[]>([]);

  useEffect(() => {
    const newConfetti: Confetti[] = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.2,
      duration: 2 + Math.random() * 1,
    }));
    setConfetti(newConfetti);

    const timer = setTimeout(() => setConfetti([]), 3200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {confetti.map((conf) => (
        <div
          key={conf.id}
          className="absolute animate-pulse"
          style={{
            left: `${conf.left}%`,
            top: '-10px',
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            animation: `fall ${conf.duration}s linear ${conf.delay}s forwards`,
            backgroundColor: [
              '#a855f7', // purple
              '#ec4899', // pink
              '#06b6d4', // cyan
              '#fbbf24', // amber
            ][Math.floor(Math.random() * 4)],
          }}
        />
      ))}
      <style>{`
        @keyframes fall {
          to {
            transform: translateY(100vh) rotateZ(360deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
