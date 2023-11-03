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
import { AddProgressMarkerDTO } from './addProgressMarker.dto';

export class CreateMelpOMDTO {
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  outcomeCode: string;

  @Transform(({ value }) => value.trim())
  @MinLength(5)
  @MaxLength(100)
  @IsString()
  @ApiProperty()
  outcomeChallenge: string;

  @IsArray()
  @ArrayMinSize(1)
  @ApiProperty()
  boundaryPartners: string[];

  @IsNumber()
  @ApiProperty()
  progressMarkerCount: number;

  @IsArray()
  @ArrayMinSize(1)
  @ApiProperty()
  progressMarkers: AddProgressMarkerDTO[];
}
