import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ActivateOrDeactivateSurveyLinkDTO {
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  action: string;

  @IsNotEmpty()
  @ApiProperty()
  surveyId: string;
}
