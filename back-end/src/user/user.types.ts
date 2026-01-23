export type User = {
  id: string;
  email: string;
  passwordHash: string;
  nickname?: string;
  instrument?: string;
};
