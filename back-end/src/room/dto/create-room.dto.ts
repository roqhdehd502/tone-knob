import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateRoomDto {
  @IsString()
  name!: string;

  @IsInt()
  @Min(30)
  @Max(300)
  bpm!: number;

  @IsOptional()
  @IsString()
  key?: string;

  @IsOptional()
  @IsString()
  time_signature?: string;

  @IsOptional()
  @IsIn(['metronome', 'free'])
  sync_mode?: 'metronome' | 'free';

  @IsOptional()
  @IsBoolean()
  is_public?: boolean;
}
