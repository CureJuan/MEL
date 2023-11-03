import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ActivateOrDeactivateNetworkDTO {
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  action: string;

  @IsNotEmpty()
  @ApiProperty()
  networkId: string; // uuid
}
