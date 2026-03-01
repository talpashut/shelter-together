import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { GameComponentProps } from '../lib/types';
import { ONE_WORD_PAIRS } from './gameData';

type Phase = 'clue' | 'guess' | 'reveal';

export default function OneWord({
  game,
  players,
  currentUserId,
  onUpdateGame,
  onFinishGame,
}: GameComponentProps) {
  const playerIds = useMemo(() => Object.keys(players), [players]);
  const [myClue, setMyClue] = useState('');
  const [myGuess, setMyGuess] = useState('');

  const round: number = game.roundData.round ?? 0;
  const phase: Phase = game.roundData.phase || 'clue';
  const clue: string = game.roundData.clue || '';
  const guesses: Record<string, string> = game.roundData.guesses || {};
  const totalScores: Record<string, number> = game.roundData.totalScores || {};
  const totalRounds = Math.min(playerIds.length, 4);

  const clueGiverId = playerIds[round % playerIds.length];
  const isClueGiver = currentUserId === clueGiverId;

  const pair = useMemo(() => {
    const idx = Math.abs(hashCode(game.id + round)) % ONE_WORD_PAIRS.length;
    return ONE_WORD_PAIRS[idx];
  }, [game.id, round]);

  const handleSubmitClue = useCallback(async () => {
    if (!myClue.trim()) return;
    const word = myClue.trim().split(/\s+/)[0];
    await onUpdateGame({
      roundData: {
        ...game.roundData,
        clue: word,
        phase: 'guess',
        round,
      },
    });
  }, [myClue, game.roundData, round, onUpdateGame]);

  const handleSubmitGuess = useCallback(async () => {
    if (!myGuess.trim()) return;
    const newGuesses = { ...guesses, [currentUserId]: myGuess.trim() };
    const guessersNeeded = playerIds.filter((id) => id !== clueGiverId);
    const allDone = guessersNeeded.every((id) => newGuesses[id]);

    await onUpdateGame({
      roundData: {
        ...game.roundData,
        guesses: newGuesses,
        phase: allDone ? 'reveal' : 'guess',
      },
    });
  }, [myGuess, guesses, currentUserId, playerIds, clueGiverId, game.roundData, onUpdateGame]);

  const handleNext = useCallback(async () => {
    const newScores = { ...totalScores };
    playerIds.forEach((id) => {
      if (!newScores[id]) newScores[id] = 0;
    });

    for (const [pid, guess] of Object.entries(guesses)) {
      const normalizedGuess = guess.trim().toLowerCase();
      const normalizedSecret = pair.secret.trim().toLowerCase();
      if (normalizedGuess === normalizedSecret) {
        newScores[pid] = (newScores[pid] || 0) + 15;
        newScores[clueGiverId] = (newScores[clueGiverId] || 0) + 5;
      }
    }

    const guessList = Object.values(guesses).map((g) => g.trim().toLowerCase());
    const counts: Record<string, number> = {};
    guessList.forEach((g) => (counts[g] = (counts[g] || 0) + 1));

    for (const [pid, guess] of Object.entries(guesses)) {
      const norm = guess.trim().toLowerCase();
      if (counts[norm] > 1) {
        newScores[pid] = (newScores[pid] || 0) + 5;
      }
    }

    if (round + 1 >= totalRounds) {
      onFinishGame(newScores);
    } else {
      setMyClue('');
      setMyGuess('');
      await onUpdateGame({
        roundData: {
          round: round + 1,
          phase: 'clue',
          clue: '',
          guesses: {},
          totalScores: newScores,
        },
      });
    }
  }, [totalScores, guesses, pair.secret, clueGiverId, round, totalRounds, playerIds, onUpdateGame, onFinishGame]);

  if (phase === 'clue') {
    return (
      <div className="page items-center justify-center gap-6">
        <h2 className="text-2xl font-bold">💡 מילה אחת</h2>
        <p className="text-shelter-muted text-sm">סיבוב {round + 1}/{totalRounds}</p>

        {isClueGiver ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full flex flex-col gap-4"
          >
            <div className="card text-center">
              <p className="text-shelter-muted text-sm">הקטגוריה: {pair.category}</p>
              <p className="text-3xl font-bold text-shelter-accent mt-2">{pair.secret}</p>
              <p className="text-shelter-muted text-sm mt-2">תנו רמז של מילה אחת!</p>
            </div>
            <input
              value={myClue}
              onChange={(e) => setMyClue(e.target.value)}
              placeholder="מילה אחת בלבד..."
              maxLength={20}
              className="text-center text-xl"
            />
            <button
              onClick={handleSubmitClue}
              disabled={!myClue.trim()}
              className="btn-primary disabled:opacity-40"
            >
              שליחת רמז
            </button>
          </motion.div>
        ) : (
          <div className="card text-center w-full">
            <p className="text-xl">{players[clueGiverId]?.avatar}</p>
            <p className="font-bold mt-1">{players[clueGiverId]?.name}</p>
            <p className="text-shelter-muted text-sm mt-2">חושב/ת על רמז...</p>
            <p className="text-shelter-muted text-xs mt-1">קטגוריה: {pair.category}</p>
          </div>
        )}
      </div>
    );
  }

  if (phase === 'guess') {
    const submitted = !!guesses[currentUserId];
    return (
      <div className="page items-center gap-6 pt-8">
        <h2 className="text-2xl font-bold">💡 מה המילה?</h2>
        <p className="text-shelter-muted text-sm">סיבוב {round + 1}/{totalRounds}</p>

        <div className="card w-full text-center">
          <p className="text-shelter-muted text-sm">
            {players[clueGiverId]?.avatar} {players[clueGiverId]?.name} נתן/ה רמז:
          </p>
          <p className="text-3xl font-bold text-shelter-gold mt-2">{clue}</p>
          <p className="text-shelter-muted text-xs mt-1">קטגוריה: {pair.category}</p>
        </div>

        {isClueGiver ? (
          <div className="card text-center w-full">
            <p className="text-shelter-muted">ממתינים לניחושים...</p>
            <p className="text-sm text-shelter-muted mt-2">
              ({Object.keys(guesses).length}/{playerIds.length - 1})
            </p>
          </div>
        ) : submitted ? (
          <div className="card text-center w-full">
            <p className="text-shelter-success">✓ הניחוש נשלח!</p>
            <p className="text-sm text-shelter-muted mt-2">
              ממתינים ({Object.keys(guesses).length}/{playerIds.length - 1})
            </p>
          </div>
        ) : (
          <div className="w-full flex flex-col gap-3">
            <input
              value={myGuess}
              onChange={(e) => setMyGuess(e.target.value)}
              placeholder="מה לדעתכם המילה הסודית?"
              maxLength={30}
              className="text-center text-xl"
            />
            <button
              onClick={handleSubmitGuess}
              disabled={!myGuess.trim()}
              className="btn-primary disabled:opacity-40"
            >
              ניחוש
            </button>
          </div>
        )}
      </div>
    );
  }

  if (phase === 'reveal') {
    return (
      <div className="page items-center gap-6 pt-8">
        <h2 className="text-2xl font-bold">💡 התשובה!</h2>

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring' }}
          className="card w-full text-center"
        >
          <p className="text-shelter-muted text-sm">המילה הסודית:</p>
          <p className="text-4xl font-black text-shelter-accent mt-2">{pair.secret}</p>
          <p className="text-shelter-muted text-sm mt-2">רמז: {clue}</p>
        </motion.div>

        <div className="w-full flex flex-col gap-2">
          {Object.entries(guesses).map(([pid, guess]) => {
            const correct = guess.trim().toLowerCase() === pair.secret.trim().toLowerCase();
            return (
              <motion.div
                key={pid}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={`card flex items-center gap-3 py-3 ${
                  correct ? 'ring-2 ring-shelter-success' : ''
                }`}
              >
                <span className="text-xl">{players[pid]?.avatar}</span>
                <span className="flex-1">{players[pid]?.name}</span>
                <span className={correct ? 'text-shelter-success font-bold' : 'text-shelter-muted'}>
                  {guess} {correct ? '✓' : '✗'}
                </span>
              </motion.div>
            );
          })}
        </div>

        <button onClick={handleNext} className="btn-primary w-full mt-4">
          {round + 1 >= totalRounds ? 'לתוצאות' : 'סיבוב הבא'}
        </button>
      </div>
    );
  }

  return null;
}

function hashCode(s: string): number {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = (hash << 5) - hash + s.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}
