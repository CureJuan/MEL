import { ApiProperty } from '@nestjs/swagger';
import {
  ActivityParticipationProfileDTO,
  AgeGroupCountDTO,
  InputDataDTO,
} from './activityParticipationProfile.dto';

export class AddParticipantInfoDTO {
  @ApiProperty()
  methodOfEnrollmentInActivity: string;

  @ApiProperty()
  methodOfFillingExitSurvey: string;

  @ApiProperty()
  participantProfileActivityParticipation: ActivityParticipationProfileDTO;

  @ApiProperty()
  participantProfileAge: AgeGroupCountDTO;

  @ApiProperty()
  participantProfileCountry: number;

  @ApiProperty()
  participantProfileRegion: InputDataDTO[];

  @ApiProperty()
  participantProfileInstitutionalAffiliation: InputDataDTO[];

  @ApiProperty()
  participantProfileCapnetAffiliation: number;

  @ApiProperty()
  degreeOfKnowledgeBeforeParticipating: InputDataDTO[];

  @ApiProperty()
  degreeOfKnowledgeAfterParticipating: InputDataDTO[];

  @ApiProperty()
  benefitOnOverallLearningObjective: InputDataDTO[];

  @ApiProperty()
  relevanceInSustainableWaterResourceManagement: InputDataDTO[];

  @ApiProperty()
  levelOfExpectationsMet: InputDataDTO[];

  @ApiProperty()
  knowledgeApplication: InputDataDTO[];
}
