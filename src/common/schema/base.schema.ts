import { Prop } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';

export class Base extends Document {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', default: null })
  createdBy: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'User', default: null })
  updatedBy: Types.ObjectId;

  @Prop({ default: Date.now })
  createdAt?: Date;

  @Prop({ default: Date.now })
  updatedAt?: Date;
}
