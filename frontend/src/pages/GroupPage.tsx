import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthContext } from '../lib/AuthContext';
import { useGroupById } from '../hooks/useGroup';
import { useSiren } from '../hooks/useSiren';
import { createSession } from '../hooks/useSession';

export default function GroupPage() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuthContext();
  const { group, loading } = useGroupById(groupId);
  const { isActive: sirenActive } = useSiren(profile?.city);
  const [starting, setStarting] = useState(false);
  const [copied, setCopied] = useState(false);

  if (loading) {
    return (
      <div className="page items-center justify-center">
        <p className="text-shelter-muted">טוען קבוצה...</p>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="page items-center justify-center">
        <p className="text-shelter-muted">הקבוצה לא נמצאה</p>
        <button onClick={() => navigate('/')} className="btn-secondary mt-4">
          חזרה הביתה
        </button>
      </div>
    );
  }

  const handleStartSession = async () => {
    setStarting(true);
    try {
      const sessionId = await createSession(group);
      navigate(`/session/${sessionId}`);
    } catch (e) {
      console.error(e);
    }
    setStarting(false);
  };

  const handleGoToSession = () => {
    if (group.currentSession) {
      navigate(`/session/${group.currentSession}`);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(group.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="page gap-4">
      <button onClick={() => navigate('/')} className="text-shelter-muted text-sm self-start mb-2">
        → חזרה לקבוצות
      </button>

      <div className="card text-center">
        <h1 className="text-2xl font-bold mb-2">{group.name}</h1>
        <button
          onClick={copyCode}
          className="inline-flex items-center gap-2 bg-shelter-surface px-4 py-2 rounded-xl"
        >
          <span className="font-mono text-xl tracking-widest text-shelter-accent">
            {group.code}
          </span>
          <span className="text-shelter-muted text-sm">
            {copied ? '✓ הועתק!' : 'העתקת קוד'}
          </span>
        </button>
      </div>

      <section>
        <h2 className="text-lg font-bold mb-3">
          חברי הקבוצה ({group.members.length})
        </h2>
        <div className="flex flex-col gap-2">
          {group.members.map((uid) => {
            const member = group.memberProfiles?.[uid];
            return (
              <motion.div
                key={uid}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="card flex items-center gap-3 py-3"
              >
                <span className="text-2xl">{member?.avatar || '👤'}</span>
                <span className="font-medium">{member?.name || 'משתמש'}</span>
                {uid === group.createdBy && (
                  <span className="text-xs bg-shelter-gold/20 text-shelter-gold py-0.5 px-2 rounded-full mr-auto">
                    מנהל
                  </span>
                )}
              </motion.div>
            );
          })}
        </div>
      </section>

      <div className="mt-auto flex flex-col gap-3 pt-4">
        {sirenActive && (
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="bg-red-900/30 border border-red-500/40 rounded-2xl p-3 text-center"
          >
            <p className="text-red-400 font-bold">🚨 אזעקה פעילה — הזמן לשחק!</p>
          </motion.div>
        )}

        {group.currentSession ? (
          <button onClick={handleGoToSession} className="btn-primary text-xl">
            🎮 הצטרפות למשחק הפעיל
          </button>
        ) : (
          <button
            onClick={handleStartSession}
            disabled={starting || group.members.length < 2}
            className="btn-primary text-xl disabled:opacity-40"
          >
            {starting ? 'מתחיל...' : '🎮 התחלת משחק'}
          </button>
        )}

        {group.members.length < 2 && (
          <p className="text-shelter-muted text-sm text-center">
            צריך לפחות 2 שחקנים כדי להתחיל — שתפו את הקוד!
          </p>
        )}
      </div>
    </div>
  );
}
