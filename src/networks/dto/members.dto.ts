import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsNotEmpty,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Types } from 'mongoose';
import { Base } from '../../common/schema/base.schema';

export class AddMembersDto extends Base {
  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @ApiProperty()
  countryId: Types.ObjectId;

  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(500)
  @ApiProperty()
  institution: string;

  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @ApiProperty()
  typeOfInstitutionId: Types.ObjectId;

  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @ApiProperty()
  contactNumber: number;

  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @ApiProperty()
  startYearOfMembership: number;

  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @ApiProperty()
  mainExpertise: string;

  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @IsArray()
  @ArrayMaxSize(2)
  @ApiProperty()
  secondaryExpertise: string[];

  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @ApiProperty()
  scopeOfwork: string;
}
