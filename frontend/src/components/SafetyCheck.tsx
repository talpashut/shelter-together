import { motion } from 'framer-motion';

interface SafetyCheckProps {
  members: string[];
  memberProfiles: Record<string, { name: string; avatar: string }>;
  safeMembers: string[];
  currentUserId: string;
  isSafe: boolean;
  onMarkSafe: () => void;
}

export default function SafetyCheck({
  members,
  memberProfiles,
  safeMembers,
  currentUserId,
  isSafe,
  onMarkSafe,
}: SafetyCheckProps) {
  return (
    <div className="page items-center justify-center gap-6">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring' }}
        className="text-6xl"
      >
        🛡️
      </motion.div>

      <h2 className="text-2xl font-bold text-center">בדיקת בטיחות</h2>
      <p className="text-shelter-muted text-center">
        סמנו שאתם במקום בטוח כדי להתחיל לשחק
      </p>

      {!isSafe ? (
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onMarkSafe}
          className="bg-shelter-success text-shelter-bg font-bold text-xl py-4 px-8 rounded-2xl shadow-lg shadow-shelter-success/30"
        >
          ✓ אני במקום בטוח!
        </motion.button>
      ) : (
        <div className="bg-shelter-success/20 border border-shelter-success/40 rounded-2xl py-3 px-6">
          <p className="text-shelter-success font-bold text-center">✓ סימנתם שאתם בטוחים</p>
        </div>
      )}

      <div className="w-full card mt-4">
        <p className="text-sm text-shelter-muted mb-3">
          ממתינים לכולם ({safeMembers.length}/{members.length})
        </p>
        <div className="flex flex-col gap-2">
          {members.map((uid) => {
            const safe = safeMembers.includes(uid);
            const member = memberProfiles[uid];
            return (
              <div key={uid} className="flex items-center gap-3">
                <span className="text-xl">{member?.avatar || '👤'}</span>
                <span className={safe ? 'text-shelter-text' : 'text-shelter-muted'}>
                  {member?.name || 'משתמש'}
                </span>
                <span className="mr-auto text-sm">
                  {safe ? (
                    <span className="text-shelter-success">✓ בטוח</span>
                  ) : (
                    <span className="text-shelter-muted animate-pulse">ממתין...</span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
