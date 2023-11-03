import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ObjectiveLevel } from '../enum/objectiveLevel.enum';

export class AddResultDTO {
  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @IsString()
  @MinLength(5)
  @MaxLength(100)
  @ApiProperty()
  resultName: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  resultCode: string;

  @IsNotEmpty()
  @IsString()
  @IsEnum(ObjectiveLevel)
  @ApiProperty()
  objectiveLevel: string;
}
