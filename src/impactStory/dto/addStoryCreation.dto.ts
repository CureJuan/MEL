import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional } from 'class-validator';

export class AddStoryCreationDTO {
  @Transform(({ value }) => value.trim())
  @IsOptional()
  @ApiProperty()
  angle: string;

  @Transform(({ value }) => value.trim())
  @IsOptional()
  @ApiProperty()
  title: string;

  @Transform(({ value }) => value.trim())
  @IsOptional()
  @ApiProperty()
  outline: string;

  @Transform(({ value }) => value.trim())
  @IsOptional()
  @ApiProperty()
  storyDraft: string;

  @Transform(({ value }) => value.trim())
  @IsOptional()
  @ApiProperty()
  storyHighlight: string;

  @Transform(({ value }) => value.trim())
  @IsOptional()
  @ApiProperty()
  storyQuote: string;

  @Transform(({ value }) => value.trim())
  @IsOptional()
  @ApiProperty()
  dynamicMaterial: string;

  @Transform(({ value }) => value.trim())
  @IsOptional()
  @ApiProperty()
  publishWhere: string;

  @Transform(({ value }) => value.trim())
  @IsOptional()
  @ApiProperty()
  publishWhen: string;
}
