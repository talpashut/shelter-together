import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameComponentProps } from '../lib/types';
import { BLUFF_FACTS } from './gameData';

type Phase = 'write' | 'vote' | 'reveal';

export default function Bluff({
  game,
  players,
  currentUserId,
  onUpdateGame,
  onFinishGame,
}: GameComponentProps) {
  const playerIds = useMemo(() => Object.keys(players), [players]);
  const [myFake, setMyFake] = useState('');
  const [myVote, setMyVote] = useState('');

  const phase: Phase = game.roundData.phase || 'write';
  const factIdx: number = game.roundData.factIdx ?? Math.abs(hashCode(game.id)) % BLUFF_FACTS.length;
  const fakeAnswers: Record<string, string> = game.roundData.fakeAnswers || {};
  const votes: Record<string, string> = game.roundData.votes || {};
  const fact = BLUFF_FACTS[factIdx % BLUFF_FACTS.length];

  const allAnswers = useMemo(() => {
    const entries: { id: string; text: string; isReal: boolean }[] = [
      { id: '__real__', text: fact.realAnswer, isReal: true },
      ...Object.entries(fakeAnswers).map(([uid, text]) => ({
        id: uid,
        text,
        isReal: false,
      })),
    ];
    const seed = hashCode(game.id + 'shuffle');
    return entries.sort((a, b) => hashCode(a.id + seed) - hashCode(b.id + seed));
  }, [fakeAnswers, fact.realAnswer, game.id]);

  const handleSubmitFake = useCallback(async () => {
    if (!myFake.trim()) return;
    const newFakes = { ...fakeAnswers, [currentUserId]: myFake.trim() };
    const allDone = Object.keys(newFakes).length === playerIds.length;
    await onUpdateGame({
      roundData: {
        ...game.roundData,
        fakeAnswers: newFakes,
        phase: allDone ? 'vote' : 'write',
        factIdx,
      },
    });
  }, [myFake, fakeAnswers, currentUserId, playerIds.length, game.roundData, factIdx, onUpdateGame]);

  const handleVote = useCallback(async () => {
    if (!myVote) return;
    const newVotes = { ...votes, [currentUserId]: myVote };
    const allDone = Object.keys(newVotes).length === playerIds.length;
    await onUpdateGame({
      roundData: {
        ...game.roundData,
        votes: newVotes,
        phase: allDone ? 'reveal' : 'vote',
      },
    });
  }, [myVote, votes, currentUserId, playerIds.length, game.roundData, onUpdateGame]);

  const handleFinish = useCallback(() => {
    const scores: Record<string, number> = {};
    playerIds.forEach((id) => (scores[id] = 0));

    for (const [voterId, votedFor] of Object.entries(votes)) {
      if (votedFor === '__real__') {
        scores[voterId] = (scores[voterId] || 0) + 15;
      } else if (votedFor !== voterId) {
        scores[votedFor] = (scores[votedFor] || 0) + 10;
      }
    }

    onFinishGame(scores);
  }, [votes, playerIds, onFinishGame]);

  if (phase === 'write') {
    const submitted = !!fakeAnswers[currentUserId];
    return (
      <div className="page gap-4 pt-8">
        <h2 className="text-2xl font-bold text-center">🃏 בלוף</h2>
        <div className="card text-center">
          <p className="text-shelter-muted text-sm">השאלה:</p>
          <p className="text-xl font-bold text-shelter-accent mt-2">{fact.question}</p>
        </div>

        {submitted ? (
          <div className="card text-center">
            <p className="text-shelter-success">✓ התשובה המזויפת שלכם נשלחה!</p>
            <p className="text-shelter-muted text-sm mt-2">
              ממתינים ({Object.keys(fakeAnswers).length}/{playerIds.length})
            </p>
          </div>
        ) : (
          <>
            <p className="text-shelter-muted text-center text-sm">
              כתבו תשובה מזויפת אבל משכנעת:
            </p>
            <textarea
              value={myFake}
              onChange={(e) => setMyFake(e.target.value)}
              placeholder="התשובה המזויפת שלכם..."
              className="min-h-[80px] resize-none"
              maxLength={150}
            />
            <button
              onClick={handleSubmitFake}
              disabled={!myFake.trim()}
              className="btn-primary disabled:opacity-40"
            >
              שליחה
            </button>
          </>
        )}
      </div>
    );
  }

  if (phase === 'vote') {
    const voted = !!votes[currentUserId];
    return (
      <div className="page gap-4 pt-8">
        <h2 className="text-2xl font-bold text-center">🃏 מה האמת?</h2>
        <div className="card text-center">
          <p className="text-shelter-accent font-bold">{fact.question}</p>
        </div>
        <p className="text-shelter-muted text-center text-sm">
          איזו תשובה היא האמיתית?
        </p>

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
              {allAnswers
                .filter((a) => a.id !== currentUserId)
                .map((a) => (
                  <button
                    key={a.id}
                    onClick={() => setMyVote(a.id)}
                    className={`card text-right py-3 transition-all ${
                      myVote === a.id ? 'ring-2 ring-shelter-accent' : ''
                    }`}
                  >
                    {a.text}
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
      <div className="page gap-4 pt-8 items-center">
        <h2 className="text-2xl font-bold">🃏 החשיפה!</h2>
        <div className="card w-full text-center">
          <p className="text-shelter-muted text-sm">השאלה:</p>
          <p className="font-bold text-shelter-accent">{fact.question}</p>
        </div>

        <div className="w-full flex flex-col gap-2">
          {allAnswers.map((a) => {
            const voterCount = Object.values(votes).filter((v) => v === a.id).length;
            return (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`card ${
                  a.isReal
                    ? 'ring-2 ring-shelter-success bg-shelter-success/10'
                    : 'bg-shelter-card'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="font-medium">{a.text}</p>
                    {a.isReal ? (
                      <p className="text-shelter-success text-sm mt-1">✓ התשובה האמיתית!</p>
                    ) : (
                      <p className="text-shelter-muted text-sm mt-1">
                        מזויף על ידי {players[a.id]?.avatar} {players[a.id]?.name}
                      </p>
                    )}
                  </div>
                  {voterCount > 0 && (
                    <span className="bg-shelter-surface text-sm py-1 px-2 rounded-full">
                      {voterCount} 🗳️
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        <button onClick={handleFinish} className="btn-primary w-full mt-4">
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
