import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthContext } from '../lib/AuthContext';
import { useGroup } from '../hooks/useGroup';
import { useSiren } from '../hooks/useSiren';

export default function Home() {
  const { profile, logout } = useAuthContext();
  const { groups, createGroup, joinGroup } = useGroup(profile);
  const { isActive: sirenActive } = useSiren(profile?.city);
  const navigate = useNavigate();

  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!groupName.trim()) return;
    setLoading(true);
    try {
      const id = await createGroup(groupName.trim());
      setShowCreate(false);
      setGroupName('');
      navigate(`/group/${id}`);
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  const handleJoin = async () => {
    if (!joinCode.trim()) return;
    setLoading(true);
    setError('');
    try {
      const id = await joinGroup(joinCode.trim());
      setShowJoin(false);
      setJoinCode('');
      navigate(`/group/${id}`);
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  return (
    <div className="page gap-4">
      <header className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{profile?.avatar}</span>
          <div>
            <h1 className="text-xl font-bold">שלום, {profile?.name}!</h1>
            <p className="text-shelter-muted text-sm">{profile?.city}</p>
          </div>
        </div>
        <button onClick={logout} className="text-shelter-muted text-sm hover:text-shelter-accent">
          יציאה
        </button>
      </header>

      {sirenActive && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-red-900/40 border border-red-500/50 rounded-2xl p-4 text-center"
        >
          <p className="text-red-400 font-bold text-lg">🚨 אזעקה פעילה!</p>
          <p className="text-red-300 text-sm mt-1">היכנסו לקבוצה כדי להתחיל לשחק</p>
        </motion.div>
      )}

      <section className="flex-1">
        <h2 className="text-lg font-bold mb-3">הקבוצות שלי</h2>

        {groups.length === 0 ? (
          <div className="card text-center py-10">
            <p className="text-4xl mb-3">👥</p>
            <p className="text-shelter-muted">עדיין אין קבוצות</p>
            <p className="text-shelter-muted text-sm">צרו קבוצה חדשה או הצטרפו עם קוד</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {groups.map((g) => (
              <motion.button
                key={g.id}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate(`/group/${g.id}`)}
                className="card flex items-center gap-4 text-right w-full"
              >
                <div className="w-12 h-12 rounded-full bg-shelter-accent/20 flex items-center justify-center text-xl">
                  👥
                </div>
                <div className="flex-1">
                  <p className="font-bold">{g.name}</p>
                  <p className="text-shelter-muted text-sm">
                    {g.members.length} משתתפים · קוד: {g.code}
                  </p>
                </div>
                {g.currentSession && (
                  <span className="bg-shelter-accent/20 text-shelter-accent text-xs py-1 px-2 rounded-full">
                    פעיל
                  </span>
                )}
              </motion.button>
            ))}
          </div>
        )}
      </section>

      <div className="flex gap-3 mt-4">
        <button onClick={() => setShowCreate(true)} className="btn-primary flex-1">
          קבוצה חדשה
        </button>
        <button onClick={() => setShowJoin(true)} className="btn-secondary flex-1">
          הצטרפות בקוד
        </button>
      </div>

      <AnimatePresence>
        {(showCreate || showJoin) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center p-4"
            onClick={() => { setShowCreate(false); setShowJoin(false); setError(''); }}
          >
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              onClick={(e) => e.stopPropagation()}
              className="card w-full max-w-lg pb-8"
            >
              {showCreate ? (
                <>
                  <h3 className="text-xl font-bold mb-4">יצירת קבוצה חדשה</h3>
                  <input
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder='למשל: "משפחת כהן" או "השכנים"'
                    maxLength={30}
                    autoFocus
                  />
                  <button
                    onClick={handleCreate}
                    disabled={loading || !groupName.trim()}
                    className="btn-primary w-full mt-4 disabled:opacity-40"
                  >
                    {loading ? 'יוצר...' : 'צור קבוצה'}
                  </button>
                </>
              ) : (
                <>
                  <h3 className="text-xl font-bold mb-4">הצטרפות לקבוצה</h3>
                  <input
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="הכניסו קוד בן 6 תווים"
                    maxLength={6}
                    className="text-center text-2xl tracking-widest font-mono"
                    autoFocus
                  />
                  {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
                  <button
                    onClick={handleJoin}
                    disabled={loading || joinCode.length !== 6}
                    className="btn-primary w-full mt-4 disabled:opacity-40"
                  >
                    {loading ? 'מצטרף...' : 'הצטרף'}
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
