import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsOptional, IsString, Matches, MaxLength, MinLength } from "class-validator";

export class LoginDto {
  @ApiProperty({ description: "가입 시 사용한 이메일", example: "user@example.com" })
  @IsEmail()
  email: string;

  @ApiProperty({ description: "비밀번호 (8자 이상)", example: "password1234", minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;
}

export class RegisterDto {
  @ApiProperty({ description: "로그인에 사용할 이메일 (중복 불가)", example: "user@example.com" })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: "닉네임 — 영문/숫자/밑줄(_)만 허용, 3~50자, 중복 불가",
    example: "tone_knob_user",
    minLength: 3,
    maxLength: 50,
  })
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: "username은 영문, 숫자, 밑줄만 사용할 수 있습니다",
  })
  username: string;

  @ApiProperty({
    description: "비밀번호 (8~100자)",
    example: "password1234",
    minLength: 8,
    maxLength: 100,
  })
  @IsString()
  @MinLength(8)
  @MaxLength(100)
  password: string;

  @ApiProperty({
    description: "화면에 표시될 이름 (선택, 미입력 시 username 사용)",
    example: "톤놉",
    required: false,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  displayName?: string;
}

export class RefreshTokenDto {
  @ApiProperty({ description: "로그인/회원가입 시 발급받은 리프레시 토큰 (7일 유효)" })
  @IsString()
  refreshToken: string;
}

export interface AuthTokensResponse {
  accessToken: string;
  refreshToken: string;
}
