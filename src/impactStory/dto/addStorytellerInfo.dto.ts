import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsBoolean,
  IsOptional,
  MinLength,
  MaxLength,
  IsEmail,
} from 'class-validator';
import { Types } from 'mongoose';

export class AddStorytellerInfoDTO {
  @IsNotEmpty()
  @IsBoolean()
  @ApiProperty()
  isParticipantAStoryteller: boolean;

  @Transform(({ value }) => value.trim())
  @IsOptional()
  @ApiProperty()
  storyTellerContactedMedium: string;

  @Transform(({ value }) => value.trim())
  @IsOptional()
  @ApiProperty()
  otherContactMedium: string;

  @IsOptional()
  @IsBoolean()
  @ApiProperty()
  hasGivenConsent: boolean;

  @IsOptional()
  @IsBoolean()
  @ApiProperty()
  isAnonymous: boolean;

  @Transform(({ value }) => value.trim())
  @IsOptional()
  @MinLength(5)
  @MaxLength(100)
  @ApiProperty()
  storyTellerFirstName: string;

  @Transform(({ value }) => value.trim())
  @IsOptional()
  @MinLength(5)
  @MaxLength(100)
  @ApiProperty()
  storyTellerLastName: string;

  @Transform(({ value }) => value.trim())
  @IsOptional()
  @IsEmail()
  @MinLength(5)
  @MaxLength(30)
  @ApiProperty()
  storyTellerEmail: string;

  @IsOptional()
  @ApiProperty()
  storyTellerGenderId: Types.ObjectId;

  @Transform(({ value }) => value.trim())
  @IsOptional()
  @ApiProperty()
  storyTellerGenderPronounPreference: string;

  @Transform(({ value }) => value.trim())
  @IsOptional()
  @ApiProperty()
  otherGenderPronounPreference: string;

  @IsOptional()
  @ApiProperty()
  storyTellerAgeGroupId: Types.ObjectId;

  @Transform(({ value }) => value.trim())
  @IsOptional()
  @MinLength(5)
  @MaxLength(100)
  @ApiProperty()
  nationality: string;

  @IsOptional()
  @ApiProperty()
  typeOfInstitutionId: Types.ObjectId;

  @Transform(({ value }) => value.trim())
  @IsOptional()
  @MinLength(5)
  @MaxLength(100)
  @ApiProperty()
  nameOfInstitution: string;

  @Transform(({ value }) => value.trim())
  @IsOptional()
  @MinLength(5)
  @MaxLength(100)
  @ApiProperty()
  positionInInstitution: string;

  @IsOptional()
  @IsBoolean()
  @ApiProperty()
  isNetworkMember: boolean;

  @IsOptional()
  @ApiProperty()
  affiliatedNetworkId: Types.ObjectId;
}
