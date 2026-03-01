import { useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAuthContext } from '../lib/AuthContext';
import { useSession } from '../hooks/useSession';
import { useGroupById } from '../hooks/useGroup';
import { GAME_DEFINITIONS } from '../lib/gameDefinitions';
import { GameType, GameComponentProps } from '../lib/types';
import SafetyCheck from '../components/SafetyCheck';
import GameIntro from '../components/GameIntro';
import GameRules from '../components/GameRules';
import Scoreboard from '../components/Scoreboard';
import WhoSaidIt from '../games/WhoSaidIt';
import SecretAgent from '../games/SecretAgent';
import DrawAndGuess from '../games/DrawAndGuess';
import BoomTrivia from '../games/BoomTrivia';
import Bluff from '../games/Bluff';
import Categories from '../games/Categories';
import TheVote from '../games/TheVote';
import OneWord from '../games/OneWord';

const GAME_COMPONENTS: Record<GameType, React.ComponentType<GameComponentProps>> = {
  'who-said-it': WhoSaidIt,
  'secret-agent': SecretAgent,
  'draw-and-guess': DrawAndGuess,
  'boom-trivia': BoomTrivia,
  'bluff': Bluff,
  'categories': Categories,
  'the-vote': TheVote,
  'one-word': OneWord,
};

export default function SessionPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuthContext();
  const {
    session,
    loading,
    markSafe,
    startNextGame,
    updateCurrentGame,
    finishGame,
    endSession,
  } = useSession(sessionId);
  const { group } = useGroupById(session?.groupId);

  const currentGame = useMemo(() => {
    if (!session || session.currentGameIndex < 0) return null;
    return session.games[session.currentGameIndex] || null;
  }, [session]);

  const gameDef = useMemo(() => {
    if (!currentGame) return null;
    return GAME_DEFINITIONS[currentGame.type];
  }, [currentGame]);

  const players = useMemo(() => {
    return group?.memberProfiles || {};
  }, [group]);

  const handleMarkSafe = useCallback(() => {
    if (profile) markSafe(profile.uid);
  }, [profile, markSafe]);

  const allSafe = useMemo(() => {
    if (!session || !group) return false;
    return group.members.every((m) => session.safeMembers.includes(m));
  }, [session, group]);

  const handleAdvancePhase = useCallback(async () => {
    if (!currentGame) return;
    const phases = ['intro', 'rules', 'playing', 'results'] as const;
    const currentIdx = phases.indexOf(currentGame.phase);
    if (currentIdx < phases.length - 1) {
      await updateCurrentGame({ phase: phases[currentIdx + 1] });
    }
  }, [currentGame, updateCurrentGame]);

  const handleFinishGame = useCallback(
    async (scores: Record<string, number>) => {
      await finishGame(scores);
    },
    [finishGame]
  );

  const handleNextGame = useCallback(async () => {
    if (!session || !group) return;
    const playedTypes = session.games.map((g) => g.type);
    await startNextGame(group.members.length, playedTypes);
  }, [session, group, startNextGame]);

  const handleEnd = useCallback(async () => {
    await endSession();
    navigate('/');
  }, [endSession, navigate]);

  if (loading || !session) {
    return (
      <div className="page items-center justify-center">
        <p className="text-shelter-muted text-lg">טוען משחק...</p>
      </div>
    );
  }

  if (session.status === 'ended') {
    return (
      <Scoreboard
        scores={session.scores}
        players={players}
        title="סיכום המשחק"
        onContinue={() => navigate('/')}
        continueLabel="חזרה הביתה"
      />
    );
  }

  if (!allSafe) {
    return (
      <SafetyCheck
        members={group?.members || []}
        memberProfiles={players}
        safeMembers={session.safeMembers}
        currentUserId={profile!.uid}
        isSafe={session.safeMembers.includes(profile!.uid)}
        onMarkSafe={handleMarkSafe}
      />
    );
  }

  if (session.currentGameIndex < 0 || !currentGame) {
    return (
      <div className="page items-center justify-center gap-6">
        <div className="text-6xl">🎮</div>
        <h2 className="text-2xl font-bold">כולם במקלט!</h2>
        <p className="text-shelter-muted text-center">כל החברים בקבוצה במקום בטוח. מוכנים?</p>
        <button onClick={handleNextGame} className="btn-primary text-xl">
          התחלת משחק ראשון 🎲
        </button>
      </div>
    );
  }

  if (currentGame.phase === 'intro' && gameDef) {
    return <GameIntro game={gameDef} onDone={handleAdvancePhase} />;
  }

  if (currentGame.phase === 'rules' && gameDef) {
    return <GameRules game={gameDef} onReady={handleAdvancePhase} />;
  }

  if (currentGame.phase === 'results') {
    return (
      <Scoreboard
        scores={currentGame.scores}
        players={players}
        title={`${gameDef?.emoji} תוצאות ${gameDef?.nameHe}`}
        onContinue={handleNextGame}
        continueLabel="משחק הבא 🎲"
      />
    );
  }

  if (currentGame.phase === 'playing') {
    const GameComponent = GAME_COMPONENTS[currentGame.type];
    return (
      <GameComponent
        session={session}
        game={currentGame}
        players={players}
        currentUserId={profile!.uid}
        onUpdateGame={updateCurrentGame}
        onUpdatePlayerData={async (playerId, data) => {
          const updatedPlayerData = {
            ...currentGame.playerData,
            [playerId]: { ...currentGame.playerData[playerId], ...data },
          };
          await updateCurrentGame({ playerData: updatedPlayerData });
        }}
        onFinishGame={handleFinishGame}
      />
    );
  }

  return null;
}
