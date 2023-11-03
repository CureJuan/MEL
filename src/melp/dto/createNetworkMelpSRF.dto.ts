import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { AddMelTaskDetailsDTO } from './addMelTaskDetail.dto';

export class CreateNetworkMelpSRFDTO {
  @IsNotEmpty()
  @ApiProperty()
  melpCode: string;

  @IsNotEmpty()
  @IsNumber()
  @ApiProperty()
  year: number;

  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @IsString()
  @MinLength(5)
  @MaxLength(1000)
  @ApiProperty()
  scopeAndPurpose: string;

  @IsArray()
  @ArrayMinSize(6)
  @ApiProperty()
  taskDetails: AddMelTaskDetailsDTO[];
}
