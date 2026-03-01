import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameComponentProps } from '../lib/types';
import { SECRET_AGENT_LOCATIONS } from './gameData';
import Timer from '../components/Timer';

type Phase = 'assign' | 'discuss' | 'vote' | 'reveal';

export default function SecretAgent({
  game,
  players,
  currentUserId,
  onUpdateGame,
  onFinishGame,
}: GameComponentProps) {
  const playerIds = useMemo(() => Object.keys(players), [players]);
  const [vote, setVote] = useState('');

  const phase: Phase = game.roundData.phase || 'assign';
  const location: string = game.roundData.location || '';
  const spyId: string = game.roundData.spyId || '';
  const votes: Record<string, string> = game.roundData.votes || {};
  const spyGuess: string = game.roundData.spyGuess || '';

  const initGame = useCallback(async () => {
    const locIdx = Math.abs(hashCode(game.id)) % SECRET_AGENT_LOCATIONS.length;
    const spyIdx = Math.abs(hashCode(game.id + 'spy')) % playerIds.length;
    await onUpdateGame({
      roundData: {
        phase: 'discuss',
        location: SECRET_AGENT_LOCATIONS[locIdx],
        spyId: playerIds[spyIdx],
        votes: {},
        spyGuess: '',
      },
    });
  }, [game.id, playerIds, onUpdateGame]);

  if (phase === 'assign') {
    return (
      <div className="page items-center justify-center gap-4">
        <p className="text-shelter-muted">מכין את המשחק...</p>
        <button onClick={initGame} className="btn-primary">
          התחלה!
        </button>
      </div>
    );
  }

  const isSpy = currentUserId === spyId;

  const handleVote = useCallback(async () => {
    if (!vote) return;
    const newVotes = { ...votes, [currentUserId]: vote };
    const allVoted = Object.keys(newVotes).length === playerIds.length;
    await onUpdateGame({
      roundData: {
        ...game.roundData,
        votes: newVotes,
        phase: allVoted ? 'reveal' : 'vote',
      },
    });
  }, [vote, votes, currentUserId, playerIds.length, game.roundData, onUpdateGame]);

  const handleTimeUp = useCallback(async () => {
    await onUpdateGame({
      roundData: { ...game.roundData, phase: 'vote' },
    });
  }, [game.roundData, onUpdateGame]);

  const handleRevealFinish = useCallback(() => {
    const voteCounts: Record<string, number> = {};
    for (const v of Object.values(votes)) {
      voteCounts[v] = (voteCounts[v] || 0) + 1;
    }
    const mostVoted = Object.entries(voteCounts).sort(([, a], [, b]) => b - a)[0]?.[0];
    const spyCaught = mostVoted === spyId;

    const scores: Record<string, number> = {};
    playerIds.forEach((id) => {
      if (id === spyId) {
        scores[id] = spyCaught ? 0 : 20;
      } else {
        scores[id] = spyCaught ? 15 : 0;
        if (votes[id] === spyId) scores[id] += 5;
      }
    });

    onFinishGame(scores);
  }, [votes, spyId, playerIds, onFinishGame]);

  if (phase === 'discuss') {
    return (
      <div className="page items-center gap-6 pt-8">
        <h2 className="text-2xl font-bold">🕵️ הסוכן הסודי</h2>

        <div className="card w-full text-center">
          {isSpy ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <p className="text-shelter-accent text-xl font-bold">אתם המרגל! 🕵️</p>
              <p className="text-shelter-muted mt-2">
                נסו להבין מה המיקום בלי להיחשף
              </p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <p className="text-shelter-muted text-sm">המיקום הסודי:</p>
              <p className="text-3xl font-bold text-shelter-accent mt-2">{location}</p>
              <p className="text-shelter-muted text-sm mt-2">מצאו את המרגל!</p>
            </motion.div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Timer seconds={120} onTimeUp={handleTimeUp} size="lg" danger={15} />
          <div>
            <p className="font-bold">דיון פתוח</p>
            <p className="text-shelter-muted text-sm">שאלו שאלות כדי לזהות את המרגל</p>
          </div>
        </div>

        <button onClick={handleTimeUp} className="btn-secondary mt-auto">
          עוברים להצבעה
        </button>
      </div>
    );
  }

  if (phase === 'vote') {
    const voted = !!votes[currentUserId];
    return (
      <div className="page gap-4 pt-8">
        <h2 className="text-2xl font-bold text-center">🗳️ מי המרגל?</h2>
        <p className="text-shelter-muted text-center">הצביעו למי שלדעתכם המרגל</p>

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
              {playerIds
                .filter((id) => id !== currentUserId)
                .map((id) => (
                  <button
                    key={id}
                    onClick={() => setVote(id)}
                    className={`card flex items-center gap-3 py-3 ${
                      vote === id ? 'ring-2 ring-shelter-accent' : ''
                    }`}
                  >
                    <span className="text-2xl">{players[id]?.avatar}</span>
                    <span className="font-medium">{players[id]?.name}</span>
                  </button>
                ))}
            </div>
            <button
              onClick={handleVote}
              disabled={!vote}
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
    const voteCounts: Record<string, number> = {};
    for (const v of Object.values(votes)) {
      voteCounts[v] = (voteCounts[v] || 0) + 1;
    }
    const mostVoted = Object.entries(voteCounts).sort(([, a], [, b]) => b - a)[0]?.[0];
    const caught = mostVoted === spyId;

    return (
      <div className="page items-center justify-center gap-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring' }}
          className="text-6xl"
        >
          {caught ? '🎉' : '😈'}
        </motion.div>

        <h2 className="text-2xl font-bold text-center">
          {caught ? 'המרגל נתפס!' : 'המרגל ניצח!'}
        </h2>

        <div className="card w-full text-center">
          <p className="text-shelter-muted text-sm">המרגל היה:</p>
          <p className="text-3xl mt-2">{players[spyId]?.avatar}</p>
          <p className="text-xl font-bold text-shelter-accent">{players[spyId]?.name}</p>
          <p className="text-shelter-muted text-sm mt-3">המיקום היה: <span className="text-shelter-text">{location}</span></p>
        </div>

        <button onClick={handleRevealFinish} className="btn-primary w-full">
          לתוצאות
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
