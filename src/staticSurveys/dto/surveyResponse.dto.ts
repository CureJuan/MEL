import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Types } from 'mongoose';

export class SurveyResponseDTO {
  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @IsEmail()
  @ApiProperty()
  email: string;

  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(30)
  @IsString()
  @ApiProperty()
  firstName: string;

  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(30)
  @IsString()
  @ApiProperty()
  lastName: string;

  @IsNotEmpty()
  @ApiProperty()
  genderId: Types.ObjectId;

  @IsNotEmpty()
  @ApiProperty()
  ageGroupId: Types.ObjectId;
}
