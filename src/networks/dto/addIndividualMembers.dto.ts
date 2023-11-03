import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Types } from 'mongoose';
import { TitleEnum } from '../enum/title.enum';
import { AddMembersDto } from './members.dto';

export class AddIndividualMembersDto extends AddMembersDto {
  @IsOptional()
  @ApiProperty()
  individualMemberId: string;

  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(20)
  @ApiProperty()
  name: string;

  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(20)
  @ApiProperty()
  lastName: string;

  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @IsEnum(TitleEnum)
  @ApiProperty()
  title: string;

  @IsNotEmpty()
  @ApiProperty()
  genderId: Types.ObjectId;

  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @IsEmail()
  @ApiProperty()
  email: string;

  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @ApiProperty()
  availabilityAsTrainer: string;
}
