export interface UserProfile {
  uid: string;
  name: string;
  city: string;
  avatar: string;
  groupIds: string[];
  fcmToken?: string;
}

export interface Group {
  id: string;
  name: string;
  code: string;
  members: string[];
  memberProfiles: Record<string, { name: string; avatar: string }>;
  createdBy: string;
  currentSession?: string;
}

export interface Session {
  id: string;
  groupId: string;
  alertId?: string;
  safeMembers: string[];
  currentGameIndex: number;
  games: GameInstance[];
  status: 'waiting' | 'active' | 'ended';
  scores: Record<string, number>;
  createdAt: number;
}

export interface GameInstance {
  id: string;
  type: GameType;
  phase: 'intro' | 'rules' | 'playing' | 'results';
  roundData: any;
  playerData: Record<string, any>;
  scores: Record<string, number>;
  startedAt?: number;
}

export type GameType =
  | 'who-said-it'
  | 'secret-agent'
  | 'draw-and-guess'
  | 'boom-trivia'
  | 'bluff'
  | 'categories'
  | 'the-vote'
  | 'one-word';

export interface GameDefinition {
  type: GameType;
  nameHe: string;
  descriptionHe: string;
  rulesHe: string[];
  emoji: string;
  minPlayers: number;
  maxPlayers: number;
}

export interface SirenAlert {
  id: string;
  type: string;
  cities: string[];
  timestamp: number;
  active: boolean;
}

export interface GameComponentProps {
  session: Session;
  game: GameInstance;
  players: Record<string, { name: string; avatar: string }>;
  currentUserId: string;
  onUpdateGame: (updates: Partial<GameInstance>) => void;
  onUpdatePlayerData: (playerId: string, data: any) => void;
  onFinishGame: (scores: Record<string, number>) => void;
}
