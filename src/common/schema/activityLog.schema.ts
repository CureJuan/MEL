import { Prop, SchemaFactory, Schema } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';
import { CapnetEnum } from '../enum/capnet.enum';

@Schema()
export class ActivityLog extends Document {
  @Prop({ type: SchemaTypes.ObjectId, ref: 'User' })
  userId: Types.ObjectId;

  @Prop()
  name: string;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Network', default: null })
  networkId: Types.ObjectId;

  @Prop({ type: SchemaTypes.ObjectId, ref: 'Partner', default: null })
  partnerId: Types.ObjectId;

  @Prop({ default: CapnetEnum.CAPNET })
  instituteName: string;

  @Prop()
  description: string;

  @Prop({ default: Date.now })
  timeStamp: Date;
}

export const ActivityLogSchema = SchemaFactory.createForClass(ActivityLog);
