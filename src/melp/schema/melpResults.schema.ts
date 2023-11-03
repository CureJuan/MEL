import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTypes, Types } from 'mongoose';
import { Base } from '../../common/schema/base.schema';

@Schema({
  timestamps: true,
})
export class MelpResults extends Base {
  @Prop({ required: true })
  resultId: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Melp' })
  melpId: Types.ObjectId;

  @Prop({ required: true })
  resultName: string;

  @Prop({ required: true })
  objectiveLevel: string;

  // @Prop({ required: true, type:String })
  // objectiveLevel: {
  //   type:String,
  //   enum:[ObjectiveLevel.IMPACT, ObjectiveLevel.OUTCOME, ObjectiveLevel.OUTPUT]
  // }

  @Prop({ required: true })
  resultCode: string;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ default: Date.now })
  createdAt?: Date;

  @Prop({ default: Date.now })
  updatedAt?: Date;
}

export const MelpResultsSchema = SchemaFactory.createForClass(MelpResults);
