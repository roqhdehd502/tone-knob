import { ApiProperty } from '@nestjs/swagger';

import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateRoleDto {
  @ApiProperty({ description: '변경할 역할', example: 'admin' })
  @IsString()
  @IsNotEmpty()
  role: string;
}
