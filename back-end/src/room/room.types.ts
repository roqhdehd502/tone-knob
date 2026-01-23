export type RoomParticipant = {
  userId: string;
  email: string;
  role: 'host' | 'player';
};

export type Room = {
  id: string;
  name: string;
  hostId: string;
  bpm: number;
  key?: string;
  timeSignature?: string;
  syncMode: 'metronome' | 'free';
  isPublic: boolean;
  maxParticipants: number;
  createdAt: number;
  participants: Map<string, RoomParticipant>;
};
