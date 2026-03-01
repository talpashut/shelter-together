import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { GameComponentProps } from '../lib/types';
import { CATEGORIES_LIST, HEBREW_LETTERS } from './gameData';
import Timer from '../components/Timer';

type Phase = 'fill' | 'score';

export default function Categories({
  game,
  players,
  currentUserId,
  onUpdateGame,
  onFinishGame,
}: GameComponentProps) {
  const playerIds = useMemo(() => Object.keys(players), [players]);

  const letter = useMemo(() => {
    const idx = Math.abs(hashCode(game.id)) % HEBREW_LETTERS.length;
    return HEBREW_LETTERS[idx];
  }, [game.id]);

  const categories = useMemo(() => {
    const shuffled = [...CATEGORIES_LIST].sort(
      (a, b) => hashCode(a + game.id) - hashCode(b + game.id)
    );
    return shuffled.slice(0, 5);
  }, [game.id]);

  const phase: Phase = game.roundData.phase || 'fill';
  const submissions: Record<string, Record<string, string>> = game.roundData.submissions || {};
  const [myAnswers, setMyAnswers] = useState<Record<string, string>>({});

  const handleSubmit = useCallback(async () => {
    const newSubmissions = { ...submissions, [currentUserId]: myAnswers };
    const allDone = Object.keys(newSubmissions).length === playerIds.length;
    await onUpdateGame({
      roundData: {
        ...game.roundData,
        submissions: newSubmissions,
        phase: allDone ? 'score' : 'fill',
      },
    });
  }, [myAnswers, submissions, currentUserId, playerIds.length, game.roundData, onUpdateGame]);

  const handleTimeUp = useCallback(async () => {
    const newSubmissions = { ...submissions };
    if (!newSubmissions[currentUserId]) {
      newSubmissions[currentUserId] = myAnswers;
    }
    await onUpdateGame({
      roundData: {
        ...game.roundData,
        submissions: newSubmissions,
        phase: 'score',
      },
    });
  }, [submissions, currentUserId, myAnswers, game.roundData, onUpdateGame]);

  const handleFinish = useCallback(() => {
    const scores: Record<string, number> = {};
    playerIds.forEach((id) => (scores[id] = 0));

    for (const cat of categories) {
      const answersByPlayer: Record<string, string> = {};
      for (const [pid, answers] of Object.entries(submissions)) {
        answersByPlayer[pid] = (answers[cat] || '').trim().toLowerCase();
      }

      const answerCounts: Record<string, number> = {};
      for (const ans of Object.values(answersByPlayer)) {
        if (ans) answerCounts[ans] = (answerCounts[ans] || 0) + 1;
      }

      for (const [pid, ans] of Object.entries(answersByPlayer)) {
        if (!ans) continue;
        if (answerCounts[ans] === 1) {
          scores[pid] += 2;
        } else {
          scores[pid] += 1;
        }
      }
    }

    onFinishGame(scores);
  }, [categories, submissions, playerIds, onFinishGame]);

  if (phase === 'fill') {
    const submitted = !!submissions[currentUserId];
    return (
      <div className="page gap-4 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">📝 קטגוריות</h2>
          {!submitted && <Timer seconds={30} onTimeUp={handleTimeUp} size="sm" danger={10} />}
        </div>

        <div className="card text-center">
          <p className="text-shelter-muted text-sm">האות:</p>
          <p className="text-5xl font-black text-shelter-accent">{letter}</p>
        </div>

        {submitted ? (
          <div className="card text-center">
            <p className="text-shelter-success">✓ התשובות נשלחו!</p>
            <p className="text-shelter-muted text-sm mt-2">
              ממתינים ({Object.keys(submissions).length}/{playerIds.length})
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-3">
              {categories.map((cat) => (
                <div key={cat}>
                  <label className="text-shelter-muted text-sm">{cat}</label>
                  <input
                    value={myAnswers[cat] || ''}
                    onChange={(e) =>
                      setMyAnswers((prev) => ({ ...prev, [cat]: e.target.value }))
                    }
                    placeholder={`${cat} שמתחיל ב-${letter}...`}
                    maxLength={30}
                  />
                </div>
              ))}
            </div>
            <button onClick={handleSubmit} className="btn-primary">
              שליחה
            </button>
          </>
        )}
      </div>
    );
  }

  if (phase === 'score') {
    return (
      <div className="page gap-4 pt-6">
        <h2 className="text-xl font-bold text-center">📝 תשובות — אות {letter}</h2>

        {categories.map((cat) => (
          <div key={cat} className="card">
            <p className="font-bold text-shelter-accent mb-2">{cat}</p>
            <div className="flex flex-col gap-1">
              {playerIds.map((pid) => {
                const ans = submissions[pid]?.[cat] || '—';
                const allAnswers = playerIds.map(
                  (p) => (submissions[p]?.[cat] || '').trim().toLowerCase()
                );
                const isUnique =
                  ans !== '—' &&
                  allAnswers.filter((a) => a === ans.trim().toLowerCase()).length === 1;

                return (
                  <div key={pid} className="flex items-center gap-2 text-sm">
                    <span>{players[pid]?.avatar}</span>
                    <span className="flex-1">{ans}</span>
                    {ans !== '—' && (
                      <span className={isUnique ? 'text-shelter-gold' : 'text-shelter-muted'}>
                        {isUnique ? '+2' : '+1'}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <button onClick={handleFinish} className="btn-primary">
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
