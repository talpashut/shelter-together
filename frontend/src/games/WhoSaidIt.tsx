import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameComponentProps } from '../lib/types';
import { WHO_SAID_IT_PROMPTS } from './gameData';

type Phase = 'submit' | 'guess' | 'reveal';

export default function WhoSaidIt({
  session,
  game,
  players,
  currentUserId,
  onUpdateGame,
  onUpdatePlayerData,
  onFinishGame,
}: GameComponentProps) {
  const playerIds = useMemo(() => Object.keys(players), [players]);

  const prompt = useMemo(() => {
    const idx = Math.abs(hashCode(game.id)) % WHO_SAID_IT_PROMPTS.length;
    return WHO_SAID_IT_PROMPTS[idx];
  }, [game.id]);

  const phase: Phase = game.roundData.phase || 'submit';
  const answers: Record<string, string> = game.roundData.answers || {};
  const guesses: Record<string, Record<string, string>> = game.roundData.guesses || {};
  const currentRevealIdx: number = game.roundData.currentRevealIdx ?? -1;

  const [myAnswer, setMyAnswer] = useState('');
  const [myGuesses, setMyGuesses] = useState<Record<string, string>>({});

  const allSubmitted = playerIds.every((id) => answers[id]);
  const allGuessed = playerIds.every((id) => guesses[id]);

  const shuffledAnswers = useMemo(() => {
    const entries = Object.entries(answers);
    const seed = hashCode(game.id + 'shuffle');
    return entries.sort((a, b) => hashCode(a[0] + seed) - hashCode(b[0] + seed));
  }, [answers, game.id]);

  const handleSubmitAnswer = useCallback(async () => {
    if (!myAnswer.trim()) return;
    const newAnswers = { ...answers, [currentUserId]: myAnswer.trim() };
    await onUpdateGame({
      roundData: {
        ...game.roundData,
        answers: newAnswers,
        phase: Object.keys(newAnswers).length === playerIds.length ? 'guess' : 'submit',
      },
    });
  }, [myAnswer, answers, currentUserId, game.roundData, playerIds.length, onUpdateGame]);

  const handleSubmitGuesses = useCallback(async () => {
    const newGuesses = { ...guesses, [currentUserId]: myGuesses };
    const allDone = Object.keys(newGuesses).length === playerIds.length;
    await onUpdateGame({
      roundData: {
        ...game.roundData,
        guesses: newGuesses,
        phase: allDone ? 'reveal' : 'guess',
        currentRevealIdx: allDone ? 0 : -1,
      },
    });
  }, [myGuesses, guesses, currentUserId, game.roundData, playerIds.length, onUpdateGame]);

  const handleNextReveal = useCallback(async () => {
    const nextIdx = currentRevealIdx + 1;
    if (nextIdx >= shuffledAnswers.length) {
      const scores: Record<string, number> = {};
      playerIds.forEach((id) => (scores[id] = 0));

      for (const [guesserId, playerGuesses] of Object.entries(guesses)) {
        for (const [answerId, guessedId] of Object.entries(playerGuesses)) {
          if (guessedId === answerId) {
            scores[guesserId] = (scores[guesserId] || 0) + 10;
          }
        }
        for (const [otherId, otherGuesses] of Object.entries(guesses)) {
          if (otherId === guesserId) continue;
          for (const [answerId, guessedId] of Object.entries(otherGuesses)) {
            if (answerId === currentUserId && guessedId !== answerId) {
              scores[answerId] = (scores[answerId] || 0) + 5;
            }
          }
        }
      }

      onFinishGame(scores);
    } else {
      await onUpdateGame({
        roundData: { ...game.roundData, currentRevealIdx: nextIdx },
      });
    }
  }, [currentRevealIdx, shuffledAnswers, guesses, playerIds, game.roundData, onUpdateGame, onFinishGame]);

  if (phase === 'submit') {
    const submitted = !!answers[currentUserId];
    return (
      <div className="page gap-4 pt-8">
        <h2 className="text-2xl font-bold text-center">🎭 מי אמר?</h2>
        <div className="card text-center">
          <p className="text-lg text-shelter-accent font-bold">{prompt}</p>
        </div>

        {submitted ? (
          <div className="card text-center">
            <p className="text-shelter-success">✓ התשובה שלכם נשלחה!</p>
            <p className="text-shelter-muted text-sm mt-2">
              ממתינים לשאר השחקנים ({Object.keys(answers).length}/{playerIds.length})
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <textarea
              value={myAnswer}
              onChange={(e) => setMyAnswer(e.target.value)}
              placeholder="כתבו את התשובה שלכם..."
              className="min-h-[100px] resize-none"
              maxLength={200}
            />
            <button
              onClick={handleSubmitAnswer}
              disabled={!myAnswer.trim()}
              className="btn-primary disabled:opacity-40"
            >
              שליחה
            </button>
          </div>
        )}
      </div>
    );
  }

  if (phase === 'guess') {
    const submitted = !!guesses[currentUserId];
    return (
      <div className="page gap-4 pt-8">
        <h2 className="text-2xl font-bold text-center">🎭 מי כתב מה?</h2>
        <p className="text-shelter-muted text-center text-sm">התאימו כל תשובה לשחקן</p>

        {submitted ? (
          <div className="card text-center">
            <p className="text-shelter-success">✓ הניחושים שלכם נשלחו!</p>
            <p className="text-shelter-muted text-sm mt-2">
              ממתינים ({Object.keys(guesses).length}/{playerIds.length})
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-3">
              {shuffledAnswers.map(([authorId, answer]) => (
                <div key={authorId} className="card">
                  <p className="mb-2 text-shelter-text">"{answer}"</p>
                  <div className="flex flex-wrap gap-1">
                    {playerIds.map((pid) => (
                      <button
                        key={pid}
                        onClick={() => setMyGuesses((g) => ({ ...g, [authorId]: pid }))}
                        className={`text-sm py-1 px-3 rounded-full ${
                          myGuesses[authorId] === pid
                            ? 'bg-shelter-accent text-white'
                            : 'bg-shelter-surface text-shelter-muted'
                        }`}
                      >
                        {players[pid]?.avatar} {players[pid]?.name}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={handleSubmitGuesses}
              disabled={Object.keys(myGuesses).length < shuffledAnswers.length}
              className="btn-primary disabled:opacity-40"
            >
              שליחת ניחושים
            </button>
          </>
        )}
      </div>
    );
  }

  if (phase === 'reveal') {
    const current = shuffledAnswers[currentRevealIdx];
    if (!current) return null;
    const [authorId, answer] = current;

    return (
      <div className="page items-center justify-center gap-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentRevealIdx}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="card w-full text-center"
          >
            <p className="text-lg mb-4">"{answer}"</p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
            >
              <p className="text-shelter-muted text-sm">נכתב על ידי:</p>
              <p className="text-3xl mt-2">{players[authorId]?.avatar}</p>
              <p className="text-xl font-bold text-shelter-accent mt-1">
                {players[authorId]?.name}
              </p>
            </motion.div>
          </motion.div>
        </AnimatePresence>

        <button onClick={handleNextReveal} className="btn-primary">
          {currentRevealIdx >= shuffledAnswers.length - 1 ? 'לתוצאות' : 'הבא →'}
        </button>
      </div>
    );
  }

  return null;
}

function hashCode(s: string): number {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    const char = s.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return hash;
}
