import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';

const colors = ['#38bdf8', '#facc15', '#fb7185', '#a78bfa', '#22c55e'];

export function Confetti({ active }: { active: boolean }) {
  const [pieces] = useState(
    Array.from({ length: 35 }, (_, index) => ({ id: index, left: Math.random() * 100, delay: Math.random() * 1.4, color: colors[index % colors.length] })),
  );

  const confettiPieces = useMemo(() => pieces, [pieces]);

  if (!active) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
      {confettiPieces.map((piece) => (
        <motion.div
          key={piece.id}
          initial={{ y: -60, opacity: 0, rotate: 0, backgroundColor: piece.color }}
          animate={{ y: 820, opacity: [0.8, 0.6, 0], rotate: 360, backgroundColor: piece.color }}
          transition={{ duration: 2.5, delay: piece.delay, ease: 'easeOut' }}
          style={{ left: `${piece.left}%` }}
          className="absolute h-3 w-3 rounded-full"
        />
      ))}
    </div>
  );
}
