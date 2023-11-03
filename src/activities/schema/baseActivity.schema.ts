import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTypes, Types } from 'mongoose';
import { Base } from '../../common/schema/base.schema';

@Schema({
  timestamps: true,
})
export class BaseActivity extends Base {
  @Prop()
  year: number;

  @Prop()
  activityCode: string;

  @Prop()
  activityName: string;

  @Prop()
  focalPersonName: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'MelpResults' })
  resultId: Types.ObjectId;

  @Prop({ type: [SchemaTypes.ObjectId], ref: 'MelpResultIndicators' })
  indicatorId: Types.ObjectId[];

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Network' })
  networkId: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Partner' })
  partnerId: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'ActivityThematicAreas' })
  thematicAreaId: Types.ObjectId;

  @Prop({ default: '' })
  otherThematicArea: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'ActivityType' })
  activityTypeId: Types.ObjectId;

  @Prop({})
  activityTypeName: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'ActivityScope' })
  activityScopeId: Types.ObjectId;

  @Prop()
  otherActivityScope: string;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ default: Date.now })
  createdAt?: Date;

  @Prop({ default: Date.now })
  updatedAt?: Date;

  @Prop({ default: false })
  isOutputReportSubmitted: boolean;
}

export const BaseActivitySchema = SchemaFactory.createForClass(BaseActivity);
