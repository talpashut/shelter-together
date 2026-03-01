import { useState, useEffect, useCallback } from 'react';
import { store } from '../lib/store';
import { Group, UserProfile } from '../lib/types';

export function useGroup(profile: UserProfile | null) {
  const [groups, setGroups] = useState<Group[]>(store.getGroups());

  useEffect(() => {
    setGroups(store.getGroups());
    return store.subscribe(() => setGroups(store.getGroups()));
  }, [profile]);

  const createGroup = useCallback(async (name: string): Promise<string> => {
    return store.createGroup(name);
  }, []);

  const joinGroup = useCallback(async (code: string): Promise<string> => {
    return store.joinGroup(code);
  }, []);

  const leaveGroup = useCallback(async (_groupId: string) => {}, []);

  return { groups, loading: false, createGroup, joinGroup, leaveGroup };
}

export function useGroupById(groupId: string | undefined) {
  const [group, setGroup] = useState<Group | null>(null);

  useEffect(() => {
    if (!groupId) { setGroup(null); return; }
    setGroup(store.getGroup(groupId));
    store.fetchGroup(groupId);
    return store.subscribe(() => setGroup(store.getGroup(groupId)));
  }, [groupId]);

  return { group, loading: false };
}
