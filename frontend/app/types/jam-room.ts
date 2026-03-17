export interface JamRoom {
  id: string;
  name: string;
  description?: string;
  hostId: string;
  host?: {
    id: string;
    username: string;
    displayName?: string;
    avatarUrl?: string;
  };
  tabId?: string;
  maxParticipants: number;
  currentParticipants: number;
  isActive: boolean;
  isPrivate: boolean;
  bpm: number;
  createdAt: string;
  updatedAt: string;
}

export interface JamParticipant {
  id: string;
  roomId: string;
  userId: string;
  user?: {
    id: string;
    username: string;
    displayName?: string;
    avatarUrl?: string;
  };
  socketId?: string;
  isMuted: boolean;
  volume: number;
  isConnected: boolean;
  joinedAt: string;
}

export interface CreateJamRoomDto {
  name: string;
  description?: string;
  tabId?: string;
  maxParticipants?: number;
  isPrivate?: boolean;
  password?: string;
  bpm?: number;
}

export interface JoinJamRoomDto {
  password?: string;
}
