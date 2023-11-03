import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SchemaTypes, Types, Document } from 'mongoose';

@Schema()
export class MelpTaskDetails extends Document {
  @Prop({ required: true })
  taskDetailsId: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'MelpTasks' })
  melpTaskId: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Melp' })
  melpId: Types.ObjectId;

  @Prop({ required: true })
  role: string;

  @Prop({ required: true })
  cost: number;
}

export const MelpTaskDetailsSchema =
  SchemaFactory.createForClass(MelpTaskDetails);
