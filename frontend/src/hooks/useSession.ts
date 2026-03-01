import { useState, useEffect, useCallback } from 'react';
import { store } from '../lib/store';
import { Session, GameInstance, GameType } from '../lib/types';

export function useSession(sessionId: string | undefined) {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    if (!sessionId) { setSession(null); return; }
    setSession(store.getSession(sessionId));
    store.fetchSession(sessionId);
    return store.subscribe(() => setSession(store.getSession(sessionId)));
  }, [sessionId]);

  const markSafe = useCallback((uid: string) => {
    if (sessionId) store.markSafe(sessionId);
  }, [sessionId]);

  const startNextGame = useCallback((playerCount: number, playedGames: GameType[] = []) => {
    if (sessionId) store.startNextGame(sessionId, playerCount, playedGames);
  }, [sessionId]);

  const updateCurrentGame = useCallback((updates: Partial<GameInstance>) => {
    if (sessionId) store.updateCurrentGame(sessionId, updates);
  }, [sessionId]);

  const finishGame = useCallback((gameScores: Record<string, number>) => {
    if (sessionId) store.finishGame(sessionId, gameScores);
  }, [sessionId]);

  const endSession = useCallback(() => {
    if (sessionId) store.endSession(sessionId);
  }, [sessionId]);

  return { session, loading: false, markSafe, startNextGame, updateCurrentGame, finishGame, endSession };
}

export async function createSession(group: { id: string }): Promise<string> {
  return store.createSession(group.id);
}
