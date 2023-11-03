import { IsArray, IsNotEmpty } from 'class-validator';
import { Types } from 'mongoose';

export class AddMelProgressDTO {
  @IsArray()
  indicatorMonitorings: IndicatorMonitorings[];

  @IsArray()
  progressMarkerMonitorings: ProgressMarkerMonitorings[];

  @IsNotEmpty()
  updatedBy: Types.ObjectId;
}

interface IndicatorMonitorings {
  indicatorMonitoringId: string;
  baseline: string;
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
