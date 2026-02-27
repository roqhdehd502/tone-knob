import {
  IsString,
  IsOptional,
  IsBoolean,
  IsObject,
  MaxLength,
} from 'class-validator';

export class CreateTabDto {
  @IsString()
  @MaxLength(200)
  title: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  artist?: string;

  @IsObject()
  content: Record<string, unknown>;

  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;
}
