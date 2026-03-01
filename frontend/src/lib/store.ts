import { io, Socket } from 'socket.io-client';
import { Group, Session, UserProfile, GameInstance, GameType } from './types';
import { pickRandomGame } from './gameDefinitions';

type Listener = () => void;

function getStoredUid(): string {
  let uid = localStorage.getItem('shelter-uid');
  if (!uid) {
    uid = 'u-' + Math.random().toString(36).slice(2, 10);
    localStorage.setItem('shelter-uid', uid);
  }
  return uid;
}

function loadSavedProfile(): UserProfile | null {
  try {
    const raw = localStorage.getItem('shelter-profile');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

class NetworkStore {
  private socket: Socket;
  private _profile: UserProfile | null = null;
  private _groups = new Map<string, Group>();
  private _sessions = new Map<string, Session>();
  private listeners = new Set<Listener>();
  private _connected = false;
  private _ready = false;

  constructor() {
    this._profile = loadSavedProfile();

    this.socket = io({ reconnection: true, reconnectionDelay: 1000 });

    this.socket.on('connect', () => {
      this._connected = true;
      const saved = loadSavedProfile();
      if (saved) {
        this.socket.emit('reconnect-register', { uid: saved.uid }, (res: any) => {
          if (res.error) {
            this.socket.emit('register',
              { uid: saved.uid, name: saved.name, city: saved.city, avatar: saved.avatar },
              (r2: any) => { this.handleRegistered(r2); }
            );
          } else {
            this.handleRegistered(res);
          }
        });
      } else {
        this._ready = true;
        this.notify();
      }
    });

    this.socket.on('disconnect', () => {
      this._connected = false;
      this.notify();
    });

    this.socket.on('groupUpdated', (g: Group) => {
      this._groups.set(g.id, g);
      this.notify();
    });

    this.socket.on('sessionUpdated', (s: Session) => {
      this._sessions.set(s.id, s);
      this.notify();
    });
  }

  private handleRegistered(res: any) {
    if (res.profile) {
      this._profile = res.profile;
      localStorage.setItem('shelter-profile', JSON.stringify(res.profile));
      this._groups.clear();
      for (const g of (res.groups || [])) this._groups.set(g.id, g);
    }
    this._ready = true;
    this.notify();
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  }

  private notify() { this.listeners.forEach(l => l()); }

  get connected() { return this._connected; }
  get ready() { return this._ready || !loadSavedProfile(); }

  getProfile(): UserProfile | null { return this._profile; }

  createProfile(name: string, city: string, avatar: string): Promise<UserProfile> {
    return new Promise((resolve, reject) => {
      const uid = getStoredUid();
      this.socket.emit('register', { uid, name, city, avatar }, (res: any) => {
        if (res.error) return reject(new Error(res.error));
        this._profile = res.profile;
        localStorage.setItem('shelter-profile', JSON.stringify(res.profile));
        this._groups.clear();
        for (const g of (res.groups || [])) this._groups.set(g.id, g);
        this._ready = true;
        this.notify();
        resolve(res.profile);
      });
    });
  }

  logout() {
    this._profile = null;
    this._groups.clear();
    this._sessions.clear();
    localStorage.removeItem('shelter-profile');
    localStorage.removeItem('shelter-uid');
    this.notify();
  }

  getGroups(): Group[] {
    if (!this._profile) return [];
    return this._profile.groupIds.map(id => this._groups.get(id)).filter(Boolean) as Group[];
  }

  getGroup(id: string): Group | null {
    return this._groups.get(id) || null;
  }

  fetchGroup(groupId: string): Promise<Group | null> {
    return new Promise(resolve => {
      this.socket.emit('getGroup', { groupId }, (res: any) => {
        if (res.group) { this._groups.set(res.group.id, res.group); this.notify(); }
        resolve(res.group || null);
      });
    });
  }

  createGroup(name: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.socket.emit('createGroup', { name }, (res: any) => {
        if (res.error) return reject(new Error(res.error));
        const group = res.group;
        this._groups.set(group.id, group);
        if (this._profile) {
          if (!this._profile.groupIds.includes(group.id)) {
            this._profile = { ...this._profile, groupIds: [...this._profile.groupIds, group.id] };
            localStorage.setItem('shelter-profile', JSON.stringify(this._profile));
          }
        }
        this.notify();
        resolve(group.id);
      });
    });
  }

  joinGroup(code: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.socket.emit('joinGroup', { code }, (res: any) => {
        if (res.error) return reject(new Error(res.error));
        const group = res.group;
        this._groups.set(group.id, group);
        if (this._profile && !this._profile.groupIds.includes(group.id)) {
          this._profile = { ...this._profile, groupIds: [...this._profile.groupIds, group.id] };
          localStorage.setItem('shelter-profile', JSON.stringify(this._profile));
        }
        this.notify();
        resolve(group.id);
      });
    });
  }

  getSession(id: string): Session | null {
    return this._sessions.get(id) || null;
  }

  fetchSession(sessionId: string): Promise<Session | null> {
    return new Promise(resolve => {
      this.socket.emit('getSession', { sessionId }, (res: any) => {
        if (res.session) { this._sessions.set(res.session.id, res.session); this.notify(); }
        resolve(res.session || null);
      });
    });
  }

  createSession(groupId: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.socket.emit('createSession', { groupId }, (res: any) => {
        if (res.error) return reject(new Error(res.error));
        resolve(res.sessionId);
      });
    });
  }

  markSafe(sessionId: string) {
    this.socket.emit('markSafe', { sessionId });
  }

  startNextGame(sessionId: string, playerCount: number, playedGames: GameType[] = []) {
    const gameType = pickRandomGame(playerCount, playedGames);
    const session = this._sessions.get(sessionId);
    const idx = session ? session.currentGameIndex + 1 : 0;
    const game: GameInstance = {
      id: `game-${idx}-${Date.now()}`,
      type: gameType,
      phase: 'intro',
      roundData: {},
      playerData: {},
      scores: {},
    };
    this.socket.emit('startNextGame', { sessionId, game });
  }

  updateCurrentGame(sessionId: string, updates: Partial<GameInstance>) {
    this.socket.emit('updateCurrentGame', { sessionId, updates });
  }

  finishGame(sessionId: string, gameScores: Record<string, number>) {
    this.socket.emit('finishGame', { sessionId, gameScores });
  }

  endSession(sessionId: string) {
    this.socket.emit('endSession', { sessionId });
  }
}

export const store = new NetworkStore();
