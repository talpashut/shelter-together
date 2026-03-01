import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { GameDefinition } from '../lib/types';

interface GameIntroProps {
  game: GameDefinition;
  onDone: () => void;
}

export default function GameIntro({ game, onDone }: GameIntroProps) {
  useEffect(() => {
    const timer = setTimeout(onDone, 3000);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div className="page items-center justify-center gap-4">
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="text-8xl"
      >
        {game.emoji}
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-4xl font-black text-center"
      >
        {game.nameHe}
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-shelter-muted text-center text-lg"
      >
        {game.descriptionHe}
      </motion.p>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        transition={{ delay: 1.5 }}
        className="text-shelter-muted text-sm mt-8"
      >
        ממשיכים עוד רגע...
      </motion.div>
    </div>
  );
}
