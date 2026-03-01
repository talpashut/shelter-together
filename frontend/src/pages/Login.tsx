import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthContext } from '../lib/AuthContext';
import { ISRAEL_CITIES, AVATAR_EMOJIS } from '../lib/israelCities';

export default function Login() {
  const { createProfile } = useAuthContext();
  const [step, setStep] = useState<'welcome' | 'profile'>('welcome');
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [avatar, setAvatar] = useState('😊');
  const [citySearch, setCitySearch] = useState('');

  const handleCreateProfile = async () => {
    if (!name.trim() || !city) return;
    await createProfile(name.trim(), city, avatar);
  };

  const filteredCities = citySearch.length >= 1
    ? ISRAEL_CITIES.filter((c) => c.includes(citySearch)).slice(0, 50)
    : [];

  return (
    <div className="page items-center justify-center gap-6">
      <AnimatePresence mode="wait">
        {step === 'welcome' ? (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center gap-6 w-full"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="text-7xl"
            >
              🏠
            </motion.div>

            <h1 className="text-4xl font-black text-center leading-tight">
              מקלט ביחד
            </h1>
            <p className="text-shelter-muted text-center text-lg max-w-xs">
              משחקים קבוצתיים למקלט — כי ביחד הכל יותר קל
            </p>

            <button
              onClick={() => setStep('profile')}
              className="btn-primary w-full max-w-xs text-xl mt-4"
            >
              יאללה, בואו נתחיל!
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="profile"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col gap-5 w-full"
          >
            <h2 className="text-2xl font-bold text-center">צרו פרופיל</h2>

            <div>
              <label className="text-shelter-muted text-sm mb-1 block">בחרו אווטאר</label>
              <div className="flex flex-wrap gap-2 justify-center">
                {AVATAR_EMOJIS.map((e) => (
                  <button
                    key={e}
                    onClick={() => setAvatar(e)}
                    className={`text-3xl p-2 rounded-xl transition-all ${
                      avatar === e
                        ? 'bg-shelter-accent/30 ring-2 ring-shelter-accent scale-110'
                        : 'hover:bg-shelter-card'
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-shelter-muted text-sm mb-1 block">שם</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="איך קוראים לכם?"
                maxLength={20}
              />
            </div>

            <div>
              <label className="text-shelter-muted text-sm mb-1 block">עיר (לקבלת התראות רלוונטיות)</label>
              <input
                value={citySearch}
                onChange={(e) => setCitySearch(e.target.value)}
                placeholder="חפשו יישוב..."
                className="mb-2"
              />
              <div className="max-h-40 overflow-y-auto card p-2 flex flex-wrap gap-1">
                {filteredCities.length === 0 && !city && (
                  <p className="text-shelter-muted text-sm text-center w-full py-2">
                    התחילו להקליד כדי לחפש יישוב...
                  </p>
                )}
                {filteredCities.map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      setCity(c);
                      setCitySearch(c);
                    }}
                    className={`text-sm py-1 px-3 rounded-full transition-all ${
                      city === c
                        ? 'bg-shelter-accent text-white'
                        : 'bg-shelter-surface hover:bg-shelter-border text-shelter-muted'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleCreateProfile}
              disabled={!name.trim() || !city}
              className="btn-primary text-xl mt-2 disabled:opacity-40"
            >
              כניסה 🚀
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
