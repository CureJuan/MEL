import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import { GenderCountDTO } from './activityParticipationProfile.dto';

export class KnowledgeAppliedByGenderDTO {
  @IsNotEmpty()
  @ApiProperty()
  raisingAwareness: GenderCountDTO;

  @IsNotEmpty()
  @ApiProperty()
  knowledgeInRoutineWork: GenderCountDTO;

  @IsNotEmpty()
  @ApiProperty()
  knowledgeInEducation: GenderCountDTO;

  @IsNotEmpty()
  @ApiProperty()
  waterProjectImplementation: GenderCountDTO;

  @IsNotEmpty()
  @ApiProperty()
  techInnovation: GenderCountDTO;

  @IsNotEmpty()
  @ApiProperty()
  achieveSGD: GenderCountDTO;

  @IsNotEmpty()
  @ApiProperty()
  formulatingWaterPolicy: GenderCountDTO;
}
