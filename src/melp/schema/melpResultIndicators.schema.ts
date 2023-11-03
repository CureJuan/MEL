import { Schema, SchemaFactory, Prop } from '@nestjs/mongoose';
import { SchemaTypes, Types } from 'mongoose';
import { Base } from '../../common/schema/base.schema';

@Schema({
  timestamps: true,
})
export class MelpResultIndicators extends Base {
  @Prop({ required: true })
  indicatorId: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'MelpResults' })
  resultId: Types.ObjectId;

  @Prop({ required: true })
  indicatorName: string;

  @Prop({ required: true })
  definition: string;

  @Prop({ required: true })
  indicatorCode: string;

  @Prop({ required: true })
  measurementUnit: string;

  @Prop({ required: true })
  cumulativeTarget: string;

  @Prop({ required: true })
  completionYear: number;

  @Prop({ required: true })
  sourceOfData: string;

  @Prop({ required: true })
  collectionMethodType: string;

  @Prop({ required: true })
  collectionMethodName: string;

  @Prop({ required: true })
  collectionFrequencyType: string;

  @Prop()
  collectionFrequencyName: string;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ default: Date.now })
  createdAt?: Date;

  @Prop({ default: Date.now })
  updatedAt?: Date;
}

export const MelpResultIndicatorsSchema =
  SchemaFactory.createForClass(MelpResultIndicators);
