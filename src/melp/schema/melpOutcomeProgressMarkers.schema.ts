import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTypes, Types } from 'mongoose';
import { Base } from '../../common/schema/base.schema';
import { ProgressMonitoring } from '../../common/staticSchema/progressMonitoring.schema';

@Schema({
  timestamps: true,
})
export class MelpOutcomeProgressMarkers extends Base {
  @Prop({ required: true })
  progressMarkersId: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'MelpOutcomes' })
  outcomeId: Types.ObjectId;

  @Prop({ required: true })
  progressMarkerCode: string;

  @Prop({ required: true })
  progressMarker: string;

  @Prop({ required: true, type: SchemaTypes.ObjectId, ref: 'Priority' })
  priorityId: Types.ObjectId;

  @Prop({
    type: SchemaTypes.ObjectId,
    ref: ProgressMonitoring.name,
  })
  progressMonitoringQ2: Types.ObjectId;

  @Prop({
    type: SchemaTypes.ObjectId,
    ref: ProgressMonitoring.name,
  })
  progressMonitoringQ4: Types.ObjectId;

  @Prop({ default: '' })
  descriptionOfChange: string;

  @Prop({ default: '' })
  contributingFactors: string;

  @Prop({ default: '' })
  sourceOfEvidence: string;

  @Prop({ default: '' })
  unintendedChanges: string;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ default: Date.now })
  createdAt?: Date;

  @Prop({ default: Date.now })
  updatedAt?: Date;
}

export const MelpOutcomeProgressMarkersSchema = SchemaFactory.createForClass(
  MelpOutcomeProgressMarkers,
);
