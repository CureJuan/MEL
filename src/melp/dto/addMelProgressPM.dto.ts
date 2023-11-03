import { ApiProperty } from '@nestjs/swagger';
import { IsArray } from 'class-validator';

export class AddMelProgressPMDTO {
  @IsArray()
  @ApiProperty()
  progressMarkerMonitorings: ProgressMarkerMonitorings[];
}

interface ProgressMarkerMonitorings {
  progressMarkersId: string;
  progressMonitoringQ2: string;
  progressMonitoringQ4: string;
  descriptionOfChange: string;
  contributingFactors: string;
  sourceOfEvidence: string;
  unintendedChanges: string;
}
