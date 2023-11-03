import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsArray,
  IsOptional,
  ArrayMinSize,
} from 'class-validator';
import { Types } from 'mongoose';
import {
  BoundaryLevelOfChange,
  ObjectArray,
  ThematicAreaOfChange,
  TypeOfChange,
} from '../schema/impactStory.schema';

export class AddStoryInfoDTO {
  @IsNotEmpty()
  // @IsDateString()
  @ApiProperty()
  year: string;

  @IsNotEmpty()
  @ApiProperty()
  impactStoryCode: string;

  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(100)
  @ApiProperty()
  storyTitle: string;

  //focal person - userId
  @IsNotEmpty()
  @ApiProperty()
  focalPersonId: Types.ObjectId;

  @IsNotEmpty()
  @IsArray()
  @ArrayMinSize(1)
  @ApiProperty()
  proposalId: Types.ObjectId[];

  @IsNotEmpty()
  @IsArray()
  @ArrayMinSize(1)
  @ApiProperty()
  proposalList: ObjectArray[];

  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(100)
  @ApiProperty()
  informationCollectionMedium: string;

  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(100)
  @ApiProperty()
  whatChangeObserved: string;

  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(100)
  @ApiProperty()
  capnetInfluenceOnChange: string;

  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(100)
  @ApiProperty()
  effectOnInstitution: string;

  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(100)
  @ApiProperty()
  significantChange: string;

  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(100)
  @ApiProperty()
  howChangeWasOccured: string;

  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(100)
  @ApiProperty()
  changeOccuredPeriod: string;

  @IsArray()
  @ApiProperty()
  typeOfChange: TypeOfChange[];

  @Transform(({ value }) => value.trim())
  @IsOptional()
  @MinLength(5)
  @MaxLength(50)
  @ApiProperty()
  otherTypeOfChange: string;

  @IsNotEmpty()
  @IsArray()
  @ArrayMinSize(1)
  @ApiProperty()
  indicatorId: Types.ObjectId[];

  @IsNotEmpty()
  @IsArray()
  @ArrayMinSize(1)
  @ApiProperty()
  indicatorList: ObjectArray[];

  @IsArray()
  @ApiProperty()
  boundaryLevelOfChange: BoundaryLevelOfChange[];

  @Transform(({ value }) => value.trim())
  @IsOptional()
  @MinLength(5)
  @MaxLength(50)
  @ApiProperty()
  otherBoundaryLevelOfChange: string;

  @IsArray()
  @ApiProperty()
  thematicAreaOfChange: ThematicAreaOfChange[];

  @Transform(({ value }) => value.trim())
  @IsOptional()
  @MinLength(5)
  @MaxLength(50)
  @ApiProperty()
  otherThematicAreaOfChange: string;

  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(100)
  @ApiProperty()
  keyPartners: string;
}
