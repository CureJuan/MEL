import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty } from 'class-validator';

export class CreateNetworkDTO {
  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @ApiProperty({
    description: 'example : Network-1',
  })
  networkName: string;

  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @ApiProperty()
  code: string;
}
