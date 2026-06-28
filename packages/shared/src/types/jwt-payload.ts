import { UserRole } from "./enums";

export interface JwtPayload {
  sub: string;
  email: string;
  role?: UserRole;
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload extends JwtPayload {
  tokenVersion?: number;
}
