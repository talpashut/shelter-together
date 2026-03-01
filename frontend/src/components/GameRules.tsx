import { motion } from 'framer-motion';
import { GameDefinition } from '../lib/types';

interface GameRulesProps {
  game: GameDefinition;
  onReady: () => void;
}

export default function GameRules({ game, onReady }: GameRulesProps) {
  return (
    <div className="page items-center justify-center gap-6">
      <div className="text-5xl">{game.emoji}</div>
      <h2 className="text-3xl font-bold">{game.nameHe}</h2>

      <div className="card w-full">
        <h3 className="font-bold text-lg mb-3 text-shelter-accent">איך משחקים?</h3>
        <ol className="flex flex-col gap-3">
          {game.rulesHe.map((rule, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.15 }}
              className="flex gap-3"
            >
              <span className="bg-shelter-accent/20 text-shelter-accent w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                {i + 1}
              </span>
              <span className="text-shelter-text">{rule}</span>
            </motion.li>
          ))}
        </ol>
      </div>

      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        onClick={onReady}
        className="btn-primary text-xl w-full"
      >
        מוכנים? יאללה! 🚀
      </motion.button>
    </div>
  );
}
