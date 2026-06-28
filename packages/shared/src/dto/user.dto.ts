import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, IsUrl, MaxLength } from "class-validator";

import { SubscriptionTier, UserRole } from "../types/enums";

export class UpdateUserDto {
  @ApiPropertyOptional({ description: "화면에 표시될 이름", example: "톤놉", maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  displayName?: string;

  @ApiPropertyOptional({
    description: "프로필 이미지 URL",
    example: "https://example.com/avatar.png",
  })
  @IsOptional()
  @IsUrl()
  avatarUrl?: string;

  @ApiPropertyOptional({ description: "자기소개", example: "기타리스트입니다.", maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;
}

export interface UserProfileResponse {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  role: UserRole;
  subscriptionTier: SubscriptionTier;
  createdAt: Date;
  updatedAt: Date;
}
