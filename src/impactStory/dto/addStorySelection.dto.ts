import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsOptional,
  IsBoolean,
  IsArray,
} from 'class-validator';
import { FileUploadDTO } from '../../reports/schema/outputReport.schema';

export class AddStorySelectionDTO {
  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(500)
  @ApiProperty()
  informationSignificance: string;

  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(500)
  @ApiProperty()
  missingInformation: string;

  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(500)
  @ApiProperty()
  nextActions: string;

  @Transform(({ value }) => value.trim())
  @IsOptional()
  @MinLength(1)
  @MaxLength(500)
  @ApiProperty()
  additionalComments: string;

  @IsNotEmpty()
  @IsBoolean()
  @ApiProperty()
  hasStoryOfChange: boolean;

  // doc file
  @IsOptional()
  @ApiProperty()
  storyOfChangeDraft: FileUploadDTO;

  // file uploads
  @IsArray()
  @IsNotEmpty()
  @ApiProperty()
  linksToSourcesOfInformation: FileUploadDTO[];
}
