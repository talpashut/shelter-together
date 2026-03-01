import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameComponentProps } from '../lib/types';
import { VOTE_PROMPTS } from './gameData';

type Phase = 'vote' | 'reveal' | 'next';

export default function TheVote({
  game,
  players,
  currentUserId,
  onUpdateGame,
  onFinishGame,
}: GameComponentProps) {
  const playerIds = useMemo(() => Object.keys(players), [players]);
  const [myVote, setMyVote] = useState('');

  const round: number = game.roundData.round ?? 0;
  const phase: Phase = game.roundData.phase || 'vote';
  const votes: Record<string, string> = game.roundData.votes || {};
  const totalRounds = Math.min(5, VOTE_PROMPTS.length);
  const roundHistory: number[] = game.roundData.roundHistory || [];

  const promptIdx = useMemo(() => {
    if (roundHistory[round] !== undefined) return roundHistory[round];
    return Math.abs(hashCode(game.id + round)) % VOTE_PROMPTS.length;
  }, [game.id, round, roundHistory]);

  const prompt = VOTE_PROMPTS[promptIdx];

  const handleVote = useCallback(async () => {
    if (!myVote) return;
    const newVotes = { ...votes, [currentUserId]: myVote };
    const allDone = Object.keys(newVotes).length === playerIds.length;
    await onUpdateGame({
      roundData: {
        ...game.roundData,
        votes: newVotes,
        phase: allDone ? 'reveal' : 'vote',
        round,
        roundHistory:
          roundHistory.length <= round
            ? [...roundHistory, promptIdx]
            : roundHistory,
      },
    });
  }, [myVote, votes, currentUserId, playerIds.length, game.roundData, round, roundHistory, promptIdx, onUpdateGame]);

  const handleNext = useCallback(async () => {
    if (round + 1 >= totalRounds) {
      const scores: Record<string, number> = {};
      playerIds.forEach((id) => (scores[id] = 10));
      onFinishGame(scores);
      return;
    }

    setMyVote('');
    await onUpdateGame({
      roundData: {
        ...game.roundData,
        round: round + 1,
        votes: {},
        phase: 'vote',
      },
    });
  }, [round, totalRounds, playerIds, game.roundData, onUpdateGame, onFinishGame]);

  const voteCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const v of Object.values(votes)) {
      counts[v] = (counts[v] || 0) + 1;
    }
    return counts;
  }, [votes]);

  const winner = useMemo(() => {
    const sorted = Object.entries(voteCounts).sort(([, a], [, b]) => b - a);
    return sorted[0]?.[0];
  }, [voteCounts]);

  if (phase === 'vote') {
    const voted = !!votes[currentUserId];
    return (
      <div className="page gap-4 pt-8">
        <div className="text-center">
          <p className="text-shelter-muted text-sm">סיבוב {round + 1}/{totalRounds}</p>
          <h2 className="text-xl font-bold mt-1">🗳️ הצבעה</h2>
        </div>

        <motion.div
          key={round}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card text-center"
        >
          <p className="text-xl font-bold text-shelter-accent">{prompt}</p>
        </motion.div>

        {voted ? (
          <div className="card text-center">
            <p className="text-shelter-success">✓ הצבעתם!</p>
            <p className="text-shelter-muted text-sm mt-2">
              ממתינים ({Object.keys(votes).length}/{playerIds.length})
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-2">
              {playerIds.map((id) => (
                <button
                  key={id}
                  onClick={() => setMyVote(id)}
                  className={`card flex items-center gap-3 py-3 ${
                    myVote === id ? 'ring-2 ring-shelter-accent' : ''
                  }`}
                >
                  <span className="text-2xl">{players[id]?.avatar}</span>
                  <span className="font-medium">{players[id]?.name}</span>
                </button>
              ))}
            </div>
            <button
              onClick={handleVote}
              disabled={!myVote}
              className="btn-primary disabled:opacity-40"
            >
              הצבעה
            </button>
          </>
        )}
      </div>
    );
  }

  if (phase === 'reveal') {
    return (
      <div className="page items-center justify-center gap-6">
        <p className="text-shelter-muted text-sm">סיבוב {round + 1}/{totalRounds}</p>
        <div className="card w-full text-center">
          <p className="text-shelter-accent font-bold">{prompt}</p>
        </div>

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="flex flex-col items-center gap-2"
        >
          <span className="text-6xl">{players[winner]?.avatar}</span>
          <span className="text-2xl font-bold text-shelter-gold">{players[winner]?.name}</span>
          <span className="text-shelter-muted">{voteCounts[winner]} קולות</span>
        </motion.div>

        <div className="w-full flex flex-col gap-2">
          {playerIds
            .sort((a, b) => (voteCounts[b] || 0) - (voteCounts[a] || 0))
            .map((id) => (
              <div key={id} className="flex items-center gap-3 px-2">
                <span>{players[id]?.avatar}</span>
                <span className="flex-1 text-sm">{players[id]?.name}</span>
                <div className="flex-1 bg-shelter-surface rounded-full h-4 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: `${((voteCounts[id] || 0) / playerIds.length) * 100}%`,
                    }}
                    transition={{ duration: 0.5 }}
                    className="h-full bg-shelter-accent rounded-full"
                  />
                </div>
                <span className="text-sm text-shelter-muted w-6 text-center">
                  {voteCounts[id] || 0}
                </span>
              </div>
            ))}
        </div>

        <button onClick={handleNext} className="btn-primary w-full mt-4">
          {round + 1 >= totalRounds ? 'סיום' : 'סיבוב הבא'}
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
