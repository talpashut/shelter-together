import { motion } from 'framer-motion';

interface ScoreboardProps {
  scores: Record<string, number>;
  players: Record<string, { name: string; avatar: string }>;
  title?: string;
  onContinue?: () => void;
  continueLabel?: string;
}

export default function Scoreboard({
  scores,
  players,
  title = 'תוצאות',
  onContinue,
  continueLabel = 'משחק הבא',
}: ScoreboardProps) {
  const sorted = Object.entries(scores)
    .sort(([, a], [, b]) => b - a);

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div className="page items-center gap-6 pt-8">
      <h2 className="text-3xl font-bold">{title}</h2>

      <div className="w-full flex flex-col gap-3">
        {sorted.map(([uid, score], i) => {
          const player = players[uid];
          return (
            <motion.div
              key={uid}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`card flex items-center gap-3 py-3 ${
                i === 0 ? 'ring-2 ring-shelter-gold' : ''
              }`}
            >
              <span className="text-2xl w-10 text-center">
                {i < 3 ? medals[i] : `#${i + 1}`}
              </span>
              <span className="text-xl">{player?.avatar || '👤'}</span>
              <span className="font-bold flex-1">{player?.name || 'שחקן'}</span>
              <span className="text-shelter-gold font-bold text-xl">{score}</span>
            </motion.div>
          );
        })}
      </div>

      {onContinue && (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          onClick={onContinue}
          className="btn-primary text-xl w-full mt-4"
        >
          {continueLabel}
        </motion.button>
      )}
    </div>
  );
}
