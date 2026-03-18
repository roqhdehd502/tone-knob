import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({
    description: '평점 (1~5)',
    example: 5,
    minimum: 1,
    maximum: 5,
  })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional({
    description: '리뷰 내용',
    maxLength: 2000,
    example: '잘 만든 타브입니다!',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  content?: string;
}
