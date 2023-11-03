import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  MaxLength,
  MinLength,
  IsString,
  IsNumber,
} from 'class-validator';
import { Schema } from 'mongoose';

export class AddMelTaskDetailsDTO {
  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @IsString()
  @MinLength(5)
  @MaxLength(100)
  @ApiProperty()
  role: string;

  @IsNotEmpty()
  @IsNumber()
  @ApiProperty()
  cost: number;

  @IsOptional()
  @ApiProperty()
  melpTaskId: Schema.Types.ObjectId;
}
