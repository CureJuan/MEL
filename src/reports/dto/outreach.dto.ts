import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty } from 'class-validator';
import { GenderCountDTO } from './activityParticipationProfile.dto';

export class OutreachDTO {
  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @ApiProperty()
  enrolledParticipants: GenderCountDTO;

  @Transform(({ value }) => value.trim())
  @IsNotEmpty()
  @ApiProperty()
  participantReached: GenderCountDTO;

  @IsNotEmpty()
  @ApiProperty()
  participantRespondedToOutcomeSurvey: GenderCountDTO;
}
