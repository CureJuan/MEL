import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTypes, Types } from 'mongoose';
import { Base } from '../../common/schema/base.schema';

@Schema({
  timestamps: true,
})
export class MelpOutcomes extends Base {
  @Prop({ required: true })
  outcomeId: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Melp' })
  melpId: Types.ObjectId;

  @Prop({ required: true })
  outcomeCode: string;

  @Prop({ required: true })
  outcomeChallenge: string;

  @Prop({ required: true })
  boundaryPartners: string[];

  @Prop()
  progressMarkerCount: number;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ default: Date.now })
  createdAt?: Date;

  @Prop({ default: Date.now })
  updatedAt?: Date;
}

export const MelpOutcomesSchema = SchemaFactory.createForClass(MelpOutcomes);
