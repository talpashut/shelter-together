import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { GameComponentProps } from '../lib/types';
import { DRAW_WORDS } from './gameData';
import DrawingCanvas from '../components/DrawingCanvas';
import Timer from '../components/Timer';

export default function DrawAndGuess({
  game,
  players,
  currentUserId,
  onUpdateGame,
  onFinishGame,
}: GameComponentProps) {
  const playerIds = useMemo(() => Object.keys(players), [players]);
  const [guess, setGuess] = useState('');

  const round: number = game.roundData.round ?? 0;
  const drawerId: string = game.roundData.drawerId || playerIds[0];
  const word: string = game.roundData.word || '';
  const paths: number[][][] = game.roundData.paths || [];
  const correctGuessers: string[] = game.roundData.correctGuessers || [];
  const roundScores: Record<string, number> = game.roundData.roundScores || {};
  const totalRounds = Math.min(playerIds.length, 4);
  const roundActive: boolean = game.roundData.roundActive ?? false;

  const isDrawer = currentUserId === drawerId;
  const hasGuessed = correctGuessers.includes(currentUserId);

  const initRound = useCallback(async (roundNum: number) => {
    const drawerIdx = roundNum % playerIds.length;
    const wordIdx = Math.abs(hashCode(game.id + roundNum)) % DRAW_WORDS.length;
    await onUpdateGame({
      roundData: {
        ...game.roundData,
        round: roundNum,
        drawerId: playerIds[drawerIdx],
        word: DRAW_WORDS[wordIdx],
        paths: [],
        correctGuessers: [],
        roundActive: true,
      },
    });
  }, [game.id, game.roundData, playerIds, onUpdateGame]);

  const handlePathsChange = useCallback(async (newPaths: number[][][]) => {
    await onUpdateGame({
      roundData: { ...game.roundData, paths: newPaths },
    });
  }, [game.roundData, onUpdateGame]);

  const handleGuess = useCallback(async () => {
    if (!guess.trim()) return;
    const normalized = guess.trim().replace(/[^\u0590-\u05FF\s]/g, '');
    if (normalized === word || guess.trim() === word) {
      const points = Math.max(30 - correctGuessers.length * 5, 10);
      const newCorrect = [...correctGuessers, currentUserId];
      const newScores = { ...roundScores };
      newScores[currentUserId] = (newScores[currentUserId] || 0) + points;
      newScores[drawerId] = (newScores[drawerId] || 0) + 5;

      const allGuessed = newCorrect.length >= playerIds.length - 1;
      await onUpdateGame({
        roundData: {
          ...game.roundData,
          correctGuessers: newCorrect,
          roundScores: newScores,
          roundActive: !allGuessed,
        },
      });
    }
    setGuess('');
  }, [guess, word, correctGuessers, roundScores, currentUserId, drawerId, playerIds.length, game.roundData, onUpdateGame]);

  const handleTimeUp = useCallback(async () => {
    await onUpdateGame({
      roundData: { ...game.roundData, roundActive: false },
    });
  }, [game.roundData, onUpdateGame]);

  const handleNextRound = useCallback(async () => {
    if (round + 1 >= totalRounds) {
      onFinishGame(roundScores);
    } else {
      await initRound(round + 1);
    }
  }, [round, totalRounds, roundScores, initRound, onFinishGame]);

  if (!roundActive && round === 0 && !word) {
    return (
      <div className="page items-center justify-center gap-4">
        <div className="text-5xl">🎨</div>
        <h2 className="text-2xl font-bold">ציור וניחוש</h2>
        <button onClick={() => initRound(0)} className="btn-primary">
          התחלה!
        </button>
      </div>
    );
  }

  if (!roundActive && word) {
    return (
      <div className="page items-center justify-center gap-6">
        <h3 className="text-xl font-bold">סיבוב {round + 1} הסתיים!</h3>
        <div className="card w-full text-center">
          <p className="text-shelter-muted text-sm">המילה הייתה:</p>
          <p className="text-3xl font-bold text-shelter-accent">{word}</p>
          <p className="text-shelter-muted text-sm mt-2">
            {correctGuessers.length} שחקנים ניחשו נכון
          </p>
        </div>
        <button onClick={handleNextRound} className="btn-primary">
          {round + 1 >= totalRounds ? 'לתוצאות' : 'סיבוב הבא'}
        </button>
      </div>
    );
  }

  return (
    <div className="page gap-3 pt-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold">
          סיבוב {round + 1}/{totalRounds}
        </h3>
        <Timer seconds={60} onTimeUp={handleTimeUp} size="sm" />
      </div>

      <div className="text-center text-sm text-shelter-muted">
        {players[drawerId]?.avatar} {players[drawerId]?.name} מצייר/ת
      </div>

      {isDrawer && (
        <div className="bg-shelter-accent/10 border border-shelter-accent/30 rounded-xl p-3 text-center">
          <p className="text-sm text-shelter-muted">ציירו את:</p>
          <p className="text-2xl font-bold text-shelter-accent">{word}</p>
        </div>
      )}

      <DrawingCanvas
        paths={paths}
        onPathsChange={isDrawer ? handlePathsChange : undefined}
        disabled={!isDrawer}
      />

      {!isDrawer && (
        <div className="flex gap-2">
          {hasGuessed ? (
            <div className="flex-1 text-center py-3 text-shelter-success font-bold">
              ✓ ניחשתם נכון!
            </div>
          ) : (
            <>
              <input
                value={guess}
                onChange={(e) => setGuess(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGuess()}
                placeholder="מה מציירים?"
                className="flex-1"
              />
              <button onClick={handleGuess} className="btn-primary px-4">
                ניחוש
              </button>
            </>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2 mt-2">
        {playerIds.filter(id => id !== drawerId).map((id) => (
          <span
            key={id}
            className={`text-xs py-1 px-2 rounded-full ${
              correctGuessers.includes(id)
                ? 'bg-shelter-success/20 text-shelter-success'
                : 'bg-shelter-surface text-shelter-muted'
            }`}
          >
            {players[id]?.avatar} {players[id]?.name}
            {correctGuessers.includes(id) && ' ✓'}
          </span>
        ))}
      </div>
    </div>
  );
}

function hashCode(s: string): number {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = (hash << 5) - hash + s.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}
