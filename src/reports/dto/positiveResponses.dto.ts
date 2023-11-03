import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty } from 'class-validator';
import { GenderCountDTO } from './activityParticipationProfile.dto';

export class PositiveResponsesDTO {
  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @ApiProperty()
  knowledgeSharedParticipants: GenderCountDTO;

  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @ApiProperty()
  knowledgeAppliedParticipants: GenderCountDTO;

  @IsNotEmpty()
  @ApiProperty()
  institutionalChangeParticipants: GenderCountDTO;
}
