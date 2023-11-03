import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class CreateMelpSRFDTO {
  @IsNotEmpty()
  @ApiProperty()
  melpCode: string;

  @IsNotEmpty()
  @IsNumber()
  @ApiProperty()
  year: number;
}
