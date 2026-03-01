import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameComponentProps } from '../lib/types';
import { TRIVIA_QUESTIONS } from './gameData';
import Timer from '../components/Timer';

export default function BoomTrivia({
  game,
  players,
  currentUserId,
  onUpdateGame,
  onFinishGame,
}: GameComponentProps) {
  const playerIds = useMemo(() => Object.keys(players), [players]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  const currentPlayerIdx: number = game.roundData.currentPlayerIdx ?? 0;
  const lives: Record<string, number> = game.roundData.lives || {};
  const questionIdx: number = game.roundData.questionIdx ?? 0;
  const bombTime: number = game.roundData.bombTime ?? 15;
  const phase: 'playing' | 'boom' | 'done' = game.roundData.phase || 'playing';
  const lastResult: string = game.roundData.lastResult || '';

  const alivePlayers = useMemo(
    () => playerIds.filter((id) => (lives[id] ?? 3) > 0),
    [playerIds, lives]
  );

  const currentPlayerId = alivePlayers[currentPlayerIdx % alivePlayers.length];
  const isMyTurn = currentPlayerId === currentUserId;
  const question = TRIVIA_QUESTIONS[questionIdx % TRIVIA_QUESTIONS.length];

  const initGame = useCallback(async () => {
    const startLives: Record<string, number> = {};
    playerIds.forEach((id) => (startLives[id] = 3));
    await onUpdateGame({
      roundData: {
        currentPlayerIdx: 0,
        lives: startLives,
        questionIdx: 0,
        bombTime: 15,
        phase: 'playing',
        lastResult: '',
      },
    });
  }, [playerIds, onUpdateGame]);

  useEffect(() => {
    if (!game.roundData.lives) {
      initGame();
    }
  }, []);

  const handleAnswer = useCallback(
    async (answerIdx: number) => {
      if (!isMyTurn) return;
      setSelectedAnswer(answerIdx);

      const correct = answerIdx === question.correct;
      const newLives = { ...lives };
      if (!correct) {
        newLives[currentPlayerId] = (newLives[currentPlayerId] ?? 3) - 1;
      }

      const alive = playerIds.filter((id) => (newLives[id] ?? 3) > 0);

      if (alive.length <= 1) {
        await onUpdateGame({
          roundData: {
            ...game.roundData,
            lives: newLives,
            phase: 'done',
            lastResult: correct ? 'correct' : 'wrong',
          },
        });
        setTimeout(() => {
          const scores: Record<string, number> = {};
          playerIds.forEach((id) => {
            scores[id] = (newLives[id] ?? 0) * 10;
          });
          if (alive.length === 1) scores[alive[0]] += 20;
          onFinishGame(scores);
        }, 2000);
        return;
      }

      const nextIdx = correct
        ? (currentPlayerIdx + 1) % alive.length
        : currentPlayerIdx % alive.length;

      const newBombTime = Math.max(8, bombTime - (correct ? 1 : 0));

      setTimeout(async () => {
        setSelectedAnswer(null);
        await onUpdateGame({
          roundData: {
            ...game.roundData,
            currentPlayerIdx: nextIdx,
            lives: newLives,
            questionIdx: questionIdx + 1,
            bombTime: newBombTime,
            phase: 'playing',
            lastResult: '',
          },
        });
      }, 1500);

      await onUpdateGame({
        roundData: {
          ...game.roundData,
          lastResult: correct ? 'correct' : 'wrong',
          lives: newLives,
        },
      });
    },
    [isMyTurn, question, lives, currentPlayerId, playerIds, currentPlayerIdx, bombTime, questionIdx, game.roundData, onUpdateGame, onFinishGame]
  );

  const handleTimeUp = useCallback(async () => {
    if (!isMyTurn) return;
    const newLives = { ...lives };
    newLives[currentPlayerId] = (newLives[currentPlayerId] ?? 3) - 1;

    const alive = playerIds.filter((id) => (newLives[id] ?? 3) > 0);
    if (alive.length <= 1) {
      const scores: Record<string, number> = {};
      playerIds.forEach((id) => (scores[id] = (newLives[id] ?? 0) * 10));
      if (alive.length === 1) scores[alive[0]] += 20;
      await onUpdateGame({
        roundData: { ...game.roundData, lives: newLives, phase: 'done' },
      });
      setTimeout(() => onFinishGame(scores), 2000);
      return;
    }

    await onUpdateGame({
      roundData: {
        ...game.roundData,
        currentPlayerIdx: currentPlayerIdx % alive.length,
        lives: newLives,
        questionIdx: questionIdx + 1,
        bombTime: Math.max(8, bombTime),
        lastResult: 'timeout',
      },
    });

    setTimeout(async () => {
      await onUpdateGame({
        roundData: {
          ...game.roundData,
          currentPlayerIdx: currentPlayerIdx % alive.length,
          lives: newLives,
          questionIdx: questionIdx + 1,
          phase: 'playing',
          lastResult: '',
        },
      });
    }, 1500);
  }, [isMyTurn, lives, currentPlayerId, playerIds, currentPlayerIdx, questionIdx, bombTime, game.roundData, onUpdateGame, onFinishGame]);

  if (!game.roundData.lives) {
    return (
      <div className="page items-center justify-center">
        <p className="text-shelter-muted">מכין את המשחק...</p>
      </div>
    );
  }

  if (phase === 'done') {
    const winner = alivePlayers[0];
    return (
      <div className="page items-center justify-center gap-4">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-7xl">
          💥
        </motion.div>
        <h2 className="text-2xl font-bold">
          {winner ? `${players[winner]?.name} ניצח/ה!` : 'נגמר!'}
        </h2>
      </div>
    );
  }

  return (
    <div className="page gap-4 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">💣 בום! טריוויה</h2>
        {isMyTurn && (
          <Timer key={questionIdx} seconds={bombTime} onTimeUp={handleTimeUp} size="sm" danger={5} />
        )}
      </div>

      <div className="flex flex-wrap gap-2 justify-center">
        {playerIds.map((id) => {
          const l = lives[id] ?? 3;
          const dead = l <= 0;
          return (
            <div
              key={id}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl ${
                id === currentPlayerId ? 'bg-shelter-accent/20 ring-2 ring-shelter-accent' : ''
              } ${dead ? 'opacity-30' : ''}`}
            >
              <span className="text-xl">{players[id]?.avatar}</span>
              <span className="text-xs">{players[id]?.name}</span>
              <span className="text-xs">{'❤️'.repeat(Math.max(0, l))}</span>
            </div>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {lastResult ? (
          <motion.div
            key="result"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`card text-center text-xl font-bold ${
              lastResult === 'correct' ? 'text-shelter-success' : 'text-shelter-accent'
            }`}
          >
            {lastResult === 'correct' ? '✓ נכון!' : lastResult === 'timeout' ? '⏰ נגמר הזמן!' : '✗ לא נכון!'}
          </motion.div>
        ) : (
          <motion.div
            key={`q-${questionIdx}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <div className="card">
              <p className="text-center font-bold text-lg mb-1">
                {isMyTurn ? 'התור שלכם!' : `התור של ${players[currentPlayerId]?.name}`}
              </p>
              <p className="text-center text-shelter-accent font-bold text-lg mt-3">
                {question.question}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-3">
              {question.answers.map((ans, i) => (
                <button
                  key={i}
                  onClick={() => isMyTurn && handleAnswer(i)}
                  disabled={!isMyTurn || selectedAnswer !== null}
                  className={`card text-center py-4 font-medium transition-all ${
                    selectedAnswer === i
                      ? i === question.correct
                        ? 'ring-2 ring-shelter-success bg-shelter-success/20'
                        : 'ring-2 ring-shelter-accent bg-shelter-accent/20'
                      : isMyTurn
                      ? 'hover:bg-shelter-border active:scale-95'
                      : 'opacity-60'
                  }`}
                >
                  {ans}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
